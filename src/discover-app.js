import { restaurants, dataMetadata } from "./data.js";
import { apiBase } from "./config.js";
const endpoint = (path) =>
  apiBase ? `${apiBase.replace(/\/$/, "")}/api/${path}` : `./api/${path}`;
import {
  emptyPreferences,
  validatePreferences,
  discover,
  menuSelection,
  primaryEvidence,
} from "./discovery.js";
import { formatHappyHour } from "./matching.js";
import {
  escapeHtml as esc,
  formatMoney as money,
  happyHourListings,
} from "./ui-state.js";

const list = document.querySelector("#results"),
  request = document.querySelector("#request"),
  error = document.querySelector("#request-error"),
  clear = document.querySelector("#clear-request"),
  button = document.querySelector("#ask-button");
let preferences = emptyPreferences(),
  generation = 0,
  controller;
const city = (v) => v.address?.split(",").at(-2)?.trim();
const status = (i) =>
  i.status === "primary"
    ? "Restaurant-listed"
    : i.status === "secondary"
      ? "Guide-listed"
      : i.status === "conflicting"
        ? "Conflicting evidence"
        : "Unconfirmed";
const sourceFor = (v, i) => v.sources.find((s) => s.id === i.sourceId);
function sourceLink(source, label) {
  if (!source) return "";
  try {
    const u = new URL(source.url);
    if (!["https:", "http:"].includes(u.protocol)) return "";
    return `<a href="${esc(u.href)}" target="_blank" rel="noreferrer">${esc(label || u.hostname.replace(/^www\./, ""))} ↗</a>`;
  } catch {
    return "";
  }
}
function itemDetails(v, i) {
  const s = sourceFor(v, i);
  const windows = (v.hours || []).filter(
    (w) => !i.windowIds || i.windowIds.includes(w.id),
  );
  return `${esc(status(i))}${primaryEvidence(v, i) ? "" : " · Price needs confirmation"}${i.days ? ` · ${esc(i.days.join(", "))} only` : ""}${i.windowIds ? ` · ${esc(formatHappyHour(windows))}` : ""}${i.pairWithIds ? " · Conditional pairing: check offer details" : ""}${s ? ` · ${sourceLink(s, "Source")}` : ""}`;
}
function highlights(v) {
  const items = [...(v.menu || [])]
    .sort(
      (a, b) => Number(primaryEvidence(v, b)) - Number(primaryEvidence(v, a)),
    )
    .slice(0, 3);
  if (items.length)
    return items
      .map(
        (i) =>
          `<div class="menu-highlight"><span>${esc(i.name)}<small class="item-evidence">${esc(status(i))}${i.days ? " · " + esc(i.days.join(", ")) + " only" : ""}${i.windowIds ? " · Specific offer window" : ""}</small></span><strong>${Number.isSafeInteger(i.priceCents) ? money(i.priceCents) : "Price unknown"}</strong></div>`,
      )
      .join("");
  const specials = happyHourListings(v).slice(0, 3);
  return specials.length
    ? specials
        .map(
          (s) =>
            `<div class="menu-highlight"><span>${esc(s.text)}<small class="item-evidence">${s.primary ? "Restaurant-listed" : "Guide-listed"} · ${sourceLink(s.source, "Source")}</small></span></div>`,
        )
        .join("")
    : '<p class="small muted">Menu items and exact prices have not been transcribed yet. Browse the restaurant source below.</p>';
}
function renderCard(result) {
  const {
    venue: v,
    combo,
    window,
    reasons,
    budgetDifferenceCents: diff,
  } = result;
  const reviewed = v.sources
    .filter((s) => s.type === "primary" && s.reviewedOn)
    .map((s) => s.reviewedOn)
    .sort()
    .at(-1);
  const html = `<article class="restaurant-card" data-venue-id="${esc(v.id)}"><div class="card-top"><div><h3>${esc(v.name)}</h3><p class="venue-location">${esc([...new Set([v.neighborhood, city(v)].filter(Boolean))].join(" · "))}</p></div><span class="evidence-tag ${reviewed ? "" : "uncertain"}">${reviewed ? "Restaurant source listed" : "Needs restaurant review"}</span></div><p class="schedule">Listed happy hours: ${esc(formatHappyHour(v.hours) || "Exact schedule needs verification.")}</p>${reasons.length ? `<p class="match-reasons">${reasons.map(esc).join(" · ")}</p>` : ""}<div class="menu-highlights">${highlights(v)}</div>${combo ? `<div class="suggestion"><strong>A starting suggestion · ${money(combo.totalCents)}</strong><br>${esc(combo.food.name)} + ${esc(combo.drink.name)}${diff === null ? "" : `<br><span class="${diff > 0 ? "budget-over" : ""}">${money(Math.abs(diff))} ${diff > 0 ? "above" : "below"} your target</span>`}<small>One published order of each · before tax, tip &amp; fees</small><small>Applies to ${esc(formatHappyHour([window]))}. Listed offers, not live-confirmed.</small></div>` : '<p class="small muted">No supported food-and-drink combo total is available. Explore individual listings and sources.</p>'}<details class="menu-details"><summary>Browse menu &amp; choose items</summary>${v.menu.length ? `<p class="small muted">Pick one published order of each item. Item-specific schedules and restrictions still apply.</p>${v.menu.map((i) => `<div class="menu-choice"><label><input type="checkbox" data-item="${esc(i.id)}"><span>${esc(i.name)}<small class="item-evidence">${itemDetails(v, i)}</small></span></label><strong>${Number.isSafeInteger(i.priceCents) ? money(i.priceCents) : "Price unknown"}</strong></div>`).join("")}<div class="order-total" aria-live="polite">Choose items to see your menu-price subtotal.</div><p class="order-note">Subtotals exclude tax, tip, and fees. Listed prices are not a guarantee of availability.</p>` : "<p>Itemized prices are not available in this dataset. Use the restaurant links to browse the menu.</p>"}</details><details class="source-details"><summary>Offer details &amp; sources</summary><p>${esc(v.address || "Address needs confirmation")}</p>${v.notes ? `<p>${esc(v.notes)}</p>` : ""}<ul>${v.sources.map((s) => `<li>${sourceLink(s)}<small>${s.type === "primary" ? "Restaurant / primary source" : "Secondary source"} · ${s.reviewedOn ? "Reviewed " + esc(s.reviewedOn) : "Not reviewed"}</small>${s.note ? `<small>${esc(s.note)}</small>` : ""}</li>`).join("")}</ul><p>Published information may change. Review dates are not current restaurant confirmation. No allergy-safety guarantee is made.</p></details><p class="evidence-line">${reviewed ? "Restaurant source reviewed " + esc(reviewed) : "Restaurant confirmation needed"} · Check restrictions before going.</p></article>`;
  return html;
}
function render() {
  const rows = discover(restaurants, preferences);
  list.innerHTML = rows.length
    ? rows.map(renderCard).join("")
    : '<div class="empty-state"><h3>No researched matches for this request</h3><p>Try a broader area or fewer food and drink requirements. Missing evidence is not filled in to manufacture a match.</p><button class="secondary" type="button" data-browse-all>Browse all restaurants</button></div>';
  document.querySelector("#results-title").textContent = Object.entries(
    preferences,
  ).some(
    ([k, v]) =>
      k !== "clarification" && (Array.isArray(v) ? v.length : v !== null),
  )
    ? "Your happy-hour picks"
    : "Explore happy hours";
  const parts = [
    preferences.area || "Anywhere",
    preferences.foodPreferences.length
      ? preferences.foodPreferences.join(", ")
      : "any food",
    preferences.drinkPreferences.length
      ? preferences.drinkPreferences.join(", ")
      : "any drink",
    preferences.budget !== null
      ? "target " + money(Math.round(preferences.budget * 100))
      : "any budget",
  ];
  if (preferences.day) parts.push(preferences.day);
  if (preferences.time) parts.push(preferences.time);
  if (preferences.atmosphere) parts.push(preferences.atmosphere);
  parts.push(`${rows.length} of ${restaurants.length} researched restaurants`);
  document.querySelector("#interpretation").textContent = parts.join(" · ");
}
function reset() {
  generation++;
  controller?.abort();
  preferences = emptyPreferences();
  request.value = "";
  error.hidden = true;
  clear.hidden = true;
  button.disabled = false;
  button.textContent = "Find my happy hour →";
  list.setAttribute("aria-busy", "false");
  render();
}
document
  .querySelector("#ask-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();
    const query = request.value.trim();
    if (!query) {
      reset();
      return;
    }
    const ownGeneration = ++generation;
    controller?.abort();
    controller = new AbortController();
    clear.hidden = false;
    error.hidden = true;
    button.disabled = true;
    button.textContent = "Finding your happy hour…";
    list.setAttribute("aria-busy", "true");
    try {
      const response = await fetch(endpoint("discover"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
        signal: controller.signal,
      });
      let value;
      try {
        value = await response.json();
      } catch {
        throw new Error(
          "AI suggestions are unavailable on this host. You can still browse the restaurants.",
        );
      }
      if (!response.ok)
        throw new Error(
          typeof value.error === "string"
            ? value.error
            : "AI is unavailable. Please try again.",
        );
      const next = validatePreferences(value.preferences, restaurants);
      if (ownGeneration !== generation) return;
      if (next.clarification) throw new Error(next.clarification);
      preferences = next;
      render();
    } catch (e) {
      if (ownGeneration !== generation || e.name === "AbortError") return;
      error.textContent =
        e.message || "AI is unavailable. Your browsing results are still here.";
      error.hidden = false;
    } finally {
      if (ownGeneration === generation) {
        button.disabled = false;
        button.textContent = "Find my happy hour →";
        list.setAttribute("aria-busy", "false");
      }
    }
  });
