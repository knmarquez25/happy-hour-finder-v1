const assert = require("node:assert/strict");
const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  try {
    const page = await browser.newPage({
      viewport: { width: 390, height: 1000 },
    });
    await page.route("**/src/config.js", (r) =>
      r.fulfill({
        contentType: "text/javascript",
        body: 'export const apiBase="";',
      }),
    );
    await page.route("**/api/status", (r) =>
      r.fulfill({ json: { configured: false } }),
    );
    await page.route("**/api/review-config", (r) =>
      r.fulfill({ json: { configured: false } }),
    );
    await page.route("**/api/reviews", (r) =>
      r.fulfill({ json: { records: [] } }),
    );
    await page.route("**/*", (r) =>
      r.request().resourceType() === "image" ? r.abort() : r.fallback(),
    );
    await page.goto(process.env.PREVIEW_URL || "http://127.0.0.1:4177");
    await page.locator("#results article").first().waitFor();
    assert.equal(
      await page.locator("#results .venue-photo-slot").count(),
      111,
      "Every venue has a consistent photo or branded fallback",
    );
    // Use a stable venue locator: a live :has(.venue-photo) locator moves to
    // another card as soon as the image error handler removes its photo link.
    const card = page.locator('[data-venue-id="33-taps-silver-lake"]');
    await card.scrollIntoViewIfNeeded();
    await card.locator(".venue-placeholder").waitFor({ state: "visible" });
    assert.equal(
      await card.locator(".venue-photo").count(),
      0,
      "Failed photo link is removed, not left as a broken image",
    );
    assert.match(
      await card.locator(".venue-placeholder").innerText(),
      /Photo coming soon/,
    );
    assert.ok(
      await card
        .locator(".venue-photo-slot")
        .evaluate((el) => el.getBoundingClientRect().height >= 100),
      "Fallback preserves the image footprint",
    );
    await card.locator(".venue-menu > summary").click();
    assert.equal(
      await card.locator(".menu-items").isVisible(),
      true,
      "An image failure does not break the menu",
    );
    for (const width of [1280, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `Images and fallbacks fit ${width}px`,
      );
    }
    console.log(
      "Media browser passed: all 111 image slots, blocked-image fallbacks, stable footprint, menu access, and responsive widths.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
