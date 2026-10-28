const assert = require("node:assert/strict");
const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 1000 },
    });
    const { emptyPreferences } = await import("../src/discovery.js");
    let ai = 0,
      web = 0,
      menus = 0,
      query = "";
    const payload = {
      name: "Extra Bistro",
      location: "Pasadena",
      county: "LA County",
      address: "",
      sourceUrl: "https://example.com/menu",
      evidence: "Extra Bistro Pasadena happy hour menu",
      hoursText: null,
      items: [
        { kind: "drink", name: "Martini", priceCents: null },
        { kind: "food", name: "Dragonfruit tostada", priceCents: 700 },
      ],
    };
    let records = [
      {
        id: "11111111-1111-4111-8111-111111111111",
        status: "pending",
        payload,
      },
    ];
    await page.route("**/src/config.js", (r) =>
      r.fulfill({
        contentType: "text/javascript",
        body: 'export const apiBase="";',
      }),
    );
    await page.route("**/api/status", (r) =>
      r.fulfill({ json: { configured: true } }),
    );
    await page.route("**/api/review-config", (r) =>
      r.fulfill({
        json: { configured: true, menuLookup: true, menuPersistence: true },
      }),
    );
    await page.route("**/api/reviews", (r) => r.fulfill({ json: { records } }));
    await page.route("**/api/reviews/*/menu", (r) => {
      menus++;
      return r.fulfill({
        json: {
          candidate: payload,
          checkedAt: new Date().toISOString(),
          notice: "Still unverified",
        },
      });
    });
    await page.route("**/api/discover", (r) => {
      ai++;
      return r.fulfill({
        json: {
          preferences: {
            ...emptyPreferences(),
            area: "Pasadena",
            drinkPreferences: ["martini"],
          },
        },
      });
    });
    await page.route("**/api/explore", (r) => {
      web++;
      query = r.request().postDataJSON().query;
      return r.fulfill({
        json: { saved: true, records, candidates: [payload] },
      });
    });
    await page.goto(process.env.PREVIEW_URL || "http://127.0.0.1:4177");
    await page.locator("#results article").first().waitFor();
    assert.equal(await page.getByLabel("Food", { exact: true }).count(), 1);
    assert.equal(await page.getByLabel("Drinks", { exact: true }).count(), 1);
    assert.equal(
      await page
        .locator('#food-options option[value="Dragonfruit tostada"]')
        .count(),
      0,
      "Pending terms do not enter researched menu filters",
    );
    await page.getByLabel("Drinks", { exact: true }).fill("martini");
    await page.waitForFunction(() =>
      document
        .querySelector("#results article h3")
        ?.textContent.includes("33 Taps"),
    );
    assert.equal(
      await page.locator("#results article:not([hidden])").count(),
      6,
    );
    assert.equal(
      await page.getByLabel("Food", { exact: true }).inputValue(),
      "",
    );
    assert.match(await page.locator("#extra-count").innerText(), /1/);
    await page.locator("#pending-tab").click();
    await page
      .getByRole("heading", { name: "Extra Bistro", exact: true })
      .waitFor();
    assert.equal(
      ai + web + menus,
      0,
      "Filtering and viewing extra places make no AI, web, or menu requests",
    );
    await page
      .getByRole("button", { name: "Clear all filters", exact: true })
      .click();
    assert.equal(await page.locator("#results article").count(), 111);
    assert.equal(
      await page.locator("#results article:not([hidden])").count(),
      6,
    );
    await page
      .getByRole("button", { name: /Show more researched places/ })
      .click();
    assert.equal(
      await page.locator("#results article:not([hidden])").count(),
      12,
    );
    await page.locator("#ai-helper").evaluate((el) => (el.open = true));
    await page
      .getByLabel("Tell us what you’re looking for")
      .fill("Martinis in Pasadena");
    await page
      .getByRole("button", { name: "Use as filters", exact: true })
      .click();
    await page.waitForFunction(
      () => document.querySelector("#filter-city").value === "Pasadena",
    );
    assert.equal(ai, 1);
    assert.equal(web, 0);
    assert.equal(menus, 0);
    assert.equal(
      await page.getByLabel("Drinks", { exact: true }).inputValue(),
      "martini",
    );
    await page
      .getByRole("button", { name: "Find more places online", exact: true })
      .click();
    await page.waitForFunction(() =>
      document
        .querySelector("#discovery-status")
        .textContent.includes("new place"),
    );
    assert.equal(web, 1);
    assert.ok(query.includes("Pasadena") && query.includes("martini"));
    assert.equal(
      menus,
      0,
      "Web discovery does not start a separate menu lookup for every result",
    );
    await page
      .getByRole("button", { name: "Find more menu items", exact: true })
      .click();
    await page.getByText("Still unverified", { exact: true }).waitFor();
    assert.equal(menus, 1);
    records = [
      {
        ...records[0],
        status: "approved",
        reviewed_at: "2026-10-26T01:00:00Z",
        approved_payload: {
          ...payload,
          restaurantSourceConfirmed: true,
          hours: [
            {
              days: ["Friday"],
              start: "16:00",
              end: "18:00",
              restriction: "none",
            },
          ],
        },
      },
    ];
    await page
      .getByRole("button", { name: "Refresh queue", exact: true })
      .click();
    await page
      .locator('#food-options option[value="Dragonfruit tostada"]')
      .waitFor({ state: "attached" });
    assert.equal(
      await page
        .locator('#food-options option[value="Dragonfruit tostada"]')
        .count(),
      1,
      "Approval grows filter vocabulary automatically",
    );
    await page
      .getByRole("button", {
        name: "Remove area filter: Pasadena",
        exact: true,
      })
      .click();
    assert.equal(
      await page
        .getByLabel("City or neighborhood", { exact: true })
        .evaluate((el) => el === document.activeElement),
      true,
      "Removing a chip restores useful keyboard focus",
    );
    await page
      .getByRole("button", { name: "Clear all filters", exact: true })
      .click();
    await page.unroute("**/api/discover");
    let releaseAI, startedAI;
    const aiStarted = new Promise((resolve) => {
      startedAI = resolve;
    });
    await page.route("**/api/discover", async (r) => {
      startedAI();
      await new Promise((resolve) => {
        releaseAI = resolve;
      });
      try {
        await r.fulfill({
          json: { preferences: { ...emptyPreferences(), area: "Pasadena" } },
        });
      } catch {}
    });
    await page.getByLabel("Tell us what you’re looking for").fill("Pasadena");
    await page
      .getByRole("button", { name: "Use as filters", exact: true })
      .click();
    await aiStarted;
    await page.getByLabel("Drinks", { exact: true }).fill("beer");
    releaseAI();
    await page.waitForLoadState("networkidle");
    assert.equal(
      await page
        .getByLabel("City or neighborhood", { exact: true })
        .inputValue(),
      "",
      "Stale AI cannot replace a manual edit",
    );
    assert.equal(
      await page.getByLabel("Drinks", { exact: true }).inputValue(),
      "beer",
    );
    await page
      .getByRole("button", { name: "Clear all filters", exact: true })
      .click();
    await page.unroute("**/api/explore");
    let releaseWeb, startedWeb;
    const webStarted = new Promise((resolve) => {
      startedWeb = resolve;
    });
    await page.route("**/api/explore", async (r) => {
      startedWeb();
      await new Promise((resolve) => {
        releaseWeb = resolve;
      });
      try {
        await r.fulfill({
          json: {
            saved: false,
            candidates: [{ ...payload, name: "Stale extra" }],
          },
        });
      } catch {}
    });
    await page
      .getByRole("button", { name: "Find more places online", exact: true })
      .click();
    await webStarted;
    await page.getByLabel("City or neighborhood", { exact: true }).fill("Pas");
    assert.equal(
      await page
        .getByRole("heading", {
          name: "Searching for extra places…",
          exact: true,
        })
        .count(),
      0,
      "Canceling on a partial city clears stale loading content",
    );
    releaseWeb();
    await page.waitForLoadState("networkidle");
    assert.equal(
      await page
        .getByRole("heading", { name: "Stale extra", exact: true })
        .count(),
      0,
      "Canceled web results cannot enter the current view",
    );
    assert.equal(
      await page.locator("#find-online").isEnabled(),
      false,
      "An incomplete city cannot start a paid search using an older city",
    );
    await page.getByLabel("City or neighborhood", { exact: true }).fill("");
    await page.locator("#ai-helper").evaluate((el) => {
      el.open = false;
    });
    for (const width of [1280, 736, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      if (width <= 480)
        await page
          .locator("#explore-filters")
          .evaluate((el) => (el.open = true));
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `Filter layout fits ${width}px`,
      );
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: `test-results/filters-${width}.png` });
    }
    console.log(
      "Filters browser passed: independent local filters, no automatic paid calls, separate explicit AI/web/menu actions, approval-grown vocabulary, pagination, and four widths.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
