# Local Squeeze UI Implementation Plan

> Execute inline in the existing checkout. The user approved the visual direction and explicitly requested implementation.

**Goal:** Apply the selected C direction with Neighborhood Bistro fonts and compact sizing to the working discovery app.

**Architecture:** Preserve existing data, API requests, source evidence, menu calculations, and owner review. Change the page structure and presentation; use native details for full menus and retain all menu items in the DOM.

**Tech stack:** Existing vanilla HTML/CSS/JavaScript, Node tests, Playwright browser checks.

**Approved design:** Butter yellow `#fff4dc`, paprika `#b4452d`, brown `#4f342b`. DM Serif Display headings, DM Sans body, 32px main headline, 24px venue names, 14px body. “Where are we unwinding?” / “Find a good bite, a favorite drink, and somewhere to settle in.” Separate clearly labeled Needs verification tab, amber status, sources and public evidence entry.

## Constraints and decisions

- Work in place: the current runnable app depends on extensive existing uncommitted/untracked changes. Do not stash, reset, stage, or commit unrelated work.
- Preserve every published restaurant and all prices, timing restrictions and source confidence distinctions.
- Show concise venue overviews; expand a full menu to choose items. Unknown prices stay unknown, pending prices remain unverified.
- Use only existing venue-specific operator photos, with a text-first layout for other venues; do not use fictional preview content or stock images.
- Bundle fonts locally with their licenses; retain system fallbacks.
- Preserve search disclosures, accessible form names, keyboard tabs, asynchronous menu lookup, owner approval, and API failure behavior.

## Review focus

- Long names and URLs at 320px; no horizontal overflow.
- Expanded menu selections still calculate subtotals and respect restrictions.
- Switching review tabs does not lose access to source evidence or owner controls.
- Offline fonts and failed venue images do not break layout or interactions.
- Search errors and pending discoveries cannot be mistaken for published matches.

## Tasks

- [x] 1. Add meaningful browser coverage for compact menus and review separation; run against the old UI to confirm the new behavior is absent.
- [x] 2. Bundle approved fonts; implement the page, result summaries and expandable menus; restyle pending/review tools consistently.
- [x] 3. Run the full Node suite, discovery/review/automatic-menu browser checks and the new responsive check; visually inspect desktop and mobile screenshots, fix material issues, record results.

## Progress

- Baseline: 127 Node tests pass with localhost access. Sandbox-only execution cannot bind test servers; approved local execution succeeds.
- Source state was inspected before editing; existing changes are preserved.

- Final verification: 130/130 Node tests pass. Discovery, review/owner approval, automatic-menu race/visibility, and Local Squeeze browser checks pass. Layout screenshots inspected at desktop and 320/390px.
- Readability refinement: display-only compact day ranges and 12-hour times; tests cover nonconsecutive days, midnight/overnight windows, seating/conditional restrictions, and unchanged source arrays.
- Independent review found no critical/important regressions. Fixed the skip link to target the always-visible tablist; browser coverage confirms focus in the pending view.
- Original working changes were preserved; no commit or deployment was performed. Fonts are bundled locally with OFL licenses.

- Working preview: http://localhost:4178 uses a temporary local-only preview server in `/private/tmp/happy-hour-ui-preview.mjs`, serving the modified files and proxying the existing hosted API. The deployed `src/config.js` remains unchanged. Verified service status configured and six real pending records loaded in the in-app browser; no live searches, evidence writes or approvals were submitted.
