import test from "node:test";
import assert from "node:assert/strict";
import { pendingMatches } from "../src/filter-options.js";
import { emptyPreferences } from "../src/discovery.js";
import { searchPlaces } from "../server/search.js";
import { contradictsSchedule } from "../src/request-schedule.js";

test("common weekday abbreviations do not hide open Thursday happy hours", () => {
  for (const hours of [
    "Mon-Thurs 3pm-6pm",
    "Tues-Fri 3pm-6pm",
    "Weds-Fri 3pm-6pm",
    "Mon.–Thurs. 3pm-6pm",
  ])
    assert.equal(contradictsSchedule(hours, "Thursday 17:00"), false, hours);
  assert.equal(contradictsSchedule("Mon-Thurs 3pm-6pm", "Friday 17:00"), true);
});

for (const [location, county, area] of [
  ["Downtown", "LA County", "Downtown LA"],
  ["DTLA", "LA County", "Downtown LA"],
  ["Pasadena", null, "LA County"],
  ["Irvine", null, "Orange County"],
  ["Pasadena, CA", "LA County", "Pasadena"],
])
  test(`extra discoveries in ${location} stay visible for ${area}`, () => {
    assert.equal(
      pendingMatches(
        { location, county, items: [] },
        {
          ...emptyPreferences(),
          area,
        },
      ),
      true,
    );
  });
test("location matching does not turn Hollywood into West Hollywood or cross counties", () => {
  for (const [location, area] of [
    ["West Hollywood", "Hollywood"],
    ["Irvine", "LA County"],
    ["Unknown", "LA County"],
    ["Downtown", "Orange County"],
  ])
    assert.equal(
      pendingMatches(
        { location, county: null, items: [] },
        {
          ...emptyPreferences(),
          area,
        },
      ),
      false,
    );
});

test("city web retrieval retains food and drink requests", async () => {
  const queries = [];
  await assert.rejects(
    searchPlaces(
      "Happy hour in Pasadena · food: oysters · drinks: espresso martini",
      {
        apiKey: "test",
        searchKey: "test",
        fetchImpl: async (url, options) => {
          assert.equal(url, "https://api.tavily.com/search");
          queries.push(JSON.parse(options.body).query);
          return { ok: true, json: async () => ({ results: [] }) };
        },
      },
    ),
    /no cited sources/,
  );
  assert.match(queries[0], /Pasadena/);
  assert.match(queries[0], /oysters/);
  assert.match(queries[0], /espresso martini/);
});

test("city extraction can use saved Downtown sources under the Downtown LA filter", async () => {
  const sourceUrl = "https://example.com/happy-hour";
  let passages;
  await searchPlaces("Happy hour in Downtown LA · drinks: wine", {
    apiKey: "test",
    searchKey: "test",
    savedCandidates: [
      {
        name: "Audit Bar",
        location: "Downtown",
        county: "LA County",
        sourceUrl,
        evidence: "Audit Bar Downtown Happy hour Wine $8",
        items: [{ name: "Wine", kind: "drink", priceCents: null }],
      },
    ],
    fetchImpl: async (url, options) => {
      if (url === "https://api.tavily.com/search")
        return { ok: true, json: async () => ({ results: [] }) };
      passages = JSON.parse(
        JSON.parse(options.body).contents[0].parts[0].text,
      ).passages;
      return {
        ok: true,
        json: async () => ({
          candidates: [
            {
              finishReason: "STOP",
              content: { parts: [{ text: '{"candidates":[]}' }] },
            },
          ],
        }),
      };
    },
  });
  assert.equal(passages[0].url, sourceUrl);
});
