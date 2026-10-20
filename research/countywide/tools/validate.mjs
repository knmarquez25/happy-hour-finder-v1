import {
  cliOptions,
  currentOfferSource,
  currentSource,
  isMain,
  latestReview,
  loadBatch,
  localDate,
  reviewedSource,
  reviewMethods,
  safeUrl,
  states,
  validDate,
  validTimestamp,
  weekdays,
} from "./common.mjs";
import { deriveReviewState } from "./review.mjs";

export function validateBatch(batch, options = {}) {
  try {
    return validateContent(batch, options);
  } catch (error) {
    if (!(error instanceof TypeError)) throw error;
    return {
      errors: [`Malformed input shape: ${error.message}`],
      eligibleIds: [],
      pendingIds: [],
      excludedIds: [],
    };
  }
}

function validateContent(batch, { now } = {}) {
  const result = {
    errors: [],
    eligibleIds: [],
    pendingIds: [],
    excludedIds: [],
  };
  const error = (message) => result.errors.push(message);
  if (!validTimestamp(now)) {
    error("now must be a valid UTC ISO timestamp");
    return result;
  }
  if (!batch || typeof batch !== "object") {
    error("Missing batch");
    return result;
  }
  for (const name of [
    "candidates",
    "sources",
    "policies",
    "reviews",
    "coverage",
  ]) {
    if (
      !Array.isArray(batch[name]) ||
      batch[name].some(
        (item) => !item || typeof item !== "object" || Array.isArray(item),
      )
    )
      error(`Invalid ${name} array`);
  }
  if (!batch.manifest?.id) error("Missing batch manifest identity");
  if (result.errors.length) return result;
  const today = localDate(now);
  const indexes = {};
  for (const name of [
    "candidates",
    "sources",
    "policies",
    "reviews",
    "coverage",
  ]) {
    indexes[name] = new Map();
    for (const item of batch[name]) {
      if (
        typeof item.id !== "string" ||
        !item.id.trim() ||
        indexes[name].has(item.id)
      )
        error(`${name}: duplicate or missing ID`);
      indexes[name].set(item.id, item);
    }
  }
  const initialErrors = result.errors.length;
  for (const policy of batch.policies) {
    const label = `policy ${policy.id}`;
    for (const field of ["automatedAccess", "factReuse", "publicRetention"]) {
      if (!["allowed", "denied", "unconfirmed"].includes(policy[field]))
        error(`${label}: invalid ${field}`);
    }
    if (
      !validTimestamp(policy.checkedAt) ||
      Date.parse(policy.checkedAt) > Date.parse(now)
    )
      error(`${label}: invalid check date`);
    if (
      !Array.isArray(policy.sourceOrigins) ||
      !policy.sourceOrigins.length ||
      policy.sourceOrigins.some(
        (origin) => !safeUrl(origin) || new URL(origin).origin !== origin,
      )
    )
      error(`${label}: invalid source origins`);
    if (!["manual", "automated"].includes(policy.accessMethod))
      error(`${label}: invalid access method`);
    if (
      !["allowed", "denied", "unconfirmed"].includes(
        policy.rawRetention?.permission,
      ) ||
      (policy.rawRetention?.maxSeconds !== null &&
        (!Number.isSafeInteger(policy.rawRetention?.maxSeconds) ||
          policy.rawRetention.maxSeconds < 0))
    )
      error(`${label}: invalid raw retention`);
    for (const field of ["termsUrl", "robotsUrl"])
      if (policy[field] !== null && !safeUrl(policy[field]))
        error(`${label}: invalid ${field}`);
    if (
      typeof policy.attribution !== "string" ||
      !Array.isArray(policy.unresolvedQuestions)
    )
      error(`${label}: missing attribution or unresolved questions`);
  }
  for (const source of batch.sources) {
    const label = `source ${source.id}`;
    if (!safeUrl(source.url)) error(`${label}: unsafe URL`);
    if (
      !["primary", "secondary"].includes(source.type) ||
      !["restaurant", "government", "guide", "directory"].includes(
        source.publisherRole,
      )
    )
      error(`${label}: invalid source type/publisher`);
    if (
      !Array.isArray(source.claims) ||
      !Array.isArray(source.branchIds) ||
      source.branchIds.some((id) => !indexes.candidates.has(id))
    )
      error(`${label}: invalid claims/branch references`);
    if (
      !["ok", "blocked", "unavailable", "search-only"].includes(
        source.accessOutcome,
      )
    )
      error(`${label}: invalid access outcome`);
    if (
      !validTimestamp(source.accessedAt) ||
      Date.parse(source.accessedAt) > Date.parse(now)
    )
      error(`${label}: invalid access date`);
    if (
      source.reviewedAt !== null &&
      !reviewedSource(source, source.branchIds?.[0], now)
    )
      error(
        `${label}: reviewed without successful access, valid dates, or reviewer`,
      );
    if (
      source.reviewedAt === null &&
      (source.reviewer !== null || source.reviewMethod !== null)
    )
      error(`${label}: unreviewed source has reviewer`);
    for (const field of [
      "publisherUpdatedOn",
      "effectiveFrom",
      "effectiveThrough",
    ])
      if (source[field] !== null && !validDate(source[field]))
        error(`${label}: invalid ${field} date`);
    if (
      source.effectiveFrom &&
      source.effectiveThrough &&
      source.effectiveFrom > source.effectiveThrough
    )
      error(`${label}: reversed effective dates`);
    if (
      source.currentLinkSourceId !== null &&
      (!indexes.sources.has(source.currentLinkSourceId) ||
        source.currentLinkSourceId === source.id)
    )
      error(`${label}: invalid current linkage`);
    if (
      source.linkedUrls &&
      (!Array.isArray(source.linkedUrls) ||
        source.linkedUrls.some((url) => !safeUrl(url)))
    )
      error(`${label}: invalid linked URLs`);
    if (
      typeof source.locator !== "string" ||
      !source.locator.trim() ||
      typeof source.note !== "string" ||
      !source.mediaType
    )
      error(`${label}: missing evidence locator, note, or media type`);
    if (
      source.checks &&
      (!Array.isArray(source.checks) ||
        source.checks.some(
          (check) =>
            !check ||
            !validTimestamp(check.at) ||
            Date.parse(check.at) > Date.parse(now) ||
            !["changed", "unchanged", "blocked", "unavailable"].includes(
              check.outcome,
            ) ||
            !Array.isArray(check.affectedFields),
        ))
    )
      error(`${label}: invalid source checks`);
    const policy = indexes.policies.get(source.policyId);
    if (
      !policy ||
      (safeUrl(source.url) &&
        !policy.sourceOrigins?.includes(new URL(source.url).origin))
    )
      error(`${label}: missing or mismatched source policy`);
  }
  for (const review of batch.reviews) {
    const label = `review ${review.id}`;
    if (
      !indexes.candidates.has(review.candidateId) ||
      typeof review.revision !== "string" ||
      !review.revision
    )
      error(`${label}: invalid candidate/revision`);
    if (
      !validTimestamp(review.at) ||
      Date.parse(review.at) > Date.parse(now) ||
      !review.reviewer?.trim() ||
      !reviewMethods.includes(review.reviewMethod)
    )
      error(`${label}: invalid review date or reviewer`);
    if (
      !["accept", "request-review", "exclude", "resolve-conflict"].includes(
        review.decision,
      )
    )
      error(`${label}: invalid decision`);
    if (
      !Array.isArray(review.sourceIds) ||
      review.sourceIds.some((id) => !indexes.sources.has(id))
    )
      error(`${label}: unknown source reference`);
    if (
      !review.rationale?.trim() ||
      !Array.isArray(review.affectedFields) ||
      !Array.isArray(review.confirmedPairIds)
    )
      error(`${label}: missing rationale/field decisions`);
  }
  const globalErrors =
    initialErrors > 0 || result.errors.length > initialErrors;
  for (const candidate of batch.candidates) {
    const before = result.errors.length;
    const label = `candidate ${candidate.id}`;
    const sources = batch.sources.filter((source) =>
      source.branchIds?.includes(candidate.id),
    );
    const byId = (id) => indexes.sources.get(id);
    const supported = (id, claim, role) => {
      const source = byId(id);
      return (
        reviewedSource(source, candidate.id, now, claim) &&
        source.type === "primary" &&
        (!role || source.publisherRole === role) &&
        currentSource(source, now)
      );
    };
    if (
      !candidate.name?.trim() ||
      !candidate.revision?.trim() ||
      !["resolved", "pending"].includes(candidate.identityStatus)
    )
      error(`${label}: invalid identity/revision`);
    if (
      !candidate.address ||
      candidate.address.state !== "CA" ||
      ["street", "city"].some(
        (field) =>
          candidate.address[field] !== null &&
          (typeof candidate.address[field] !== "string" ||
            !candidate.address[field].trim()),
      )
    )
      error(`${label}: invalid address`);
    if (
      !["unknown", "open-listed", "closed"].includes(candidate.operatingStatus)
    )
      error(`${label}: invalid operating status`);
    if (
      candidate.operatingSourceId !== null &&
      !byId(candidate.operatingSourceId)
    )
      error(`${label}: unknown operating source`);
    if (
      !candidate.county ||
      (candidate.county.geoid !== null &&
        !/^\d{5}$/.test(candidate.county.geoid)) ||
      (candidate.county.reviewedOn !== null &&
        (!validDate(candidate.county.reviewedOn) ||
          candidate.county.reviewedOn > today)) ||
      (candidate.county.sourceId !== null && !byId(candidate.county.sourceId))
    )
      error(`${label}: invalid county evidence`);
    if (
      candidate.coordinates !== null &&
      (!Number.isFinite(candidate.coordinates?.lat) ||
        !Number.isFinite(candidate.coordinates?.lng) ||
        Math.abs(candidate.coordinates.lat) > 90 ||
        Math.abs(candidate.coordinates.lng) > 180 ||
        !candidate.coordinates.precision ||
        !byId(candidate.coordinates.sourceId))
    )
      error(`${label}: invalid coordinates`);
    for (const field of [
      "offerEvidenceSourceIds",
      "hours",
      "menu",
      "specials",
      "compatiblePairs",
    ])
      if (!Array.isArray(candidate[field])) error(`${label}: invalid ${field}`);
    if (result.errors.length > before) {
      result.pendingIds.push(candidate.id);
      continue;
    }
    if (candidate.offerEvidenceSourceIds.some((id) => !byId(id)))
      error(`${label}: unknown offer source`);
    const fact = (item, claim) => {
      if (
        !item ||
        !states.includes(item.status) ||
        !byId(item.sourceId)?.branchIds?.includes(candidate.id)
      ) {
        error(`${label}: invalid fact evidence`);
        return;
      }
      if (
        item.status === "primary" &&
        !supported(item.sourceId, claim, "restaurant")
      )
        error(`${label}: unsupported primary ${claim}`);
    };
    const windowIds = new Set();
    for (const window of candidate.hours) {
      if (!window || !window.id || windowIds.has(window.id)) {
        error(`${label}: duplicate/missing window`);
        continue;
      }
      windowIds.add(window.id);
      if (
        !window.days?.length ||
        window.days.some((day) => !weekdays.includes(day)) ||
        !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(window.start) ||
        !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(window.end) ||
        window.start === window.end ||
        !["none", "bar-only", "bar-or-patio", "conditional"].includes(
          window.restriction,
        )
      )
        error(`${label}: invalid window`);
      fact(window, "hours");
    }
    const itemIds = new Set();
    for (const item of candidate.menu) {
      if (!item || !item.id || itemIds.has(item.id)) {
        error(`${label}: duplicate/missing item`);
        continue;
      }
      itemIds.add(item.id);
      if (
        !item.name?.trim() ||
        !["food", "drink"].includes(item.kind) ||
        (item.priceCents !== null &&
          (!Number.isSafeInteger(item.priceCents) || item.priceCents <= 0))
      )
        error(`${label}: invalid menu item/price`);
      if (
        item.days &&
        (!item.days.length || item.days.some((day) => !weekdays.includes(day)))
      )
        error(`${label}: invalid item days`);
      if (
        item.windowIds &&
        (!Array.isArray(item.windowIds) ||
          item.windowIds.some((id) => !windowIds.has(id)))
      )
        error(`${label}: unknown item window`);
      fact(item, "menu");
    }
    for (const special of candidate.specials) {
      if (!special?.text?.trim()) error(`${label}: invalid special`);
      fact(special, "advertised-offer");
    }
    const pairIds = new Set();
    for (const pair of candidate.compatiblePairs) {
      if (
        !pair ||
        !pair.id ||
        pairIds.has(pair.id) ||
        !itemIds.has(pair.foodId) ||
        !itemIds.has(pair.drinkId) ||
        !windowIds.has(pair.windowId)
      )
        error(`${label}: invalid compatible pair`);
      if (pair) {
        pairIds.add(pair.id);
        fact(pair, "compatible-pair");
      }
    }
    const review = latestReview(candidate, batch.reviews, now, batch.sources);
    if (review?.confirmedPairIds.some((id) => !pairIds.has(id)))
      error(`${label}: unknown reviewed pair`);
    const offers = candidate.offerEvidenceSourceIds
      .map(byId)
      .filter(
        (source) =>
          reviewedSource(source, candidate.id, now, "advertised-offer") &&
          source.type === "primary" &&
          source.publisherRole === "restaurant",
      );
    const closed =
      candidate.operatingStatus === "closed" &&
      supported(candidate.operatingSourceId, "operating-status");
    const expired =
      offers.length > 0 &&
      offers.every(
        (source) => source.effectiveThrough && source.effectiveThrough < today,
      );
    const outside =
      candidate.county?.geoid &&
      !["06037", "06059"].includes(candidate.county.geoid) &&
      supported(candidate.county.sourceId, "county", "government");
    if (closed || expired || outside || review?.decision === "exclude") {
      result.excludedIds.push(candidate.id);
      continue;
    }
    const official = offers.filter((source) =>
      currentOfferSource(source, batch.sources, candidate.id, now),
    );
    const evidenceIds = [
      ...candidate.offerEvidenceSourceIds,
      candidate.county.sourceId,
      candidate.operatingSourceId,
      candidate.coordinates?.sourceId,
      ...candidate.hours.map((fact) => fact.sourceId),
      ...candidate.menu.map((fact) => fact.sourceId),
      ...candidate.specials.map((fact) => fact.sourceId),
      ...candidate.compatiblePairs.map((fact) => fact.sourceId),
      ...sources.map((source) => source.id),
    ].filter(Boolean);
    const publicAllowed = evidenceIds.every((id) => {
      const policy = indexes.policies.get(byId(id)?.policyId);
      return (
        policy?.factReuse === "allowed" &&
        policy?.publicRetention === "allowed" &&
        (policy.accessMethod !== "automated" ||
          policy.automatedAccess === "allowed") &&
        review &&
        Date.parse(policy.checkedAt) <= Date.parse(review.at)
      );
    });
    const accepted =
      ["accept", "resolve-conflict"].includes(review?.decision) &&
      official.some((source) => review.sourceIds.includes(source.id)) &&
      review.sourceIds.includes(candidate.county.sourceId);
    const county =
      ["06037", "06059"].includes(candidate.county?.geoid) &&
      candidate.county.reviewedOn &&
      supported(candidate.county.sourceId, "county", "government");
    const workflow =
      !globalErrors && result.errors.length === before
        ? deriveReviewState(candidate, batch.sources, batch.reviews, { now })
        : { state: "pending" };
    if (
      !globalErrors &&
      result.errors.length === before &&
      candidate.address.street &&
      candidate.address.city &&
      candidate.operatingStatus !== "closed" &&
      candidate.identityStatus === "resolved" &&
      accepted &&
      county &&
      publicAllowed &&
      workflow.state === "accepted"
    )
      result.eligibleIds.push(candidate.id);
    else result.pendingIds.push(candidate.id);
  }
  for (const area of batch.coverage) {
    if (
      !area.name ||
      !["06037", "06059"].includes(area.countyGeoid) ||
      !["region", "city", "unincorporated"].includes(area.jurisdictionType) ||
      !["not-started", "in-progress", "reviewed-search"].includes(
        area.scopeStatus,
      ) ||
      !Array.isArray(area.candidateIds) ||
      area.candidateIds.some((id) => !indexes.candidates.has(id)) ||
      !Array.isArray(area.attempts) ||
      (area.boundarySourceUrl !== null && !safeUrl(area.boundarySourceUrl))
    )
      error(`coverage ${area.id}: invalid area`);
  }
  if (result.errors.length) {
    result.pendingIds = [
      ...new Set([...result.pendingIds, ...result.eligibleIds]),
    ];
    result.eligibleIds = [];
  }
  return result;
}

if (isMain(import.meta.url)) {
  try {
    const { directory, now } = cliOptions(process.argv.slice(2));
    const result = validateBatch(await loadBatch(directory), { now });
    console.log(JSON.stringify(result, null, 2));
    if (result.errors.length) process.exitCode = 1;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
