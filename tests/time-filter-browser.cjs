const assert = require("node:assert/strict");
const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    for (const width of [1280, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 950 } });
      let records = [],
        bodies = [];
      const payload = {
        name: "Imported Noon Bistro",
        location: "Downey",
        county: "LA County",
        sourceUrl: "https://example.com/menu",
        evidence:
          "Page title: Imported Noon Bistro Downey\nMenu excerpt: Happy hour Monday-Friday 12–2 PM & 5–7 PM. Domestic $3.50",
        hoursText: "Monday-Friday12–2 PM & 5–7 PM",
        items: [{ name: "Domestic", kind: "drink", priceCents: 350 }],
        discoveryMethod: "menu-link",
      };
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
        r.fulfill({ json: { configured: true, menuPersistence: false } }),
      );
      await page.route("**/api/reviews", (r) =>
        r.fulfill({ json: { records } }),
      );
      await page.route("**/api/discover", async (r) => {
        const { emptyPreferences } = await import("../src/discovery.js");
        const body = r.request().postDataJSON();
        bodies.push(body);
        await r.fulfill({
          json: {
            preferences: {
              ...emptyPreferences(),
              area: body.query.toLowerCase().includes("downey")
                ? "Downey"
                : "Glendale",
              day: "Monday",
              ...(body.filters?.time
                ? { time: body.filters.time }
                : { timePeriod: "night" }),
            },
          },
        });
      });
      await page.route("**/api/explore", (r) => {
        bodies.push(r.request().postDataJSON());
        return r.fulfill({
          json: {
            saved: true,
            records,
            candidates: records.map((r) => r.payload),
          },
        });
      });
      await page.route("**/api/import-menu", (r) => {
        assert.equal(r.request().postDataJSON().sourceUrl, payload.sourceUrl);
        records = [
          {
            id: "11111111-1111-4111-8111-111111111111",
            status: "pending",
            payload,
          },
        ];
        return r.fulfill({
          json: { saved: true, records, candidates: [payload] },
        });
      });
      await page.goto(process.env.PREVIEW_URL || "http://127.0.0.1:4192");
      await page
        .getByLabel("Tell us what you’re looking for")
        .fill("Glendale Tuesday afternoon");
      await page.getByLabel("Day", { exact: true }).selectOption("Monday");
      await page
        .getByLabel("Time of day", { exact: true })
        .selectOption("night");
      await page.getByRole("button", { name: "Find my happy hour" }).click();
      await page.waitForFunction(() =>
        document
          .querySelector("#interpretation")
          .textContent.includes("Night · 6 PM–midnight"),
      );
      assert.equal(bodies.length, 2);
      assert.ok(
        bodies.every(
          (b) => b.filters.day === "Monday" && b.filters.timePeriod === "night",
        ),
      );
      await page.getByRole("tab", { name: /Needs verification/ }).click();
      await page
        .getByText("Know a place we missed? Add its menu link", { exact: true })
        .click();
      await page
        .getByLabel("Public restaurant menu link")
        .fill(payload.sourceUrl);
      await page.getByLabel("City or neighborhood (optional)").fill("Downey");
      await page.getByRole("button", { name: "Read menu link" }).click();
      await page.waitForFunction(
        () =>
          document.querySelector("#pending-panel")?.hidden === false &&
          document
            .querySelector(".pending-card h3")
            ?.textContent.includes("Imported"),
      );
      console.log(
        "import",
        await page.locator("#import-menu-status").textContent(),
      );
      assert.match(
        await page.locator(".pending-card").innerText(),
        /Imported Noon Bistro[\s\S]*Needs verification[\s\S]*Added from a menu link/,
      );
      assert.equal(
        await page.getByRole("button", { name: /Approve/ }).count(),
        0,
      );
      await page
        .getByRole("button", { name: "Clear request", exact: true })
        .click();
      assert.equal(
        await page.getByLabel("Day", { exact: true }).inputValue(),
        "",
      );
      await page
        .getByLabel("Tell us what you’re looking for")
        .fill("Downey Monday noon");
      await page
        .getByLabel("Time of day", { exact: true })
        .selectOption("exact");
      await page.getByLabel("Exact time", { exact: true }).fill("12:00");
      await page.getByRole("button", { name: "Find my happy hour" }).click();
      await page.waitForFunction(() =>
        document.querySelector("#interpretation").textContent.includes("12:00"),
      );
      assert.ok(bodies.at(-1).filters.time === "12:00");
      assert.equal(await page.locator(".pending-card").count(), 1);
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 1,
        ),
        false,
      );
      await page.close();
      console.log(
        `PASS filters, menu import, saved scope, owner guard and layout at ${width}px`,
      );
    }
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
