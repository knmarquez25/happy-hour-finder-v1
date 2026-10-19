# Happy Hour Finder: Coverage, Costs, and Matching

Date: 2026-10-19
Status: Approved for implementation on 2026-10-19. User selected Focused list, flexible budgets, pre-tax/tip disclosure, and the 100-venue coverage target.

## Intent

Help users choose a genuinely suitable happy hour without comparing many sites themselves. Expand the existing DTLA class project while making prices, schedules, and recommendation tradeoffs defensible. Preserve evidence for the assignment's baseline and improvement comparison.

The user approved the recommended bundle in principle: broader coverage, trustworthy costs, and constraint-aware recommendations, and explicitly increased the coverage target to 100 venues total. The user rejected a strict budget limit and approved subtotals before tax/tip with explicit disclosure. Budget is a preference, not an eligibility cutoff. Other detailed defaults below remain proposed engineering decisions, not previously agreed user preferences.

## Existing System

- Repository: https://github.com/knmarquez25/happy-hour-finder-v1
- Published app: https://knmarquez25.github.io/happy-hour-finder-v1/
- Inspected baseline revision: 865f3c9b4a1ce436d56eb0ab9afbb55938c44fc8.
- Static HTML, CSS, and browser JavaScript modules; no runtime AI model or backend is present in the inspected app.
- 28 DTLA venues, primarily sourced from two public guides. The existing source links do not establish venue-by-venue current verification.
- Weighted ranking makes time, budget, and distance soft preferences. Neighborhood is the only actual eligibility filter.
- Location text changes the heading but not stored venue distances.
- Suggested combos reuse a per-person estimate that is not calculated from the displayed items.
- `happyHourVerified` is true even on some records whose notes describe assumed days or incomplete hours.

## Goals

1. Expand researched coverage to a 25-mile straight-line radius around a documented DTLA center, targeting 100 distinct venue-location records total, including retained and reviewed original venues, not 100 additional venues.
2. Distinguish supported menu subtotals, legacy estimates, and unknown prices.
3. Separate recommendations satisfying required constraints from clearly explained near-matches.
4. Preserve a reproducible baseline, staged results, and a concise six-step assignment report with measured scores.
5. Keep GitHub Pages compatibility and the existing framework-free stack.

## Non-Goals

- No new hosting service, paid API, account system, runtime LLM, live crawler, or scheduled automation.
- No driving-time claims, exhaustive LA coverage, real-time availability, or guarantee that a restaurant will honor a published offer.
- No invented prices, ratings, hours, dietary guarantees, or claims that a source visit proves real-world accuracy.
- No unrelated redesign. Retain the current working form/results layout and visual conventions while adding necessary controls and states.
- Do not deploy, push, or replace the public baseline during implementation without a deliberate release step.

## Coverage and Location

Proposed center: a documented DTLA reference coordinate, latitude 34.0505 and longitude -118.2551. This is an application reference point, not a claim about a civic boundary.

Dataset admission uses distance from this center, with a maximum of 25 miles. User travel filtering is a separate distance from the selected search origin, not a neighborhood name or the dataset center unless DTLA is selected.

Replace the currently decorative free-text location with a supported-origin selector. Include DTLA and researched surrounding-area reference points; use explicit coordinates for each. Venue neighborhoods remain a separate filter. Arbitrary-address geocoding is deferred rather than silently ignored. No device-location permission is needed.

Calculate straight-line distances from coordinates with a tested geodesic library or an existing standard geospatial utility, not hand-entered per-search distances. Clearly label the units and basis. If venue coordinates cannot be reliably established, exclude that venue from distance-qualified recommendations and retain it in the research backlog.

Collection should span DTLA plus multiple surrounding clusters, such as Pasadena, Hollywood/Los Feliz, Glendale/Burbank, Culver City, and the westside, subject to the actual radius check. Do not promise every cluster or retain an out-of-radius venue to meet a count. The 100-venue count is a research target, not permission to invent entries; report any shortfall honestly. Deduplicate by physical venue/branch, not by source listing or menu. Report total researched venues separately from venues that qualify for strict recommendations; do not imply all 100 have fully supported hours and combo prices.

## Collection and Provenance

Use public guides for discovery, then restaurant-owned, location-specific pages and menus as the preferred evidence. A guide may support a record when official details are unavailable, but its status remains secondary-source rather than restaurant-verified.

