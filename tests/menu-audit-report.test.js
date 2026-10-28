import test from "node:test";
import assert from "node:assert/strict";
import { buildMenuAuditReport } from "../scripts/report-menu-audit.mjs";
const v = {
  id: "v",
  name: "Venue",
  menu: [{}],
  sources: [{ id: "official", url: "https://example.com/menu" }],
  menuCoverage: {
    status: "partial",
    reviewedOn: "2026-10-26",
    sourceIds: ["official"],
    scope: "HH section",
    gaps: ["Missing prices"],
  },
};
test("report accounts for every original ID and exposes evidence gaps", () => {
  const report = buildMenuAuditReport([v], ["v"], { v: v.menuCoverage });
  assert.match(report, /1 partial/);
  assert.match(report, /Missing prices/);
  assert.match(report, /https:\/\/example.com\/menu/);
  assert.throws(() =>
    buildMenuAuditReport([v], ["v", "missing"], { v: v.menuCoverage }),
  );
  assert.throws(() => buildMenuAuditReport([v], ["v"], {}));
  assert.throws(() =>
    buildMenuAuditReport([v, v], ["v"], { v: v.menuCoverage }),
  );
});
