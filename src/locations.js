import LatLon from "./vendor/latlon-spherical.js";
import { countyOrigins } from "./county-origins.js";

export const coverageCenter = { lat: 34.0505, lng: -118.2551 };
// These are area reference points, not the user's precise location.
export const origins = [
  { id: "dtla", name: "Downtown LA", ...coverageCenter },
  { id: "arts-district", name: "Arts District", lat: 34.0408, lng: -118.2344 },
  { id: "pasadena", name: "Pasadena", lat: 34.1458, lng: -118.1445 },
  { id: "glendale", name: "Glendale", lat: 34.1425, lng: -118.2551 },
  { id: "burbank", name: "Burbank", lat: 34.1808, lng: -118.309 },
  { id: "hollywood", name: "Hollywood", lat: 34.1016, lng: -118.3267 },
  { id: "west-hollywood", name: "West Hollywood", lat: 34.09, lng: -118.3617 },
  { id: "silver-lake", name: "Silver Lake", lat: 34.0869, lng: -118.2702 },
  { id: "koreatown", name: "Koreatown", lat: 34.0618, lng: -118.3 },
  { id: "culver-city", name: "Culver City", lat: 34.0211, lng: -118.3965 },
  { id: "santa-monica", name: "Santa Monica", lat: 34.0148, lng: -118.4959 },
  { id: "venice", name: "Venice", lat: 33.9916, lng: -118.4695 },
  ...countyOrigins,
];
export function validCoordinates(point) {
  return (
    point &&
    Number.isFinite(point.lat) &&
    Number.isFinite(point.lng) &&
    Math.abs(point.lat) <= 90 &&
    Math.abs(point.lng) <= 180
  );
}
export function distanceMiles(from, to) {
  if (!validCoordinates(from) || !validCoordinates(to)) return null;
  return (
    new LatLon(from.lat, from.lng).distanceTo(new LatLon(to.lat, to.lng)) /
    1609.344
  );
}

export function coverageEligibility(record) {
  const reject = (reason) => ({ included: false, reason, basis: null });
  if (!validCoordinates(record.coordinates))
    return reject("Location needs verification");
  if (!Object.hasOwn(record, "county")) {
    return distanceMiles(coverageCenter, record.coordinates) <= 25
      ? { included: true, reason: null, basis: "legacy-dtla-radius" }
      : reject("Outside legacy 25-mile coverage");
  }
  const county = record.county;
  if (!["06037", "06059"].includes(county?.geoid))
    return reject("County is unverified or outside LA/Orange County coverage");
  const source = record.sources?.find(
    (source) => source.id === county.sourceId,
  );
  let governmentUrl = false;
  try {
    const url = new URL(source?.url);
    governmentUrl = url.protocol === "https:" && url.hostname.endsWith(".gov");
  } catch {}
  const reviewed =
    typeof county.reviewedOn === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(county.reviewedOn) &&
    Number.isFinite(Date.parse(county.reviewedOn)) &&
    new Date(county.reviewedOn).toISOString().slice(0, 10) ===
      county.reviewedOn;
  if (
    !governmentUrl ||
    county.status !== "primary" ||
    !reviewed ||
    source?.type !== "primary" ||
    source.publisherRole !== "government" ||
    source.reviewedOn !== county.reviewedOn ||
    source.geography?.countyGeoid !== county.geoid ||
    source.geography?.queryAddress !== record.address ||
    source.geography?.lat !== record.coordinates.lat ||
    source.geography?.lng !== record.coordinates.lng ||
    record.coordinates.sourceUrl !== source.url
  )
    return reject("County/location government evidence needs verification");
  return { included: true, reason: null, basis: "reviewed-county" };
}
