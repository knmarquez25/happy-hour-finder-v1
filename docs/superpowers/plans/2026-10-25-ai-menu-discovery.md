# AI Menu Discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the approved menu-first browse experience with genuine server-side AI request interpretation and a truthful class submission draft.

**Architecture:** Keep the reviewed dataset and legacy matching engine. Add a pure discovery/menu module, a bounded AI extraction endpoint, and a browser controller that renders one list. Static browsing needs no key; AI requires server configuration.

**Tech Stack:** Node 22 built-ins, browser ES modules, existing Node test runner and Playwright. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-25-ai-menu-discovery-design.md`

## Global Constraints

- First load includes all 111 researched restaurants; Clear restores them.
- AI interprets requests only; prices, menus, schedules, and arithmetic come from reviewed data.
- Budget is flexible; no required area or implicit day/time.
- Keys stay server-side; no paid API calls or deployment commitments without configuration.
- Dataset search is not live source retrieval. Historical benchmarks stay unchanged.

## Review Focus

- Partial day/time must not silently default to an arbitrary point: discovery fixtures.
- Selections across different offer windows must not imply a valid order: menu fixtures.
- A malformed model result must not broaden a constrained search: API/validation fixtures.
- Clear or rapid resubmit must defeat stale network responses: browser regression.
- Server path tricks must not expose environment, source code, symlinks, or repository data: HTTP regression.

### Task 1: Pure discovery and menu behavior

**Files:** create `src/discovery.js`, `tests/discovery.test.js`.

**Interfaces:** `emptyPreferences()`, `validatePreferences(value, venues)`, `discover(venues, preferences) -> evaluated venues[]`, `menuSelection(venue, selectedIds, preferences) -> {knownCents, unknownCount, supported, compatible}`; `areaOptions(venues) -> string[]`. Each evaluated venue contains `venue`, `combo`, `window`, `reasons`, and `budgetDifferenceCents`.

- [ ] Write tests for complete default browse, area/food narrowing, flexible budgets, optional timing, unsupported criteria, unknown totals, and incompatible items.
- [ ] Run `node --test tests/discovery.test.js`; confirm missing behavior fails.
- [ ] Implement using existing `selectCombo`, source provenance, and shared-window applicability. No mutation of data.
- [ ] Run the focused tests and `npm test`.

### Task 2: Real AI service and secure static hosting

**Files:** create `server/ai.js`, `server/http.js`, `server/start.js`, `tests/ai.test.js`, `tests/server.test.js`; modify `package.json`, `.gitignore`; create `.env.example`.

**Interfaces:** `interpretRequest(query, {apiKey, model, fetchImpl}) -> validated preferences`; `createApp({apiKey, model, fetchImpl, rateLimit}) -> http.Server`; POST `/api/discover` accepts `{query}`, returns `{preferences}` or a safe JSON error. GET `/api/status` returns `{configured}` without secrets.

- [ ] Write failing structured-output, refusal, timeout, no-key, request-size, same-origin, static allowlist, and rate-limit tests. Use injected transport rather than paid calls.
- [ ] Run focused tests; implement structured Responses API extraction, independent validation, bounded rate/concurrency controls, and server-only configuration.
- [ ] Run focused tests and the whole unit suite. Check that browser assets cannot contain secrets.

### Task 3: Approved browse UI

**Files:** preserve `index.html` as `legacy.html`; replace `index.html`; create `src/discover-app.js`, `src/discover.css`; create `tests/discover-browser.cjs`; add package script `test:discovery-browser`.

**Interfaces:** consumes Task 1 modules and Task 2 endpoints; pending requests are abortable and generation-checked. All restaurant cards are in the initial list, with lazy images if used. No dropdowns or duplicate AI restaurant list.

- [ ] Write browser checks for all-record default, mocked AI result narrowing, interpretation, menu selection subtotal, Clear, API failure, stale responses, and overflow at 1280/736/390/320.
- [ ] Run against original interface; confirm expected failure.
- [ ] Build the approved sidebar/one-list interface, source details, expandable menu, optional suggested combo, error states, and privacy disclosure. Preserve dataset unknowns.
- [ ] Run unit/browser checks, retain legacy browser coverage by pointing it at `legacy.html` where supported, and inspect rendered desktop/mobile views.

### Task 4: Evaluation, workflow, and submission

**Files:** create `docs/final-submission.md`, `docs/ai-discovery-evaluation.md`, `docs/deployment.md`; update `README.md`; add `render.yaml` only if its service configuration is verified.

- [ ] Rerun unchanged development/holdout benchmarks and record their actual outputs as historical engine results.
- [ ] Report fixture/browser verification separately from unrun live AI accuracy and user-study results.
- [ ] Draft all six assignment answers, updated five questions, concrete menu example, challenge case, workflow/decision/approval map, risks, safeguards, and next-build idea. Mark public deployment/gallery link pending.
- [ ] Run final verification and a fresh code review; fix important findings with regression tests. Open the actual working build for the user.

## Execution notes

Proceed inline in the existing clean checkout to avoid an additional worktree decision. Do not create a public deployment or spend API credit during implementation. Hosting and API setup remain user-controlled; this does not block browser/module/server verification with injected API fixtures.
