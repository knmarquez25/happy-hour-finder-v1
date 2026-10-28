import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { restaurants } from "../src/data.js";
import { discover, emptyPreferences } from "../src/discovery.js";
import { matchingPreferences } from "../src/matching.js";
const fixtures = JSON.parse(
  readFileSync(new URL("./menu-category-fixtures.json", import.meta.url)),
);
for (const [category, venues] of Object.entries(fixtures)) {
  test(`audited ${category} choices retain broad category search`, () => {
    for (const [id, names] of Object.entries(venues)) {
      const venue = restaurants.find((v) => v.id === id);
      for (const name of names) {
        const item = venue.menu.find((i) => i.name === name);
        assert.ok(item, `${id}: ${name}`);
        assert.deepEqual(
          matchingPreferences([item.name, ...item.tags], [category]),
          [category],
          `${id}: ${name}`,
        );
      }
      const preferenceKey = ["beer", "cocktail"].includes(category)
        ? "drinkPreferences"
        : "foodPreferences";
      // A category tag must not bypass an unsupported source or schedule.
      const hasSupportedChoice = names.some(
        (name) =>
          discover([venue], {
            ...emptyPreferences(),
            [preferenceKey]: [name],
          }).length,
      );
      if (hasSupportedChoice)
        assert.equal(
          discover([venue], {
            ...emptyPreferences(),
            [preferenceKey]: [category],
          }).length,
          1,
          id,
        );
    }
  });
}
