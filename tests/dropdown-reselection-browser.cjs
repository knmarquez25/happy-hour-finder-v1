const assert = require("node:assert/strict");
const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    const page = await browser.newPage();
    await page.route("**/src/config.js", (route) =>
      route.fulfill({
        contentType: "text/javascript",
        body: 'export const apiBase="";',
      }),
    );
    await page.route("**/api/status", (route) =>
      route.fulfill({ json: { configured: true } }),
    );
    await page.route("**/api/review-config", (route) =>
      route.fulfill({ json: { configured: false } }),
    );
    await page.route("**/api/reviews", (route) =>
      route.fulfill({ json: { records: [] } }),
    );
    await page.goto(process.env.PREVIEW_URL || "http://127.0.0.1:4178");
    await page.locator("#results article").first().waitFor();
    for (const [key, first, replacement] of [
      ["city", "Pasadena", "Long Beach"],
      ["food", "Tacos", "Fries"],
      ["drink", "Beer", "Wine"],
    ]) {
      const input = page.locator(`#filter-${key}`);
      const options = page.locator(`#${key}-options option`);
      const originalOptions = await options.evaluateAll((items) =>
        items.map((item) => item.value).sort(),
      );
      await input.fill(first);
      await page.locator("h1").click();
      const chips = await page.locator("#filter-chips").innerText();
      const results = await page.locator("#results article").count();
      await input.click();
      assert.equal(
        await input.inputValue(),
        "",
        `${key}: reopening must expose the unfiltered suggestion list`,
      );
      assert.deepEqual(
        await options.evaluateAll((items) =>
          items.map((item) => item.value).sort(),
        ),
        originalOptions,
      );
      assert.equal(
        await page.locator("#filter-chips").innerText(),
        chips,
        "Opening preserves selected filters",
      );
      assert.equal(
        await page.locator("#results article").count(),
        results,
        "Opening preserves results",
      );
      await page.locator("h1").click();
      assert.equal(
        (await input.inputValue()).toLowerCase(),
        first.toLowerCase(),
        "Leaving without choosing restores the selected label",
      );
      await input.focus();
      assert.equal(
        await input.inputValue(),
        "",
        "Keyboard focus also exposes all suggestions",
      );
      await input.fill(replacement);
      assert.match(
        await page.locator("#filter-chips").innerText(),
        new RegExp(replacement, "i"),
      );
      // Native datalist selection leaves focus in the input. Clicking it again
      // must still allow replacing the selection without an intervening blur.
      await input.click();
      assert.equal(
        await input.inputValue(),
        "",
        "Clicking an already focused selection reopens all options",
      );
      await input.fill(replacement);
      await input.press("ArrowDown");
      assert.equal(
        await input.inputValue(),
        "",
        "Arrow Down reopens all options without moving focus away",
      );
      await input.press("Escape");
      await page.locator("h1").click();
      await input.click();
      await input.press("ControlOrMeta+A");
      await input.press("Backspace");
      await page.locator("h1").click();
      assert.equal(
        await input.inputValue(),
        "",
        "Backspace clears the applied selection after reopening",
      );
      assert.equal(await page.locator("#filter-chips button").count(), 0);
      await input.fill(replacement);
      await input.fill("");
      await page.locator("h1").click();
      assert.equal(
        await input.inputValue(),
        "",
        "Explicit clearing stays cleared",
      );
      assert.equal(await page.locator("#filter-chips button").count(), 0);
      const query = { city: "Pas", food: "ta", drink: "wi" }[key];
      await input.fill(query);
      await input.press("ArrowDown");
      assert.equal(
        await input.inputValue(),
        query,
        "Arrow Down preserves a typed search while navigating matching options",
      );
      await input.fill("");
    }
    const { emptyPreferences } = await import("../src/discovery.js");
    await page.route("**/api/discover", (route) =>
      route.fulfill({
        json: {
          preferences: {
            ...emptyPreferences(),
            foodPreferences: ["tacos", "fries"],
            drinkPreferences: ["beer", "wine"],
          },
        },
      }),
    );
    await page.locator("#ai-helper").evaluate((element) => {
      element.open = true;
    });
    await page
      .getByLabel("Tell us what you’re looking for")
      .fill("Tacos, fries, beer and wine");
    await page
      .getByRole("button", { name: "Use as filters", exact: true })
      .click();
    await page.waitForFunction(
      () => document.querySelector("#filter-food").value === "tacos + fries",
    );
    for (const [key, label] of [
      ["food", "tacos + fries"],
      ["drink", "beer + wine"],
    ]) {
      const input = page.locator(`#filter-${key}`);
      await input.click();
      assert.equal(
        await input.inputValue(),
        "",
        "AI-populated multiple preferences reopen all options",
      );
      await page.locator("h1").click();
      assert.equal(
        await input.inputValue(),
        label,
        "Canceling restores all AI preferences",
      );
    }
    console.log(
      "Dropdown reselection passed for City, Food, and Drinks: mouse, keyboard, replacement, cancellation, and clearing.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
