# Explore Filters Implementation Plan

> Execute inline; the user approved the interactive proposal and requested implementation. Preserve all pre-existing working changes. Before-edit snapshots: `/private/tmp/happy-hour-before-filters`.

**Goal:** Fast local filtering with independent, searchable food and drink options that grow with reviewed menus; prominent additional discoveries and explicit AI/web actions.

**Architecture:** Reuse discovery/matching as the authority on timing, source evidence and budgets. Add pure filter-option/count helpers and a small controls module. Integrate the review queue as a section on Explore. Retain owner review, cached menus and public evidence forms.

**Approved constraints:** Optional city, food, drink, budget target, weekday and exact time. DM Serif Display/DM Sans compact Local Squeeze style. Native searchable suggestions, removable filter chips, counts and clear/reset. Every recorded reviewed-menu name/tag is searchable; equivalent singular/plural terms group. Only reviewed venues contribute options. Unverified discoveries retain clear status and unknown times/prices. Browsing/filter changes make no AI or web calls. Optional AI only interprets text into the visible filters. Fresh web discovery and additional menu lookup require explicit actions.

## Tasks

- [x] 1. Test dynamic menus, counts, food/drink independence, provisional discovery filtering, and side-effect-free browse. Implement pure helpers and accessible controls.
- [x] 2. Add filters/optional AI and same-page extra discoveries; keep filtering and explicit web requests separate, cancel stale responses on edits, and preserve owner editing during asynchronous menu lookup.
- [x] 3. Update meaningful existing browser flows for the new interactions. Run unit and browser regressions; inspect desktop and 320/390px screenshots; obtain focused code review and fix material findings.

## Review focus

- No hidden AI requests on initial load, filtering, paging, or viewing extra places.
- Unknown source prices/times cannot become confirmed matches or zero-value totals.
- Menu vocabulary grows after approval; pending-only terms never enter reviewed options.
- City partial input, empty results, long menu names, and option counts remain understandable.
- Stale AI/web responses and menu lookups cannot overwrite active filters or owner edits.

## Implementation decisions

- Native input+datalist for searchable city/food/drink; counts on suggestion labels. Basic day, time and budget controls use native inputs/selects. Single choice per food/drink input; multi-term AI requests remain separate chips until edited.
- Budget remains a target using the existing engine, not an unsupported hard cutoff. Time filtering uses restaurant-supported schedules.
- Initially show six researched cards, with a Show more button. All source records stay in the DOM; the additional-discoveries section is reachable from a counted link above the results.
- Additional menu lookups become manual: merely scrolling onto an extra place must not spend AI usage.

## Progress

- Planning complete. Baseline from prior change: 130 unit tests, discovery, review and responsive/media browser checks passed.

- Unit checks: initial four new filter tests passed; added regression for repeated normalization of “glass” after review (RED→GREEN), and exact menu names longer than 60 characters. Menu field limits now allow 150 characters, matching approved menu-item names.
- New browser check verifies no automatic AI/web/menu calls, independent Food/Drinks, dynamic vocabulary after approval, explicit paid actions, pagination, responsive widths, stale AI/web cancellation, partial-city cancellation, and focus restoration after chip removal.
- Existing browser flows updated for optional AI expansion, same-page section links, pagination, and explicit menu/web lookups. Discovery, Downey, cross-origin, local layout/media checks pass. Review/approval reload assertion now checks DOM persistence under pagination.
- Additional owner-started menu lookup regression reproduced edit loss (RED); manual lookup now patches source preview without replacing owner corrections. Online result refresh preserves same-record owner forms.

- Final checks: 137/137 Node tests pass. Filter, discovery, owner review/approval, explicit menu lookup, local layout, image fallback, Downey scope and cross-origin browser checks pass. Formatting and diff whitespace checks pass. Desktop and 320/390px screenshots inspected.
- Review finding fixed: counts normalize source labels only once; regression for “glass” passed after failing first. Keyboard-chip focus and stale loading-state observations are fixed and browser-covered.
- Additional guards: an incomplete city disables online search until resolved; stale AI/web requests cannot replace manual edits or introduce canceled discoveries. Bounded web queries reserve exact city/day/time/budget before long menu preferences, with space for both food and drinks.
- Working preview refreshed at http://localhost:4178, connected to the existing hosted API. Real saved extra discoveries load on the Explore page. No live AI/search/menu calls or evidence/approval writes were made for verification; automated provider interactions use fixtures.
- Existing uncommitted work preserved. No dependencies, model, credentials, database schema, deployment configuration, commit, push or deployment changes were made.
