# Westside Happy-Hour Research

Reviewed: 2026-10-19. Deliverable: 24 distinct restaurant locations, confined to Santa Monica, Venice, Marina del Rey, Culver City, Westwood and Brentwood. No Hollywood, West Hollywood or DTLA records. Only `west.json` and this file were written.

## Coverage

- 24 records with full street/city/state/ZIP addresses and directly inspected official branch or hotel evidence of happy hour.
- 23 locations have at least one `primary` schedule window. Culver Hotel's only encoded window is `conflicting` because its official pages disagree.
- 15 locations have both a primary-sourced exactly priced food item and an exactly priced drink entry. Of these, 14 also have a primary schedule and qualify as full combos under the strict definition used here. This is evidence completeness, not a bundled meal offer or guaranteed final bill.
- The Waterfront's drink amount is the posted BOGO purchase price, not an effective divided price. Ospi Brentwood's pizza and beer are individually priced exclusions from its separate pick-two promotion. Simonette's exact food amount comes from an older official-hosted PDF and needs reconfirmation.
- Schedule-only/item-incomplete records: The Galley, Dear Jane's, SALT, STK, Rocco's Westwood, Bacari Culver City, FIG, Hinano Cafe and All Roads. Empty menus mean no sufficiently established happy-hour item data, not no food/drink service.
- Geographic distribution: Santa Monica 11, Venice 3, Marina del Rey 2, Culver City 4, Westwood 2, Brentwood 2.

## Evidence Register

All links below were directly opened unless explicitly labeled unavailable or secondary. Field-level source IDs and access/review dates are in the JSON. Official pages are primary only for what was actually readable; a page title or generic menu heading does not establish an item price.

