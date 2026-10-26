import test from "node:test";
import assert from "node:assert/strict";
import { freshMenuLookup } from "../src/candidates.js";
const payload = {
  name: "New Bistro",
  location: "Pasadena",
  sourceUrl: "https://example.com/menu",
  evidence: "New Bistro Pasadena happy hour menu",
  items: [{ name: "Fries", kind: "food", priceCents: null }],
};
const now = Date.parse("2026-10-26T17:00:00Z");
const record = (
  candidate = payload,
  checkedAt = new Date(now - 1000).toISOString(),
) => ({ payload, menu_lookup: { candidate, checkedAt, notice: "Unverified" } });
test("durable menu previews are usable only for the same restaurant and within one day", () => {
  assert.equal(freshMenuLookup(record(), now).candidate.items[0].name, "Fries");
  assert.equal(
    freshMenuLookup(record({ ...payload, name: "Other Bistro" }), now),
    null,
  );
  assert.equal(
    freshMenuLookup(
      record(payload, new Date(now - 86400001).toISOString()),
      now,
    ),
    null,
  );
  assert.equal(freshMenuLookup(record(payload, "invalid"), now), null);
  assert.equal(
    freshMenuLookup(record(payload, new Date(now + 600000).toISOString()), now),
    null,
  );
});
test("a completed lookup with no menu stays explicit and prevents repeated searches", () => {
  assert.equal(freshMenuLookup(record(null), now).candidate, null);
  assert.equal(freshMenuLookup({ payload }, now), null);
});
