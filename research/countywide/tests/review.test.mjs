import test from "node:test";
import assert from "node:assert/strict";
import { deriveReviewState } from "../tools/review.mjs";
import { validateBatch } from "../tools/validate.mjs";
import { fixture, now } from "./fixtures.mjs";
import { evidenceDigest } from "../tools/common.mjs";

function state(batch, at = now) {
  return deriveReviewState(batch.candidates[0], batch.sources, batch.reviews, {
    now: at,
  });
}

test("fetch_does_not_renew_review", () => {
  const batch = fixture();
  batch.sources[0].checks = [
    { at: "2026-10-20T18:00:00Z", outcome: "unchanged", affectedFields: [] },
  ];
  assert.equal(
    state(batch, "2026-10-20T19:00:00Z").lastReviewedAt,
    "2026-10-19T19:00:00Z",
  );
});
test("source_change_marks_affected_fields", () => {
  const batch = fixture();
  batch.sources[0].checks = [
    {
      at: "2026-10-20T18:00:00Z",
      outcome: "changed",
      affectedFields: ["hours"],
    },
  ];
  const result = state(batch, "2026-10-20T19:00:00Z");
  assert.equal(result.state, "needs-review");
  assert.deepEqual(result.affectedFields, ["hours"]);
  assert.deepEqual(
    validateBatch(batch, { now: "2026-10-20T19:00:00Z" }).eligibleIds,
    [],
  );
});
test("access_failure_preserves_accepted_history", () => {
  const batch = fixture();
  batch.sources[0].checks = [
    { at: "2026-10-20T18:00:00Z", outcome: "blocked", affectedFields: [] },
  ];
  const original = structuredClone(batch);
  assert.equal(state(batch, "2026-10-20T19:00:00Z").state, "needs-review");
  assert.equal(state(batch, "2026-10-20T19:00:00Z").lastReviewedAt, now);
  assert.deepEqual(batch, original);
});
test("expiry_excludes_after_effective_date_in_los_angeles", () => {
  const batch = fixture();
  batch.sources[0].effectiveThrough = "2026-10-19";
  batch.reviews[0].evidenceHash = evidenceDigest(
    batch.candidates[0],
    batch.sources,
  );
  assert.equal(state(batch, "2026-10-20T06:59:59Z").state, "accepted");
  assert.equal(state(batch, "2026-10-20T07:00:00Z").state, "excluded");
});
test("official_conflict_keeps_unaffected_facts", () => {
  const batch = fixture();
  batch.reviews.push({
    ...batch.reviews[0],
    id: "conflict",
    at: "2026-10-20T18:00:00Z",
    decision: "request-review",
    affectedFields: ["hours.weekend"],
  });
  const result = state(batch, "2026-10-20T19:00:00Z");
  assert.equal(result.state, "needs-review");
  assert.deepEqual(result.affectedFields, ["hours.weekend"]);
  assert.deepEqual(batch.candidates[0].offerEvidenceSourceIds, ["official"]);
});
test("old_revision_acceptance_and_future_events_cannot_accept_current_revision", () => {
  const batch = fixture();
  batch.candidates[0].revision = "2";
  assert.equal(state(batch).state, "pending");
  batch.reviews.push({
    ...batch.reviews[0],
    id: "future",
    revision: "2",
    at: "2027-01-01T00:00:00Z",
  });
  assert.equal(state(batch).state, "pending");
});
test("newer_resolution_clears_a_completed_review_task", () => {
  const batch = fixture();
  batch.sources[0].checks = [
    {
      at: "2026-10-20T18:00:00Z",
      outcome: "changed",
      affectedFields: ["hours"],
    },
  ];
  batch.reviews.push({
    ...batch.reviews[0],
    id: "resolution",
    at: "2026-10-20T18:30:00Z",
    decision: "resolve-conflict",
  });
  assert.equal(state(batch, "2026-10-20T19:00:00Z").state, "accepted");
});
test("edited_candidate_cannot_reuse_acceptance_for_unchanged_revision_label", () => {
  const batch = fixture();
  batch.candidates[0].address.street = "200 Main St";
  assert.equal(state(batch).state, "pending");
  assert.deepEqual(validateBatch(batch, { now }).eligibleIds, []);
});
