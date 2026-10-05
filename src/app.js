import { restaurants } from "./data.js";
import { budgetOptions, searchPresets } from "./presets.js";
import { formatHappyHour, rankRestaurants } from "./scoring.js";

const form = document.querySelector("#request-form");
const presetActions = document.querySelector("#preset-actions");
const budgetActions = document.querySelector("#budget-actions");
const neighborhoodFilter = document.querySelector("#neighborhood-filter");
const results = document.querySelector("#results");
const title = document.querySelector("#results-title");

function parseList(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatTime(time) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(`2026-01-01T${time}:00`));
}

function readRequest() {
  const data = new FormData(form);
  return {
    location: data.get("location").trim() || "your area",
    day: data.get("day"),
    time: data.get("time"),
    neighborhood: data.get("neighborhood"),
    maxDistance: Number(data.get("maxDistance")),
    budget: Number(data.get("budget")),
    foodPreferences: parseList(data.get("foodPreferences")),
    drinkPreferences: parseList(data.get("drinkPreferences")),
    atmosphere: data.get("atmosphere"),
  };
}

function setField(name, value) {
  const field = form.elements.namedItem(name);
  if (field) field.value = value;
}

function applyPreset(preset) {
  for (const [name, value] of Object.entries(preset)) {
    if (name !== "label") setField(name, value);
  }
  renderResults(readRequest());
}

function applyBudget(budget) {
  setField("budget", budget);
  renderResults(readRequest());
}

function statusText(restaurant) {
  if (restaurant.activeHappyHour && restaurant.happyHourVerified) return "Happy hour active";
  if (restaurant.activeHappyHour) return "Active, but uncertain";
  if (restaurant.happyHourVerified) return "Not active then";
  return "Hours uncertain";
}

function renderBreakdown(breakdown) {
  return Object.entries(breakdown)
    .map(
      ([label, value]) => `
        <div class="score-row">
          <span>${label}</span>
          <meter min="0" max="${label === "happyHour" ? 30 : label === "budget" || label === "atmosphere" ? 20 : label === "preferences" ? 15 : label === "distance" ? 10 : 5}" value="${value}"></meter>
          <strong>${value}</strong>
        </div>
      `,
    )
    .join("");
}

function renderResults(request) {
  const candidates =
    request.neighborhood && request.neighborhood !== "all"
      ? restaurants.filter((restaurant) => restaurant.neighborhood === request.neighborhood)
      : restaurants;
  const ranked = rankRestaurants(candidates, request);
  const area = request.neighborhood && request.neighborhood !== "all" ? request.neighborhood : request.location;
  title.textContent = `${request.day} at ${formatTime(request.time)} near ${area}`;
  results.innerHTML = ranked
    .map(
      (restaurant, index) => `
        <article class="result-card ${restaurant.activeHappyHour ? "active" : ""}">
          <div class="card-topline">
            <span class="rank">#${index + 1}</span>
            <span class="status">${statusText(restaurant)}</span>
          </div>
          <div class="name-row">
            <h3>${restaurant.name}</h3>
            <div class="score">${restaurant.score}</div>
          </div>
          <p class="meta">${restaurant.neighborhood} · ${restaurant.distanceMiles} mi · approx. $${restaurant.budgetEstimate}/person · ${restaurant.reputation.toFixed(1)} reputation</p>
          <p><strong>Happy hour:</strong> ${formatHappyHour(restaurant.happyHour)}</p>
          <p><strong>Food specials:</strong> ${restaurant.foodSpecials.join(", ")}</p>
          <p><strong>Drink specials:</strong> ${restaurant.drinkSpecials.join(", ")}</p>
          <p><strong>Popular dishes:</strong> ${restaurant.popularDishes.join(", ")}</p>
          <p><strong>Popular drinks:</strong> ${restaurant.popularDrinks.join(", ")}</p>
          <p><strong>Why it fits:</strong> ${restaurant.activeHappyHour ? "Its happy hour matches the requested time" : "It may still fit some preferences, but the requested time is weaker"} and it matches ${restaurant.atmosphereTags.slice(0, 2).join(" / ")} plans with ${restaurant.foodTags.slice(0, 2).join(" and ")} options.</p>
          <p><strong>Source/confidence:</strong> ${restaurant.sourceNote} <a href="${restaurant.sourceUrl}" target="_blank" rel="noreferrer">Source</a></p>
          <p class="combo"><strong>Budget combo:</strong> ${restaurant.recommendedCombo} around $${restaurant.budgetEstimate}.</p>
          <details>
            <summary>Score breakdown</summary>
            ${renderBreakdown(restaurant.breakdown)}
          </details>
        </article>
      `,
    )
    .join("");
}

function renderNeighborhoodOptions() {
  const neighborhoods = [...new Set(restaurants.map((restaurant) => restaurant.neighborhood))].sort();
  neighborhoodFilter.innerHTML = [
    '<option value="all">All DTLA areas</option>',
    ...neighborhoods.map((neighborhood) => `<option value="${neighborhood}">${neighborhood}</option>`),
  ].join("");
}

function renderPresetControls() {
  presetActions.innerHTML = searchPresets
    .map(
      (preset, index) => `
        <button class="chip-button" type="button" data-preset-index="${index}">
          <span>${preset.label}</span>
          <small>${preset.location} · $${preset.budget}</small>
        </button>
      `,
    )
    .join("");

  budgetActions.innerHTML = budgetOptions
    .map(
      (budget) => `
        <button class="chip-button budget-chip" type="button" data-budget="${budget}">
          $${budget}
        </button>
      `,
    )
    .join("");
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  renderResults(readRequest());
});

neighborhoodFilter.addEventListener("change", () => {
  renderResults(readRequest());
});

presetActions.addEventListener("click", (event) => {
  const button = event.target.closest("[data-preset-index]");
  if (!button) return;
  applyPreset(searchPresets[Number(button.dataset.presetIndex)]);
});

budgetActions.addEventListener("click", (event) => {
  const button = event.target.closest("[data-budget]");
  if (!button) return;
  applyBudget(Number(button.dataset.budget));
});

renderPresetControls();
renderNeighborhoodOptions();
renderResults(readRequest());
