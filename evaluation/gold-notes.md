# Independent Gold Labels

Reviewed on 2026-10-19. This is an evidence-based acceptable-ID set, not a ranking or a copy of application output.

Integration addendum: after this independent labeling snapshot, FIG's location was directly established from its operator's published map marker at [the official location page](https://www.figsantamonica.com/location/fig-santa-monica/): latitude 34.017881, longitude -118.501449. Coordinate approvals now cover all 100 locations. FIG's menu has no exact priced pair and its offer remains conditional, so this coordinate correction does not change any acceptable or hard-validity label. Historical snapshot counts and hashes below remain a record of the labeling inputs, not the final integrated dataset. Current evaluation results contain final app/data hashes.

## Independence And Scope

Read the fixed 15 cases in `evaluation/cases.json`, five in `evaluation/holdout.json`, the four requested regional research arrays (28 DTLA + 24 west + 24 north + 24 central = 100 locations), `research/coordinates.json`, `research/coordinate-approvals.json`, and the origin constants in `src/locations.js`. Read/imported only `evaluation/baseline/data.js` to identify the original ten-venue panel and its original factual claims.

Did not read `matching.js`, `app.js`, baseline scoring code, rubric code, evaluation results, or ranking outputs. Did not call any implementation scoring, eligibility or distance helper. Independent arithmetic was performed in transient inline Node commands using only JSON input, manually transcribed documented origin constants, and the directly imported geodesy vendor `src/vendor/latlon-spherical.js`. No evaluator script was written to the app or evaluation directory.

All 20 fixed case IDs appear once in `gold.json`; original and holdout membership is preserved below. Array order is documentary and has no ranking meaning. Labels apply only to the supplied 100-ID evidence universe; discovering other restaurant locations in sources does not silently add them.

## Core Label Rules

1. Require a directly source-reviewed primary schedule at the scenario weekday/time, a usable evidenced coordinate, and a qualifying primary food plus primary drink with exact published amounts. Each selected item must be valid for that window/day. Secondary guide schedules, unreviewed assets, unknown amounts and legacy budget estimates are not substitutes.
2. Start is inclusive and end exclusive. Use local Los Angeles clock times. For a genuinely overnight window, the after-midnight portion belongs to the previous opening weekday and stops at its published end; no supplied dawn case is covered.
3. Compare unrounded straight-line miles to maxDistance, inclusively. Vendor great-circle meters are divided by 1609.344. No driving distances, neighborhood-center venue positions, rounding into radius, nearest-venue fallback or relaxed radius.
4. Require food subtotal plus drink subtotal <= (budget + 5) dollars. No lower bound. A cheap option remains acceptable. This is a base item subtotal, not tax/tip/service-fee-inclusive total.
5. Food/drink preferences and atmosphere are soft unless the case explicitly sets its must-have flag. The two required test tags have no evidenced item match. An explicit neighborhood is hard and cannot be ignored when unknown.
6. Every case omits includeRestricted, so it is false. Reject bar-only, bar-or-patio, lounge, high-top, counter-service/other conditional windows; also reject `restriction: conditional` and ambiguous/conflicting schedules. Do not assume a user accepts a condition just because it might be easy to satisfy.
7. Do not reject an entire venue solely for an unrelated conflicting item or inactive window: an independently supported unrestricted window and nonconflicting pair suffice. Thus Gracias Madre's beer pair does not depend on its disputed margarita price. The common 16:00-18:00 Perch Friday interval is usable; disputed 15:00-16:00 is not.
8. Do not infer final amounts from percentage/dollar-off offers, split bundle amounts, reuse regular menu prices, or apply Friday-only items all week. The Waterfront's $8 PBR is the actual published purchase amount with a complimentary second beer, not an invented $4 effective price; no extra claimed saving is needed for its $20 pair. Its weekday open-day window has no additional seating or purchase prerequisite in the inspected offer.

These are conservative evidence rules, not claims about everything a restaurant might actually offer. In particular, `conditional` flags supplied in research are honored even when their original author used that flag for a general exclusion such as holidays.

## Documented Origins

These are neighborhood reference points, not the user's precise location.

| Origin | Latitude | Longitude |
| --- | ---: | ---: |
| DTLA | 34.0505 | -118.2551 |
| Arts District | 34.0408 | -118.2344 |
| Pasadena | 34.1458 | -118.1445 |
| Glendale | 34.1425 | -118.2551 |
| Burbank | 34.1808 | -118.3090 |
| Hollywood | 34.1016 | -118.3267 |
| Culver City | 34.0211 | -118.3965 |
| Santa Monica | 34.0148 | -118.4959 |

Coordinates were joined by exact published address, preferring explicit manually reviewed coordinate approvals over the general coordinate map. The inspected snapshot contained 87 general entries and 12 approval entries, providing points for 99 of 100 records. FIG Fairmont Miramar had no usable point and also no fixed-price menu pair; no position was invented.

All provided positions are Census address-range interpolation, including manually reviewed directional/unit corrections. They are not surveyed entrances or rooftop positions. Formosa's approved 90046 match resolves the source ZIP inconsistency for this calculation. Nominal point distances, not uncertainty buffers, determine the labels. Boundary-sensitive exclusions remain a limitation of the geocoding.

## Positive Evidence Ledger

Amounts below are exact witness pairs from the supplied primary-reviewed research records, re-opened when material. Witnesses need not be the cheapest available combination or match soft preferences. Distances are independent vendor calculations, shown rounded only for human reading; comparisons used full precision.

| Venue ID | Origin distance(s), miles | Active admissible window used | Food + drink witness | Primary source |
| --- | --- | --- | --- | --- |
| perch-la | DTLA 0.243208; Arts 1.125359 | Weekdays 16:00-18:00 | Slider $5 + beer $7 = $12; wine alternative totals $15 | [HH menu](https://www.perchla.com/menu-aperitif), re-opened |
| green-street-restaurant-pasadena | Pasadena 0.769611 | Weekdays 16:00-18:00 | Chips/salsa $8 + draft $7 = $15 | [HH menu](https://greenstreetrestaurant.com/menu/happy-hour/), re-opened |
| guss-bbq-south-pasadena | Pasadena 2.047204 | Weekdays 15:00-17:30 | Three rib sliders $10 + draft $6 = $16 | [Schedule](https://www.gussbbq.com/locations), [food](https://www.gussbbq.com/items/rib-sliders), [drink](https://www.gussbbq.com/items/draft-beers), re-opened |
| foothill-restaurant-pasadena | Pasadena 3.027683 | Tuesday-Friday 11:00-18:00 | Fries $6 + beer of day $7 = $13 | [HH menu](https://foothillrestaurant.com/happyhour), re-opened |
| formosa-cafe-west-hollywood | Hollywood 1.318674 | Daily 15:00-18:00 | Wings $10 + daily beer $5 = $15 | [Golden Hour section](https://theformosacafe.com/menu), re-opened |
| 33-taps-silver-lake | Hollywood 2.887404; DTLA 3.069296 | Weekdays 15:00-19:00 | HH cheeseburger $9 + house draft $5 = $14 | [Branch](https://www.eatdrink33.com/silver-lake-location/), [HH item list](https://www.eatdrink33.com/menus/), [all-location prices](https://www.eatdrink33.com/event/), re-opened |
| 33-taps-west-hollywood | Hollywood 3.560979 | Weekdays 15:00-19:00 | HH cheeseburger $9 + house draft $5 = $14 | [Branch](https://www.eatdrink33.com/west-hollywood-location/), [menu](https://www.eatdrink33.com/menus/), [prices](https://www.eatdrink33.com/event/), re-opened |
| iki-ramen-hollywood | Hollywood 0.425420 | Weekdays 14:30-17:30 | Edamame $5 + draft $5 = $10 | [Official HH page naming both branches](https://ikiramen.com/happenings/happy-hour), re-opened |
| iki-ramen-koreatown | Hollywood 3.141026; DTLA 3.135664 | Weekdays 14:30-17:30 | Edamame $5 + draft $5 = $10 | [Branch-explicit shared offer](https://ikiramen.com/happenings/happy-hour), re-opened |
| gracias-madre-west-hollywood | Hollywood 3.720462 | Weekdays 15:00-18:00 | Fries $7 + house cerveza $7 = $14 | [Location/menu index](https://graciasmadre.com/pages/location-menus), [linked PDF page 6](https://cdn.shopify.com/s/files/1/0905/4132/6630/files/GM_Menus_-_Web_260930.pdf?v=1791161657), re-opened |
| simonette-culver-city | Culver City 0.237810 | Daily 15:00-18:00 | Burger Parisienne $10 + lager $4 = $14 | [Current happenings](https://www.simonetterestaurant.com/weekly-happenings), [older official-hosted HH PDF](https://static1.squarespace.com/static/5be5da0d25bf029c9c2ed22d/t/68dff694936382200281ca21/1759508116611/Simonette_HappyHour_9.25.25_web.pdf), re-opened |
| ospi-venice | Santa Monica 2.518750 | Daily 15:00-18:00 | Crispy provolone $14 + espresso martini $14 = $28 | [Branch page and its current Aperitivo link](https://ospi.com/venice), PDF re-opened through that link |
| the-waterfront-venice | Santa Monica 1.604493 | Open weekdays Monday/Thursday/Friday 15:00-19:00 | Cheeseburger/fries $12 + full PBR purchase $8 = $20 | [HH section and opening hours](https://www.thewaterfrontvenice.com/menus), re-opened |
| library-alehouse-santa-monica | Santa Monica 1.376514 | Weekdays 16:00-18:00 | Two tacos $7 + Mayberry IPA $7 = $14 | [Schedule](https://www.libraryalehouse.com/happy-hour), [official HH image](https://images.squarespace-cdn.com/content/v1/664faefda75c1706e8633fc4/216133c6-5d4b-497d-b7a5-3014f205a66d/Library%2Bdrink%2BMenu_HAPPY%2BHOUR.png); visual-review caveat below |
| manchego-santa-monica | Santa Monica 1.014518 | Tuesday-Friday 17:00-18:30 | Deviled eggs $9 + sangria $8 = $17 | [HH section](https://www.manchegosm.com/menu), re-opened |
| michaels-santa-monica | Santa Monica 0.379537 | Tuesday-Saturday 16:00-18:00 | Fries $7 + 1979 cocktail $12 = $19 | [Schedule](https://michaelssantamonica.com/), [accessible HH menu](https://michaelssantamonica.com/adacompliant/happy-hour/), re-opened |

## Cases And Coverage

| Fixed case ID | Split | Number of acceptable IDs | Interpretation |
| --- | --- | ---: | --- |
| dtla-weekday | Original | 1 | Perch; food/drink/vibe are soft |
| arts-wine | Original | 1 | Perch; wine pair exists |
| dtla-low-budget | Original | 1 | $12 is <= $10 + $5; no lower bound |
| dtla-tacos | Original | 1 | Soft taco/margarita preferences do not exclude Perch |
| dtla-weekend | Original | 0 | Positive-design coverage gap: local verified priced options are restricted or weekday-only |
| pasadena | Original | 2 | Green Street and Gus's; Foothill outside 3 miles |
| glendale | Original | 0 | Positive-design coverage gap: no admissible fixed-price pair |
| hollywood | Original | 3 | Formosa, 33 Taps Silver Lake, IKI Hollywood |
| culver-city | Original | 1 | Simonette; conflicting/restricted competitors excluded |
| santa-monica | Original | 5 | Ospi Venice, Waterfront, Library, Manchego, Michael's |
| burbank | Original | 0 | Positive-design coverage gap: missing prices/restrictions and boundary |
| early-morning | Original | 0 | Dawn outside every supplied valid HH |
| impossible-food | Original | 0 | Required food tag unsupported |
| impossible-drink | Original | 0 | Required drink tag unsupported |
| empty-area | Original | 0 | Unknown hard neighborhood not relaxed |
| holdout-sm-friday | Holdout | 4 | Manchego has not started; wine remains soft |
| holdout-pasadena | Holdout | 3 | Four-mile radius adds Foothill |
| holdout-dtla-close | Holdout | 0 | Positive-design coverage gap; exclusive 18:00 end |
| holdout-hollywood | Holdout | 6 | Four-mile radius adds IKI Koreatown, 33 Taps WeHo and Gracias Madre |
| holdout-dawn | Holdout | 0 | No Sunday 06:15 HH near Culver City |

There are 11 nonempty core case labels and 9 empty core labels: five intended negative controls plus four positive-design evidence gaps. These are label-coverage counts, not accuracy, recall or precision measurements. The cases' `negative` metadata was not treated as a directive to invent a match or nonmatch.

## Material Exclusions And Applicability

- [Joyce](https://www.joycela.com/menus/) is bar/patio-only, so excluded everywhere under the default. The evening shrimp item is not a late-night item; its `windowIds` must not be ignored. Mac and cheese has a separate late-window applicability. None of these fixed cases requests 21:00-23:00.
- [Rossoblu](https://www.rossoblula.com/pizza-happy-hour) is bar-only; Wednesday's longer offer does not override seating consent.
- [Ocean Prime Beverly Hills](https://ocean-prime.com/locations-menus/beverly-hills/) was re-opened. Its $2 oysters and $20 Veuve glass are Friday-only, not every weekday; the oyster wording also accompanies that Champagne promotion, so no oyster/beer independence is assumed. Lounge-only and conditional, and 3.2026 miles from Culver City, so not an acceptable case label regardless.
- [33 Taps branch kitchen caveats](https://www.eatdrink33.com/silver-lake-location/) matter: Monday-Thursday/Sunday kitchens close one hour early. Silver Lake Monday-Wednesday 22:00 and Thursday 23:00; West Hollywood Monday-Thursday 22:00; Sunday 21:00 at both. Sunday 21:30 late HH is not a food-and-drink opportunity. All retained witnesses use afternoon windows; no late-night kitchen availability is inferred.
- [Culver Hotel menu](https://www.culverhotel.com/menus) versus [dining page](https://www.culverhotel.com/downtown-culver-city-restaurants) conflict at 17:00/18:00. Supplied window is conflicting; excluded rather than guessing. [Public School 310](https://www.psontap.com/ps-310) is bar-only.
- [Messhall](https://messhallkitchen.com/) Monday-Thursday opening conflicts with its HH start; its supplied Wednesday/Tuesday windows are conflicting/conditional. No repaired schedule is invented for the gold labels.
- Maestro, Agnes, Twohey's, Octopus, Relentless, Casa Martin, La Puglia, Lunetta, Surfing Fox, FIG, Ospi Brentwood, Black Cat, La Boheme weekday windows and other `conditional` windows are rejected under this task's explicit conservative policy. Some may be perfectly usable for customers who accept their actual conditions; that is not assumed here.
- No food amount for Inkwell's appetizers or Dog Haus's dollar-off wings is invented. A schedule-only GRANVILLE, Bacari, Far Bar, STK, Edendale or other empty-menu record cannot count as budget-suitable.
- Exact distances show Foothill at 3.027683 miles from Pasadena, 33 Taps Silver Lake at 3.069296 miles from DTLA, IKI Koreatown at 3.135664 miles from DTLA and 3.141026 miles from Hollywood. They are not rounded into a three-mile radius.
- Glendale's Wednesday 17:00 case cannot use La Cabanita's 17:00-exclusive end (also 4.408875 miles away); John Sparr is 4.332953 miles away and has no priced HH menu. Smoke House similarly ends at Burbank's requested 17:00 and is bar-only.
- Waterfront is closed Tuesday/Wednesday despite generic weekday HH wording. Weekend 19:00-20:00 versus 19:00-21:00 conflict is not used. Thursday/Friday witnesses are in the mutually supported open-day window.
- Manchego weekday HH starts 17:00, so it is not a Friday 16:15 holdout label. Michael's and Library are in their own weekday windows at that time. Perch at Thursday 18:00 is no longer in HH.
- Gracias Madre's margarita has a homepage/PDF price conflict; use only its uncontested $7 food and $7 cerveza pair. No bundled meal is divided into fictional components.

## Fixed Ten-Venue Source-Audit Panel

Panel membership is the first ten records in the frozen original `evaluation/baseline/data.js`, not ten selected for favorable coverage. The original dataset's blanket happyHourVerified flags, reputation values, distance estimates, atmosphere and budgetEstimate are not independently verified ground truth.

The [original Downtown LA guide](https://downtownla.com/explore/dining-and-drinks/happy-hour-finder) was re-opened for context. It is a secondary district guide, not the restaurant operator. Eight panel members still have only that secondary evidence in the supplied research. Unknown is not equivalent to false, closed or inaccurate.

| Original panel member | Current source-audit finding | What remains unknown |
| --- | --- | --- |
| Joyce | [Direct operator menu](https://www.joycela.com/menus/) supports daily 17:00-19:00, $15 food, $8 beer/$13 cocktails and seating restriction. Original $11/$7/$9 claims do not match this menu. | Real-time availability, service experience, reputation/vibe scores; excluded by seating default |
| Kombu Sushi | Secondary guide schedule only in research; no accepted current primary-priced menu | Operator-confirmed HH terms/prices and seating conditions |
| LA Cha Cha Cha | Secondary guide schedule only; no current primary-priced pair | Same primary evidence gap |
| Library Bar | Secondary guide schedule only; no current primary-priced pair | Same primary evidence gap |
| Mignon Wine & Cheese Bar | Secondary guide schedule only; no HH food amount | Primary days/window and full pair |
| Native Son | Guide gives a time but no explicit days in supplied evidence; hours=[] | Weekdays and exact primary food/drink terms |
| Peking Tavern | Guide-only schedule and percentage discount; no exact primary pair | Current branch terms and final amounts |
| Perch LA | [Direct operator menu](https://www.perchla.com/menu-aperitif) supports weekday 16:00-18:00 and priced food/drinks, unlike original 15:00-19:00. Friday's earlier start is disputed, but 16:00 onward agrees. | Unresolved Friday 15:00-16:00; reputation/vibe scores not audited |
| Prank Bar | Guide-only schedule and generic specials | Primary schedule, exact prices, conditions |
| Precinct DTLA | Supplied guide lacks explicit days; hours=[] and no primary pair | Current days, primary prices and food offer |

Panel evidence coverage: two of ten have directly operator-supported schedules and food/drink prices in the supplied audited research, with material corrections to original claims; eight lack that primary evidence. This is not an assertion of "20% accuracy." No unsupported accuracy percentage is produced; no scoring/ranking outputs were used to measure one. Distance values are recomputed from documented coordinates rather than audited against the original hand-entered distanceMiles.

## Limitations

- Library Alehouse's schedule was re-opened. Its official image URL was opened but exposed no readable text through the web tool; a fresh visual inspection was unavailable because the browser surface was unavailable. The $7 taco/$7 IPA witness relies on the supplied research's explicitly recorded prior visual review of that official image. It is not newly OCR-verified in this evaluation and not derived from a tourism snippet.
- Simonette's exact $10 burger appears in the re-opened 2025 official-hosted PDF found through search, not a confirmed current homepage PDF link. Current operator happenings corroborate the HH/burger promotion and $4 beer, but current food price freshness remains uncertain. It satisfies the requested published-primary evidence rule, not a promise of today's checkout charge.
- A source reviewed on the task date may contain older prices or incompletely updated hours. No staff calls, live stock checks, reservation inquiries, source access bypasses, or claims that blocked images were reviewed.
- FIG has no approved coordinate. Other geocodes are interpolated and can shift strict near-boundary classification. The fixed origin points themselves are neighborhood references.
- Primary status is not assumed from domain alone: retained item/schedule evidence must be linked to the relevant branch or expressly shared across named branches. Item applicability in notes is read in addition to structured fields.
- Fees, tax and gratuity are not in the requested food+drink base subtotal. Portion count is respected: Gus's price covers three sliders, Library's taco price two tacos. No minimum food price, per-person meal-size assumption or lower budget floor invented.
- Null menus, secondary-only terms and unresolved schedules can cause false negatives relative to the full real-world restaurant market. Empty positive-design gold labels intentionally expose those coverage gaps.

## Independent Guardrail Labels

Added `validLabels` for the same 20 fixed case IDs. These sets answer only whether the required schedule, straight-line radius, explicit neighborhood, must-have and seating/conditional constraints are independently evidenced. They do NOT require a food-and-drink pair, exact prices, budget suitability, or matching soft preferences. A schedule-only venue can therefore be valid without being a relevant core label. Unknown prices and missing HH menu entries stay unknown; they are not hard-constraint violations.

The original `labels` and original per-case `notes` objects are unchanged. Their serialized SHA-256 values remain `a1de0e2b34f9fd68ee457775ffc422bc399c5198d814dcb351b634a287af05ca` and `80e387e7d7d9312b5f7fe58d11096ed52c7c6bd52c79f248f336c706936e990a`, respectively. Every core label is a subset of its guardrail set. No new menu prices or factual audit scores have been invented.

For compatibility, `validLabels` indexes all fixed case IDs just as `labels` does. The five holdouts also have an explicit separate `holdoutValidLabels` map; original and held-out outputs are tabulated separately below. The same rules were fixed before evaluating the holdouts. No ranking output, relevance score, or held-out outcome was used to adjust rules or core labels.

### Guardrail Rules

- Require a primary, reviewed schedule whose applicable window contains the requested time, with inclusive start/exclusive end. Overnight windows use their opening weekday. Secondary-only schedules, missing days and unresolved conflicts are not promoted into proven validity.
- Use the same documented origin coordinates and direct geodesy vendor arithmetic, joined to the approved/general address-coordinate union. Compare full-precision straight-line miles against the fixed radius. The available union covers 99 addresses; FIG remains pending and unpriced, with no label impact.
- Apply an explicit neighborhood exactly, and must-have flags only when selected. Required item tags must be primary-supported and valid for the window/day, including item-specific days from `record-adjustments.json`. No selected must-have can be satisfied by a generic regular-menu description. The two unsupported required tags remain empty.
- Omitted `includeRestricted` is false. Honor bar-only, bar/patio, lounge, other conditional offers and source restrictions; do not assume opt-in. The three explicit bar/patio adjustments for Ospi Brentwood, The Galley and Surfing Fox were read as evidence annotations, not implementation code; all remain excluded by the default. Ocean Prime's Friday-only item days remain Friday-only and its conditional lounge restriction remains disqualifying.
- Do not inspect or test prices or budget for this layer. No selected food/drink pair is necessary in cases without corresponding must-have constraints. Tam O'Shanter can be schedule-valid despite missing HH food evidence, for example; this does not establish a complete meal or subtotal.
- Failure to appear in `validLabels` means required eligibility is not proven under this conservative evidence policy, not necessarily that a restaurant's claims are false. Unknown source terms, inaccessible assets and missing coordinates remain unknown. Guardrail reporting should preserve this distinction rather than converting an audit unknown into a measured factual failure.

### Original Guardrail Outputs

| Original case | Valid IDs | Reason for additions beyond core labels |
| --- | --- | --- |
| dtla-weekday | perch-la; far-bar; le-oyster-bar-silver-lake | Far Bar and L&E have supported windows/radius; prices remain unknown |
| arts-wine | perch-la; far-bar | Far Bar fits Arts origin; wine/date-night remain soft |
| dtla-low-budget | perch-la; far-bar | No budget or price test for validity |
| dtla-tacos | perch-la; far-bar | No required taco/margarita; both active Friday 16:00 |
| dtla-weekend | none | No evidenced unrestricted primary Saturday 17:15 window within radius |
| pasadena | green-street-restaurant-pasadena; brookside-restaurant-pasadena; granville-pasadena; guss-bbq-south-pasadena | Brookside and GRANVILLE have proven weekday schedules, not proven costs |
| glendale | bacari-glendale; edendale-silver-lake | Both have primary active schedules; missing prices are not hard violations |
| hollywood | formosa-cafe-west-hollywood; laurel-hardware-west-hollywood; 33-taps-silver-lake; hugos-west-hollywood; iki-ramen-hollywood; bacari-silverlake | Laurel, Hugo's and Bacari fit schedule/radius without menu pricing |
| culver-city | simonette-culver-city; bacari-culver-city | Bacari's Friday window is independently supported |
| santa-monica | ospi-venice; the-waterfront-venice; library-alehouse-santa-monica; manchego-santa-monica; michaels-santa-monica | Same IDs; Hinano source-condition exclusion below |
| burbank | inkwell-tavern-burbank; granville-burbank | Exact menu costs unnecessary for validity |
| early-morning | none | No valid Thursday 06:00 HH |
| impossible-food | none | Required food tag not supported |
| impossible-drink | none | Required drink tag not supported |
| empty-area | none | Hard neighborhood is unknown and not relaxed |

Original-only guardrail coverage: 15 cases, 10 nonempty and 5 empty; 30 case/venue associations. This is a coverage count, not a ranking-accuracy or factual-accuracy measurement.

### Held-Out Guardrail Outputs

| Held-out case | Valid IDs | Evidence distinction |
| --- | --- | --- |
| holdout-sm-friday | ospi-venice; the-waterfront-venice; all-roads-pinseria-brentwood; library-alehouse-santa-monica; michaels-santa-monica | All Roads 3.758296mi fits four miles and its 15:30-17:30 window; prices still unknown |
| holdout-pasadena | foothill-restaurant-pasadena; green-street-restaurant-pasadena; brookside-restaurant-pasadena; granville-pasadena; guss-bbq-south-pasadena; dog-haus-biergarten-alhambra; barcade-los-angeles-highland-park | Brookside/GRANVILLE schedules, Dog Haus 3.588080mi and Barcade 3.392948mi fit; missing exact food amounts do not invalidate them |
| holdout-dtla-close | far-bar; le-oyster-bar-silver-lake | Both remain active at 18:00; Perch's 18:00 end remains exclusive |
| holdout-hollywood | tam-oshanter-atwater-village; formosa-cafe-west-hollywood; 33-taps-silver-lake; 33-taps-west-hollywood; gracias-madre-west-hollywood; hugos-west-hollywood; iki-ramen-koreatown; iki-ramen-hollywood | Tam 3.932602mi is still before 17:00 and Hugo's 2.824296mi is active; no pair-cost requirement |
| holdout-dawn | none | No valid Sunday 06:15 HH near Culver City |

Holdout-only guardrail coverage: five cases, four nonempty and one empty; 22 case/venue associations. These outputs are not used to tune the original sets or rule thresholds.

### Additional Schedule Evidence

These are primary schedule witnesses for IDs added to the guardrail sets, not claims that their prices or menu contents are known. Straight-line mile values are independently calculated from the supplied coordinate union.

| ID | Relevant distance/window | Source |
| --- | --- | --- |
| far-bar | DTLA 0.881629mi; Arts 0.684851mi; Tuesday-Friday 15:00-20:00 | [Official footer](https://www.farbarla.com/take-out-menu-1), re-opened; embedded menu pricing remains unreviewed |
| le-oyster-bar-silver-lake | DTLA 2.752711mi; weekdays 17:00-19:00 | [Official homepage](https://www.leoysterbar.com/), re-opened; inaccessible menu-image unknowns unchanged |
| brookside-restaurant-pasadena | Pasadena 2.130662mi; weekdays 15:00-18:00 | [Official restaurant page](https://www.brooksidegc.com/brookside-restaurant/); no exact HH menu established |
| granville-pasadena | Pasadena 0.768287mi; weekdays 15:00-18:00 | [Official branch list](https://www.granville.com/); no HH menu price inferred |
| bacari-glendale | Glendale 0.136854mi; weekdays 15:00-18:00 | [Official Glendale page](https://www.eatwithbacari.com/glendale) |
| edendale-silver-lake | Glendale 2.484004mi; Tuesday-Friday 17:00-19:00 | [Official hours](https://theedendale.com/hours-info/), re-opened; failed PDF remains unreviewed |
| laurel-hardware-west-hollywood | Hollywood 2.276930mi; daily 17:00-18:00 | [Official homepage](https://www.laurelhardware.com/), re-opened |
| hugos-west-hollywood | Hollywood 2.824296mi; weekdays 16:00-19:00 | [Reviewed official branch PDF](https://www.hugosrestaurant.com/files/hugos-menu-weho-pdf.pdf); regular-menu pricing not HH evidence |
| bacari-silverlake | Hollywood 2.932009mi; weekdays 17:00-18:00 | [Official Silverlake page](https://www.eatwithbacari.com/silverlake) |
| bacari-culver-city | Culver City 0.278364mi; Friday 15:00-18:00 | [Official Culver City page](https://www.eatwithbacari.com/culver-city) |
| inkwell-tavern-burbank | Burbank 0.629743mi; weekdays 16:00-19:00 | [Official homepage](https://inkwelltavern.com/); discount amounts not converted into prices |
| granville-burbank | Burbank 0.037025mi; weekdays 15:00-18:00 | [Official branch list](https://www.granville.com/) |
| all-roads-pinseria-brentwood | Santa Monica 3.758296mi; daily 15:30-17:30 | [Official homepage](https://www.allroadspinseria.com/), re-opened; no readable priced HH item list |
| dog-haus-biergarten-alhambra | Pasadena 3.588080mi; weekdays 15:00-18:00 | [Official Alhambra page](https://locations.doghaus.com/locations/ca/alhambra/410-e-main-st); discount-only prices remain null |
| barcade-los-angeles-highland-park | Pasadena 3.392948mi; weekdays 16:00-18:00 | [Official branch](https://barcade.com/location/los-angeles), supplied prior rendered-browser primary review; no new food price inferred |
| tam-oshanter-atwater-village | Hollywood 3.932602mi; weekdays 14:00-17:00 | [Official branch HH](https://www.lawrysonline.com/tam-o-shanter/happenings/happy-hour/); food remains unpriced |

### Source Correction And Unknowns

[Hinano's official homepage](https://www.hinanocafevenice.com/) was re-opened during this extension and explicitly says guests must be 21 to enter. Its HH time is clearly weekdays 16:00-20:00, but the research record's `restriction: none` does not reflect that source condition. Under the task's existing exclusion of conditional offers without assumed consent, it is not included in either Santa Monica guardrail set. This is a source-backed exception to the coarse research flag, not an invented price or a statement that a particular user is underage. The core labels were already empty for this venue because of unknown costs and are unchanged. No research or app file was edited.

The original ten-venue audit panel and every source/audit unknown remain unchanged. In particular, guide-only panel members are not promoted to verified merely because this new layer no longer checks prices. Default non-opt-in is applied equally in both layers. Existing menu/window restrictions, kitchen cutoffs, Ocean Prime Friday item days, exact radius comparisons and end-exclusive boundaries remain in force.

The new evidence annotation input was read, not executed: `research/record-adjustments.json`, SHA-256 `72b6f298f8f6eae1a95e233f19f611ed70798988d005346a501b90e87cc5cfe8`. The existing case, research and coordinate input hashes below are unchanged at this extension's review. No implementation eligibility/scoring/distance helper or ranking output was read or called. No holdout-driven threshold, source promotion or rule change was made.

## Input Snapshot SHA-256

Research/case hashes were recorded before writing gold; fixed cases were not changed. During final validation, src/locations.js had been concurrently reformatted outside this evaluation task. Its origin constants were re-read and are numerically unchanged; the manifest records that final reviewed file hash. No source/app file was edited by this evaluator.

```text
evaluation/cases.json 103d70015c840d7d54f0f0a1701c788d4cdf343b76e39f6d40babcdc6597e1da
evaluation/holdout.json 55f3d4e7ac43fd999cb0475218ef49c035d86cec2380951c85ea41a0716df107
research/dtla.json f7513a6649a3b9d92e1a2b116e183dd1b3ca473ec94cec9a6486f47b1b3717b1
research/west.json 8350ce13a75c819f4fec6cfa95ed36afeb8b13f7e0716bffd5589305468d3907
research/north.json bb117723bb50b51ee7f195d00269525b0e1dfd0581b10e0159ebbc0cf5174866
research/central.json d081a6881c34e166827e42a3941d8f64014aeb8defe39d2d4a15ef2df95bac61
research/coordinates.json f9474ff85203a2e970644002b238a6f515986ff284292e99495e56d4c1568133
research/coordinate-approvals.json 2a67a9b849a65f3812a4f6a764fbdd40918509cc4e533d1df1b1db24b4940cbb
src/locations.js 3f370ef8c181254f1a0e97f473665fbbb6f3044c8876a4db96a4b23d2511af08
evaluation/baseline/data.js 6f4c9484450bd0f743bd5d7442c4198b94b74eac449b06bb138d027e911215f3
```

