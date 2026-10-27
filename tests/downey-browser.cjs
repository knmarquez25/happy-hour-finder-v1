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
    const oldPlace = {
      id: "11111111-1111-4111-8111-111111111111",
      status: "pending",
      payload: {
        name: "Old Hollywood Place",
        location: "Hollywood",
        county: "LA County",
        sourceUrl: "https://example.com/old-menu",
        evidence: "Old Hollywood Place happy hour Martini",
        items: [{ name: "Martini", kind: "drink", priceCents: null }],
        hoursText: "Monday 4–6pm",
      },
    };
    const newPlace = {
      id: "22222222-2222-4222-8222-222222222222",
      status: "pending",
      payload: {
        ...oldPlace.payload,
        name: "New Pasadena Place",
        location: "Pasadena",
        evidence: "New Pasadena Place happy hour Martini",
      },
    };
    let records = [oldPlace];
    await page.route("**/api/reviews", (r) => r.fulfill({ json: { records } }));
    await page.route("**/api/explore", (r) => {
      const pasadena = r.request().postDataJSON().query === "Pasadena";
      if (pasadena) records = [oldPlace, newPlace];
      return r.fulfill({
        json: {
          saved: true,
          candidates: pasadena ? [newPlace.payload] : [],
          records,
        },
      });
    });
    await page.route("**/api/discover", async (r) => {
      const { emptyPreferences } = await import("../src/discovery.js");
      await r.fulfill({
        json: {
          preferences: {
            ...emptyPreferences(),
            area:
              r.request().postDataJSON().query === "Pasadena"
                ? "Pasadena"
                : "Downey",
            day:
              r.request().postDataJSON().query === "Pasadena" ? null : "Monday",
            time:
              r.request().postDataJSON().query === "Pasadena" ? null : "12:00",
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
    await page.getByRole("tab", { name: /Needs verification/ }).click();
    await page
      .getByRole("heading", {
        name: "No discoveries for this search",
        exact: true,
      })
      .waitFor({ timeout: 5000 });
    assert.equal(
      await page.locator("#pending-results .pending-card").count(),
      0,
      "A Downey search must not show the global Hollywood queue",
    );
    assert.match(await page.locator("#pending-tab").innerText(), /\(0\)/);
    await page
      .getByRole("button", { name: "Refresh queue", exact: true })
      .click();
    assert.equal(
      await page.locator("#pending-results .pending-card").count(),
      0,
      "Refreshing the shared data must preserve search scope",
    );
    await page
      .getByRole("button", { name: "Clear request", exact: true })
      .click();
    await page.getByRole("tab", { name: /Needs verification/ }).click();
    await page
      .getByRole("heading", { name: "Old Hollywood Place", exact: true })
      .waitFor();
    assert.equal(
      await page.locator("#pending-results .pending-card").count(),
      1,
      "Clear restores the saved queue without deleting records",
    );
    await page.getByLabel("Tell us what you’re looking for").fill("Pasadena");
    await page.getByRole("button", { name: "Find my happy hour" }).click();
    await page
      .getByRole("heading", { name: "New Pasadena Place", exact: true })
      .waitFor();
    assert.equal(
      await page.locator("#pending-results .pending-card").count(),
      1,
      "Only the current discovery result appears, even when API returns the whole queue",
    );
    assert.equal(
      await page
        .getByRole("heading", { name: "Old Hollywood Place", exact: true })
        .count(),
      0,
    );
    await page
      .getByRole("button", { name: "Clear request", exact: true })
      .click();
    await page.getByRole("tab", { name: /Needs verification/ }).click();
    assert.equal(
      await page.locator("#pending-results .pending-card").count(),
      2,
      "Both submissions remain in the shared queue",
    );
    await page.getByRole("tab", { name: /Browse happy hours/ }).click();

    assert.equal(await page.locator("#results article").count(), 111);
    console.log(
      "Downey browser passed: Monday noon stays12:00, valid city produces honest empty result, no geographic error or silent broadening, pending tab is scoped to current discoveries, refresh preserves scope, Clear restores the full queue and111 reviewed restaurants.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
