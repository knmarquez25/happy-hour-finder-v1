# Execution Ledger: 2026-10-19-happy-hour-improvements.md

Baseline SHA: 865f3c9b4a1ce436d56eb0ab9afbb55938c44fc8. Original six tests passed in prior inspection. Only agent-authored docs were untracked at start.

Preflight interfaces: research schema -> migration/validation; coordinates -> geodesic distance; evaluated matches -> UI/evaluation; frozen legacy modules -> baseline adapter. Each has a single owner and no conflicting write set. Tasks 1-5 are self-consistent with the approved design.

Implementation is on feature branch `codex/happy-hour-improvements`; original SHA is preserved. No worktree was created and no git commits/push/deployment performed.

Task 1: complete. Frozen original data/scoring/presets and SHA; 15 development + 5 held-out cases defined before regional research outputs. Evaluation rubric tests observed failing then passing; all six historical tests now run against baseline imports unchanged in behavior.

Task 2: complete. 28 originals + 24 west + 24 north + 24 central = 100 physical venue records. All 100 coordinates checked within the radius; 73 have primary-supported schedules, 38 contain priced primary food/drink records (not necessarily unrestricted qualifying combinations). FIG marker was directly verified on the operator location page after Census no-match. Automated DTLA collection checks robots, caches evidence, and requires review. Regional research documented primary/secondary/conflicting/unknown evidence and item completeness. Schema tests RED -> GREEN.

Task 3: complete pending whole-branch review. New engine lives in `src/matching.js` to keep original module untouched; browser imports the new engine. 15 matching tests RED -> GREEN, including budget flexibility, unknown prices, real distances, item applicability, required preferences, overnight and end-exclusive boundaries. No invented reputation component.

Task 4: complete. Focused list, source details, flexible budget, supported-origin selection, sorting, shortlist capped at three, persisted selection, separate alternatives, and theme switch. Browser regression passes all interactions and bounds checks at 1280/1060/736/390/320, including corrupt storage and keyboard-focus retention.

Task 5: complete. Independent gold labels and hard-validity labels supplied without reading engine/UI/ranking outputs; material sources reopened and evidence gaps retained. Development baseline 1/15 -> 12/15; positive cases 0/11 -> 8/11; negative controls 1/4 -> 4/4. Holdout 0/5 -> 4/5. These are small source-evidenced search benchmarks, not citywide accuracy. Reports and class-post draft generated from raw outputs and file hashes.

Final review: fresh read-only reviewer identified two important matching defects: venue-wide preference tags could credit unavailable late-night items; combo windows could intersect on an inactive or conflicting window. Both reproduced with failing tests, fixed, and verified GREEN in the complete 38-test suite. A further paired-offer regression prevents Friday oyster pricing from pairing with an unrelated drink. Shared active primary permitted window now required for both combo items; scoring and explanations use available supported item tags. No residual important code findings remain known. Reviewer declined real-time restaurant accuracy/exhaustiveness and historical independence beyond repository evidence; those limitations are explicit in the report, not claimed as verified.

Release update: implementation committed on `codex/happy-hour-improvements`. User authorized publication, but git push failed for missing credentials and the GitHub connector rejected writes with HTTP 403. No deployment or production replacement occurred. Local preview at http://127.0.0.1:4174/.

Implementation choices: baseline-only test imports preserve old expected behavior; intermediate legacy comparison omitted because new records lack its comparable reputation/estimate inputs. No neutral ratings or estimates fabricated to force a staged score. These choices limit causal attribution of bundled improvements.
