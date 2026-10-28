const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 1000 },
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.route("**/src/config.js", (r) =>
      r.fulfill({
        contentType: "text/javascript",
        body: 'export const apiBase = "";',
      }),
    );
    await page.route("**/api/status", (r) =>
      r.fulfill({ json: { configured: false } }),
    );
    await page.route("**/api/review-config", (r) =>
      r.fulfill({ json: { configured: false } }),
    );
    await page.route("**/api/reviews", (r) =>
      r.fulfill({
        json: {
          records: [
            {
              id: "11111111-1111-4111-8111-111111111111",
              status: "pending",
              payload: {
                name: "Pending test restaurant",
                location: "Pasadena",
                county: "LA County",
                address: "",
                sourceUrl: "https://example.com/menu",
                evidence: "Happy-hour menu found online; not approved.",
                items: [
                  { name: "House wine", kind: "drink", priceCents: null },
                ],
                hoursText: null,
              },
              review_evidence: [],
            },
          ],
        },
      }),
    );
    await page.goto(process.env.PREVIEW_URL || "http://127.0.0.1:4177");
    await page.locator("#results article").first().waitFor();
    assert.equal(
      await page.locator("h1").innerText(),
      "Where are we unwinding?",
    );
    const joyce = page.locator("#results article").filter({
      has: page.getByRole("heading", { name: "Joyce", exact: true }),
    });
    assert.equal(
      await joyce
        .getByRole("checkbox", { name: /Colossal shrimp/ })
        .isVisible(),
      false,
      "Full menus begin collapsed so browsing stays scannable",
    );
    while (!(await joyce.isVisible())) await page.locator("#show-more").click();
    await joyce.locator(".venue-menu > summary").click();
    await joyce.getByRole("checkbox", { name: /Colossal shrimp/ }).check();
    await joyce.getByRole("checkbox", { name: /Tommy/ }).check();
    assert.match(
      await joyce.locator(".order-total").innerText(),
      /\$28.*before tax/,
    );
    await joyce.locator(".venue-menu > summary").click();
    await joyce.locator(".venue-menu > summary").click();
    assert.equal(
      await joyce.locator("[data-item]:checked").count(),
      2,
      "Closing a menu preserves the selected order",
    );
    await page.locator("#pending-tab").click();
    await page
      .getByRole("heading", { name: "Pending test restaurant", exact: true })
      .waitFor();
    assert.equal(await page.locator("#browse-panel").isVisible(), true);
    assert.equal(
      await page.locator(".results-heading").isVisible(),
      true,
      "Researched and extra discoveries remain distinct sections on Explore",
    );
    assert.match(
      await page.locator("#pending-panel").innerText(),
      /awaiting owner review/i,
    );
    assert.match(
      await page.locator("#pending-results").textContent(),
      /Price needs confirmation/,
    );
    await page.locator(".skip-link").focus();
    await page.keyboard.press("Enter");
    assert.equal(
      await page
        .locator("#happy-hour-lists")
        .evaluate((el) => el === document.activeElement),
      true,
      "Skip link remains usable in the verification view",
    );
    await page.getByText("Add menu evidence", { exact: true }).click();
    assert.equal(await page.getByLabel("Menu or photo link").isVisible(), true);
    await page.locator("#browse-tab").focus();
    await page.keyboard.press("Enter");
    assert.equal(
      await page
        .locator("#happy-hour-lists")
        .evaluate((el) => el === document.activeElement),
      true,
    );
    await fs.mkdir("test-results", { recursive: true });
    for (const width of [1280, 736, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const view of ["browse", "pending"]) {
        await page.locator(`#${view}-tab`).click();
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          `${view} fits ${width}px`,
        );
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.screenshot({
          path: `test-results/local-squeeze-${view}-${width}.png`,
        });
      }
    }
    await page.evaluate(() => document.fonts.ready);
    assert.equal(
      await page.evaluate(() =>
        document.fonts.check('32px "DM Serif Display"'),
      ),
      true,
    );
    assert.equal(
      await page.evaluate(() => document.fonts.check('14px "DM Sans"')),
      true,
    );
    assert.deepEqual(errors, []);
    console.log(
      "Local Squeeze: collapsed menus, retained order subtotal, pending separation, evidence form, keyboard section links, fonts, and 8 responsive screenshots passed.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
