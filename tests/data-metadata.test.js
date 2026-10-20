import test from "node:test";
import assert from "node:assert/strict";
import { evidenceSnapshotMetadata } from "../scripts/data-metadata.mjs";

test("later_builds_do_not_renew_source_research_dates", () => {
  const records = [
    { sources: [{ reviewedOn: "2026-10-19" }, { reviewedOn: null }] },
  ];
  const result = evidenceSnapshotMetadata(records, { builtOn: "2026-11-19" });
  assert.equal(result.collectedOn, "2026-10-19");
  assert.equal(result.builtOn, "2026-11-19");
});
test("snapshot_uses_latest_real_review_date_not_invalid_or_access_dates", () => {
  const records = [
    {
      sources: [
        { reviewedOn: "2026-10-18", accessedOn: "2026-12-01" },
        { reviewedOn: "2026-02-30" },
      ],
    },
    { sources: [{ reviewedOn: "2026-10-19" }] },
  ];
  assert.equal(
    evidenceSnapshotMetadata(records, { builtOn: "2026-11-19" }).collectedOn,
    "2026-10-19",
  );
  assert.equal(
    evidenceSnapshotMetadata([], { builtOn: "2026-11-19" }).collectedOn,
    null,
  );
});
