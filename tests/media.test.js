import test from "node:test";
import assert from "node:assert/strict";
import { venueMedia } from "../src/media.js";
import { restaurants } from "../src/data.js";

test("display-only media credits real researched venues and retains the original photos", () => {
  assert.equal(Object.keys(venueMedia).length, 23);
  for (const id of [
    "perch-la",
    "le-oyster-bar-silver-lake",
    "foothill-restaurant-pasadena",
    "inkwell-tavern-burbank",
  ])
    assert.ok(venueMedia[id], `Original photo retained: ${id}`);
  for (const [id, media] of Object.entries(venueMedia)) {
    assert.ok(restaurants.some((venue) => venue.id === id));
    assert.equal(new URL(media.url).protocol, "https:");
    assert.equal(new URL(media.sourceUrl).protocol, "https:");
    assert.ok(media.alt.length > 25);
  }
  assert.equal(venueMedia["far-bar"], undefined);
});
