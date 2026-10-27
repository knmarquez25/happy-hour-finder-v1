import { weekdays, toMinutes } from "./matching.js";
export const timePeriods = {
  morning: { label: "Morning · 6 AM–noon", start: 360, end: 720 },
  afternoon: { label: "Afternoon · noon–6 PM", start: 720, end: 1080 },
  night: { label: "Night · 6 PM–midnight", start: 1080, end: 1440 },
};
export function periodFromQuery(query) {
  const text = String(query).replace(/date[ -]night/gi, "");
  return /\b(?:night|evening|tonight)\b/i.test(text)
    ? "night"
    : /\bafternoon\b/i.test(text)
      ? "afternoon"
      : /\bmorning\b/i.test(text)
        ? "morning"
        : null;
}
export function inTimePeriod(time, period) {
  const p = timePeriods[period],
    minute = toMinutes(time);
  return !p || (minute >= p.start && minute < p.end);
}
// Only explicit control changes override the words in the request.
export function applyTimeFilters(query, filters = {}) {
  if (
    !filters ||
    typeof filters !== "object" ||
    Array.isArray(filters) ||
    Object.keys(filters).some((k) => !["day", "time", "timePeriod"].includes(k))
  )
    throw Error("Invalid time filters.");
  if (
    filters.day !== undefined &&
    filters.day !== null &&
    !weekdays.includes(filters.day)
  )
    throw Error("Choose a valid day.");
  if (
    filters.time !== undefined &&
    filters.time !== null &&
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(filters.time)
  )
    throw Error("Choose a valid time.");
  if (
    filters.timePeriod !== undefined &&
    filters.timePeriod !== null &&
    !Object.hasOwn(timePeriods, filters.timePeriod)
  )
    throw Error("Choose a valid time of day.");
  let text = String(query),
    suffix = [];
  if (Object.hasOwn(filters, "day")) {
    text = text.replace(
      /\b(?:mon(?:day)?|tue(?:sday)?|wed(?:nesday)?|thu(?:rsday)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)\b/gi,
      "",
    );
    if (filters.day) suffix.push(filters.day);
  }
  if (Object.hasOwn(filters, "time") || Object.hasOwn(filters, "timePeriod")) {
    text = text
      .replace(/date[ -]night/gi, "date atmosphere")
      .replace(
        /\b(?:noon|midnight|morning|afternoon|evening|night|tonight)\b|\b\d{1,2}(?::\d{2})?\s*[ap]\.?m\.?\b|\b(?:[01]\d|2[0-3]):[0-5]\d\b/gi,
        "",
      );
    if (filters.time) suffix.push(filters.time);
    else if (filters.timePeriod) suffix.push(filters.timePeriod);
  }
  const result = [text.trim(), ...suffix]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ");
  if (result.length > 1000)
    throw Error("Shorten your request before adding time filters.");
  return result;
}

export function overrideTimePreferences(preferences, filters = {}) {
  applyTimeFilters("", filters);
  const result = { ...preferences };
  if (Object.hasOwn(filters, "day")) result.day = filters.day;
  if (Object.hasOwn(filters, "time") || Object.hasOwn(filters, "timePeriod")) {
    result.time = filters.time || null;
    result.timePeriod = result.time ? null : filters.timePeriod || null;
  }
  return result;
}
