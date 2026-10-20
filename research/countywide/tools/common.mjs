import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";

export const weekdays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
export const reviewMethods = [
  "agent-source-inspection",
  "human-source-inspection",
];
export const states = ["primary", "secondary", "conflicting", "unknown"];

export function validDate(value) {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}

export function validTimestamp(value) {
  return (
    typeof value === "string" &&
    validDate(value.slice(0, 10)) &&
    /^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,3})?Z$/.test(
      value,
    ) &&
    Number.isFinite(Date.parse(value))
  );
}

export function localDate(now) {
  if (!validTimestamp(now))
    throw new Error("now must be a valid UTC ISO timestamp");
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(now));
}

export function safeUrl(value) {
  try {
    const url = new URL(value);
    return (
      ["https:", "http:"].includes(url.protocol) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

export function reviewedSource(source, candidateId, now, claim) {
  return Boolean(
    source &&
    source.accessOutcome === "ok" &&
    validTimestamp(source.accessedAt) &&
    validTimestamp(source.reviewedAt) &&
    Date.parse(source.accessedAt) <= Date.parse(source.reviewedAt) &&
    Date.parse(source.reviewedAt) <= Date.parse(now) &&
    typeof source.reviewer === "string" &&
    source.reviewer.trim() &&
    reviewMethods.includes(source.reviewMethod) &&
    source.branchIds?.includes(candidateId) &&
    (!claim || source.claims?.includes(claim)),
  );
}

export function currentSource(source, now) {
  const today = localDate(now);
  return (
    (!source.effectiveFrom || source.effectiveFrom <= today) &&
    (!source.effectiveThrough || source.effectiveThrough >= today)
  );
}

export function currentOfferSource(source, sources, candidateId, now) {
  if (!currentSource(source, now)) return false;
  if (
    source.discoveryContext === "live-branch" &&
    source.mediaType === "text/html"
  )
    return true;
  if (source.discoveryContext !== "linked-menu") return false;
  const parent = sources.find(
    (record) => record.id === source.currentLinkSourceId,
  );
  return Boolean(
    parent &&
    parent.type === "primary" &&
    parent.publisherRole === "restaurant" &&
    parent.discoveryContext === "live-branch" &&
    parent.mediaType === "text/html" &&
    parent.linkedUrls?.includes(source.url) &&
    reviewedSource(parent, candidateId, now) &&
    currentSource(parent, now),
  );
}

export function latestReview(candidate, events, now, sources = []) {
  return events
    .filter(
      (event) =>
        event.candidateId === candidate.id &&
        event.revision === candidate.revision &&
        (!["accept", "resolve-conflict"].includes(event.decision) ||
          (event.candidateHash === candidateDigest(candidate) &&
            event.evidenceHash === evidenceDigest(candidate, sources) &&
            sources
              .filter(
                (source) =>
                  source.branchIds?.includes(candidate.id) && source.reviewedAt,
              )
              .every(
                (source) =>
                  Date.parse(source.reviewedAt) <= Date.parse(event.at),
              ))) &&
        validTimestamp(event.at) &&
        Date.parse(event.at) <= Date.parse(now) &&
        typeof event.reviewer === "string" &&
        event.reviewer.trim() &&
        reviewMethods.includes(event.reviewMethod),
    )
    .sort((left, right) => Date.parse(left.at) - Date.parse(right.at))
    .at(-1);
}

export function candidateDigest(candidate) {
  return contentDigest(candidate);
}

export function evidenceDigest(candidate, sources) {
  return contentDigest(
    sources
      .filter((source) => source.branchIds?.includes(candidate.id))
      .map(({ checks, accessedAt, ...evidence }) => evidence)
      .sort((left, right) => left.id.localeCompare(right.id)),
  );
}

function contentDigest(value) {
  const canonical = (value) =>
    Array.isArray(value)
      ? value.map(canonical)
      : value && typeof value === "object"
        ? Object.fromEntries(
            Object.keys(value)
              .sort()
              .map((key) => [key, canonical(value[key])]),
          )
        : value;
  return createHash("sha256")
    .update(JSON.stringify(canonical(value)))
    .digest("hex");
}

export function isMain(metaUrl) {
  return Boolean(
    process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === metaUrl,
  );
}

export async function loadBatch(directory) {
  const names = [
    "batch",
    "candidates",
    "sources",
    "policies",
    "reviews",
    "coverage",
  ];
  const entries = await Promise.all(
    names.map(async (name) => [
      name === "batch" ? "manifest" : name,
      JSON.parse(await readFile(resolve(directory, `${name}.json`), "utf8")),
    ]),
  );
  return Object.fromEntries(entries);
}

export function cliOptions(args) {
  const directory = args[0];
  if (!directory || directory.startsWith("--"))
    throw new Error(
      "Provide a staging directory, then optional --now UTC_TIMESTAMP and --markdown",
    );
  let now = new Date().toISOString();
  let markdown = false;
  for (let index = 1; index < args.length; index++) {
    if (args[index] === "--markdown") markdown = true;
    else if (args[index] === "--now" && args[index + 1]) now = args[++index];
    else throw new Error(`Unknown or incomplete option: ${args[index]}`);
  }
  localDate(now);
  return { directory, now, markdown };
}
