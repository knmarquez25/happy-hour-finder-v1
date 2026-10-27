const assert = require("node:assert/strict");
const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    for (const fails of [false, true]) {
      const page = await browser.newPage({
        viewport: { width: 1280, height: 1000 },
      });
      const id = "11111111-1111-4111-8111-111111111111";
      const payload = {
        name: "New Bistro",
        location: "Pasadena",
        county: "LA County",
        address: "",
        sourceUrl: "https://example.com/menu",
        evidence: "New Bistro Pasadena happy hour menu",
        hoursText: null,
        items: [{ name: "Martini", kind: "drink", priceCents: null }],
      };
      let release,
        calls = 0;
      const gate = new Promise((r) => (release = r));
      await page.route("**/src/config.js", (r) =>
        r.fulfill({
          contentType: "text/javascript",
          body: 'export const apiBase="";',
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
      await page.route("**/api/reviews", (r) =>
        r.fulfill({ json: { records: [{ id, status: "pending", payload }] } }),
      );
      await page.route("**/api/reviews/*/menu", async (r) => {
        calls++;
        await gate;
        if (fails)
          return r.fulfill({
            status: 503,
            json: { error: "Menu provider unavailable. Please retry." },
          });
        await r.fulfill({
          json: {
            candidate: {
              ...payload,
              items: [
                ...payload.items,
                { name: "Fries", kind: "food", priceCents: null },
              ],
            },
            checkedAt: new Date().toISOString(),
            notice: "Menu remains unverified.",
          },
        });
      });
      await page.route("**/auth/v1/token?grant_type=password", (r) =>
        r.fulfill({ json: { access_token: "owner-session-token" } }),
      );
      await page.route("**/api/owner", (r) =>
        r.fulfill({ json: { owner: true } }),
      );
      await page.goto(process.env.PREVIEW_URL || "http://127.0.0.1:4176");
      await page.locator("#pending-tab").waitFor();
      assert.equal(
        calls,
        0,
        "Browsing does not trigger additional menu searches",
      );
      await page.locator("#pending-tab").click();
      await page.locator(".pending-card").scrollIntoViewIfNeeded();
      assert.equal(calls, 0, "Viewing extra places must not spend AI usage");
      await page
        .getByRole("button", { name: "Find more menu items", exact: true })
        .click();
      await page
        .getByText("Loading available happy-hour menu items…", { exact: true })
        .waitFor();
      await page
        .getByRole("button", { name: "Owner sign in", exact: true })
        .click();
      await page.getByLabel("Owner email").fill("owner@example.com");
      await page.getByLabel("Owner password").fill("fixture-only");
      await page.getByRole("button", { name: "Sign in", exact: true }).click();
      await page.getByText("Review for publication", { exact: true }).click();
      await page.getByLabel("Item 1", { exact: true }).fill("Owner edit");
      release();
      await page
        .getByText(
          fails
            ? "Menu provider unavailable. Please retry."
            : "An updated menu was saved. Refresh the queue before reviewing it.",
          { exact: true },
        )
        .waitFor({ timeout: 5000 });
      assert.equal(
        await page.getByLabel("Item 1", { exact: true }).inputValue(),
        "Owner edit",
        "Background menu lookup must not erase owner edits",
      );
      assert.equal(
        await page
          .getByRole("button", { name: "Loading menu…", exact: true })
          .count(),
        0,
      );
      assert.equal(calls, 1);
      await page.route("**/api/explore", (r) =>
        r.fulfill({
          status: 503,
          json: { error: "Fixture online search unavailable" },
        }),
      );
      await page
        .getByRole("button", { name: "Find more places online", exact: true })
        .click();
      await page
        .getByText("Fixture online search unavailable", { exact: true })
        .waitFor();
      assert.equal(
        await page.getByLabel("Item 1", { exact: true }).inputValue(),
        "Owner edit",
        "A failed online search preserves owner corrections",
      );
      if (!fails) {
        await page
          .getByRole("button", { name: "Find more menu items", exact: true })
          .click();
        await page
          .getByText(
            "An updated menu was saved. Refresh the queue before reviewing it.",
            { exact: true },
          )
          .waitFor();
        assert.equal(
          await page.getByLabel("Item 1", { exact: true }).inputValue(),
          "Owner edit",
          "An owner-started menu lookup also preserves corrections in progress",
        );
      }
      await page.close();
    }
    console.log(
      "Manual menu browser passed: hidden cards do not search, visible cards wait for an explicit menu lookup, owner sign-in race clears loading and preserves edits.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
