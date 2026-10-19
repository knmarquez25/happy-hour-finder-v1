import test from "node:test";
import assert from "node:assert/strict";
import {
  isHappyHourActive,
  selectCombo,
  searchRestaurants,
  evaluateRestaurant,
  normalizeRequest,
  matchingPreferences,
} from "../src/matching.js";
import { origins, distanceMiles } from "../src/locations.js";
const source = {
  id: "official",
  url: "https://example.com/menu",
  type: "primary",
  reviewedOn: "2026-10-19",
};
const venue = {
  id: "good",
  name: "Good",
  neighborhood: "Downtown",
  coordinates: { lat: 34.05, lng: -118.25 },
  sources: [source],
  hours: [
    {
      days: ["Thursday"],
      start: "16:00",
      end: "18:00",
      sourceId: "official",
      status: "primary",
      restriction: "none",
    },
  ],
  menu: [
    {
      id: "taco",
      name: "Taco",
      kind: "food",
      priceCents: 1600,
      tags: ["tacos"],
      sourceId: "official",
      status: "primary",
    },
    {
      id: "drink",
      name: "Margarita",
      kind: "drink",
      priceCents: 1100,
      tags: ["margarita"],
      sourceId: "official",
      status: "primary",
    },
  ],
  foodTags: ["tacos"],
  drinkTags: ["margarita"],
  atmosphereTags: ["lively"],
};
const request = {
  originId: "dtla",
  day: "Thursday",
  time: "17:30",
  maxDistance: 3,
  budget: 25,
  foodPreferences: ["tacos"],
  drinkPreferences: ["margarita"],
  atmosphere: "lively",
};
test("required food and drink categories cannot pass on an empty menu with blank preferences", () => {
  assert.equal(
    evaluateRestaurant(
      { ...venue, menu: [] },
      {
        ...request,
        foodPreferences: [],
        drinkPreferences: [],
        requireFood: true,
        requireDrinks: true,
      },
    ).eligible,
    false,
  );
  assert.equal(
    evaluateRestaurant(venue, {
      ...request,
      foodPreferences: [],
      drinkPreferences: [],
      requireFood: true,
      requireDrinks: true,
    }).eligible,
    true,
  );
});
test("overnight item weekday follows the active window's starting day", () => {
  const overnight = {
    ...venue,
    hours: [
      { ...venue.hours[0], days: ["Friday"], start: "22:00", end: "02:00" },
    ],
    menu: venue.menu.map((item) => ({ ...item, days: ["Friday"] })),
  };
  assert.equal(
    evaluateRestaurant(overnight, {
      ...request,
      day: "Saturday",
      time: "01:00",
      requireFood: true,
      requireDrinks: true,
    }).eligible,
    true,
  );
  assert.equal(
    selectCombo(overnight, { ...request, day: "Saturday", time: "01:00" })
      .totalCents,
    2700,
  );
});
test("required food and drinks must be compatible, even when prices are unknown", () => {
  const conditional = {
    ...venue,
    menu: [
      { ...venue.menu[0], pairWithIds: ["beer"] },
      { ...venue.menu[1], id: "beer", tags: ["beer"] },
      { ...venue.menu[1], id: "wine", tags: ["wine"] },
    ],
  };
  const required = {
    ...request,
    requireFood: true,
    requireDrinks: true,
    drinkPreferences: ["wine"],
  };
  assert.equal(evaluateRestaurant(conditional, required).eligible, false);
  assert.equal(
    evaluateRestaurant(
      {
        ...venue,
        menu: venue.menu.map((item) => ({ ...item, priceCents: null })),
      },
      {
        ...request,
        requireFood: true,
        requireDrinks: true,
      },
    ).eligible,
    true,
  );
});
test("flexible budget retains over-target and cheaper matches with exact differences", () => {
  const result = searchRestaurants([venue], request);
  assert.equal(result.matches.length, 1);
  assert.equal(result.matches[0].combo.totalCents, 2700);
  assert.equal(result.matches[0].budgetDifferenceCents, 200);
  assert.equal(
    searchRestaurants([venue], { ...request, budget: 5 }).matches.length,
    1,
  );
  assert.equal(
    searchRestaurants([venue], { ...request, budget: 40 }).matches[0]
      .budgetDifferenceCents,
    -1300,
  );
});
test("unknown price is never zero or an unsupported positive budget claim", () => {
  const unknown = {
    ...venue,
    menu: venue.menu.map((i) => ({ ...i, priceCents: null })),
  };
  const match = evaluateRestaurant(unknown, request);
  assert.equal(match.combo, null);
  assert.equal(match.budgetDifferenceCents, null);
  assert.equal(match.breakdown.budget, 0);
  assert.equal(match.eligible, true);
});
test("combo honors category must-haves instead of choosing an unrelated cheap item", () => {
  const candidate = {
    ...venue,
    menu: [
      ...venue.menu,
      {
        ...venue.menu[0],
        id: "fries",
        name: "Fries",
        priceCents: 100,
        tags: ["fries"],
      },
    ],
  };
  const combo = selectCombo(candidate, { ...request, requireFood: true });
  assert.equal(combo.food.id, "taco");
  assert.equal(combo.totalCents, 2700);
});
test("secondary or conflicting prices cannot establish a supported total", () => {
  assert.equal(
    selectCombo(
      {
        ...venue,
        menu: venue.menu.map((i) => ({ ...i, status: "secondary" })),
      },
      request,
    ),
    null,
  );
});
test("secondary schedules and inactive schedules stay out of primary matches", () => {
  assert.equal(
    searchRestaurants(
      [
        {
          ...venue,
          hours: venue.hours.map((w) => ({ ...w, status: "secondary" })),
        },
      ],
      request,
    ).matches.length,
    0,
  );
  assert.equal(
    searchRestaurants([venue], { ...request, time: "18:00" }).matches.length,
    0,
  );
});
test("end exclusive, overnight and previous weekday scheduling", () => {
  assert.equal(isHappyHourActive(venue, "Thursday", "18:00"), false);
  const overnight = {
    hours: [{ days: ["Friday"], start: "22:00", end: "02:00" }],
  };
  assert.equal(isHappyHourActive(overnight, "Saturday", "01:00"), true);
  assert.equal(isHappyHourActive(overnight, "Friday", "01:00"), false);
  assert.equal(isHappyHourActive(overnight, "Saturday", "02:00"), false);
});
test("distance is actually recalculated from the origin, not old static distances", () => {
  const local = evaluateRestaurant(venue, request),
    remote = evaluateRestaurant(venue, {
      ...request,
      originId: "pasadena",
      maxDistance: 3,
    });
  assert.ok(local.distanceMiles < 1);
  assert.ok(remote.distanceMiles > 5);
  assert.equal(remote.eligible, false);
  assert.equal(distanceMiles(origins[0], origins[0]), 0);
});
test("unknown coordinates, required foods and unknown neighborhoods never silently qualify", () => {
  assert.equal(
    evaluateRestaurant({ ...venue, coordinates: null }, request).eligible,
    false,
  );
  assert.equal(
    evaluateRestaurant(venue, {
      ...request,
      requireFood: true,
      foodPreferences: ["oysters"],
    }).eligible,
    false,
  );
  assert.equal(
    searchRestaurants([venue], { ...request, neighborhood: "Nowhere" }).matches
      .length,
    0,
  );
});
test("conditional seating offers need explicit selection; generic conditions cannot qualify", () => {
  const restricted = {
    ...venue,
    hours: venue.hours.map((w) => ({ ...w, restriction: "bar-only" })),
  };
  assert.equal(evaluateRestaurant(restricted, request).eligible, false);
  assert.equal(
    evaluateRestaurant(restricted, { ...request, includeRestricted: true })
      .eligible,
    true,
  );
  const conditional = {
    ...restricted,
    hours: restricted.hours.map((w) => ({ ...w, restriction: "conditional" })),
  };
  assert.equal(
    evaluateRestaurant(conditional, { ...request, includeRestricted: true })
      .eligible,
    false,
  );
});
test("invalid requests fail clearly rather than treating NaN as an unknown price", () => {
  assert.throws(
    () => normalizeRequest({ ...request, budget: "bad" }),
    /budget/i,
  );
  assert.throws(() => normalizeRequest({ ...request, time: "25:99" }), /time/i);
  assert.throws(
    () => normalizeRequest({ ...request, originId: "nowhere" }),
    /area|origin/i,
  );
});
test("stable tie breaking and bounded scores do not mutate inputs", () => {
  const a = { ...venue, id: "a" },
    b = { ...venue, id: "b" };
  const results = searchRestaurants([b, a], request).matches;
  assert.deepEqual(
    results.map((v) => v.id),
    ["a", "b"],
  );
  assert.ok(results[0].score >= 0 && results[0].score <= 100);
  assert.equal(a.score, undefined);
});
test("short ingredient substrings do not masquerade as drink matches", () => {
  assert.deepEqual(matchingPreferences(["ginger beer"], ["gin"]), []);
  assert.deepEqual(matchingPreferences(["natural wine"], ["wine"]), ["wine"]);
});
test("day-specific menu items never become a weekday-wide combo", () => {
  const friday = {
    ...venue,
    menu: venue.menu.map((item) => ({ ...item, days: ["Friday"] })),
  };
  assert.equal(selectCombo(friday, request), null);
});
test("must-have items are confirmed for the requested day, not just the venue", () => {
  const friday = {
    ...venue,
    menu: venue.menu.map((item) => ({ ...item, days: ["Friday"] })),
  };
  assert.equal(
    evaluateRestaurant(friday, { ...request, requireFood: true }).eligible,
    false,
  );
});
test("invalid weekdays do not accidentally match the previous overnight day", () => {
  assert.equal(
    isHappyHourActive(
      { hours: [{ days: ["Saturday"], start: "22:00", end: "02:00" }] },
      "Noday",
      "01:00",
    ),
    false,
  );
});
test("a conditional food price is only paired with its documented drink", () => {
  const paired = {
    ...venue,
    menu: [
      { ...venue.menu[0], pairWithIds: ["drink"] },
      venue.menu[1],
      {
        ...venue.menu[1],
        id: "beer",
        name: "Beer",
        priceCents: 100,
        tags: ["beer"],
      },
    ],
  };
  assert.equal(
    selectCombo(paired, { ...request, drinkPreferences: [] }).drink.id,
    "drink",
  );
});
test("unavailable dishes do not earn preference points or positive explanations", () => {
  const late = {
    ...venue,
    hours: [
      { ...venue.hours[0], id: "early", days: ["Friday"] },
      {
        ...venue.hours[0],
        id: "late",
        days: ["Friday"],
        start: "21:00",
        end: "23:00",
      },
    ],
    menu: [
      { ...venue.menu[0], tags: ["seafood"], windowIds: ["early"] },
      {
        ...venue.menu[0],
        id: "mac",
        name: "Mac and cheese",
        tags: ["pasta"],
        windowIds: ["late"],
      },
      venue.menu[1],
    ],
    foodTags: ["seafood", "pasta"],
  };
  const result = evaluateRestaurant(late, {
    ...request,
    day: "Friday",
    time: "22:00",
    foodPreferences: ["seafood"],
  });
  assert.equal(result.eligible, true);
  assert.equal(result.combo.food.id, "mac");
  assert.equal(result.breakdown.food, 0);
  assert.deepEqual(result.foodMatches, []);
  assert.ok(!result.reasons.includes("Food: seafood"));
});
test("combos require one common active primary permitted window, not an inactive shared ID", () => {
  const mixed = {
    ...venue,
    hours: [
      { ...venue.hours[0], id: "confirmed" },
      { ...venue.hours[0], id: "conflicting", status: "conflicting" },
      { ...venue.hours[0], id: "later", start: "20:00", end: "22:00" },
    ],
    menu: [
      { ...venue.menu[0], windowIds: ["confirmed", "later"] },
      { ...venue.menu[1], windowIds: ["conflicting", "later"] },
    ],
  };
  assert.equal(selectCombo(mixed, request), null);
  assert.equal(
    evaluateRestaurant(mixed, { ...request, requireDrinks: true }).eligible,
    false,
  );
});
