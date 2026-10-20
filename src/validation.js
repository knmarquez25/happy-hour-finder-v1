import { weekdays, toMinutes } from "./matching.js";
import { coverageEligibility, validCoordinates } from "./locations.js";
export function validateRecords(records) {
  const errors = [],
    ids = new Set(),
    addresses = new Set();
  for (const record of records) {
    const prefix = record.id || record.name || "Unnamed record";
    const error = (message) => errors.push(`${prefix}: ${message}`);
    if (!record.id || !record.name || !record.neighborhood)
      error("Missing identity");
    if (ids.has(record.id)) error("Duplicate ID");
    ids.add(record.id);
    if (record.address) {
      const address = record.address.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (addresses.has(address)) error("Duplicate address");
      addresses.add(address);
    }
    const sourceIds = new Set();
    for (const source of record.sources || []) {
      if (!source.id || sourceIds.has(source.id))
        error("Duplicate or missing source ID");
      sourceIds.add(source.id);
      try {
        if (!["https:", "http:"].includes(new URL(source.url).protocol))
          error("Unsafe source URL");
      } catch {
        error("Invalid source URL");
      }
      if (!["primary", "secondary"].includes(source.type))
        error("Unknown source type");
    }
    if (!record.sources?.length) error("Missing source provenance");
    if (record.coordinates) {
      if (!validCoordinates(record.coordinates)) error("Invalid coordinates");
      if (!record.coordinates.sourceUrl) error("Coordinates lack provenance");
      const coverage = coverageEligibility(record);
      if (!coverage.included) error(coverage.reason);
    }
    if (Object.hasOwn(record, "county") && !record.coordinates)
      error("County/location government evidence needs verification");
    const evidence = (item) => {
      if (!sourceIds.has(item.sourceId)) error("Unknown source reference");
      if (
        !["primary", "secondary", "conflicting", "unknown"].includes(
          item.status,
        )
      )
        error("Invalid evidence status");
      if (
        item.status === "primary" &&
        !record.sources.some(
          (s) => s.id === item.sourceId && s.type === "primary" && s.reviewedOn,
        )
      )
        error("Unsupported primary evidence");
    };
    for (const special of record.specials || []) {
      if (typeof special.text !== "string" || !special.text.trim())
        error("Invalid listed special");
      evidence(special);
    }
    for (const window of record.hours || []) {
      if (
        !window.days?.length ||
        window.days.some((day) => !weekdays.includes(day)) ||
        !Number.isFinite(toMinutes(window.start)) ||
        !Number.isFinite(toMinutes(window.end)) ||
        window.start === window.end
      )
        error("Invalid happy-hour window");
      if (
        !["none", "bar-only", "bar-or-patio", "conditional"].includes(
          window.restriction,
        )
      )
        error("Unknown window restriction");
      evidence(window);
    }
    const itemIds = new Set();
    for (const item of record.menu || []) {
      if (
        item.days &&
        (!item.days.length || item.days.some((day) => !weekdays.includes(day)))
      )
        error("Invalid menu item days");
      if (!item.id || itemIds.has(item.id))
        error("Duplicate or missing menu item ID");
      itemIds.add(item.id);
      if (!item.name || !["food", "drink"].includes(item.kind))
        error("Invalid menu item");
      if (
        item.priceCents !== null &&
        (!Number.isSafeInteger(item.priceCents) || item.priceCents <= 0)
      )
        error("Invalid item price");
      if (item.windowIds?.some((id) => !record.hours?.some((w) => w.id === id)))
        error("Unknown item window");
      evidence(item);
    }
    for (const key of ["foodTags", "drinkTags", "atmosphereTags"])
      if (!Array.isArray(record[key])) error(`Missing ${key}`);
  }
  return errors;
}
