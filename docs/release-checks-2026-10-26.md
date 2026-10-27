# Release checks — October 26, 2026

## Scope

Current Happy Hour Finder release: Local Squeeze styling, bundled fonts, venue photography/fallbacks, local independent menu filters with dynamic suggestions/counts, same-page provisional discoveries, explicit AI/web/menu actions, existing source-aware discovery and owner review. The user authorized testing, code review, and pushing to the default `main` branch.

## Verification

- `npm test`: 138 tests, 138 passed, zero failures.
- `npm run data:validate`: 111 valid/geocoded venue records, 84 primary-supported schedules, 44 venues with priced primary-source food and drinks.
- Production Node server on port 4179 used for discovery, filter, owner review/approval, explicit menu lookup, responsive layout, image failure and Downey scope browser checks. Cross-origin browser test uses its own Node servers. All provider requests in these checks are fixtures; no live AI/search charges, evidence writes or approvals are generated.
- Desktop and 320/390px layouts inspected; formatting and repository credential-pattern scan checked.

## Review fixes

1. The Node static allowlist omitted bundled fonts. Added a strict six-file `.ttf` allowlist with font MIME type. New test failed with404 before the fix and passes afterward, including HEAD and private-file checks.
2. Failed online discovery could replace owner corrections with original menu values. The error path now preserves owner form nodes. Browser regression failed with the edited value reset to Martini and passes with corrections retained.
3. Image fallback regression used a moving locator that selected a different card as image links were removed. The test now anchors a stable venue; fallback behavior remains unchanged.
4. Font license text line endings normalized to LF without changing license wording.

## Integration

Preserve origin/main’s existing removal of project write-up navigation, references, generated content and page. No credentials or production configuration values are added.

## Concurrent-main integration

During publication, origin/main advanced to8def93b with the AI/menu-source and time-period feature PR. Publication was stopped by the expected-head check. The new backend, public-source reader, source context/address preservation, cached discovery retrieval and time-period behavior were integrated into the filter-first UI. The public menu-link form remains explicit; imported places are labeled provisional, including when newly submitted records are outside current filters.

The source schedule parser now lives in `src/request-schedule.js` and is re-exported from its original server path, sharing identical conservative schedule checks with local extra-place filtering. The code-review finding that Anywhere online retrieval dropped Orange County was reproduced and fixed; dual-county queries retain broad retrieval.

Final combined verification:163 Node tests passed, all111 records validated, and nine browser flows passed (filters, discovery, owner review, explicit menu lookup/races, Local Squeeze layout, image fallback, Downey scope, cross-origin, and time-period/menu import). No remaining important review findings.
