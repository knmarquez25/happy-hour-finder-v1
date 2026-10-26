import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../server/http.js";
const id = "11111111-1111-4111-8111-111111111111";
async function server(options, run) {
  const app = createApp(options);
  await new Promise((r) => app.listen(0, "127.0.0.1", r));
  try {
    await run(`http://127.0.0.1:${app.address().port}`);
  } finally {
    await new Promise((r) => app.close(r));
  }
}
test("new discovery saves only server-search results and exposes pending records separately", async () => {
  const candidate = { name: "New place" };
  let saved;
  const reviewStore = {
    configured: true,
    publicConfig: () => ({
      configured: true,
      url: "https://test.supabase.co",
      anonKey: "public",
    }),
    list: async () => [{ id, status: "pending", payload: candidate }],
    save: async (c) => {
      saved = c;
      return [{ id, status: "pending", payload: candidate }];
    },
  };
  await server(
    {
      apiKey: "test",
      reviewStore,
      searchImpl: async () => ({
        candidates: [candidate],
        searchEntryHtml: "",
      }),
    },
    async (base) => {
      const r = await fetch(base + "/api/explore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: "martini" }),
      });
      assert.equal(r.status, 200);
      const result = await r.json();
      assert.equal(result.saved, true);
      assert.deepEqual(saved, [candidate]);
      assert.equal(result.records[0].status, "pending");
      assert.equal((await fetch(base + "/api/reviews")).status, 200);
    },
  );
});
test("shared queue failure is visible; public browser origin cannot grant owner approval", async () => {
  let called = false;
  const reviewStore = {
    configured: false,
    publicConfig: () => ({ configured: false }),
    list: async () => {
      throw Object.assign(Error("Queue not configured"), { status: 503 });
    },
    decide: async () => {
      called = true;
      throw Object.assign(Error("Owner required"), { status: 401 });
    },
  };
  await server(
    {
      apiKey: "test",
      reviewStore,
      allowedOrigins: ["https://knmarquez25.github.io"],
    },
    async (base) => {
      assert.equal((await fetch(base + "/api/reviews")).status, 503);
      const r = await fetch(base + `/api/reviews/${id}/decision`, {
        method: "POST",
        headers: {
          Origin: "https://knmarquez25.github.io",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "approved", payload: {} }),
      });
      assert.equal(r.status, 401);
      assert.equal(called, true);
      assert.equal(
        r.headers.get("access-control-allow-origin"),
        "https://knmarquez25.github.io",
      );
    },
  );
});
test("review endpoints enforce body allowlists and reject foreign-origin preflight", async () => {
  await server({ apiKey: "test" }, async (base) => {
    const r = await fetch(base + "/api/explore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "martini", status: "approved" }),
    });
    assert.equal(r.status, 400);
    const cors = await fetch(base + `/api/reviews/${id}/decision`, {
      method: "OPTIONS",
      headers: {
        Origin: "https://other.example",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "authorization,content-type",
      },
    });
    assert.equal(cors.status, 403);
  });
});
