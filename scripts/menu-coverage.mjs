import { menuCoverageErrors } from "../src/menu-coverage.js";
export function attachMenuCoverage(records, ledger) {
  if (!ledger || typeof ledger !== "object" || Array.isArray(ledger))
    throw new Error("Invalid menu audit ledger");
  const ids = new Set(records.map((r) => r.id));
  for (const id of Object.keys(ledger))
    if (!ids.has(id)) throw new Error(`Unknown menu audit venue: ${id}`);
  return records.map((record) => {
    const coverage = ledger[record.id] || {
      status: "unverified",
      reviewedOn: null,
      sourceIds: [],
      scope: "Published happy-hour and recurring daily specials",
      gaps: ["Menu completeness has not been reviewed."],
    };
    const errors = menuCoverageErrors(coverage, record.sources);
    if (errors.length) throw new Error(`${record.id}: ${errors.join("; ")}`);
    return { ...record, menuCoverage: structuredClone(coverage) };
  });
}
