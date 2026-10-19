const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const { chromium } = require("playwright");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:4174/";

(async () => {
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  const errors = [],
    failedAssets = [],
    checks = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400 && response.url().startsWith(base))
      failedAssets.push(`${response.status()} ${response.url()}`);
  });
  try {
    await fs.mkdir("test-results", { recursive: true });
    await page.goto(base);
    await page.locator("#results .result-card").first().waitFor();
    await page.locator("[name=maxDistance]").selectOption("25");
    await page.locator("[name=foodPreferences]").fill("");
    await page.locator("[name=drinkPreferences]").fill("");
    const ids = () =>
      page
        .locator("#results .result-card")
        .evaluateAll((nodes) => nodes.map((node) => node.dataset.venueId));
    for (const day of [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ]) {
      await page.locator("[name=day]").selectOption(day);
      for (const time of ["04:00", "16:30", "17:30", "22:30"]) {
        await page.locator("[name=time]").fill(time);
        await page.locator("[name=time]").dispatchEvent("change");
        assert.match(
          await page.locator("#results-title").innerText(),
          new RegExp(day),
        );
        if (time === "04:00")
          assert.equal(await page.locator("#results .result-card").count(), 0);
        for (const sort of ["match", "budget", "price", "distance"]) {
          await page.locator("#sort").selectOption(sort);
          let values;
          if (sort === "match")
            values = (
              await page.locator("#results .score-label").allTextContents()
            ).map((s) => -Number(s.match(/\d+/)[0]));
          else if (sort === "distance")
            values = (
              await page.locator("#results .venue-meta").allTextContents()
            ).map((s) => Number(s.match(/([\d.]+) mi/)[1]));
          else
            values = (
              await page.locator("#results .combo-total").allTextContents()
            ).map((s) => {
              if (s.includes("Price unknown")) return Infinity;
              const total = Number(s.match(/\$([\d.]+)/)[1]);
              return sort === "price" ? total : Math.abs(total - Number(25));
            });
          assert.deepEqual(
            values,
            [...values].sort((a, b) => a - b),
            `${day} ${time} ${sort}`,
          );
          const current = await ids();
          assert.equal(new Set(current).size, current.length);
          checks.push(`${day} ${time} ${sort}`);
        }
      }
    }
    await page.locator("[name=day]").selectOption("Thursday");
    await page.locator("[name=time]").fill("16:30");
    await page.locator("[name=time]").dispatchEvent("change");
    await page.locator("#sort").selectOption("budget");
    for (const budget of [1, 5, 25, 100, 250, 500]) {
      await page.locator("#budget").fill(String(budget));
      assert.equal(
        await page.locator("#budget-slider").inputValue(),
        String(budget),
      );
      const totals = (
        await page.locator("#results .price").allTextContents()
      ).map((s) =>
        s.startsWith("$") ? Math.abs(Number(s.slice(1)) - budget) : Infinity,
      );
      assert.ok(
        totals.filter(Number.isFinite).length >= 3,
        "Budget sort covers multiple real priced results",
      );
      assert.deepEqual(
        totals,
        [...totals].sort((a, b) => a - b),
      );
      checks.push(`budget ${budget}`);
    }
    for (const preset of ["tacos", "wine", "pasadena"]) {
      await page.locator("#preset-select").selectOption(preset);
      await page.locator("#preset-select").selectOption("");
      assert.ok(await page.locator("[name=foodPreferences]").isVisible());
      await page.locator("[name=foodPreferences]").fill("sushi, seafood");
      assert.match(await page.locator("#active-filters").innerText(), /sushi/);
      checks.push(`custom after ${preset}`);
    }
    await page
      .locator("[name=foodPreferences]")
      .fill('<img src=x onerror="alert(1)">');
    assert.equal(await page.locator("#active-filters img").count(), 0);
    await page.locator("[name=foodPreferences]").fill("seafood");
    await page.locator("#preset-select").selectOption("pasadena");
    await page.locator("[name=maxDistance]").selectOption("25");
    await page.locator("#show-more").click();
    const before = await ids();
    assert.ok(before.length > 8, "Pagination expands real results");
    await page.locator("#sort").selectOption("distance");
    assert.equal((await ids()).length, before.length);
    await page.getByRole("button", { name: "Switch color theme" }).click();
    for (const width of [1440, 1024, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      const layout = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
        outside: [...document.querySelectorAll("body *")]
          .filter((el) => {
            const r = el.getBoundingClientRect();
            return r.width > 0 && r.right > innerWidth + 1;
          })
          .slice(0, 15)
          .map((el) => ({
            tag: el.tagName,
            class: el.className,
            right: el.getBoundingClientRect().right,
          })),
        unlabeled: [
          ...document.querySelectorAll(
            "input:not([type=hidden]),select,button",
          ),
        ]
          .filter((el) => {
            if (!el.getClientRects().length) return false;
            return (
              !el.getAttribute("aria-label") &&
              !el.getAttribute("aria-labelledby") &&
              !el.labels?.length &&
              !el.textContent.trim()
            );
          })
          .map((el) => el.id || el.name),
      }));
      await page.screenshot({
        path: `test-results/qa-${width}.png`,
        fullPage: true,
      });
      assert.equal(
        layout.overflow,
        false,
        `Layout ${width}: ${JSON.stringify(layout.outside)}`,
      );
      assert.deepEqual(layout.unlabeled, [], `Control labels ${width}`);
      await page.screenshot({
        path: `test-results/qa-${width}.png`,
        fullPage: false,
      });
      checks.push(`layout ${width}`);
    }
    assert.deepEqual(errors, []);
    assert.deepEqual(failedAssets, []);
    const report = {
      base,
      passed: true,
      checks: checks.length,
      errors,
      failedAssets,
    };
    await fs.writeFile(
      "test-results/qa-report.json",
      JSON.stringify(report, null, 2),
    );
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
