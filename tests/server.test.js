import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../server/http.js";
import { emptyPreferences } from "../src/discovery.js";
const providerResponse = (preferences = emptyPreferences()) => ({
  ok: true,
  json: async () => ({
    candidates: [
      {
        finishReason: "STOP",
        content: {
          role: "model",
          parts: [{ text: JSON.stringify(preferences) }],
        },
      },
    ],
  }),
});
async function withServer(options, fn) {
  const server = createApp(options);
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  try {
    await fn("http://127.0.0.1:" + server.address().port);
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
}
test("production server serves the bundled font assets with font MIME types", async () => {
  await withServer({ apiKey: "" }, async (base) => {
    for (const filename of [
      "dm-sans-400.ttf",
      "dm-sans-500.ttf",
      "dm-sans-600.ttf",
      "dm-sans-700.ttf",
      "dm-serif-display-regular.ttf",
      "dm-serif-display-italic.ttf",
    ]) {
      const response = await fetch(`${base}/src/fonts/${filename}`);
      assert.equal(response.status, 200, filename);
      assert.match(response.headers.get("content-type"), /^font\/ttf/);
      assert.ok((await response.arrayBuffer()).byteLength > 1000);
    }
    const head = await fetch(`${base}/src/fonts/dm-sans-400.ttf`, {
      method: "HEAD",
    });
    assert.equal(head.status, 200);
    assert.equal((await head.arrayBuffer()).byteLength, 0);
    assert.equal((await fetch(`${base}/src/fonts/private.env`)).status, 404);
  });
});
test("server exposes public browsing and safe status, but never repository or environment files", async () => {
  await withServer({ apiKey: "" }, async (base) => {
    assert.equal((await fetch(base)).status, 200);
    assert.deepEqual(await (await fetch(base + "/api/status")).json(), {
      configured: false,
    });
    for (const p of [
      "/.env",
      "/server/ai.js",
      "/package.json",
      "/src/../server/start.js",
      "/.git/config",
      "/research/dtla.json",
    ])
      assert.equal((await fetch(base + p)).status, 404);
    assert.equal((await fetch(base + "/src/discovery.js")).status, 200);
    const r = await fetch(base + "/api/discover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "tacos" }),
    });
    assert.equal(r.status, 503);
    assert.match((await r.json()).error, /configured/i);
  });
});
test("endpoint checks origin and body and returns actual structured preferences", async () => {
  await withServer(
    {
      apiKey: "test",
      fetchImpl: async () =>
        providerResponse({ ...emptyPreferences(), area: "Pasadena" }),
    },
    async (base) => {
      const post = (body, headers = {}) =>
        fetch(base + "/api/discover", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...headers },
          body,
        });
      assert.equal((await post("{bad")).status, 400);
      assert.equal(
        (
          await post(JSON.stringify({ query: "tacos" }), {
            Origin: "https://other.example",
          })
        ).status,
        403,
      );
      assert.equal(
        (await post(JSON.stringify({ query: "x".repeat(1001) }))).status,
        400,
      );
      const r = await post(JSON.stringify({ query: "Pasadena" }), {
        Origin: base,
      });
      assert.equal(r.status, 200);
      assert.equal((await r.json()).preferences.area, "Pasadena");
      assert.equal((await post("x".repeat(9000))).status, 413);
    },
  );
});
test("rate limiting bounds expensive calls and does not disable browsing", async () => {
  await withServer(
    {
      apiKey: "test",
      rateLimit: 1,
      fetchImpl: async () => providerResponse(),
    },
    async (base) => {
      const post = () =>
        fetch(base + "/api/discover", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: "anywhere" }),
        });
      assert.equal((await post()).status, 200);
      assert.equal((await post()).status, 429);
      assert.equal((await fetch(base)).status, 200);
    },
  );
});
test("only configured GitHub Pages origin passes CORS preflight and receives AI responses", async () => {
  await withServer(
    {
      apiKey: "test",
      allowedOrigins: ["https://knmarquez25.github.io"],
      fetchImpl: async () => providerResponse(),
    },
    async (base) => {
      const preflight = (origin) =>
        fetch(base + "/api/discover", {
          method: "OPTIONS",
          headers: {
            Origin: origin,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
          },
        });
      const pre = await preflight("https://knmarquez25.github.io");
      assert.equal(pre.status, 204);
      assert.equal(
        pre.headers.get("access-control-allow-origin"),
        "https://knmarquez25.github.io",
      );
      assert.equal(pre.headers.get("access-control-allow-credentials"), null);
      const denied = await preflight("https://evil.example");
      assert.equal(denied.status, 403);
      assert.equal(denied.headers.get("access-control-allow-origin"), null);
      const actual = await fetch(base + "/api/discover", {
        method: "POST",
        headers: {
          Origin: "https://knmarquez25.github.io",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: "anywhere" }),
      });
      assert.equal(actual.status, 200);
      assert.equal(
        actual.headers.get("access-control-allow-origin"),
        "https://knmarquez25.github.io",
      );
      assert.deepEqual((await actual.json()).preferences, emptyPreferences());
      const health = await fetch(base + "/api/status", {
        headers: { Origin: "https://knmarquez25.github.io" },
      });
      assert.equal(
        health.headers.get("access-control-allow-origin"),
        "https://knmarquez25.github.io",
      );
      const headers = await fetch(base + "/api/discover", {
        method: "OPTIONS",
        headers: {
          Origin: "https://knmarquez25.github.io",
          "Access-Control-Request-Method": "POST",
          "Access-Control-Request-Headers": "authorization",
        },
      });
      assert.equal(headers.status, 403);
    },
  );
});
test("global quota stops before a 101st provider call", async () => {
  let calls = 0;
  await withServer(
    {
      apiKey: "test",
      rateLimit: 200,
      fetchImpl: async () => {
        calls++;
        return providerResponse();
      },
    },
    async (base) => {
      for (let i = 0; i < 100; i++) {
        const r = await fetch(base + "/api/discover", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: "anywhere" }),
        });
        assert.equal(r.status, 200);
      }
      const r = await fetch(base + "/api/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: "anywhere" }),
      });
      assert.equal(r.status, 429);
      assert.equal(calls, 100);
    },
  );
});
test("concurrent quota rejects a third call while two are pending", async () => {
  const releases = [];
  let notify;
  const ready = new Promise((r) => (notify = r));
  await withServer(
    {
      apiKey: "test",
      fetchImpl: () =>
        new Promise((resolve) => {
          releases.push(() => resolve(providerResponse()));
          if (releases.length === 2) notify();
        }),
    },
    async (base) => {
      const post = () =>
        fetch(base + "/api/discover", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: "anywhere" }),
        });
      const a = post(),
        b = post();
      await ready;
      try {
        assert.equal((await post()).status, 429);
      } finally {
        releases.forEach((r) => r());
      }
      assert.equal((await a).status, 200);
      assert.equal((await b).status, 200);
    },
  );
});
