# Happy Hour Finder: Neighborhood Guide

## Approved Direction

The user approved the clickable neighborhood-guide mockup on October 19, 2026 and asked to implement it. They also specified that alternatives should appear automatically when no exact matches exist.

Reference: `.superpowers/brainstorm/82670-1792431993/content/neighborhood-guide-v1.html`. This is a design reference, not production search logic.

## Intent

Make choosing an LA happy hour feel like browsing a thoughtful local dining guide rather than an operational dashboard. The place and advertised deal lead; numerical scoring and detailed provenance remain available without dominating the page.

## Presentation

- Warm white and near-black, cherry-red actions, selective citrus-yellow accents. Retain an accessible dark theme.
- Bold condensed masthead/display headings; readable body text and contrasting restaurant-name typography. Font fallbacks must remain usable if remote fonts fail.
- A compact horizontal desktop search strip and a two-column mobile form, not a persistent sidebar. Keep one location selector, Search near.
- Keep food and drink inputs visible; preserve automatic must-have selection, its explicit opt-out, flexible budget, radius, seven weekdays, arbitrary valid time, quick plans, atmosphere, and seating restrictions.
- Three-column desktop venue grid, reducing to two and then one column. Cards are unframed listings with clear dividers, not nested floating panels.
- Use actual restaurant photographs with source attribution where available. Never use another restaurant's photo or fabricate missing imagery. Unphotographed venues get an intentional typographic treatment; missing/blocked images must fall back cleanly.
- Venue name, neighborhood/distance, applicable happy-hour window, and actual itemized combo or restaurant-listed specials are primary. Match percentages move into expandable details.
- Rename the three-spot persistent shortlist Tonight's contenders. Provide a compact saved-spots tray linking to the full comparison, retaining removal and clearing actions.
- Preserve source links, review dates, unknown prices, discount-only wording, timing/seating restrictions, and separate guide-only labels.

## Automatic Alternatives

When a valid search has zero exact matches and alternatives exist, open Other spots to consider automatically beneath the no-match message. Each alternative must display its actual failure reasons. Never silently change the request or imply an inactive happy hour is active. When exact matches exist, alternatives remain available separately. Sorting and saving must not unexpectedly close the no-match alternatives or reset a user's manual open/close choice during the same search.

## Constraints And Non-Goals

Keep the existing vanilla HTML/CSS/JavaScript app, vendored Lucide icons, deterministic matching engine, 100-record researched dataset, frozen baseline, and evaluation criteria. This is a presentation/workflow change, not a new recommendation model or data expansion. The mockup's three sample records and simplified filtering must not enter production. Do not claim all 100 venues have verified photos, prices, or current live availability.

## Acceptance

Preserve the 45 existing unit tests and original browser workflows. Add explicit no-match automatic-alternatives and media-fallback coverage. Verify all sort modes, preferences, shortlist persistence and cap, sources, themes, valid/invalid form states, and responsive geometry at 320, 390, 736, 1060, 1280, and 1440 pixels. Re-run the fixed and held-out evaluations without changing their gold data. Inspect screenshots, run live acceptance after deployment, and report any remaining coverage limitations.

## Builder Choices

Implementation details, breakpoints, exact spacing, and code organization are delegated to the implementer. Preserve stable DOM IDs used by current tests where practical. Curate images in a small display-only media manifest with explicit source URLs; this must not change source confidence or ranking. Keep forms and search results usable when external photos/fonts cannot load.
