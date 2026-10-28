import test from "node:test";
import assert from "node:assert/strict";
import { freshMenuLookup } from "../src/candidates.js";
import { pendingMatches } from "../src/filter-options.js";
import { emptyPreferences } from "../src/discovery.js";

const now = Date.parse("2026-10-27T04:00:00Z");
function record(evidence, sourceUrl = "https://example.com/happy-hour") {
  const payload = {
    name: "Downey Pizza Company",
    location: "Downey",
    county: "LA County",
    sourceUrl: "https://example.com/happy-hour",
    evidence: "Happy Hour: Espresso Martini, Vodka Martini",
    items: [{ name: "Espresso Martini", kind: "drink", priceCents: 795 }],
  };
  return {
    payload,
    menu_lookup: {
      checkedAt: new Date(now).toISOString(),
      candidate: {
        ...payload,
        sourceUrl,
        evidence,
        items: [{ name: "Martinis", kind: "drink", priceCents: null }],
      },
    },
  };
}

test("a partial lookup keeps a saved espresso martini searchable when its source still lists it", () => {
  const r = record("Happy Hour: Martinis — Espresso Martini, Vodka Martini");
  const candidate = freshMenuLookup(r, now).candidate;
  assert.equal(
    pendingMatches(candidate, {
      ...emptyPreferences(),
      drinkPreferences: ["espresso martini"],
    }),
    true,
  );
  assert.deepEqual(
    candidate.items.find((i) => i.name === "Espresso Martini"),
    {
      name: "Espresso Martini",
      kind: "drink",
      priceCents: null,
    },
  );
});

test("a lookup does not restore an item absent from its source or from a different menu URL", () => {
  for (const r of [
    record("Happy Hour: Martinis"),
    record("Happy Hour: Espresso Martini", "https://example.com/new-menu"),
  ]) {
    assert.equal(
      freshMenuLookup(r, now).candidate.items.some(
        (item) => item.name === "Espresso Martini",
      ),
      false,
    );
  }
});
