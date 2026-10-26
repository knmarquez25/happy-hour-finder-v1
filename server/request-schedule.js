import { weekdays, isHappyHourActive } from "../src/matching.js";
const dayWord =
  "(mon(?:day)?|tue(?:sday)?|wed(?:nesday)?|thu(?:rsday)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)";
const fullDay = (value) =>
  weekdays.find(
    (d) => d.slice(0, 3).toLowerCase() === value.slice(0, 3).toLowerCase(),
  );
const clock = (hour, minute, meridian) => {
  const h = Number(hour),
    m = Number(minute || 0);
  if (h < 1 || h > 12 || m > 59) return null;
  return (
    String((h % 12) + (/p/i.test(meridian) ? 12 : 0)).padStart(2, "0") +
    ":" +
    String(m).padStart(2, "0")
  );
};
export function requestedSchedule(query) {
  const text = String(query);
  const days = [
    ...text.matchAll(new RegExp("\\b" + dayWord + "(?=$|[^a-z])", "gi")),
  ].map((m) => fullDay(m[1]));
  const unique = [...new Set(days)];
  let time = null;
  if (/\bnoon\b/i.test(text)) time = "12:00";
  else if (/\bmidnight\b/i.test(text)) time = "00:00";
  else {
    const m = text.match(/(\d{1,2})(?::(\d{2}))?\s*([ap])\.?m\.?(?=$|[^a-z])/i);
    if (m) time = clock(m[1], m[2], m[3]);
    else {
      const m = text.match(/\b([01]\d|2[0-3]):([0-5]\d)\b/);
      if (m) time = m[1] + ":" + m[2];
    }
  }
  return { day: unique.length === 1 ? unique[0] : null, time };
}
// This only rules out unambiguous conflicts. Unknown text never proves a match.
export function contradictsSchedule(hoursText, query) {
  if (
    /\b(?:before|after|between|until|earlier|later|latest|anytime)\b/i.test(
      query,
    ) ||
    /\b(?:from|around|about|by|or)\s+(?:noon|midnight|\d{1,2}(?::\d{2})?\s*[ap]\.?m\.?)/i.test(
      query,
    ) ||
    /\d{1,2}(?::\d{2})?\s*(?:[ap]m)?\s*[-–—]\s*\d{1,2}/i.test(query)
  )
    return false;
  const times =
    String(query).match(
      /noon|midnight|\d{1,2}(?::\d{2})?\s*[ap]\.?m\.?|\b(?:[01]\d|2[0-3]):[0-5]\d\b/gi,
    ) || [];
  if (times.length > 1) return false;
  const plan = requestedSchedule(query);
  if (
    !hoursText ||
    (!plan.day && !plan.time) ||
    /\b(?:not|except|excluding)\b/i.test(query)
  )
    return false;
  const text = hoursText
    .normalize("NFKC")
    .replace(/([ap])\s*\.\s*m\s*\./gi, "$1m");
  if (
    /all[ -]day|opening|closing|\bopen\b|\bclose\b|until|except|excluding|;/i.test(
      text,
    )
  )
    return false;
  const pattern =
    /(\d{1,2})(?::(\d{2}))?\s*([ap]m)\s*(?:[-–—]|to)\s*(\d{1,2})(?::(\d{2}))?\s*([ap]m)/gi;
  const ranges = [...text.matchAll(pattern)].map((m) => ({
    start: clock(m[1], m[2], m[3]),
    end: clock(m[4], m[5], m[6]),
  }));
  const allRanges =
    text.match(
      /\d{1,2}(?::\d{2})?\s*(?:[ap]m)?\s*(?:[-–—]|to)\s*\d{1,2}(?::\d{2})?\s*(?:[ap]m)/gi,
    ) || [];
  if (
    !ranges.length ||
    allRanges.length > ranges.length ||
    ranges.some((r) => !r.start || !r.end || r.start === r.end)
  )
    return false;
  const days = new Set();
  if (/daily|every day/i.test(text)) weekdays.forEach((d) => days.add(d));
  if (/weekdays/i.test(text)) weekdays.slice(0, 5).forEach((d) => days.add(d));
  if (/weekends/i.test(text)) weekdays.slice(5).forEach((d) => days.add(d));
  for (const m of text.matchAll(
    new RegExp(
      "\\b" +
        dayWord +
        "\\s*(?:[-–—]|to|through)\\s*" +
        dayWord +
        "(?=$|[^a-z])",
      "gi",
    ),
  )) {
    let n = weekdays.indexOf(fullDay(m[1])),
      end = weekdays.indexOf(fullDay(m[2]));
    for (let i = 0; i < 7; i++) {
      days.add(weekdays[n]);
      if (n === end) break;
      n = (n + 1) % 7;
    }
  }
  for (const m of text.matchAll(
    new RegExp("\\b" + dayWord + "(?=$|[^a-z])", "gi"),
  ))
    days.add(fullDay(m[1]));
  const windows = ranges.map((r) => ({
    ...r,
    days: days.size ? [...days] : weekdays,
  }));
  const sampleDays = plan.day ? [plan.day] : weekdays;
  const sampleTimes = plan.time
    ? [plan.time]
    : ["00:00", ...ranges.map((r) => r.start)];
  return !sampleDays.some((day) =>
    sampleTimes.some((time) =>
      isHappyHourActive({ hours: windows }, day, time),
    ),
  );
}
