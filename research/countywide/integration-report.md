# First Local Countywide Integration

Research/review date: October 19, 2026, America/Los_Angeles. Initially integrated locally, this batch was subsequently authorized for commit, push, and deployment with countywide coverage copy updates. Publication must be confirmed against the live site. It supersedes the original staging-only status, while preserving the initial pilot report as history.

## What Reached the App

The generated dataset contains **111 distinct locations: the original 100 unchanged plus 11 additions**. County evidence for the additions comes from reviewed US Census geography address matches, not city/ZIP inference. The new batch contains 5 LA County and 6 Orange County branches. Countywide research is incomplete; these counts are not a completeness estimate.

| Added branch                        | County | Imported evidence and limits                                                                                                                                                    |
| ----------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RISÜ Food & Spirits, Long Beach     | LA     | Daily bounded 4-6pm window; selected exact food/drink prices. Monday's unbounded extension is not encoded.                                                                      |
| The Hare, Long Beach                | LA     | Agreed daily 3-6pm schedule; conflicting official offer amounts and late-night days are omitted. Prices remain unknown. Dine-in only.                                           |
| Nomad Eatery, El Segundo            | LA     | Agreed Tuesday-Friday 4:30-6pm window and selected food prices; disputed Saturday and inconsistent item prices omitted. No verified drink price.                                |
| Sausal, El Segundo                  | LA     | Official daily 3-6pm menu, selected exact food/drink prices. No invented discount arithmetic.                                                                                   |
| Glendora Continental Restaurant     | LA     | Weekday 3-7pm Bar/Lounge offer. Bar restriction retained; discount-only summary does not become a final item price.                                                             |
| Benchmark, Santa Ana                | OC     | Current menu corroborates Wednesday-Friday 4-6pm; selected food/drink categories are supported, prices unknown. Replaces this candidate's earlier unresolved FAQ-only schedule. |
| Chapter One, Santa Ana              | OC     | Weekday 3-6pm; selected $8 food and $8 drink directly advertised together. Large-party gratuity disclosed in source notes.                                                      |
| Cedar Creek Inn, Brea               | OC     | Daily 3-6pm with bar/front-patio restriction. PDF item prices are withheld because independent visual QA was unavailable; fees and source caveats remain noted.                 |
| Billy's at the Beach, Newport Beach | OC     | Tuesday-Friday 3-7pm; selected $10 food/drink. Weekend windows depend on published opening times and stay conditional. Monday closed.                                           |
| Mayfield, San Juan Capistrano       | OC     | Wednesday-Friday/Sunday 2:30-6pm; selected $6 food/$8 drink. Monday closed; Tuesday's opening-dependent window remains conditional.                                             |
| Coyote Grill, Laguna Beach          | OC     | Bar happy hour with selected $6.25 taco/$8.50 drink; Tuesday extension separately modeled. No takeout; holiday/special-day closures remain documented.                          |

New search origins cover Long Beach, El Segundo, Glendora, Santa Ana, Brea, Newport Beach, San Juan Capistrano, and Laguna Beach. Each is a documented government-geocoded area reference; most use a researched address, not a civic centroid, entrance GPS, or the user's position. The nearby-search cap remains 25 straight-line miles from the selected origin.

## What Stayed Pending

There are 19 staged candidates: 11 accepted, 7 pending, and 1 closure excluded. The Social Restaurant's published address did not match the Census geocoder and is held back. The initial Front Yard/Hangar/Attic source issues remain unresolved. Wood Ranch and Lazy Dog are held back after reviewing restrictive terms. Playa Mesa remains excluded on its official closure notice. Additional Saint & Second/Starfish leads were not imported after restrictive terms were found.

The new retention decisions cover selected, independently authored factual observations only. They link the [US Copyright Office's facts/expression distinction](https://www.copyright.gov/help/faq/faq-protect.html) and document exposed policy checks. They are not affirmative restaurant licenses or permission to mirror menus, media, reviews, page layouts, or provider data. No raw source archives are stored. Undiscovered terms remain a recorded limitation; no automated crawler is enabled.

## Implementation and Verification

- The accepted exporter validates current candidate/evidence digests, policy decisions, and government location provenance before emitting app records. Unknown cents, source statuses, and item/window restrictions survive export.
- The build refuses stale accepted.json output or county-less expanded records. Original source files and original published records remain unchanged.
- Shared validation/matching use reviewed county evidence for additions; original unannotated records keep their old DTLA radius fallback. The user travel radius is independent of county admission.
- All additions are tested for geographic admission and regional-origin searchability. Final test/review results are recorded in progress.md.
- Independent agent audit checked all 11 branches, their official hours/prices/restrictions, fresh Census responses, and all 8 new origins. It is not human or same-day confirmation. Cedar price assertions were removed from every public field, and the exporter now rejects leakage while prices are withheld. Build date and evidence review snapshot are separate.

The original local-only integration left UI files untouched. Subsequent user authorization permits release copy updates: LA + Orange County wording, incomplete-coverage disclosure, geocoded-location counts, and the separate 25-mile nearby-search limit. No paid APIs or automatic collectors are enabled by this release.

Regenerate accepted output, then build:

```sh
node research/countywide/tools/export.mjs research/countywide --output research/countywide/accepted.json
npm run data:build
npm run data:validate
node --test research/countywide/tests/*.test.mjs
npm test
```
