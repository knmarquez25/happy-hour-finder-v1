// Explicit opt-in only: uses the deployed free-tier service, never a local key.
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const { chromium } = require("playwright");
(async () => {
  if (process.env.LIVE_AI_SMOKE !== "1")
    throw new Error(
      "Set LIVE_AI_SMOKE=1 to run three real deployed AI requests.",
    );
  const base = "https://knmarquez25.github.io/happy-hour-finder-v1/";
  const cases = [
    {
      query: "Tacos and margaritas around $25",
      want: {
        area: null,
        foodPreferences: ["tacos"],
        drinkPreferences: ["margarita"],
        budget: 25,
        day: null,
        time: null,
        atmosphere: null,
        clarification: null,
      },
    },
    {
      query: "Somewhere in Pasadena",
      want: {
        area: "Pasadena",
        foodPreferences: [],
        drinkPreferences: [],
        budget: null,
        day: null,
        time: null,
        atmosphere: null,
        clarification: null,
      },
    },
    { query: "Find me a happy hour near me", clarification: true },
  ];
  const report = {
    runAt: new Date().toISOString(),
    timezone: "America/Los_Angeles",
    frontend: base,
    backend: "https://happy-hour-finder-ai.onrender.com",
    model: "gemini-3.5-flash-lite",
    method:
      "Fresh unauthenticated Chrome context; real AI responses, no routes or fixtures; expected fields fixed before calls.",
    rows: [],
  };
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 1000 },
    });
    const page = await context.newPage();
    await page.goto(base);
    await page
      .getByText("AI suggestions available", { exact: true })
      .waitFor({ timeout: 90000 });
    assert.equal(await page.locator("#results article").count(), 111);
    report.initialCount = 111;
    for (const scenario of cases) {
      await page.locator("#ai-helper").evaluate((el) => {
        el.open = true;
      });
      await page
        .getByLabel("Tell us what you’re looking for")
        .fill(scenario.query);
      const responsePromise = page.waitForResponse(
        (r) =>
          r.url() ===
            "https://happy-hour-finder-ai.onrender.com/api/discover" &&
          r.request().method() === "POST",
        { timeout: 90000 },
      );
      const start = Date.now();
      await page.getByRole("button", { name: "Use as filters" }).click();
      const response = await responsePromise;
      const result = await response.json();
      await page.waitForFunction(
        () => !document.querySelector("#ask-button").disabled,
      );
      const row = {
        query: scenario.query,
        status: response.status(),
        latencyMs: Date.now() - start,
        preferences: result.preferences || null,
        error: result.error || null,
        expected: scenario.want || { clarification: true },
        resultIds: await page
          .locator("#results article")
          .evaluateAll((els) => els.map((e) => e.dataset.venueId)),
        passed: false,
      };
      report.rows.push(row);
      assert.equal(row.status, 200);
      if (scenario.clarification) {
        assert.ok(result.preferences.clarification);
        assert.equal(row.resultIds.length, 111);
        assert.equal(await page.getByRole("alert").isVisible(), true);
      } else assert.deepEqual(result.preferences, scenario.want);
      if (scenario.query.startsWith("Tacos")) {
        assert.ok(row.resultIds.includes("cw-coyote-grill-laguna-beach"));
        const card = page.locator(
          '[data-venue-id="cw-coyote-grill-laguna-beach"]',
        );
        await card.locator(".venue-menu > summary").click();
        await card.getByRole("checkbox", { name: /Chicken taco/ }).check();
        await card
          .getByRole("checkbox", { name: /Happy-hour margarita/ })
          .check();
        assert.match(
          await card.locator(".order-total").innerText(),
          /\$14\.75/,
        );
        await fs.mkdir("test-results", { recursive: true });
        await page.screenshot({
          path: "test-results/live-github-ai.png",
          fullPage: false,
        });
        report.customSubtotalCents = 1475;
      }
      row.passed = true;
      await page
        .getByRole("button", { name: "Clear all filters", exact: true })
        .click();
      assert.equal(await page.locator("#results article").count(), 111);
    }
    report.passed = report.rows.every((r) => r.passed);
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await fs.mkdir("evaluation", { recursive: true });
    await fs.writeFile(
      "evaluation/live-smoke.json",
      JSON.stringify(report, null, 2) + "\n",
    );
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
