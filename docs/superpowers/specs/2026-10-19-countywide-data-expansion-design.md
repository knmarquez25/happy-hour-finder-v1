# Countywide Happy-Hour Data Expansion

Date: 2026-10-19 (America/Los_Angeles)
Status: Draft for discussion. Research design only; implementation, collection volume, integration, providers, scheduling, and spending are unapproved.

## Purpose and constraints

Expand discovery across Los Angeles County and Orange County for restaurants with evidence of an advertised happy hour. Count physical branches, preserve evidence for each fact, and report geographic gaps honestly. A search with no evidence found does not establish that a restaurant has no happy hour.

This chat owns the data proposal. The original chat owns the UI redesign in the same checkout. This draft adds one documentation file only. UI files, research records, shared schema, generated data, matching, validation, and evaluation fixtures remain outside the current edit boundary. No commit, deployment, paid provider, or scheduled job is authorized by this document.

## Observed repository baseline

Read-only inspection on October 19 found 100 research records and 100 published, located branches. Generated metadata reports 73 branches with primary-supported hours and 38 with exact primary-source food and drink prices. The latter metric does not prove that those items are usable together in a primary-supported window. There are 159 source entries, which can include repeated URLs. Reviewed source dates are October 19 or null; these are research dates, not publisher update dates or new rechecks of all restaurants in this session.

The generated module is 217,921 bytes. At the current average, 500 records would be approximately 1.09 MB before compression. This is a sizing estimate, not a browser performance measurement.

Current coverage is a 25-mile circle around DTLA, with LA-area addresses and no OC city addresses in the inspected list. County membership is not currently encoded. `scripts/build-data.mjs` excludes located records outside that circle, `src/validation.js` rejects them, and `src/matching.js` also rejects them. The matcher separately caps a user's travel radius at 25 miles. County admission and user travel distance need separate rules; a local travel radius can remain useful inside a countywide dataset.

`research/SCHEMA.md` and the existing source notes already preserve unknown prices, branch specificity, primary/secondary/conflicting/unknown facts, and display-only discounts. Extend these semantics rather than replacing them.

## Recommended architecture and alternatives

| Approach | Benefit | Tradeoff | Recommendation |
| --- | --- | --- | --- |
| Reviewed files and a static export | Fits GitHub Pages and existing deterministic search; no service credentials | Review and publication remain deliberate steps | Start here |
| Local SQLite research workspace and static export | Easier source history, deduplication, and review queries | Adds a maintenance tool and migration | Consider after the pilot demonstrates a need |
| Hosted database and search API | Supports shared editors, frequent releases, and larger indexed searches | Hosting, credentials, monitoring, operational ownership, and recurring costs | Defer pending measured need and approval |

Keep collection outside visitor browsers. Keep research entities distinct from the browser export so raw discovery data and licensed content cannot accidentally become public assets. A database-backed public search service is not justified by the 500-record count alone; measure payload, parsing, and matching on a representative mobile device first. Builder-selected implementation details can follow the existing JavaScript stack.

## Admission and evidence

Recommended default for new milestone records: count a branch only after a reviewer directly inspects restaurant-controlled evidence explicitly advertising its happy hour or equivalent recurring offer. A chain-wide offer is sufficient only when its applicability to that branch is explicit. A guide listing alone remains a separately labeled research lead. Existing secondary records remain intact during the pilot; re-audit them separately before counting them toward the new milestone.

An admitted branch may have unknown hours or prices. Report distinct counts for advertised offers, reviewed usable schedules, priced food, priced drinks, and compatible priced food/drink pairs. A source-supported discount with no final item price is valid evidence of an offer, but does not establish a subtotal. Unknown hours cannot satisfy a time-filtered search.

Proposed admission clarification: an equivalent recurring offer must be explicitly presented by the restaurant as a happy-hour-style promotion, such as Golden Hour or Aperitivo, with advertised special pricing or an offer menu. A generic weekday special, ordinary prix-fixe menu, coupon, or loyalty-only promotion does not qualify on that fact alone. An explicitly advertised all-day happy hour can qualify. Record the restaurant's own promotion name so this classification remains reviewable.

For freshness, an undated offer can count as currently advertised when it appears on a live branch page or a menu directly linked from the current official branch navigation, with no contrary expiry, closure, or superseding evidence. Keep publication/effective dates unknown and record the link path and inspection date. An isolated indexed PDF, old event page, or undated unlinked image remains a lead until current official linkage or another current official statement establishes applicability. A past explicit expiry prevents admission even if the file is still linked. Here, active means currently advertised with no known discontinuation; it never means same-day confirmation. These are proposed research defaults, not user-approved policy.

