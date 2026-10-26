const assert = require("node:assert/strict");
const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 900 },
    });
    await page.route("**/src/config.js", (r) =>
      r.fulfill({
        contentType: "text/javascript",
        body: 'export const apiBase="";',
      }),
    );
    await page.route("**/api/review-config", (r) =>
      r.fulfill({ json: { configured: false } }),
    );
    await page.route("**/api/reviews", (r) =>
      r.fulfill({ json: { records: [] } }),
    );
    await page.route("**/api/explore", (r) =>
      r.fulfill({ json: { saved: true, candidates: [], records: [] } }),
    );
    await page.route("**/api/discover", async (r) => {
      const { emptyPreferences } = await import("../src/discovery.js");
      await r.fulfill({
        json: {
          preferences: {
            ...emptyPreferences(),
            area: "Downey",
            day: "Monday",
            time: "12:00",
          },
        },
      });
    });
    await page.goto(process.env.PREVIEW_URL || "http://127.0.0.1:4176");
    await page
      .getByLabel("Tell us what you’re looking for")
      .fill("happy hour in Downey noon on Monday");
    await page.getByRole("button", { name: "Find my happy hour" }).click();
    await page.waitForFunction(
      () =>
        document
          .querySelector("#interpretation")
          .textContent.includes("Downey"),
      null,
      { timeout: 5000 },
    );
    assert.match(
      await page.locator("#interpretation").innerText(),
      /Downey.*Monday.*12:00/,
    );
    assert.equal(
      await page.locator("#results article").count(),
      0,
      "Do not substitute other cities or afternoon happy hours",
    );
    assert.equal(await page.locator("#request-error").isVisible(), false);
    assert.match(
      await page.locator("#results").innerText(),
      /No reviewed happy-hour matches in Downey/,
    );
    assert.match(
      await page.locator("#results").innerText(),
      /does not mean no happy hours exist/i,
    );
    await page
      .getByRole("button", { name: "Browse all restaurants", exact: true })
      .click();
    assert.equal(await page.locator("#results article").count(), 111);
    console.log(
      "Downey browser passed: Monday noon stays12:00, valid city produces honest empty result, no geographic error or silent broadening, Browse all restores111.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
