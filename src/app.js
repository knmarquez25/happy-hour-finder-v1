import { restaurants, dataMetadata } from "./data.js";
import { origins } from "./locations.js";
import {
  searchRestaurants,
  normalizeRequest,
  formatHappyHour,
  scoreWeights,
} from "./matching.js";
import {
  escapeHtml as esc,
  formatMoney as money,
  budgetLabel,
  restoreShortlist,
  toggleShortlist,
  sortResults,
} from "./ui-state.js";

const form = document.querySelector("#request-form");
const results = document.querySelector("#results");
const error = document.querySelector("#form-error");
const stored = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const save = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* Private browsing may disable storage. */
  }
};
let shortlist = restoreShortlist(
  stored("hh-shortlist-v2"),
  restaurants.map((r) => r.id),
);
let currentRequest,
  searchResult = { matches: [], alternatives: [] },
  allEvaluated = new Map(),
  mainLimit = 8,
  alternativeLimit = 6;
const icon = (name) => `<i data-lucide="${name}" aria-hidden="true"></i>`;
function icons() {
  if (window.lucide) window.lucide.createIcons();
}
function displayTime(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${hours >= 12 ? "PM" : "AM"}`;
}
function dateText(value) {
  return value
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(`${value}T12:00:00Z`))
    : "Not reviewed";
}
function sourceLabel(venue) {
  const primary = venue.sources.filter(
    (source) => source.type === "primary" && source.reviewedOn,
  );
  const latest = primary
    .map((source) => source.reviewedOn)
    .sort()
    .at(-1);
  return primary.length
    ? `Restaurant source reviewed ${dateText(latest)}`
    : "Guide listed / needs restaurant review";
}
function requestFromForm() {
  const data = new FormData(form);
  return normalizeRequest(
    Object.fromEntries(
      [...data.entries()].filter(([name]) => name !== "preset"),
    ),
  );
}
function formatDistance(value) {
  return value === null ? "Location unconfirmed" : `${value.toFixed(1)} mi`;
}
function sourceLink(source) {
  let url;
  try {
    url = new URL(source.url);
    if (!["https:", "http:"].includes(url.protocol)) return "";
  } catch {
    return "";
  }
  return `<a href="${esc(url.href)}" target="_blank" rel="noreferrer">${esc(url.hostname.replace(/^www\./, ""))}${icon("arrow-up-right")}</a>`;
}
function renderDetails(venue) {
  return `<details class="venue-details"><summary>Specials, sources &amp; match details</summary><p>${esc(venue.address || "Address needs verification")}</p><p><strong>Listed schedule:</strong> ${esc(formatHappyHour(venue.hours) || "Exact days and times not established.")}</p>${venue.notes ? `<p>${esc(venue.notes)}</p>` : ""}<h4>Published happy-hour items</h4>${venue.menu.length ? venue.menu.map((item) => `<div class="menu-item"><span>${esc(item.name)}<br><small>${esc(item.status === "primary" ? "Restaurant-listed" : item.status === "conflicting" ? "Conflicting sources" : "Not restaurant-confirmed")}${item.windowIds ? " · Limited schedule" : ""}</small></span><span>${item.priceCents === null ? "Price unknown" : money(item.priceCents)}</span></div>`).join("") : "<p>Itemized happy-hour prices are not established. No combo total is inferred.</p>"}${venue.legacyEstimateCents ? `<p>Original V1 estimate: ${money(venue.legacyEstimateCents)}/person, unverified and not used as a combo total.</p>` : ""}<h4>Sources</h4><ul class="source-list">${venue.sources.map((source) => `<li>${sourceLink(source)}<br>${esc(source.type === "primary" ? "Restaurant source" : "Secondary source")} · ${source.reviewedOn ? `Reviewed ${dateText(source.reviewedOn)}` : "Not reviewed"}${source.note ? `<br>${esc(source.note)}` : ""}</li>`).join("")}</ul>${venue.coordinates ? `<p>Distance: ${esc(venue.coordinates.precision || "Sourced coordinates")} from ${esc(currentRequest.origin.name)} area reference point. Not a route or travel-time estimate.</p>` : ""}<h4>Match ${venue.score}/100</h4>${Object.entries(
    venue.breakdown,
  )
    .map(
      ([key, value]) =>
        `<div class="score-row"><span>${esc(key)}</span><meter min="0" max="${scoreWeights[key]}" value="${value}" aria-label="${esc(key)} contribution ${value} out of ${scoreWeights[key]}"></meter><strong>${value}/${scoreWeights[key]}</strong></div>`,
    )
    .join(
      "",
    )}<p>Match is a weighted preference score, not an accuracy or confidence percentage.</p></details>`;
}
function renderVenue(venue, index, alternative = false) {
  const difference = venue.budgetDifferenceCents;
  const selected = shortlist.includes(venue.id);
  const window = venue.activeWindows?.[0];
  return `<article class="result-card" data-venue-id="${esc(venue.id)}"><div class="card-heading"><div class="venue-title"><p class="eyebrow">${alternative ? "Other option" : index === 0 && document.querySelector("#sort").value === "match" ? "Top match" : `Option ${index + 1}`}</p><h3>${esc(venue.name)}</h3><p class="venue-meta">${esc(venue.neighborhood)}<span aria-hidden="true">·</span>${icon("map-pin")}${formatDistance(venue.distanceMiles)}</p></div><button class="save-button" type="button" data-save="${esc(venue.id)}" aria-pressed="${selected}" aria-label="${selected ? "Remove" : "Save"} ${esc(venue.name)} ${selected ? "from" : "to"} shortlist">${icon(selected ? "bookmark-check" : "bookmark")}<span>${selected ? "Saved" : "Save"}</span></button></div><div class="card-schedule"><span class="status ${alternative ? "uncertain" : ""}">${icon(alternative ? "circle-alert" : "clock-3")}${alternative ? "Needs a second look" : "Restaurant-listed happy hour"}</span>${window ? `<span class="schedule-time">${displayTime(window.start)}–${displayTime(window.end)}${window.restriction !== "none" ? ` · ${esc(window.restriction.replaceAll("-", " "))}` : ""}</span>` : ""}</div><div class="combo"><div class="combo-items">${venue.combo ? `${esc(venue.combo.food.name)} + ${esc(venue.combo.drink.name)}<small>${money(venue.combo.food.priceCents)} + ${money(venue.combo.drink.priceCents)} · One published order of each</small>` : "Itemized combo not confirmed<small>Missing or uncertain prices stay unknown</small>"}<small>Subtotal before tax, tip &amp; fees</small></div><div class="combo-total"><div class="price ${venue.combo ? "" : "unknown"}">${venue.combo ? money(venue.combo.totalCents) : "Price unknown"}</div><div class="budget-difference ${difference === null ? "unknown" : difference > 0 ? "over" : ""}">${budgetLabel(difference)}</div></div></div><div class="match-reasons">${venue.reasons
    .filter((reason) => reason !== "Listed happy hour fits")
    .map(
      (reason) =>
        `<span class="${reason.startsWith("Not confirmed:") ? "unmatched" : ""}">${icon(reason.includes("unavailable") || reason.startsWith("Not confirmed:") ? "info" : "check")}${esc(reason)}</span>`,
    )
    .join(
      "",
    )}${alternative ? venue.failures.map((reason) => `<span class="failure-reason">${icon("circle-alert")}${esc(reason)}</span>`).join("") : ""}</div><div class="evidence-line"><span>${icon("info")}${esc(sourceLabel(venue))}</span><span class="score-label">Match ${venue.score}/100</span></div>${renderDetails(venue)}</article>`;
}
function renderLists() {
  const sorted = sortResults(
    searchResult.matches,
    document.querySelector("#sort").value,
  );
  results.innerHTML = sorted.length
    ? sorted
        .slice(0, mainLimit)
        .map((venue, index) => renderVenue(venue, index))
        .join("")
    : `<div class="empty-state"><h3>No fully qualifying spots for these plans</h3><p>Try a different time, a wider distance, or fewer must-haves. Options needing verification stay separate below.</p><button type="button" data-expand-distance>${icon("move-horizontal")}Search within 25 miles</button></div>`;
  document.querySelector("#show-more").hidden = sorted.length <= mainLimit;
  document.querySelector("#alternatives").hidden =
    !searchResult.alternatives.length;
  document.querySelector("#alternatives-title").textContent =
    `Other options (${searchResult.alternatives.length})`;
  document.querySelector("#alternative-results").innerHTML = sortResults(
    searchResult.alternatives,
    document.querySelector("#sort").value,
  )
    .slice(0, alternativeLimit)
    .map((venue, index) => renderVenue(venue, index, true))
    .join("");
  document.querySelector("#more-alternatives").hidden =
    searchResult.alternatives.length <= alternativeLimit;
  icons();
}
function renderShortlist() {
  document.querySelector("#shortlist-count").textContent = String(
    shortlist.length,
  );
  document.querySelector("#shortlist-jump").disabled = !shortlist.length;
  document.querySelector("#shortlist").hidden = !shortlist.length;
  document.querySelector("#shortlist-title").textContent =
    `Your shortlist (${shortlist.length}/3)`;
  document.querySelector("#comparison").innerHTML = shortlist
    .map((id) => allEvaluated.get(id))
    .filter(Boolean)
    .map(
      (venue) =>
        `<article class="comparison-item"><h3>${esc(venue.name)}</h3><p>${esc(venue.neighborhood)} · ${formatDistance(venue.distanceMiles)}</p><p class="compare-price">${venue.combo ? money(venue.combo.totalCents) : "Price unknown"}</p><p>${budgetLabel(venue.budgetDifferenceCents)}</p><p>${venue.eligible ? "Meets required filters" : esc(venue.failures.join("; "))}</p><p>${venue.combo ? `${esc(venue.combo.food.name)} + ${esc(venue.combo.drink.name)}` : "Combo not confirmed"}</p><p>${esc(formatHappyHour(venue.hours) || "Schedule unconfirmed")}</p><button class="icon-button" type="button" data-remove="${esc(venue.id)}" aria-label="Remove ${esc(venue.name)} from shortlist" data-tooltip="Remove from shortlist">${icon("x")}</button></article>`,
    )
    .join("");
  icons();
}
function runSearch() {
  if (!form.reportValidity()) return;
  try {
    currentRequest = requestFromForm();
    error.hidden = true;
    searchResult = searchRestaurants(restaurants, currentRequest);
    // Keep saved venues visible in comparison even when a neighborhood filter changes.
    allEvaluated = new Map(
      [...searchResult.matches, ...searchResult.alternatives].map((venue) => [
        venue.id,
        venue,
      ]),
    );
    const missing = restaurants.filter(
      (venue) => shortlist.includes(venue.id) && !allEvaluated.has(venue.id),
    );
    if (missing.length) {
      const extra = searchRestaurants(missing, {
        ...currentRequest,
        neighborhood: "all",
      });
      for (const venue of [...extra.matches, ...extra.alternatives])
        allEvaluated.set(venue.id, {
          ...venue,
          eligible: false,
          failures: [...venue.failures, "Different neighborhood"],
        });
    }
    mainLimit = 8;
    alternativeLimit = 6;
    document.querySelector("#results-title").textContent =
      `${currentRequest.day}, ${displayTime(currentRequest.time)}`;
    document.querySelector("#result-count").textContent =
      `${searchResult.matches.length} qualifying spot${searchResult.matches.length === 1 ? "" : "s"} near ${currentRequest.origin.name}`;
    const tags = [
      `${currentRequest.maxDistance} mi radius`,
      `Around ${money(Math.round(currentRequest.budget * 100))}`,
      ...currentRequest.foodPreferences.map((value) => `Food: ${value}`),
      ...currentRequest.drinkPreferences.map((value) => `Drink: ${value}`),
      ...(currentRequest.requireFood ? ["Food required"] : []),
      ...(currentRequest.requireDrinks ? ["Drink required"] : []),
      ...(currentRequest.includeRestricted
        ? ["Bar / patio offers included"]
        : []),
    ];
    document.querySelector("#active-filters").innerHTML = tags
      .map((tag) => `<span class="filter-tag">${esc(tag)}</span>`)
      .join("");
    renderLists();
    renderShortlist();
  } catch (cause) {
    error.textContent = cause.message;
    error.hidden = false;
  }
}
form.elements.originId.innerHTML = origins
  .map((origin) => `<option value="${origin.id}">${esc(origin.name)}</option>`)
  .join("");
document.querySelector("#neighborhood-filter").innerHTML =
  '<option value="all">All neighborhoods</option>' +
  [...new Set(restaurants.map((venue) => venue.neighborhood))]
    .sort()
    .map((name) => `<option value="${esc(name)}">${esc(name)}</option>`)
    .join("");
document.querySelector("#coverage-count").textContent =
  `${dataMetadata.total} researched spots · 25-mile coverage`;
document.querySelector("#data-summary").innerHTML =
  [
    ["Researched spots", dataMetadata.total],
    ["Locations in radius", dataMetadata.located],
    ["Restaurant-listed schedules", dataMetadata.primaryHours],
    ["Priced food + drink records", dataMetadata.primaryFoodAndDrink],
  ]
    .map(
      ([label, value]) =>
        `<div class="coverage-metric"><span>${label}</span><strong>${value}</strong></div>`,
    )
    .join("") +
  `<p>Research snapshot: ${dateText(dataMetadata.collectedOn)}. Not every record has complete hours or prices.</p>`;
form.addEventListener("submit", (event) => {
  event.preventDefault();
  runSearch();
});
form.addEventListener("change", (event) => {
  if (event.target.name === "preset") return;
  document.querySelector("#preset-select").value = "";
  if (event.target.name === "budget")
    document.querySelector("#budget-slider").value = event.target.value;
  runSearch();
});
form.addEventListener("input", (event) => {
  if (
    !["budget", "foodPreferences", "drinkPreferences"].includes(
      event.target.name,
    )
  )
    return;
  document.querySelector("#preset-select").value = "";
  if (event.target.name === "budget")
    document.querySelector("#budget-slider").value = event.target.value;
  if (form.checkValidity()) runSearch();
});
document.querySelector("#budget-slider").addEventListener("input", (event) => {
  form.elements.budget.value = event.target.value;
  document.querySelector("#preset-select").value = "";
  runSearch();
});
document.querySelector("#sort").addEventListener("change", renderLists);
document.querySelector("#preset-select").addEventListener("change", (event) => {
  const presets = {
    tacos: {
      originId: "dtla",
      day: "Thursday",
      time: "16:30",
      maxDistance: "3",
      budget: "25",
      foodPreferences: "tacos, seafood",
      drinkPreferences: "margarita",
      atmosphere: "lively",
    },
    wine: {
      originId: "arts-district",
      day: "Wednesday",
      time: "17:15",
      maxDistance: "3",
      budget: "30",
      foodPreferences: "seafood",
      drinkPreferences: "wine",
      atmosphere: "date-night",
    },
    pasadena: {
      originId: "pasadena",
      day: "Thursday",
      time: "16:30",
      maxDistance: "3",
      budget: "25",
      foodPreferences: "",
      drinkPreferences: "",
      atmosphere: "",
    },
  };
  const preset = presets[event.target.value];
  if (!preset) {
    document.querySelector("#more-filters").open = true;
    form.elements.foodPreferences.focus();
    return;
  }
  for (const [key, value] of Object.entries(preset))
    form.elements.namedItem(key).value = value;
  form.elements.neighborhood.value = "all";
  form.elements.requireFood.checked = false;
  form.elements.requireDrinks.checked = false;
  document.querySelector("#budget-slider").value = preset.budget;
  runSearch();
});
document.querySelector("#main-results").addEventListener("click", (event) => {
  const saved = event.target.closest("[data-save]"),
    removed = event.target.closest("[data-remove]");
  if (saved || removed) {
    const id = saved?.dataset.save || removed.dataset.remove;
    const next = toggleShortlist(shortlist, id);
    document.querySelector("#shortlist-message").textContent =
      next.length === shortlist.length && !shortlist.includes(id)
        ? "Your shortlist has three spots. Remove one before adding another."
        : "";
    shortlist = next;
    save("hh-shortlist-v2", JSON.stringify(shortlist));
    renderLists();
    renderShortlist();
    if (saved)
      document
        .querySelector(`[data-save="${CSS.escape(id)}"]`)
        ?.focus({ preventScroll: true });
    else
      document
        .querySelector(shortlist.length ? "#clear-shortlist" : "#theme-toggle")
        .focus({ preventScroll: true });
    return;
  }
  if (event.target.closest("[data-expand-distance]")) {
    form.elements.maxDistance.value = "25";
    runSearch();
  }
});
document.querySelector("#clear-shortlist").addEventListener("click", () => {
  shortlist = [];
  save("hh-shortlist-v2", "[]");
  renderLists();
  renderShortlist();
});
document.querySelector("#shortlist-jump").addEventListener("click", () =>
  document.querySelector("#shortlist").scrollIntoView({
    behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "instant"
      : "smooth",
    block: "start",
  }),
);
document.querySelector("#show-more").addEventListener("click", () => {
  mainLimit += 8;
  renderLists();
});
document.querySelector("#more-alternatives").addEventListener("click", () => {
  alternativeLimit += 8;
  renderLists();
});
const savedTheme = stored("hh-theme");
if (savedTheme === "light" || savedTheme === "dark")
  document.documentElement.style.colorScheme = savedTheme;
document.querySelector("#theme-toggle").addEventListener("click", () => {
  const dark =
    getComputedStyle(document.documentElement).colorScheme === "dark" ||
    (!document.documentElement.style.colorScheme &&
      matchMedia("(prefers-color-scheme:dark)").matches);
  const next = dark ? "light" : "dark";
  document.documentElement.style.colorScheme = next;
  save("hh-theme", next);
});
let tooltip;
function hideTooltip() {
  tooltip?.remove();
  tooltip = null;
}
document.addEventListener("pointerover", (event) => {
  const target = event.target.closest("[data-tooltip]");
  if (!target) return;
  hideTooltip();
  tooltip = document.createElement("div");
  tooltip.className = "tooltip";
  tooltip.setAttribute("role", "tooltip");
  tooltip.textContent = target.dataset.tooltip;
  document.body.append(tooltip);
  const bounds = target.getBoundingClientRect();
  tooltip.style.top = `${bounds.bottom + window.scrollY + 5}px`;
  tooltip.style.left = `${Math.min(bounds.left + window.scrollX, document.documentElement.clientWidth - tooltip.offsetWidth - 8)}px`;
});
document.addEventListener("pointerout", hideTooltip);
document.addEventListener("scroll", hideTooltip, { passive: true });
runSearch();
icons();
