# Research Contract

Write a JSON array of real distinct restaurant locations in your assigned geographic area. Do not edit app code or other research files. Date of review is 2026-10-19. Use available web tools to inspect actual sources, favor branch-specific restaurant pages; guide-only evidence is explicitly secondary. Facts unavailable from inspected sources stay null/empty. Do not invent hours, prices, addresses, coordinates, ratings, or review status. Avoid copying menu prose.

Each record:

```json
{
  "id": "unique-lowercase-venue-branch",
  "name": "Venue name",
  "neighborhood": "Area name",
  "address": "Full street address, city, CA ZIP",
  "coordinates": null,
  "hours": [{"days": ["Monday", "Tuesday"], "start": "15:00", "end": "18:00", "sourceId": "official", "status": "primary", "restriction": "none"}],
  "menu": [{"id": "food-1", "name": "Taco", "kind": "food", "priceCents": 600, "tags": ["tacos"], "sourceId": "official", "status": "primary"}],
  "foodTags": ["tacos"],
  "drinkTags": ["margarita"],
  "atmosphereTags": [],
  "sources": [{"id": "official", "url": "https://restaurant.example/happy-hour", "type": "primary", "accessedOn": "2026-10-19", "reviewedOn": "2026-10-19", "note": "Concise factual evidence, restrictions, missing information."}],
  "notes": "Conflicts or conditions; no unverifiable claims."
}
```

`status`: primary, secondary, conflicting, or unknown. Only use primary if directly inspected official branch-specific evidence supports this field. A search snippet alone is secondary with an explicit snippet note. If a source is blocked, don't mark it reviewed; reviewedOn is null. Hours use full weekdays, 24-hour HH:MM, end exclusive. Overnight allowed if documented. Unknown days means hours=[]; do not assume daily. `restriction`: none, bar-only, or conditional. Prices must be exact published per-item amounts in cents; percentage discounts or ranges without a specific supported price are null. Include one drink and food where available, but missing food or drink is okay and must not be invented. `kind` is food or drink. All menu items are confirmed happy-hour items, never a regular menu silently reused. For known restrictions put item/window-specific applicability in notes. Coordinates optional only when source supplies an actual position; parent will geocode addresses and check 25-mile radius. If supplied use {"lat":34.0,"lng":-118.0,"sourceUrl":"...","precision":"address"}.

Optional `specials` records contain `{text, status, sourceId}`. These are display-only summaries of published happy-hour discounts, not final item prices. The source must support the stated branch/offer; preserve timing and seating conditions. `research/record-adjustments.json` may supply reviewed summaries during the build. The renderer distinguishes restaurant-listed from guide-listed evidence and never converts a percentage or dollar-off amount into a combo subtotal.

Conclude with source coverage and limitations. Aim 24 high-quality unique records; report a shortfall rather than padding. Use apply_patch for manual file changes.