clear.addEventListener("click", reset);
document.querySelectorAll("[data-example]").forEach((b) =>
  b.addEventListener("click", () => {
    request.value = b.dataset.example;
    request.focus();
  }),
);
list.addEventListener("click", (e) => {
  if (e.target.closest("[data-browse-all]")) reset();
});
list.addEventListener("change", (e) => {
  if (!e.target.matches("[data-item]")) return;
  const card = e.target.closest("[data-venue-id]");
  const venue = restaurants.find((v) => v.id === card.dataset.venueId);
  const ids = [...card.querySelectorAll("[data-item]:checked")].map(
    (i) => i.dataset.item,
  );
  const total = card.querySelector(".order-total");
  if (!ids.length) {
    total.textContent = "Choose items to see your menu-price subtotal.";
    return;
  }
  const selected = menuSelection(venue, ids, preferences);
  total.textContent = selected.unknownCount
    ? `Total unknown · ${money(selected.knownCents)} in known menu prices, ${selected.unknownCount} selected price(s) missing.`
    : `Menu-price subtotal: ${money(selected.knownCents)} before tax, tip & fees.`;
  if (!selected.supported)
    total.textContent += " Some prices lack restaurant confirmation.";
  if (!selected.compatible)
    total.textContent +=
      " These items are not confirmed together for a shared offer window; check restrictions.";
  if (
    preferences.budget !== null &&
    !selected.unknownCount &&
    selected.knownCents > Math.round(preferences.budget * 100)
  )
    total.textContent += ` ${money(selected.knownCents - Math.round(preferences.budget * 100))} above your target.`;
});
document.querySelector("#coverage").textContent =
  `${restaurants.length} researched spots · LA + Orange County`;
document.querySelector("#dataset-summary").textContent =
  `${dataMetadata.total || restaurants.length} researched restaurant locations. Not every record has a complete menu, exact prices, or a restaurant-supported schedule.`;
render();
fetch(endpoint("status"))
  .then((r) => (r.ok ? r.json() : null))
  .then((s) => {
    document.querySelector("#ai-status").textContent = s?.configured
      ? "AI suggestions available"
      : "AI suggestions are unavailable here. All researched restaurants are still browsable.";
  })
  .catch(() => {
    document.querySelector("#ai-status").textContent =
      "AI suggestions are unavailable here. You can still browse.";
  });
