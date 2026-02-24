// app.js
// Plain global JS, no modules.

// -------------------
// Data generator
// -------------------
const TAGS = [
  "Coffee","Hiking","Movies","Live Music","Board Games","Cats","Dogs","Traveler",
  "Foodie","Tech","Art","Runner","Climbing","Books","Yoga","Photography"
];
const FIRST_NAMES = [
  "Alex","Sam","Jordan","Taylor","Casey","Avery","Riley","Morgan","Quinn","Cameron",
  "Jamie","Drew","Parker","Reese","Emerson","Rowan","Shawn","Harper","Skyler","Devon"
];
const CITIES = [
  "Brooklyn","Manhattan","Queens","Jersey City","Hoboken","Astoria",
  "Williamsburg","Bushwick","Harlem","Lower East Side"
];
const JOBS = [
  "Product Designer","Software Engineer","Data Analyst","Barista","Teacher",
  "Photographer","Architect","Chef","Nurse","Marketing Manager","UX Researcher"
];
const BIOS = [
  "Weekend hikes and weekday lattes.",
  "Dog parent. Amateur chef. Karaoke enthusiast.",
  "Trying every taco in the city — for science.",
  "Bookstore browser and movie quote machine.",
  "Gym sometimes, Netflix always.",
  "Looking for the best slice in town.",
  "Will beat you at Mario Kart.",
  "Currently planning the next trip."
];

const UNSPLASH_SEEDS = [
  "1515462277126-2b47b9fa09e6",
  "1520975916090-3105956dac38",
  "1519340241574-2cec6aef0c01",
  "1554151228-14d9def656e4",
  "1548142813-c348350df52b",
  "1517841905240-472988babdf9",
  "1535713875002-d1d0cf377fde",
  "1545996124-0501ebae84d0",
  "1524504388940-b1c1722653e1",
  "1531123897727-8f129e1688ce",
];

