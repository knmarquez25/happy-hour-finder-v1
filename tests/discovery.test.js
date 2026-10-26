import test from "node:test";
import assert from "node:assert/strict";
import {
  emptyPreferences,
  validatePreferences,
  discover,
  menuSelection,
  menuHighlights,
} from "../src/discovery.js";
import { restaurants } from "../src/data.js";
const venue = {
  id: "a",
  name: "Test",
  neighborhood: "Pasadena",
  address: "1 Main St, Pasadena, CA 91101",
  sources: [
    {
      id: "s",
      type: "primary",
      reviewedOn: "2026-10-19",
      url: "https://example.com",
    },
  ],
  hours: [
    {
      id: "early",
      days: ["Friday"],
      start: "16:00",
      end: "18:00",
      status: "primary",
      sourceId: "s",
      restriction: "none",
    },
    {
      id: "late",
      days: ["Friday"],
      start: "21:00",
      end: "23:00",
      status: "primary",
      sourceId: "s",
      restriction: "none",
    },
  ],
  menu: [
    {
      id: "taco",
      name: "Two tacos",
      kind: "food",
      priceCents: 800,
      tags: ["tacos"],
      sourceId: "s",
      status: "primary",
      windowIds: ["early"],
    },
    {
      id: "drink",
      name: "Margarita",
      kind: "drink",
      priceCents: 700,
      tags: ["margarita"],
      sourceId: "s",
      status: "primary",
      windowIds: ["early"],
    },
    {
      id: "late",
      name: "Late fries",
      kind: "food",
      priceCents: 600,
      tags: ["fries"],
      sourceId: "s",
      status: "primary",
      windowIds: ["late"],
    },
  ],
  atmosphereTags: ["casual"],
};
const prefs = (overrides = {}) => ({ ...emptyPreferences(), ...overrides });
test("requested martinis appear first in card highlights even when fourth on the menu", () => {
  const hollywood = restaurants.find((v) => v.id === "iki-ramen-hollywood");
  const rows =
    menuHighlights(hollywood, prefs({ drinkPreferences: ["martini"] })) || [];
  assert.equal(rows[0]?.item.name, "IKI Martini");
  assert.equal(rows[0].item.priceCents, 1000);
  assert.equal(rows[0].matchesRequest, true);
  assert.equal(rows.length, 3);
  assert.equal(
    hollywood.menu[0].name,
    "Edamame",
    "Original menu order is untouched",
  );
});
test("highlights do not label unavailable or unsupported menu items as a request match", () => {
  const v = {
    ...venue,
    menu: [
      ...venue.menu,
      {
        id: "unconfirmed",
        name: "Martini",
        kind: "drink",
        tags: ["martini"],
        priceCents: 500,
        status: "secondary",
        sourceId: "s",
      },
    ],
  };
  const rows =
    menuHighlights(
      v,
      prefs({
        day: "Friday",
        time: "22:00",
        foodPreferences: ["tacos"],
        drinkPreferences: ["martini"],
      }),
    ) || [];
  assert.equal(rows.length, 3);
  assert.ok(rows.every((row) => !row.matchesRequest));
});
test("default browsing includes every record without mandatory plans or mutation", () => {
  assert.equal(discover(restaurants, prefs()).length, 111);
  assert.equal(discover([venue], prefs())[0].venue, venue);
});
test("area and supported menu food narrow one list, while unsupported food returns none", () => {
  assert.equal(
    discover([venue], prefs({ area: "Pasadena", foodPreferences: ["tacos"] }))
      .length,
    1,
  );
  assert.equal(
    discover([venue], prefs({ foodPreferences: ["sushi"] })).length,
    0,
  );
  assert.equal(
    discover([venue], prefs({ foodPreferences: ["gin"] })).length,
    0,
  );
});
test("budget is flexible and derived from a shared supported combo", () => {
  const r = discover([venue], prefs({ budget: 5 }))[0];
  assert.equal(r.combo.totalCents, 1500);
  assert.equal(r.budgetDifferenceCents, 1000);
});
test("time-only and day-only requests filter without hidden defaults; end time is exclusive", () => {
  assert.equal(discover([venue], prefs({ day: "Friday" })).length, 1);
  assert.equal(discover([venue], prefs({ day: "Monday" })).length, 0);
  assert.equal(discover([venue], prefs({ time: "17:00" })).length, 1);
  assert.equal(discover([venue], prefs({ time: "18:00" })).length, 0);
  assert.equal(
    discover(
      [venue],
      prefs({ day: "Friday", time: "22:00", foodPreferences: ["tacos"] }),
    ).length,
    0,
  );
});
test("overnight day-only and time-only requests include the previous evening window", () => {
  const night = {
    ...venue,
    hours: [
      { ...venue.hours[0], days: ["Friday"], start: "22:00", end: "02:00" },
    ],
  };
  assert.equal(
    discover([night], prefs({ day: "Saturday", time: "01:00" })).length,
    1,
  );
  assert.equal(discover([night], prefs({ day: "Saturday" })).length, 1);
  assert.equal(discover([night], prefs({ time: "01:00" })).length, 1);
});
test("unsupported area, invalid time/budget and unknown response keys are rejected", () => {
  for (const value of [
    { area: "Paris" },
    { time: "25:00" },
    { budget: 0 },
    { budget: NaN },
    { restaurantIds: ["fake"] },
    { foodPreferences: "tacos" },
  ])
    assert.throws(() => validatePreferences(prefs(value), [venue]));
  assert.deepEqual(validatePreferences(prefs(), [venue]), prefs());
});
test("menu selection reports unknown prices rather than zero and does not certify unsupported prices", () => {
  const v = {
    ...venue,
    menu: [
      ...venue.menu,
      {
        id: "unknown",
        name: "Unknown",
        priceCents: null,
        status: "secondary",
        sourceId: "s",
      },
    ],
  };
  assert.deepEqual(menuSelection(v, ["taco", "unknown"], prefs()), {
    knownCents: 800,
    unknownCount: 1,
    supported: false,
    compatible: false,
  });
  assert.throws(() => menuSelection(v, ["fabricated"], prefs()));
});
test("cross-window items cannot be presented as a supported order", () => {
  assert.equal(
    menuSelection(venue, ["taco", "late"], prefs()).compatible,
    false,
  );
  assert.equal(
    menuSelection(venue, ["taco", "drink"], prefs()).compatible,
    true,
  );
  assert.equal(
    menuSelection(venue, ["taco"], prefs({ time: "22:00" })).compatible,
    false,
  );
});
test("conditional pairings stay enforced in custom selection", () => {
  const v = {
    ...venue,
    menu: venue.menu.map((i) =>
      i.id === "taco" ? { ...i, pairWithIds: ["other"] } : i,
    ),
  };
  assert.equal(menuSelection(v, ["taco", "drink"], prefs()).compatible, false);
});
test("conflicting evidence never becomes a supported suggested price", () => {
  const v = {
    ...venue,
    menu: venue.menu.map((i) => ({ ...i, status: "conflicting" })),
  };
  assert.equal(discover([v], prefs())[0].combo, null);
  assert.equal(menuSelection(v, ["taco"], prefs()).supported, false);
});
test("a conditional item selected alone still needs its required pairing", () => {
  const v = {
    ...venue,
    menu: venue.menu.map((i) =>
      i.id === "taco" ? { ...i, pairWithIds: ["drink"] } : i,
    ),
  };
  assert.equal(menuSelection(v, ["taco"], prefs()).compatible, false);
  assert.equal(menuSelection(v, ["taco", "drink"], prefs()).compatible, true);
});
test("conditional late windows do not certify a closed-kitchen food match", () => {
  const v = restaurants.find((v) => v.id === "33-taps-silver-lake");
  assert.ok(v);
  const p = prefs({
    day: "Sunday",
    time: "21:45",
    foodPreferences: ["burger"],
  });
  assert.equal(discover([v], p).length, 0);
  assert.equal(menuSelection(v, ["food-1"], p).compatible, false);
});
