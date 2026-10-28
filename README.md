# Happy Hour Finder

## Published-specials audit

The October 26 audit accounts for all 111 existing locations and expands 49 saved menus. There are 969 recorded item choices (previously 166), plus descriptive discounts, bundles and daily offers. Menus display coverage status, audit date, source links and unresolved gaps; itemized entries no longer hide general specials. Two menus have complete published-specials reviews, 63 remain partial and 46 need verification. These are source-review outcomes, not live restaurant confirmation. Blocked-source samples retain their original evidence dates; unknown prices remain unknown.

See [the per-location report](research/menu-audit-report.md) and [research notes](research/menu-audit-notes.md). Edit original research or countywide staging inputs, then regenerate accepted countywide output when applicable, run `npm run data:build`, `npm run data:validate`, and `node scripts/report-menu-audit.mjs`. `research/menu-audit.json` is the coverage ledger; `research/menu-audit-baseline.json` fixes the 111-location audit scope. The ledger is applied after both research sources are combined. No opening-card crawl or automatic paid lookup is introduced.

## Local Squeeze interface

The current discovery page uses the approved butter-yellow and paprika design with locally bundled DM Serif Display and DM Sans fonts (licenses in `src/fonts/`). Compact restaurant summaries expand into full menus for item selection and subtotals. Additional discoveries appear in the More places to explore section on Explore, with a prominent counted link above the researched results. Each extra place retains its Needs verification status, source links, community evidence, and owner review. Source confidence and offer restrictions are preserved; existing operator photography is used only for the matching venue.

Run `PREVIEW_URL=http://127.0.0.1:4176 node tests/local-squeeze-browser.cjs` against the running app for the menu, review separation, keyboard, font-loading, and four-width layout checks. The existing discovery, review, and explicit-menu browser checks cover the other flows.

## Local filters and optional AI

The integrated release also preserves Morning/Afternoon/Night and exact-time controls, manual day/time overrides, saved discovery reuse, and the public menu-link importer. Imported sources use the server’s bounded, public-DNS-pinned HTTPS reader; imported places stay provisional until owner review.

Browse all **111 researched restaurants** with independent city/neighborhood, Food, Drinks, budget target, weekday, and exact-time filters. Food and drink suggestions are built from the menu names and tags of the researched list plus owner-approved records. Equivalent singular/plural terms group; suggestion labels show unique researched-place counts under the other filters. Menu entries with unsupported or inactive schedules may show zero supported matches. Every recorded menu item remains searchable; pending-only vocabulary enters suggestions only after approval. Counts and matching run locally, without AI calls.

The first six researched cards are shown with Show more for the rest. Optional **Use as filters** sends one interpretation request to Gemini and synchronizes the visible controls. **Find more places online** explicitly sends current criteria to web discovery (Tavily plus Gemini); **Find more menu items** explicitly requests a targeted lookup. Initial browsing, local filtering, paging, and viewing saved extra places do not trigger those calls. Cached source research remains separate from provisional web discoveries. Owners review menu snapshots before publication; unknown prices and pending schedules remain unconfirmed.

Run `PREVIEW_URL=http://127.0.0.1:4176 node tests/filters-browser.cjs` for the side-effect, dynamic-vocabulary, stale-request, pagination, and responsive checks.

Run `npm ci` and `npm start` (Node 22+), then open <http://127.0.0.1:4176>. Browsing works without a key. Genuine AI needs a private server-side `GEMINI_API_KEY`; web discovery also needs `TAVILY_API_KEY` and review storage needs the Supabase settings in [deployment.md](docs/deployment.md); without it the helper states that AI is unavailable. The public build is live at <https://knmarquez25.github.io/happy-hour-finder-v1/>, using a Render Free backend and Gemini 3.5 Flash-Lite. Three live smoke cases passed in a fresh unauthenticated Chrome session; this small check is not general model accuracy.

See [setup and recommended Render hosting](docs/deployment.md) and [new evaluation scope](docs/ai-discovery-evaluation.md). Run `npm test` and, with the server running and Chrome installed, `npm run test:discovery-browser`.

The previous interface is preserved at `legacy.html`. The following sections document its prior behavior and historical evaluations.

A static, source-aware happy-hour finder for Los Angeles County and Orange County, with incomplete coverage. The approved Focused list design supports flexible budget targets, supported itemized subtotals before tax/tip/fees, real origin-based straight-line distance, food/drink must-haves, source details, sorting, a browser-local three-spot shortlist, and mobile/dark layouts.

