import test from "node:test";
import assert from "node:assert/strict";
import { restaurants } from "../src/data.js";
import { discover, emptyPreferences, menuSelection } from "../src/discovery.js";
for (const id of ["33-taps-silver-lake", "33-taps-west-hollywood"]) {
  test(`${id} captures named food and drink choices with daily restrictions`, () => {
    const v = restaurants.find((v) => v.id === id);
    for (const name of [
      "Pizza",
      "Quesadilla",
      "Street Tacos",
      "Brussels Sprouts",
      "Banh Mi Fries",
      "Paloma",
      "Moscow Mule",
      "Espresso Martini",
      "House Red Wine",
      "House White Wine",
      "Mezcal Margarita",
    ])
      assert.ok(
        v.menu.some((i) => i.name === name),
        name,
      );
    assert.equal(v.menuCoverage.status, "complete");
    const p = {
      ...emptyPreferences(),
      foodPreferences: ["pizza"],
      day: "Tuesday",
      time: "16:00",
    };
    assert.equal(discover([v], p).length, 1);
    assert.equal(
      discover([v], { ...p, day: "Sunday", time: "21:45" }).length,
      0,
    );
    const unknown = v.menu.find((i) => i.name === "House Draft Pitcher");
    assert.equal(unknown.priceCents, null);
    assert.equal(menuSelection(v, [unknown.id]).unknownCount, 1);
    const shot = v.menu.find((i) => i.name === "Taco Tuesday Tequila Shot");
    assert.ok(shot.days.includes("Tuesday"));
    assert.equal(
      discover([v], {
        ...emptyPreferences(),
        drinkPreferences: ["tequila shot"],
        day: "Monday",
        time: "16:00",
      }).length,
      0,
    );
    assert.equal(
      discover([v], {
        ...emptyPreferences(),
        drinkPreferences: ["tequila shot"],
        day: "Tuesday",
        time: "13:00",
      }).length,
      1,
    );
  });
}
import { readFileSync } from "node:fs";
test("all 111 baseline locations have final traceable audit outcomes", () => {
  const baseline = JSON.parse(
    readFileSync(
      new URL("../research/menu-audit-baseline.json", import.meta.url),
    ),
  );
  const ledger = JSON.parse(
    readFileSync(new URL("../research/menu-audit.json", import.meta.url)),
  );
  assert.equal(baseline.length, 111);
  assert.deepEqual(restaurants.map((v) => v.id).sort(), [...baseline].sort());
  assert.deepEqual(Object.keys(ledger).sort(), [...baseline].sort());
  for (const v of restaurants) {
    assert.deepEqual(v.menuCoverage, ledger[v.id]);
    assert.doesNotMatch(
      JSON.stringify(v.menuCoverage),
      /audit pending|not yet audited/i,
      v.id,
    );
    assert.ok(v.menuCoverage.scope.trim());
    if (v.menuCoverage.status === "complete") {
      assert.equal(v.menuCoverage.gaps.length, 0);
      assert.ok(v.menuCoverage.sourceIds.length);
    } else assert.ok(v.menuCoverage.gaps.length, v.id);
    if (v.withholdMenuPrices)
      assert.ok(
        v.menu.every((i) => i.priceCents === null),
        v.id,
      );
  }
});
test("expanded menus retain minimum orders, bundles, conflicting prices and daily applicability", () => {
  const michael = restaurants.find((v) => v.id === "michaels-santa-monica");
  assert.equal(
    michael.menu.find((i) => i.name === "Oyster Shooters (minimum 3)")
      .priceCents,
    1500,
  );
  const ospi = restaurants.find((v) => v.id === "ospi-brentwood");
  const unpriced = ospi.menu.find((i) => i.name === "Whipped Ricotta Fettunta");
  assert.equal(unpriced.priceCents, null);
  assert.equal(menuSelection(ospi, [unpriced.id]).unknownCount, 1);
  const agnes = restaurants.find(
    (v) => v.id === "agnes-restaurant-cheesery-pasadena",
  );
  assert.ok(agnes.menu.every((i) => i.priceCents === null));
  const madre = restaurants.find(
    (v) => v.id === "gracias-madre-west-hollywood",
  );
  assert.equal(
    discover([madre], {
      ...emptyPreferences(),
      day: "Monday",
      time: "12:00",
      foodPreferences: ["Taco Tuesday"],
    }).length,
    0,
  );
  assert.equal(
    discover([madre], {
      ...emptyPreferences(),
      day: "Tuesday",
      time: "12:00",
      foodPreferences: ["Taco Tuesday"],
    }).length,
    1,
  );
  assert.equal(
    madre.menu.find((i) => i.name === "Purista Margarita").status,
    "conflicting",
  );
  const joyce = restaurants.find((v) => v.id === "joyce");
  assert.equal(
    discover([joyce], {
      ...emptyPreferences(),
      day: "Friday",
      time: "21:30",
      foodPreferences: ["Colossal shrimp"],
    }).length,
    0,
  );
  assert.equal(
    discover([joyce], {
      ...emptyPreferences(),
      day: "Friday",
      time: "21:30",
      foodPreferences: ["Oxtail grilled cheese"],
    }).length,
    1,
  );
});
for (const id of ["33-taps-silver-lake", "33-taps-west-hollywood"]) {
  test(`${id} Tuesday food and drinks share supported windows until the kitchen cutoff`, () => {
    const v = restaurants.find((v) => v.id === id);
    const food = v.menu.find(
      (i) => i.name === "Taco Tuesday Chicken Street Tacos (3)",
    );
    const drink = v.menu.find((i) => i.name === "Taco Tuesday Margarita");
    const hhDrink = v.menu.find((i) => i.name === "Margarita");
    const hhFood = v.menu.find((i) => i.name === "Pizza");
    const p = { ...emptyPreferences(), day: "Tuesday", time: "13:00" };
    assert.equal(menuSelection(v, [food.id, drink.id], p).compatible, true);
    assert.ok(
      discover([v], {
        ...p,
        foodPreferences: ["Taco Tuesday Chicken Street Tacos"],
        drinkPreferences: ["margarita"],
      })[0].combo,
    );
    assert.equal(
      menuSelection(v, [food.id, hhDrink.id], { ...p, time: "16:00" })
        .compatible,
      true,
    );
    assert.equal(
      menuSelection(v, [hhFood.id, drink.id], { ...p, time: "16:00" })
        .compatible,
      true,
    );
    assert.equal(
      menuSelection(v, [food.id, drink.id], { ...p, time: "22:15" }).compatible,
      false,
    );
    assert.equal(
      menuSelection(v, [drink.id], { ...p, time: "22:15" }).compatible,
      true,
    );
  });
}
test("Gracias Madre Tuesday tacos share the overlapping HH drink window only during HH", () => {
  const v = restaurants.find((v) => v.id === "gracias-madre-west-hollywood");
  const food = v.menu.find((i) => i.name === "Taco Tuesday Soyrizo");
  const drink = v.menu.find((i) => i.name === "House Cerveza");
  const p = { ...emptyPreferences(), day: "Tuesday", time: "16:00" };
  assert.equal(menuSelection(v, [food.id, drink.id], p).compatible, true);
  assert.equal(
    menuSelection(v, [food.id, drink.id], { ...p, time: "12:00" }).compatible,
    false,
  );
});
