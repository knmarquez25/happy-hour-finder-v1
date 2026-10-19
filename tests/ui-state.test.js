import test from "node:test";
import assert from "node:assert/strict";
import {
  restoreShortlist,
  toggleShortlist,
  sortResults,
  budgetLabel,
  escapeHtml,
  happyHourListings,
} from "../src/ui-state.js";
test("happy-hour listings retain exact prices, discount wording and source attribution without inventing totals", () => {
  const source = {
    id: "official",
    type: "primary",
    reviewedOn: "2026-10-19",
    url: "https://example.com",
  };
  const venue = {
    sources: [source],
    menu: [
      {
        name: "Beer",
        priceCents: 700,
        status: "primary",
        sourceId: "official",
        days: ["Friday"],
      },
      {
        name: "Fries",
        priceCents: null,
        status: "primary",
        sourceId: "official",
      },
      {
        name: "Unreviewed taco",
        priceCents: 200,
        status: "primary",
        sourceId: "missing",
      },
    ],
    specials: [
      { text: "$2 off appetizers", status: "primary", sourceId: "official" },
    ],
  };
  const listings = happyHourListings(venue);
  assert.equal(listings.length, 3);
  assert.equal(listings[0].text, "$2 off appetizers");
  assert.match(listings[1].text, /Beer.*\$7.*Friday/);
  assert.match(listings[2].text, /Fries.*Price not available/);
  assert.ok(listings.every((item) => item.source === source && item.primary));
});
test("guide-only listings stay secondary and unsupported primary claims are omitted", () => {
  const source = { id: "guide", type: "secondary", reviewedOn: "2026-10-19" };
  const listings = happyHourListings({
    sources: [source],
    menu: [],
    specials: [
      { text: "Guide special", sourceId: "guide", status: "secondary" },
      { text: "False primary", sourceId: "guide", status: "primary" },
    ],
  });
  assert.equal(listings.length, 1);
  assert.equal(listings[0].primary, false);
});
test("invalid browser storage cannot break the app or inject shortlist entries", () => {
  assert.deepEqual(restoreShortlist("{bad", ["a"]), []);
  assert.deepEqual(restoreShortlist('{"id":"a"}', ["a"]), []);
  assert.deepEqual(restoreShortlist('["a","a","x",null]', ["a"]), ["a"]);
});
test("shortlist is bounded at three and supports removal", () => {
  assert.deepEqual(toggleShortlist(["a", "b", "c"], "d"), ["a", "b", "c"]);
  assert.deepEqual(toggleShortlist(["a", "b"], "a"), ["b"]);
});
test("price and distance sorts keep unknown values last without mutating input", () => {
  const rows = [
    { id: "unknown", score: 100, combo: null, distanceMiles: null },
    { id: "known", score: 90, combo: { totalCents: 2500 }, distanceMiles: 1 },
  ];
  assert.equal(sortResults(rows, "price")[0].id, "known");
  assert.equal(sortResults(rows, "distance")[0].id, "known");
  assert.equal(rows[0].id, "unknown");
});
test("budget labels express above and below without pretending unknowns fit", () => {
  assert.equal(budgetLabel(200), "$2 above target");
  assert.equal(budgetLabel(-500), "$5 below target");
  assert.equal(budgetLabel(null), "Price not confirmed");
  assert.equal(budgetLabel(0), "Right on target");
});
test("budget sort orders by absolute target difference and keeps unknown prices last", () => {
  const rows = [
    { id: "cheap", score: 100, budgetDifferenceCents: -8000 },
    { id: "near", score: 70, budgetDifferenceCents: -1000 },
    { id: "over", score: 80, budgetDifferenceCents: 500 },
    { id: "unknown", score: 100, budgetDifferenceCents: null },
  ];
  assert.deepEqual(
    sortResults(rows, "budget").map((row) => row.id),
    ["over", "near", "cheap", "unknown"],
  );
  assert.equal(rows[0].id, "cheap");
});
test("venue and preference text is escaped before markup insertion", () => {
  assert.equal(
    escapeHtml('<img onerror="x">'),
    "&lt;img onerror=&quot;x&quot;&gt;",
  );
});
