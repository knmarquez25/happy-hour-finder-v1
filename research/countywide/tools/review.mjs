import {
  currentOfferSource,
  currentSource,
  latestReview,
  localDate,
  reviewedSource,
  validTimestamp,
} from "./common.mjs";

export function deriveReviewState(candidate, sources, events, { now }) {
  const today = localDate(now);
  const review = latestReview(candidate, events, now, sources);
  const acceptedEvents = events.filter(
    (event) =>
      event.candidateId === candidate.id &&
      event.revision === candidate.revision &&
      ["accept", "resolve-conflict"].includes(event.decision),
  );
  const accepted = latestReview(candidate, acceptedEvents, now, sources);
  const result = {
    state: "lead",
    reasons: [],
    affectedFields: [],
    lastReviewedAt: accepted?.at || null,
  };
  const applicable = sources.filter((source) =>
    source.branchIds?.includes(candidate.id),
  );
  const offers = applicable.filter(
    (source) =>
      candidate.offerEvidenceSourceIds.includes(source.id) &&
      source.type === "primary" &&
      source.publisherRole === "restaurant" &&
      reviewedSource(source, candidate.id, now, "advertised-offer"),
  );
  const closure = applicable.some(
    (source) =>
      source.id === candidate.operatingSourceId &&
      source.type === "primary" &&
      reviewedSource(source, candidate.id, now, "operating-status") &&
      currentSource(source, now),
  );
  if (
    (candidate.operatingStatus === "closed" && closure) ||
    review?.decision === "exclude" ||
    (offers.length > 0 &&
      offers.every(
        (source) => source.effectiveThrough && source.effectiveThrough < today,
      ))
  ) {
    return {
      ...result,
      state: "excluded",
      reasons: ["Reviewed closure, exclusion, or expired offer"],
    };
  }
  const checks = applicable
    .flatMap((source) => source.checks || [])
    .filter(
      (check) =>
        validTimestamp(check.at) &&
        Date.parse(check.at) <= Date.parse(now) &&
        (!review || Date.parse(check.at) > Date.parse(review.at)) &&
        ["changed", "blocked", "unavailable"].includes(check.outcome),
    );
  if (review?.decision === "request-review" || checks.length) {
    return {
      ...result,
      state: "needs-review",
      reasons: ["Source change, access failure, or unresolved review task"],
      affectedFields: [
        ...new Set([
          ...(review?.affectedFields || []),
          ...checks.flatMap((check) => check.affectedFields || []),
        ]),
      ],
    };
  }
  if (!offers.length)
    return {
      ...result,
      reasons: ["No directly reviewed official advertised offer"],
    };
  const active = offers.filter((source) =>
    currentOfferSource(source, sources, candidate.id, now),
  );
  if (
    active.length &&
    ["accept", "resolve-conflict"].includes(review?.decision) &&
    active.some((source) => review.sourceIds.includes(source.id))
  ) {
    return { ...result, state: "accepted" };
  }
  return {
    ...result,
    state: "pending",
    reasons: [
      "Current revision needs an acceptance decision or effective offer",
    ],
  };
}
