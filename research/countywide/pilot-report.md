# Initial Countywide Pilot Report

Source inspections: October 19, 2026. This is the first eight-case staging sample, not a completed 40-branch or 500-branch expansion. All retained notes are concise, independently authored factual summaries with source links; no source archives or provider payloads are stored. Inspection was AI-assisted, not an independent human audit.

## Results

- Distinct candidate locations: 8; directly researched: 8.
- Intended work areas: 4 LA-area candidates, 4 OC-area candidates. Authoritative branch-level county assignments remain unverified for all 8; work-area labels are not geography proof.
- Official pages advertising an offer: 6. Clear afternoon schedule evidence was recorded for Wood Ranch Valencia, Wood Ranch Irvine, and Lazy Dog Irvine; restrictions remain conditional pending full menu/seating review. No item prices were imported.
- Admission-ready branches: 0. Pending research/review: 7. Excluded: 1, Playa Mesa, whose [official page](https://www.playamesa.com/) announces permanent closure.
- The 40-new-branch target has a shortfall of 32 inspected candidates and 40 admitted branches. There is no claim of countywide completeness.
- Candidate duplicate suggestions against the current 100 research records: none from the conservative matcher. This is not an independent guarantee of uniqueness.
- Raw retention: denied for this manual sample. Reuse/public export permission: unconfirmed. API subscriptions, scheduled collection, and database services: none enabled. Effort and cost amounts were not measured and remain null.

Reproduce current counts from the repository root:

```sh
node research/countywide/tools/validate.mjs research/countywide --now 2026-10-19T23:59:59Z
node research/countywide/tools/report.mjs research/countywide --now 2026-10-19T23:59:59Z --markdown
node research/countywide/tools/identity.mjs research/countywide
```

## Review Queue

| Candidate           | Outstanding work                                                                                                                                                                                                                                           |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wood Ranch Valencia | Authoritative county/address resolution, source policy, current happy-hour menu, holidays/seating, independent audit. Marketing name differs from the listed Stevenson Ranch locality.                                                                     |
| The Front Yard      | Resolve weekday/daily conflict between [events](https://www.thefrontyardla.com/happenings) and [contact](https://www.thefrontyardla.com/contact-us); establish street address from inspected evidence; do not infer a late closing time from dinner hours. |
| The Attic           | Visually inspect the [linked happy-hour image](https://www.theatticonbroadway.com/happy-hour); opening-hour footer is not an offer schedule. Resolve county/policy/identity.                                                                               |
| The Hangar Inn      | Current [homepage](https://thehangarinn.com/) inspection establishes address but no offer. Resolve alternate-domain ownership and inspect a current offer before admission. No offer found does not mean no offer exists.                                  |
| Wood Ranch Irvine   | Resolve county/identity/policy, menu and exceptions. Do not incorporate a separate Tuesday wine promotion into the happy-hour window.                                                                                                                      |
| Lazy Dog Irvine     | Resolve county/identity/policy, menu and seating restrictions. Nearby branches listed on the page require their own research.                                                                                                                              |
| Benchmark           | Resolve county/identity/policy; corroborate the older FAQ schedule with a current official menu. Parking address must stay separate.                                                                                                                       |
| Playa Mesa          | Retain closure evidence as an exclusion, subject to retention decisions; do not reintroduce as active from an old directory mention.                                                                                                                       |

## Audit and Handoff

Every staged case received direct source inspection; no case received final admission. Independent audit is therefore still outstanding for the pending candidates and explicitly ambiguous/conflicting cases. A fresh code/source-review pass is recorded in `progress.md` when finished; it is not an independent human verification of all restaurant facts.

Next research work is authoritative geography, source-policy resolution, image/menu review, and broadening the candidate pool into eastern/northern/southern LA County and north/coastal/south OC. The 13 supplied region work groups do not replace a full city/unincorporated inventory. Only publish branches that pass the admission gate and the required factual audit.

Integration boundary remains the new `research/countywide/**` directory. UI, shared schema, original research, build, matching, generated app data, baseline/holdout evaluation, package scripts, and deployment remain untouched by this implementation. The next integration must coordinate county membership, origin selection, search constraints, and export with the UI owner. No cross-chat message was sent.
