import test from "node:test";
import assert from "node:assert/strict";
import { createReviewStore } from "../server/reviews.js";
const id = "11111111-1111-4111-8111-111111111111",
  owner = "22222222-2222-4222-8222-222222222222";
const payload = {
  name: "New Bistro",
  location: "Pasadena",
  county: "LA County",
  address: "Main St, Pasadena",
  hoursText: "Friday 4–6pm",
  sourceUrl: "https://example.com/menu",
  evidence: "New Bistro Pasadena happy hour has a martini.",
  items: [{ name: "Martini", kind: "drink", priceCents: null }],
};
const config = {
  url: "https://test.supabase.co",
  anonKey: "public-test",
  serviceKey: "private-test",
  ownerId: owner,
};
test("missing durable storage fails explicitly", async () => {
  await assert.rejects(createReviewStore().list(), /configured/i);
});
test("save writes server candidates pending without copying approval fields", async () => {
  const store = createReviewStore({
    ...config,
    fetchImpl: async (url, o) => {
      const body = JSON.parse(o.body);
      assert.equal(body[0].status, "pending");
      assert.equal(body[0].approved_payload, undefined);
      assert.equal(body[0].reviewed_by, undefined);
      assert.equal(o.headers.Authorization, "Bearer private-test");
      return { ok: true, json: async () => [] };
    },
  });
  await store.save([{ ...payload, status: "approved", reviewed_by: owner }]);
});
test("owner identity is checked remotely; a foreign token cannot approve", async () => {
  let calls = 0;
  const store = createReviewStore({
    ...config,
    fetchImpl: async () => {
      calls++;
      return { ok: true, json: async () => ({ id: "not-owner" }) };
    },
  });
  await assert.rejects(
    store.decide(id, { status: "approved", payload }, "foreign"),
    /owner/i,
  );
  assert.equal(calls, 1);
});
test("owner approval validates and atomically snapshots reviewed menu while preserving original evidence", async () => {
  let calls = 0;
  const store = createReviewStore({
    ...config,
    fetchImpl: async (url, o) => {
      if (calls++ === 0) return { ok: true, json: async () => ({ id: owner }) };
      assert.match(url, /status=eq.pending/);
      const b = JSON.parse(o.body);
      assert.equal(b.payload, undefined);
      assert.equal(b.approved_payload.items[0].priceCents, null);
      assert.equal(b.reviewed_by, owner);
      return { ok: true, json: async () => [{ id, ...b }] };
    },
  });
  const result = await store.decide(
    id,
    {
      status: "approved",
      payload: {
        ...payload,
        restaurantSourceConfirmed: true,
        hours: [
          {
            days: ["Friday"],
            start: "16:00",
            end: "18:00",
            restriction: "none",
          },
        ],
      },
    },
    "owner-token",
  );
  assert.equal(result.status, "approved");
});
test("community evidence appends separately and cannot change publication", async () => {
  const store = createReviewStore({
    ...config,
    fetchImpl: async (url, o) => {
      assert.match(url, /review_evidence$/);
      const b = JSON.parse(o.body);
      assert.deepEqual(Object.keys(b).sort(), [
        "candidate_id",
        "note",
        "source_url",
      ]);
      assert.equal(b.candidate_id, id);
      return { ok: true, json: async () => [{ id: "e" }] };
    },
  });
  await store.evidence(id, {
    sourceUrl: "https://example.com/menu",
    note: "Martini is listed under happy hour",
    status: "approved",
  });
});
test("duplicate decisions fail rather than overwriting another review; unsafe evidence links rejected", async () => {
  const store = createReviewStore({
    ...config,
    fetchImpl: async (url) => ({
      ok: true,
      json: async () => (url.includes("/auth/") ? { id: owner } : []),
    }),
  });
  await assert.rejects(
    store.decide(id, { status: "rejected" }, "token"),
    /already|changed/i,
  );
  await assert.rejects(
    store.evidence(id, { sourceUrl: "javascript:alert(1)", note: "fake" }),
  );
});
test("pending queue growth cannot hide older approved publications", async () => {
  const approved = { id: "old-approved", status: "approved" };
  const store = createReviewStore({
    ...config,
    fetchImpl: async (url) => ({
      ok: true,
      json: async () =>
        url.includes("status=eq.approved")
          ? [approved]
          : Array.from({ length: 200 }, (_, n) => ({
              id: "pending-" + n,
              status: "pending",
            })),
    }),
  });
  const rows = await store.list();
  assert.ok(rows.some((r) => r.id === "old-approved"));
  assert.equal(rows.length, 201);
});
