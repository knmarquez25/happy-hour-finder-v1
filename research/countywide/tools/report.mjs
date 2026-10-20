import {
  cliOptions,
  currentOfferSource,
  isMain,
  latestReview,
  loadBatch,
  reviewedSource,
} from "./common.mjs";
import { validateBatch } from "./validate.mjs";

function positivePrice(item) {
  return (
    item?.status === "primary" &&
    Number.isSafeInteger(item.priceCents) &&
    item.priceCents > 0
  );
}

function pricedPair(candidate, reviews, sources, now) {
  const review = latestReview(candidate, reviews, now, sources);
  return candidate.compatiblePairs.some((pair) => {
    if (
      pair.status !== "primary" ||
      !review?.confirmedPairIds.includes(pair.id)
    )
      return false;
    const food = candidate.menu.find(
      (item) => item.id === pair.foodId && item.kind === "food",
    );
    const drink = candidate.menu.find(
      (item) => item.id === pair.drinkId && item.kind === "drink",
    );
    const window = candidate.hours.find(
      (item) =>
        item.id === pair.windowId &&
        item.status === "primary" &&
        item.restriction !== "conditional",
    );
    return Boolean(
      positivePrice(food) &&
      positivePrice(drink) &&
      window &&
      food.windowIds?.includes(window.id) &&
      drink.windowIds?.includes(window.id) &&
      window.days.some(
        (day) =>
          (!food.days || food.days.includes(day)) &&
          (!drink.days || drink.days.includes(day)),
      ),
    );
  });
}

export function summarizeBatch(batch, { now }) {
  const validation = validateBatch(batch, { now });
  if (validation.errors.length)
    batch = {
      manifest: batch?.manifest,
      candidates: [],
      sources: [],
      reviews: [],
      coverage: [],
    };
  const candidates = [
    ...new Map(
      (batch?.candidates || [])
        .filter(Boolean)
        .map((candidate) => [candidate.id, candidate]),
    ).values(),
  ];
  const sources = batch?.sources || [];
  const eligible = new Set(validation.eligibleIds);
  const admitted = candidates.filter((candidate) => eligible.has(candidate.id));
  const researched = candidates.filter((candidate) =>
    sources.some((source) => reviewedSource(source, candidate.id, now)),
  ).length;
  const counts = (records) => ({
    discovered: records.length,
    admitted: records.filter((candidate) => eligible.has(candidate.id)).length,
  });
  const byCounty = {};
  for (const geoid of ["06037", "06059", "unverified"]) {
    byCounty[geoid] = counts(
      candidates.filter((candidate) => {
        const countySource = sources.find(
          (source) => source.id === candidate.county?.sourceId,
        );
        const verified =
          candidate.county?.reviewedOn &&
          countySource?.publisherRole === "government" &&
          countySource.type === "primary" &&
          reviewedSource(countySource, candidate.id, now, "county");
        return (verified ? candidate.county.geoid : "unverified") === geoid;
      }),
    );
  }
  const measured = (value) =>
    typeof value === "number" && Number.isFinite(value) && value >= 0
      ? value
      : null;
  return {
    batchId: batch?.manifest?.id || null,
    discovered: candidates.length,
    researched,
    admitted: admitted.length,
    pending: new Set(validation.pendingIds).size,
    excluded: new Set(validation.excludedIds).size,
    target: batch?.manifest?.target ?? null,
    byCounty,
    byRegion: (batch?.coverage || []).map((area) => ({
      id: area.id,
      name: area.name,
      scopeStatus: area.scopeStatus,
      ...counts(
        candidates.filter((candidate) =>
          area.candidateIds?.includes(candidate.id),
        ),
      ),
    })),
    evidence: {
      observedOfficialOffers: candidates.filter((candidate) =>
        candidate.offerEvidenceSourceIds?.some((id) => {
          const source = sources.find((record) => record.id === id);
          return (
            source?.type === "primary" &&
            source.publisherRole === "restaurant" &&
            reviewedSource(source, candidate.id, now, "advertised-offer") &&
            currentOfferSource(source, sources, candidate.id, now)
          );
        }),
      ).length,
      advertisedOffers: admitted.length,
      primarySchedules: admitted.filter((candidate) =>
        candidate.hours.some(
          (window) =>
            window.status === "primary" && window.restriction !== "conditional",
        ),
      ).length,
      pricedFood: admitted.filter((candidate) =>
        candidate.menu.some(
          (item) => item.kind === "food" && positivePrice(item),
        ),
      ).length,
      pricedDrinks: admitted.filter((candidate) =>
        candidate.menu.some(
          (item) => item.kind === "drink" && positivePrice(item),
        ),
      ).length,
      compatiblePricedPairs: admitted.filter((candidate) =>
        pricedPair(candidate, batch.reviews, sources, now),
      ).length,
    },
    researchProgress: {
      numerator: researched,
      denominator: candidates.length,
      percent: candidates.length
        ? Math.round((researched / candidates.length) * 1000) / 10
        : null,
      scope: "this batch only",
    },
    effort: {
      minutes: measured(batch?.manifest?.effort?.minutes),
      costCents: measured(batch?.manifest?.effort?.costCents),
    },
    limitations: [
      "Batch research progress is not countywide completeness or recall.",
      "An observed official offer is not an admitted branch until identity, geography, retention, and review checks pass.",
      "Source review does not guarantee same-day availability. Unknown prices and effort remain unknown.",
    ],
    errors: validation.errors,
  };
}

export function formatMarkdown(report) {
  return [
    "# Countywide Pilot Summary",
    "",
    `Discovered: ${report.discovered}; researched: ${report.researched}; Admitted: ${report.admitted}; pending: ${report.pending}; excluded: ${report.excluded}.`,
    "",
    `Observed official offers: ${report.evidence.observedOfficialOffers}. Compatible priced pairs among admitted branches: ${report.evidence.compatiblePricedPairs}.`,
    "",
    ...report.limitations.map((note) => `- ${note}`),
    ...(report.errors.length
      ? [
          "",
          "Validation errors:",
          ...report.errors.map((error) => `- ${error.replace(/[\r\n]/g, " ")}`),
        ]
      : []),
    "",
  ].join("\n");
}

if (isMain(import.meta.url)) {
  try {
    const { directory, now, markdown } = cliOptions(process.argv.slice(2));
    const report = summarizeBatch(await loadBatch(directory), { now });
    console.log(
      markdown ? formatMarkdown(report) : JSON.stringify(report, null, 2),
    );
    if (report.errors.length) process.exitCode = 1;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
