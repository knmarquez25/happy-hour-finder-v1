const assert = require("node:assert/strict");
const { chromium } = require("playwright");
(async () => {
  const { createApp } = await import("../server/http.js");
  const { emptyPreferences } = await import("../src/discovery.js");
  const front = createApp({ apiKey: "" });
  await new Promise((r) => front.listen(0, "127.0.0.1", r));
  const frontUrl = "http://127.0.0.1:" + front.address().port;
  const backend = createApp({
    apiKey: "fixture-key",
    allowedOrigins: [frontUrl],
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({
        candidates: [
          {
            finishReason: "STOP",
            content: {
              role: "model",
              parts: [
                {
                  text: JSON.stringify({
                    ...emptyPreferences(),
                    area: "Pasadena",
                  }),
                },
              ],
            },
          },
        ],
      }),
    }),
  });
  await new Promise((r) => backend.listen(0, "127.0.0.1", r));
  const apiUrl = "http://127.0.0.1:" + backend.address().port;
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.route("**/src/config.js", (route) =>
      route.fulfill({
        contentType: "text/javascript",
        body: `export const apiBase=${JSON.stringify(apiUrl)};`,
      }),
    );
    await page.goto(frontUrl);
    await page.locator("#ai-helper").evaluate((el) => {
      el.open = true;
    });
    await page.getByText("AI suggestions available", { exact: true }).waitFor();
    assert.equal(await page.locator("#results article").count(), 111);
    await page.locator("#ai-helper").evaluate((el) => {
      el.open = true;
    });
    await page.getByLabel("Tell us what you’re looking for").fill("Pasadena");
    await page.getByRole("button", { name: "Use as filters" }).click();
    await page.waitForFunction(() =>
      document
        .querySelector("#interpretation")
        .textContent.includes("Pasadena"),
    );
    const count = await page.locator("#results article").count();
    assert.ok(count > 0 && count < 111);
    assert.deepEqual(errors, []);
    console.log(
      "Cross-origin browser pass: public frontend calls a separately hosted backend through real CORS/preflight; Gemini transport is a fixture.",
    );
  } finally {
    await browser.close();
    front.closeAllConnections();
    backend.closeAllConnections();
    await Promise.all([
      new Promise((r) => front.close(r)),
      new Promise((r) => backend.close(r)),
    ]);
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
