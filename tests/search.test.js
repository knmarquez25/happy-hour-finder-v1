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
    if (url === "https://api.tavily.com/search") {
      assert.equal(url, "https://api.tavily.com/search");
      assert.ok(["basic", "advanced"].includes(body.search_depth));
      assert.equal(body.auto_parameters, false);
      assert.match(body.query, /California/);
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
              parts: [
                {
                  text: JSON.stringify({
                    candidates: [
                      {
                        ...extracted,
                        sourceIndex: extracted.sourceIndex ?? 0,
                        fragmentIndex: extracted.fragmentIndex ?? 0,
                      },
                    ],
                  }),
                },
              ],
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
  assert.equal(result.diagnostics.keptCount, 1);
  assert.equal(result.candidates.length, 1);
  assert.equal(result.candidates[0].items[0].priceCents, null);
  assert.equal(result.candidates[0].status, undefined);
  assert.equal(result.provider, "Tavily");
});
test("uncited source, unrelated evidence and invalid prices cannot enter discovery", async () => {
  for (const bad of [
    { ...candidate, sourceIndex: 99 },
    {
      ...candidate,
      items: [{ name: "Pizza", kind: "food", priceCents: null }],
    },
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
        assert.match(body.query, /Los Angeles OR Orange County/);
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
                parts: [
                  {
                    text: JSON.stringify({
                      candidates: [
                        { ...candidate, sourceIndex: 0, fragmentIndex: 0 },
                      ],
                    }),
                  },
                ],
              },
            },
          ],
        }),
      };
    },
  });
  assert.equal(result.diagnostics.keptCount, 1);
  assert.equal(result.candidates.length, 1);
  assert.equal(result.provider, "Tavily");
  assert.equal(calls, 2);
});
test("AI extraction failures are distinguished from a search-service failure", async () => {
  let calls = 0;
  await assert.rejects(
    searchPlaces("martini", {
      apiKey: "test",
      searchKey: "test",
      fetchImpl: async () =>
        ++calls === 1
          ? { ok: true, json: async () => grounded() }
          : {
              ok: false,
              status: 429,
              json: async () => ({ error: { status: "RESOURCE_EXHAUSTED" } }),
            },
    }),
    /AI menu extraction.*429/i,
  );
});
test("a menu excerpt may use restaurant name and location elsewhere on the same cited page", async () => {
  const quote = "Happy hour includes a Classic martini.";
  const c = {
    ...candidate,
    name: "New Bistro",
    location: "Pasadena",
    items: [{ name: "Classic martini", kind: "drink", priceCents: null }],
    evidence: quote,
  };
  const r = await searchPlaces("martinis", {
    apiKey: "test",
    searchKey: "test",
    fetchImpl: fetcher(c, {
      results: [
        {
          url: candidate.sourceUrl,
          title: "New Bistro — Pasadena menu",
          content: quote,
        },
      ],
    }),
  });
  assert.equal(r.candidates.length, 1);
  assert.equal(r.candidates[0].items[0].priceCents, null);
});
test("search context is bounded and known restaurants are excluded before AI chooses candidates", async () => {
  let calls = 0;
  await searchPlaces("martinis", {
    apiKey: "test",
    searchKey: "test",
    fetchImpl: async (url, o) => {
      if (calls++ === 0)
        return {
          ok: true,
          json: async () => ({
            results: Array.from({ length: 12 }, () => ({
              url: candidate.sourceUrl,
              title: "New Bistro Pasadena",
              content: text,
              raw_content: "irrelevant ".repeat(4000) + text,
            })),
          }),
        };
      const body = JSON.parse(o.body);
      assert.ok(body.contents[0].parts[0].text.length < 45000);
      assert.match(body.systemInstruction.parts[0].text, /Joyce/);
      return {
        ok: true,
        json: async () => ({
          candidates: [
            {
              finishReason: "STOP",
              content: {
                parts: [{ text: JSON.stringify({ candidates: [] }) }],
              },
            },
          ],
        }),
      };
    },
  });
});

