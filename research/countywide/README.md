# Countywide Research Pilot

An offline staging workflow for Los Angeles County (06037) and Orange County (06059). Accepted records can now be exported into the local browser dataset through the reviewed build path. Staging alone does not publish candidates, and no website deployment is performed. No provider credentials, database, automatic collection, new dependencies, or scheduled jobs are needed.

## Run

From the repository root, using Node.js 22+:

```sh
node --test research/countywide/tests/*.test.mjs
node research/countywide/tools/validate.mjs research/countywide
node research/countywide/tools/report.mjs research/countywide --markdown
node research/countywide/tools/identity.mjs research/countywide
node research/countywide/tools/export.mjs research/countywide --output research/countywide/accepted.json
npm run data:build
```

Validation/report/export accept a UTC ISO `--now` timestamp for reproducibility; use a time after the latest inspection event. Without it they use actual execution time. JSON is the default output. A nonzero exit means malformed input or validation errors; valid pending records are not validation failures. Validation/report/identity are read-only. Export defaults to stdout and writes only the dedicated accepted.json artifact when explicitly requested. Imports do not run CLIs. Identity suggestions read the existing four research JSON files without changing them.

See [pilot report](pilot-report.md) for the initial eight-case sample and [integration report](integration-report.md) for the expanded batch. A valid file is not an admitted branch or a complete research batch.

## Workflow

1. Add a distinct physical branch to `candidates.json`. Unknown address components, county, coordinates, hours, and prices remain null/empty. Identity starts `pending`. Multiple offer windows or discovery mentions do not create extra branches.
2. Inspect permitted official branch sources. Add URLs, concise independently authored factual notes, locators, branch applicability, and honest access/review metadata to `sources.json`. A title/image link can establish that an offer is advertised, but cannot establish uninspected hours or prices.
3. Record access/reuse/storage decisions in `policies.json`. Unconfirmed permission is not permission. Automated access and manual factual inspection are separate decisions. A page's accessibility, robots allowance, and a successful fetch do not establish public retention rights.
4. Resolve identity and assign county using reviewed government geography/address evidence. A region assignment in `coverage.json`, a city name, and a ZIP are not branch-level county proof. Use `identity.mjs` suggestions as review tasks, never automatic merges.
5. Append review events in `reviews.json`. Inspect every proposed admission, all conflicts/identity ambiguities, and independently audit at least 10 admissions or all admissions when fewer than 10 qualify. Label agent review separately from human review.
6. Run validation, reporting, export, and build for the user's approved local data-integration scope. Paid services, scheduling, commits, deployment, and UI-file changes remain outside that approval.

An advertised offer may qualify without known hours or prices. Such a record still cannot satisfy a time or price constraint that needs those missing facts. The expanded staging set has 11 accepted branches, 7 pending, and 1 excluded closure. Those 11 additions are included in the local app's 111 records after export/build; none is claimed deployed.

## File Contract

`batch.json` contains batch identity, target, scope, and measured `effort` (`minutes`, `costCents`); null means unmeasured, never zero. `loadBatch(directory)` reads this manifest and the five JSON arrays below. All tool functions accept ordinary objects and return new results without mutating records.

### Candidates

Required: `id`, `revision`, `name`, structured `address`, `county`, `coordinates`, `identityStatus`, `operatingStatus`, `operatingSourceId`, `offerName`, `offerEvidenceSourceIds`, `hours`, `menu`, `specials`, `compatiblePairs`, `notes`.

