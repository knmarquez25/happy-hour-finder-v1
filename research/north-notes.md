# North / East Happy-Hour Research

Reviewed: 2026-10-19. Output: `north.json`, following `SCHEMA.md`.

## Coverage

- 24 distinct physical restaurant locations, with full street address, city, state and ZIP.
- 23 locations have at least one directly inspected, primary-supported schedule window. This means a window exists with `status: primary`, not that every advertised extension or conflicting window has been resolved.
- 6 full priced combinations: a primary-supported schedule plus at least one primary-supported HH food and one HH drink with exact published integer-cent prices. These are Marina, Maestro, Foothill Restaurant, Green Street Restaurant, La Cabanita, and Gus's BBQ South Pasadena.
- Exact priced menu entries are examples, not exhaustive transcriptions. Null prices are genuinely missing final prices or discount-only offers.
- Geography: Pasadena 9; Glendale 3; Burbank 4; South Pasadena 2; Atwater Village 2; Eagle Rock 1; Alhambra 1; Highland Park 2. No DTLA, Los Feliz-neighborhood, Silver Lake, Sierra Madre, Monterey Park, NoHo or Temecula locations included.
- Coordinates are null throughout. No positions or exact distances fabricated. These are candidates in the assigned nearby municipalities/neighborhoods; exact 25-mile straight-line DTLA-radius verification remains for parent Census geocoding and the parent's DTLA reference point. No road-distance claim.
- "Currently listed" means the offer appears on the restaurant's currently accessible site as reviewed, not that staff reconfirmed it by telephone or that an old asset's prices are guaranteed in person.

## Evidence By Location

All links below were inspected as primary restaurant evidence on the review date unless explicitly qualified. Individual JSON sources identify separate address/menu evidence and access failures.