test("source references select actual menu text instead of trusting an AI-retyped quote", async () => {
  const c = {
    ...candidate,
    evidence: "Invented quote",
    sourceUrl: "https://invented.example/menu",
    sourceIndex: 0,
    fragmentIndex: 0,
  };
  const r = await searchPlaces("martini", {
    apiKey: "test",
    searchKey: "test",
    fetchImpl: fetcher(c),
  });
  assert.equal(r.candidates[0].sourceUrl, candidate.sourceUrl);
  assert.ok(r.candidates[0].evidence.includes(text));
  assert.ok(!r.candidates[0].evidence.includes("Invented quote"));
});
test("an explicitly titled happy-hour page supports a literal item excerpt", async () => {
  const c = {
    ...candidate,
    items: [{ name: "Classic martini", kind: "drink", priceCents: 1300 }],
    sourceIndex: 0,
    fragmentIndex: 0,
  };
  const r = await searchPlaces("martini", {
    apiKey: "test",
    searchKey: "test",
    fetchImpl: fetcher(c, {
      results: [
        {
          url: candidate.sourceUrl,
          title: "New Bistro Pasadena Happy Hour",
          content: "Classic martini $13",
        },
      ],
    }),
  });
  assert.equal(r.candidates.length, 1);
  assert.equal(r.candidates[0].items[0].priceCents, 1300);
});
test("a price belonging to another menu item cannot become the martini price", async () => {
  const c = {
    ...candidate,
    items: [{ name: "Classic martini", kind: "drink", priceCents: 500 }],
    sourceIndex: 0,
    fragmentIndex: 0,
  };
  const r = await searchPlaces("martini", {
    apiKey: "test",
    searchKey: "test",
    fetchImpl: fetcher(c, {
      results: [
        {
          url: candidate.sourceUrl,
          title: "New Bistro Pasadena Happy Hour",
          content: "Classic martini $18; beer $5",
        },
      ],
    }),
  });
  assert.equal(r.candidates[0].items[0].priceCents, null);
});
test("an item omitted from retained evidence cannot pass discovery", async () => {
  const c = {
    ...candidate,
    items: [{ name: "Late Martini", kind: "drink", priceCents: null }],
    sourceIndex: 0,
    fragmentIndex: 2,
  };
  const raw = "x".repeat(701) + "martini " + "x".repeat(900) + " Late Martini";
  const r = await searchPlaces("martini", {
    apiKey: "test",
    searchKey: "test",
    fetchImpl: fetcher(c, {
      results: [
        {
          url: candidate.sourceUrl,
          title: "New Bistro Pasadena Happy Hour",
          content: "No offer transcribed",
          raw_content: raw,
        },
      ],
    }),
  });
  assert.equal(r.candidates.length, 0);
});

test("targeted menu lookup rejects a different venue even when its item matches the request", async () => {
  const r = await searchPlaces("New Bistro Pasadena happy hour menu", {
    apiKey: "test",
    searchKey: "test",
    target: { name: "Other Bistro", location: "Pasadena" },
    fetchImpl: fetcher(candidate),
  });
  assert.equal(r.candidates.length, 0);
});
test("a martini discovery retains the other sourced happy-hour food and drinks", async () => {
  const items = [
    ...candidate.items,
    { name: "Truffle fries", kind: "food", priceCents: 700 },
    { name: "House wine", kind: "drink", priceCents: null },
  ];
  const r = await searchPlaces("martinis", {
    apiKey: "test",
    searchKey: "test",
    fetchImpl: fetcher(
      { ...candidate, items },
      {
        results: [
          {
            url: candidate.sourceUrl,
            title: "New Bistro Pasadena Happy Hour",
            content:
              "IKI martini for $10; Truffle fries $7; House wine (price not listed).",
          },
        ],
      },
    ),
  });
  assert.deepEqual(r.candidates[0].items, items);
});

test("targeted menus can recover all items from saved venue-specific evidence when fresh web search is empty", async () => {
  const target = {
    ...candidate,
    evidence:
      "Page title: Pasadena Happy Hour Guide\nMenu excerpt: Other Bistro Pasadena\nHappy hour pizza $5\nView details\nNew Bistro Pasadena\nHappy hour IKI martini $10; Truffle fries $7\nView details\nAnother Bistro Pasadena\nHappy hour Lobster $8",
  };
  const extracted = {
    ...candidate,
    items: [
      ...candidate.items,
      { name: "Truffle fries", kind: "food", priceCents: 700 },
    ],
  };
  const result = await searchPlaces("New Bistro Pasadena happy hour menu", {
    apiKey: "test",
    searchKey: "test",
    target,
    fetchImpl: fetcher(extracted, { results: [] }),
  });
  assert.equal(result.candidates[0].items.length, 2);
  assert.equal(result.candidates[0].previouslyCaptured, true);
  assert.ok(!result.candidates[0].evidence.includes("Other Bistro"));
  assert.ok(!result.candidates[0].evidence.includes("Lobster"));
});

test("saved menu evidence remains usable when the free web search service is unavailable", async () => {
  const target = {
    ...candidate,
    evidence:
      "New Bistro Pasadena happy hour IKI martini $10; Truffle fries $7",
  };
  const extracted = {
    ...candidate,
    items: [
      ...candidate.items,
      { name: "Truffle fries", kind: "food", priceCents: 700 },
    ],
  };
  const mocked = fetcher(extracted, { results: [] });
  let first = true;
  const result = await searchPlaces("New Bistro Pasadena menu", {
    apiKey: "test",
    searchKey: "test",
    target,
    fetchImpl: async (url, options) => {
      const response = await mocked(url, options);
      if (first) {
        first = false;
        return { ok: false, status: 429 };
      }
      return response;
    },
  });
  assert.equal(result.candidates[0].items.length, 2);
  assert.equal(result.candidates[0].previouslyCaptured, true);
});