Represent restrictions at offer/window/item level: seating, weekdays, holidays, end dates, age restrictions, minimum purchase, quantities, and kitchen closing time where evidenced. All times use America/Los_Angeles. Preserve overnight windows and their originating weekday. Keep monetary amounts in integer cents; do not derive final prices from discounts or divide bundles into invented item prices. Menu tags require happy-hour item evidence, not a regular menu.

Proposed research entities, pending a shared schema agreement:

- Branch: stable internal ID, name, structured address including suite, county identifier and its evidence, city, research region, coordinates and precision, operating status and its evidence. Keep name/address history for relocations and rebrands.
- Source: URL, publisher, primary/secondary type, media type, applicable branches, observed publication/effective dates when available, access time, review time, reviewer, access outcome, and field/page/image-region locator.
- Offer: branch references, explicit advertised-offer evidence, windows, exceptions, item applicability, published prices or discount text, field-level evidence states, and source references.
- Review event: candidate facts, decision, rationale, prior version, unresolved conflicts, next review date, and reviewer identity or method. A machine fetch is not a human review.
- Source policy: policy/terms URLs and check time, permitted use, attribution, retention and deletion limits, cache permission, and unresolved questions.

Use normalized names/addresses and permitted external IDs to suggest duplicate pairs. Require review for ambiguous matches. Preserve suites and separate restaurants in shared buildings; an address alone must not force a merge. Multiple menus/windows for one branch remain one counted location. Closed branches leave the active count; closure evidence and history remain where retention permits.

## Sourcing and access findings

Public/licensed business directories can supply discovery candidates only when the particular license permits that use and retention. Names from a directory do not prove a happy hour. Prefer restaurant-controlled branch pages, linked menus, PDFs, and images for advertised-offer evidence. Tourism/editorial guides supply additional leads and separately labeled secondary claims. Search snippets are leads and cannot establish direct review.

Sources checked during this planning session:

