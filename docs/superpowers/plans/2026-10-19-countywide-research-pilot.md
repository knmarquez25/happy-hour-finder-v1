# Countywide Research Pilot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an isolated research workflow for advertised happy hours across Los Angeles County and Orange County, with a manual pilot and a future interface for permitted API discovery.

**Architecture:** Keep reviewed research files and offline tools separate from the existing browser data pipeline. Discovery creates leads; a distinct evidence review qualifies an advertised offer. Optional provider adapters may be added later without changing how offer evidence is reviewed.

**Tech Stack:** Existing Node.js 22+, JavaScript ESM, JSON, and `node:test`; no new dependencies or hosted services for this pilot.

**Spec:** `docs/superpowers/specs/2026-10-19-countywide-data-expansion-design.md`

**Status:** Concrete proposed execution plan, following the user's request to continue countywide planning and preserve the option of later APIs. No implementation or provider subscription has been performed. Initial source inspection is documented in `docs/countywide-source-review.md`. The 40-branch pilot and 500-location milestone remain proposed targets; this plan does not imply authorization to modify shared integration files.

## Global Constraints

- Scope is Los Angeles County and Orange County; county membership requires evidence independent of a ZIP/city-name guess.
- All times use America/Los_Angeles.
- A search with no evidence found does not establish that a restaurant has no happy hour.
- Keep monetary amounts in integer cents; do not derive final prices from discounts or divide bundles into invented item prices.
- No commit, deployment, paid provider, or scheduled job is authorized by this document.
- No changes to `index.html`, `src/app.js`, `src/styles.css`, existing research/schema files, `src/data.js`, shared build/validation/matching, package scripts, or historical evaluation fixtures in this phase.
- Use synthetic fixtures for provider content. All files in the public repository, including a future staging folder, must be safe for public distribution. A file being outside `src/` does not make it private.
- Restricted provider responses, secrets, licensed media, and unapproved source caches must never be written to the repository. Use an approved private store with enforced retention if a later integration requires one; `.gitignore` alone is insufficient.

## Review Focus

1. A provider result, search snippet, or model extraction must never create a reviewed happy-hour offer by itself; Task 1 tests admission.
2. A blocked source, expired offer, or changed page must not silently overwrite previously reviewed facts; Task 2 tests review transitions.
3. Shared buildings, suites, rebrands, and chain branches must not be collapsed into one location; Task 3 tests identity suggestions.
4. A provider's reported search totals must not become a countywide completeness percentage; Task 4 tests report denominators.
5. Public staging must not expose restricted responses or accidentally feed the browser build; Task 5 checks allowed artifacts and integration isolation.

## File Structure and Order

All executable pilot files live under a new `research/countywide/` directory. They are not imported by the existing app or enumerated by its current build. Prefix IDs with `cw-` while staged; reconcile stable IDs with existing branches at integration.

| File | Responsibility |
| --- | --- |
| `research/countywide/README.md` | Workflow, field contract, states, public-storage limits, commands |
| `research/countywide/batch.json` | Batch ID, scope, target, reviewer assignments, actual effort/cost observations |
| `research/countywide/candidates.json` | Public-safe branch identities and concise candidate facts with provenance |
| `research/countywide/sources.json` | Sources, branch applicability, access/review outcomes and factual locators |
| `research/countywide/policies.json` | Access/reuse/storage permissions and unresolved policy questions |
| `research/countywide/reviews.json` | Append-only review decisions and rationale |
| `research/countywide/coverage.json` | Research areas and documented effort/status; no false completeness claims |
| `research/countywide/tools/validate.mjs` | Pure validation and admission summary; explicit CLI only reads files |
| `research/countywide/tools/review.mjs` | Pure review-state transitions; no network or file writes on import |
| `research/countywide/tools/identity.mjs` | Duplicate suggestions; no automatic merges |
| `research/countywide/tools/report.mjs` | Deterministic batch summary; default output to stdout |
| `research/countywide/tests/*.test.mjs` | Synthetic test cases; run separately from current app tests |

Implement Tasks 1-4 in order because later tasks use their interfaces. Task 5 uses those completed tools for the pilot. Optional API adapters and app integration are explicitly later projects.

## Task 1: Research Contract and Admission Validator

