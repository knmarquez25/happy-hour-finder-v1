import { load } from "cheerio";
import { writeFile, readFile } from "node:fs/promises";
import { restaurants as legacy } from "../evaluation/baseline/data.js";
import { collectSource } from "./collect-sources.mjs";
const url =
  "https://downtownla.com/explore/dining-and-drinks/happy-hour-finder";
const page = await collectSource(url),
  $ = load(page.html);
const guide = [];
$(".gcard-content").each((_, el) => {
  const node = $(el);
  guide.push({
    name: node.find(".gcard-label").text().trim(),
    address: node.find(".gcard-address").last().text().trim(),
    specials: node.find(".gcard-address").first().text().trim(),
    hours: node.find(".gcard-offer").text().trim(),
  });
});
const aliases = {
  Joyce: "Joyce Soul and Sea",
  "Perch LA": "Perch",
  "Prank Bar": "Prank",
  "District Restaurant": "District",
  "The Palm - L.A. Downtown": "The Palm - L.A. Downtown",
  "LA Cha Cha Cha": "LA Cha Cha Chá",
};
const overrides = JSON.parse(
  await readFile(
    new URL("../research/dtla-overrides.json", import.meta.url),
    "utf8",
  ),
);
const records = legacy.map((venue) => {
  const match = guide.find(
    (row) => row.name === (aliases[venue.name] || venue.name),
  );
  const id = venue.name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const ambiguous =
    /do not specify days|end time appears incomplete/i.test(venue.sourceNote) ||
    venue.name === "Native Son";
  const record = {
    id,
    name: venue.name,
    neighborhood: venue.neighborhood,
    address: match?.address || "",
    coordinates: null,
    hours: ambiguous
      ? []
      : venue.happyHour.map((window, index) => ({
          ...window,
          id: `guide-${index}`,
          sourceId: "guide",
          status: "secondary",
          restriction: "none",
        })),
    menu: [],
    foodTags: [],
    drinkTags: [],
    atmosphereTags: [],
    legacyEstimateCents: venue.budgetEstimate * 100,
    sources: [
      {
        id: "guide",
        url: match ? url : venue.sourceUrl,
        type: "secondary",
        accessedOn: match ? "2026-10-19" : null,
        reviewedOn: match ? "2026-10-19" : null,
        note: match
          ? `Guide listing: ${match.hours}. ${match.specials}`
          : "Original guide record retained; current listing not independently reviewed.",
      },
    ],
    notes:
      "Original estimate is not a supported combo price. Historical vibe and reputation values are not current verified facts.",
  };
  return { ...record, ...(overrides[id] || {}) };
});
await writeFile(
  new URL("../research/dtla.json", import.meta.url),
  JSON.stringify(records, null, 2) + "\n",
);
console.log(
  `Migrated ${records.length} originals; ${records.filter((r) => r.hours.some((w) => w.status === "primary")).length} with reviewed primary-source schedules.`,
);
