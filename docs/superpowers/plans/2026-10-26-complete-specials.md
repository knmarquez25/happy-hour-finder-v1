# Complete Published Specials Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task after design and plan approval. Steps use checkbox syntax for tracking.

**Goal:** Audit all 111 existing locations, capture their published specials as far as evidence allows, and clearly expose remaining menu gaps.

**Architecture:** Keep the existing research-to-generated-data pipeline. Add a venue-keyed coverage ledger, publish it as menuCoverage, and render general offers alongside itemized menus. Reuse current matching and money calculations rather than introduce live scraping.

**Tech Stack:** Plain JavaScript, Node 22+, node:test, existing Playwright browser checks.

**Spec:** `docs/superpowers/specs/2026-10-26-complete-specials-design.md`

**Status:** Draft for review; no implementation authorized by this document alone.

## Global Constraints

- Audit all 111 existing locations; do not add or silently remove restaurants.
- Never hand-edit generated `src/data.js` or countywide `accepted.json`.
- Unknown prices remain null; preserve evidence, restrictions, branch applicability, stable IDs, and withheld prices.
- Complete coverage means the cited published specials were fully reviewed at a stated date, not live restaurant confirmation.
- No runtime crawling, automatic paid calls, owner-review bypass, or deployment.

## Review Focus

- Menus with both itemized entries and broad offers must display both without duplicate selectable orders (Task 3).
- Tuesday/all-day/overnight offers must not qualify on unsupported days or after kitchen cutoff (Tasks 2 and 4).
- Unknown prices, conditional add-ons, and bundles must not produce false confirmed totals (Tasks 2 and 4).
- Blocked, conflicting, unreviewed or unreadable image-only, and secondary-only sources must not receive complete labels; readable official images/PDFs can qualify after visual review (Tasks 1 and 4).
- Countywide and original records must retain the same identities, coverage outcomes, and evidence after rebuild (Tasks 1 and 4).

### Task 1: Validate and publish menu coverage

**Files:** Create `research/menu-audit.json`, `scripts/menu-coverage.mjs`, `tests/menu-coverage.test.js`; modify `scripts/build-data.mjs`, `src/validation.js`.

**Interfaces:** `attachMenuCoverage(records, ledger)` returns cloned records with `menuCoverage: {status, reviewedOn, sourceIds, scope, gaps}` and throws on invalid ledger entries. Accept missing entries as unverified during migration; reject references to unknown venue/source IDs. No changes to countywide exports are required to attach coverage.

- [ ] Snapshot the 111 venue IDs into `research/menu-audit-baseline.json`; initialize ledger outcomes as unverified with explicit audit-pending gaps.
- [ ] Write failing unit tests for valid complete/partial/unverified coverage; reject impossible dates, missing primary evidence, complete-with-gaps, unknown IDs, and secondary-only complete claims. Assert build dates cannot change review dates.
- [ ] Run `node --test tests/menu-coverage.test.js`; confirm failure before implementation.
- [ ] Implement the helper and published-record validation according to the spec; attach coverage after combining original and accepted records, before record validation.
- [ ] Run the new tests, `npm run data:build`, and `npm run data:validate`; expect passing tests and all 111 baseline IDs retained.
- [ ] Commit the coverage contract and migration together, including generated data.

### Task 2: Prove the audit with both 33 Taps locations

**Files:** Modify `research/central.json`, `research/menu-audit.json`, and generated `src/data.js`; create `research/menu-audit-notes.md`, `tests/menu-audit.test.js`; extend `tests/discovery.test.js`, `tests/filters.test.js`, and `tests/time-filter.test.js` only where needed.

**Interfaces:** Research records retain existing menu item fields, `days`, `windowIds`, source references, and named hours windows. New facts enter existing discovery/menuSelection APIs unchanged.