Use a bounded, offline collection workflow: fetch permitted public HTML or structured data with low request rates and caching, parse with structured parsers, then manually check extracted records. Review applicable access rules before automated collection. Do not bypass access restrictions, authentication, CAPTCHAs, or blocked requests. Use manual review or another authorized source when collection is unavailable. Never put a crawler in the visitor's browser.

For each venue record store:

- Stable ID, name, branch/location identity, neighborhood, address, and coordinates with coordinate provenance.
- Happy-hour windows with explicit weekdays, start/end, America/Los_Angeles wall-clock convention, and applicable restrictions such as bar-only seating.
- Structured food/drink items with integer cents, quantity/unit, happy-hour applicability, and evidence references. Unsupported prices are null, never zero.
- Source records with URL, source type, date accessed, date reviewed, and concise factual evidence notes. Access and review dates are distinct; neither is the publisher's update date.
- Field-level evidence state for hours and prices: supported, secondary-only, conflicting, or unknown. A venue-level label summarizes but does not override field states.
- Food/drink tags grounded in supported menu information; atmosphere tags explicitly editorial where not sourced. Never present those as verified dietary safety facts.

Preserve the original 28 records unchanged in the baseline fixture. Migrate legacy records conservatively: a true legacy boolean does not become newly verified evidence. Unsupported reputation values must not be presented as current ratings; omit reputation from new ranking unless a legitimate comparable source is available.

Conflicts: prefer an unambiguous branch-specific official source over a general guide, while retaining the conflicting source note. If official pages conflict, or location/menu applicability is unclear, mark the affected field uncertain and do not use it to satisfy a required constraint. Source age must be visible; a configurable proposed 30-day review threshold flags records for rechecking, not automatic factual invalidation or a fabricated confidence percentage.

Proposed evidence default: only manually reviewed, location-applicable primary-source hours and item prices satisfy strict timing and budget requirements. Secondary-only records remain available as clearly labeled verification-needed alternatives, never as strict matches. A mixed record can qualify only when all fields used for its required constraints have primary-source support. This may reduce strict-match counts and must be reported alongside the total researched record count.

Initial research leads, not yet accepted dataset records:

- https://downtownla.com/explore/dining-and-drinks/happy-hour-finder
- https://www.solagave.com/menus/happy-hour?location=l-a-live
- https://www.northitalia.com/locations/santa-monica-ca/?menu=happy-hour
- https://www.elportalrestaurant.com/menus/happy-hour?location=pasadena

Search results exposed a possible 5 PM versus 6 PM Sol Agave end-time conflict. Direct review is required before changing the record; a search snippet is not sufficient verification.

## Trustworthy Costs

Budget means per-person menu subtotal before tax, tip, and any unlisted fees. State this beside the budget control and combo total; do not imply a final bill or choose a uniform LA tax rate.

A supported combo contains one explicitly priced food item and one explicitly priced drink available in the same happy-hour window. Published bundles can satisfy both roles when their contents are explicit. Show quantities, item prices, and the calculated subtotal in cents. Shared pitchers, minimum-party offers, add-ons, and percentage discounts without a supported base price must not become a one-person fixed-price combo.

Select a qualifying combo deterministically: satisfy required food/drink tags first, maximize preference matches next, then choose the lower subtotal, with stable item-ID tie breaking. Budget relevance uses the displayed selected combo, not an unrelated cheapest option. Preserve legitimate alternatives in the venue details. An editorial per-person estimate can be shown separately as an unverified legacy estimate but cannot establish an exact supported combo total.

If either price is unknown, say the combo total is unavailable. Do not silently substitute regular-menu prices for happy-hour specials. For price ranges, only a sourced specific option can establish an exact supported combo; otherwise show the range with its uncertainty and do not claim an exact budget difference.

## Matching Behavior

Proposed defaults:

- Required: happy hour active at the selected local day/time, within selected straight-line distance, and within a specifically selected neighborhood when supplied.
- Budget is flexible, with no strict-budget mode or price-based exclusion. Prefer supported combos at or below the target, give modestly over-budget combos partial relevance, and progressively reduce relevance for larger overages. Proposed initial scoring band: up to $5 over is a near-budget option, not a hard cutoff; tune only against development cases. Show the actual dollar difference above or below the target. Lower-priced options are welcome and do not fail a minimum-spend rule. Unknown prices receive no positive budget-match claim, but can remain otherwise relevant with an explicit price-unavailable warning.
- Food, drink, and atmosphere are preferences by default. Separate optional food/drink must-have checkboxes require at least one match within each nonempty category. Multiple tags within a category mean OR; requiring both food and drink means AND across categories. Disable or ignore the must-have switch for an empty category.
- Atmosphere remains a soft preference because the available labels are subjective.
- Match score is a deterministic relevance score, not confidence or probability. Keep evidence status separate and omit unsupported reputation weight.

