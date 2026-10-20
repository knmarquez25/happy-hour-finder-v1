# Countywide Local Integration Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans; implement and verify inline. Parallel, disjoint restaurant research can proceed independently.

**Goal:** Integrate a first reviewed expansion batch into local app data, replacing the DTLA dataset admission circle with evidence-backed LA/OC county admission while retaining the user's 25-mile nearby-search radius.

**Architecture:** Keep legacy research intact. Load additional reviewed records from a dedicated file generated from accepted staging candidates. New records require government county/coordinate evidence and current official happy-hour evidence. Preserve legacy 25-mile admission only for original records without county annotations until individually geocoded; new records never inherit that exception. A pure coverage predicate is shared by validation and matching.

**Tech Stack:** Existing JavaScript ESM/Node, offline JSON, static browser modules, public US Census geography geocoder. No commercial APIs or hosted services.

**Spec:** Prior countywide design and the user's explicit scope approval in this chat: “Yes—integrate verified additions locally; don’t deploy.”

## Constraints and Calls

- Allowed edits: research, data build, county validation, matching coverage rules, location origins, generated data, relevant tests/docs. Do not edit index.html, src/app.js, or src/styles.css. No commit/push/deploy or cross-chat messages.
- The UI's current hardcoded coverage description will remain a known labeling limitation for the UI owner; adding county-aware origins works through its existing dynamic origin selector.
- Continue honest source provenance and unknown prices. Independent factual summaries are not menu/media copies or a claim of a restaurant-granted content license. Inspect actual terms; exclude new imports from sources with restrictive use terms. Keep raw archives denied.
- Census unmatched/boundary cases stay pending. No guessed coordinates, county labels, days, prices, or end times. Current source advertisement is not same-day confirmation.
- The first expansion batch aims at up to 12 new branches across LA/OC, subject to evidence and policy review; this is an incremental step toward the previously proposed 40/500 targets, not a complete county census.

## Review Focus

- New OC data must be searchable from an OC origin, without changing the nearby radius cap.
- Fake/unknown/outside-county admission evidence cannot bypass validation merely by attaching a county string.
- The old 100 records and historical benchmark remain unchanged; legacy geographic fallback cannot admit arbitrary new unverified branches.
- Staging acceptance must bind current source/candidate content, restriction applicability, and documented policy decisions.
- Generated expansion must be reproducible and must never include unresolved or closed staging candidates.

## Task 1 — Source and Geography Evidence

- [ ] Research disjoint LA and OC candidates from current official sources; inspect restrictions/terms and retain concise factual observations only.
- [ ] Government-geocode exact branch addresses using Census geographies; retain matched address, coordinate precision, benchmark/vintage, county GEOID, review date, and exact query URL.
- [ ] Populate staging and append review decisions; preserve failures and shortfalls. Independently source-review proposed admissions before integration.

## Task 2 — County Admission and Origins

Files: src/locations.js, src/validation.js, src/matching.js; tests/countywide.test.js, relevant existing data tests.

- [ ] Write failing tests for a verified OC branch outside the DTLA circle qualifying near an OC origin, an unsupported county claim failing, a verified outside-county record failing, unknown coordinates failing, and unchanged 25-mile user radius validation.
- [ ] Add exported coverageEligibility(record) -> {included, reason, basis} in locations.js. Existing records with no county use explicit legacy coverage IDs plus their original radius; new county records require reviewed government source membership evidence for 06037/06059 and valid proven coordinates.
- [ ] Use the predicate in shared validation/matching. Keep straight-line travel filtering and existing item/time/restriction behavior.
- [ ] Add documented geographic origin references from reviewed government coordinates for newly covered research areas, using the existing origins interface. No UI file edits.
- [ ] Run targeted tests, then the complete existing suite.

## Task 3 — Accepted Staging Export and Build

Files: research/countywide/tools/export.mjs; research/countywide/tests/export.test.mjs; research/countywide/accepted.json; scripts/build-data.mjs; src/data.js.

- [ ] Write failing tests that pending/restricted/closed records cannot export, admitted records preserve source status/unknown cents and government provenance, and source-linked geography survives export.
- [ ] Implement exportAcceptedBatch(batch,{now}) -> {records,excludedIds,pendingIds}. Validate first; emit only accepted staging candidates using the existing app schema plus county evidence. Default CLI stdout; explicit --output supports only the dedicated accepted.json artifact, never browser code.
- [ ] Build reads accepted.json only, validates all records with the coverage predicate, and writes src/data.js as before. Metadata distinguishes legacy/published county counts and review dates without claiming completeness.
- [ ] Verify build determinism, admission/price/restriction tests, data validation, and search flows from each added origin. Run unchanged benchmark/holdout only as regression checks, without editing fixtures or tuning to holdout.

## Task 4 — Review and Handoff

- [ ] Fresh read-only code/data review; fix material findings with regression tests.
- [ ] Verify no UI edits, no branch/commit/deploy side effects, unchanged original research records, and exact before/after integrated record count.
- [ ] Report integrated additions separately from researched/pending cases and name any remaining UI label or source limitations.
