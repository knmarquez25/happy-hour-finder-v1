const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:4174";
(async () => {
  const { dataMetadata } = await import("../src/data.js");
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
    assert.match(await page.locator("h1").innerText(), /Happy Hour\s+Finder/i);
    assert.equal(await page.title(), "Happy Hour Finder | LA + Orange County");
    assert.match(
      await page.locator(".edition").innerText(),
      /LA \+ Orange County/i,
    );
    assert.equal(
      await page.locator("#coverage-count").innerText(),
      `${dataMetadata.total} researched spots · LA + Orange County`,
    );
    assert.match(
      await page.locator(".coverage-details").textContent(),
      /Coverage is incomplete/,
    );
    assert.ok(await page.locator(".edition").isVisible());
    assert.equal(await page.locator(".result-card > .score-label").count(), 0);
    assert.ok(
      (await page.locator("#results .venue-details .score-label").count()) > 0,
    );
    assert.ok((await page.locator("#results .venue-media").count()) > 0);
    assert.equal(
      await page.locator("#results .score-label").first().isVisible(),
      false,
    );
    const strip = await page.locator("#request-form").boundingBox();
    assert.ok(
      strip.width > 1000,
      "Desktop search spans the guide, not a sidebar",
    );
    assert.equal(
      await page
        .locator("#results")
        .evaluate(
          (el) => getComputedStyle(el).gridTemplateColumns.split(" ").length,
        ),
      3,
    );
    const fallback = page.locator(
      '#results [data-venue-id="far-bar"] .venue-media',
    );
    assert.ok(await fallback.locator(".media-fallback").isVisible());
    assert.equal(await fallback.locator("img").count(), 0);
    assert.ok(
      await page
        .getByRole("combobox", { name: "Search near", exact: true })
        .isVisible(),
    );
    assert.equal(await page.locator("[name=neighborhood]").count(), 0);
    assert.match(
      await page.locator("#coverage-count").innerText(),
      new RegExp(`^${dataMetadata.total} researched spots`),
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
    for (const image of await page.locator("#results .venue-media img").all()) {
      await image.scrollIntoViewIfNeeded();
      await image.evaluate((img) => img.decode());
      assert.ok(await image.evaluate((img) => img.naturalWidth > 0));
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: "test-results/desktop.png", fullPage: true });
    await page.screenshot({
      path: "test-results/normal-photos-desktop.png",
      fullPage: true,
    });
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
    assert.equal(await page.locator("[name=requireFood]").isChecked(), true);
    assert.equal(await page.locator("[name=requireDrinks]").isChecked(), true);
    assert.equal(
      await page.locator("#results .result-card").count(),
      0,
      "Unconfirmed sushi does not return unrelated primary results",
    );
    await page.locator("[name=foodPreferences]").fill("seafood");
    assert.ok(
      (await page.locator("#results .result-card").count()) > 0,
      "Confirmed seafood and wine return matching results",
    );
    await page.locator("[name=drinkPreferences]").fill("not-a-real-drink");
    assert.equal(
      await page.locator("#results .result-card").count(),
      0,
      "Drink edits filter actual results too",
    );
    await page.getByLabel("Drink is a must-have", { exact: true }).uncheck();
    assert.ok(
      (await page.locator("#results .result-card").count()) > 0,
      "Soft preference is still an explicit opt-out",
    );
    await page.locator("[name=drinkPreferences]").fill("wine");
    assert.equal(await page.locator("[name=requireDrinks]").isChecked(), true);
    await page.locator("[name=foodPreferences]").fill("");
    await page.locator("[name=drinkPreferences]").fill("");
    assert.equal(await page.locator("[name=requireFood]").isChecked(), false);
    assert.equal(await page.locator("[name=requireDrinks]").isChecked(), false);
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
    await page.locator("#origin").selectOption("burbank");
    const inkwell = page.locator(
      '#results [data-venue-id="inkwell-tavern-burbank"]',
    );
    assert.match(
      await inkwell.locator(".listed-specials").innerText(),
      /\$2 off beer, wine, cocktails and appetizers/,
    );
    assert.equal(
      await inkwell
        .locator(".listed-specials a[href='https://inkwelltavern.com/']")
        .count(),
      1,
    );
    assert.match(await inkwell.locator(".price").innerText(), /Price unknown/);
    await inkwell.screenshot({ path: "test-results/listed-specials.png" });
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
    assert.equal(
      await page.locator("#contenders-tray [data-remove]").count(),
      3,
    );
    assert.ok(
      await page.locator('#contenders-tray a[href="#shortlist"]').isVisible(),
    );
    assert.equal(await page.locator("#comparison .comparison-item").count(), 3);
    await page.reload();
    await page.locator("#comparison .comparison-item").first().waitFor();
    assert.equal(await page.locator("#comparison .comparison-item").count(), 3);
    await page
      .locator("#contenders-tray")
      .screenshot({ path: "test-results/contenders-tray.png" });
    await page.locator("#theme-toggle").click();
    assert.equal(
      await page.evaluate(() => document.documentElement.style.colorScheme),
      "dark",
    );
    const trayRemove = page.locator("#contenders-tray [data-remove]").first();
    await trayRemove.hover();
    const hoverContrast = await trayRemove.evaluate((button) => {
      const style = getComputedStyle(button);
      const icon = getComputedStyle(button.querySelector("svg"));
      const luminance = (color) => {
        const channels = color
          .match(/[\d.]+/g)
          .slice(0, 3)
          .map(Number)
          .map((value) => {
            const s = value / 255;
            return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
          });
        return (
          channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
        );
      };
      const contrast = (foreground) => {
        const a = luminance(foreground),
          b = luminance(style.backgroundColor);
        return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      };
      return {
        foreground: style.color,
        iconStroke: icon.stroke,
        background: style.backgroundColor,
        foregroundRatio: contrast(style.color),
        iconRatio: contrast(icon.stroke),
      };
    });
    console.log("Dark tray hover contrast:", JSON.stringify(hoverContrast));
    assert.ok(
      hoverContrast.foregroundRatio >= 3 && hoverContrast.iconRatio >= 3,
      `Dark tray removal hover must meet 3:1 non-text contrast: ${JSON.stringify(hoverContrast)}`,
    );
    await page
      .locator("#contenders-tray")
      .screenshot({ path: "test-results/dark-tray-hover.png" });
    await page.mouse.move(0, 0);
    const focusContrast = [];
    const trayControls = await page
      .locator("#contenders-tray :is(button, a)")
      .count();
    for (
      let tabs = 0;
      tabs < 500 && focusContrast.length < trayControls;
      tabs++
    ) {
      await page.keyboard.press("Tab");
      const indicator = await page.evaluate(() => {
        const control = document.activeElement;
        if (!control.matches("#contenders-tray :is(button, a)")) return null;
        const style = getComputedStyle(control);
        const background = getComputedStyle(
          control.closest("#contenders-tray"),
        ).backgroundColor;
        const luminance = (color) => {
          const [r, g, b] = color
            .match(/[\d.]+/g)
            .slice(0, 3)
            .map(Number)
            .map((value) => {
              const s = value / 255;
              return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
            });
          return r * 0.2126 + g * 0.7152 + b * 0.0722;
        };
        const a = luminance(style.outlineColor),
          b = luminance(background);
        return {
          label:
            control.getAttribute("aria-label") || control.textContent.trim(),
          focusVisible: control.matches(":focus-visible"),
          outlineStyle: style.outlineStyle,
          outlineWidth: style.outlineWidth,
          outlineOffset: style.outlineOffset,
          outlineColor: style.outlineColor,
          background,
          ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
        };
      });
      if (indicator) focusContrast.push(indicator);
    }
    console.log(
      "Dark tray keyboard focus contrast:",
      JSON.stringify(focusContrast),
    );
    assert.equal(
      trayControls,
      4,
      "Three removal buttons and Compare all are covered",
    );
    assert.equal(
      new Set(focusContrast.map((item) => item.label)).size,
      trayControls,
    );
    for (const indicator of focusContrast) {
      assert.ok(
        indicator.focusVisible &&
          indicator.outlineStyle === "solid" &&
          parseFloat(indicator.outlineWidth) >= 2 &&
          parseFloat(indicator.outlineOffset) > 0 &&
          indicator.ratio >= 3,
        `Dark tray keyboard focus must have a visible outline with >=3:1 contrast: ${JSON.stringify(indicator)}`,
      );
    }
    await page
      .locator("#contenders-tray")
      .screenshot({ path: "test-results/dark-tray-focus.png" });
    await page.locator("#theme-toggle").click();
    await page.locator("#contenders-tray [data-remove]").first().click();
    assert.equal(await page.locator("#tray-count").innerText(), "2 / 3 spots");
    assert.equal(await page.locator("#comparison .comparison-item").count(), 2);
    assert.equal(
      await page.evaluate(() => document.activeElement.id),
      "clear-shortlist",
    );
    await page
      .locator('#results [data-save][aria-pressed="false"]')
      .first()
      .click();
    assert.equal(await page.locator("#tray-count").innerText(), "3 / 3 spots");
    await page.locator("#comparison [data-remove]").first().click();
    assert.equal(await page.locator("#shortlist-count").innerText(), "2");
    if (!((await page.locator("#more-filters").getAttribute("open")) !== null))
      await page.locator("#more-filters > summary").click();
    const requestValues = async () =>
      Promise.all(
        ["[name=time]", "[name=maxDistance]", "#budget"].map((selector) =>
          page.locator(selector).inputValue(),
        ),
      );
    const originalRequest = await requestValues();
    await page.locator("[name=foodPreferences]").fill("not-a-real-dish");
    await page.getByLabel("Food is a must-have", { exact: true }).check();
    assert.equal(await page.locator("#results .empty-state").count(), 1);
    const alternatives = page.locator("#alternatives");
    assert.equal(
      await alternatives.getAttribute("open"),
      "",
      "No-match search automatically opens alternatives",
    );
    assert.ok(
      await page
        .locator("#alternative-results .result-card")
        .first()
        .isVisible(),
    );
    assert.ok(
      await page
        .locator("#alternative-results .failure-reason")
        .first()
        .isVisible(),
    );
    assert.match(
      await page.locator("#alternatives-title").innerText(),
      /^Other spots to consider \(\d+\)$/,
    );
    assert.equal(
      await page.locator("[name=foodPreferences]").inputValue(),
      "not-a-real-dish",
    );
    assert.deepEqual(
      await requestValues(),
      originalRequest,
      "Alternatives do not relax the request",
    );
    assert.ok(
      (await page.locator("#alternative-results .failure-reason").count()) > 0,
    );
    await page.screenshot({
      path: "test-results/no-match-alternatives.png",
      fullPage: true,
    });
    await page.locator("#alternatives > summary").click();
    await page.locator("#sort").selectOption("distance");
    assert.equal(
      await alternatives.getAttribute("open"),
      null,
      "Sort preserves manual collapse",
    );
    // Exercise the save render while the disclosure is closed, without reopening it.
    await page
      .locator("#alternative-results [data-save]")
      .first()
      .dispatchEvent("click");
    assert.equal(
      await alternatives.getAttribute("open"),
      null,
      "Save preserves manual collapse",
    );
    await page.getByRole("button", { name: "Find spots", exact: true }).click();
    assert.equal(
      await alternatives.getAttribute("open"),
      "",
      "Fresh no-match search reopens alternatives",
    );
    await page.getByLabel("Food is a must-have", { exact: true }).uncheck();
    await page.locator("[name=foodPreferences]").fill("");
    await page.getByRole("button", { name: "Find spots", exact: true }).click();
    assert.equal(
      await alternatives.getAttribute("open"),
      null,
      "Exact matches keep alternatives separate and closed",
    );
    await page.locator("#results .venue-details > summary").first().click();
    assert.ok(
      await page.locator("#results .source-list a").first().isVisible(),
    );
    const bounds = [];
    await page
      .locator("#results .result-card")
      .first()
      .screenshot({ path: "test-results/expanded-details.png" });
    assert.ok(await page.locator("#results .score-label").first().isVisible());
    const invalidBudgetCount = await page.locator("#result-count").innerText();
    await page.locator("#budget").fill("");
    await page.locator("button[type=submit]").click();
    assert.equal(
      await page.locator("#budget").evaluate((el) => el.validity.valid),
      false,
    );
    assert.equal(
      await page.locator("#result-count").innerText(),
      invalidBudgetCount,
    );
    await page.locator("#budget").fill("25");
    await page.locator("#budget").blur();
    for (const width of [1440, 1280, 1060, 736, 390, 320]) {
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
      if (width === 736)
        await page.screenshot({
          path: "test-results/tablet.png",
          fullPage: true,
        });
      if (width === 390) await page.evaluate(() => window.scrollTo(0, 0));
      if (width === 390)
        await page.screenshot({
          path: "test-results/normal-photos-mobile-top.png",
          fullPage: false,
        });
      if (width === 390)
        await page.screenshot({
          path: "test-results/mobile.png",
          fullPage: false,
        });
    }
    await page.getByRole("button", { name: "Switch color theme" }).click();
    assert.equal(
      await page.evaluate(() => document.documentElement.style.colorScheme),
      "dark",
    );
    assert.equal(
      await page.evaluate(
        () => getComputedStyle(document.body).backgroundColor,
      ),
      "rgb(32, 33, 31)",
    );
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: "test-results/dark-mobile.png",
      fullPage: false,
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
        "six responsive widths",
        "theme",
        "corrupt storage",
      ],
      bounds,
      focusContrast,
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
