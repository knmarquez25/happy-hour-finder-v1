import test from "node:test";
import assert from "node:assert/strict";
import { searchPlaces } from "../server/search.js";
import { normalizeCandidate, candidateToVenue } from "../src/candidates.js";
const text =
  "New Bistro in Pasadena has a happy hour IKI martini for $10, weekdays 4–6pm.";
const candidate = {
  name: "New Bistro",
  location: "Pasadena",
  county: "LA County",
  address: "123 Main St, Pasadena, CA",
  items: [{ name: "IKI martini", kind: "drink", priceCents: 1000 }],
  hoursText: "Weekdays 4–6pm",
  sourceUrl: "https://example.com/happy-hour",
  evidence: text,
};
function grounded() {
  return {
    results: [
      {
        url: candidate.sourceUrl,
        title: "New Bistro Pasadena Happy Hour",
        content: text,
      },
    ],
  };
}
function fetcher(extracted = candidate, first = grounded()) {
  let n = 0;
  return async (url, options) => {
    const body = JSON.parse(options.body);
    if (n++ === 0) {
      assert.equal(url, "https://api.tavily.com/search");
      assert.equal(body.search_depth, "basic");
      assert.equal(body.auto_parameters, false);
      return { ok: true, json: async () => first };
    }
    assert.match(url, /gemini-3.5-flash-lite/);
    return {
      ok: true,
      json: async () => ({
        candidates: [
          {
            finishReason: "STOP",
            content: {
              parts: [{ text: JSON.stringify({ candidates: [extracted] }) }],
            },
          },
        ],
      }),
    };
  };
}
test("grounded discovery preserves a cited happy-hour item and unknown price", async () => {
  const c = {
    ...candidate,
    items: [{ ...candidate.items[0], priceCents: null }],
  };
  const result = await searchPlaces("martinis", {
    apiKey: "test",
    searchKey: "search-test",
    fetchImpl: fetcher(c),
  });
  assert.equal(result.candidates.length, 1);
  assert.equal(result.candidates[0].items[0].priceCents, null);
  assert.equal(result.candidates[0].status, undefined);
  assert.equal(result.provider, "Tavily");
});
test("uncited source, unrelated evidence and invalid prices cannot enter discovery", async () => {
  for (const bad of [
    { ...candidate, sourceUrl: "https://unlisted.example/menu" },
    { ...candidate, evidence: "Happy hour pizza elsewhere" },
    { ...candidate, items: [{ ...candidate.items[0], priceCents: -1 }] },
  ]) {
    const result = await searchPlaces("martini", {
      apiKey: "test",
      searchKey: "search-test",
      fetchImpl: fetcher(bad),
    });
    assert.deepEqual(result.candidates, []);
  }
});
test("search fails clearly without a key, quota or real citations", async () => {
  await assert.rejects(searchPlaces("martinis", { apiKey: "" }), /configured/i);
  await assert.rejects(
    searchPlaces("martinis", {
      apiKey: "test",
      searchKey: "search-test",
      fetchImpl: async () => ({ ok: false, status: 429 }),
    }),
    /free.*search|quota/i,
  );
  await assert.rejects(
    searchPlaces("martini", {
      apiKey: "test",
      searchKey: "search-test",
      fetchImpl: fetcher(candidate, {
        candidates: [{ finishReason: "STOP", content: { parts: [{ text }] } }],
      }),
    }),
    /cited|sources/i,
  );
});
test("candidate validator rejects unsafe links and price fabrication; pending records never become venues", () => {
  assert.throws(() =>
    normalizeCandidate({ ...candidate, sourceUrl: "javascript:alert(1)" }),
  );
  assert.throws(() =>
    normalizeCandidate({
      ...candidate,
      items: [{ ...candidate.items[0], priceCents: 1.5 }],
    }),
  );
  assert.equal(
    candidateToVenue({ id: "a", status: "pending", payload: candidate }),
    null,
  );
});
test("owner approved venue keeps exact prices and explicit owner-reviewed provenance", () => {
  const approved = {
    ...candidate,
    hours: [
      {
        days: ["Friday"],
        start: "16:00",
        end: "18:00",
        restriction: "bar-only",
      },
    ],
    restaurantSourceConfirmed: true,
  };
  const venue = candidateToVenue({
    id: "a",
    status: "approved",
    approved_payload: approved,
    reviewed_at: "2026-10-25T12:00:00Z",
  });
  assert.equal(venue.menu[0].priceCents, 1000);
  assert.match(venue.sources[0].note, /owner/i);
  assert.equal(venue.hours[0].restriction, "bar-only");
});
test("approved Orange County menus match their county and food/drink combo preferences", async () => {
  const { discover, emptyPreferences } = await import("../src/discovery.js");
  const payload = {
    ...candidate,
    name: "New Irvine Bistro",
    location: "Irvine",
    county: "Orange County",
    items: [
      { name: "Two tacos", kind: "food", priceCents: 700 },
      { name: "Draft beer", kind: "drink", priceCents: 500 },
    ],
    hours: [
      { days: ["Friday"], start: "16:00", end: "18:00", restriction: "none" },
    ],
    restaurantSourceConfirmed: true,
  };
  const venue = candidateToVenue({
    id: "oc",
    status: "approved",
    approved_payload: payload,
    reviewed_at: "2026-10-26T12:00:00Z",
  });
  assert.equal(
    discover([venue], { ...emptyPreferences(), area: "Orange County" }).length,
    1,
  );
  assert.equal(
    discover([venue], { ...emptyPreferences(), area: "LA County" }).length,
    0,
  );
  assert.equal(
    discover([venue], {
      ...emptyPreferences(),
      foodPreferences: ["tacos"],
      drinkPreferences: ["beer"],
    })[0].combo.totalCents,
    1200,
  );
});
test("free basic Tavily search supplies literal source passages without Google grounding", async () => {
  let calls = 0;
  const result = await searchPlaces("martinis", {
    apiKey: "gemini-test",
    searchKey: "tavily-test",
    fetchImpl: async (url, options) => {
      const body = JSON.parse(options.body);
      if (calls++ === 0) {
        assert.equal(url, "https://api.tavily.com/search");
        assert.equal(options.headers.Authorization, "Bearer tavily-test");
        assert.equal(body.search_depth, "basic");
        assert.equal(body.auto_parameters, false);
        return {
          ok: true,
          json: async () => ({
            results: [
              {
                title: "New Bistro Pasadena Happy Hour",
                url: candidate.sourceUrl,
                content: text,
              },
            ],
          }),
        };
      }
      assert.equal(body.tools, undefined);
      return {
        ok: true,
        json: async () => ({
          candidates: [
            {
              finishReason: "STOP",
              content: {
                parts: [{ text: JSON.stringify({ candidates: [candidate] }) }],
              },
            },
          ],
        }),
      };
    },
  });
  assert.equal(result.candidates.length, 1);
  assert.equal(result.provider, "Tavily");
  assert.equal(calls, 2);
});