**Files:** Create `README.md`, `batch.json`, `candidates.json`, `sources.json`, `policies.json`, `reviews.json`, `coverage.json`, `tools/validate.mjs`, and `tests/validate.test.mjs` under `research/countywide/`.

**Interfaces:** `validateBatch(batch, { now }) -> { errors: string[], eligibleIds: string[], pendingIds: string[], excludedIds: string[] }`. `batch` combines arrays named `candidates`, `sources`, `policies`, `reviews`, and `coverage` plus a `manifest` object; the CLI loads those seven named files from an explicit directory. `now` is an injected ISO timestamp; evaluation must not depend on wall-clock time hidden inside validation.

Required candidate fields: `id`, `name`, `address` (street, unit/null, city, state, postalCode/null), `county` (geoid/null, sourceId/null, reviewedOn/null), `coordinates` (null or coordinates with precision/source reference), `operatingStatus` (`unknown`, `open-listed`, `closed`), `operatingSourceId` (nullable), `offerEvidenceSourceIds`, `hours`, `menu`, `specials`, and `notes`. Record absence as null/empty, not inferred values. Preserve current source/status/price semantics in facts without editing the shared schema.

Required sources: unique `id`, `url`, `type`, `mediaType`, `branchIds`, `accessedAt`, `reviewedAt` (nullable), `reviewer` (nullable), `reviewMethod` (nullable or `agent-source-inspection`/`human-source-inspection`), `accessOutcome`, `publisherUpdatedOn` (nullable), `effectiveFrom`/`effectiveThrough` (nullable), `currentLinkSourceId` (nullable), `locator`, `policyId`, and `note`. Automated fetch/OCR alone leaves review fields null. Do not describe an agent inspection as independent human review.

A policy records `id`, `sourceOrigin`, `checkedAt`, `accessMethod`, `automatedAccess`, `factReuse`, `rawRetention`, `attribution`, `termsUrl`, `robotsUrl`, and `unresolvedQuestions`. Permission values are `allowed`, `denied`, or `unconfirmed`; raw retention additionally records `maxSeconds` or null. Missing terms do not imply permission. Manual factual inspection and automated collection have distinct permission decisions.

Admission requires an accepted review event referencing directly reviewed restaurant-controlled offer evidence, resolved county evidence for 06037 or 06059, resolved identity, no known closure/expiry, and confirmation that stored material may be retained in its intended public destination. A schedule or price is not required to establish that an offer is advertised. Missing coordinates may remain staged; they prevent distance-qualified export later. Pending/secondary records remain research leads. Review events carry reviewer/method, time, decision, rationale, referenced sources, and candidate revision identifier.

- [ ] Write tests named `discovery_is_not_admission`, `county_requires_evidence`, `unknown_hours_are_not_guessed`, `discount_is_not_a_price`, `expired_or_closed_is_excluded`, `inaccessible_source_cannot_be_marked_reviewed`, and `unconfirmed_public_retention_stays_pending`. Assert exact classified IDs and errors for a three-state synthetic batch.
- [ ] Run `node --test research/countywide/tests/validate.test.mjs`; confirm the missing implementation fails.
- [ ] Implement the pure validator, synthetic fixtures, empty manifests, and the field contract. Validate source references, real calendar dates, unique IDs, exact cents, weekday/time values, restrictions, review identity, and source branch applicability. Unknown field facts cannot satisfy matching eligibility later.
- [ ] Run the targeted tests and then `node research/countywide/tools/validate.mjs research/countywide`; empty staging must validate and report zero admitted branches, not a successful 40-branch pilot.

## Task 2: Review State and Change Handling

**Files:** Create `tools/review.mjs` and `tests/review.test.mjs`; extend README documentation within the new directory.

**Interfaces:** `deriveReviewState(candidate, sources, events, { now }) -> { state, reasons, affectedFields, lastReviewedAt }`. `state` is `lead`, `pending`, `accepted`, `needs-review`, or `excluded`. Consume Task 1's candidate/source/review contracts. Retain original evidence states on facts; these workflow states do not replace primary/secondary/conflicting/unknown.

