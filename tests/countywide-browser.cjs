const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:4174";

(async () => {
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  try {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base);
    await page
      .locator("#origin option[value=santa-ana]")
      .waitFor({ state: "attached" });
    const search = async (
      origin,
      day,
      time,
      food,
      drink,
      restricted = false,
    ) => {
      await page.locator("[name=originId]").selectOption(origin);
      await page.locator("[name=day]").selectOption(day);
      await page.locator("[name=time]").fill(time);
      await page.locator("[name=maxDistance]").selectOption("3");
      await page.locator("[name=foodPreferences]").fill(food);
      await page.locator("[name=drinkPreferences]").fill(drink);
      await page.locator("[name=requireFood]").setChecked(Boolean(food));
      await page.locator("[name=requireDrinks]").setChecked(Boolean(drink));
      await page.locator("[name=includeRestricted]").setChecked(restricted);
      await page.locator("button[type=submit]").click();
    };
    await search("santa-ana", "Wednesday", "16:30", "fries", "margarita");
    const chapter = page.locator(
      '#results [data-venue-id="cw-chapter-one-santa-ana"]',
    );
    await chapter.waitFor();
    assert.match(await chapter.innerText(), /\$16(?:\.00)?/);
    await search("long-beach", "Monday", "16:30", "fries", "cocktail");
    const risu = page.locator('#results [data-venue-id="cw-risu-long-beach"]');
    await risu.waitFor();
    assert.match(await risu.innerText(), /\$15(?:\.00)?/);
    await search("newport-beach", "Tuesday", "16:00", "seafood", "cocktail");
    const billys = page.locator(
      '#results [data-venue-id="cw-billys-at-the-beach-newport-beach"]',
    );
    await billys.waitFor();
    assert.match(await billys.innerText(), /\$20(?:\.00)?/);
    await search("laguna-beach", "Tuesday", "16:00", "tacos", "margarita");
    assert.equal(
      await page
        .locator('#results [data-venue-id="cw-coyote-grill-laguna-beach"]')
        .count(),
      0,
    );
    await search(
      "laguna-beach",
      "Tuesday",
      "16:00",
      "tacos",
      "margarita",
      true,
    );
    const coyote = page.locator(
      '#results [data-venue-id="cw-coyote-grill-laguna-beach"]',
    );
    await coyote.waitFor();
    assert.match(await coyote.innerText(), /\$14\.75/);
    await search("brea", "Wednesday", "16:00", "", "", true);
    const cedar = page.locator(
      '#results [data-venue-id="cw-cedar-creek-inn-brea"]',
    );
    await cedar.waitFor();
    assert.match(await cedar.innerText(), /Price unknown/);
    assert.deepEqual(errors, []);
    console.log(
      JSON.stringify(
        {
          passed: true,
          flows: [
            "Santa Ana priced combo",
            "Long Beach priced combo",
            "Newport Beach priced combo",
            "Laguna seating opt-in",
            "Brea unknown prices",
          ],
          knownLimitation:
            "Countywide coverage is incomplete; prices and hours may be unknown",
          errors,
        },
        null,
        2,
      ),
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
