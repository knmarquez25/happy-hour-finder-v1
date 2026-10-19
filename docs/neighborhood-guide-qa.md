# Neighborhood Guide QA

## Published Acceptance

October 19, 2026: final scoped re-review accepted `4e7846c` with no new findings. GitHub release `274a0316d4881d61ff90f2d013d20d2576679570` has the exact tested local tree. Pages workflow `39334866103` completed successfully. Both suites were then rerun with `PREVIEW_URL=https://knmarquez25.github.io/happy-hour-finder-v1/`: browser regressions passed across all six widths with no bounds violations or page errors; QA passed 126 checks with no errors or failed same-origin assets. Fresh controller unit run passed 46/46. These release results supersede the historical pending-status notes below. Photo, cross-browser, permissions and restaurant-data limitations remain unchanged.

Fresh verification: October 19, 2026, `codex/neighborhood-guide`, application HEAD `77e8fbc`. Task 1 and Task 2 passed their independent gates, including the dark-mode tray hover correction. This document supplements the historical `qa-review.md`; it does not repeat its dependency-audit claim as a fresh audit.

## Commands And Results

All commands below exited 0 in the isolated neighborhood-guide worktree. The existing local server was used; Chrome commands ran with escalated execution.

| Command | Fresh result |
| --- | --- |
| `npm test` | 46 passed; 0 failed, cancelled, skipped or todo |
| `npm run data:validate` | 100 records, 100 geocoded, 73 primary-supported schedules, 38 with priced primary-source food and drinks |
| `npm run evaluate` | Baseline 1/15; improved 12/15; positive 8/11; negative 4/4 |
| `npm run evaluate:holdout` | Baseline 0/5; improved 4/5; positive 3/4; negative 1/1 |
| `PREVIEW_URL=http://127.0.0.1:4175/ npm run test:browser` | Passed; six widths: 1440, 1280, 1060, 736, 390, 320; no bound violations or page errors |
| `PREVIEW_URL=http://127.0.0.1:4175/ npm run test:qa` | 126 checks; no page errors or failed same-origin assets |
| `git diff --check` | No output; passed |

Development failures remain `dtla-weekend`, `glendale`, and `burbank`; holdout failure remains `holdout-dtla-close`. Scores are unchanged, not improved by presentation work. These small source-reviewed suitability benchmarks do not establish overall restaurant accuracy.

## Presentation And Workflow Evidence

Reviewed the presentation/workflow diff from `c4d0ceb` through `77e8fbc`, including source distinctions, escaping, native disclosures, image error handling and tray interactions. No new concrete app defect was found in this local pass. Independent whole-branch review remains pending.

Fresh browser regressions cover automatic alternatives on a new no-match search, unchanged filters, manual collapse surviving sort/save, score details, three-spot cap/persistence/removal and responsive bounds. QA exercises failed-image and blocked-font fallbacks, expanded details, dark mode, long names and visible labels. Dark tray removal hover computed foreground and icon contrast: **13.93832740380111:1**, above the asserted 3:1 non-text threshold. This is a targeted contrast assertion, not an accessibility certification.

Generated local evidence is in `test-results/browser-report.json`, `test-results/qa-report.json` and associated screenshots. The desktop screenshot was inspected for source/price distinctions and photo/fallback presentation; the mobile-top capture was inspected for retained search controls. Mobile retains the real controls, so initial results require scrolling. Prior Task 2 visual and review evidence is retained locally, not reclassified as new manual testing here.

The branch diff leaves the matching engine, restaurant data, gold labels, frozen cases and baseline unchanged. Fresh evaluation commands produced no tracked report changes. Task 3 changes only documentation and index cleanup.

## Final Scoped Focus Correction

October 19, 2026, based on `6a1d999`: the final reviewer identified insufficient dark-mode tray keyboard-focus contrast. The shared pink focus outline (`rgb(255, 157, 150)`) against tray yellow (`rgb(242, 218, 101)`) was reproduced at **1.4257400567508962:1** on all three removal buttons and Compare all. The previous hover fix remained valid.

The browser regression uses real `page.keyboard.press("Tab")` navigation, with the pointer moved off the tray. Before changing CSS, it collected all four `:focus-visible` controls and failed the >=3:1 assertion (exit 1). Each had a solid 2px outline with 4px offset, confirming contrast rather than missing focus was the defect. A tray-specific `outline-color: #20221e` override now produces **11.453192382083667:1** for every control, retaining width/offset and leaving the hover rule unchanged. The regression also requires four distinct focused controls and a visible solid outline.

Fresh post-fix verification: `PREVIEW_URL=http://127.0.0.1:4175/ npm run test:browser` passed all existing workflows and six responsive widths, with no bounds violations or page errors; `npm test` passed 46/46; `PREVIEW_URL=http://127.0.0.1:4175/ npm run test:qa` passed 126 checks with no page errors or failed same-origin assets. Both browser commands used escalated installed Chrome. Hover foreground/icon contrast remains **13.93832740380111:1**. The generated `test-results/browser-report.json` includes per-control focus evidence; `test-results/dark-tray-focus.png` was inspected for the Compare all outline. This is targeted regression evidence, not comprehensive accessibility certification.

Only CSS, its direct browser regression, and this QA document are committed for the correction. No engine, dataset, gold labels, evaluation criteria, or baseline changes were made. Full RED/GREEN evidence is retained locally at `.superpowers/sdd/2026-10-19-neighborhood-guide/final-fix-report.md` without force-adding ignored reports. Parent-owned scoped re-review and release acceptance remain pending; no publish, merge, or subagent dispatch was performed.

## Limits And Release Ownership

- There are **four photos, not 100**: Perch LA, L&E Oyster Bar, Foothill Restaurant and Inkwell Tavern. Other venues use a named, non-photographic fallback. Photos are display-only and do not establish menu prices or matching confidence.
- Photos load from external operator/CDN URLs with restaurant source links. Operator-page identity checks were completed during Task 2; ownership/reuse permissions were not independently established. Availability and third-party changes remain external risks.
- Barlow Condensed and DM Sans load through Google Fonts; local fallback fonts remain available. Blocked external fonts/images are tested, but external requests are not guaranteed available by a clean same-origin asset check.
- Coverage is installed Google Chrome through Playwright only. Safari, Firefox and manual screen-reader acceptance are unverified. Passing tests is not accessibility certification or live restaurant/menu confirmation.
- Local verification is complete. Final whole-branch review, integration/publishing, Pages deployment and live acceptance belong to the parent and remain pending. No publish, merge, remote fetch or cross-chat message was performed by Task 3.
- The accidentally tracked Task 2 coordination report was removed from the index only with `git rm --cached`; its ignored local copy remains available to reviewers.
