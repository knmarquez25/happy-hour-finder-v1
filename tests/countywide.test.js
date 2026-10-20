import test from "node:test";
import assert from "node:assert/strict";
import { coverageEligibility } from "../src/locations.js";
import { validateRecords } from "../src/validation.js";
import { evaluateRestaurant, normalizeRequest } from "../src/matching.js";
import { restaurants, dataMetadata } from "../src/data.js";
import { origins } from "../src/locations.js";

const censusUrl =
  "https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress?address=example";
const record = {
  id: "oc-example",
  name: "OC Example",
  neighborhood: "Santa Ana",
  address: "100 Main St, Santa Ana, CA 92701",
  county: {
    geoid: "06059",
    sourceId: "census",
    reviewedOn: "2026-10-19",
    status: "primary",
  },
  coordinates: {
    lat: 33.75,
    lng: -117.87,
    sourceUrl: censusUrl,
    precision: "address-range interpolation",
  },
  sources: [
    {
      id: "census",
      url: censusUrl,
      type: "primary",
      publisherRole: "government",
      reviewedOn: "2026-10-19",
      geography: {
        countyGeoid: "06059",
        queryAddress: "100 Main St, Santa Ana, CA 92701",
        lat: 33.75,
        lng: -117.87,
      },
    },
    {
      id: "official",
      url: "https://restaurant.example/happy-hour",
      type: "primary",
      reviewedOn: "2026-10-19",
    },
  ],
  hours: [
    {
      days: ["Monday"],
      start: "15:00",
      end: "18:00",
      sourceId: "official",
      status: "primary",
      restriction: "none",
    },
  ],
  menu: [],
  foodTags: [],
  drinkTags: [],
  atmosphereTags: [],
};

test("reviewed_OC_county_evidence_replaces_DTLA_dataset_radius", () => {
  assert.equal(coverageEligibility(record).included, true);
  assert.deepEqual(validateRecords([record]), []);
});
test("a_county_string_without_government_address_coordinate_evidence_fails", () => {
  const unsupported = {
    ...record,
    sources: record.sources.filter((source) => source.id !== "census"),
  };
  assert.equal(coverageEligibility(unsupported).included, false);
  assert.ok(
    validateRecords([unsupported]).some((error) => /county/i.test(error)),
  );
  assert.equal(
    coverageEligibility({ ...record, county: { geoid: "06059" } }).included,
    false,
  );
});
test("outside_county_and_mismatched_coordinates_cannot_pass", () => {
  assert.equal(
    coverageEligibility({
      ...record,
      county: { ...record.county, geoid: "06065" },
    }).included,
    false,
  );
  assert.equal(
    coverageEligibility({
      ...record,
      coordinates: { ...record.coordinates, lat: 34.05 },
    }).included,
    false,
  );
  assert.equal(
    coverageEligibility({ ...record, coordinates: null }).included,
    false,
  );
});
test("OC_origin_can_match_local_offer_and_user_radius_stays_capped_at_25_miles", () => {
  const request = {
    originId: "santa-ana",
    day: "Monday",
    time: "16:00",
    budget: 25,
    maxDistance: 5,
    requireFood: false,
    requireDrinks: false,
  };
  assert.equal(evaluateRestaurant(record, request).eligible, true);
  assert.throws(
    () => normalizeRequest({ ...request, maxDistance: 26 }),
    /25 miles/i,
  );
  const far = {
    ...record,
    coordinates: { ...record.coordinates, lat: 33.5 },
    sources: record.sources.map((source) =>
      source.id === "census"
        ? { ...source, geography: { ...source.geography, lat: 33.5 } }
        : source,
    ),
  };
  assert.equal(
    evaluateRestaurant(far, { ...request, maxDistance: 1 }).eligible,
    false,
  );
});
test("published_county_additions_are_present_and_searchable_from_their_regions", () => {
  const added = restaurants.filter((venue) => venue.county);
  assert.ok(
    added.length > 0,
    "Expected an integrated countywide batch, not staging-only candidates",
  );
  assert.equal(added.length, dataMetadata.countywideAdded);
  assert.equal(dataMetadata.total, restaurants.length);
  assert.ok(added.some((venue) => venue.county.geoid === "06037"));
  assert.ok(added.some((venue) => venue.county.geoid === "06059"));
  for (const venue of added) {
    assert.equal(coverageEligibility(venue).included, true);
    const window = venue.hours.find(
      (window) =>
        window.status === "primary" && window.restriction !== "conditional",
    );
    if (!window) continue;
    const origin = origins.find(
      (origin) =>
        origin.id ===
        {
          "Santa Ana": "santa-ana",
          "Long Beach": "long-beach",
          "El Segundo": "el-segundo",
          Glendora: "glendora",
          Brea: "brea",
          "Newport Beach": "newport-beach",
          "San Juan Capistrano": "san-juan-capistrano",
          "Laguna Beach": "laguna-beach",
        }[venue.address.split(",").at(-2).trim()],
    );
    assert.ok(origin, `Missing regional origin for ${venue.name}`);
    const result = evaluateRestaurant(venue, {
      originId: origin.id,
      day: window.days[0],
      time: window.start,
      budget: 25,
      maxDistance: 25,
      requireFood: false,
      requireDrinks: false,
      includeRestricted: true,
    });
    assert.equal(
      result.eligible,
      true,
      `${venue.name}: ${result.failures.join("; ")}`,
    );
  }
});
