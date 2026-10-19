import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { restaurants as baselineVenues } from "../evaluation/baseline/data.js";
import { rankRestaurants as baselineRank } from "../evaluation/baseline/scoring.js";
import { restaurants, dataMetadata } from "../src/data.js";
import { searchRestaurants } from "../src/matching.js";
import { origins } from "../src/locations.js";
import { scoreOutputs } from "../evaluation/rubric.js";

const root = new URL("../", import.meta.url);
const load = async (path) =>
  JSON.parse(await readFile(new URL(path, root), "utf8"));
const slug = (name) =>
  name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const holdout = process.argv.includes("--holdout");
const cases = await load(
  holdout ? "evaluation/holdout.json" : "evaluation/cases.json",
);
const gold = await load("evaluation/gold.json");
const outputs = { baseline: {}, improved: {} };
const presentedSuitability = { baseline: {}, improved: {} };
const raw = { baseline: {}, improved: {} };
for (const scenario of cases) {
  const request = {
    ...scenario,
    location: origins.find((origin) => origin.id === scenario.originId).name,
  };
  // This reproduces the original UI: location is text only, neighborhood is the only eligibility filter.
  const oldCandidates =
    scenario.neighborhood && scenario.neighborhood !== "all"
      ? baselineVenues.filter(
          (venue) => venue.neighborhood === scenario.neighborhood,
        )
      : baselineVenues;
  const old = baselineRank(oldCandidates, request);
  const current = searchRestaurants(restaurants, request);
  outputs.baseline[scenario.id] = old
    .slice(0, 3)
    .map((venue) => slug(venue.name));
  outputs.improved[scenario.id] = current.matches
    .slice(0, 3)
    .map((venue) => venue.id);
  const maximumCents = Math.round((scenario.budget + 5) * 100);
  presentedSuitability.baseline[scenario.id] = old
    .slice(0, 3)
    .filter(
      (venue) =>
        Number.isFinite(venue.budgetEstimate) &&
        Math.round(venue.budgetEstimate * 100) <= maximumCents,
    )
    .map((venue) => slug(venue.name));
  presentedSuitability.improved[scenario.id] = current.matches
    .slice(0, 3)
    .filter((venue) => venue.combo && venue.combo.totalCents <= maximumCents)
    .map((venue) => venue.id);
  raw.baseline[scenario.id] = old
    .slice(0, 3)
    .map((venue) => ({
      id: slug(venue.name),
      name: venue.name,
      score: venue.score,
      displayedEstimate: venue.budgetEstimate,
      activeAccordingToOriginalData: venue.activeHappyHour,
    }));
  raw.improved[scenario.id] = {
    primaryCount: current.matches.length,
    top: current.matches
      .slice(0, 3)
      .map((venue) => ({
        id: venue.id,
        name: venue.name,
        score: venue.score,
        totalCents: venue.combo?.totalCents ?? null,
        budgetDifferenceCents: venue.budgetDifferenceCents,
        distanceMiles: venue.distanceMiles,
        requiredFailures: venue.failures,
      })),
    alternativeCount: current.alternatives.length,
  };
}
const scores = {
  baseline: scoreOutputs(
    cases,
    outputs.baseline,
    gold.labels,
    presentedSuitability.baseline,
  ),
  improved: scoreOutputs(
    cases,
    outputs.improved,
    gold.labels,
    presentedSuitability.improved,
  ),
};
function guardrails(stage) {
  if (!gold.validLabels)
    return {
      status:
        "Independent hard-constraint labels pending; no guardrail score asserted.",
    };
  let returned = 0,
    violations = 0;
  for (const scenario of cases) {
    const valid = gold.validLabels[scenario.id];
    if (!Array.isArray(valid))
      throw new Error(`Missing independent validity label ${scenario.id}`);
    for (const id of outputs[stage][scenario.id]) {
      returned++;
      if (!valid.includes(id)) violations++;
    }
  }
  return {
    returned,
    requiredConstraintEvidenceFailures: violations,
    note: "Failed or unproven source-backed eligibility, not proof that every excluded real-world offer is false. Budget is not a required constraint.",
  };
}
const hashes = {};
for (const file of [
  "src/data.js",
  "src/matching.js",
  "src/locations.js",
  "evaluation/cases.json",
  "evaluation/holdout.json",
  "evaluation/gold.json",
  "evaluation/baseline/data.js",
  "evaluation/baseline/scoring.js",
])
  hashes[file] = createHash("sha256")
    .update(await readFile(new URL(file, root)))
    .digest("hex");
const report = {
  evaluatedOn: "2026-10-19",
  split: holdout ? "holdout" : "development",
  baseline: await load("evaluation/baseline/metadata.json"),
  data: dataMetadata,
  criterion:
    "At least one top-three independently labeled source-supported, within-radius food+drink pair <= target + $5 on positive cases; correct empty primary results on explicit negative controls.",
  budgetPolicy:
    "The +$5 range is an evaluation relevance label, not a filter in the app. No lower spend floor.",
  scores,
  guardrails: {
    baseline: guardrails("baseline"),
    improved: guardrails("improved"),
  },
  raw,
  hashes,
  limitations: [
    "Small convenience sample, not statistical evidence of citywide accuracy.",
    "Positive cases with no evidenced acceptable venue remain failures, not automatic passes.",
    "AI-assisted source review, not an independent human panel or in-person verification.",
    "No fabricated intermediate legacy score: its reputation and per-person-estimate inputs are not comparable with the reviewed schema.",
  ],
};
await writeFile(
  new URL(`evaluation/${holdout ? "holdout-results" : "results"}.json`, root),
  JSON.stringify(report, null, 2) + "\n",
);
console.log(
  `${report.split}: baseline ${scores.baseline.passed}/${scores.baseline.total}; improved ${scores.improved.passed}/${scores.improved.total}`,
);
console.log(
  `Positive search success: ${scores.baseline.positivePassed}/${scores.baseline.positiveTotal} -> ${scores.improved.positivePassed}/${scores.improved.positiveTotal}; negative controls: ${scores.baseline.negativePassed}/${scores.baseline.negativeTotal} -> ${scores.improved.negativePassed}/${scores.improved.negativeTotal}`,
);
for (const row of scores.improved.rows.filter((row) => !row.pass))
  console.log(`Remaining failure: ${row.id}`);
