import test from "node:test";
import assert from "node:assert/strict";
import {
  isHappyHourActive,
  rankRestaurants,
  scoreRestaurant,
} from "../evaluation/baseline/scoring.js";
import { restaurants } from "../evaluation/baseline/data.js";
import { budgetOptions, searchPresets } from "../evaluation/baseline/presets.js";

const baseRequest = {
  location: "Downtown LA",
  day: "Thursday",
  time: "17:30",
  maxDistance: 3,
  budget: 25,
  foodPreferences: ["tacos", "seafood"],
  drinkPreferences: ["margarita"],
  atmosphere: "lively",
};

test("detects happy hour windows that include the requested time", () => {
  const restaurant = {
    happyHour: [
      { days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], start: "15:00", end: "18:00" },
    ],
  };

  assert.equal(isHappyHourActive(restaurant, "Thursday", "17:30"), true);
  assert.equal(isHappyHourActive(restaurant, "Thursday", "18:15"), false);
  assert.equal(isHappyHourActive(restaurant, "Saturday", "17:30"), false);
});

test("active happy hour outweighs a higher reputation-only option", () => {
  const activeFit = {
    name: "Active Fit",
    distanceMiles: 1.2,
    budgetEstimate: 22,
    atmosphereTags: ["lively", "casual"],
    foodTags: ["tacos", "seafood"],
    drinkTags: ["margarita"],
    reputation: 4.1,
    happyHour: [{ days: ["Thursday"], start: "16:00", end: "18:00" }],
  };
  const famousButInactive = {
    name: "Famous But Inactive",
    distanceMiles: 0.5,
    budgetEstimate: 24,
    atmosphereTags: ["lively"],
    foodTags: ["tacos"],
    drinkTags: ["margarita"],
    reputation: 4.9,
    happyHour: [{ days: ["Thursday"], start: "14:00", end: "16:00" }],
  };

  const ranked = rankRestaurants([famousButInactive, activeFit], baseRequest);

  assert.equal(ranked[0].name, "Active Fit");
  assert.equal(ranked[0].activeHappyHour, true);
});

test("score accounts for budget, vibe, preferences, distance, and reputation", () => {
  const restaurant = {
    name: "Good Match",
    distanceMiles: 2,
    budgetEstimate: 24,
    atmosphereTags: ["lively", "patio"],
    foodTags: ["tacos", "seafood", "share plates"],
    drinkTags: ["margarita", "tequila"],
    reputation: 4.4,
    happyHour: [{ days: ["Thursday"], start: "15:00", end: "18:00" }],
  };

  const result = scoreRestaurant(restaurant, baseRequest);

  assert.equal(result.activeHappyHour, true);
  assert.ok(result.score >= 80);
  assert.deepEqual(Object.keys(result.breakdown), [
    "happyHour",
    "budget",
    "atmosphere",
    "preferences",
    "distance",
    "reputation",
  ]);
});

test("each preset can be converted into a ranked happy-hour search", () => {
  for (const preset of searchPresets) {
    const request = {
      ...preset,
      foodPreferences: preset.foodPreferences.split(",").map((item) => item.trim()),
      drinkPreferences: preset.drinkPreferences.split(",").map((item) => item.trim()),
    };

    const ranked = rankRestaurants(restaurants, request);

    assert.equal(ranked.length, restaurants.length);
    assert.equal(typeof ranked[0].score, "number");
  }
});

test("budget options include quick choices below and above the default", () => {
  assert.deepEqual(budgetOptions, [20, 25, 35, 50]);
});

test("restaurant dataset uses a real DTLA seed list instead of fake placeholders", () => {
  const names = restaurants.map((restaurant) => restaurant.name);

  assert.ok(restaurants.length >= 25);
  assert.ok(names.includes("Perch LA"));
  assert.ok(names.includes("Joyce"));
  assert.equal(names.includes("La Calle Social"), false);
  assert.equal(names.includes("Harbor & Vine"), false);
});