- [Google Places policy](https://developers.google.com/maps/documentation/places/web-service/policies) restricts prefetching, caching, and storage outside permitted exceptions; place IDs have an exception. Do not assume API access licenses a permanent restaurant directory or a public JSON export. Any proposed Google use requires checking the applicable agreement, permitted use, storage, and attribution first.
- [Yelp Places FAQ](https://docs.developer.yelp.com/docs/places-faq) states a maximum 24-hour content cache and indefinite Business ID retention. Its documented search cap also limits discovery. This is unsuitable as the default source of permanent public research records without another applicable license. No Yelp integration is selected.
- [OC Health Care Agency food-establishment PDF](https://www.ochealthinfo.com/sites/healthcare/files/2024-06/Food%20Establishments.pdf) contains facility/address information and nonrestaurant facilities. Its URL is under a June 2024 path; publication currency and reuse permission remain unconfirmed. It is a possible discovery source, not a current operating roster or happy-hour source.
- [LA County Environmental Health contact page](https://publichealth.lacounty.gov/EH/about/contact-us.htm) has an official search result identifying Pasadena, Long Beach, and Vernon as separate environmental-health jurisdictions. Direct page retrieval failed in this session. Verify this against accessible agency pages before designing a permit-data feed; a single LA County feed cannot be assumed geographically complete.
- [Census geocoder documentation](https://www.census.gov/programs-surveys/geography/technical-documentation/complete-technical-documentation/census-geocoder.html) supports batches up to 10,000 addresses. Its [API documentation](https://geocoding.geo.census.gov/geocoder/Geocoding_Services_API.html) supports county geography output. The existing script uses location-only output and would need a reviewed geography step. Record benchmark/vintage and review unmatched or boundary cases; interpolated coordinates are not entrance GPS.

Two small feasibility checks, not imported records: [Wood Ranch Irvine](https://www.woodranch.com/restaurants/irvine/) currently displays Monday-Friday 3-6pm and a holiday exclusion. [Lazy Dog Irvine](https://lazydogrestaurants.com/pages/irvine-ca) displays weekday afternoon and Sunday-Thursday late windows. These establish branch-specific advertised schedules on the inspected pages, not verified item prices, county geocoding, same-day availability, or permission for automated collection. Restaurant terms, robots policies, and retention permissions were not audited in these manual evidence checks.

Before automated fetching, record the source's actual access and reuse rules. Robots permission alone is insufficient to establish reuse or caching rights. Do not bypass access blocks; use another permitted source or leave the record pending. Store full HTML, PDFs, images, or extracted text only when the source permits retention. Keep source links, concise factual notes, and locators as the default evidence trail; do not mirror menu prose or media publicly. Apply deletion/expiry rules to caches and backups as required.

## Coverage strategy and proposed milestones

Countywide means a search/research scope, not a completeness claim. Build a coverage ledger for cities and unincorporated areas, grouping them into practical research regions while retaining individual jurisdiction entries. Include the Antelope Valley, Santa Clarita, San Fernando Valley, Santa Monica Mountains/Malibu, Westside, Central LA, South LA, South Bay, Long Beach/Gateway, San Gabriel Valley, eastern LA County, and island communities; cover north, central, coastal, inland, and south OC. These are work groupings, not authoritative boundaries or guaranteed minimum counts.

Assign counties from authoritative county geography/address evidence, not ZIP alone or a city-name heuristic. Proposed county GEOIDs are 06037 and 06059, to be checked against the selected geography dataset. Research jurisdiction and permit jurisdiction are separate concepts.

1. Approve the data integration boundary and admission rule. Inventory current records without rebuilding shared output. Record coverage gaps, policy unknowns, and baseline counts.
2. Proposed pilot: up to 40 new branches, aiming for 20 per county across multiple uncovered regions, with both independent restaurants and chains. Include HTML, PDF/image, discount-only, conflicting, and unavailable-source cases where found. Return reviewed candidates plus a lead/rejection ledger; report a shortfall instead of padding.
3. Measure evidence yield, review effort, cost if any, access failures, duplicate rate, and regional gaps. Propose an explicit effort/cost cap for the next batch from observed pilot results; do not assume approval to spend.
4. Proposed first expansion milestone: 500 total active branches supported by directly reviewed official advertised-offer evidence, including qualifying existing records. A provisional allocation of 300 LA County and 200 OC is a planning suggestion, not approved scope, a guaranteed count, or a coverage estimate. Adjust based on pilot findings and the user's priorities.
5. Release in reviewed batches with county/region coverage and evidence completeness counts. A partially researched city stays visibly pending; no evidence found and confirmed discontinued offer are separate outcomes.

## Collection, refresh, and review

The workflow is discovery → policy check → branch matching → permitted fetch/manual inspection → candidate extraction → review → validation → approved export. Extraction proposes facts with locators; it cannot promote itself to primary review. PDFs and images need visual checks for columns, footnotes, branch labels, and prices; uncertain OCR stays pending. Existing offer content must not be silently replaced by an empty or blocked response.

The current collector is a one-shot HTML helper, not a refresh system: it returns its URL cache indefinitely, uses a fixed October 19 access date, retains full HTML, and applies a delay per invocation rather than a shared per-host request budget. Before recurring use, it needs actual timestamps, policy-aware retention, cache expiry, conditional requests where supported, host-level limits, bounded retries/backoff, and reviewable change history. This draft does not implement those changes.

Recommendation: begin with manual runs. After measuring workload and approving a runner/effort budget, consider weekly permitted change checks and a 30-day review target. These are proposed operational defaults, not publisher freshness guarantees. A content hash or 304 can reduce unnecessary fetch work; neither renews a human review date. Changed hours/prices create review tasks. Failed access preserves history and flags uncertainty; explicit expired offers stop qualifying on expiry. Review age remains separate from primary/secondary status.

For a later schedule, define owner, execution environment, retention limits, maximum requests/cost per run, failure alerts, and a pause mechanism before enabling it. No automation is created now. Notifications should concern meaningful changes, failures, or required action, not unchanged checks.

## Evaluation and release checks

Keep the historical benchmark and holdout intact. Add a separate countywide suite after the integration contract is approved, covering OC origins, county edges, outside-county locations, unknown counties, separate branches, shared addresses, late windows, holiday exceptions, conflicting official sources, unknown prices, and item/window compatibility.

For the pilot, review every admitted record. Independently recheck a stratified sample of at least 10 admitted records across counties and formats, plus every conflict and ambiguous identity. Measure claim support, county assignment, duplicates, missing restrictions, and price/window attribution. If errors occur, correct the batch and expand the audit for that error class before release. Rejected or inaccessible candidates must remain visible in effort/yield reporting.

Release requirements: each counted branch has explicit reviewed advertised-offer evidence, resolved identity/county, source-linked fields, valid dates and amounts, and no unsupported inference used to satisfy a required filter. Unresolved source conflicts cannot satisfy affected constraints. Report advertised, schedule-qualified, and price-compatible counts separately. No numeric recall/completeness percentage is defensible without an independently established universe of happy-hour venues; regional lead yield is not recall.

## Proposed integration boundary and decisions

Recommended next edit scope, only after agreement: a new `research/countywide/` staging directory for candidates, source policies, review events, and a coverage ledger. Keep it independent of the current build. A separate agreed integration step would address county admission in build/validation/matching, structured geography, origin support, generated data, and relevant tests together with the UI owner. No cross-chat message is assumed authorized.

The user decision needed now is whether to adopt this staged, initially static approach and permit the isolated pilot scope. The 500 target, regional allocation, official-evidence admission default, paid services, hosted database, scheduling, and publication remain proposals until accepted. The builder may choose filenames and parsing libraries within the approved scope, but may not infer infrastructure or spending approval.
