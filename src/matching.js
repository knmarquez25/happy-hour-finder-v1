import { origins, coverageEligibility, distanceMiles } from "./locations.js";

export const weekdays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
export const scoreWeights = {
  time: 25,
  budget: 20,
  food: 20,
  drinks: 15,
  atmosphere: 10,
  distance: 10,
};
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
export function toMinutes(time) {
  if (!timePattern.test(time)) return NaN;
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}
export function normalizeRequest(request = {}) {
  const origin = origins.find((origin) => origin.id === request.originId);
  if (!origin) throw new Error("Choose a supported starting area.");
  if (!weekdays.includes(request.day)) throw new Error("Choose a valid day.");
  if (!timePattern.test(request.time)) throw new Error("Choose a valid time.");
  const budget = Number(request.budget),
    maxDistance = Number(request.maxDistance);
  if (!Number.isFinite(budget) || budget <= 0 || budget > 500)
    throw new Error("Budget target must be between $1 and $500.");
  if (!Number.isFinite(maxDistance) || maxDistance <= 0 || maxDistance > 25)
    throw new Error(
      "Distance must be greater than 0 and no more than 25 miles.",
    );
  const list = (value) =>
    (Array.isArray(value)
      ? value
      : typeof value === "string"
        ? value.split(",")
        : []
    )
      .map((x) => String(x).trim().toLowerCase())
      .filter(Boolean);
  return {
    ...request,
    origin,
    budget,
    maxDistance,
    foodPreferences: list(request.foodPreferences),
    drinkPreferences: list(request.drinkPreferences),
    atmosphere: request.atmosphere || "",
    neighborhood: request.neighborhood || "all",
    requireFood: Boolean(request.requireFood),
    requireDrinks: Boolean(request.requireDrinks),
    includeRestricted: Boolean(request.includeRestricted),
  };
}
function activeWindow(window, day, time) {
  if (!weekdays.includes(day)) return false;
  const current = toMinutes(time),
    start = toMinutes(window.start),
    end = toMinutes(window.end);
  if (
    !Number.isFinite(current) ||
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    start === end
  )
    return false;
  if (start < end)
    return window.days.includes(day) && current >= start && current < end;
  const previous = weekdays[(weekdays.indexOf(day) + 6) % 7];
  return (
    (window.days.includes(day) && current >= start) ||
    (window.days.includes(previous) && current < end)
  );
}
export function isHappyHourActive(restaurant, day, time) {
  return (restaurant.hours || restaurant.happyHour || []).some((window) =>
    activeWindow(window, day, time),
  );
}
function primaryEvidence(venue, record) {
  return (
    record.status === "primary" &&
    venue.sources?.some(
      (source) =>
        source.id === record.sourceId &&
        source.type === "primary" &&
        source.reviewedOn,
    )
  );
}
function restrictionAllowed(window, request) {
  return (
    !window.restriction ||
    window.restriction === "none" ||
    (["bar-only", "bar-or-patio"].includes(window.restriction) &&
      request.includeRestricted)
  );
}
function matchesTag(tag, preference) {
  const normalize = (value) =>
    String(value)
      .toLowerCase()
      .trim()
      .split(/[^a-z0-9]+/)
      .map((word) => word.replace(/s$/, ""))
      .filter(Boolean)
      .join(" ");
  const a = normalize(tag),
    b = normalize(preference);
  return Boolean(a && b) && ` ${a} `.includes(` ${b} `);
}
export function matchingPreferences(tags = [], preferences = []) {
  return preferences.filter((preference) =>
    tags.some((tag) => matchesTag(tag, preference)),
  );
}
function preferenceFit(tags, preferences) {
  return preferences.length
    ? matchingPreferences(tags, preferences).length / preferences.length
    : 0.7;
}
function commonSupportedWindow(venue, request, items) {
  return (venue.hours || []).some(
    (window) =>
      primaryEvidence(venue, window) &&
      activeWindow(window, request.day, request.time) &&
      restrictionAllowed(window, request) &&
      items.every(
        (item) =>
          (!item.windowIds || item.windowIds.includes(window.id)) &&
          (!item.days ||
            item.days.includes(
              toMinutes(window.start) > toMinutes(window.end) &&
                toMinutes(request.time) < toMinutes(window.end)
                ? weekdays[(weekdays.indexOf(request.day) + 6) % 7]
                : request.day,
            )),
      ),
  );
}
function availableMenuItems(venue, request) {
  return (venue.menu || []).filter(
    (item) =>
      primaryEvidence(venue, item) &&
      commonSupportedWindow(venue, request, [item]),
  );
}
function compatibleItems(venue, request, food, drink) {
  return (
    commonSupportedWindow(venue, request, [food, drink]) &&
    (!food.pairWithIds || food.pairWithIds.includes(drink.id)) &&
    (!drink.pairWithIds || drink.pairWithIds.includes(food.id))
  );
}
export function selectCombo(venue, rawRequest) {
  const request = normalizeRequest(rawRequest);
  const items = availableMenuItems(venue, request).filter(
    (item) => Number.isSafeInteger(item.priceCents) && item.priceCents > 0,
  );
  const foods = items.filter((item) => item.kind === "food"),
    drinks = items.filter((item) => item.kind === "drink");
  const combinations = [];
  for (const food of foods)
    for (const drink of drinks) {
      if (!compatibleItems(venue, request, food, drink)) continue;
      const foodMatches = matchingPreferences(
          food.tags,
          request.foodPreferences,
        ),
        drinkMatches = matchingPreferences(
          drink.tags,
          request.drinkPreferences,
        );
      if (
        request.requireFood &&
        request.foodPreferences.length &&
        !foodMatches.length
      )
        continue;
      if (
        request.requireDrinks &&
        request.drinkPreferences.length &&
        !drinkMatches.length
      )
        continue;
      combinations.push({
        food,
        drink,
        totalCents: food.priceCents + drink.priceCents,
        preferenceMatches: foodMatches.length + drinkMatches.length,
      });
    }
  return (
    combinations.sort(
      (a, b) =>
        b.preferenceMatches - a.preferenceMatches ||
        a.totalCents - b.totalCents ||
        `${a.food.id}:${a.drink.id}`.localeCompare(
          `${b.food.id}:${b.drink.id}`,
        ),
    )[0] || null
  );
}
export function evaluateRestaurant(venue, rawRequest) {
  const request = normalizeRequest(rawRequest);
  const distance = distanceMiles(request.origin, venue.coordinates),
    coverage = coverageEligibility(venue);
  const windows = (venue.hours || []).filter((window) =>
    activeWindow(window, request.day, request.time),
  );
  const supported = windows.filter((window) => primaryEvidence(venue, window));
  const allowed = supported.filter((window) =>
    restrictionAllowed(window, request),
  );
  const failures = [];
  if (!coverage.included) failures.push(coverage.reason);
  if (distance !== null && distance > request.maxDistance)
    failures.push(
      `${(distance - request.maxDistance).toFixed(1)} mi beyond your distance`,
    );
  if (!windows.length)
    failures.push(
      venue.hours?.length
        ? "Not happy hour at your selected time"
        : "Happy-hour schedule needs verification",
    );
  else if (!supported.length)
    failures.push("Happy-hour schedule needs restaurant verification");
  else if (!allowed.length)
    failures.push("Seating or offer restriction applies");
  if (
    request.neighborhood !== "all" &&
    venue.neighborhood !== request.neighborhood
  )
    failures.push("Different neighborhood");
  const availableItems = availableMenuItems(venue, request);
  const supportedFood = availableItems
    .filter((item) => item.kind === "food")
    .flatMap((item) => item.tags || []);
  const supportedDrinks = availableItems
    .filter((item) => item.kind === "drink")
    .flatMap((item) => item.tags || []);
  const foodMatches = matchingPreferences(
      supportedFood,
      request.foodPreferences,
    ),
    drinkMatches = matchingPreferences(
      supportedDrinks,
      request.drinkPreferences,
    );
  if (
    request.requireFood &&
    !availableItems.some(
      (item) =>
        item.kind === "food" &&
        (!request.foodPreferences.length ||
          matchingPreferences(item.tags, request.foodPreferences).length),
    )
  )
    failures.push("Required food not confirmed on happy-hour menu");
  if (
    request.requireDrinks &&
    !availableItems.some(
      (item) =>
        item.kind === "drink" &&
        (!request.drinkPreferences.length ||
          matchingPreferences(item.tags, request.drinkPreferences).length),
    )
  )
    failures.push("Required drink not confirmed on happy-hour menu");
  if (
    request.requireFood &&
    request.requireDrinks &&
    !availableItems.some(
      (food) =>
        food.kind === "food" &&
        (!request.foodPreferences.length ||
          matchingPreferences(food.tags, request.foodPreferences).length) &&
        availableItems.some(
          (drink) =>
            drink.kind === "drink" &&
            (!request.drinkPreferences.length ||
              matchingPreferences(drink.tags, request.drinkPreferences)
                .length) &&
            compatibleItems(venue, request, food, drink),
        ),
    )
  )
    failures.push("Required food and drink offers cannot be combined");
  const combo = selectCombo(venue, request);
  const budgetDifferenceCents = combo
    ? combo.totalCents - Math.round(request.budget * 100)
    : null;
  const budgetFit =
    budgetDifferenceCents === null
      ? 0
      : budgetDifferenceCents <= 0
        ? 1
        : budgetDifferenceCents <= 500
          ? 0.7
          : budgetDifferenceCents <= 1000
            ? 0.4
            : 0.1;
  const breakdown = {
    time: allowed.length ? 25 : 0,
    budget: Math.round(budgetFit * 20),
    food: Math.round(
      preferenceFit(supportedFood, request.foodPreferences) * 20,
    ),
    drinks: Math.round(
      preferenceFit(supportedDrinks, request.drinkPreferences) * 15,
    ),
    atmosphere: Math.round(
      preferenceFit(
        venue.atmosphereTags || [],
        request.atmosphere ? [request.atmosphere] : [],
      ) * 10,
    ),
    distance:
      distance === null
        ? 0
        : Math.round(
            Math.max(0, 1 - distance / Math.max(request.maxDistance * 2, 1)) *
              10,
          ),
  };
  const reasons = [];
  if (allowed.length) reasons.push("Listed happy hour fits");
  if (foodMatches.length) reasons.push(`Food: ${foodMatches.join(", ")}`);
  if (drinkMatches.length) reasons.push(`Drinks: ${drinkMatches.join(", ")}`);
  const missedFood = request.foodPreferences.filter(
    (preference) => !foodMatches.includes(preference),
  );
  const missedDrinks = request.drinkPreferences.filter(
    (preference) => !drinkMatches.includes(preference),
  );
  if (missedFood.length)
    reasons.push(`Not confirmed: ${missedFood.join(", ")}`);
  if (missedDrinks.length)
    reasons.push(`Not confirmed: ${missedDrinks.join(", ")}`);
  if (
    request.atmosphere &&
    (venue.atmosphereTags || []).some((tag) =>
      matchesTag(tag, request.atmosphere),
    )
  )
    reasons.push(`${request.atmosphere} vibe (editorial)`);
  if (!combo) reasons.push("Combo price unavailable");
  return {
    ...venue,
    eligible: failures.length === 0,
    failures,
    reasons,
    activeHappyHour: windows.length > 0,
    activeWindows: allowed,
    combo,
    budgetDifferenceCents,
    distanceMiles: distance,
    score: Object.values(breakdown).reduce((a, b) => a + b, 0),
    breakdown,
    foodMatches,
    drinkMatches,
  };
}
export function searchRestaurants(venues, rawRequest) {
  const request = normalizeRequest(rawRequest);
  const evaluated = venues
    .filter(
      (venue) =>
        request.neighborhood === "all" ||
        venue.neighborhood === request.neighborhood,
    )
    .map((venue) => evaluateRestaurant(venue, request));
  const compare = (a, b) => b.score - a.score || a.id.localeCompare(b.id);
  return {
    matches: evaluated.filter((v) => v.eligible).sort(compare),
    alternatives: evaluated.filter((v) => !v.eligible).sort(compare),
  };
}
export function rankRestaurants(venues, request) {
  return searchRestaurants(venues, request).matches;
}
export function formatHappyHour(windows = []) {
  return windows
    .map(
      (window) =>
        `${window.days.join(", ")} ${window.start}–${window.end}${window.restriction && window.restriction !== "none" ? ` (${window.restriction})` : ""}`,
    )
    .join("; ");
}