- IDs are stable per physical branch. `revision` is a nonempty string, updated when facts change. Preserve previous versions outside active arrays in a permitted history store when available; this pilot does not implement a version database.
- Address fields: `street`, `unit`, `city`, `state`, `postalCode`. Unknown components are null. Admission needs a known street/city and state CA. Never use a parking address in place of the branch.
- County: `{geoid, sourceId, reviewedOn}`, each nullable until resolved. Admission requires 06037/06059 and a reviewed government source claiming county assignment for this branch.
- Coordinates: null or `{lat, lng, precision, sourceId}`. Coordinates must have provenance; absence prevents later distance-qualified export. Street-range interpolation is not entrance GPS.
- `identityStatus`: `pending` or `resolved`. `operatingStatus`: `unknown`, `open-listed`, or `closed`; documented closure is excluded, an unresolved closure flag cannot be admitted.
- Windows: `{id, days, start, end, restriction, status, sourceId, notes?}`. Use full weekday names and HH:MM. Overnight end precedes start and follows the originating weekday; end is exclusive. Equal endpoints are invalid. Preserve holidays and unresolved restrictions in notes; use `conditional` until machine eligibility can safely model them.
- Items: `{id, name, kind, priceCents, status, sourceId, days?, windowIds?}`. Kind is food/drink; prices are positive exact integer cents or null. Ranges and discounts are not final prices.
- Specials: `{text, status, sourceId}`. Display-only factual summaries do not establish item prices or matching tags.
- Compatible pairs: `{id, foodId, drinkId, windowId, status, sourceId}`. Reporting requires explicit acceptance of the pair ID, primary source support, positive food/drink prices, one primary nonconditional shared window, and at least one common applicable weekday. No compatible pair is guessed from two venue-level prices.
- Optional `history` contains earlier names/addresses for identity suggestions. Optional `externalIds` can participate only with an attached policy explicitly allowing reuse and public retention. Restricted provider payloads never belong here.

### Sources and Policies

Sources require `id`, public `url`, `type` (primary/secondary), `publisherRole` (restaurant/government/guide/directory), `claims`, `mediaType`, `branchIds`, `accessedAt`, `reviewedAt`, `reviewer`, `reviewMethod`, `accessOutcome`, `publisherUpdatedOn`, `effectiveFrom`, `effectiveThrough`, `currentLinkSourceId`, `locator`, `policyId`, `note`.

`claims` describe the inspected evidence: e.g. `advertised-offer`, `hours`, `menu`, `compatible-pair`, `address`, `county`, `operating-status`. They are reviewer assertions supported by the locator, not machine truth. Government primary evidence can establish geography; it cannot stand in for restaurant-controlled happy-hour evidence.

Use UTC ISO timestamps ending in Z for access/review/check events; use real YYYY-MM-DD calendar dates for publication/effective dates. Review cannot precede access or occur in the future. A `reviewedAt` value requires successful access (`ok`), reviewer identity, and `agent-source-inspection` or `human-source-inspection`. For `blocked`, `unavailable`, and `search-only`, review fields stay null. A fetch, snippet, or OCR alone is unreviewed. Publication dates remain null when unknown.

An undated offer can be considered currently advertised on a live branch page/current linked menu with no contrary evidence. Set `discoveryContext` to `live-branch` for inspected live branch HTML, `linked-menu` for a menu linked from it, or `archive`/`unknown` when currency is not established. A linked menu needs `currentLinkSourceId` pointing to inspected primary restaurant-controlled live branch HTML whose `linkedUrls` explicitly contains the exact menu URL. An isolated old indexed asset stays pending. These assertions still require reviewers to check ownership, linkage, and contradictory claims before acceptance; a link alone never resolves those questions.

Optional `checks`: `[{at, outcome, affectedFields}]`. Outcomes are `unchanged`, `changed`, `blocked`, or `unavailable`. A post-review change/failure creates `needs-review`; unchanged checks do not renew review dates. Keep the originally inspected source record and append checks rather than changing it to look unreviewed. If a fact is edited, create a candidate revision and re-review it.

Policies require `id`, `sourceOrigins`, `checkedAt`, `accessMethod` (manual/automated), `automatedAccess`, `factReuse`, `publicRetention`, `rawRetention`, `attribution`, `termsUrl`, `robotsUrl`, `unresolvedQuestions`. Permission values are allowed/denied/unconfirmed; `rawRetention` is `{permission, maxSeconds}`. Multiple exact origins may share a policy only when its scope actually covers them. URLs may be null when not established. Record a rationale for allowed retention in the policy questions/notes or a linked permission record; do not set allowed merely to make a record qualify.

Admission needs both `factReuse` and `publicRetention` allowed for all retained sources/facts, including unreviewed secondary claims. Automated acquisition also needs `automatedAccess` allowed. Policy decisions must precede acceptance. Raw retention stays denied; unresolved and explicitly restricted sources remain pending, while the expansion records limited factual-only retention decisions after inspection. No raw HTML, PDFs, images, review text, or API responses are included. Everything committed anywhere in this repository may be public; staging and `.gitignore` do not provide confidentiality.

