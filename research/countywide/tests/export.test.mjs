import test from "node:test";
import assert from "node:assert/strict";
import { exportAcceptedBatch } from "../tools/export.mjs";
import { candidateDigest, evidenceDigest } from "../tools/common.mjs";
import { fixture, pricedFixture, now } from "./fixtures.mjs";

function locatedBatch(priced = false) {
  const batch = priced ? pricedFixture() : fixture();
  const candidate = batch.candidates[0];
  const address = "100 Main St, Example, CA 90001";
  const source = batch.sources[1];
  source.url =
    "https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress?address=synthetic";
  source.geography = {
    countyGeoid: "06037",
    queryAddress: address,
    lat: 34.05,
    lng: -118.25,
  };
  candidate.coordinates = {
    lat: 34.05,
    lng: -118.25,
    precision: "address-range interpolation",
    sourceId: "county",
  };
  batch.policies[0].sourceOrigins.push("https://geocoding.geo.census.gov");
  batch.reviews[0].candidateHash = candidateDigest(candidate);
  batch.reviews[0].evidenceHash = evidenceDigest(candidate, batch.sources);
  return batch;
}

test("pending_permission_or_review_records_never_export", () => {
  const batch = locatedBatch();
  batch.policies[0].publicRetention = "unconfirmed";
  assert.equal(exportAcceptedBatch(batch, { now }).records.length, 0);
  batch.policies[0].publicRetention = "allowed";
  batch.reviews = [];
  assert.equal(exportAcceptedBatch(batch, { now }).records.length, 0);
});
test("export_preserves_government_provenance_and_unknown_prices", () => {
  const batch = locatedBatch(true);
  batch.candidates[0].menu[0].priceCents = null;
  batch.reviews[0].candidateHash = candidateDigest(batch.candidates[0]);
  const result = exportAcceptedBatch(batch, { now });
  assert.equal(result.records.length, 1);
  const record = result.records[0];
  assert.equal(record.menu[0].priceCents, null);
  assert.equal(record.county.geoid, "06037");
  assert.equal(
    record.coordinates.sourceUrl,
    record.sources.find((source) => source.id === "county").url,
  );
  assert.equal(record.sources[0].reviewedOn, "2026-10-19");
  assert.deepEqual(record.menu[0].windowIds, ["afternoon"]);
});
test("accepted_unlocated_records_are_withheld_from_distance_search_export", () => {
  const batch = fixture();
  assert.deepEqual(exportAcceptedBatch(batch, { now }).records, []);
  assert.deepEqual(exportAcceptedBatch(batch, { now }).pendingIds, [
    "cw-example",
  ]);
});
test("bad_county_coordinate_provenance_throws_instead_of_exporting", () => {
  const batch = locatedBatch();
  batch.sources[1].geography.lat = 40;
  batch.reviews[0].evidenceHash = evidenceDigest(
    batch.candidates[0],
    batch.sources,
  );
  assert.throws(
    () => exportAcceptedBatch(batch, { now }),
    /government|county|location/i,
  );
});
test("withheld_menu_prices_cannot_leak_through_public_source_notes", () => {
  const batch = locatedBatch();
  batch.candidates[0].withholdMenuPrices = true;
  batch.sources[0].note = "Unreviewed menu text mentions a $9 cocktail.";
  batch.reviews[0].candidateHash = candidateDigest(batch.candidates[0]);
  batch.reviews[0].evidenceHash = evidenceDigest(
    batch.candidates[0],
    batch.sources,
  );
  assert.throws(() => exportAcceptedBatch(batch, { now }), /withheld.*price/i);
});
