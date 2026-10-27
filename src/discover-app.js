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
} from "./discovery.js?v=review-discovery-10";
import { displayHours as formatHappyHour } from "./display-hours.js";
import {
  escapeHtml as esc,
  formatMoney as money,
  happyHourListings,
} from "./ui-state.js";

import { candidateToVenue } from "./candidates.js?v=review-discovery-10";
import { initReviews } from "./review-ui.js?v=explore-filters-1";
import { timePeriods } from "./time-filter.js";
import { initFilters } from "./filter-controls.js";
import { webQuery } from "./filter-options.js";
import { venueMedia } from "./media.js?v=venue-photos-1";
import {
  renderVenuePhoto,
  handleVenuePhotoError,
} from "./venue-photo.js?v=venue-photos-1";
let venues = [...restaurants];
const list = document.querySelector("#results"),
  request = document.querySelector("#request"),
  error = document.querySelector("#request-error"),
  clear = document.querySelector("#clear-request"),
  button = document.querySelector("#ask-button");
let controls,
  reviews,
  visibleCount = 6,
  onlineBusy = false;
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
  const media = venueMedia[v.id];
  const photo = renderVenuePhoto(v.name, media);
  const suggestion = combo
    ? `<div class="suggestion"><span class="pairing-label">A starting pairing</span><strong>${money(combo.totalCents)}</strong><p>${esc(combo.food.name)} + ${esc(combo.drink.name)}</p>${diff === null ? "" : `<p class="${diff > 0 ? "budget-over" : ""}">${money(Math.abs(diff))} ${diff > 0 ? "above" : "below"} your target</p>`}<small>One published order of each · before tax, tip &amp; fees</small><small>Applies to ${esc(formatHappyHour([window]))}. Listed offers, not live-confirmed.</small></div>`
    : '<p class="menu-preview">Explore the listed menu and offers below. A confirmed food-and-drink pairing total isn’t available.</p>';
  const html = `<article class="restaurant-card" data-venue-id="${esc(v.id)}">
    <div class="venue-overview">${photo}<div class="card-top"><div><h3>${esc(v.name)}</h3><p class="venue-location">${esc([...new Set([v.neighborhood, city(v)].filter(Boolean))].join(" · "))}</p></div></div>
    <p class="schedule">Listed happy hours: ${esc(formatHappyHour(v.hours) || "Exact schedule needs verification.")}</p>
    ${reasons.length ? `<p class="match-reasons">${reasons.map(esc).join(" · ")}</p>` : ""}</div>
    ${suggestion}
    <details class="venue-menu"><summary>See the happy-hour menu <span aria-hidden="true">↗</span></summary>${renderMenu(v)}</details>
    <details class="source-details"><summary>Offer details &amp; sources</summary><p>${esc(v.address || "Address needs confirmation")}</p>${v.notes ? `<p>${esc(v.notes)}</p>` : ""}<ul>${v.sources.map((s) => `<li>${sourceLink(s)}<small>${s.type === "primary" ? "Restaurant / primary source" : "Secondary source"} · ${s.reviewedOn ? "Reviewed " + esc(s.reviewedOn) : "Not reviewed"}</small>${s.note ? `<small>${esc(s.note)}</small>` : ""}</li>`).join("")}</ul><p>Published information may change. Review dates are not current restaurant confirmation. No allergy-safety guarantee is made.</p></details>
    <p class="evidence-line"><span class="evidence-tag ${reviewed ? "" : "uncertain"}">${v.ownerReviewed ? "Owner reviewed" : reviewed ? "Restaurant source listed" : "Needs restaurant review"}</span> ${reviewed ? (v.ownerReviewed ? "Owner reviewed " : "Source reviewed ") + esc(reviewed) : "Restaurant confirmation needed"} · Check restrictions before going.</p>
  </article>`;
  return html;
}
function render() {
  document.querySelector("#find-online").disabled =
    onlineBusy ||
    document.querySelector("#filter-city").getAttribute("aria-invalid") ===
      "true";
  const rows = discover(venues, preferences);
  list.innerHTML = rows.length
    ? rows.map(renderCard).join("")
    : `<div class="empty-state"><h3>No reviewed happy-hour matches${preferences.area ? " in " + esc(preferences.area) : " for this request"}</h3><p>No saved restaurant listing is confirmed for these preferences. This does not mean no happy hours exist; additional discoveries may appear in More places to explore.</p><button class="secondary" type="button" data-browse-all>Browse all restaurants</button></div>`;
  [...list.querySelectorAll("article")].forEach((card, index) => {
    card.hidden = index >= visibleCount;
  });
  const more = document.querySelector("#show-more");
  more.hidden = rows.length <= visibleCount;
  more.textContent = `Show more researched places (${Math.max(0, rows.length - visibleCount)} remaining)`;
  reviews?.setPreferences();
  document.querySelector("#results-title").textContent = Object.entries(
    preferences,
  ).some(
    ([k, v]) =>
      k !== "clarification" && (Array.isArray(v) ? v.length : v !== null),
  )
    ? "Your happy-hour picks"
    : "The neighborhood shortlist";
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
  parts.push(
    `${rows.length} of ${venues.length} researched places · showing ${Math.min(visibleCount, rows.length)}`,
  );
  document.querySelector("#interpretation").textContent = parts.join(" · ");
}
function reset() {
  generation++;
  reviews?.reset();
  controller?.abort();
  preferences = emptyPreferences();
  request.value = "";
  error.hidden = true;
  clear.hidden = true;
  button.disabled = false;
  button.textContent = "Use as filters";
  list.setAttribute("aria-busy", "false");
  visibleCount = 6;
  controls?.clearTimeOverrides();
  controls?.sync(preferences);
  render();
}
function cancelAI() {
  generation++;
  controller?.abort();
  button.disabled = false;
  button.textContent = "Use as filters";
  list.setAttribute("aria-busy", "false");
}
controls = initFilters({
  getVenues: () => venues,
  onDraftChange() {
    cancelAI();
    reviews?.cancelSearch();
  },
  onChange(next) {
    preferences = validatePreferences(next, venues);
    visibleCount = 6;
    error.hidden = true;
    render();
  },
});
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
    reviews?.cancelSearch();
    button.textContent = "Reading your request…";
    list.setAttribute("aria-busy", "true");
    try {
      const response = await fetch(endpoint("discover"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, filters: controls.getTimeOverrides() }),
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
      visibleCount = 6;
      controls.sync(preferences);
      render();
    } catch (e) {
      if (ownGeneration !== generation || e.name === "AbortError") return;
      error.textContent =
        e.message || "AI is unavailable. Your browsing results are still here.";
      error.hidden = false;
    } finally {
      if (ownGeneration === generation) {
        button.disabled = false;
        button.textContent = "Use as filters";
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
list.addEventListener("error", handleVenuePhotoError, true);
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
reviews = initReviews({
  endpoint,
  getPreferences: () => preferences,
  onApproved(records) {
    venues = [...restaurants, ...records.map(candidateToVenue).filter(Boolean)];
    document.querySelector("#coverage").textContent =
      `${venues.length} researched spots · LA + Orange County`;
    controls.refresh();
    render();
  },
  onBrowse() {
    visibleCount = venues.length;
    render();
    document.querySelector("#happy-hour-lists").focus();
  },
});
controls.sync(preferences);
document.querySelector("#show-more").addEventListener("click", () => {
  visibleCount += 6;
  const cards = [...list.querySelectorAll("article")];
  cards.forEach((card, index) => {
    card.hidden = index >= visibleCount;
  });
  const more = document.querySelector("#show-more");
  more.hidden = cards.length <= visibleCount;
  more.textContent = `Show more researched places (${Math.max(0, cards.length - visibleCount)} remaining)`;
  const interpretation = document.querySelector("#interpretation");
  interpretation.textContent = interpretation.textContent.replace(
    /showing \d+$/,
    `showing ${Math.min(visibleCount, cards.length)}`,
  );
});
document
  .querySelector("#find-online")
  .addEventListener("click", async (event) => {
    const trigger = event.currentTarget;
    if (
      document.querySelector("#filter-city").getAttribute("aria-invalid") ===
      "true"
    )
      return;
    cancelAI();
    onlineBusy = true;
    trigger.disabled = true;
    trigger.textContent = "Looking for more places…";
    try {
      await reviews.explore(webQuery(preferences), controls.getTimeOverrides());
    } finally {
      onlineBusy = false;
      trigger.disabled =
        document.querySelector("#filter-city").getAttribute("aria-invalid") ===
        "true";
      trigger.textContent = "Find more places online";
    }
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
