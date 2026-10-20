import { candidateDigest, evidenceDigest } from "../tools/common.mjs";

export const now = "2026-10-19T19:00:00Z";

export function fixture() {
  const batch = {
    manifest: {
      id: "synthetic",
      target: 40,
      effort: { minutes: null, costCents: null },
    },
    candidates: [
      {
        id: "cw-example",
        revision: "1",
        name: "Example Cafe",
        address: {
          street: "100 Main St",
          unit: null,
          city: "Example",
          state: "CA",
          postalCode: "90001",
        },
        county: {
          geoid: "06037",
          sourceId: "county",
          reviewedOn: "2026-10-19",
        },
        coordinates: null,
        identityStatus: "resolved",
        operatingStatus: "unknown",
        operatingSourceId: null,
        offerName: "Happy Hour",
        offerEvidenceSourceIds: ["official"],
        hours: [],
        menu: [],
        specials: [],
        compatiblePairs: [],
        notes: "Synthetic facts only.",
      },
    ],
    sources: [
      {
        id: "official",
        url: "https://restaurant.example/happy-hour",
        type: "primary",
        publisherRole: "restaurant",
        claims: ["advertised-offer"],
        mediaType: "text/html",
        branchIds: ["cw-example"],
        accessedAt: now,
        reviewedAt: now,
        reviewer: "fixture-reviewer",
        reviewMethod: "human-source-inspection",
        accessOutcome: "ok",
        publisherUpdatedOn: null,
        effectiveFrom: null,
        effectiveThrough: null,
        currentLinkSourceId: null,
        locator: "Happy Hour section",
        policyId: "facts",
        note: "Synthetic official branch evidence.",
      },
      {
        id: "county",
        url: "https://government.example/geography",
        type: "primary",
        publisherRole: "government",
        claims: ["county"],
        mediaType: "application/json",
        branchIds: ["cw-example"],
        accessedAt: now,
        reviewedAt: now,
        reviewer: "fixture-reviewer",
        reviewMethod: "human-source-inspection",
        accessOutcome: "ok",
        publisherUpdatedOn: null,
        effectiveFrom: null,
        effectiveThrough: null,
        currentLinkSourceId: null,
        locator: "County GEOID 06037",
        policyId: "facts",
        note: "Synthetic county assignment.",
      },
    ],
    policies: [
      {
        id: "facts",
        sourceOrigins: [
          "https://restaurant.example",
          "https://government.example",
        ],
        checkedAt: now,
        accessMethod: "manual",
        automatedAccess: "unconfirmed",
        factReuse: "allowed",
        publicRetention: "allowed",
        rawRetention: { permission: "denied", maxSeconds: null },
        attribution: "Link to source",
        termsUrl: null,
        robotsUrl: null,
        unresolvedQuestions: [],
      },
    ],
    reviews: [
      {
        id: "review-1",
        candidateId: "cw-example",
        revision: "1",
        at: now,
        reviewer: "fixture-reviewer",
        reviewMethod: "human-source-inspection",
        decision: "accept",
        sourceIds: ["official", "county"],
        affectedFields: [],
        confirmedPairIds: [],
        rationale: "Synthetic accepted revision.",
      },
    ],
    coverage: [],
  };
  batch.sources[0].discoveryContext = "live-branch";
  batch.reviews[0].candidateHash = candidateDigest(batch.candidates[0]);
  batch.reviews[0].evidenceHash = evidenceDigest(
    batch.candidates[0],
    batch.sources,
  );
  return batch;
}

export function pricedFixture() {
  const batch = fixture();
  const candidate = batch.candidates[0];
  candidate.hours = [
    {
      id: "afternoon",
      days: ["Monday"],
      start: "15:00",
      end: "18:00",
      restriction: "none",
      status: "primary",
      sourceId: "official",
    },
  ];
  candidate.menu = [
    {
      id: "food",
      name: "Taco",
      kind: "food",
      priceCents: 600,
      status: "primary",
      sourceId: "official",
      windowIds: ["afternoon"],
      days: ["Monday"],
    },
    {
      id: "drink",
      name: "Beer",
      kind: "drink",
      priceCents: 500,
      status: "primary",
      sourceId: "official",
      windowIds: ["afternoon"],
      days: ["Monday"],
    },
  ];
  candidate.compatiblePairs = [
    {
      id: "pair",
      foodId: "food",
      drinkId: "drink",
      windowId: "afternoon",
      status: "primary",
      sourceId: "official",
    },
  ];
  batch.reviews[0].confirmedPairIds = ["pair"];
  batch.sources[0].claims.push("hours", "menu", "compatible-pair");
  batch.reviews[0].candidateHash = candidateDigest(candidate);
  batch.reviews[0].evidenceHash = evidenceDigest(candidate, batch.sources);
  return batch;
}
