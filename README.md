# Happy Hour Finder

A static, source-aware happy-hour finder for DTLA and surrounding areas. The approved Focused list design supports flexible budget targets, supported itemized subtotals before tax/tip/fees, real origin-based straight-line distance, food/drink must-haves, source details, sorting, a browser-local three-spot shortlist, and mobile/dark layouts.

## Run

Use Node.js 22+ and Python 3. `npm ci`, then `npm run dev`; open http://127.0.0.1:4174. If occupied, use `python3 -m http.server 4175 --bind 127.0.0.1` and set `PREVIEW_URL` when running browser tests.

The browser app has no backend, API key, runtime LLM, CDN dependency, or live crawler. GitHub Pages can serve the repository as-is. Lucide and the geodesy utility are vendored with licenses; regenerate them with `npm run vendor` after deliberately updating locked dependencies.

## Data And Trust

`research/{dtla,west,north,central}.json` contain 100 distinct researched locations, with primary/secondary/conflicting/unknown evidence. `research/*-notes.md` document source provenance and limitations. Not every restaurant has complete prices or usable hours. Review dates are not publisher-update dates or in-person confirmation.

`scripts/collect-sources.mjs URL` checks robots/access policy, rate-limits and caches public HTML; it never auto-promotes collected facts to verified status. Non-HTML or blocked sources require authorized manual review. `scripts/migrate-dtla.mjs` preserves legacy estimates as unverified and applies reviewed overrides. `scripts/geocode.mjs` submits public venue addresses to the documented US Census geocoder, caches exact matches, and leaves uncertain matches unresolved. `coordinate-approvals.json` records manually checked non-exact matches. Distances use address-range interpolations, not driving routes or user GPS.

Run `npm run data:build` after reviewing source records/coordinate approvals, then `npm run data:validate`. The build generates browser-ready `src/data.js`; do not hand-edit it. `record-adjustments.json` encodes reviewed applicability corrections without losing source notes. Primary prices must be exact positive integer cents; missing prices are null. No ratings, prices, weekdays, or coordinates are invented to fill gaps.

The new engine is `src/matching.js`. The original `src/scoring.js` and `src/presets.js` are retained for history but are not used by the new UI. Neighborhood origins are documented area reference points, not automatically geocoded arbitrary addresses. Budgets never exclude venues; timing, distance, explicit neighborhood and selected must-haves are required. Seating-restricted and unresolved offers stay separate unless the modeled seating opt-in applies. No allergy safety guarantees are made.

## Verify And Evaluate

- `npm test`: historical baseline tests plus new matching/schema/UI-state/evaluation tests.
- `npm run test:browser`: with the local preview and installed Google Chrome; verifies real flows and desktop/mobile layouts. Set `PREVIEW_URL` for another port and `PLAYWRIGHT_MODULE` only to use an alternate installed Playwright package.
- `npm run evaluate`: unchanged 15-case benchmark, frozen original modules vs current app.
- `npm run evaluate:holdout`: five held-out cases; do not use these for ranking tuning.
- `node scripts/write-report.mjs`: regenerate evaluation and class-post documents after measured outputs.

Original modules are frozen under `evaluation/baseline/` at SHA `865f3c9b4a1ce436d56eb0ab9afbb55938c44fc8`. Cases were defined before expanded-data results. Gold labels were source-reviewed independently from ranking outputs; sources, assumptions, unknowns and witness prices are documented in `evaluation/gold-notes.md`. Scores are small-sample source-evidenced search success, not restaurant accuracy, AI-model accuracy or user satisfaction. Bundled changes are not assigned independent causal effects.

See [evaluation report](docs/evaluation-report.md) and [six-step class post](docs/class-post.md). Source research and development were AI-assisted; runtime recommendations are deterministic. [GitHub Pages app](https://knmarquez25.github.io/happy-hour-finder-v1/).