| Location | Official evidence | Coverage / limitation |
| --- | --- | --- |
| Casa Martin Ocean Avenue | [Branch menu/index](https://www.casamartinsm.com/menu/), [linked happy-hour PDF](https://www.casamartinsm.com/wp-content/uploads/2020/04/Happy-Hour-Menu.pdf) | Weekday window, exact food/drink prices; holiday/special-event exclusion. Older upload still linked. |
| Casa Martin Third Street Promenade | [Branch menu/index](https://www.casamartinsm.com/menu/), [same explicitly branch-linked PDF](https://www.casamartinsm.com/wp-content/uploads/2020/04/Happy-Hour-Menu.pdf) | Separate physical address, not a duplicate Ocean Avenue record. |
| Culver Hotel | [Menus](https://www.culverhotel.com/menus), [dining page](https://www.culverhotel.com/downtown-culver-city-restaurants) | Exact prices; unresolved 17:00 versus 18:00 end. |
| Public School 310 | [Culver City branch](https://www.psontap.com/ps-310) | Priced Recess food/drink; only mutually consistent Thursday/Friday window encoded. |
| The Galley | [Homepage](https://www.thegalleyrestaurant.net/), [menu](https://www.thegalleyrestaurant.net/our-menu/) | Daily hours; bar/front patio. No regular-menu prices repurposed. |
| Dear Jane's | [Homepage](https://www.dearjanesla.com/) | Tuesday-Saturday schedule; seating-rule conflict. [Attempted menu page](https://www.dearjanesla.com/menus) returned internal error and remains unreviewed (`reviewedOn: null`). |
| SALT | [Hotel dining overview](https://www.marinadelreyhotel.com/dining-overview/), [restaurant](https://www.saltmdr.com/) | Sunset Hour; percentage and dollar-off deals do not supply final item amounts. |
| Simonette | [Homepage](https://www.simonetterestaurant.com/), [happenings](https://www.simonetterestaurant.com/weekly-happenings), [official-hosted happy-hour PDF](https://static1.squarespace.com/static/5be5da0d25bf029c9c2ed22d/t/68dff694936382200281ca21/1759508116611/Simonette_HappyHour_9.25.25_web.pdf) | Daily hours and current drink promotion; exact burger amount from PDF with 2025 filename. PDF discovered via search; Squarespace site ID matches official homepage assets. |
| STK Westwood | [Current branch](https://stksteakhouse.com/en-us/location/los-angeles/), [menu shell](https://stksteakhouse.com/en-us/location/los-angeles/menu/?menu=Happy-Hour-Menu) | Current Glendon Avenue address; afternoon and late-night windows. Item content absent from inspected shell; tier marketing not assigned to invented items. |
| Ospi Venice | [Venice branch](https://ospi.com/venice) | Followed its Aperitivo link to current Firebase PDF, exact URL in JSON. Per-item food/drink amounts. |
| Ospi Brentwood | [Brentwood branch](https://ospi.com/brentwood) | Followed branch's Firebase PDF link; daily bar/patio window, exact pizza/beer exclusions and pick-two offer. PDF URL in JSON. |
| Rocco's Westwood | [Westwood/UCLA branch](https://www.roccostavern.com/locations/westwood) | Address and daily hours; no item prices established. |
| The Waterfront | [Menu and footer](https://www.thewaterfrontvenice.com/menus) | Exact food and BOGO purchase prices. Closed-day and weekend-time discrepancies explicitly handled. |
| Bacari Culver City | [Branch page](https://www.eatwithbacari.com/culver-city) | Distinct Monday-Thursday and Friday windows; no dinner items passed off as specials. |
| FIG | [Hotel restaurant page](https://www.fairmont-miramar.com/dine/fig-restaurant/), [restaurant FAQ](https://www.figsantamonica.com/faq/) | Tuesday-Saturday schedule; 90-minute dining rule; percent discount only. |
| Hinano Cafe | [Homepage](https://www.hinanocafevenice.com/), [menu](https://www.hinanocafevenice.com/menu) | Weekday schedule, official Venice 90292 postal address. Regular burgers not labeled happy-hour items. |
| All Roads | [Homepage](https://www.allroadspinseria.com/), [contact/address](https://www.allroadspinseria.com/contact), [menu page](https://www.allroadspinseria.com/menu) | Daily schedule; no image-based dinner-menu amounts transcribed as happy-hour prices. |
| Lunetta | [Menu/index](https://www.lunettasm.com/restaurant_menus/), [Golden Hour PDF](https://www.lunettasm.com/wp-content/uploads/2026/04/NEW-GH-421.pdf) | Exact prices, weekday/Saturday schedule, dine-in only. Official combined 2420/2424 address; 2424 entrance selected, complex counted once. |
| Library Alehouse | [Happy hour](https://www.libraryalehouse.com/happy-hour), [address](https://www.libraryalehouse.com/) | Followed linked official image and visually read it in browser screenshot. Exact image URL in JSON. Beer $7, not guide's $6. |
| The Surfing Fox | [Restaurant](https://www.thesurfingfoxsm.com/) | Browser selected Sunset Hour and read loaded widget, including bar/patio restriction and exact item amounts. All-day menu in default web extraction not reused. |
| LA Puglia | [Happy-hour page](https://lapuglia.us/happy-hour) | Exact food/drink amounts; same page says everyday but also closed Mondays. Only Tuesday-Sunday encoded. |
| Manchego | [Official menu](https://www.manchegosm.com/menu) | Happy-hour subsection gives different weekday/weekend starts and specific prices. |
| Michael's Santa Monica | [Hours](https://michaelssantamonica.com/), [contact/address](https://michaelssantamonica.com/contact-us/), [accessible happy-hour menu](https://michaelssantamonica.com/adacompliant/happy-hour/) | Primary schedule and exact food/drink amounts; no New York branch data used. |
| North Italia Santa Monica | [Branch and menu](https://www.northitalia.com/locations/santa-monica-ca/?menu=happy-hour) | Directly opened happy-hour section, bar-only weekday window. Search excerpt had different item prices/menu, so direct page prevailed. |

## Conflicts And Decisions

1. **Culver Hotel:** [Menu](https://www.culverhotel.com/menus) ends Harry's Hour at 17:00; [dining page](https://www.culverhotel.com/downtown-culver-city-restaurants) repeatedly says 18:00. Menu window is retained as `conflicting`, not silently promoted to primary. Only this record lacks any primary schedule.
2. **Public School 310:** [Same official page](https://www.psontap.com/ps-310) has top announcement Monday all day / Tuesday-Friday afternoons / 21:00 late start, versus lower Sunday-Wednesday all day / Thursday-Saturday afternoons / 20:00 late start. Another lower block omits Saturday, and structured-looking text has an implausible 11am late-night end. Only Thursday/Friday 15:00-18:00, explicitly agreed by the conflicting blocks, is retained. Other potentially valid hours intentionally omitted.
3. **The Waterfront:** [Menu](https://www.thewaterfrontvenice.com/menus) says weekend 19:00-21:00, footer 19:00-20:00. Weekend entry is `conflicting`. Generic weekday happy hour is narrowed to Monday/Thursday/Friday because official operating hours say Tuesday/Wednesday closed.
4. **Dear Jane's:** [Homepage](https://www.dearjanesla.com/) body allows bar and outdoor patio weather permitting, while footer says bar only. Encoded bar-only eligibility is mutually supported; patio remains unconfirmed.
5. **LA Puglia:** [Same page](https://lapuglia.us/happy-hour) advertises everyday happy hour but closed Mondays. No Monday entry; Tuesday-Sunday window is supported during stated operating days.
6. **SALT versus Del Rey Lounge:** [Hotel overview](https://www.marinadelreyhotel.com/dining-overview/) distinguishes SALT Sunset Hour starting 16:00 from the lounge's extended 14:00 start. Only SALT's window encoded; same-address lounge not a second record.
7. **Casa Martin / Library / FIG:** The [Santa Monica tourism guide](https://www.santamonica.com/restaurants/happy-hour/) is a directly inspected **secondary** discovery source. It differs from official Casa Martin timing/pricing, Library beer pricing and FIG's scope of discount. No guide-only amounts or schedules imported into records. Library's official image was visually inspected, not inferred from its filename.
8. **North Italia:** Search-result page body showed an older $13 cocktail / different food menu; [direct branch-page open](https://www.northitalia.com/locations/santa-monica-ca/?menu=happy-hour) showed $12 Sicilian margarita and $10 arancini in the happy-hour section. Direct inspected page used. All-day Monday applies to wine-bottle wording, not assumed all-menu availability.

## Limits And Access

- Currently listed means accessible official listings on the review date, not telephone confirmation or a claim that all menus were freshly published. Old but still linked PDFs are explicitly identified. Simonette's food-price PDF is older and search-discovered; this remains a freshness limitation even though its brand/site provenance and current drink promotion agree.
- All coordinates are null. Addresses are ready for parent Census geocoding. Neighborhood ownership was checked against branch identity; **no geocoded or calculated 25-mile DTLA radius certification is claimed**. These are Westside-area candidates; parent must geocode and enforce the radius with its chosen DTLA reference point. No fabricated centroids or driving distances were used.
- Full combos count means at least one exact primary-priced food entry, one exact primary-priced drink entry, and one primary schedule. It does not require a discounted price below the regular menu. Ospi Brentwood's pizza/beer and Waterfront's BOGO entries are transparent special cases. Excluding Simonette's older exact food-price PDF would reduce strict full combos from 14 to 13.
- `restriction: none` means no additional happy-hour-specific rule was established in inspected evidence, not a guarantee of unrestricted seating. Conditional windows describe actual published limitations in record notes.
- Prices are published dollar amounts stored in cents, before tax, gratuity and applicable service charges. Ranges, percentage discounts and bundles without individual amounts were not divided or reverse-engineered. Ospi Brentwood pick-two items retain null individual prices.
- No access controls, paywalls, CAPTCHAs or blocked pages were bypassed. Dear Jane's attempted menu URL returned internal error and is unreviewed. The legacy Ospi Venice PDF URL returned generic HTML; the branch's actual current menu link was followed instead. STK menu headings were readable, but its item content was not; this is incomplete extraction, not evidence of prices.
- Discovery-only candidates not included: AKASHA due closure reports surfaced in search, A.O.C. Brentwood due conflicting guide evidence and insufficient current branch verification, and Lula due incomplete directly inspected schedule/price evidence. The attempted Telefèric Los Angeles open returned internal error; its search excerpt was not promoted to primary evidence or included in the dataset. No failed page was marked reviewed.
- No ratings, ambience claims, coordinates or item availability were inferred from generic marketing copy. No git mutations or application changes were made.

## Verification

The final JSON is checked for exact record keys, unique IDs/addresses, allowed neighborhoods, full weekday names, HH:MM fields, valid status/restriction/kind enums, integer-or-null prices, source-ID referential integrity and review dates. Coverage counts are computed from the saved file. Source review establishes provenance, not a guarantee against restaurant changes after this date.
