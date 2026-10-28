# Menu and discovery release — October 28, 2026

Reviewed against main `3a0f729efbcaa8fa2a333293a8eb400e85985afb`.

## Included work

- Four pending menu-audit commits through `2ca5580`, plus reviewed follow-up fixes.
- Coverage metadata and source links for all 111 original venues; 969 saved item choices. Outcomes remain explicit: 2 complete, 63 partial, 46 unverified.
- Itemized choices and general offers appear together. Unknown prices, kitchen cutoffs, daily applicability, seating restrictions, and owner approval protections remain enforced.
- Exact menu-item searches, restored broad category tags, dropdown reselection, and clearly labeled possible Espresso Martini discoveries.
- Shared city/county matching, retained food/drink web criteria, common weekday abbreviations, current queue menus, and preservation/deduplication of unsaved discoveries across retries.

## Review and verification

Independent code review found and resolved missing category tags and stale in-memory menu data. Regression tests demonstrated the category failures before correction. No actionable blockers remain after follow-up review.

- `npm test`: 196 passed, zero failed.
- `node --test research/countywide/tests/*.test.mjs`: 49 passed, zero failed.
- `npm run data:build` and `npm run data:validate`: 111 valid/geocoded venues, 88 primary-supported schedules, 52 venues with priced primary-source food and drinks. Rebuilding preserves source review dates.
- Browser checks cover dropdown reselection, menu coverage, filters, discovery, owner review, explicit menu lookup, responsive Local Squeeze layout, photos/fallbacks, Downey scope, day/time filters, exact/possible espresso matches, queue refresh/retry behavior, and cross-origin API requests.
- Prettier checks for changed runtime/test files and `git diff --check` passed.

Provider calls in automated regressions use fixtures. These checks do not independently revalidate all 111 live restaurant sources or establish live availability. The audit ledger retains incomplete and inaccessible-source gaps.

Publication and live deployment must be verified separately from local tests.
