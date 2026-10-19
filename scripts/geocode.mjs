import { readFile, writeFile, mkdir } from "node:fs/promises";
import { parse } from "csv-parse/sync";
const base = new URL("../research/", import.meta.url);
const cacheUrl = new URL("coordinates.json", base);
let cache = {};
try {
  cache = JSON.parse(await readFile(cacheUrl, "utf8"));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
const records = [];
for (const file of ["dtla", "west", "north", "central"]) {
  try {
    records.push(
      ...JSON.parse(await readFile(new URL(`${file}.json`, base), "utf8")),
    );
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}
const pending = records.filter(
  (record) => record.address && !record.coordinates && !cache[record.address],
);
if (!pending.length) {
  console.log("No new public venue addresses to geocode.");
  process.exit(0);
}
const quote = (value) => '"' + String(value).replaceAll('"', '""') + '"';
const csv = pending
  .map((record, index) => {
    const parts = record.address
      .replace(/,?\s*USA$/i, "")
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    const street = parts[0].replace(/\s+(?:suite|ste|unit|#)\s*[\w-]+/gi, "");
    const city = parts[1] || "";
    const zip = record.address.match(/\b9\d{4}\b/)?.[0] || "";
    return [index, street, city, "CA", zip].map(quote).join(",");
  })
  .join("\n");
const form = new FormData();
form.set("benchmark", "Public_AR_Current");
form.set("addressFile", new Blob([csv], { type: "text/csv" }), "venues.csv");
const endpoint =
  "https://geocoding.geo.census.gov/geocoder/locations/addressbatch";
const response = await fetch(endpoint, {
  method: "POST",
  body: form,
  signal: AbortSignal.timeout(180000),
});
if (!response.ok) throw new Error(`Census geocoder failed: ${response.status}`);
const text = await response.text();
await mkdir(new URL("cache/", base), { recursive: true });
await writeFile(new URL(`cache/census-${Date.now()}.csv`, base), text);
const rows = parse(text, { skip_empty_lines: true, relax_column_count: true });
let matched = 0;
for (const row of rows) {
  const record = pending[Number(row[0])];
  if (!record) continue;
  if (row[2] === "Match" && row[3] === "Exact" && row[5]) {
    const [lng, lat] = row[5].split(",").map(Number);
    const zip = record.address.match(/\b9\d{4}\b/)?.[0];
    const house = record.address.match(/^\s*(\d+)/)?.[1];
    if (
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      /\bCA\b/.test(row[4]) &&
      (!zip || row[4].includes(zip)) &&
      (!house || row[4].startsWith(house + " "))
    ) {
      cache[record.address] = {
        lat,
        lng,
        sourceUrl: endpoint,
        precision: "address-range interpolation",
        matchedAddress: row[4],
        reviewedOn: "2026-10-19",
        benchmark: "Public_AR_Current",
      };
      matched++;
      continue;
    }
  }
  console.log(
    `Needs manual location review: ${record.name} (${row[2] || "unknown"}, ${row[3] || "unknown"})`,
  );
}
await writeFile(cacheUrl, JSON.stringify(cache, null, 2) + "\n");
console.log(
  `Geocoded ${matched}/${pending.length} new venue addresses. Coordinate estimates are street-range interpolations, not building entrance GPS.`,
);
