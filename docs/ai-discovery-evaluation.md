# AI menu discovery evaluation

Evaluation date: October 25, 2026. Source snapshot remains October 19, 2026; rebuilding or testing does not renew restaurant evidence.

## What changed

The prior entry screen immediately required plans and showed time/location-qualified matches. The new screen opens all 111 researched records, accepts optional natural-language criteria through one helper, and keeps suggestions, menu browsing, source details, and custom selections in one list. Exact prices stay in integer cents. Budget is a preference rather than an exclusion.

## Verification performed

Final verification: **78/78 unit and HTTP tests passed**, the new discovery browser regression passed at four viewport widths, and the retained previous interface passed its full existing browser regression at six viewport widths. Of the 78 tests, 25 were added in this iteration (14 discovery/menu, five AI-boundary, six HTTP tests). A separate browser test verifies real CORS/preflight between frontend and backend ports using a Gemini response fixture. Three live smoke requests were subsequently run from the public GitHub Pages app, separately from those fixture-based tests.

- Discovery tests cover all 111 records on entry, area/menu narrowing, flexible budgets, no invented day/time defaults, overnight windows, rejected unsupported model fields, unknown prices, conflicting evidence, incompatible windows, and conditional pairings.
- AI transport tests use documented structured-output response fixtures: valid extraction, missing key, blank/oversized query, refusal, incomplete output, malformed JSON, missing fields, unexpected fields, and safe provider-error messages. This verifies application behavior, not whether the model interprets real requests accurately.
- HTTP tests exercise actual local requests: public browsing, safe configuration status, blocked private paths, origin checks, invalid/oversized bodies, and rate limits.
- Browser regression exercises initial dataset visibility, no dropdowns or second AI list, a real menu subtotal, structured-output fixture narrowing, Clear, preserved results on failure/clarification, stale-request cancellation, and overflow at 1280, 736, 390, and 320 pixels. Review the recorded command outputs before treating a check as passing; final counts are recorded in the implementation ledger.

## Historical comparison rerun

The frozen legacy benchmark was rerun without changing the matching engine or answer key:

| Historical engine measure | Original V1 | Prior improved engine |
| ------------------------- | ----------: | --------------------: |
| Fixed development set     |        1/15 |                 12/15 |
| Positive cases            |        0/11 |                  8/11 |
| Negative controls         |         1/4 |                   4/4 |
| Held-out set              |         0/5 |                   4/5 |

These are the existing engine's small source-evidenced benchmark results. They are **not** evaluation scores for the new AI parser or browser UI. The new optional-criteria discovery module has different behavior and was assessed by the new tests above. Dataset growth and bundled earlier improvements do not establish independent causal effects.

## Challenge case

A user’s martini search exposed a display issue: both IKI locations matched their listed $10 IKI Martini, but the card hid that fourth menu item behind the first three generic highlights. The menu now shows every recorded item directly on the card, prioritizes eligible requested items, and labels them “Matches your request.” Two unit regressions and browser assertions cover all three martini results, prices at both IKI locations, avoiding match labels for unsupported or inactive items, every venue’s complete recorded item count, and selection without opening a hidden menu. The AI helper now states visibly that it searches the researched list rather than finding new restaurants online.

Ocean Prime's Friday oyster price is conditional on the documented Veuve Clicquot Rosé glass. A tempting subtotal would select the cheap oyster without the required drink, or mix it with a different offer window. The app preserves pairing restrictions, avoids treating an oyster-only selection as a supported order, and identifies selections not confirmed together. Generic conditional windows are excluded from positive timing/menu matches and compatibility claims, so a drinks-only late window cannot establish a burger match after a kitchen closes. An unknown or conflicting price must not become $0 or a claim that an order fits a budget.

## What remains unmeasured

The user privately configured a Gemini key in Render. A fresh unauthenticated Chrome context tested three real requests through GitHub Pages with Gemini 3.5 Flash-Lite. All three passed their predeclared expectations: tacos/margaritas/$25 returned Coyote Grill and Prospect Gourmand; Pasadena returned nine researched records; “near me” requested an area without hiding the 111 browsable records. Selecting the Coyote taco and margarita produced $14.75. Measured warm response times were 1,236 ms, 810 ms, and 944 ms. Raw inputs, expected/returned fields, and result IDs are in `evaluation/live-smoke.json`. These three cases are a smoke check, not a general extraction-quality estimate. Token usage/cost, broad refusal behavior, and model resistance to prompt injection remain unmeasured. A validator rejects unsupported response shapes, but an in-schema omission could still change the meaning of a request. The visible interpretation lets the user inspect and correct it; it is not proof of correctness.

The public Pages + Render connection passed the fresh-session acceptance check. No real user task study, current restaurant confirmation, or exhaustive regional coverage audit has occurred. That initial acceptance check covered only the preference parser; the later new-place workflow is assessed separately below.

The per-address, hourly global, and concurrent-call caps all have passing HTTP regressions. Operational behavior on public hosting remains to be verified.