Proposed restriction default: unrestricted offers qualify normally. Bar-only offers require an explicit `Include bar-only offers` checkbox, off by default, and retain a visible seating restriction on the result. Other conditional offers requiring an unmodeled membership, party size, coupon, purchase minimum, or event admission remain alternatives rather than strict matches. Do not assume applicability from the venue being open.

Evaluate eligibility first, then rank eligible records by the existing supported preference signals with transparent score contributions. Preserve a stable venue-ID tie break. Explanations enumerate actual matched preferences and meaningful mismatches rather than reciting the venue's first tags.

Time boundaries use start-inclusive, end-exclusive intervals; a deal ending at 18:00 is not active at 18:00. Handle overnight windows using the previous weekday when after midnight. Unknown weekdays, ambiguous end times, and unsupported `all day` assumptions cannot satisfy required timing. Venue holidays and exceptional dates remain a stated limitation of a weekday/time search.

Matches meeting required timing, distance, and selected must-haves appear first, with budget tradeoffs visible in those primary results. Being over budget alone does not force a venue into alternatives. A separate, collapsed alternatives section can include candidates with timing or distance violations and explain every failed requirement; it must not label them qualifying. Candidates with unsupported timing may be shown there as needing verification. Retain neighborhood restriction for alternatives so the app does not silently override an explicitly selected area. No qualifying matches must produce an honest empty state with optional explicit filter changes, never an automatic relaxation.

## Proposed UI Improvements

The user asked for UI improvement ideas; these are proposals pending visual discussion, not approved screen designs.

- Replace the oversized introduction with a compact search-focused header and visible coverage count.
- Keep primary search controls prominent; move secondary preferences into an expandable section to reduce scanning effort.
- Order each result around the decision: venue, happy-hour window, distance, supported combo subtotal, and dollar difference from the target budget. Put source/review status nearby without suggesting a confidence percentage.
- Keep full specials, evidence notes, and score contributions in expandable details instead of showing every paragraph in every result.
- Provide sort options for best match, lowest supported subtotal, and nearest; unknown totals sort after known totals when price sorting.
- Add a compact shortlist/compare interaction, if approved, for at most three venues. Store only browser-local state; do not require accounts.
- Use a single-column mobile results layout with readable controls and no sticky element obscuring results.
- Prioritize clarity and current branding over adding maps, photography, or decorative UI without useful supported data.

## Evaluation Design

Before editing app logic or data, preserve baseline `src/data.js`, `src/scoring.js`, and relevant UI behavior at the recorded full Git SHA. Run existing automated tests and store the evaluation specification and baseline outputs.

Create 15 fixed scored scenarios before collecting the expanded dataset: 5 DTLA, 6 surrounding-area searches, and 4 edge/no-match searches. Add 5 held-out scenarios before tuning and do not use them to select venues or adjust ranking. Record their definitions and only inspect their results after the staged work is finished. These are small convenience samples, not statistical proof of citywide performance.

Build a manually reviewed answer key from evidence independent of the ranking implementation. Record source URLs, reviewed claims, and applicable constraints for acceptable venues/combos. Use multiple reviewers if available; otherwise disclose single-reviewer judgment. Do not generate expected answers by calling the same eligibility functions under test. Gold coverage is limited to the reviewed candidate pool, not every LA restaurant.

Primary metric: top-three suitable-option search success. On a positive scenario, success requires at least one of the top three primary recommendations to be in the independently reviewed acceptable set and meet that scenario's explicit time, distance, and must-have rules, with a suitable supported subtotal. Define each scenario's acceptable budget range before scoring; proposed default is at or below target plus $5, with no lower bound. This range is an evaluation relevance label, not an application filter. Report budget relevance separately from required-constraint validity so an over-budget recommendation is not mislabeled a prohibited result. On a deliberately negative scenario based on required timing/distance/must-haves, success requires no primary recommendations; a low budget alone must not define a no-results case. Report positive-search success and negative-search correctness separately alongside the combined numerator/denominator so empty output cannot masquerade as universal improvement.

Guardrail: count required-constraint violations among all top-three primary recommendations. Report the denominator and the number of returned recommendations so removing everything is visible.