function sample(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function pickTags() { return Array.from(new Set(Array.from({length:4}, ()=>sample(TAGS)))); }
function imgFor(seed) {
  return `https://images.unsplash.com/photo-${seed}?auto=format&fit=crop&w=1200&q=80`;
}
function pickPhotos(count = 3) {
  // choose N distinct seeds
  const chosen = new Set();
  while (chosen.size < count) chosen.add(sample(UNSPLASH_SEEDS));
  return Array.from(chosen).map(imgFor);
}

function generateProfiles(count = 12) {
  const profiles = [];
  for (let i = 0; i < count; i++) {
    const photos = pickPhotos(3);
    profiles.push({
      id: `p_${i}_${Date.now().toString(36)}`,
      name: sample(FIRST_NAMES),
      age: 18 + Math.floor(Math.random() * 22),
      city: sample(CITIES),
      title: sample(JOBS),
      bio: sample(BIOS),
      tags: pickTags(),
      photos,          // <-- multiple photos
      photoIndex: 0,   // <-- current photo index
    });
  }
  return profiles;
}

// -------------------
// UI rendering
// -------------------
const deckEl = document.getElementById("deck");
const shuffleBtn = document.getElementById("shuffleBtn");
const likeBtn = document.getElementById("likeBtn");
const nopeBtn = document.getElementById("nopeBtn");
const superLikeBtn = document.getElementById("superLikeBtn");

let profiles = [];

// Gesture tuning
const SWIPE_X_THRESHOLD = 110;     // px
const SWIPE_UP_THRESHOLD = 120;    // px (negative dy)
const ROTATE_MAX_DEG = 12;         // degrees
const DOUBLE_TAP_MS = 320;
const TAP_MOVE_TOLERANCE = 12;     // px

// For double-tap detection
let lastTapTime = 0;
let lastTapX = 0;
let lastTapY = 0;

function getTopCardEl() {
  // Visually top card is the last element (drawn on top)
  return deckEl.querySelector(".card:last-child");
}

function getTopProfile() {
  return profiles[0] || null;
}

function renderDeck() {
  deckEl.setAttribute("aria-busy", "true");
  deckEl.innerHTML = "";

  // Render bottom-to-top (so the first profile is on top logically, but last DOM element draws on top)
  // We want profiles[0] to be "top profile" (next to swipe).
  // So we render in reverse order: last profile first, top profile last.
  for (let idx = profiles.length - 1; idx >= 0; idx--) {
    const p = profiles[idx];

    const card = document.createElement("article");
    card.className = "card";
    card.dataset.profileId = p.id;

    const img = document.createElement("img");
    img.className = "card__media";
    img.src = p.photos[p.photoIndex];
    img.alt = `${p.name} — profile photo`;

    const body = document.createElement("div");
    body.className = "card__body";

    const titleRow = document.createElement("div");
    titleRow.className = "title-row";
    titleRow.innerHTML = `
      <h2 class="card__title">${p.name}</h2>
      <span class="card__age">${p.age}</span>
    `;

    const meta = document.createElement("div");
    meta.className = "card__meta";
    meta.textContent = `${p.title} • ${p.city}`;

    const chips = document.createElement("div");
    chips.className = "card__chips";
    p.tags.forEach((t) => {
      const c = document.createElement("span");
      c.className = "chip";
      c.textContent = t;
      chips.appendChild(c);
    });

    body.appendChild(titleRow);
    body.appendChild(meta);
    body.appendChild(chips);

    card.appendChild(img);
    card.appendChild(body);

    deckEl.appendChild(card);
  }

  deckEl.removeAttribute("aria-busy");
  wireTopCardGestures();
  updateButtonsEnabled();
}

function resetDeck() {
  profiles = generateProfiles(12);
  renderDeck();
}

function updateButtonsEnabled() {
  const hasCard = !!getTopProfile();
  likeBtn.disabled = !hasCard;
  nopeBtn.disabled = !hasCard;
  superLikeBtn.disabled = !hasCard;
}

// -------------------
// Photo navigation (double tap)
// -------------------
function nextPhotoOnTopCard() {
  const top = getTopProfile();
  const topCard = getTopCardEl();
  if (!top || !topCard) return;

  top.photoIndex = (top.photoIndex + 1) % top.photos.length;

  const img = topCard.querySelector(".card__media");
  if (img) {
    img.src = top.photos[top.photoIndex];
  }
}

// -------------------
// Swiping + actions
// -------------------
function commitAction(action) {
  // action: "nope" | "like" | "superlike"
  const top = getTopProfile();
  if (!top) return;

  // You can replace these logs with real state updates / API calls later.
  if (action === "like") console.log("LIKE:", top.name, top.id);
  if (action === "nope") console.log("NOPE:", top.name, top.id);
  if (action === "superlike") console.log("SUPER LIKE:", top.name, top.id);

  // Remove the top profile and re-render
  profiles.shift();
  renderDeck();
}

function animateTopCardOff(action) {
  const card = getTopCardEl();
  if (!card) return;

  // ensure transition is on
  card.classList.remove("is-dragging");

  // Launch direction
  const w = window.innerWidth || 1000;
  const x = action === "like" ? w * 0.9 : action === "nope" ? -w * 0.9 : 0;
  const y = action === "superlike" ? -window.innerHeight * 0.7 : 0;
  const rot = action === "like" ? 18 : action === "nope" ? -18 : 0;

  card.style.transform = `translate(${x}px, ${y}px) rotate(${rot}deg)`;
  card.style.opacity = "0";

  // After animation completes, commit action
  const onDone = () => {
    card.removeEventListener("transitionend", onDone);
    commitAction(action);
  };
  card.addEventListener("transitionend", onDone);
}

function triggerAction(action) {
  // action buttons call this too
  if (!getTopProfile()) return;
  animateTopCardOff(action);
}

// -------------------
// Gesture wiring for top card
// -------------------
function wireTopCardGestures() {
  const card = getTopCardEl();
  if (!card) return;

  // Remove any old handlers by cloning? We'll just set handlers fresh with pointer events.
  // Because we re-render the deck each time, this is safe.

  const img = card.querySelector(".card__media");
  if (!img) return;

  let dragging = false;
  let startX = 0, startY = 0;
  let lastX = 0, lastY = 0;
  let pointerId = null;

  function setTransform(dx, dy) {
    // rotate based on dx relative to card width
    const rect = card.getBoundingClientRect();
    const pct = Math.max(-1, Math.min(1, dx / (rect.width * 0.9)));
    const rot = pct * ROTATE_MAX_DEG;

    // Keep the stack effect from CSS for underlying cards, but for top card we override.
    card.style.transform = `translate(${dx}px, ${dy}px) rotate(${rot}deg)`;
  }

  function resetTransform() {
    card.style.transform = "";
    card.style.opacity = "";
  }

  function isDoubleTap(x, y) {
    const now = Date.now();
    const dt = now - lastTapTime;
    const dist = Math.hypot(x - lastTapX, y - lastTapY);

    // update last tap tracking regardless
    lastTapTime = now;
    lastTapX = x;
    lastTapY = y;

    return dt > 0 && dt <= DOUBLE_TAP_MS && dist <= TAP_MOVE_TOLERANCE;
  }

  // Also support desktop double click
  img.addEventListener("dblclick", (e) => {
    e.preventDefault();
    nextPhotoOnTopCard();
  });

  img.addEventListener("pointerdown", (e) => {
    // left click/touch/pen
    pointerId = e.pointerId;
    img.setPointerCapture(pointerId);

    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    lastX = startX;
    lastY = startY;

    card.classList.add("is-dragging");
  });

  img.addEventListener("pointermove", (e) => {
    if (!dragging || e.pointerId !== pointerId) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    lastX = e.clientX;
    lastY = e.clientY;

    setTransform(dx, dy);
  });

  img.addEventListener("pointerup", (e) => {
    if (e.pointerId !== pointerId) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    dragging = false;
    pointerId = null;
    card.classList.remove("is-dragging");

    const moved = Math.hypot(dx, dy);

    // Double-tap behavior: only when movement is tiny (a "tap", not a drag)
    if (moved <= TAP_MOVE_TOLERANCE) {
      if (isDoubleTap(e.clientX, e.clientY)) {
        resetTransform();
        nextPhotoOnTopCard();
        return;
      }
      // single tap does nothing
      resetTransform();
      return;
    }

    // Decide swipe action
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    // Prefer horizontal swipes unless upward is strong
    if (dx > SWIPE_X_THRESHOLD && absX >= absY) {
      // Swipe right -> Like
      animateTopCardOff("like");
      return;
    }
    if (dx < -SWIPE_X_THRESHOLD && absX >= absY) {
      // Swipe left -> Reject
      animateTopCardOff("nope");
      return;
    }
    if (dy < -SWIPE_UP_THRESHOLD && absY > absX) {
      // Swipe up -> Super like
      animateTopCardOff("superlike");
      return;
    }

    // Not far enough -> snap back
    resetTransform();
  });

  img.addEventListener("pointercancel", () => {
    dragging = false;
    pointerId = null;
    card.classList.remove("is-dragging");
    resetTransform();
  });
}

// -------------------
// Controls (now implemented)
// -------------------
likeBtn.addEventListener("click", () => triggerAction("like"));
nopeBtn.addEventListener("click", () => triggerAction("nope"));
superLikeBtn.addEventListener("click", () => triggerAction("superlike"));
shuffleBtn.addEventListener("click", resetDeck);

// Boot
resetDeck();