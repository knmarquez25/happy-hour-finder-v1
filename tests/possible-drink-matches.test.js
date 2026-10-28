import test from "node:test";
import assert from "node:assert/strict";
import { pendingMatches } from "../src/filter-options.js";
import { emptyPreferences } from "../src/discovery.js";

const preferences = {
  ...emptyPreferences(),
  drinkPreferences: ["espresso martini"],
};
const candidate = (name) => ({
  location: "Downey",
  county: "LA County",
  hoursText: "Monday-Friday 3pm-6pm",
  items: [{ kind: "drink", name }],
});

test("generic martinis remain possible espresso martini discoveries", () => {
  for (const name of ["Martinis", "Martini", "Flavored martinis"])
    assert.equal(pendingMatches(candidate(name), preferences), true, name);
});
test("possible martinis still respect location, food and schedule filters", () => {
  for (const extra of [
    { area: "Pasadena" },
    { foodPreferences: ["tacos"] },
    { day: "Sunday", time: "17:00" },
  ])
    assert.equal(
      pendingMatches(candidate("Martinis"), { ...preferences, ...extra }),
      false,
    );
});
test("a different specific drink is not a possible espresso martini", () => {
  for (const name of [
    "Vodka Martini",
    "Lemon Drop Martini",
    "Cocktails",
    "Beer",
  ])
    assert.equal(pendingMatches(candidate(name), preferences), false, name);
});
