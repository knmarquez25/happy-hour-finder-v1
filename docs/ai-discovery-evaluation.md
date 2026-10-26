# AI menu discovery evaluation

Evaluation date: October 25, 2026. Source snapshot remains October 19, 2026; rebuilding or testing does not renew restaurant evidence.

## What changed

The prior entry screen immediately required plans and showed time/location-qualified matches. The new screen opens all 111 researched records, accepts optional natural-language criteria through one helper, and keeps suggestions, menu browsing, source details, and custom selections in one list. Exact prices stay in integer cents. Budget is a preference rather than an exclusion.

## Verification performed

Final verification: **76/76 unit and HTTP tests passed**, the new discovery browser regression passed at four viewport widths, and the retained previous interface passed its full existing browser regression at six viewport widths. Of the 76 tests, 23 were added in this iteration (12 discovery/menu, five AI-boundary, six HTTP tests). A separate browser test verifies real CORS/preflight between frontend and backend ports using a Gemini response fixture. No live model calls were made.

- Discovery tests cover all 111 records on entry, area/menu narrowing, flexible budgets, no invented day/time defaults, overnight windows, rejected unsupported model fields, unknown prices, conflicting evidence, incompatible windows, and conditional pairings.
- AI transport tests use documented structured-output response fixtures: valid extraction, missing key, blank/oversized query, refusal, incomplete output, malformed JSON, missing fields, unexpected fields, and safe provider-error messages. This verifies application behavior, not whether the model interprets real requests accurately.
- HTTP tests exercise actual local requests: public browsing, safe configuration status, blocked private paths, origin checks, invalid/oversized bodies, and rate limits.
- Browser regression exercises initial dataset visibility, no dropdowns or second AI list, a real menu subtotal, structured-output fixture narrowing, Clear, preserved results on failure/clarification, stale-request cancellation, and overflow at 1280, 736, 390, and 320 pixels. Review the recorded command outputs before treating a check as passing; final counts are recorded in the implementation ledger.

## Historical comparison rerun

The frozen legacy benchmark was rerun without changing the matching engine or answer key:

| Historical engine measure | Original V1 | Prior improved engine |
| ------------------------- | ----------: | --------------------: |
| Fixed development set     |        1/15 |                 12/15 |
| Positive cases            |        0/11 |                  8/11 |
| Negative controls         |         1/4 |                   4/4 |
| Held-out set              |         0/5 |                   4/5 |

These are the existing engine's small source-evidenced benchmark results. They are **not** evaluation scores for the new AI parser or browser UI. The new optional-criteria discovery module has different behavior and was assessed by the new tests above. Dataset growth and bundled earlier improvements do not establish independent causal effects.

## Challenge case

Ocean Prime's Friday oyster price is conditional on the documented Veuve Clicquot Rosé glass. A tempting subtotal would select the cheap oyster without the required drink, or mix it with a different offer window. The app preserves pairing restrictions, avoids treating an oyster-only selection as a supported order, and identifies selections not confirmed together. Generic conditional windows are excluded from positive timing/menu matches and compatibility claims, so a drinks-only late window cannot establish a burger match after a kitchen closes. An unknown or conflicting price must not become $0 or a claim that an order fits a budget.

## What remains unmeasured

No real API key was configured and no paid live model request was made. Model extraction quality, latency, token cost, refusal behavior on real inputs, and model resistance to prompt injection remain unmeasured. A validator rejects unsupported response shapes, but an in-schema omission could still change the meaning of a request. The visible interpretation lets the user inspect and correct it; it is not proof of correctness.

No real user task study, current restaurant confirmation, exhaustive regional coverage audit, or public-host acceptance test has occurred. Live source retrieval is not implemented.

The per-address, hourly global, and concurrent-call caps all have passing HTTP regressions. Operational behavior on public hosting remains to be verified.

## Next evaluation

Before class publication, run a versioned live-model set containing: area-only, craving-only, budget-only, combined criteria, ambiguous time, unsupported city, `near me` without location, an explicit exclusion such as `no beer`, a strict total-spend limit including tax/tip, conflicting requests, and prompt-injection attempts. Independently label intended fields before seeing responses. Report exact field agreement, dropped constraints, unsupported-claim count, abstentions, model version, latency, and cost. Never count an empty or missing constraint as correct just because it produces plausible restaurants.

Then observe several classmates browsing and choosing a place. Measure time to a choice, source visits needed, incorrect assumptions, and whether the shown menu/price helped them decide. Keep those usability observations separate from automated checks.