- [ ] Write tests named `fetch_does_not_renew_review`, `source_change_marks_affected_fields`, `access_failure_preserves_accepted_history`, `expiry_excludes_on_effective_date`, and `official_conflict_keeps_unaffected_facts`. Assert that a fetch timestamp cannot change `lastReviewedAt`, old facts remain in history, and conflicting fields cannot qualify as resolved.
- [ ] Run `node --test research/countywide/tests/review.test.mjs`; verify failure before implementation.
- [ ] Implement deterministic transitions. Event decisions are `accept`, `request-review`, `exclude`, or `resolve-conflict`, each referencing an immutable candidate revision and sources. Compare effective dates in America/Los_Angeles; an offer valid through a date expires after that local calendar date. A blocked check creates uncertainty without inventing discontinuation.
- [ ] Run the targeted tests plus Task 1 tests. Ensure no module mutates files or schedules work simply by being imported.

## Task 3: Branch Identity Suggestions

**Files:** Create `tools/identity.mjs` and `tests/identity.test.mjs`.

**Interfaces:** `suggestDuplicates(candidates, existingRecords) -> Array<{ candidateIds: string[], existingIds: string[], reason: string, requiresReview: true }>`; `existingRecords` is read-only input from current research, never modified. Suggestions are evidence for reviewers, not merged IDs.

- [ ] Write tests for punctuation variants, distinct chain addresses, two suites at the same street number, two named restaurants sharing a food hall address, and rebrand/relocation history. Assert the chain branches stay separate and ambiguous co-locations require review.
- [ ] Run `node --test research/countywide/tests/identity.test.mjs`; verify failure before implementation.
- [ ] Implement conservative normalization preserving unit and original strings. Similar names/addresses can produce suggestions; never merge solely because an address matches. External IDs participate only when their retention/use policy is recorded as allowed.
- [ ] Run identity and validation tests. Verify importing the existing records has not regenerated or edited `src/data.js`.

## Task 4: Coverage and Batch Reporting

**Files:** Create `tools/report.mjs` and `tests/report.test.mjs`; document commands in the staging README.

**Interfaces:** `summarizeBatch(batch, { now }) -> { discovered, researched, admitted, pending, excluded, byCounty, byRegion, evidence, effort, limitations }`. Consume Tasks 1-3. Report `evidence` counts separately for advertised offers, primary schedules, priced food, priced drinks, and pairs explicitly confirmed compatible by review. Do not assume food and drink appearing in the same venue are compatible.

Coverage ledger entries use `id`, `name`, `countyGeoid`, `jurisdictionType`, `boundarySourceUrl`, `scopeStatus`, `attempts`, `candidateIds`, and `notes`. `scopeStatus` is `not-started`, `in-progress`, or `reviewed-search`; the last state means an explicitly documented search was completed, not that every venue was found. Region groups do not substitute for a city/unincorporated-area inventory.

- [ ] Write tests named `discovery_counts_physical_branches_once`, `closure_is_reported_but_not_admitted`, `price_pair_needs_joint_applicability`, `effort_unknown_stays_unknown`, and `no_completeness_without_known_universe`. Check a synthetic batch with repeated lead sources, a closed branch, and a priced pair usable on different days.
- [ ] Run `node --test research/countywide/tests/report.test.mjs`; verify failure before implementation.
- [ ] Implement JSON stdout output and a concise Markdown summary option. Calculate researched/discovered only for this documented batch, with the denominator stated; do not label it county coverage. Provider total-result estimates cannot supply an exhaustive denominator. Report actual effort and charges when observed; never manufacture historical minutes/costs.
- [ ] Run `node --test research/countywide/tests/*.test.mjs` and the report CLI on empty staging. Expect zero admitted branches, explicit pending coverage, and no countywide completeness percentage.

## Task 5: Manual Source Pilot and Isolated Handoff

**Files:** Populate only the new public-safe staging JSON and add `research/countywide/pilot-report.md`. Read the initial eight-case review in `docs/countywide-source-review.md`; it is source reconnaissance, not eight imported or admitted branches.

