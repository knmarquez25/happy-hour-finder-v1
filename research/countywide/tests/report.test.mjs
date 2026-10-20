import test from "node:test";
import assert from "node:assert/strict";
import { summarizeBatch, formatMarkdown } from "../tools/report.mjs";
import { fixture, pricedFixture, now } from "./fixtures.mjs";
import { candidateDigest, evidenceDigest } from "../tools/common.mjs";

test("discovery_counts_physical_branches_once", () => {
  const batch = fixture();
  batch.sources.push({ ...batch.sources[0], id: "another-mention" });
  batch.reviews[0].evidenceHash = evidenceDigest(
    batch.candidates[0],
    batch.sources,
  );
  const result = summarizeBatch(batch, { now });
  assert.equal(result.discovered, 1);
  assert.equal(result.researched, 1);
  assert.equal(result.admitted, 1);
});
test("closure_is_reported_but_not_admitted", () => {
  const batch = fixture();
  batch.candidates[0].operatingStatus = "closed";
  batch.candidates[0].operatingSourceId = "official";
  batch.sources[0].claims.push("operating-status");
  const result = summarizeBatch(batch, { now });
  assert.equal(result.excluded, 1);
  assert.equal(result.admitted, 0);
  assert.equal(result.evidence.advertisedOffers, 0);
});
test("price_pair_needs_joint_applicability", () => {
  const batch = pricedFixture();
  assert.equal(
    summarizeBatch(batch, { now }).evidence.compatiblePricedPairs,
    1,
  );
  batch.candidates[0].menu[1].days = ["Tuesday"];
  batch.reviews[0].candidateHash = candidateDigest(batch.candidates[0]);
  const result = summarizeBatch(batch, { now });
  assert.equal(result.evidence.pricedFood, 1);
  assert.equal(result.evidence.pricedDrinks, 1);
  assert.equal(result.evidence.compatiblePricedPairs, 0);
});
test("unreviewed_pair_cannot_create_a_combo", () => {
  const batch = pricedFixture();
  batch.reviews[0].confirmedPairIds = [];
  assert.equal(
    summarizeBatch(batch, { now }).evidence.compatiblePricedPairs,
    0,
  );
});
test("effort_unknown_stays_unknown", () => {
  const result = summarizeBatch(fixture(), { now });
  assert.deepEqual(result.effort, { minutes: null, costCents: null });
});
test("no_completeness_without_known_universe", () => {
  const batch = fixture();
  batch.manifest.providerTotal = 100000;
  const result = summarizeBatch(batch, { now });
  assert.deepEqual(result.researchProgress, {
    numerator: 1,
    denominator: 1,
    percent: 100,
    scope: "this batch only",
  });
  assert.equal(result.countyCompleteness, undefined);
  assert.match(result.limitations.join(" "), /not.*county.*completeness/i);
  assert.match(formatMarkdown(result), /Admitted: 1/);
});
test("invalid_batch_cannot_report_successful_admission", () => {
  const batch = fixture();
  batch.candidates[0].menu = [{ id: "bad", priceCents: -10 }];
  const result = summarizeBatch(batch, { now });
  assert.equal(result.admitted, 0);
  assert.ok(result.errors.length);
});
test("conditional_schedule_is_not_reported_as_usable", () => {
  const batch = pricedFixture();
  batch.candidates[0].hours[0].restriction = "conditional";
  batch.reviews[0].candidateHash = candidateDigest(batch.candidates[0]);
  assert.equal(summarizeBatch(batch, { now }).evidence.primarySchedules, 0);
});
