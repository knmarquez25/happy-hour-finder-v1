# QA And Code Review

Reviewed October 19, 2026. Browser: installed Google Chrome via Playwright.

## Coverage

- 42 unit/regression tests: source validation, timing boundaries, overnight schedules, exact menu arithmetic, flexible budgets, required preferences, evidence, geodesic distance, escaping, sorting, and shortlist state.
- Existing browser suite: custom inputs, budgets, sorting, sources, shortlist persistence and cap, empty results, theme, corrupt storage, and five viewport widths.
- Expanded browser matrix (`npm run test:qa`): 126 scenario checks spanning seven weekdays, four times, four sorting modes, six budgets ($1-$500), custom edits after every preset, injection escaping, pagination, visible control labels, and five viewport widths (320-1440 pixels).
- Browser checks assert no JavaScript exceptions or failed same-origin assets. Layout checks detect horizontal document overflow; screenshots support manual review.
- All 100 dataset records pass validation. Production dependency audit reported no known vulnerabilities.

## Findings Fixed

1. Budget slider and numeric input accepted different ranges. Both now support $1-$500, with browser regression coverage.
2. Blank preference text bypassed category must-haves. Required food/drink now require supported menu availability even without a specific dish/drink preference.
3. Day-limited menu items were lost after midnight in an overnight offer. Item availability now follows the active window's starting weekday.
4. Individually available food and drinks could qualify despite incompatible pairing restrictions. Required combinations now need a common supported window and compatible pairing; unknown prices remain unknown rather than excluding otherwise compatible offers.
5. A visible tooltip retained its desktop position after viewport resize, creating horizontal overflow. Resize now dismisses the tooltip.

Each issue was reproduced by a failing automated check before its fix.

## Evaluation And Limits

The fixed assignment benchmark remains 12/15 and the held-out set 4/5. These are small source-reviewed suitability benchmarks, not overall restaurant accuracy or user satisfaction.

Passing software checks does not establish current restaurant availability, live prices, complete citywide coverage, or an accessibility certification. Manual screen-reader testing and Safari/Firefox testing remain follow-ups. Missing source evidence remains visible rather than being filled in to increase coverage.

Tests can target the published site using `PREVIEW_URL=https://knmarquez25.github.io/happy-hour-finder-v1/ npm run test:browser` and the same prefix with `npm run test:qa`. Deployment completion must be checked separately from a successful GitHub commit.
