const assert = require("node:assert/strict");
const { chromium } = require("playwright");
(async () => {
  const { restaurants, dataMetadata } = await import("../src/data.js");
  const base = restaurants.find((v) => v.id === "33-taps-silver-lake");
  const fixtures = ["complete", "partial", "unverified", "missing"].map(
    (status, i) => ({
      ...structuredClone(base),
      id: "fixture-" + status,
      name: "Audit " + i + " " + status,
      menuCoverage:
        status === "missing"
          ? undefined
          : {
              ...base.menuCoverage,
              status,
              gaps:
                status === "complete" ? [] : ["Unreviewed image price list"],
            },
    }),
  );
  fixtures[2].sources = fixtures[2].sources.map((s) => ({
    ...s,
    type: "secondary",
    reviewedOn: null,
  }));
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 1000 },
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.route("**/src/data.js", (r) =>
      r.fulfill({
        contentType: "text/javascript",
        body: `export const restaurants=${JSON.stringify(fixtures)}; export const dataMetadata=${JSON.stringify(dataMetadata)};`,
      }),
    );
    await page.route("**/src/config.js", (r) =>
      r.fulfill({
        contentType: "text/javascript",
        body: 'export const apiBase="";',
      }),
    );
    await page.route("**/api/**", (r) =>
      r.fulfill({ json: { configured: false, records: [] } }),
    );
    await page.goto(process.env.PREVIEW_URL || "http://127.0.0.1:4179");
    await page.locator("#results article").first().waitFor();
    const card = page.locator('[data-venue-id="fixture-complete"]');
    await card.locator(".venue-menu>summary").focus();
    await page.keyboard.press("Enter");
    assert.match(
      await card.locator(".menu-coverage").innerText(),
      /Full published specials reviewed/,
    );
    assert.match(
      await card.locator(".menu-coverage").innerText(),
      /2026-10-26/,
    );
    assert.equal((await card.locator(".menu-coverage a").count()) > 0, true);
    assert.match(
      await card.locator(".listed-offers").innerText(),
      /Taco Tuesday/,
    );
    assert.equal(await card.locator("[data-item]").count(), base.menu.length);
    await card.locator('[data-item="pizza"]').check();
    await card.locator('[data-item="pitcher"]').check();
    assert.match(
      await card.locator(".order-total").innerText(),
      /unknown|confirmation/i,
    );
    for (const status of ["partial", "unverified", "missing"]) {
      const c = page.locator(`[data-venue-id="fixture-${status}"]`);
      await c.locator(".venue-menu>summary").click();
      assert.match(
        await c.locator(".menu-coverage").innerText(),
        status === "partial" ? /Partial menu/ : /Menu needs verification/,
      );
      if (status === "unverified") {
        assert.equal(
          await c.getByRole("link", { name: /Open guide source/ }).count(),
          3,
        );
        assert.match(
          await c.locator(".menu-coverage").innerText(),
          /Menu coverage checked 2026-10-26/,
        );
        assert.doesNotMatch(
          await c.locator(".menu-coverage").innerText(),
          /Published specials reviewed/,
        );
      }
    }
    for (const width of [1280, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        true,
      );
    }
    assert.deepEqual(errors, []);
    console.log(
      "PASS: menu coverage, combined offers, unknown prices, keyboard, mobile",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