- [ ] Reopen official menu, events, and both branch pages; record exact section locators, prices or nulls, daily schedules, kitchen limits, and branch applicability in audit notes. Review images/PDFs visually if needed.
- [ ] Write failing evidence-specific assertions for every identified 33 Taps happy-hour food/drink choice and daily offer. Test a newly added food search, an unknown-price selection, a bundle/add-on condition if published, and positive/negative daily and late-kitchen cases using the rechecked source's exact facts.
- [ ] Run the affected test files and observe the missing-items failures.
- [ ] Transcribe all identifiable specials, retaining explicit variants/quantities and unknown prices. Represent unsupported schedules as descriptive offers. Update food/drink tags and coverage with traceable evidence; resolve adjustment-file interactions before rebuilding.
- [ ] Rebuild and run affected tests plus data validation. If tests reveal a matching defect, reproduce it separately and make the smallest necessary correction in `src/discovery.js` or `src/matching.js`, with its own regression.
- [ ] Commit both audited locations, notes, regressions, coverage, and generated data together.

### Task 3: Show coverage and all saved offers

**Files:** Modify `src/discover-app.js` and `src/discover.css` if layout needs it; create `tests/menu-coverage-browser.cjs`; update `src/review-ui.js` only if necessary to preserve its existing unverified wording.

**Interfaces:** `renderMenu(v)` consumes existing `menuItems(v, preferences)`, `happyHourListings(v)`, and `v.menuCoverage`. General offers remain non-selectable descriptive text; item selections retain current subtotal behavior.

- [ ] Add a browser fixture with both itemized entries and general offers, plus complete, partial, unverified, and missing-coverage cases. Assert both sections render, labels/source/date are visible, missing metadata falls back to verification wording, and category summaries add no selectable duplicate.
- [ ] Run the new browser test against the existing app; confirm expected failures.
- [ ] Remove the mutually exclusive item/offer rendering branch. Show coverage text and prominent source links beside menus, with exact labels from the spec and explicit gaps for partial/unverified records. Complete wording refers to the cited review date.
- [ ] Run the browser regression at mobile and desktop widths, keyboard-toggle menus, and select known/unknown-price items. Run `tests/local-squeeze-browser.cjs` and `tests/filters-browser.cjs` against the running preview.
- [ ] Commit menu presentation and browser coverage together.

### Task 4: Audit every remaining location and report outcomes

**Files:** Modify original `research/{dtla,west,north,central}.json`, applicable `research/record-adjustments.json`, countywide candidate/source/review files, ledger, notes, and generated outputs; create `scripts/report-menu-audit.mjs`, `research/menu-audit-report.md`; extend `tests/menu-audit.test.js`; update README coverage wording.

**Interfaces:** `scripts/report-menu-audit.mjs` reads baseline IDs, built records, and ledger; writes a per-location report and rejects missing/extra IDs. Outcome totals must sum to 111. Historical evaluation cases and gold labels stay unchanged.

- [ ] Write failing audit-integrity tests: exact baseline ID equality, every venue has a final outcome and traceable scope/gaps, complete evidence requirements, unknown price preservation, valid window/source references, and countywide withheld-price rules.
- [ ] Audit the remaining restaurants by geographic group. For each, inspect all relevant official happy-hour and recurring daily-special sections, compare every identifiable choice against saved data, and document inaccessible or ambiguous sections. Use branch evidence before reusing a chain menu. Do not mark a source reviewed merely because it was fetched.
- [ ] After each group, update facts in their original research inputs, ledger and notes; add source-specific search/schedule/selection regressions when new offer structures warrant them; regenerate countywide accepted output when changed, then rebuild and validate. Commit each reviewed group with its generated outputs.
- [ ] Implement the report script; verify it accounts for all 111 IDs and shows status, saved-item count, review date, sources, and gaps. No pending-audit placeholders may remain; unavailable sources are explicit unverified outcomes.
- [ ] Run `npm test`, `node --test research/countywide/tests/*.test.mjs`, `npm run data:validate`, and the new coverage browser test. Run existing discovery, filter, and local-squeeze browser regressions against the running preview; run `git diff --check`.
- [ ] Review the finished diff against the spec and official-source notes. Resolve substantive findings, regenerate the report, and commit final documentation. Report actual outcome counts and checks; keep unavailable menus and live availability explicitly unresolved.

## Handoff

Recommended execution: implement in this chat, with 33 Taps validating the approach before repeating it across the remaining records. The full audit is the agreed scope; missing source access is a documented audit result, never permission to invent a menu. Request review of these draft documents before implementation.
