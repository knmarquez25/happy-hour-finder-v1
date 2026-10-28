const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const { chromium } = require("playwright");
(async () => {
  const { emptyPreferences } = await import("../src/discovery.js");
  const { restaurants } = await import("../src/data.js");
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  const base = process.env.PREVIEW_URL || "http://127.0.0.1:4176";
  try {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 1000 },
    });
    // UI regressions use local fixtures; the real separate-origin path is
    // exercised by discovery-cross-origin.cjs and opt-in live-smoke.cjs.
    await page.route("**/src/config.js", (route) =>
      route.fulfill({
        contentType: "text/javascript",
        body: 'export const apiBase = "";',
      }),
    );
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base);
    await page.locator("#results article").first().waitFor();
    assert.equal(
      await page.locator("#results article").count(),
      111,
      "All researched restaurants appear on first load",
    );
    assert.equal(
      await page.locator(".filter-grid select").count(),
      3,
      "Budget, day and time period use native selectors; city, food and drink are searchable",
    );
    assert.match(await page.locator("#interpretation").innerText(), /111/);
    assert.equal(
      await page.locator("#ai-helper article").count(),
      0,
      "Only one restaurant list",
    );
    const first = page.locator("#results article").filter({
      has: page.getByRole("heading", { name: "Joyce", exact: true }),
    });
    assert.equal(
      await first
        .getByRole("checkbox", { name: /Colossal shrimp/ })
        .isVisible(),
      false,
      "Full menus begin collapsed for concise browsing",
    );
    while (!(await first.isVisible())) await page.locator("#show-more").click();
    await first.locator(".venue-menu > summary").click();
    for (const venue of restaurants) {
      const card = page.locator(`[data-venue-id="${venue.id}"]`);
      assert.equal(
        await card.locator(".menu-choice").count(),
        venue.menu.length,
        `${venue.name}: every listed item appears once`,
      );
    }
    await first.getByRole("checkbox", { name: /Colossal shrimp/ }).check();
    await first.getByRole("checkbox", { name: /Tommy/ }).check();
    assert.match(await first.locator(".order-total").innerText(), /\$28/);
    assert.match(await first.locator(".order-total").innerText(), /before tax/);
    await page.route("**/api/discover", (route) =>
      route.fulfill({
        json: { preferences: { ...emptyPreferences(), area: "Pasadena" } },
      }),
    );
    await page.locator("#ai-helper").evaluate((el) => {
      el.open = true;
    });
    await page.getByLabel("Tell us what you’re looking for").fill("Pasadena");
    await page.getByRole("button", { name: "Use as filters" }).click();
    await page.waitForFunction(() =>
      document
        .querySelector("#interpretation")
        .textContent.includes("Pasadena"),
    );
    assert.ok((await page.locator("#results article").count()) > 0);
    assert.ok((await page.locator("#results article").count()) < 111);
    for (const el of await page
      .locator("#results article .venue-location")
      .all())
      assert.match(await el.textContent(), /Pasadena/);
    await page
      .getByRole("button", { name: "Clear all filters", exact: true })
      .click();
    assert.equal(await page.locator("#results article").count(), 111);
    await page.unroute("**/api/discover");
    await page.route("**/api/discover", (route) =>
      route.fulfill({
        json: {
          preferences: { ...emptyPreferences(), drinkPreferences: ["martini"] },
        },
      }),
    );
    await page.locator("#ai-helper").evaluate((el) => {
      el.open = true;
    });
    await page.getByLabel("Tell us what you’re looking for").fill("Martinis");
    await page.getByRole("button", { name: "Use as filters" }).click();
    await page.waitForFunction(() =>
      document.querySelector("#interpretation").textContent.includes("martini"),
    );
    assert.equal(await page.locator("#results article").count(), 13);
    for (const card of await page.locator("#results article").all()) {
      while (!(await card.isVisible()))
        await page.locator("#show-more").click();
      await card.locator(".venue-menu > summary").click();
      const highlight = card.locator(".menu-choice").first();
      assert.match(await highlight.innerText(), /martini/i);
      assert.match(await highlight.innerText(), /Matches your request/);
    }
    for (const id of ["iki-ramen-hollywood", "iki-ramen-koreatown"])
      assert.equal(
        await page
          .locator(`[data-venue-id="${id}"] .menu-choice`)
          .first()
          .locator("strong")
          .textContent(),
        "$10",
      );
    await page
      .getByRole("button", { name: "Clear all filters", exact: true })
      .click();
    await page.unroute("**/api/discover");
    await page.route("**/api/discover", (route) =>
      route.fulfill({
        status: 503,
        json: { error: "AI is unavailable. Please try again later." },
      }),
    );
    await page.locator("#ai-helper").evaluate((el) => {
      el.open = true;
    });
    await page.getByLabel("Tell us what you’re looking for").fill("Tacos");
    await page.getByRole("button", { name: "Use as filters" }).click();
    await page.getByRole("alert").waitFor();
    assert.equal(await page.locator("#results article").count(), 111);
    await page.unroute("**/api/discover");
    let release, arrived;
    const pending = new Promise((r) => (arrived = r));
    await page.route("**/api/discover", async (route) => {
      arrived();
      await new Promise((r) => (release = r));
      try {
        await route.fulfill({
          json: { preferences: { ...emptyPreferences(), area: "Pasadena" } },
        });
      } catch {}
    });
    await page.locator("#ai-helper").evaluate((el) => {
      el.open = true;
    });
    await page.getByLabel("Tell us what you’re looking for").fill("Pasadena");
    await page.getByRole("button", { name: "Use as filters" }).click();
    await pending;
    await page
      .getByRole("button", { name: "Clear all filters", exact: true })
      .click();
    release();
    await page.waitForLoadState("networkidle");
    assert.equal(await page.locator("#results article").count(), 111);
    assert.match(await page.locator("#interpretation").innerText(), /Anywhere/);
    await page.unroute("**/api/discover");
    await page.route("**/api/discover", (route) =>
      route.fulfill({
        json: {
          preferences: {
            ...emptyPreferences(),
            clarification: "Which area should I use for near me?",
          },
        },
      }),
    );
    await page.locator("#ai-helper").evaluate((el) => {
      el.open = true;
    });
    await page.getByLabel("Tell us what you’re looking for").fill("Near me");
    await page.getByRole("button", { name: "Use as filters" }).click();
    await page.getByRole("alert").waitFor();
    assert.equal(await page.locator("#results article").count(), 111);
    assert.match(await page.getByRole("alert").innerText(), /Which area/);
    await page
      .getByRole("button", { name: "Clear all filters", exact: true })
      .click();
    await fs.mkdir("test-results", { recursive: true });
    for (const width of [1280, 736, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      const overflow = await page.evaluate(() =>
        [...document.querySelectorAll("body *")]
          .filter((el) => el.getBoundingClientRect().right > innerWidth + 1)
          .slice(0, 8)
          .map((el) => ({
            tag: el.tagName,
            class: el.className,
            text: el.textContent.slice(0, 80),
            right: el.getBoundingClientRect().right,
          })),
      );
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        "No overflow at " + width + ": " + JSON.stringify(overflow),
      );
      await page.screenshot({
        path: "test-results/ai-discovery-" + width + ".png",
        fullPage: false,
      });
    }
    assert.deepEqual(errors, []);
    console.log(
      "Discovery browser checks passed: default 111, AI fixture narrowing, menu subtotal, Clear, error/clarification preservation, stale response, four viewport widths.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
