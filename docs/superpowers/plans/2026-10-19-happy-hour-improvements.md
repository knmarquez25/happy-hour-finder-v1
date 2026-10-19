# Happy Hour Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the approved Focused list experience with 100 researched venues, honest prices, flexible budgets, and reproducible evaluation.

**Architecture:** Keep the static GitHub Pages application. Import curated structured records, calculate source-aware eligibility and relevance in pure modules, render accessible responsive search/results, and run evaluation offline against frozen baseline modules. Research tasks own separate geographic data files while app implementation stays local.

**Tech Stack:** HTML/CSS/ES modules, Node test runner, small vendored browser distributions of established icons/geodesic utilities, optional offline Node collection tools.

**Spec:** `docs/superpowers/specs/2026-10-19-happy-hour-trust-and-coverage-design.md`

## Global Constraints
- Target 100 distinct venue locations within 25 straight-line miles of DTLA reference 34.0505, -118.2551; report researched vs fully supported counts separately.
- Budget is flexible, no strict mode or cost-based exclusion. Subtotals are before tax/tip.
- No invented facts, coordinates, verification, ratings, or final evaluation scores.
- Required constraints are time, distance, neighborhood, selected must-haves; uncertain evidence remains visible as alternatives.
- Keep the published baseline unchanged until an explicit release step. Preserve static GitHub Pages compatibility.

## Review Focus
- Native controls must remain usable at 320px and have no clipped time/location values.
- Unknown prices must never become zero or masquerade as budget matches.
- Overnight hours and exact closing times must not incorrectly qualify.
- Source uncertainty and conditional offers must not be erased by migration or UI labels.
- An empty result set must not inflate evaluation success on positive cases.

## Files and Interfaces
- `evaluation/baseline/{data,scoring,presets}.js`: frozen original modules and SHA metadata.
- `evaluation/cases.json`: fixed inputs and independently reviewed acceptable results; separate holdout file.
- `research/{west,north,central}.json`: disjoint researched venue records using `research/SCHEMA.md`.
- `src/venues/*.json` and `src/data.js`: reviewed records, legacy migration, and browser-ready dataset export.
- `src/locations.js`: supported origins and `distanceMiles(origin, coordinates)` backed by established library.
- `src/scoring.js`: `evaluateRestaurant(venue, request)`, `searchRestaurants(venues, request) -> {matches, alternatives}`, `selectCombo(venue, request)`, existing time formatting exports.
- `src/app.js`, `src/styles.css`, `index.html`: approved responsive Focused list, source details, sorting, shortlist.
- `scripts/validate-data.mjs`, `scripts/collect-sources.mjs`, `scripts/evaluate.mjs`: offline evidence tooling, validation, evaluation.
- `tests/*.test.js`, `tests/browser.cjs`: unit and browser regression coverage.
- `docs/evaluation-report.md`, `docs/class-post.md`: measured evidence and class-ready draft.

### Task 1: Preserve Baseline and Lock Evaluation
- [ ] Freeze baseline modules mechanically from SHA 865f3c9b4a1ce436d56eb0ab9afbb55938c44fc8; record original test output.
- [ ] Define 15 development and 5 held-out searches before research outputs or tuning, including source review instructions.
- [ ] Write tests proving fixture integrity and that positive empty outputs fail evaluation.
- [ ] Run baseline, preserving raw outputs. Never backport new logic to its adapter.

### Task 2: Collect, Validate, and Expand Data
- [ ] Dispatch three bounded research tasks of 24 new venues each, separate geographic ownership, no code changes.
- [ ] Review/migrate the 28 originals, retaining all unverified legacy values only as explicit estimates.
- [ ] Test schema: duplicate branches, source/price references, valid windows, null prices, coordinate provenance, radius exclusion.
- [ ] Implement validation and collection with bounded requests, robots/access checks, cached artifacts, and manual review before acceptance.
- [ ] Geocode addresses through a documented public service; keep missing or inaccurate matches uncertain. Count only actual coordinate-confirmed locations in the radius count.

### Task 3: Implement Pure Matching
- [ ] Write failing tests for combo arithmetic, unknown prices, flexible budget, required filters, evidence levels, overnight/end-time boundaries, matching explanations, ordering, invalid inputs.
- [ ] Run those tests and confirm failures before replacing implementation.
- [ ] Implement selection/evaluation/search with explicit failures and price comparisons in integer cents; use proven geodesic utility for distances.
- [ ] Run all pure tests; preserve original tests under baseline coverage rather than changing historical expected outputs.

### Task 4: Build Focused List UI
- [ ] Add browser assertions for compact form, actual origin-based distances, sort, flexible budget differences, details, source links, comparison up to 3, persisted shortlist, empty states, and malformed stored state.
- [ ] Implement the approved mockup with icon buttons, readable source status, explanatory preference matches, and optional must-haves.
- [ ] Verify desktop/mobile screenshots, 320px/390px/736px/1060px bounds, keyboard input, and dark appearance.

### Task 5: Evaluate, Review, and Deliver
- [ ] Review gold labels independently against frozen sources; keep budgets as relevance labels, not hard requirements.
- [ ] Produce baseline and after scores on unchanged cases, positive/negative breakdown, source audit, unknowns, and held-out results. Document any intermediate stages that cannot be faithfully compared.
- [ ] Run unit/data/browser checks and a fresh independent code review; fix meaningful defects with regression tests.
- [ ] Update README, collection limitations, evaluation report, and six-step class-post draft.
- [ ] Start a local preview on an available port and share its URL. Do not push or deploy without a release request.

## Execution Ledger

Progress is recorded in `docs/superpowers/plans/2026-10-19-happy-hour-progress.md`. The user's latest request explicitly authorizes implementation of the approved design; proceed without another plan approval round. No commits or publishing are implied.