const noonCandidate = {
  ...candidate,
  name: "Noon Bistro",
  location: "Downey",
  address: "123 Main St, Downey, CA",
  hoursText: "Monday–Friday 12–2 PM",
  items: [
    { name: "Domestic", kind: "drink", priceCents: 350 },
    { name: "Import", kind: "drink", priceCents: 450 },
  ],
};
const noonSource = {
  url: "https://noon-bistro.example/menu",
  title: "Noon Bistro — Downey",
  content:
    "Noon Bistro in Downey: Happy hour Monday–Friday 12–2 PM. Domestic $3.50; Import $4.50",
};
test("explicit city retrieval searches menus without losing the original weekday and noon constraints", async () => {
  const query = "happy hour in Downey noon on Monday";
  const webQueries = [];
  let originalRequest;
  const mocked = fetcher(noonCandidate, { results: [noonSource] });
  await searchPlaces(query, {
    apiKey: "test",
    searchKey: "test",
    fetchImpl: async (url, o) => {
      const b = JSON.parse(o.body);
      if (url.includes("tavily")) webQueries.push(b.query);
      else originalRequest = JSON.parse(b.contents[0].parts[0].text).request;
      return mocked(url, o);
    },
  });
  assert.match(webQueries[0], /Downey/);
  assert.doesNotMatch(
    webQueries[0],
    /noon|Monday|Los Angeles OR Orange County/i,
  );
  assert.equal(
    originalRequest,
    query,
    "Menu retrieval can broaden, but AI must retain all user constraints",
  );
});
test("a happy-hour section far below navigation and lunch content is retained for extraction", async () => {
  const raw =
    "Noon Bistro Downey\nWelcome and lunch menu\n" +
    "lunch content ".repeat(400) +
    "\n### Happy Hour\nMonday–Friday 12–2 PM\nDomestic $3.50; Import $4.50\n### Contact\nDowney, CA";
  const r = await searchPlaces("happy hour in Downey noon on Monday", {
    apiKey: "test",
    searchKey: "test",
    fetchImpl: fetcher(
      { ...noonCandidate, fragmentIndex: 1 },
      {
        results: [
          {
            ...noonSource,
            content: "Welcome to Noon Bistro in Downey",
            raw_content: raw,
          },
        ],
      },
    ),
  });
  assert.equal(r.candidates.length, 1);
  assert.equal(r.candidates[0].items.length, 2);
  assert.equal(r.candidates[0].items[0].priceCents, 350);
});
test("a relevant city menu below the first eight search results is considered before unrelated guides", async () => {
  const results = [
    ...Array.from({ length: 8 }, (_, n) => ({
      url: `https://guide${n}.example/`,
      title: "Los Angeles happy hours",
      content: "Hollywood happy hour Martini $9",
    })),
    noonSource,
  ];
  const r = await searchPlaces("happy hour in Downey noon on Monday", {
    apiKey: "test",
    searchKey: "test",
    fetchImpl: fetcher(noonCandidate, { results }),
  });
  assert.equal(r.candidates.length, 1);
  assert.equal(r.candidates[0].sourceUrl, noonSource.url);
});

test("a city-and-time request uses bounded basic and deeper searches and rejects an explicit later happy hour", async () => {
  const requests = [];
  const mocked = fetcher(
    { ...noonCandidate, hoursText: "Monday-Friday3pm-6pm" },
    {
      results: [
        {
          ...noonSource,
          content:
            "Noon Bistro Downey Happy hour Monday-Friday3pm-6pm. Domestic $3.50;Import $4.50",
        },
      ],
    },
  );
  const r = await searchPlaces("happy hour in Downey noon on Monday", {
    apiKey: "test",
    searchKey: "test",
    fetchImpl: async (url, o) => {
      if (url.includes("tavily")) requests.push(JSON.parse(o.body));
      return mocked(url, o);
    },
  });
  assert.equal(requests.length, 2);
  assert.deepEqual(requests.map(b => b.search_depth), ["basic", "advanced"]);
  assert.ok(
    requests.every(
      (b) =>
        b.auto_parameters === false &&
        b.max_results === 12,
    ),
  );
  assert.equal(requests[1].query, '"Downey" "happy hour" "12"');
  assert.ok(requests.every((b) => b.exclude_domains.includes("yelp.com")));
  assert.equal(r.candidates.length, 0);
  assert.equal(r.diagnostics.rejected.schedule, 1);
});

test("a noon menu on a home page outranks eight explicit afternoon happy-hour menus", async () => {
  const results = [
    ...Array.from({length:8}, (_, n) => ({
      url: `https://afternoon${n}.example/menu-happy-hour`,
      title: "Downey Happy Hour menu",
      content: "Downey happy hour Monday-Friday 3pm-6pm Martini $9"
    })),
    {...noonSource, url:"https://noon-bistro.example/", title:"Noon Bistro — Sports and Good Times"}
  ];
  const r = await searchPlaces("happy hour in Downey noon on Monday", {
    apiKey:"test", searchKey:"test", fetchImpl:fetcher(noonCandidate,{results})
  });
  assert.equal(r.candidates.length,1);
  assert.equal(r.candidates[0].sourceUrl,"https://noon-bistro.example/");
});