## Run

Use Node.js 22+ and Python 3. `npm ci`, then `npm run dev`; open http://127.0.0.1:4174. If occupied, use `python3 -m http.server 4175 --bind 127.0.0.1` and set `PREVIEW_URL` when running browser tests.

The browser app has no backend, API key, runtime LLM, CDN dependency, or live crawler. GitHub Pages can serve the repository as-is. Lucide and the geodesy utility are vendored with licenses; regenerate them with `npm run vendor` after deliberately updating locked dependencies.

## Data And Trust

`research/{dtla,west,north,central}.json` preserve the original 100 distinct researched locations. The first local countywide batch adds 11 locations (5 LA County, 6 Orange County), for 111 total. Records retain primary/secondary/conflicting/unknown evidence; not every restaurant has complete prices or usable hours. Review dates are not publisher-update dates or in-person confirmation.

Countywide additions come from accepted records under `research/countywide/`, with current official happy-hour evidence and US Census address/county/coordinate provenance. The original unannotated records retain the legacy DTLA radius rule; new imports require reviewed county evidence for LA County (06037) or Orange County (06059). The nearby-search radius still caps travel at 25 straight-line miles from the selected origin. New regional origins are documented reference points, not device GPS or civic centroids. Coverage remains incomplete. UI coverage wording distinguishes the two-county research area from the nearby-search radius.

Run `node research/countywide/tools/export.mjs research/countywide --output research/countywide/accepted.json` before `npm run data:build`; the build rejects a stale accepted export or unsupported county evidence. Do not hand-edit accepted output or `src/data.js`. `node --test research/countywide/tests/*.test.mjs` runs the separate staging/export tests. See `research/countywide/integration-report.md` for the added branches and pending cases.

`scripts/collect-sources.mjs URL` checks robots/access policy, rate-limits and caches public HTML; it never auto-promotes collected facts to verified status. Non-HTML or blocked sources require authorized manual review. `scripts/migrate-dtla.mjs` preserves legacy estimates as unverified and applies reviewed overrides. `scripts/geocode.mjs` submits public venue addresses to the documented US Census geocoder, caches exact matches, and leaves uncertain matches unresolved. `coordinate-approvals.json` records manually checked non-exact matches. Distances use address-range interpolations, not driving routes or user GPS.

Run `npm run data:build` after reviewing source records/coordinate approvals, then `npm run data:validate`. The build generates browser-ready `src/data.js`; do not hand-edit it. `record-adjustments.json` encodes reviewed applicability corrections without losing source notes. Primary prices must be exact positive integer cents; missing prices are null. No ratings, prices, weekdays, or coordinates are invented to fill gaps.

The new engine is `src/matching.js`. The original `src/scoring.js` and `src/presets.js` are retained for history but are not used by the new UI. Neighborhood origins are documented area reference points, not automatically geocoded arbitrary addresses. Budgets never exclude venues; timing, distance, explicit neighborhood and selected must-haves are required. Seating-restricted and unresolved offers stay separate unless the modeled seating opt-in applies. No allergy safety guarantees are made.

## Verify And Evaluate

- `npm test`: historical baseline tests plus new matching/schema/UI-state/evaluation tests.
- `npm run test:browser`: with the local preview and installed Google Chrome; verifies real flows and desktop/mobile layouts. Set `PREVIEW_URL` for another port and `PLAYWRIGHT_MODULE` only to use an alternate installed Playwright package.
- `npm run evaluate`: unchanged 15-case benchmark, frozen original modules vs current app.
- `npm run evaluate:holdout`: five held-out cases; do not use these for ranking tuning.
- `node scripts/write-report.mjs`: regenerate the evaluation document after measured outputs.

Original modules are frozen under `evaluation/baseline/` at SHA `865f3c9b4a1ce436d56eb0ab9afbb55938c44fc8`. Cases were defined before expanded-data results. Gold labels were source-reviewed independently from ranking outputs; sources, assumptions, unknowns and witness prices are documented in `evaluation/gold-notes.md`. Scores are small-sample source-evidenced search success, not restaurant accuracy, AI-model accuracy or user satisfaction. Bundled changes are not assigned independent causal effects.

See the [evaluation report](docs/evaluation-report.md). Source research and development were AI-assisted; runtime recommendations are deterministic. [GitHub Pages app](https://knmarquez25.github.io/happy-hour-finder-v1/).
