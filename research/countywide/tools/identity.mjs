import { readFile } from "node:fs/promises";
import { isMain, loadBatch } from "./common.mjs";

function normalize(value) {
  return String(value || "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(
      /\b(street|avenue|boulevard|road|drive|highway)\b/g,
      (word) =>
        ({
          street: "st",
          avenue: "ave",
          boulevard: "blvd",
          road: "rd",
          drive: "dr",
          highway: "hwy",
        })[word],
    )
    .replace(/[^a-z0-9]/g, "");
}

function location(address) {
  const parts =
    typeof address === "string"
      ? address.split(",").map((part) => part.trim())
      : null;
  const street = parts ? parts[0] : address?.street || "";
  const unitPattern = /\b(?:suite|ste|unit)\s*([\w-]+)|#\s*([\w-]+)/i;
  const unitMatch = (parts?.join(" ") || street).match(unitPattern);
  return {
    street: normalize(street.replace(unitPattern, "")),
    city: normalize(
      parts
        ? parts
            .slice(1)
            .find((part) => !unitPattern.test(part))
            ?.replace(/\bCA\b.*$/i, "")
        : address?.city,
    ),
    zip: parts
      ? address.match(/\b\d{5}\b/)?.[0] || ""
      : address?.postalCode || "",
    unit: normalize(
      (typeof address === "object" && address?.unit) ||
        unitMatch?.[1] ||
        unitMatch?.[2],
    ),
  };
}

function sameLocation(left, right) {
  return (
    left.street &&
    left.street === right.street &&
    ((left.city && right.city && left.city === right.city) ||
      (left.zip && right.zip && left.zip === right.zip)) &&
    !(left.unit && right.unit && left.unit !== right.unit)
  );
}

function sharedExternalId(left, right) {
  const allowed = (record) =>
    (record.externalIds || []).filter(
      (item) =>
        item.policy?.factReuse === "allowed" &&
        item.policy?.publicRetention === "allowed",
    );
  return allowed(left).some((first) =>
    allowed(right).some(
      (second) => first.provider === second.provider && first.id === second.id,
    ),
  );
}

export function suggestDuplicates(candidates, existingRecords) {
  const suggestions = [];
  const compare = (left, right, existing) => {
    const currentMatch = sameLocation(
      location(left.address),
      location(right.address),
    );
    const historyMatch =
      (left.history || []).some((record) =>
        sameLocation(location(record.address), location(right.address)),
      ) ||
      (right.history || []).some((record) =>
        sameLocation(location(record.address), location(left.address)),
      );
    const externalMatch = sharedExternalId(left, right);
    if (!currentMatch && !historyMatch && !externalMatch) return;
    suggestions.push({
      candidateIds: existing ? [left.id] : [left.id, right.id],
      existingIds: existing ? [right.id] : [],
      reason: historyMatch
        ? "Recorded address history; review relocation/rebrand"
        : externalMatch
          ? "Shared permitted external ID"
          : normalize(left.name) === normalize(right.name)
            ? "Similar name and address"
            : "Shared address; may be separate restaurants",
      requiresReview: true,
    });
  };
  candidates.forEach((candidate, index) => {
    candidates
      .slice(index + 1)
      .forEach((other) => compare(candidate, other, false));
    existingRecords.forEach((other) => compare(candidate, other, true));
  });
  return suggestions;
}

if (isMain(import.meta.url)) {
  try {
    if (process.argv.length !== 3)
      throw new Error("Usage: node tools/identity.mjs STAGING_DIRECTORY");
    const { candidates } = await loadBatch(process.argv[2]);
    const existing = (
      await Promise.all(
        ["dtla", "west", "north", "central"].map(async (name) =>
          JSON.parse(
            await readFile(
              new URL(`../../${name}.json`, import.meta.url),
              "utf8",
            ),
          ),
        ),
      )
    ).flat();
    console.log(
      JSON.stringify(suggestDuplicates(candidates, existing), null, 2),
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
