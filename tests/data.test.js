import test from "node:test";
import assert from "node:assert/strict";
import { validateRecords } from "../src/validation.js";
const record = {
  id: "one",
  name: "One",
  address: "1 Main St, Los Angeles, CA 90012",
  neighborhood: "Downtown",
  coordinates: {
    lat: 34.05,
    lng: -118.25,
    sourceUrl: "https://example.com/map",
  },
  hours: [],
  menu: [],
  sources: [
    {
      id: "s",
      url: "https://example.com",
      type: "secondary",
      accessedOn: "2026-10-19",
      reviewedOn: "2026-10-19",
    },
  ],
  foodTags: [],
  drinkTags: [],
  atmosphereTags: [],
};
test("listed discount specials need text and valid source evidence", () => {
  assert.ok(
    validateRecords([
      {
        ...record,
        specials: [{ text: "$2 off drinks", status: "primary", sourceId: "s" }],
      },
    ]).some((error) => error.includes("primary")),
  );
  assert.ok(
    validateRecords([
      {
        ...record,
        specials: [{ text: "", status: "secondary", sourceId: "s" }],
      },
    ]).some((error) => error.includes("special")),
  );
});
test("duplicate venue IDs and physical addresses are rejected", () => {
  assert.ok(
    validateRecords([record, record]).some((error) =>
      error.includes("Duplicate"),
    ),
  );
  assert.ok(
    validateRecords([record, { ...record, id: "two" }]).some((error) =>
      error.includes("address"),
    ),
  );
});
test("prices are null or positive safe integer cents and require source links", () => {
  const menu = [
    {
      id: "bad",
      name: "Bad",
      kind: "food",
      priceCents: NaN,
      status: "primary",
      sourceId: "missing",
      tags: [],
    },
  ];
  assert.ok(
    validateRecords([{ ...record, menu }]).some((e) => e.includes("price")),
  );
  assert.ok(
    validateRecords([{ ...record, menu }]).some((e) => e.includes("source")),
  );
});
test("out-of-radius and unproven coordinates are rejected from published coverage", () => {
  assert.ok(
    validateRecords([
      {
        ...record,
        coordinates: { lat: 40, lng: -118, sourceUrl: "https://example.com" },
      },
    ]).some((e) => e.includes("25-mile")),
  );
  assert.ok(
    validateRecords([
      { ...record, coordinates: { lat: 34, lng: -118.2 } },
    ]).some((e) => e.includes("provenance")),
  );
});
test("missing data may be retained as explicit unknowns, not fabricated fields", () => {
  assert.deepEqual(validateRecords([{ ...record, coordinates: null }]), []);
});
test("invalid windows and unsupported primary evidence are rejected", () => {
  const hours = [
    {
      days: ["NotADay"],
      start: "25:00",
      end: "18:00",
      status: "primary",
      sourceId: "s",
      restriction: "none",
    },
  ];
  const errors = validateRecords([{ ...record, hours }]);
  assert.ok(errors.some((e) => e.includes("window")));
  assert.ok(errors.some((e) => e.includes("primary")));
});
