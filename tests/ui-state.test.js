import test from "node:test";
import assert from "node:assert/strict";
import {
  restoreShortlist,
  toggleShortlist,
  sortResults,
  budgetLabel,
  escapeHtml,
} from "../src/ui-state.js";
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
test("venue and preference text is escaped before markup insertion", () => {
  assert.equal(
    escapeHtml('<img onerror="x">'),
    "&lt;img onerror=&quot;x&quot;&gt;",
  );
});