The expansion's `permissionBasis: independently-authored-facts` records a limited retention decision for our own selected factual observations, not a restaurant-granted license to copy its content. Its basis links the US Copyright Office's distinction between facts and their expression, records exposed policy checks, and retains uncertainty about undiscovered terms. No descriptions, recipes, photos, reviews, raw menus, page layouts, or commercial directory data are copied. Explicitly restrictive sources remain withheld. Missing policy links alone never authorize automated collection, source-content mirroring, or bulk reuse.

### Review Events and States

Events require `id`, `candidateId`, `revision`, `at`, `reviewer`, `reviewMethod`, `decision`, `sourceIds`, `affectedFields`, `confirmedPairIds`, `rationale`. Decisions: accept/request-review/exclude/resolve-conflict. Append events rather than rewriting history. Acceptance/resolution events also carry `candidateHash` from `candidateDigest(candidate)` and `evidenceHash` from `evidenceDigest(candidate, sources)` in `tools/common.mjs`; both are SHA-256 with canonical object key order. Acceptance must follow source inspection. Candidate edits or replacement/review of retained evidence invalidate old acceptance even when revision labels/IDs are reused. Evidence hashing excludes fetch-only access timestamps and append-only checks; checks have their own review transitions. These checks detect stale acceptance, not malicious editing, and are not substitutes for access controls or independent review.

`latestReview` considers acceptance only for the current candidate revision and both digests; callers pass the source array. `deriveReviewState` returns lead/pending/accepted/needs-review/excluded, reasons, affected fields, and last accepted-review time. Field statuses remain primary/secondary/conflicting/unknown. A workflow acceptance is necessary but insufficient: validation also checks official advertisement, identity, county evidence, policy, dates, and source references. A future or superseded review cannot accept the current record.

An explicitly dated offer remains effective through its last America/Los_Angeles calendar date. Expired offers and reviewed closures are excluded. Access failures preserve previous evidence/history and request review; they are not closure or discontinuation evidence. Source checks and review decisions are manually recorded here; no refresh collector is implemented.

### Coverage

`coverage.json` contains `{id, name, countyGeoid, jurisdictionType, boundarySourceUrl, scopeStatus, attempts, candidateIds, notes}`. Types: region/city/unincorporated. States: not-started/in-progress/reviewed-search. The supplied 13 work groups are an initial research queue, not a complete jurisdiction inventory or official boundaries. `reviewed-search` documents a particular search, never exhaustive venue discovery.

## Reports and Limitations

`summarizeBatch` separates discovered/researched/admitted/pending/excluded counts, verified counties, work groups, observed official advertisements, and evidence completeness among admissions. Its `primarySchedules` metric excludes unresolved conditional windows. Research progress uses this batch's distinct branches as its explicit denominator. It never reports countywide completeness, recall, or a provider's result estimate as a restaurant universe. Validation errors make admission reporting fail closed.

`tools/export.mjs` maps only accepted, government-located candidates to the app schema and preserves unknown cents, source status, item/window restrictions, and county evidence. It validates output and refuses unsupported geography. The build checks accepted.json against a fresh validated export before generating src/data.js. County admission replaces the DTLA circle for new records; the 25-mile user travel cap and legacy fallback for the original four research files remain. The original records are not reclassified as county-verified.

Candidates with `withholdMenuPrices: true` cannot export numeric menu prices or currency assertions in public notes, source notes/locators, or specials. This applies to Cedar Creek while visual menu QA is unavailable; a link is retained without displaying unverified price assertions. Dataset `collectedOn` is derived from actual source review dates. `builtOn` is separate and cannot renew the research snapshot.

## Later Discovery Providers

The provider interface remains a design contract in the approved implementation plan: `discover({region, cursor, limit, signal, policy, budget}) -> {leads, nextCursor, diagnostics}`. Google, Yelp, Foursquare, and other adapters are not implemented or enabled. Select permitted use, retention, attribution, request/cost limits, and a protected credential environment before adding one. Discovery can only create leads; it cannot create acceptance decisions or primary offer evidence.
