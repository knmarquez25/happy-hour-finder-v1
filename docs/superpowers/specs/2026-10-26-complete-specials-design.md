# Complete published specials across the researched list

Date: 2026-10-26 (America/Los_Angeles)

Status: Proposed design for review; implementation has not started.

## Intent and scope

The user wants the whole specials list rather than a few example items, and selected an audit of all 111 researched restaurant locations. Audit every existing location; do not expand the restaurant count as part of this work. Use 33 Taps Silver Lake and West Hollywood as the first end-to-end examples, then cover the remaining records.

The present records for those two locations contain only a cheeseburger, draft pint, and margarita. The primary menu renderer also returns after rendering itemized entries, so separate general offers are omitted whenever items exist. Fix both incomplete transcription and omitted offer summaries.

## Expected behavior

- Every location receives a documented audit outcome, including locations whose official menu is unavailable, blocked, ambiguous, or image-only. Completion of the audit does not mean every restaurant has a complete menu.
- Record all identifiable published happy-hour foods, drinks, variants, bundles, and separate recurring daily specials. Exclude ordinary full-price menus and one-off past events. Preserve named variants when identifiable; do not invent item choices from broad categories.
- Present itemized entries and general specials together. Do not count a broad category summary as an extra selectable order, duplicate a bundle as its components, or assign an unlisted price to every item in a category.
- Show menu coverage, review date, and a prominent official source link beside the menu. Use “Partial menu”, “Full published specials reviewed”, or “Menu needs verification”. The second label describes the cited published material at review time, never current availability or the restaurant's entire regular menu.
- Add recorded items to existing search suggestions, matching, and item selection. Daily specials qualify only on supported days and times. Unknown or conflicting schedules must not become supported recommendations; unknown prices remain null and never contribute zero to a confirmed subtotal.
- Keep branch-specific applicability, seating rules, kitchen cutoffs, add-on conditions, quantities, and pairing restrictions visible. Existing compatible-pair and subtotal protections remain in force.

## Data and audit contract — proposed implementation choices

Keep plain JavaScript, Node 22+, existing research files, existing countywide staging/export, and the generated data build. Add no runtime crawling or automatic paid calls.

Create `research/menu-audit.json` as a versioned audit ledger keyed by the existing venue ID. Each entry contains `status` (`partial`, `complete`, `unverified`), `reviewedOn` (ISO local date or null), `sourceIds` (references to that venue's sources), `scope` (nonempty statement of publications/offer sections reviewed), and `gaps` (array of nonempty explanations). Ledger absence defaults to unverified during migration. Publish this information as `venue.menuCoverage` in the data build after combining original and countywide records, so countywide exporter changes are unnecessary.

`complete` requires a review date, at least one reviewed primary source, no unresolved gaps, and comparison against all relevant official happy-hour and recurring daily-special sections found during review. `partial` requires a review date, source references, and an explanation of what remains missing. `unverified` requires a gap explanation; it may retain a dated unsuccessful review attempt but makes no completeness claim. Reject unknown venue/source references and invalid dates. Source/access/review dates remain distinct; rebuilding cannot renew them.

Update original facts in `research/{dtla,west,north,central}.json`; update countywide facts through its candidate/source/review files and regenerate accepted output. Never hand-edit `src/data.js` or countywide `accepted.json`. Respect `withholdMenuPrices` on countywide records.

Use existing item `days`, `windowIds`, and stable IDs for evidenced daily offers. Give offer windows unique stable IDs. A published all-day special requires branch opening/closing evidence; do not model it as midnight-to-midnight by assumption. Keep an ambiguous daily offer as attributed descriptive text until applicability is supported. Schedule-bearing general-special text is descriptive, not a source of inferred matchable items.

The ledger records coverage; detailed research notes record URLs, section locators, evidence excerpts or authorized local snapshots, checked branch applicability, and unresolved issues. An image/PDF needs visual review; blocked material remains a gap. Secondary sources can support partial research but cannot establish complete coverage. AI-assisted transcription is allowed, but machine extraction alone cannot set complete status or owner approval.

## Audit method

1. Freeze the current venue IDs and assign every ID a ledger entry.
2. Review 33 Taps end to end against the official menu, weekly specials, and branch restrictions; current web evidence must be rechecked when implementation begins.
3. Audit the remaining records in the four original geographic groups plus the countywide batch. Shared chain menus may reuse evidence only when branch applicability is explicit.
4. Compare each source section to saved items/offers, resolve duplicates and price/schedule ambiguity, and record the outcome.
5. Publish a report listing every venue, outcome, number of saved items, sources, and remaining gaps. All 111 IDs must be accounted for; no fixed complete-menu count is promised.

## Constraints and non-goals

No automatic refresh on opening a card, no new online lookup workflow, no owner-review bypass, no changes to pending discovery approval, no new restaurants, and no publishing or deployment in this planning task. Preserve current architecture, filters, source confidence distinctions, escaped text, safe external links, historical evaluation fixtures, and unknown-price behavior. Proposed UI copy and ledger design above are builder recommendations, not previously user-approved details.

## Acceptance

The audited ID set exactly equals the original 111-location baseline. Every location has an outcome and traceable evidence or an explicit access gap. Complete labels satisfy the ledger contract. 33 Taps shows all identifiable cited specials, retaining branch/day/late-kitchen restrictions and unknown prices. Itemized entries no longer suppress general offers. Search finds newly recorded items, but unsupported schedules do not qualify. Mobile/keyboard use, existing filters, selections, subtotal warnings, and pending discoveries continue working. Report measured results and unresolved gaps without calling the dataset live-confirmed.
