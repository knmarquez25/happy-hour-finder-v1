const assert = require("node:assert/strict");
const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 1000 },
    });
    const id = "11111111-1111-4111-8111-111111111111";
    const payload = {
      name: "New Bistro",
      location: "Pasadena",
      county: "LA County",
      address: "Main St, Pasadena",
      sourceUrl: "https://example.com/menu",
      evidence:
        "New Bistro Pasadena happy hour offers a Martini. " +
        "Long source article. ".repeat(50),
      items: [{ name: "Martini", kind: "drink", priceCents: null }],
      hoursText: null,
    };
    let records = [],
      posted = false;
    await page.route("**/src/config.js", (r) =>
      r.fulfill({
        contentType: "text/javascript",
        body: 'export const apiBase = "";',
      }),
    );
    await page.route("**/api/review-config", (r) =>
      r.fulfill({
        json: {
          configured: true,
          menuLookup: true,
          menuPersistence: true,
          url: "https://test.supabase.co",
          anonKey: "public",
        },
      }),
    );
    await page.route("**/api/reviews", (r) => r.fulfill({ json: { records } }));
    await page.route("**/api/explore", (r) => {
      records = [{ id, status: "pending", payload, review_evidence: [] }];
      return r.fulfill({
        json: {
          candidates: [payload],
          records,
          saved: true,
          searchEntryHtml: "<p>Google search suggestions</p>",
        },
      });
    });
    let menuCalls = 0;
    await page.route("**/api/reviews/*/menu", (r) => {
      menuCalls++;
      const candidate = {
        ...payload,
        items: [
          ...payload.items,
          { name: "Truffle fries", kind: "food", priceCents: 700 },
          { name: "House wine", kind: "drink", priceCents: null },
        ],
      };
      const lookup = {
        candidate,
        notice: "Menu remains unverified.",
        checkedAt: new Date().toISOString(),
      };
      records[0].menu_lookup = lookup;
      return r.fulfill({ json: lookup });
    });
    await page.route("**/api/discover", async (r) => {
      const { emptyPreferences } = await import("../src/discovery.js");
      return r.fulfill({
        json: {
          preferences: { ...emptyPreferences(), drinkPreferences: ["martini"] },
        },
      });
    });
    await page.route("**/auth/v1/token?grant_type=password", (r) =>
      r.fulfill({ json: { access_token: "owner-session-token" } }),
    );
    await page.route("**/api/owner", (r) =>
      r.fulfill({ json: { owner: true } }),
    );
    await page.route("**/api/reviews/*/evidence", (r) => {
      posted = true;
      return r.fulfill({ json: { record: { id: "evidence" } } });
    });
    await page.route("**/api/reviews/*/decision", async (r) => {
      const body = r.request().postDataJSON();
      assert.equal(body.status, "approved");
      assert.equal(body.payload.items[0].priceCents, null);
      assert.equal(body.payload.items.length, 3);
      assert.equal(
        payload.items.length,
        1,
        "Original discovery remains unchanged",
      );
      records = [
        {
          id,
          status: "approved",
          payload,
          approved_payload: body.payload,
          reviewed_at: "2026-10-26T01:00:00Z",
        },
      ];
      return r.fulfill({ json: { record: records[0] } });
    });
    await page.goto(process.env.PREVIEW_URL || "http://127.0.0.1:4176");
    await page
      .getByRole("tab", { name: /Needs verification/ })
      .waitFor({ timeout: 3000 });
    await page.getByLabel("Tell us what you’re looking for").fill("martinis");
    await page.getByRole("button", { name: "Find my happy hour" }).click();
    await page
      .getByRole("heading", { name: "New Bistro", exact: true })
      .waitFor();
    assert.match(
      await page.locator("#pending-results").innerText(),
      /Price needs confirmation/,
    );
    assert.equal(
      await page.locator('#results [data-venue-id^="community-"]').count(),
      0,
    );
    assert.equal(
      await page
        .getByRole("button", { name: "Approve and publish", exact: true })
        .count(),
      0,
    );
    assert.equal(
      await page.locator("#pending-results .evidence-tag").innerText(),
      "Needs verification",
    );
    await page.reload();
    await page.getByRole("tab", { name: /Needs verification/ }).click();
    await page
      .getByRole("heading", { name: "New Bistro", exact: true })
      .waitFor();
    assert.equal(
      await page
        .getByRole("button", { name: "Approve and publish", exact: true })
        .count(),
      0,
      "Public visitors see pending places without owner controls",
    );

    await page
      .locator("#pending-results .menu-highlight")
      .filter({ hasText: "Truffle fries" })
      .waitFor();
    await page.locator(".pending-card").scrollIntoViewIfNeeded();
    assert.equal(
      await page.locator("#pending-results .menu-highlight").count(),
      3,
    );
    assert.match(
      await page.locator("#pending-results").innerText(),
      /Happy-hour menu/,
    );
    assert.equal(
      await page
        .getByRole("link", { name: "Open menu source", exact: true })
        .count(),
      1,
    );
    await page.getByText("Source details", { exact: true }).click();
    assert.ok(
      (await page.locator(".source-summary").innerText()).length <= 240,
    );
    assert.ok(
      !(await page.locator("#pending-results").innerText()).includes(
        "Long source article. ".repeat(20),
      ),
    );
    await page.reload();
    await page.getByRole("tab", { name: /Needs verification/ }).click();
    await page
      .locator("#pending-results .menu-highlight")
      .filter({ hasText: "Truffle fries" })
      .waitFor();
    assert.equal(
      menuCalls,
      1,
      "Saved menu loads automatically after refresh without another search",
    );
    await page.getByText("Add menu evidence", { exact: true }).click();
    await page
      .getByLabel("Menu or photo link")
      .fill("https://example.com/new-menu");
    await page
      .getByLabel("What does the source confirm?")
      .fill("Martini is shown on happy hour");
    await page
      .getByRole("button", { name: "Submit evidence", exact: true })
      .click();
    await page
      .getByText("Evidence submitted for owner review.", { exact: true })
      .waitFor();
    assert.equal(posted, true);
    await page
      .getByRole("button", { name: "Owner sign in", exact: true })
      .click();
    await page.getByLabel("Owner email").fill("owner@example.com");
    await page.getByLabel("Owner password").fill("fixture-only");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page.getByText("Review for publication", { exact: true }).click();
    await page.getByLabel("Happy-hour start").fill("16:00");
    await page.getByLabel("Happy-hour end").fill("18:00");
    await page.getByLabel("Friday", { exact: true }).check();
    await page.getByLabel(/I checked the restaurant/).check();
    await page
      .getByRole("button", { name: "Approve and publish", exact: true })
      .click();
    await page.getByRole("tab", { name: /Browse happy hours/ }).click();
    const card = page.locator(`[data-venue-id="community-${id}"]`);
    await card.waitFor();
    await card.scrollIntoViewIfNeeded();
    await page.waitForFunction(
      (selector) =>
        document.querySelector(selector)?.innerText.includes("Owner reviewed"),
      `[data-venue-id="community-${id}"]`,
    );
    assert.match(await card.innerText(), /Owner reviewed/);
    assert.match(await card.innerText(), /Price needs confirmation/);
    await page.reload();
    await page.locator(`[data-venue-id="community-${id}"]`).waitFor();
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        "No horizontal overflow",
      );
    }
    console.log(
      "Review browser passed: grounded pending discovery, unknown price, separate evidence, owner approval snapshot, reload persistence, 390/320 widths.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
