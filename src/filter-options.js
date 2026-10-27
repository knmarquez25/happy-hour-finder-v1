import { discover, eligibleMenuItems, emptyPreferences } from "./discovery.js";
import { contradictsSchedule } from "./request-schedule.js";
import { matchingPreferences } from "./matching.js";

// Use the same word normalization as matching, so equivalent options return the
// same venues. Display labels keep the original spelling from the source menu.
export const canonicalTerm = (value) =>
  String(value)
    .toLowerCase()
    .trim()
    .split(/[^a-z0-9]+/)
    .map((word) => word.replace(/s$/, ""))
    .filter(Boolean)
    .join(" ");

export function filterOptions(venues, kind, preferences = emptyPreferences()) {
  const key = kind === "food" ? "foodPreferences" : "drinkPreferences";
  const context = { ...preferences, [key]: [] };
  const matching = discover(venues, context);
  const options = new Map();
  for (const venue of venues) {
    for (const item of venue.menu || []) {
      if (item.kind !== kind) continue;
      for (const [value, category] of [
        [item.name, false],
        ...(item.tags || []).map((tag) => [tag, true]),
      ]) {
        const canonical = canonicalTerm(value);
        if (!canonical) continue;
        if (!options.has(canonical))
          options.set(canonical, {
            value: canonical,
            label: String(value).trim(),
            category,
            count: 0,
          });
        else if (category) options.get(canonical).category = true;
      }
    }
  }
  // A venue counts once per term, irrespective of how many matching menu items
  // it has. Timing, source confidence, and opposite-kind choices use discovery.
  for (const row of matching) {
    const items = eligibleMenuItems(row.venue, context).filter(
      (item) => item.kind === kind,
    );
    for (const option of options.values()) {
      if (
        items.some(
          (item) =>
            matchingPreferences(
              [item.name, ...(item.tags || [])],
              [option.label],
            ).length,
        )
      )
        option.count++;
    }
  }
  return [...options.values()].sort(
    (a, b) =>
      Number(b.category) - Number(a.category) ||
      b.count - a.count ||
      a.label.localeCompare(b.label),
  );
}

export function pendingMatches(candidate, p = emptyPreferences()) {
  if (p.area) {
    const normalize = (value) =>
      String(value || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
    const area = normalize(p.area);
    const locations = [
      candidate.location,
      candidate.county,
      ...(candidate.address || "").split(","),
    ].map(normalize);
    if (!locations.includes(area)) return false;
  }
  for (const [kind, terms] of [
    ["food", p.foodPreferences],
    ["drink", p.drinkPreferences],
  ]) {
    if (
      terms.some(
        (term) =>
          !candidate.items.some(
            (item) =>
              item.kind === kind &&
              matchingPreferences([item.name], [term]).length,
          ),
      )
    )
      return false;
  }
  if (contradictsSchedule(candidate.hoursText, webQuery(p))) return false;
  // Pending records have no owner-supported schedules or pairing totals. They
  // remain provisional options; do not invent a day/time or budget match.
  return true;
}

export function webQuery(p = emptyPreferences()) {
  const essential = [
    "Happy hour",
    p.area ? `in ${p.area}` : "in LA County or Orange County",
    p.day || "",
    p.time || p.timePeriod || "",
    p.budget !== null ? `food and drink target $${p.budget}` : "",
  ]
    .filter(Boolean)
    .join(" · ");
  const details = [
    p.foodPreferences.length ? `food: ${p.foodPreferences.join(", ")}` : "",
    p.drinkPreferences.length ? `drinks: ${p.drinkPreferences.join(", ")}` : "",
    p.atmosphere ? `${p.atmosphere} atmosphere` : "",
  ].filter(Boolean);
  // Keep exact location/time/budget and reserve room for each kind of preference.
  // Long food lists must not crowd out drinks or silently drop the requested time.
  const limit = details.length
    ? Math.max(
        0,
        Math.floor(
          (1000 - essential.length - details.length * 3) / details.length,
        ),
      )
    : 0;
  return [essential, ...details.map((detail) => detail.slice(0, limit))]
    .filter(Boolean)
    .join(" · ")
    .slice(0, 1000);
}
