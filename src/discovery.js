import {
  weekdays,
  isHappyHourActive,
  matchingPreferences,
  selectCombo,
  toMinutes,
} from "./matching.js";
import { origins } from "./locations.js";

export const emptyPreferences = () => ({
  area: null,
  foodPreferences: [],
  drinkPreferences: [],
  budget: null,
  day: null,
  time: null,
  atmosphere: null,
  clarification: null,
});
const city = (venue) => venue.address?.split(",").at(-2)?.trim() || "";
export function areaOptions(venues) {
  return [
    ...new Set(
      [
        "LA County",
        "Orange County",
        ...origins.map((o) => o.name),
        ...venues.flatMap((v) => [v.neighborhood, city(v)]),
      ].filter(Boolean),
    ),
  ].sort();
}
export function validatePreferences(value, venues) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("The AI returned an invalid request. Please try again.");
  const defaults = emptyPreferences();
  if (Object.keys(value).some((k) => !Object.hasOwn(defaults, k)))
    throw new Error("The AI returned unsupported request fields.");
  const p = { ...defaults, ...value };
  for (const key of ["area", "atmosphere", "clarification"]) {
    if (
      p[key] !== null &&
      (typeof p[key] !== "string" || !p[key].trim() || p[key].length > 400)
    )
      throw new Error("The AI returned invalid text.");
  }
  if (p.area !== null && !areaOptions(venues).includes(p.area))
    throw new Error("That area is not supported by this researched dataset.");
  for (const key of ["foodPreferences", "drinkPreferences"]) {
    if (
      !Array.isArray(p[key]) ||
      p[key].length > 8 ||
      p[key].some((v) => typeof v !== "string" || !v.trim() || v.length > 60)
    )
      throw new Error("The AI returned invalid menu preferences.");
    p[key] = [...new Set(p[key].map((v) => v.trim().toLowerCase()))];
  }
  if (
    p.budget !== null &&
    (!Number.isFinite(p.budget) || p.budget < 1 || p.budget > 500)
  )
    throw new Error("Use a budget target from $1 to $500.");
  if (p.day !== null && !weekdays.includes(p.day))
    throw new Error("The AI returned an invalid day.");
  if (
    p.time !== null &&
    (typeof p.time !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(p.time))
  )
    throw new Error("The AI returned an invalid time.");
  return p;
}
export function primaryEvidence(venue, record) {
  return (
    record.status === "primary" &&
    Boolean(
      venue.sources?.some(
        (s) => s.id === record.sourceId && s.type === "primary" && s.reviewedOn,
      ),
    )
  );
}
function contexts(venue, p) {
  const result = [];
  for (const window of venue.hours || []) {
    if (
      !primaryEvidence(venue, window) ||
      !["none", "bar-only", "bar-or-patio", undefined].includes(
        window.restriction,
      )
    )
      continue;
    for (const day of p.day ? [p.day] : weekdays) {
      const times = p.time ? [p.time] : [window.start, "00:00"];
      for (const time of times)
        if (isHappyHourActive({ hours: [window] }, day, time))
          result.push({ day, time, window });
    }
  }
  return result;
}
function applies(item, context) {
  const w = context.window;
  const weekday =
    toMinutes(w.start) > toMinutes(w.end) &&
    toMinutes(context.time) < toMinutes(w.end)
      ? weekdays[(weekdays.indexOf(context.day) + 6) % 7]
      : context.day;
  return (
    (!item.windowIds || item.windowIds.includes(w.id)) &&
    (!item.days || item.days.includes(weekday))
  );
}
function eligibleItems(venue, p, points) {
  return (venue.menu || []).filter(
    (item) =>
      primaryEvidence(venue, item) && points.some((c) => applies(item, c)),
  );
}
function areaMatches(venue, area) {
  if (!area) return true;
  if (area === "LA County")
    return !venue.county || venue.county.geoid === "06037";
  if (area === "Orange County") return venue.county?.geoid === "06059";
  if (area === "Downtown LA")
    return (
      /los angeles/i.test(city(venue)) &&
      [
        "South Park",
        "Downtown",
        "DTLA",
        "Historic Core",
        "Little Tokyo",
        "Arts District",
        "Financial District",
        "Bunker Hill",
        "Chinatown",
      ].includes(venue.neighborhood)
    );
  return [venue.neighborhood, city(venue)].some(
    (v) => v?.toLowerCase() === area.toLowerCase(),
  );
}
function suggestedCombo(venue, p, points) {
  const combos = [];
  for (const c of points) {
    const combo = selectCombo(venue, {
      originId: "dtla",
      day: c.day,
      time: c.time,
      budget: p.budget ?? 25,
      maxDistance: 25,
      foodPreferences: p.foodPreferences,
      drinkPreferences: p.drinkPreferences,
      requireFood: p.foodPreferences.length > 0,
      requireDrinks: p.drinkPreferences.length > 0,
      includeRestricted: true,
    });
    if (combo) {
      // selectCombo may find another overlapping window: identify the actual shared window.
      const actual = points.find(
        (point) =>
          point.day === c.day &&
          point.time === c.time &&
          applies(combo.food, point) &&
          applies(combo.drink, point) &&
          ["none", "bar-only", "bar-or-patio", undefined].includes(
            point.window.restriction,
          ),
      );
      if (actual) combos.push({ combo, window: actual.window });
    }
  }
  return (
    combos.sort(
      (a, b) =>
        b.combo.preferenceMatches - a.combo.preferenceMatches ||
        a.combo.totalCents - b.combo.totalCents,
    )[0] || { combo: null, window: null }
  );
}
export function discover(venues, raw = emptyPreferences()) {
  const p = validatePreferences(raw, venues);
  if (p.clarification) return [];
  return venues
    .flatMap((venue) => {
      if (!areaMatches(venue, p.area)) return [];
      const points = contexts(venue, p);
      if ((p.day || p.time) && !points.length) return [];
      const items = eligibleItems(venue, p, points);
      if (
        p.foodPreferences.some(
          (pref) =>
            !items.some(
              (i) =>
                i.kind === "food" &&
                matchingPreferences([i.name, ...(i.tags || [])], [pref]).length,
            ),
        )
      )
        return [];
      if (
        p.drinkPreferences.some(
          (pref) =>
            !items.some(
              (i) =>
                i.kind === "drink" &&
                matchingPreferences([i.name, ...(i.tags || [])], [pref]).length,
            ),
        )
      )
        return [];
      if (
        p.atmosphere &&
        !matchingPreferences(venue.atmosphereTags || [], [p.atmosphere]).length
      )
        return [];
      const chosen = suggestedCombo(venue, p, points);
      const reasons = [];
      if (p.foodPreferences.length)
        reasons.push("Listed food: " + p.foodPreferences.join(", "));
      if (p.drinkPreferences.length)
        reasons.push("Listed drinks: " + p.drinkPreferences.join(", "));
      if (p.day || p.time) reasons.push("Restaurant-listed schedule matches");
      if (p.atmosphere) reasons.push(p.atmosphere + " atmosphere (editorial)");
      return [
        {
          venue,
          ...chosen,
          reasons,
          budgetDifferenceCents:
            p.budget !== null && chosen.combo
              ? chosen.combo.totalCents - Math.round(p.budget * 100)
              : null,
        },
      ];
    })
    .sort((a, b) => {
      if (p.budget !== null) {
        const diff = (x) =>
          x.budgetDifferenceCents === null
            ? Infinity
            : Math.max(0, x.budgetDifferenceCents);
        const delta = diff(a) - diff(b);
        if (delta && !Number.isNaN(delta)) return delta;
      }
      return (
        a.venue.name.localeCompare(b.venue.name) ||
        a.venue.id.localeCompare(b.venue.id)
      );
    });
}
export function menuSelection(venue, selectedIds, p = emptyPreferences()) {
  const ids = [...new Set(selectedIds)];
  const selected = ids.map((id) => {
    const item = venue.menu.find((i) => i.id === id);
    if (!item) throw new Error("That item is not on this menu.");
    return item;
  });
  const supported = selected.every((i) => primaryEvidence(venue, i));
  const compatible =
    selected.length > 0 &&
    supported &&
    contexts(venue, p).some((c) =>
      selected.every(
        (i) =>
          applies(i, c) &&
          (!i.pairWithIds ||
            (selected.some(
              (j) => j.kind !== i.kind && i.pairWithIds.includes(j.id),
            ) &&
              selected
                .filter((j) => j.kind !== i.kind)
                .every((j) => i.pairWithIds.includes(j.id)))),
      ),
    );
  return {
    knownCents: selected.reduce(
      (n, i) =>
        n +
        (Number.isSafeInteger(i.priceCents) && i.priceCents > 0
          ? i.priceCents
          : 0),
      0,
    ),
    unknownCount: selected.filter(
      (i) => !Number.isSafeInteger(i.priceCents) || i.priceCents <= 0,
    ).length,
    supported,
    compatible,
  };
}
