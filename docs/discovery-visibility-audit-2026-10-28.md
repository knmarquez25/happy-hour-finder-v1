# Discovery visibility audit — October 28, 2026

Scope: researched menu filtering, saved extra discoveries, city/county matching,
web retrieval requests, schedule exclusions, menu refreshes, and search retries.
Changes are local and have not been deployed by this chat.

## Reproduced and fixed

| Failure | Result after the fix | Regression coverage |
| --- | --- | --- |
| Saved `Downtown` / `DTLA` records disappeared for `Downtown LA`; `Pasadena, CA` did not match `Pasadena`. | Whole geographic components and supported aliases match in both local extra-place filtering and saved-source retrieval. Hollywood still does not match West Hollywood. | `tests/discovery-audit.test.js` |
| County searches excluded known cities when the saved county was missing. | The existing county-city directory supplies county eligibility for known cities such as Pasadena and Irvine. Explicit county metadata remains authoritative; unknown locations do not gain a county. | `tests/discovery-audit.test.js` |
| Choosing a city removed food/drink criteria from the web retrieval request. | Retrieval retains the original craving while broadening time constraints for source discovery. The extraction request still receives the complete original request, and explicit schedule conflicts are checked separately. | `tests/discovery-audit.test.js`, existing search tests |
| `Mon–Thurs`, `Tues–Fri`, and `Weds–Fri` could falsely exclude Thursday happy hours. | Common abbreviations, including periods, parse correctly. A Friday request still conflicts with a Monday–Thursday offer. | `tests/discovery-audit.test.js`, schedule tests |
| A successful menu lookup updated menu rows but left the old possible-match label and ordering. | Filtering, labels, counts, and ordering are refreshed together, preserving owner form edits. | `tests/discovery-audit-browser.cjs` |
| A menu held in a separate in-memory cache overrode newer shared queue data. | The page consistently reads the current saved lookup, including its identity and expiry checks. The redundant menu cache is removed. | `tests/discovery-audit-browser.cjs` |
| Starting another web search erased unsaved discoveries; a failed retry left an empty list. Later responses replaced earlier session results. | Session discoveries survive retries and accumulate across searches. Matching saved records replace their unsaved copies without duplicates. Clearing the search still resets session discoveries. | `tests/discovery-audit-browser.cjs` |

The earlier Espresso Martini fix remains: literal choices supported by the same
source excerpt survive a less complete extraction. Generic martini leads are
clearly marked as possible matches and sort behind explicit Espresso Martini
listings. A different specific cocktail alone is not an espresso match.

## Verification

- Full `npm test`: **196 passed, zero failed**.
- Discovery audit browser: menu labels/order, shared-queue refresh, failed retries,
  accumulating unsaved results, and later-save deduplication passed.
- Espresso discovery browser: immediate saved exact/possible matches and empty or
  failed online searches passed.
- Time-filter browser: filter combinations, imports, saved scope, owner guards,
  and desktop/mobile layouts passed at 1280px and 390px.
- Review browser: owner approval snapshot, reload persistence, evidence handling,
  and 390px/320px layouts passed.
- Manual-menu browser: explicit lookup behavior and owner sign-in race passed.
- Dropdown reselection browser: City, Food, and Drinks replacement, cancellation,
  clearing, mouse, and keyboard passed.
- Checked all **749** currently eligible researched food/drink choices by their
  listed names: each retained its venue in discovery results.
- `git diff --check` passed.

Provider calls were controlled in the new regression tests. These checks prove
the app's filtering and retention behavior; they do not guarantee that a live web
provider will find every relevant restaurant. Source confidence, seating
restrictions, incomplete menus, and real schedule conflicts still affect results.
Unrelated menu-data and UI edits already in the workspace were preserved.
