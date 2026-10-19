# Happy Hour Finder Evaluation

Evaluated 2026-10-19. Original revision: `865f3c9b4a1ce436d56eb0ab9afbb55938c44fc8`. This measures a small source-evidenced search benchmark, not citywide accuracy, model accuracy, or user satisfaction.

## Results

| Measure | Original version | Improved version |
| --- | --- | --- |
| Fixed 15-case benchmark | 1/15 (6.7%) | 12/15 (80.0%) |
| Positive search success | 0/11 | 8/11 |
| Correct negative controls | 1/4 | 4/4 |
| Held-out 5-case benchmark | 0/5 (0.0%) | 4/5 (80.0%) |

Independent required-constraint evidence audit: baseline 42/42 returned top-three options fail or lack proof of required eligibility; improved 0/24. This combines disproven and unproven eligibility; it does not claim every excluded real-world offer is false. Unknown prices are tracked separately and are not budget violations.

The app now contains 100 researched physical locations, 100 checked locations within the DTLA 25-mile radius, 73 records with at least one restaurant-supported schedule, and 38 records containing exact restaurant-source food and drink prices. These last records are not necessarily unrestricted or available for every search.

## Method

Fifteen cases and five held-out cases were defined before the regional research outputs. The baseline modules were frozen byte-for-byte from the original Git revision. The original adapter preserves its original ranking and neighborhood behavior, including the fact that free-text starting location did not recalculate distances. No new filters were backported.

An independent research pass labeled acceptable venue IDs without reading the new matching/UI code or ranking outputs. Key source pages were reopened and exact witness prices were documented in [gold notes](../evaluation/gold-notes.md). This was an AI-assisted review, not an independent human panel.

A positive case passes only when at least one of the actual top three primary results is in the source-reviewed acceptable set and its displayed subtotal is within target + $5. Cheaper options have no lower bound. The original displayed estimates are checked as estimates; the improved version requires an itemized supported total. This $5 band is the evaluation's modest-overage relevance label, NOT a live-app exclusion. The app still shows more expensive options with a lower budget relevance contribution and explicit overage.

A negative case passes only when no primary results are returned. Alternatives do not count as qualifying results. Empty positive results fail, even when the reviewed dataset has no acceptable option. Negative cases test dawn, nonexistent must-have items, and an unknown explicit neighborhood.

This intentionally tests new surrounding-area coverage and cases the original app did not handle. Its low baseline is not evidence that every original DTLA recommendation was bad. Relevance here is constraint/cost suitability; soft cuisine or vibe preference satisfaction is not a separate gold metric.

The five held-out outputs were first scored after the main implementation. They were not used to choose venues or tune ranking. Later engineering fixes require rerunning all results and preserving the same cases, not tuning to the holdout.

## Source Audit

The fixed panel is the first ten original records, selected by original order. Direct restaurant evidence establishes current corrections for two (Joyce and Perch); the other eight remain primary-evidence gaps. Unknown is neither correct nor false. Therefore no unsupported source-accuracy percentage is reported. See the panel and evidence in [gold notes](../evaluation/gold-notes.md).

Joyce's operator menu lists different prices and bar/patio restrictions from the original guide. Perch's operator lists a narrower weekday window than the old seed data; its own Friday start differs across page sections, so only the mutually supported interval qualifies. These are source-document comparisons, not telephone confirmation.

## Remaining Failures

Development: DTLA weekend happy hour; Glendale weekday; Burbank weekday. Holdout: a DTLA search at the 6 PM boundary. These are positive-search evidence gaps, not claims that those areas have no real happy hours. Some have restaurant-supported schedules but no exact food-and-drink total; others have unresolved hours or seating restrictions. They remain failures instead of being removed from the denominator.

## Attribution And Limits

Coverage, pricing, source validation, distances, and matching changed together. Only baseline and final are scored: the original scorer requires comparable reputation and per-person-estimate inputs which the new source records do not legitimately supply. Artificial ratings or invented estimates would make intermediate scores misleading. No claim is made about which single component caused the total gain.

The sample is small and geographically convenient. Exact prices may come from older still-linked PDFs; review date is not publisher update date. Menu availability, holidays, private events, service charges, and seating can differ in person. Coordinates are often street-range interpolations, and distances are from selected area reference points, not user GPS or road routes. Must-have tags are not allergy guarantees.

## Reproduce

Run `npm ci`, `npm test`, `npm run data:validate`, `npm run evaluate`, and `npm run evaluate:holdout`. Raw outputs, per-case returned IDs, source notes, and file hashes are in `evaluation/results.json` and `evaluation/holdout-results.json`. Run `npm run dev` then `npm run test:browser` for browser checks with installed Google Chrome.

## Next Iteration

Prioritize current primary menus for DTLA weekends, Glendale, Burbank, and after-6-PM DTLA; add representative real user tasks and human usefulness ratings. Add new cases as a separately versioned challenge set while retaining the original benchmark for comparison. No recurring collection or live-search guarantee is currently implemented.