## Next evaluation

Extend the three-case smoke set with a versioned live-model evaluation containing: area-only, craving-only, budget-only, combined criteria, ambiguous time, unsupported city, `near me` without location, an explicit exclusion such as `no beer`, a strict total-spend limit including tax/tip, conflicting requests, and prompt-injection attempts. Independently label intended fields before seeing responses. Report exact field agreement, dropped constraints, unsupported-claim count, abstentions, model version, latency, and cost. Never count an empty or missing constraint as correct just because it produces plausible restaurants.

Then observe several classmates browsing and choosing a place. Measure time to a choice, source visits needed, incorrect assumptions, and whether the shown menu/price helped them decide. Keep those usability observations separate from automated checks.

## New-place review workflow verification (October 26, 2026)

103 unit/HTTP tests passed after adding search provenance, review storage/Auth, approval snapshots and endpoint coverage. The review browser fixture passed candidate discovery with unknown price, append-only evidence, owner login/edit/approval, approved-item reload and 390/320 pixel layouts. The existing discovery browser suite also passed. Independent review found and corrected county metadata loss, missing name-based combo tags, and approved publications being displaced by pending queue growth. Live discovery, durable pending storage and owner login were subsequently verified as described below. Fixture checks are not an estimate of search quality.

Live infrastructure verification: the public review queue returned 200; unsigned owner access returned 401; direct anonymous Supabase table access returned 401/42501; the user successfully signed into the live owner review interface. Tavily’s dashboard showed Researcher Free, pay-as-you-go Off, and requests stop at plan limit. First broad martini discovery attempts exposed slow extraction and an overstrict requirement that venue identity/location appear inside the same quoted menu paragraph. The corrected validator permits identity in other fragments of the same cited page and retains exact HH/item excerpt checks. These are integration findings, not user-study results.

## Recorded public discovery outcome

See `evaluation/live-discovery.json`. The final broad “martinis” request checked eight sources, proposed three candidates and accepted one after evidence checks. A Los Angeles martini request checked eight sources, proposed five candidates and accepted four after excluding one existing venue. The persistent queue contains Fiesta Cantina, Birds Hollywood, Queen’s Raw Bar and Esters, with all prices needing confirmation. A fresh page load restored the pending records, and the authenticated owner queue loaded all four. No real approval was performed on the user's behalf: publication requires their menu judgment. The source-ownership preference in the second request was not satisfied (guide links were returned), so it is not scored as exact constraint success.

Challenge: current primary-source checks of Esters redirected to a landing page, and indexed official pages reported closure. An older guide’s happy-hour entry remains discoverable. The candidate stays unapproved. This is a deliberate separation of discovery from verified recommendation, and a reason to add explicit closure/freshness checks next.

The final version selects source/fragment references and copies actual text/URLs rather than trusting model-typed quotes. It validates an item's presence in the retained fragment and ties numeric prices directly to that item; otherwise price is unknown. Requests can still time out or omit valid sources. No live accuracy percentage is inferred from these two requests.

## Automatic menu persistence correction (October 26)

A live reload reproduced the user's report: expanded menus were stored only in page memory and a one-hour server cache, behind a manual button. The fix automatically looks up visible pending cards and stores each menu preview separately from the original discovery in Supabase. A 24-hour timestamp avoids a new provider request on every visit; failures retain the original items and a retry path. New discoveries do not mark this targeted lookup complete prematurely. Tests cover persistence through an application restart, page refresh without another provider call, exact restaurant identity, stale/invalid timestamps, and owner-sign-in race preservation. Full suite: 113 unit/HTTP tests passing; review browser and automatic-menu race browser passing after the fix. Live acceptance is recorded separately after deployment.

Previously captured venue-specific menu evidence is also available to the targeted extractor when a fresh web search misses the menu. Such items stay labeled as previously captured, potentially incomplete or outdated, and unverified. Empty lookups expire after five minutes rather than blocking another attempt for a day.

Captured menu evidence can also be extracted when fresh web search times out or reaches its free limit. This uses the existing Gemini extractor and does not add a paid search fallback.

## Downey geography regression (October26)

The AI area enum was derived only from existing restaurant locations and legacy reference points, so Downey was treated as unsupported despite being within LA County. The search index now includes all incorporated cities from the official [LA County directory](https://lacounty.gov/newsroom/public-information/la-county-cities/) and [Orange County directory](https://www.ocgov.com/about-county/info-oc/oc-links/orange-county-links/orange-county-cities), separate from restaurant coverage. Existing exact-location and weekday/time checks remain unchanged. Tests accept Downey with zero saved venues, preserve Monday12:00, reject other days/times in a sourced-menu fixture, and continue rejecting unsupported cities. The Downey browser regression verifies an honest empty result, no false geographic error or location broadening, and Browse all restores111. Full suite116/116 passed; this is not a claim that a noon Monday happy hour has been verified in Downey.
