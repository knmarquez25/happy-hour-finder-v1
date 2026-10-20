import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateRecords } from "../../../src/validation.js";
import { isMain, loadBatch, localDate } from "./common.mjs";
import { validateBatch } from "./validate.mjs";

export function candidateAddress(candidate) {
  const address = candidate.address;
  return [
    address.street,
    address.unit ? `Suite ${address.unit}` : null,
    address.city,
    `${address.state}${address.postalCode ? ` ${address.postalCode}` : ""}`,
  ]
    .filter(Boolean)
    .join(", ");
}

export function exportAcceptedBatch(batch, { now }) {
  const validation = validateBatch(batch, { now });
  if (validation.errors.length) throw new Error(validation.errors.join("\n"));
  const acceptedIds = new Set(validation.eligibleIds);
  const pendingIds = [...validation.pendingIds];
  const records = [];
  for (const candidate of batch.candidates.filter((candidate) =>
    acceptedIds.has(candidate.id),
  )) {
    if (!candidate.coordinates) {
      pendingIds.push(candidate.id);
      continue;
    }
    const coordinateSource = batch.sources.find(
      (source) => source.id === candidate.coordinates.sourceId,
    );
    const sources = batch.sources
      .filter((source) => source.branchIds.includes(candidate.id))
      .map((source) => ({
        id: source.id,
        url: source.url,
        type: source.type,
        publisherRole: source.publisherRole,
        accessedOn: localDate(source.accessedAt),
        reviewedOn: source.reviewedAt ? localDate(source.reviewedAt) : null,
        reviewMethod: source.reviewMethod,
        publisherUpdatedOn: source.publisherUpdatedOn,
        ...(source.geography ? { geography: source.geography } : {}),
        note: `${source.locator}: ${source.note}`,
      }));
    if (
      candidate.withholdMenuPrices === true &&
      (candidate.menu.some((item) => item.priceCents !== null) ||
        [
          candidate.notes,
          ...sources.map((source) => source.note),
          ...candidate.specials.map((special) => special.text),
        ].some((text) => /\$\s*\d/.test(text)))
    )
      throw new Error(
        `${candidate.id}: withheld menu prices remain in public fields`,
      );
    records.push({
      id: candidate.id,
      name: candidate.name,
      neighborhood: candidate.neighborhood || candidate.address.city,
      address: candidateAddress(candidate),
      county: { ...candidate.county, status: "primary" },
      coordinates: {
        lat: candidate.coordinates.lat,
        lng: candidate.coordinates.lng,
        sourceUrl: coordinateSource?.url,
        precision: candidate.coordinates.precision,
        reviewedOn: candidate.county.reviewedOn,
      },
      hours: structuredClone(candidate.hours),
      menu: structuredClone(candidate.menu),
      foodTags: [
        ...new Set(
          candidate.menu
            .filter((item) => item.kind === "food")
            .flatMap((item) => item.tags || []),
        ),
      ],
      drinkTags: [
        ...new Set(
          candidate.menu
            .filter((item) => item.kind === "drink")
            .flatMap((item) => item.tags || []),
        ),
      ],
      atmosphereTags: [],
      sources,
      ...(candidate.specials.length
        ? { specials: structuredClone(candidate.specials) }
        : {}),
      notes: candidate.notes,
      ...(candidate.withholdMenuPrices === true
        ? { withholdMenuPrices: true }
        : {}),
    });
  }
  const errors = validateRecords(records);
  if (errors.length) throw new Error(errors.join("\n"));
  return {
    records,
    excludedIds: validation.excludedIds,
    pendingIds: [...new Set(pendingIds)],
  };
}

if (isMain(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    const directory = args.shift();
    if (!directory || directory.startsWith("--"))
      throw new Error(
        "Provide STAGING_DIRECTORY, optional --now UTC_TIMESTAMP and --output research/countywide/accepted.json",
      );
    let now = new Date().toISOString();
    let output = null;
    for (let index = 0; index < args.length; index++) {
      if (args[index] === "--now" && args[index + 1]) now = args[++index];
      else if (args[index] === "--output" && args[index + 1])
        output = resolve(args[++index]);
      else throw new Error(`Unknown or incomplete option: ${args[index]}`);
    }
    const allowedOutput = fileURLToPath(
      new URL("../accepted.json", import.meta.url),
    );
    if (output && output !== allowedOutput)
      throw new Error(
        "Output is restricted to research/countywide/accepted.json",
      );
    const result = exportAcceptedBatch(await loadBatch(directory), { now });
    if (output) {
      await writeFile(output, `${JSON.stringify(result.records, null, 2)}\n`);
      console.log(
        JSON.stringify(
          {
            written: result.records.length,
            pendingIds: result.pendingIds,
            excludedIds: result.excludedIds,
          },
          null,
          2,
        ),
      );
    } else console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