- [ ] Before collection, confirm the narrow staging edit scope with the user: new `research/countywide/**` files only, offline tools, manual public-source review, and no shared integration. Do not request approval for already accepted scope again. The initial 40-new-branch target is up to 20 per county; shortfalls and failed candidates belong in the report.
- [ ] Select candidates across uncovered regions, balancing independents and chains. Include LA's northern/eastern/southern areas and OC's northern/central/coastal/southern areas; do not concentrate the entire pilot in Irvine or fill a quota with duplicate chain menus. Prioritize evidence quality over reaching 40.
- [ ] Inspect each official branch source and record concise facts, restrictions, locators, actual access outcomes, reviewer method, and date. Visually inspect images/PDFs before extracting item facts. Resolve addresses and county evidence using an authoritative geography source; retain unmatched/border cases as pending.
- [ ] Collect permitted public facts only. Keep blocked sources, disputed hours, old unlinked menus, no-evidence-found candidates, and confirmed closures in the review ledger. Avoid copying menus or third-party review text. Do not reuse the old collector for raw retention without a completed source policy check.
- [ ] Review all proposed admissions. Independently inspect at least 10 admitted records, stratified across county and media, plus all conflicts/ambiguous identities; if fewer than 10 are admitted, inspect them all. Label whether the independent review was another agent or a person. Expand the audit for any observed error class.
- [ ] Run all staged tests, staging validation, duplicate suggestions against the existing 100 records, and the batch report. Record actual admitted/pending/excluded counts, policy unknowns, missing geography, pricing coverage, and unresolved audit findings.
- [ ] Check `git status --short` and `git diff --check`. Inspect every added artifact for restricted responses, secrets, media copies, or unexpected files; tests do not establish a license. Confirm the existing build still lists only its original research files and nothing imports staging. Do not build the production dataset, commit, or deploy.
- [ ] Deliver the staged report and a proposed integration patch boundary. Shared schema/geography, build, matcher, origins, tests, and UI expectations must be agreed together before production integration. Request no cross-chat messaging unless the user explicitly authorizes it.

## Future API Discovery Contract

Keep this as a design seam, not a set of unused adapter implementations. The manual pilot provides the first concrete need and cost/yield measurements. Adding an API provider is a separate task after selecting the provider, approving its intended use and budget, and checking the applicable agreement.

Proposed common interface: `discover({ region, cursor, limit, signal, policy, budget }) -> { leads, nextCursor, diagnostics }`.

- `region` carries a verified geographic boundary reference and query parameters; provider bounding boxes are discovery filters, never authoritative county admission.
- `lead` carries provider name, permitted stable ID, permitted field values, per-field provenance, retrieval time, and policy reference. Omit fields whose retention is not allowed; do not assume a provider website URL or address can be stored indefinitely.
- `policy` records allowed purpose, fields, attribution, retention/expiry, export destination, and commercial-use conditions. A provider is disabled when those decisions are unresolved.
- `budget` carries `maxRequests` and an approved charge limit where charges are computable. Unknown pricing must not become zero. Keep credentials in a protected server-side environment, never browser code or repository files.
- `diagnostics` records requests, rate-limit or access failures, truncated result windows, charged amounts if known, and query scope. Do not retain raw responses as diagnostics. Stop at the approved request/charge limit; do not auto-upgrade subscriptions.
- `cursor` belongs to the provider and cannot be used to evade documented search caps. A page of results is never a claim that all restaurants in a region were discovered.
- Adapters return leads only. No provider can write accepted reviews, set primary happy-hour facts, or export into `src/data.js`. Any independent official-source research must comply with both the discovery provider's permitted use and the restaurant source's rules.

Evaluate Google Places, Yelp Places, Foursquare, OpenStreetMap-based services, and permitted public data against the same contract. API access does not by itself license persistent directory building. Rank options after checking permitted use/retention, missing-area yield, cost per useful lead, and branch-identity quality. Do not promise a provider's completeness, free tier, or current price from this plan.

## Deferred Integration and Operations

Separate follow-on plans will cover: county-aware publication replacing the DTLA admission circle; countywide origins and unchanged nearby-distance semantics; a reproducible browser performance check at 500 records; user/restaurant corrections; and optional refresh jobs with approved ownership, environment, retention, rate/cost limits, failure alerts, and pause controls. Submissions must enter the same evidence review, not bypass it. No runtime database or schedule is required to complete this isolated pilot.

## Plan Self-Review

- Admission, provenance, review transitions, duplicate suggestions, metrics, and public-storage constraints map to Tasks 1-5.
- Source fetching, paid adapters, automatic refresh, and production integration are deliberately deferred, not claimed as implemented by the manual pilot.
- Task interfaces use the same candidate/source/review contracts; workflow state remains distinct from field evidence status.
- Each of the five review risks has targeted verification; synthetic tests cannot replace source-policy review or factual audits.
- No step requires committing or altering shared files. Execution can proceed natively after the staged boundary is accepted; no separate user-owned chat is necessary.
