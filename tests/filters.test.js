import test from "node:test";
import assert from "node:assert/strict";
import {
  filterOptions,
  canonicalTerm,
  pendingMatches,
  webQuery,
} from "../src/filter-options.js";
import { emptyPreferences } from "../src/discovery.js";

const venue = (id, foods, drinks) => ({
  id,
  name: id,
  neighborhood: "Pasadena",
  address: "1 Main St, Pasadena, CA",
  sources: [
    {
      id: "s",
      type: "primary",
      reviewedOn: "2026-10-26",
      url: "https://example.com",
    },
  ],
  hours: [
    {
      id: "w",
      days: ["Friday"],
      start: "16:00",
      end: "18:00",
      status: "primary",
      sourceId: "s",
      restriction: "none",
    },
  ],
  menu: [
    ...foods.map((name) => ({ name, kind: "food", tags: [name] })),
    ...drinks.map((name) => ({ name, kind: "drink", tags: [name] })),
  ].map((i, n) => ({
    ...i,
    id: String(n),
    priceCents: 700,
    status: "primary",
    sourceId: "s",
  })),
});
const p = (overrides) => ({ ...emptyPreferences(), ...overrides });
test("equivalent menu terms group without mixing food and drink", () => {
  assert.equal(canonicalTerm("Margaritas"), canonicalTerm("margarita"));
  const venues = [
    venue("a", ["Tacos", "Taco"], ["Margarita"]),
    venue("b", ["Fries"], ["Wine"]),
  ];
  const food = filterOptions(venues, "food", p({}));
  assert.equal(food.find((o) => o.value === "taco").count, 1);
  assert.ok(!food.some((o) => o.value === "wine"));
  assert.equal(
    filterOptions(venues, "drink", p({ foodPreferences: ["tacos"] })).find(
      (o) => o.value === "wine",
    ).count,
    0,
  );
});
test("new reviewed menus add exact item names and counts obey source-supported time", () => {
  const venues = [venue("a", ["Mushroom tostada"], ["Paloma"])];
  assert.ok(
    filterOptions(venues, "food", p({})).some(
      (o) => o.label === "Mushroom tostada",
    ),
  );
  assert.equal(
    filterOptions(venues, "food", p({ day: "Friday", time: "19:00" }))[0].count,
    0,
  );
  const next = [...venues, venue("b", ["Oysters"], ["Wine"])];
  assert.ok(
    filterOptions(next, "food", p({})).some((o) => o.value === "oyster"),
  );
});
test("pending options use recorded city/menu evidence but do not claim known price or timing", () => {
  const c = {
    location: "Pasadena",
    county: "LA County",
    address: "",
    items: [
      { kind: "food", name: "Two tacos" },
      { kind: "drink", name: "Wine" },
    ],
  };
  assert.equal(
    pendingMatches(
      c,
      p({
        area: "Pasadena",
        foodPreferences: ["tacos"],
        drinkPreferences: ["wine"],
        day: "Monday",
        time: "12:00",
        budget: 20,
      }),
    ),
    true,
  );
  assert.equal(pendingMatches(c, p({ drinkPreferences: ["beer"] })), false);
  assert.equal(pendingMatches(c, p({ area: "Downey" })), false);
  assert.equal(
    pendingMatches(
      { ...c, location: "West Hollywood" },
      p({ area: "Hollywood" }),
    ),
    false,
  );
});
test("explicit web queries contain the current independent filters and exact timing", () => {
  const q = webQuery(
    p({
      area: "Pasadena",
      foodPreferences: ["tacos"],
      drinkPreferences: ["beer"],
      day: "Friday",
      time: "17:00",
      budget: 25,
    }),
  );
  for (const term of ["Pasadena", "tacos", "beer", "Friday", "17:00", "25"])
    assert.ok(q.includes(term));
  assert.ok(q.length <= 1000);
});

test("option counts match selection for menu words ending in double s", () => {
  const venues = [venue("wine-bar", [], ["House Wine (glass)"])];
  const options = filterOptions(venues, "drink", p({}));
  assert.equal(
    options.find((option) => option.label === "House Wine (glass)").count,
    1,
  );
});

test("exact long menu names remain valid searchable filter values", () => {
  const name =
    "Roasted mushroom and seasonal vegetable tostada with house salsa";
  const venues = [venue("long-menu", [name], ["Wine"])];
  assert.equal(
    filterOptions(venues, "food", p({ foodPreferences: [name] })).find(
      (option) => option.label === name,
    ).count,
    1,
  );
});

test("bounded online queries retain city and exact timing with long menu preferences", () => {
  const q = webQuery(
    p({
      area: "Downey",
      day: "Monday",
      time: "12:00",
      budget: 25,
      foodPreferences: Array(8).fill("A".repeat(140)),
      drinkPreferences: Array(8).fill("B".repeat(140)),
    }),
  );
  assert.ok(q.length <= 1000);
  for (const term of ["Downey", "Monday", "12:00", "25"])
    assert.ok(q.includes(term));
});

test("local extra-place filtering excludes explicit time conflicts but retains unknown schedules", () => {
  const c = {
    location: "Pasadena",
    county: "LA County",
    address: "",
    items: [{ kind: "drink", name: "Wine" }],
    hoursText: "Monday 3pm-5pm",
  };
  assert.equal(
    pendingMatches(c, p({ day: "Monday", timePeriod: "night" })),
    false,
  );
  assert.equal(
    pendingMatches(
      { ...c, hoursText: null },
      p({ day: "Monday", timePeriod: "night" }),
    ),
    true,
  );
});
