import test from "node:test";
import assert from "node:assert/strict";
import { validateBatch } from "../tools/validate.mjs";
import { fixture, pricedFixture, now } from "./fixtures.mjs";
import { candidateDigest, evidenceDigest } from "../tools/common.mjs";

function refreshAcceptance(batch) {
  batch.reviews[0].candidateHash = candidateDigest(batch.candidates[0]);
  batch.reviews[0].evidenceHash = evidenceDigest(
    batch.candidates[0],
    batch.sources,
  );
}

test("discovery_is_not_admission", () => {
  const batch = fixture();
  batch.reviews = [];
  assert.deepEqual(validateBatch(batch, { now }).eligibleIds, []);
  assert.deepEqual(validateBatch(batch, { now }).pendingIds, ["cw-example"]);
});
test("county_requires_evidence", () => {
  const batch = fixture();
  batch.candidates[0].county.sourceId = null;
  assert.deepEqual(validateBatch(batch, { now }).eligibleIds, []);
});
test("unknown_hours_are_not_guessed", () => {
  const batch = fixture();
  assert.deepEqual(validateBatch(batch, { now }).eligibleIds, ["cw-example"]);
  assert.deepEqual(batch.candidates[0].hours, []);
});
test("discount_is_not_a_price", () => {
  const batch = pricedFixture();
  batch.candidates[0].menu[0].priceCents = "$2 off";
  const result = validateBatch(batch, { now });
  assert.deepEqual(result.eligibleIds, []);
  assert.match(result.errors.join("\n"), /price/i);
});
test("expired_or_closed_is_excluded", () => {
  const batch = fixture();
  batch.sources[0].effectiveThrough = "2026-10-18";
  assert.deepEqual(validateBatch(batch, { now }).excludedIds, ["cw-example"]);
  batch.sources[0].effectiveThrough = null;
  batch.candidates[0].operatingStatus = "closed";
  batch.candidates[0].operatingSourceId = "official";
  batch.sources[0].claims.push("operating-status");
  assert.deepEqual(validateBatch(batch, { now }).excludedIds, ["cw-example"]);
});
test("inaccessible_source_cannot_be_marked_reviewed", () => {
  const batch = fixture();
  batch.sources[0].accessOutcome = "blocked";
  assert.match(
    validateBatch(batch, { now }).errors.join("\n"),
    /reviewed.*access/i,
  );
});
test("unconfirmed_public_retention_stays_pending", () => {
  const batch = fixture();
  batch.policies[0].publicRetention = "unconfirmed";
  assert.deepEqual(validateBatch(batch, { now }).eligibleIds, []);
  assert.deepEqual(validateBatch(batch, { now }).errors, []);
});
test("guide_or_wrong_branch_cannot_support_official_offer", () => {
  const batch = fixture();
  batch.sources[0].publisherRole = "guide";
  assert.deepEqual(validateBatch(batch, { now }).eligibleIds, []);
  batch.sources[0].publisherRole = "restaurant";
  batch.sources[0].branchIds = [];
  assert.deepEqual(validateBatch(batch, { now }).eligibleIds, []);
});
test("invalid_calendar_dates_duplicate_ids_and_future_reviews_fail_closed", () => {
  const batch = fixture();
  batch.sources[0].publisherUpdatedOn = "2026-02-30";
  batch.reviews[0].at = "2027-01-01T00:00:00Z";
  batch.candidates.push(structuredClone(batch.candidates[0]));
  const result = validateBatch(batch, { now });
  assert.deepEqual(result.eligibleIds, []);
  assert.match(result.errors.join("\n"), /date/i);
  assert.match(result.errors.join("\n"), /duplicate/i);
});
test("malformed_input_returns_errors_instead_of_throwing", () => {
  for (const batch of [null, {}, { candidates: [null] }]) {
    assert.ok(validateBatch(batch, { now }).errors.length);
  }
});

