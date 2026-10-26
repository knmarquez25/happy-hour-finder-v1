# Live discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Discover additional happy-hour places, save them for evidence review, and publish only owner-approved offers.
**Architecture:** Grounded search and schema validation on Render; Supabase durable review queue and owner Auth; existing static frontend gains tabs and review controls.
**Tech Stack:** Node 22, native fetch, vanilla ES modules, Supabase REST/Auth, Gemini APIs.
**Spec:** docs/superpowers/specs/2026-10-25-live-discovery-design.md

## Global Constraints
- No paid plan, billing enablement, or paid fallback.
- Only Kathy approves publication; unknown prices remain null.
- Preserve visible complete recorded menus and existing browse fallback.

## Review Focus
- Search quota failure must preserve researched results and report discovery failure.
- Unsupported citations, invented price fields, and duplicate venues must not appear as supported matches.
- Public callers and expired/foreign owner sessions must never approve records.
- Evidence submitted after approval must not mutate the published snapshot.
- Shared queue failures/reloads must never silently lose approval or label an unsaved candidate as saved.

### Task 1: Grounded discovery boundary
**Files:** server/search.js, src/candidates.js, tests/search.test.js
**Interfaces:** searchPlaces(query,{apiKey,searchModel,model,fetchImpl}) returns {candidates,searchEntryHtml}; normalizeCandidate(value) validates candidate, candidateToVenue(record) builds owner-approved menu record.
- [ ] Write fixtures for supported cited happy-hour candidates with null price, uncited/unsupported offers, duplicates of base list, invalid URLs/prices, provider/quota failure.
- [ ] Run tests RED; implement bounded two-stage search/extraction with source-passage validation; run GREEN.

### Task 2: Durable queue and owner approval
**Files:** server/reviews.js, server/http.js, server/start.js, supabase/reviews.sql, tests/reviews.test.js, tests/server.test.js, .env.example, render.yaml
**Interfaces:** createReviewStore(config) list(), save(candidates), evidence(id,input), decide(id,input,token); validate owner through Supabase Auth.
- [ ] Write RED storage/auth fixtures including missing config, approval spoof, unknown price, immutability, pagination/size limits, and safe failure.
- [ ] Implement SQL grants/RLS and owner-only decision validation, bounded public endpoints/CORS/rate limits; run GREEN.

### Task 3: Discovery and review interface
**Files:** src/review-ui.js, src/discover-app.js, src/discover.css, index.html, tests/discover-browser.cjs, tests/review-browser.cjs, docs/deployment.md, docs/final-submission.md
**Interfaces:** review UI receives endpoint(), onApproved(records); explore request uses current text; pending list, owner login/review, evidence submission and source attribution are separate from curated browse.
- [ ] Write RED browser assertions for search -> pending, source/missing price, owner editing/approval, reload, failure, no duplicate menu controls, narrow screens.
- [ ] Implement UI and integrate approved candidates with existing deterministic menu behavior. Run unit/HTTP/browser suites.
- [ ] Fresh review; fix important findings; publish via existing GitHub connector workflow. Deploy Render latest commit. Run public martini discovery and owner/non-owner persistence acceptance; document exact limits and service blockers.
