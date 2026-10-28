import { countyCities } from "./search-areas.js";

const normalize = (value) =>
  String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
const canonical = (value) => {
  const text = normalize(value);
  if (["dtla", "downtown los angeles"].includes(text)) return "downtown la";
  if (text === "los angeles county") return "la county";
  return text;
};

// Compare whole geographic components, never substrings such as Hollywood in
// West Hollywood. A known city can supply a missing county for filtering only.
export function candidateAreaMatches(candidate, area) {
  if (!area) return true;
  const wanted = canonical(area);
  const county = canonical(candidate.county);
  const locations = [candidate.location, candidate.address].flatMap((value) =>
    String(value || "")
      .split(",")
      .map((part) =>
        canonical(
          part.replace(/\s+(?:CA|California)(?:\s+\d{5}(?:-\d{4})?)?$/i, ""),
        ),
      ),
  );
  if (["la county", "orange county"].includes(wanted)) {
    if (county) return county === wanted;
    const cities =
      countyCities[wanted === "la county" ? "LA County" : "Orange County"];
    return cities.some((city) => locations.includes(canonical(city)));
  }
  if (
    wanted === "downtown la" &&
    locations.includes("downtown") &&
    (county === "la county" || locations.includes("los angeles"))
  )
    return true;
  return locations.includes(wanted);
}
