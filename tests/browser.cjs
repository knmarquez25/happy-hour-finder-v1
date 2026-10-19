const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:4174";
(async () => {
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  try {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 1000 },
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await fs.mkdir("test-results", { recursive: true });
    await page.goto(base);
    await page.locator("#results .result-card").first().waitFor();
    assert.match(
      await page.locator("#coverage-count").innerText(),
      /100 researched/,
    );
    assert.equal(
      (await page.locator("#results .result-card").count()) > 0,
      true,
    );
    assert.equal(
      await page.locator(".brand svg").count(),
      1,
      "Lucide asset rendered",
    );
    await page.screenshot({ path: "test-results/desktop.png", fullPage: true });
    assert.ok(
      await page.locator("[name=foodPreferences]").isVisible(),
      "Custom food input is visible immediately",
    );
    assert.ok(
      await page.locator("[name=drinkPreferences]").isVisible(),
      "Custom drink input is visible immediately",
    );
    await page.locator("#sort").selectOption("budget");
    await page.locator("#budget").fill("100");
    assert.match(
      await page.locator("#active-filters").innerText(),
      /Around \$100/,
    );
    const differences = (
      await page.locator("#results .budget-difference").allTextContents()
    )
      .filter((label) => !label.includes("not confirmed"))
      .map((label) => Number(label.replace(/[^0-9.]/g, "")) || 0);
    assert.deepEqual(
      differences,
      [...differences].sort((a, b) => a - b),
    );
    assert.match(
      await page.locator("#results-title").innerText(),
      /Thursday, 5:30 PM/,
    );
    await page.locator("[name=foodPreferences]").fill("sushi");
    await page.locator("[name=drinkPreferences]").fill("wine");
    assert.match(await page.locator("#active-filters").innerText(), /sushi/);
    assert.match(await page.locator("#active-filters").innerText(), /wine/);
    await page.locator("#sort").selectOption("match");
    for (const budget of [1, 100, 250, 500]) {
      await page.locator("#budget").fill(String(budget));
      assert.equal(
        await page.locator("#budget-slider").inputValue(),
        String(budget),
        "Slider and numeric budget stay synchronized",
      );
    }
    await page.getByRole("spinbutton", { name: /Budget target/ }).fill("5");
    await page.getByRole("spinbutton", { name: /Budget target/ }).press("Tab");
    assert.ok(
      (await page.locator("#results .result-card").count()) > 0,
      "Flexible budgets retain results",
    );
    assert.match(
      await page.locator("#results .budget-difference").first().innerText(),
      /above target/,
    );
    await page.locator("#preset-select").selectOption("pasadena");
    assert.match(await page.locator("#result-count").innerText(), /Pasadena/);
    await page.locator("#sort").selectOption("price");
    const visiblePrices = await page
      .locator("#results .price")
      .allTextContents();
    assert.ok(visiblePrices.length >= 1);
    const priced = visiblePrices
      .filter((price) => price.startsWith("$"))
      .map((price) => Number(price.slice(1)));
    assert.deepEqual(
      priced,
      [...priced].sort((a, b) => a - b),
    );
    const saveButtons = page.locator("#results [data-save]");
    for (let i = 0; i < Math.min(4, await saveButtons.count()); i++) {
      const id = await saveButtons.nth(i).getAttribute("data-save");
      await saveButtons.nth(i).click();
      assert.equal(
        await page.evaluate(() => document.activeElement?.dataset.save),
        id,
        "Save retains keyboard focus after updating results",
      );
    }
    assert.equal(await page.locator("#shortlist-count").innerText(), "3");
    assert.equal(await page.locator("#comparison .comparison-item").count(), 3);
    await page.reload();
    await page.locator("#comparison .comparison-item").first().waitFor();
    assert.equal(await page.locator("#comparison .comparison-item").count(), 3);
    await page.locator("#comparison [data-remove]").first().click();
    assert.equal(await page.locator("#shortlist-count").innerText(), "2");
    if (!((await page.locator("#more-filters").getAttribute("open")) !== null))
      await page.locator("#more-filters > summary").click();
    await page.locator("[name=foodPreferences]").fill("not-a-real-dish");
    await page.getByLabel("Food is a must-have", { exact: true }).check();
    assert.equal(await page.locator("#results .empty-state").count(), 1);
    await page.locator("#alternatives > summary").click();
    assert.ok(
      (await page.locator("#alternative-results .failure-reason").count()) > 0,
    );
    await page.getByLabel("Food is a must-have", { exact: true }).uncheck();
    await page.locator("[name=foodPreferences]").fill("");
    await page.getByRole("button", { name: "Find spots", exact: true }).click();
    await page.locator("#results .venue-details > summary").first().click();
    assert.ok(
      await page.locator("#results .source-list a").first().isVisible(),
    );
    const bounds = [];
    for (const width of [1280, 1060, 736, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      const overflow = await page.evaluate(() => ({
        body: document.documentElement.scrollWidth,
        viewport: innerWidth,
        violations: [
          ...document.querySelectorAll(
            "input,select,button,h1,h2,h3,.combo,.card-heading",
          ),
        ]
          .filter((element) => {
            const rect = element.getBoundingClientRect();
            return (
              rect.width > 0 &&
              (rect.left < -0.5 || rect.right > innerWidth + 0.5)
            );
          })
          .map((element) => element.id || element.className || element.tagName),
      }));
      assert.ok(
        overflow.body <= overflow.viewport + 1,
        JSON.stringify({ width, ...overflow }),
      );
      assert.equal(
        overflow.violations.length,
        0,
        JSON.stringify({ width, ...overflow }),
      );
      bounds.push({ width, ...overflow });
      if (width === 390)
        await page.screenshot({
          path: "test-results/mobile.png",
          fullPage: true,
        });
    }
    await page.getByRole("button", { name: "Switch color theme" }).click();
    await page.screenshot({
      path: "test-results/dark-mobile.png",
      fullPage: true,
    });
    await page.evaluate(() =>
      localStorage.setItem("hh-shortlist-v2", "{broken"),
    );
    await page.reload();
    await page.locator("#results .result-card").first().waitFor();
    assert.equal(await page.locator("#shortlist-count").innerText(), "0");
    assert.deepEqual(errors, []);
    const result = {
      passed: true,
      checks: [
        "actual dataset",
        "Lucide assets",
        "flexible budget",
        "origin change",
        "price sort",
        "three-spot limit",
        "persistent shortlist",
        "remove",
        "must-have empty state",
        "separate alternatives",
        "source details",
        "five responsive widths",
        "theme",
        "corrupt storage",
      ],
      bounds,
      errors,
    };
    await fs.writeFile(
      "test-results/browser-report.json",
      JSON.stringify(result, null, 2),
    );
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
