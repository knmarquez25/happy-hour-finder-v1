const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
(async () => {
  const server = http.createServer(async (req, res) => {
    try {
      const filename = new URL(req.url, "http://localhost").pathname;
      const file = filename === "/" ? "index.html" : filename.slice(1);
      res.setHeader(
        "Content-Type",
        file.endsWith(".js")
          ? "text/javascript"
          : file.endsWith(".css")
            ? "text/css"
            : file.endsWith(".html")
              ? "text/html"
              : "application/octet-stream",
      );
      res.end(await fs.readFile(path.join(__dirname, "..", file)));
    } catch {
      res.writeHead(404).end();
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    const page = await browser.newPage();
    const make = (id, name, item) => ({
      id,
      status: "pending",
      payload: {
        name,
        location: "Downey",
        county: "LA County",
        sourceUrl: "https://example.com/menu",
        evidence: "Happy hour menu",
        items: [{ name: item, kind: "drink", priceCents: null }],
      },
    });
    let records = [
      make("generic", "Generic Bar", "Martinis"),
      make("exact", "Exact Bar", "Espresso Martini"),
    ];
    let responses = [];
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
      r.fulfill({
        json: { configured: true, menuLookup: true, menuPersistence: true },
      }),
    );
    await page.route("**/api/reviews", (r) => r.fulfill({ json: { records } }));
    await page.route("**/api/explore", (r) => r.fulfill(responses.shift()));
    await page.route("**/api/reviews/generic/menu", (r) =>
      r.fulfill({
        json: {
          candidate: {
            ...records[0].payload,
            items: [
              { name: "Espresso Martini", kind: "drink", priceCents: null },
            ],
          },
          checkedAt: new Date().toISOString(),
          notice: "Needs verification",
        },
      }),
    );
    const url = `http://127.0.0.1:${server.address().port}`;
    await page.goto(url);
    await page.locator('[data-review-id="generic"]').waitFor();
    await page.locator("#filter-drink").fill("espresso martini");
    await page.locator("#pending-tab").click();
    await page.locator('[data-review-id="generic"] [data-load-menu]').click();
    await page.waitForFunction(
      () =>
        !document.querySelector('[data-review-id="generic"] [data-load-menu]'),
    );
    await page
      .locator('[data-review-id="generic"] .match-reasons')
      .scrollIntoViewIfNeeded();
    assert.match(
      await page
        .locator('[data-review-id="generic"] .match-reasons')
        .innerText(),
      /^Espresso Martini listed$/,
      "A fresh exact menu must replace the old possible-match label",
    );
    assert.deepEqual(
      await page.locator("#pending-results article h3").allTextContents(),
      ["Generic Bar", "Exact Bar"],
      "A newly exact match must rejoin the exact matches in normal record order",
    );
    console.log("PASS: menu refresh updates match labels and ordering.");

    records[0].menu_lookup = {
      candidate: {
        ...records[0].payload,
        items: [{ name: "Wine", kind: "drink", priceCents: null }],
      },
      checkedAt: new Date().toISOString(),
      notice: "Updated saved menu",
    };
    await page.locator("#refresh-reviews").click();
    await page.waitForFunction(
      () =>
        document.querySelector("#discovery-status").textContent ===
        "Review queue refreshed.",
    );
    assert.deepEqual(
      await page.locator("#pending-results article h3").allTextContents(),
      ["Exact Bar"],
      "Refreshing the shared queue must use its current menu, not a stale menu in memory",
    );
    console.log(
      "PASS: shared queue refresh replaces the previous in-memory menu.",
    );

    records = [];
    await page.goto(url);
    await page.waitForFunction(() =>
      document.querySelector("#pending-results .empty-state"),
    );
    await page.locator("#filter-drink").fill("espresso martini");
    await page.locator("#pending-tab").click();
    responses = [
      {
        json: {
          saved: false,
          candidates: [
            make("first", "First Unsaved Bar", "Espresso Martini").payload,
          ],
        },
      },
    ];
    await page.locator("#find-online").click();
    await page.waitForFunction(
      () => !document.querySelector("#find-online").disabled,
    );
    assert.deepEqual(
      await page.locator("#pending-results article h3").allTextContents(),
      ["First Unsaved Bar"],
    );
    responses = [{ status: 503, json: { error: "Search unavailable" } }];
    await page.locator("#find-online").click();
    await page.waitForFunction(
      () => !document.querySelector("#find-online").disabled,
    );
    assert.deepEqual(
      await page.locator("#pending-results article h3").allTextContents(),
      ["First Unsaved Bar"],
      "A failed retry must not erase unsaved discoveries",
    );
    responses = [
      {
        json: {
          saved: false,
          candidates: [
            make("second", "Second Unsaved Bar", "Espresso Martini").payload,
          ],
        },
      },
    ];
    await page.locator("#find-online").click();
    await page.waitForFunction(
      () => !document.querySelector("#find-online").disabled,
    );
    assert.deepEqual(
      await page.locator("#pending-results article h3").allTextContents(),
      ["First Unsaved Bar", "Second Unsaved Bar"],
      "Later discoveries must add to session results",
    );
    responses = [
      {
        json: {
          saved: true,
          records: [make("saved", "First Unsaved Bar", "Espresso Martini")],
          candidates: [],
        },
      },
    ];
    await page.locator("#find-online").click();
    await page.waitForFunction(
      () => !document.querySelector("#find-online").disabled,
    );
    assert.deepEqual(
      await page.locator("#pending-results article h3").allTextContents(),
      ["First Unsaved Bar", "Second Unsaved Bar"],
      "A place saved later must replace its unsaved copy without dropping other session results",
    );
    console.log(
      "PASS: failed retries, new searches, and later saves preserve and deduplicate session discoveries.",
    );
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
