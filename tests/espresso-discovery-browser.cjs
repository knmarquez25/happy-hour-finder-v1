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
    const records = [
      make("generic", "Generic Bar", "Martinis"),
      make("exact", "Exact Bar", "Espresso Martini"),
      make("other", "Other Bar", "Vodka Martini"),
    ];
    let web = 0;
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
      r.fulfill({ json: { configured: true } }),
    );
    await page.route("**/api/reviews", (r) => r.fulfill({ json: { records } }));
    await page.route("**/api/explore", (r) => {
      web++;
      return web === 1
        ? r.fulfill({ json: { saved: true, records, candidates: [] } })
        : r.fulfill({
            status: 503,
            json: { error: "Search unavailable. Please try later." },
          });
    });
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    await page.locator('[data-review-id="generic"]').waitFor();
    await page.locator("#filter-drink").fill("espresso martini");
    await page.locator("#pending-tab").click();
    assert.deepEqual(
      await page.locator("#pending-results article h3").allTextContents(),
      ["Exact Bar", "Generic Bar"],
    );
    assert.match(
      await page.locator('[data-review-id="exact"]').textContent(),
      /Espresso Martini listed/,
    );
    assert.match(
      await page.locator('[data-review-id="generic"]').textContent(),
      /Possible match.*Martinis listed/,
    );
    assert.match(
      await page.locator('[data-review-id="generic"]').textContent(),
      /espresso martini needs confirmation/i,
    );
    assert.equal(web, 0);
    await page.locator("#find-online").click();
    await page.waitForFunction(
      () => !document.querySelector("#find-online").disabled,
    );
    assert.deepEqual(
      await page.locator("#pending-results article h3").allTextContents(),
      ["Exact Bar", "Generic Bar"],
    );
    assert.match(
      await page.locator("#discovery-status").innerText(),
      /No new places found/,
    );
    await page.locator("#find-online").click();
    await page.waitForFunction(
      () => !document.querySelector("#find-online").disabled,
    );
    assert.match(
      await page.locator("#discovery-status").innerText(),
      /Search unavailable/,
    );
    assert.equal(await page.locator("#pending-results article").count(), 2);
    console.log(
      "PASS: exact and possible saved matches appear immediately, sort and label correctly, and survive empty/failed web searches.",
    );
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
