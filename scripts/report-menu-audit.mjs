import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { menuCoverageErrors } from "../src/menu-coverage.js";
const equalIds = (a, b) =>
  JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
const cell = (s) => String(s).replace(/\|/g, " / ").replace(/\n/g, " ");
export function buildMenuAuditReport(records, baseline, ledger) {
  const ids = records.map((v) => v.id);
  if (
    new Set(ids).size !== ids.length ||
    !equalIds(ids, baseline) ||
    !equalIds(Object.keys(ledger), baseline)
  )
    throw Error("Audit must account for every baseline venue exactly once");
  const counts = { complete: 0, partial: 0, unverified: 0 };
  for (const v of records) {
    const c = ledger[v.id];
    const errors = menuCoverageErrors(c, v.sources);
    if (
      errors.length ||
      JSON.stringify(c) !== JSON.stringify(v.menuCoverage) ||
      /audit pending/i.test(JSON.stringify(c))
    )
      throw Error(v.id + ": invalid or unfinished audit outcome");
    counts[c.status]++;
  }
  return (
    `# Published-specials audit — October 26, 2026\n\n${records.length} locations: ${counts.complete} complete, ${counts.partial} partial, ${counts.unverified} unverified. ${records.reduce((n, v) => n + v.menu.length, 0)} saved item choices.\n\nComplete means the cited published material was reviewed at the stated date; it does not mean live restaurant confirmation. Partial and unverified records keep explicit gaps. Existing sample facts at blocked sources retain their original review dates and are not newly confirmed. General offers and bundles are descriptive and are not counted as additional selectable items.\n\n| Location / ID | Coverage | Items | Reviewed | Sources | Scope and gaps |\n| --- | --- | ---: | --- | --- | --- |\n` +
    records
      .map((v) => {
        const c = v.menuCoverage;
        return `| ${cell(v.name)} (${v.id}) | ${c.status} | ${v.menu.length} | ${c.reviewedOn || "—"} | ${c.sourceIds
          .map((id) => {
            const s = v.sources.find((s) => s.id === id);
            return `[${id}](${s.url})`;
          })
          .join("; ")} | ${cell(c.scope)} ${cell(c.gaps.join(" "))} |`;
      })
      .join("\n") +
    "\n"
  );
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { restaurants } = await import("../src/data.js");
  const baseline = JSON.parse(
    await readFile(
      new URL("../research/menu-audit-baseline.json", import.meta.url),
      "utf8",
    ),
  );
  const ledger = JSON.parse(
    await readFile(
      new URL("../research/menu-audit.json", import.meta.url),
      "utf8",
    ),
  );
  await writeFile(
    new URL("../research/menu-audit-report.md", import.meta.url),
    buildMenuAuditReport(restaurants, baseline, ledger),
  );
  console.log(
    "Wrote audit report for " + restaurants.length + " baseline locations.",
  );
}
