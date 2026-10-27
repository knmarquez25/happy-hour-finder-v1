// Presentation only; matching and source data continue to use the original windows.
const weekdays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function compactDays(days) {
  const groups = [];
  for (let i = 0; i < days.length;) {
    let end = i;
    while (
      end + 1 < days.length &&
      weekdays.indexOf(days[end + 1]) === weekdays.indexOf(days[end]) + 1 &&
      weekdays.includes(days[end])
    )
      end++;
    if (end - i >= 2)
      groups.push(`${days[i].slice(0, 3)}–${days[end].slice(0, 3)}`);
    else groups.push(...days.slice(i, end + 1).map((d) => d.slice(0, 3)));
    i = end + 1;
  }
  return groups.join(", ");
}

function clock(value) {
  const [hour, minute] = value.split(":").map(Number);
  return {
    time: `${hour % 12 || 12}${minute ? ":" + String(minute).padStart(2, "0") : ""}`,
    period: hour >= 12 ? "pm" : "am",
  };
}

export function displayHours(windows = []) {
  return windows
    .map((window) => {
      const start = clock(window.start),
        end = clock(window.end);
      const time = `${start.time}${start.period === end.period ? "" : " " + start.period}–${end.time} ${end.period}`;
      const restriction =
        window.restriction && window.restriction !== "none"
          ? ` (${window.restriction.replaceAll("-", " ")})`
          : "";
      return `${compactDays(window.days)} · ${time}${restriction}`;
    })
    .join("; ");
}
