import { weekdays } from "./matching.js";
const clean = (v, max, field) => {
  if (typeof v !== "string" || !v.trim() || v.length > max)
    throw new Error(`Invalid ${field}`);
  return v.trim();
};
export function publicUrl(value) {
  const u = new URL(clean(value, 2048, "source link"));
  if (
    u.protocol !== "https:" ||
    u.username ||
    u.password ||
    !u.hostname.includes(".") ||
    /(^localhost$|\.local$|\.internal$|^\d+\.\d+\.\d+\.\d+$)/i.test(u.hostname)
  )
    throw new Error("Use a public HTTPS source link.");
  return u.href;
}
export const identity = (v) =>
  `${v.name}|${v.location || v.neighborhood || ""}`
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9|]/g, "")
    .slice(0, 300);
export function normalizeCandidate(value) {
  if (
    !value ||
    typeof value !== "object" ||
    !Array.isArray(value.items) ||
    value.items.length < 1 ||
    value.items.length > 20
  )
    throw new Error("Invalid happy-hour items");
  const result = {
    ...(value.discoveryMethod === "menu-link"
      ? { discoveryMethod: "menu-link" }
      : {}),
    name: clean(value.name, 160, "restaurant name"),
    location: clean(value.location, 120, "location"),
    county: ["LA County", "Orange County"].includes(value.county)
      ? value.county
      : null,
    address: value.address ? clean(value.address, 300, "address") : "",
    hoursText: value.hoursText ? clean(value.hoursText, 500, "hours") : null,
    sourceUrl: publicUrl(value.sourceUrl),
    evidence: clean(value.evidence, 1800, "evidence"),
    items: value.items.map((i) => {
      if (
        !["food", "drink"].includes(i.kind) ||
        (i.priceCents !== null &&
          (!Number.isSafeInteger(i.priceCents) ||
            i.priceCents < 1 ||
            i.priceCents > 100000))
      )
        throw new Error("Invalid menu price or kind");
      return {
        name: clean(i.name, 150, "item name"),
        kind: i.kind,
        priceCents: i.priceCents,
      };
    }),
  };
  if (!/happy[\s-]*hour/i.test(result.evidence))
    throw new Error("Happy-hour evidence is required.");
  return result;
}
export function normalizeApproval(value) {
  const result = normalizeCandidate(value);
  if (!result.county)
    throw new Error("Choose LA County or Orange County before publication.");
  if (value.restaurantSourceConfirmed !== true)
    throw new Error(
      "Confirm that the source is the restaurant’s own happy-hour menu.",
    );
  if (
    !Array.isArray(value.hours) ||
    !value.hours.length ||
    value.hours.length > 7
  )
    throw new Error("Add the happy-hour schedule before approval.");
  result.hours = value.hours.map((w) => {
    if (
      !Array.isArray(w.days) ||
      !w.days.length ||
      w.days.some((d) => !weekdays.includes(d)) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(w.start) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(w.end) ||
      w.start === w.end ||
      !["none", "bar-only", "bar-or-patio"].includes(w.restriction)
    )
      throw new Error("Check happy-hour days, times, and seating restriction.");
    return {
      days: [...new Set(w.days)],
      start: w.start,
      end: w.end,
      restriction: w.restriction,
    };
  });
  result.restaurantSourceConfirmed = true;
  return result;
}
export function candidateToVenue(record) {
  if (record.status !== "approved" || !record.reviewed_at) return null;
  let c;
  try {
    c = normalizeApproval(record.approved_payload);
  } catch {
    return null;
  }
  const reviewedOn = record.reviewed_at.slice(0, 10),
    sourceId = "owner-source";
  return {
    id: "community-" + record.id,
    name: c.name,
    neighborhood: c.location,
    county: {
      geoid: c.county === "Orange County" ? "06059" : "06037",
      name: c.county,
    },
    address: c.address || c.location,
    ownerReviewed: true,
    atmosphereTags: [],
    notes:
      "Owner reviewed the linked happy-hour menu. Offers may change; confirm with the restaurant.",
    sources: [
      {
        id: sourceId,
        url: c.sourceUrl,
        type: "primary",
        reviewedOn,
        note: "Restaurant menu confirmed by the app owner; not live restaurant confirmation.",
      },
    ],
    hours: c.hours.map((w, n) => ({
      ...w,
      id: "owner-window-" + n,
      status: "primary",
      sourceId,
    })),
    menu: c.items.map((i, n) => ({
      ...i,
      id: "owner-item-" + n,
      status: "primary",
      sourceId,
      tags: [i.name],
    })),
  };
}

// Only server-sourced previews for this exact place can replace its display menu.
export function freshMenuLookup(record, now = Date.now()) {
  const lookup = record?.menu_lookup;
  const checked = Date.parse(lookup?.checkedAt);
  if (
    !lookup ||
    !Number.isFinite(checked) ||
    now - checked >= (lookup.candidate === null ? 300000 : 86400000) ||
    checked > now + 300000
  )
    return null;
  try {
    const candidate =
      lookup.candidate === null ? null : normalizeCandidate(lookup.candidate);
    if (candidate && identity(candidate) !== identity(record.payload))
      return null;
    return {
      candidate,
      checkedAt: lookup.checkedAt,
      notice:
        typeof lookup.notice === "string"
          ? lookup.notice.slice(0, 750)
          : "Menu availability still needs verification.",
    };
  } catch {
    return null;
  }
}
