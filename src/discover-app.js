import { timePeriods } from "./time-filter.js";
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
  menuItems,
} from "./discovery.js?v=time-discovery-12";
import { formatHappyHour } from "./matching.js";
import {
  escapeHtml as esc,
  formatMoney as money,
  happyHourListings,
} from "./ui-state.js";

import { candidateToVenue } from "./candidates.js?v=time-discovery-12";
import { initReviews } from "./review-ui.js?v=time-discovery-12";
let venues = [...restaurants];
const list = document.querySelector("#results"),
  request = document.querySelector("#request"),
  error = document.querySelector("#request-error"),
  clear = document.querySelector("#clear-request"),
  button = document.querySelector("#ask-button");
const dayFilter = document.querySelector("#day-filter"),
  periodFilter = document.querySelector("#period-filter"),
  exactFilter = document.querySelector("#exact-time-filter"),
  exactLabel = document.querySelector("#exact-time-label");
let manualFilters = {};
function syncTimeControls(p) {
  dayFilter.value = p.day || "";
  periodFilter.value = p.time ? "exact" : p.timePeriod || "";
  exactFilter.value = p.time || "";
  exactLabel.hidden = periodFilter.value !== "exact";
}
dayFilter.addEventListener("change", () => {
  manualFilters.day = dayFilter.value || null;
});
periodFilter.addEventListener("change", () => {
  exactLabel.hidden = periodFilter.value !== "exact";
  manualFilters.timePeriod =
    periodFilter.value === "exact" ? null : periodFilter.value || null;
  manualFilters.time =
    periodFilter.value === "exact" ? exactFilter.value || null : null;
});
exactFilter.addEventListener("change", () => {
  manualFilters.time = exactFilter.value || null;
  manualFilters.timePeriod = null;
});
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
function renderMenu(v) {
  const items = menuItems(v, preferences);
  if (items.length)
    return `<section class="menu-items" aria-label="Listed happy-hour menu"><h4>Happy-hour menu · ${items.length} listed items</h4><p class="small muted">All items we have recorded are shown below. The restaurant may list additional items. Pick one published order of each; item schedules and restrictions apply.</p>${items.map(({ item: i, matchesRequest }) => `<div class="menu-choice"><label><input type="checkbox" data-item="${esc(i.id)}"><span>${esc(i.name)}<small class="item-evidence">${matchesRequest ? "Matches your request · " : ""}${itemDetails(v, i)}</small></span></label><strong>${Number.isSafeInteger(i.priceCents) ? money(i.priceCents) : "Price needs confirmation"}</strong></div>`).join("")}<div class="order-total" aria-live="polite">Choose items to see your menu-price subtotal.</div><p class="order-note">Subtotals exclude tax, tip, and fees. Listed prices are not a guarantee of availability.</p></section>`;
  const specials = happyHourListings(v);
  return `<section class="menu-items" aria-label="Listed happy-hour offers"><h4>Listed happy-hour offers</h4>${specials.length ? specials.map((s) => `<div class="menu-highlight"><span>${esc(s.text)}<small class="item-evidence">${s.primary ? "Restaurant-listed" : "Guide-listed"} · ${sourceLink(s.source, "Source")}</small></span></div>`).join("") : ""}<p class="small muted">Individual menu items and exact prices have not been recorded. Browse the restaurant source below.</p></section>`;
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
  const html = `<article class="restaurant-card" data-venue-id="${esc(v.id)}"><div class="card-top"><div><h3>${esc(v.name)}</h3><p class="venue-location">${esc([...new Set([v.neighborhood, city(v)].filter(Boolean))].join(" · "))}</p></div><span class="evidence-tag ${reviewed ? "" : "uncertain"}">${v.ownerReviewed ? "Owner reviewed" : reviewed ? "Restaurant source listed" : "Needs restaurant review"}</span></div><p class="schedule">Listed happy hours: ${esc(formatHappyHour(v.hours) || "Exact schedule needs verification.")}</p>${reasons.length ? `<p class="match-reasons">${reasons.map(esc).join(" · ")}</p>` : ""}${renderMenu(v)}${combo ? `<div class="suggestion"><strong>A starting suggestion · ${money(combo.totalCents)}</strong><br>${esc(combo.food.name)} + ${esc(combo.drink.name)}${diff === null ? "" : `<br><span class="${diff > 0 ? "budget-over" : ""}">${money(Math.abs(diff))} ${diff > 0 ? "above" : "below"} your target</span>`}<small>One published order of each · before tax, tip &amp; fees</small><small>Applies to ${esc(formatHappyHour([window]))}. Listed offers, not live-confirmed.</small></div>` : '<p class="small muted">No supported food-and-drink combo total is available. Explore individual listings and sources.</p>'}<details class="source-details"><summary>Offer details &amp; sources</summary><p>${esc(v.address || "Address needs confirmation")}</p>${v.notes ? `<p>${esc(v.notes)}</p>` : ""}<ul>${v.sources.map((s) => `<li>${sourceLink(s)}<small>${s.type === "primary" ? "Restaurant / primary source" : "Secondary source"} · ${s.reviewedOn ? "Reviewed " + esc(s.reviewedOn) : "Not reviewed"}</small>${s.note ? `<small>${esc(s.note)}</small>` : ""}</li>`).join("")}</ul><p>Published information may change. Review dates are not current restaurant confirmation. No allergy-safety guarantee is made.</p></details><p class="evidence-line">${reviewed ? (v.ownerReviewed ? "Owner reviewed " : "Restaurant source reviewed ") + esc(reviewed) : "Restaurant confirmation needed"} · Check restrictions before going.</p></article>`;
  return html;
}
function render() {
  const rows = discover(venues, preferences);
  list.innerHTML = rows.length
    ? rows.map(renderCard).join("")
    : `<div class="empty-state"><h3>No reviewed happy-hour matches${preferences.area ? " in " + esc(preferences.area) : " for this request"}</h3><p>No saved restaurant listing is confirmed for these preferences. This does not mean no happy hours exist; additional discoveries may appear in Needs verification.</p><button class="secondary" type="button" data-browse-all>Browse all restaurants</button></div>`;
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
  else if (preferences.timePeriod)
    parts.push(timePeriods[preferences.timePeriod].label);
  if (preferences.atmosphere) parts.push(preferences.atmosphere);
  parts.push(`${rows.length} of ${venues.length} reviewed restaurants`);
  document.querySelector("#interpretation").textContent = parts.join(" · ");
}
function reset() {
  generation++;
  reviews.reset();
  controller?.abort();
  preferences = emptyPreferences();
  manualFilters = {};
  syncTimeControls(preferences);
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
    const query =
      request.value.trim() ||
      (Object.keys(manualFilters).length ? "happy hours" : "");
    if (periodFilter.value === "exact" && !exactFilter.value) {
      error.textContent = "Choose an exact time or another time-of-day option.";
      error.hidden = false;
      return;
    }
    if (!query) {
      reset();
      return;
    }
    reviews.explore(query, manualFilters);
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
        body: JSON.stringify({ query, filters: manualFilters }),
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
      const next = validatePreferences(value.preferences, venues);
      if (ownGeneration !== generation) return;
      if (next.clarification) throw new Error(next.clarification);
      preferences = next;
      syncTimeControls(preferences);
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
  const venue = venues.find((v) => v.id === card.dataset.venueId);
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
const reviews = initReviews({
  endpoint,
  onApproved(records) {
    venues = [...restaurants, ...records.map(candidateToVenue).filter(Boolean)];
    document.querySelector("#coverage").textContent =
      `${venues.length} reviewed spots · LA + Orange County`;
    render();
  },
  onBrowse() {
    preferences = emptyPreferences();
    render();
  },
});
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