| Location | Evidence and what is supported |
| --- | --- |
| Marina, Pasadena | [Official branch HH menu](https://www.marinapasadena.com/menu/happy-hour/): daily 17:00-18:00, bar seating only; fries $8, pizza $15, margarita $9, Scrimshaw $5. Monday all-day extension retained in notes only. |
| Maestro, Pasadena | [Official HH page](https://www.maestropasadena.com/happyhour): Sunday-Thursday 17:00-18:30; $12 guacamole/queso and named cocktails, $5 beer. Same page closes Mondays, so Monday excluded. |
| Foothill Restaurant, Pasadena | [Official HH menu](https://foothillrestaurant.com/happyhour): Tuesday-Friday 11:00-18:00, all day Wednesday; fries $6, pretzel $10, margarita $10, beer of the day $7. |
| Green Street Restaurant, Pasadena | [Official HH menu](https://greenstreetrestaurant.com/menu/happy-hour/): weekdays 16:00-18:00, chips/salsa $8, sliders $10, draft beer $7, house wine $10. [Official location](https://greenstreetrestaurant.com/contact/) supplies 146 Shopper's Lane and ZIP. |
| Agnes Restaurant & Cheesery, Pasadena | [Official HH menu](https://www.agnesla.com/happyhourmenu): daily 14:00-17:00, counter-style. Named fries/cheese board but no numerical prices; no HH-specific drink established. |
| Brookside Restaurant, Pasadena | [Official restaurant page](https://www.brooksidegc.com/brookside-restaurant/): weekdays 15:00-18:00, public restaurant and address. [Linked menu](https://www.brooksidegc.com/wp-content/uploads/sites/9671/2026/04/New-Brookside-Menu-FINAL-VERSION.pdf) is regular food, not an established HH price list. |
| GRANVILLE Pasadena | [Official branch-list page](https://www.granville.com/): Pasadena at 270 S Lake Avenue and weekday 15:00-18:00 HH. [Regular menu](https://www.granville.com/menu-1) not imported as HH items. |
| Venezuelan Chamo Cuisine, Pasadena | [Official HH page](https://chamovenezuelancuisine.com/page/happy-hour): weekdays 15:00-20:00, margaritas and beer without exact prices. [Official contact](https://chamovenezuelancuisine.com/page/contact-us) supplies full address and conflicting Monday-Thursday 19:30 close. |
| El Portal, Pasadena | [Official homepage](https://www.elportalrestaurant.com/): Tuesday-Friday 15:00-18:00 and weekends 15:00-17:00, bar only, margarita $8 and draft beer $7. Embedded Wednesday/Friday social captions conflict on end time. |
| John Sparr Tavern, Glendale | [Official menu page](https://www.johnsparrtavern.com/menu): Tuesday-Friday 15:30-17:30 and address. Linked image could not be retrieved; no image prices/items asserted. |
| La Cabanita, Glendale | [Official branch menu](https://www.lacabanitarestaurant.com/menu): weekdays 14:00-17:00; HH nachos/quesadilla $10, HH house margarita $8, HH beer $6. |
| Bacari Glendale | [Official Glendale branch](https://www.eatwithbacari.com/glendale): weekdays 15:00-18:00 and full address. General dinner/brunch/open-bar listings not treated as HH specials. |
| Inkwell Tavern, Burbank | [Official restaurant page](https://inkwelltavern.com/): weekdays 16:00-19:00, $2 off beer, wine, cocktails and appetizers. No final price inferred by subtraction. |
| Octopus Restaurant, Burbank | [Official Burbank page](https://www.octopusrestaurant.com/orderonline): Monday-Saturday 15:00-18:00; reverse HH daily 20:00-close. Same page supplies weekday/weekend closing times, address, party/holiday restrictions. |
| GRANVILLE Burbank | [Official branch-list page](https://www.granville.com/): 121 N San Fernando Boulevard; weekday HH 15:00-18:00. Distinct location from Pasadena. |
| Smoke House, Burbank | [Official specials](https://www.smokehouse1946.com/specials): weekdays 15:00-17:00, bar/lounge only, no takeout or stacking. [Regular menu](https://www.smokehouse1946.com/menu) not substituted for HH prices. |
| Twohey's, South Pasadena | [Official HH menu](https://www.twoheys.com/bar-and-happy-hour): 15:00-18:00 except Tuesday, $7 named classic drinks and wine, named food without prices. [Homepage](https://www.twoheys.com/) instead says 15:00-17:00; only common interval encoded. |
| Gus's BBQ, South Pasadena | [Official locations](https://www.gussbbq.com/locations): weekdays 15:00-17:30; [branch-specific HH rib sliders](https://www.gussbbq.com/items/rib-sliders) $10 for three and [HH draft beer](https://www.gussbbq.com/items/draft-beers) $6. |
| Momed, Atwater Village | [Homepage](https://www.atmomed.com/) directly links [May 2025 HH PDF](https://www.atmomed.com/files/new-hh-may-2025-pdf.pdf): Sunday-Thursday 17:00-18:30 at the Bridge, listed cocktails $8, 5% kitchen fee. No HH food verified. |
| Tam O'Shanter, Atwater Village | [Official branch HH](https://www.lawrysonline.com/tam-o-shanter/happenings/happy-hour/): weekdays 14:00-17:00, listed classics $10, house draft beers $6, branch address. [Inspected July 2026 local reporting](https://beverlypress.com/2026/07/restaurant-news-703/) corroborates Atwater Village, not the Los Feliz neighborhood despite street name; secondary geographic evidence only. |
| Relentless Brewing & Spirits, Eagle Rock | [Official Los Angeles branch](https://www.relentlessbrewingandspirits.com/los-angeles): weekdays 16:00-18:00, full address and holiday/private-event caveat. No Temecula menu or regular food prices reused. |
| Dog Haus Biergarten, Alhambra | [Official Alhambra branch](https://locations.doghaus.com/locations/ca/alhambra/410-e-main-st): weekdays 15:00-18:00 and Sunday 15:00-22:00, discount-only HH. Wings/beer/wine prices stay null. No Saturday HH inferred. |
| Checker Hall, Highland Park | [Official menu index](https://www.checkerhall.com/menus) and [about page](https://www.checkerhall.com/about): HH 16:00-18:00 and full address, but no explicit HH days. Thus hours=[]; linked menu image unreviewed. |
| Barcade Los Angeles, Highland Park | [Official LA branch](https://barcade.com/location/los-angeles): rendered browser page directly inspected for full address, weekdays 16:00-18:00, $5 house/spicy margaritas, $5 unnamed selected apps. Web text extractor returned only shell, so browser-rendered evidence, not search snippet, establishes primary status. |

## Important Conflicts And Normalization

1. Twohey's: homepage ends at 17:00, dedicated menu at 18:00. Only the common 15:00-17:00 interval is primary; unresolved extension is not encoded.
2. Maestro: HH heading includes Mondays but same page says closed Mondays. No Monday record window.
3. Chamo: HH advertises 20:00 end Monday-Friday, but official Monday-Thursday store close is 19:30. Monday-Thursday windows explicitly conflicting/conditional; Friday is primary and consistent.
4. El Portal: recurring HH block says Tuesday-Friday until 18:00, but embedded Wednesday and Friday post captions say 17:00. Wednesday/Friday windows flagged conflicting. Weekend 15:00-17:00 and Tuesday/Thursday block are primary. Do not confuse Tuesday's separate 16:00-close taco promotion with every HH window.
5. Momed: [older summer-2024 official PDF](https://www.atmomed.com/files/hh-menu-summer-24-pdf.pdf) still discoverable with $7 cocktails and 4% fee. Current homepage links May-2025 PDF with $8 cocktails and 5% fee; current linked asset wins. Both were inspected; older prices not entered.
6. Marina's Monday all-day and Foothill's Wednesday all-day extensions are documented but not assigned guessed endpoints. Explicit bounded windows are included, so encoded schedules are not exhaustive.
7. Octopus reverse-HH "close" is normalized from same-page branch operating hours, not a city-wide or chain-wide guess.
8. GRANVILLE's weekday statement appears with its explicit list of branches; Pasadena/Burbank are included on that list. NoHo all-day exception is not applied.
9. Tam O'Shanter is in Atwater Village; Los Feliz Boulevard is its street, not evidence of Los Feliz-neighborhood ownership.

## Access, Secondary Evidence And Exclusions

- Checker Hall's linked September-2026 PNG menu: web fetch failed; browser safety policy blocked its CDN. The image source is included with reviewedOn=null. No workaround or alternate fetch after the policy block; no menu contents/days/prices inferred.
- John Sparr's HH image: fetch failed. Only surrounding official page text was reviewed; image content not marked reviewed.
- Lucky Baldwins: menu page timed out twice. Search snippets suggested Pasadena branch HH, but neither branch was promoted into the final array on snippet evidence.
- [Kue's homepage](https://kuesrestaurant.com/) was directly inspected and explicitly says temporarily closed, notwithstanding its HH link. Excluded from the current-location set.
- [Slater's legacy Pasadena HH page](https://slaters5050.com/menus/happy-hour-pasadena/) remains discoverable but current navigation omits Pasadena. Branch currentness/address not sufficiently established; excluded.
- [Edwin Mills HH page](https://edwinmills.com/happy-hour/) was inspected, but not needed to reach 24. A discoverable older official PDF has a 2014 document title and obsolete mimosa pricing relative to current page. Its low historical prices were not imported.
- Search-guide snippets, Reddit posts, aggregator menus and shopping-center offers were discovery leads only. Snippets are secondary, not reviewed official branch evidence. No JSON schedule or menu item derives solely from a search snippet.
- An older Checker Hall guide search snippet said daily 17:00-18:00, unlike current official 16:00-18:00 footer. It cannot establish current days, and no secondary hours were substituted.
- Smoke House aggregator snippets have divergent historical HH hours and prices. Official current specials page controls its schedule; aggregator prices are omitted.
- Restaurants in excluded neighborhoods or similarly named Glendale AZ, Pasadena TX and foreign Alhambra locations were not accepted.

## Remaining Limitations

No phone calls, live staff verification, ratings, review scores or asserted coordinates. No minimum spend, seating rule, food requirement, or surcharge invented where not established. Menu item amounts exclude taxes, tips, optional/mandatory service fees and additions. Known restrictions/fees are in per-record notes; "none" means no restriction identified in inspected evidence, not a guarantee of unrestricted service.

Schedules are local Los Angeles time with full weekdays and end-exclusive HH:MM strings. Partial bounded schedules intentionally underrepresent documented but unbounded extensions. Records with empty menu or unknown days remain research leads, not complete priced combinations. The source's publication/asset date is distinct from the review date; an accessible page is not proof its operator updated it recently.

