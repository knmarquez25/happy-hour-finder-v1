export function evidenceSnapshotMetadata(records, { builtOn }) {
  const dates = records
    .flatMap((record) =>
      (record.sources || []).map((source) => source.reviewedOn),
    )
    .filter(
      (value) =>
        typeof value === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(value) &&
        Number.isFinite(Date.parse(value)) &&
        new Date(value).toISOString().slice(0, 10) === value,
    )
    .sort();
  return {
    collectedOn: dates.at(-1) || null,
    builtOn,
    snapshotBasis:
      "Latest source review date; rebuilding does not renew source reviews.",
  };
}
