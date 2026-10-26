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
test("already approved or rejected discoveries are not reported as new pending results", async () => {
  const candidate = { name: "Previously reviewed", location: "Pasadena" };
  const reviewStore = {
    configured: true,
    list: async () => [],
    save: async () => [],
  };
  await server(
    {
      apiKey: "test",
      reviewStore,
      searchImpl: async () => ({ candidates: [candidate], provider: "Tavily" }),
    },
    async (base) => {
      const r = await fetch(base + "/api/explore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: "martinis" }),
      });
      const d = await r.json();
      assert.equal(r.status, 200);
      assert.deepEqual(d.candidates, []);
      assert.equal(d.insertedCount, 0);
    },
  );
});

test("public menu lookup persists a preview that survives an application restart", async () => {
  const payload = {
    name: "New Bistro",
    location: "Pasadena",
    county: "LA County",
    address: "",
    sourceUrl: "https://example.com/menu",
    evidence: "New Bistro Pasadena happy hour menu",
    items: [{ name: "Martini", kind: "drink", priceCents: null }],
    hoursText: null,
  };
  let searches = 0;
  const row = { id, status: "pending", payload };
  const reviewStore = {
    configured: true,
    list: async () => [row],
    saveMenu: async (savedId, candidate, notice) => {
      assert.equal(savedId, id);
      row.menu_lookup = {
        candidate,
        notice,
        checkedAt: new Date().toISOString(),
      };
      return row;
    },
  };
  const options = {
    apiKey: "test",
    reviewStore,
    searchImpl: async (query, options) => {
      searches++;
      assert.deepEqual(options.target, payload);
      assert.match(query, /New Bistro.*Pasadena/);
      return {
        candidates: [
          {
            ...payload,
            items: [
              ...payload.items,
              { name: "Fries", kind: "food", priceCents: 700 },
            ],
          },
        ],
      };
    },
  };
  for (let n = 0; n < 2; n++)
    await server(options, async (base) => {
      const r = await fetch(base + `/api/reviews/${id}/menu`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      assert.equal(r.status, 200);
      const result = await r.json();
      assert.equal(result.candidate.items.length, 2);
      const list = await (await fetch(base + "/api/reviews")).json();
      assert.equal(list.records[0].menu_lookup.candidate.items.length, 2);
      assert.equal(list.records[0].payload.items.length, 1);
      assert.equal(list.records[0].status, "pending");
      const invalid = await fetch(base + `/api/reviews/${id}/menu`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: "untrusted" }),
      });
      assert.equal(invalid.status, 400);
    });
  assert.equal(
    searches,
    1,
    "Fresh durable menu avoids another provider call after restart",
  );
});
test("menu lookup cannot search for an unknown or already reviewed record", async () => {
  await server(
    {
      reviewStore: {
        configured: true,
        list: async () => [{ id, status: "approved", payload: {} }],
      },
      searchImpl: async () => {
        throw Error("Must not call AI");
      },
    },
    async (base) => {
      const r = await fetch(base + `/api/reviews/${id}/menu`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      assert.equal(r.status, 404);
    },
  );
});
