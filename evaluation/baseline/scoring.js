const weights = {
  happyHour: 30,
  budget: 20,
  atmosphere: 20,
  preferences: 15,
  distance: 10,
  reputation: 5,
};

export function toMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function isHappyHourActive(restaurant, day, time) {
  const requested = toMinutes(time);
  return restaurant.happyHour.some((window) => {
    const starts = toMinutes(window.start);
    const ends = toMinutes(window.end);
    return window.days.includes(day) && requested >= starts && requested <= ends;
  });
}

function textMatches(items = [], preferences = []) {
  if (!preferences.length) return 0.7;
  const normalizedItems = items.map((item) => item.toLowerCase());
  const matches = preferences.filter((preference) =>
    normalizedItems.some((item) => item.includes(preference.toLowerCase()) || preference.toLowerCase().includes(item)),
  );
  return Math.min(matches.length / preferences.length, 1);
}

function budgetFit(estimate, budget) {
  if (!budget) return 0.7;
  if (estimate <= budget) return 1;
  const overage = estimate - budget;
  if (overage <= 5) return 0.7;
  if (overage <= 10) return 0.4;
  return 0.15;
}

function distanceFit(distance, maxDistance) {
  if (!maxDistance) return 0.7;
  if (distance <= maxDistance) return 1;
  const extra = distance - maxDistance;
  if (extra <= 1) return 0.55;
  if (extra <= 2) return 0.3;
  return 0.05;
}

export function scoreRestaurant(restaurant, request) {
  const activeHappyHour = isHappyHourActive(restaurant, request.day, request.time);
  const happyHour = activeHappyHour ? 1 : restaurant.happyHourVerified ? 0.35 : 0.2;
  const budget = budgetFit(restaurant.budgetEstimate, request.budget);
  const atmosphere = textMatches(restaurant.atmosphereTags, [request.atmosphere].filter(Boolean));
  const food = textMatches(restaurant.foodTags, request.foodPreferences);
  const drinks = textMatches(restaurant.drinkTags, request.drinkPreferences);
  const preferences = food * 0.6 + drinks * 0.4;
  const distance = distanceFit(restaurant.distanceMiles, request.maxDistance);
  const reputation = Math.min(Math.max((restaurant.reputation - 3) / 2, 0), 1);

  const breakdown = {
    happyHour: Math.round(happyHour * weights.happyHour),
    budget: Math.round(budget * weights.budget),
    atmosphere: Math.round(atmosphere * weights.atmosphere),
    preferences: Math.round(preferences * weights.preferences),
    distance: Math.round(distance * weights.distance),
    reputation: Math.round(reputation * weights.reputation),
  };

  const score = Object.values(breakdown).reduce((sum, value) => sum + value, 0);

  return {
    ...restaurant,
    activeHappyHour,
    score,
    breakdown,
  };
}

export function rankRestaurants(restaurants, request) {
  return restaurants
    .map((restaurant) => scoreRestaurant(restaurant, request))
    .sort((a, b) => b.score - a.score);
}

export function formatHappyHour(happyHour) {
  return happyHour
    .map((window) => `${window.days.join(", ")} ${window.start}-${window.end}`)
    .join("; ");
}
