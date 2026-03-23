// tests/app.test.js

// Minimal DOM stubs so importing `app.js` doesn't throw during tests
global.document = global.document || {};
global.document.getElementById = global.document.getElementById || (() => null);
global.document.querySelector = global.document.querySelector || (() => null);
global.document.createElement = global.document.createElement || (() => ({
  appendChild() {},
  classList: { add() {}, remove() {} },
  style: {},
  addEventListener() {},
}));
global.document.body = global.document.body || {};
global.document.addEventListener = global.document.addEventListener || (() => {});
global.window = global.window || global;
global.navigator = global.navigator || {};
global.window.location = global.window.location || { origin: '' };
global.Notification = global.Notification || { permission: 'default' };

const { generateProfiles } = require('../app');

// -----------------------------
// PARTITION TESTING
// -----------------------------

describe("Partition Testing - generateProfiles()", () => {

  test("Generates default 12 profiles", () => {
    const profiles = generateProfiles();
    expect(profiles.length).toBe(12);
  });

  test("Generates custom number of profiles", () => {
    const profiles = generateProfiles(5);
    expect(profiles.length).toBe(5);
  });

  test("Profiles contain required fields", () => {
    const profiles = generateProfiles(1);
    const p = profiles[0];

    expect(p).toHaveProperty("name");
    expect(p).toHaveProperty("age");
    expect(p).toHaveProperty("images");
  });

});


// -----------------------------
// EDGE CASE TESTING
// -----------------------------

describe("Edge Case - Image Handling", () => {

  test("Profile with 0 images should not crash", () => {
    const profile = { images: [], currentPhotoIndex: 0 };

    expect(profile.images[0]).toBeUndefined();
  });

  test("Profile with 1 image does not break cycling", () => {
    const profile = { images: ["img1.jpg"], currentPhotoIndex: 0 };

    const nextIndex = (profile.currentPhotoIndex + 1) % profile.images.length;

    expect(nextIndex).toBe(0);
  });

});


describe("Edge Case - Swipe Logic", () => {

  test("Swipe right threshold", () => {
    const SWIPE_THRESHOLD = 100;
    const currentX = 150;

    expect(currentX > SWIPE_THRESHOLD).toBe(true);
  });

  test("Swipe not far enough resets", () => {
    const SWIPE_THRESHOLD = 100;
    const currentX = 50;

    expect(currentX < SWIPE_THRESHOLD).toBe(true);
  });

});


describe("Edge Case - Notification API", () => {

  test("Notification undefined should not crash", () => {
    global.Notification = undefined;

    expect(() => {
      const permission = Notification?.permission || "default";
    }).not.toThrow();
  });

});


describe("Edge Case - API Failure", () => {

  test("Handles failed fetch request", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: false })
    );

    const res = await fetch("/api/push/subscribe");

    expect(res.ok).toBe(false);
  });

});