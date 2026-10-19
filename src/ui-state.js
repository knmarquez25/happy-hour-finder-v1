export function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ],
  );
}
export function formatMoney(cents) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: cents % 100 ? 2 : 0,
  }).format(cents / 100);
}
export function budgetLabel(difference) {
  return difference === null
    ? "Price not confirmed"
    : difference === 0
      ? "Right on target"
      : `${formatMoney(Math.abs(difference))} ${difference > 0 ? "above" : "below"} target`;
}
export function restoreShortlist(raw, allowedIds) {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return [
      ...new Set(
        parsed.filter(
          (id) => typeof id === "string" && allowedIds.includes(id),
        ),
      ),
    ].slice(0, 3);
  } catch {
    return [];
  }
}
export function toggleShortlist(current, id) {
  return current.includes(id)
    ? current.filter((value) => value !== id)
    : current.length < 3
      ? [...current, id]
      : current;
}
export function sortResults(rows, sort) {
  const value = (row, key) =>
    key === "price"
      ? (row.combo?.totalCents ?? Infinity)
      : key === "distance"
        ? (row.distanceMiles ?? Infinity)
        : 0;
  return [...rows].sort((a, b) =>
    sort === "match"
      ? b.score - a.score || a.id.localeCompare(b.id)
      : value(a, sort) - value(b, sort) ||
        b.score - a.score ||
        a.id.localeCompare(b.id),
  );
}