Price/source audit: preselect a fixed panel of ten baseline venues and audit schedule evidence, supported combo prices, and total arithmetic against a frozen source-review snapshot. Report accurate claims / audited claims, unsupported claims separately, and missing/withheld claims as missing rather than correct. Audit new records separately rather than changing the before/after denominator.

Use the same answer key, snapshot date, and scoring rules across stages. If evidence changes, document the revision and rerun all stages instead of quietly changing expectations. Adapt the baseline only to invoke its existing ranking and neighborhood behavior; do not backport new filters, geocoding, or price logic. Unsupported surrounding-area behavior is an observed baseline limitation, not something repaired in the evaluator.

Stages:

1. Original data plus original behavior.
2. Expanded/reviewed data plus original behavior, through an explicitly documented legacy adapter that does not invent missing values. Where a reviewed record cannot be represented, report that limitation instead of manufacturing an estimate.
3. Expanded data plus supported combo calculations and flexible budget relevance.
4. Final constraint-aware matching, explanations, and corrected distances.

Preserve raw per-scenario inputs, returned IDs, item totals, failures, exclusions, and exact source/data/code versions. Stages are explanatory comparisons, not proof that each component independently caused the observed effect; document coupling and any unrepresentable intermediate comparison. Never invent scores or relabel restaurant match scores as evaluation accuracy.

## Verification and Deliverables

- Unit tests for schema validation, duplicate branches, radius inclusion, supported/unknown prices, combo arithmetic, category requirements, flexible-budget relevance without price-based exclusions, distance boundaries, source conflicts, end-time boundaries, overnight schedules, stable ordering, and empty states.
- Existing tests updated only where intended behavior changes, with the original version retained for baseline reproduction.
- Desktop and mobile browser checks for preset searches, origin/neighborhood selection, budget differences, must-have controls, source links, alternatives, empty results, and layout overflow.
- Offline collection/validation instructions, provenance records, updated data, runnable tests, reproducible evaluation command, and scored reports.
- A six-step class-post draft reflecting the user's original five answers, baseline and after scores, examples, limitations, and next iteration. State accurately that the existing recommendation engine is deterministic and AI assistance is in development/research unless a real AI extraction step is actually used and documented.
- Local working preview after implementation. Preserve the GitHub Pages deployment path; no production publication is implied by this design approval.

## Original Assignment Context

The user's five original answers, supplied in chat, are reproduced here so the implementer can draft the assignment without inventing the user's intent:

1. What are you trying to improve? "I'm trying to make it easier to choose a happy hour spot without having to open a bunch of different sources like websites, google maps, yelp, instagram, tiktok, etc, compare hours manually, and guess which deals are actually active at the time I want to go."
2. What would the system need to know? "It needs to know the user's location, day and time, budget, preferred food and drinks, desired atmosphere, and how far they're willing to travel. It also needs reliable happy-hour details for each restaurant, including days, times, specials, and how current that information is."
3. What should it produce? "It should produce a ranked list of happy-hour options with a match score, the happy-hour schedule, relevant food and drink specials, popular dishes/drinks, and a suggested food-and-drink combo. It should also show uncertainty when the restaurant information might need to be verified."
4. How would you know it was good? "I would know it was good if the top recommendations actually matched the user's situation: happy hour is active at that time, the price fits their budget, and the food/drink/vibe feels relevant. A good result should feel like something the user would realistically choose, not just the highest-rated restaurant."
5. What feedback would improve it? "Feedback about outdated hours, incorrect prices, missing restaurants, and bad vibe matches would improve it. It would also help to know whether users actually chose one of the recommendations or ignored the top results."

The six required submission steps are: update/restate those five answers; list evaluation approaches and necessary data; choose an outcome, measurable criteria, and relevant data/gold set; test and score the baseline; make an improvement to prompt/data/model/validation/workflow; compare results, limitations, and next steps. Include a solution link or screenshots and actual before/after scores. The assignment allows iteration and notes that further iterations require updating or adding evaluation data. The bundled changes should therefore be reported as staged iterations, with new edge cases kept distinct from the unchanged comparison set.

## Builder Decisions

The builder may choose module boundaries, fixture format, a small compatible geospatial dependency, evidence-file organization, exact supporting controls, test runner extensions, and collection parsing tools. Prefer the repo's Node test runner and plain JavaScript. New dependencies must be justified by actual parsing or domain logic needs. No framework migration is needed.

## Approval

The user approved flexible budgets and subtotals before tax/tip with disclosure. Do not implement a strict-budget default or a price cutoff. The supported-origin selector, offline curated-data workflow rather than continuously live search, and proposed UI changes still need approval as part of the full design.