test("unknown_address_can_be_staged_but_cannot_be_admitted", () => {
  const batch = fixture();
  batch.candidates[0].address.street = null;
  const result = validateBatch(batch, { now });
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.eligibleIds, []);
});
test("malformed_nested_values_fail_closed_without_crashing", () => {
  for (const mutate of [
    (batch) => {
      batch.sources[0].reviewer = {};
    },
    (batch) => {
      batch.sources[0].checks = "bad";
    },
    (batch) => {
      batch.candidates[0].hours = [{ id: "bad", days: "Monday" }];
    },
  ]) {
    const batch = fixture();
    mutate(batch);
    assert.ok(validateBatch(batch, { now }).errors.length);
    assert.deepEqual(validateBatch(batch, { now }).eligibleIds, []);
  }
});
test("unresolved_closure_does_not_admit_an_accepted_offer", () => {
  const batch = fixture();
  batch.candidates[0].operatingStatus = "closed";
  assert.deepEqual(validateBatch(batch, { now }).eligibleIds, []);
});
test("acceptance_cannot_survive_replacement_or_later_review_of_its_source", () => {
  const batch = fixture();
  batch.sources[0].url = "https://restaurant.example/replaced-menu";
  batch.sources[0].accessedAt = "2026-10-20T18:00:00Z";
  batch.sources[0].reviewedAt = "2026-10-20T18:30:00Z";
  assert.deepEqual(
    validateBatch(batch, { now: "2026-10-20T19:00:00Z" }).eligibleIds,
    [],
  );
});
test("unreviewed_retained_facts_require_permission_too", () => {
  const batch = fixture();
  batch.policies.push({
    ...batch.policies[0],
    id: "denied",
    publicRetention: "denied",
    factReuse: "denied",
  });
  batch.sources.push({
    ...batch.sources[0],
    id: "secondary",
    type: "secondary",
    publisherRole: "guide",
    reviewedAt: null,
    reviewer: null,
    reviewMethod: null,
    policyId: "denied",
  });
  batch.candidates[0].specials.push({
    text: "Guide-listed discount",
    status: "secondary",
    sourceId: "secondary",
  });
  refreshAcceptance(batch);
  assert.deepEqual(validateBatch(batch, { now }).eligibleIds, []);
});
test("undated_archive_asset_without_live_official_link_stays_pending", () => {
  const batch = fixture();
  batch.sources[0].mediaType = "application/pdf";
  batch.sources[0].discoveryContext = "archive";
  refreshAcceptance(batch);
  assert.deepEqual(validateBatch(batch, { now }).eligibleIds, []);
});
test("denied_automated_acquisition_cannot_admit_retained_facts", () => {
  const batch = fixture();
  batch.policies[0].accessMethod = "automated";
  batch.policies[0].automatedAccess = "denied";
  assert.deepEqual(validateBatch(batch, { now }).eligibleIds, []);
});
test("linked_menu_requires_an_inspected_live_parent_and_exact_target_link", () => {
  const batch = fixture();
  const menu = batch.sources[0];
  const parent = {
    ...menu,
    id: "branch",
    url: "https://restaurant.example/branch",
    claims: ["menu-link"],
    linkedUrls: [menu.url],
  };
  batch.sources.push(parent);
  menu.mediaType = "application/pdf";
  menu.discoveryContext = "linked-menu";
  menu.currentLinkSourceId = "branch";
  refreshAcceptance(batch);
  assert.deepEqual(validateBatch(batch, { now }).eligibleIds, ["cw-example"]);
  parent.linkedUrls = [];
  refreshAcceptance(batch);
  assert.deepEqual(validateBatch(batch, { now }).eligibleIds, []);
});
test("evidence_fingerprint_cannot_override_acceptance_chronology", () => {
  const batch = fixture();
  batch.sources[0].accessedAt = "2026-10-20T18:00:00Z";
  batch.sources[0].reviewedAt = "2026-10-20T18:30:00Z";
  refreshAcceptance(batch);
  assert.deepEqual(
    validateBatch(batch, { now: "2026-10-20T19:00:00Z" }).eligibleIds,
    [],
  );
});
