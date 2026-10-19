# Neighborhood Guide Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Apply the approved neighborhood-guide design to the full app and automatically reveal honest alternatives for no-match searches.

**Architecture:** Keep the existing matching engine and dataset unchanged. Replace the presentation shell/CSS and focused render functions; isolate source-attributed photography in a display-only manifest. Open alternatives on a new zero-match search, not on every list rerender.

**Tech Stack:** Existing static HTML, CSS, ES modules, vendored Lucide, Node tests, Playwright/Chrome, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-10-19-neighborhood-guide-design.md`

## Global Constraints

- No replacement of the deterministic engine with mockup filtering or sample data.
- Maintain all 100 researched venues, flexible budgets, exact prices/unknowns, source distinctions, and the frozen evaluation data.
- Typed preferences remain required by default, with explicit soft-preference opt-out.
- Photograph only the actual named venue, include attribution, and provide a non-photographic fallback.
- Preserve dark mode, keyboard access, reduced-motion handling, shortlist persistence/cap, and clear source/schedule restrictions.
- Alternatives never silently change filters or claim inactive happy hours are active.

## Review Focus

- No-match searches must automatically reveal alternatives, including when a prior search had matches.
- Manual collapse must survive sorting and saving within the same search.
- Failed media/fonts must not break the page or display a different venue.
- Long names, expanded details, and the saved tray must not overflow or occlude controls at narrow widths.
- Moving match scores must not break sort tests or confuse displayed prices with discount amounts.

## Task 1: Automatic Alternatives

**Files:** `src/app.js`, `tests/browser.cjs`, `tests/qa.cjs`.

**Interface:** Continue consuming `searchRestaurants(...).matches/alternatives` and existing failure reasons. Set the `#alternatives` open state in `runSearch()` only. `renderLists()` must not reset a user's disclosure choice.

- [x] Add browser assertions: typing an impossible food reveals visible alternatives and failure reasons without clicking the disclosure; the food input, time, radius, and budget remain unchanged.
- [x] Add a regression: manually collapse alternatives, change sort/save a venue, and verify the disclosure remains collapsed. A fresh no-match search opens it again.
- [x] Run the regressions and confirm they fail before implementation.
- [x] Implement the open-state behavior and rename the section Other spots to consider.
- [x] Re-run browser/unit tests, inspect the no-match state, and commit the verified change.

## Task 2: Production Neighborhood-Guide Layout

**Files:** `index.html`, `src/app.js`, `src/styles.css`; create `src/media.js` and `tests/media.test.js`; extend `tests/browser.cjs` and `tests/qa.cjs`.

**Interface:** `src/media.js` exports a `venueMedia` map keyed by existing venue ID, with `{url, sourceUrl, alt}` records. It is display-only. Keep existing form names, control IDs, result containers, `.price`, `.budget-difference`, `.venue-meta`, and save/remove attributes where practical.

- [x] Add failing checks for the masthead, visible compact search controls, contenders tray count/removal, score breakdown inside details, and actual-venue media/fallback behavior.
- [x] Rebuild the header and responsive search strip from the approved mockup while preserving all existing controls and labels.
- [x] Rework venue rendering into photo/typographic listing, restaurant title, schedule, deal, source/menu action, save action, and expandable details. Keep alternative failure reasons prominent. Add source-attributed media for reviewed venues only.
- [x] Add the compact contenders tray and preserve full three-spot comparison, persistence, and focus after rerender. Avoid covering controls on mobile.
- [x] Replace the old sidebar/card styling with responsive grid/dividers and the approved palette/type. Retain accessible dark tokens and fallback fonts.
- [x] Verify an intentionally failed image produces a stable readable fallback. Check images are the actual venue, not generic stock or a mispriced regular-menu dish.
- [x] Run unit tests and both browser suites; inspect desktop, tablet, mobile, dark, expanded-details, shortlist, and no-match screenshots. Commit verified changes.

## Task 3: Review And Release

**Files:** Updated QA/design notes and any fixes directly required by review.

- [x] Run `npm test`, `npm run data:validate`, `npm run evaluate`, `npm run evaluate:holdout`, `npm run test:browser`, `npm run test:qa`, and `git diff --check`.
- [x] Review the complete presentation/workflow diff for source integrity, accessibility, failed-media states, and disclosure/tray interactions; fix important findings with regressions.
- [x] Fetch GitHub main and publish only a verified fast-forward update; do not overwrite unrelated changes or force-push.
- [x] Wait for Pages deployment success, then run both browser suites against the live URL using `PREVIEW_URL`.
- [x] Report the published URL, test results, and any remaining media/browser/data limitations.

Release completed October 19, 2026. Independent final review and scoped re-review accepted the focus correction at `4e7846c`. The controller published identical tree `aa5c59f681757d1c71c31e2fcb1f39a2d1cc8142` as GitHub commit `274a0316d4881d61ff90f2d013d20d2576679570`, confirmed Pages success, and passed both live browser suites (126 QA checks). See `docs/neighborhood-guide-qa.md` for evidence and limitations. Other-chat files were preserved; no cross-chat message was sent.

## Plan Review

The spec is covered by the three tasks. The matching engine, curated data, and gold evaluation labels remain unchanged; only presentation and disclosure workflow change. The approved method is subagent-driven execution with independent Task 1/2 gates, a Task 3 local-verification worker, and a parent-dispatched final whole-branch review. The parent owns integration, publication and live acceptance.
