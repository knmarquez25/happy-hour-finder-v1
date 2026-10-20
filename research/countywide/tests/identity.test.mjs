import test from "node:test";
import assert from "node:assert/strict";
import { suggestDuplicates } from "../tools/identity.mjs";

function branch(id, name, street, unit = null) {
  return {
    id,
    name,
    address: { street, unit, city: "Irvine", state: "CA", postalCode: "92618" },
  };
}
test("punctuation_variants_suggest_review_against_existing_records", () => {
  const result = suggestDuplicates(
    [branch("cw-one", "Joe's Cafe", "100 Main St.")],
    [
      {
        id: "existing",
        name: "Joes Cafe",
        address: "100 Main Street, Irvine, CA 92618",
      },
    ],
  );
  assert.equal(result.length, 1);
  assert.deepEqual(result[0].candidateIds, ["cw-one"]);
  assert.deepEqual(result[0].existingIds, ["existing"]);
  assert.equal(result[0].requiresReview, true);
});
test("distinct_chain_branches_are_not_duplicates", () => {
  assert.deepEqual(
    suggestDuplicates(
      [
        branch("one", "Chain", "100 Main St"),
        branch("two", "Chain", "200 Main St"),
      ],
      [],
    ),
    [],
  );
});
test("separate_suites_preserve_distinct_locations", () => {
  const candidates = [
    branch("one", "Cafe", "100 Main St", "100"),
    branch("two", "Cafe", "100 Main St", "200"),
  ];
  assert.deepEqual(suggestDuplicates(candidates, []), []);
  assert.equal(candidates[1].address.unit, "200");
});
test("different_names_in_shared_food_hall_need_review_not_merging", () => {
  const result = suggestDuplicates(
    [
      branch("one", "Tacos", "100 Main St"),
      branch("two", "Ramen", "100 Main St"),
    ],
    [],
  );
  assert.equal(result.length, 1);
  assert.match(result[0].reason, /shared address/i);
  assert.deepEqual(result[0].candidateIds, ["one", "two"]);
});
test("recorded_relocation_or_rebrand_history_suggests_review", () => {
  const candidate = branch("one", "New Name", "200 Main St");
  candidate.history = [
    { name: "Old Name", address: "100 Main St, Irvine, CA 92618" },
  ];
  assert.equal(
    suggestDuplicates([candidate], [branch("old", "Old Name", "100 Main St")])
      .length,
    1,
  );
});
test("restricted_external_ids_cannot_link_distinct_addresses", () => {
  const candidates = [
    branch("one", "Cafe", "100 Main St"),
    branch("two", "Cafe", "200 Main St"),
  ];
  for (const candidate of candidates)
    candidate.externalIds = [
      {
        provider: "example",
        id: "shared",
        policy: { factReuse: "unconfirmed", publicRetention: "unconfirmed" },
      },
    ];
  assert.deepEqual(suggestDuplicates(candidates, []), []);
});
