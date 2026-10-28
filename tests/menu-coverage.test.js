import test from "node:test";
import assert from "node:assert/strict";
import { attachMenuCoverage } from "../scripts/menu-coverage.mjs";
const records = [
  {
    id: "venue",
    sources: [
      { id: "official", type: "primary", reviewedOn: "2026-10-26" },
      { id: "guide", type: "secondary", reviewedOn: "2026-10-26" },
    ],
  },
];
const complete = {
  status: "complete",
  reviewedOn: "2026-10-26",
  sourceIds: ["official"],
  scope: "Official happy hour and recurring daily specials",
  gaps: [],
};
test("attaches immutable coverage and defaults absent metadata to unverified", () => {
  const result = attachMenuCoverage(records, { venue: complete });
  assert.deepEqual(result[0].menuCoverage, complete);
  assert.equal(records[0].menuCoverage, undefined);
  assert.equal(
    attachMenuCoverage(records, {})[0].menuCoverage.status,
    "unverified",
  );
  assert.equal(result[0].menuCoverage.reviewedOn, "2026-10-26");
});
test("valid partial and unsuccessful reviews retain their explicit gaps", () => {
  for (const status of ["partial", "unverified"])
    assert.equal(
      attachMenuCoverage(records, {
        venue: { ...complete, status, gaps: ["Image price list not readable"] },
      })[0].menuCoverage.status,
      status,
    );
  assert.doesNotThrow(() =>
    attachMenuCoverage(records, {
      venue: {
        ...complete,
        status: "unverified",
        reviewedOn: null,
        sourceIds: [],
        gaps: ["No official menu found"],
      },
    }),
  );
});
test("rejects false completeness, bad dates and broken provenance", () => {
  for (const value of [
    { ...complete, reviewedOn: "2026-02-30" },
    { ...complete, reviewedOn: null },
    { ...complete, sourceIds: [] },
    { ...complete, sourceIds: ["missing"] },
    { ...complete, sourceIds: ["guide"] },
    { ...complete, gaps: ["Missing drinks"] },
    { ...complete, status: "partial", gaps: [] },
    { ...complete, scope: "" },
    { ...complete, status: "other" },
  ])
    assert.throws(() => attachMenuCoverage(records, { venue: value }));
  assert.throws(() => attachMenuCoverage(records, { missing: complete }));
  assert.throws(() =>
    attachMenuCoverage(
      [{ id: "venue", sources: [{ id: "official", type: "primary" }] }],
      { venue: complete },
    ),
  );
});
