# Central Happy-Hour Research

Reviewed: 2026-10-19. Scope: 24 distinct physical restaurant locations in the requested central/west-central ownership area. No app code or other research files changed.

## Coverage

- Records: **24**. Each has a full street address and a directly inspected official listing of happy hour or Aperitivo.
- **23 locations have at least one primary-status schedule**; Il Cielo has official evidence but its encoded schedule is conflicting. Messhall also has conflicting Monday-Thursday windows, alongside a primary Friday window.
- **13 strict full combos**: at least one primary schedule plus separately priced, primary-supported food and drink usable in the same window. Messhall qualifies on Friday; Ocean Prime's food pair qualifies on Friday only. These are possible orders, not advertised bundle deals.
- **14 locations have exact food and drink prices** if Il Cielo's unresolved schedule is included. Lawry's has a confirmed discounted food item, but its final price is null and does not count.
- **9 schedule-only records** have empty menus: Laurel Hardware, Marea, Edendale, L&E, Hugo's, Jade, both Bacari locations, CIRCA 55.
- Coordinates are null for every record. No coordinates, Census matches, measured distances, ratings, or review counts were fabricated. Addresses are intended for the parent's Census geocoding and final 25-mile DTLA-radius test, which was not performed here.
- Source-level dates distinguish direct review from failed access. No retained schedule or item relies solely on a search snippet or guide. Two secondary address sources complete missing postal information.

## Location Evidence

Each link below was directly inspected unless explicitly labeled otherwise. JSON source notes carry item-level provenance, restrictions, and additional address links.

| Location | Official evidence | Coverage |
| --- | --- | --- |
| Messhall Kitchen, Los Feliz | [Menu](https://messhallkitchen.com/-food-menu?destination=food_menu&promotion=custom_promotion&source=header&spot_id=19529), [location](https://messhallkitchen.com/) | Priced food/drink; opening conflict |
| The Formosa Cafe, West Hollywood | [Golden Hour menu](https://theformosacafe.com/menu), [location](https://theformosacafe.com/location) | Priced food/drink; ZIP conflict |
| Laurel Hardware, West Hollywood | [Branch page](https://www.laurelhardware.com/) | Schedule only |
| Marea, Beverly Hills | [Menu](https://www.marearestaurant.com/beverly-hills/menu), [contact](https://www.marearestaurant.com/beverly-hills/contact) | Bar/lounge schedule only |
| The Black Cat, Silver Lake | [Branch and happy-hour menu](https://www.theblackcatla.com/) | Priced food/drink; 21+ |
| 33 Taps, Silver Lake | [Branch](https://www.eatdrink33.com/silver-lake-location/), [menu](https://www.eatdrink33.com/menus/), [all-location specials](https://www.eatdrink33.com/event/) | Priced food/drink; late kitchen limits |
| 33 Taps, West Hollywood | [Branch](https://www.eatdrink33.com/west-hollywood-location/), [menu](https://www.eatdrink33.com/menus/), [all-location specials](https://www.eatdrink33.com/event/) | Priced food/drink; late kitchen limits |
| Edendale, Silver Lake | [Hours](https://theedendale.com/hours-info/), [address](https://theedendale.com/contact-directions/) | Schedule only; menu inaccessible |
| L&E Oyster Bar, Silver Lake | [Branch](https://www.leoysterbar.com/), [Upstairs & Happy Hour](https://www.leoysterbar.com/upstairs) | Schedule only; image inaccessible |
| Gracias Madre, West Hollywood | [Location/menu links](https://graciasmadre.com/pages/location-menus), [linked PDF, page 6](https://cdn.shopify.com/s/files/1/0905/4132/6630/files/GM_Menus_-_Web_260930.pdf?v=1791161657) | Priced food/drink; margarita conflict |
| La Boheme, West Hollywood | [Happy-hour section](https://www.labohemeweho.com/menus/), [hours/address](https://www.labohemeweho.com/location/la-boheme/) | Priced food/drink |
| Hugo's, West Hollywood | [Branch](https://www.hugosrestaurant.com/), [branch PDF](https://www.hugosrestaurant.com/files/hugos-menu-weho-pdf.pdf) | Schedule only |
| L'Antica Pizzeria da Michele, Hollywood | [Happy-hour section](https://damicheleusa.com/dinner-brunch/), [branch hours/address](https://damicheleusa.com/contact-hollywood/) | Priced food/drink; bar/high tops |
| Ocean Prime, Beverly Hills | [Branch and happy-hour sections](https://ocean-prime.com/locations-menus/beverly-hills/) | Priced food/drink on Friday; lounge only |
| Bacari, Beverly Hills | [Branch](https://www.eatwithbacari.com/beverly-hills) | Schedule only |
| Jade, Beverly Hills | [Branch](https://www.jadebeverlyhills.com/) | Schedule only |
| Il Cielo / Bar Cielo, Beverly Hills | [Aperitivo menu](https://www.ilcielo.com/menus/), [conflicting bar page](https://www.ilcielo.com/bar-cielo/) | Priced food/drink; schedule conflicting |
| Beverly Bar, Beverly Hills | [Happy-hour menu](https://beverlybar.com/happy-hour/), [address](https://beverlybar.com/) | Priced food/drink |
| IKI Ramen + Sushi, Koreatown | [Happy-hour page explicitly naming branch](https://ikiramen.com/happenings/happy-hour) | Priced food/drink |
| IKI Ramen + Sushi, Hollywood | [Happy-hour page explicitly naming branch](https://ikiramen.com/happenings/happy-hour) | Priced food/drink |
| Bacari, Silverlake | [Branch](https://www.eatwithbacari.com/silverlake) | Schedule only |
| CIRCA 55, Beverly Hills | [Restaurant](https://www.hilton.com/en/hotels/laxbhhh-the-beverly-hilton/dining/), [hotel address](https://www.hilton.com/en/hotels/laxbhhh-the-beverly-hilton/) | Schedule only |
| Lawry's The Prime Rib, Beverly Hills | [Branch happy hour and current PDF links](https://www.lawrysonline.com/lawrys-the-prime-rib-beverly-hills/happenings/happy-hour/) | Priced drinks; discounted food price null |
| Prospect Gourmand, Beverly Hills | [Official lunch/happy-hour menu](https://www.prospectgourmand.com/menu-lunch) | Priced food/drink; close-based hours |

## Conflicts and Conditions

- **Messhall:** the [menu](https://messhallkitchen.com/-food-menu?destination=food_menu&promotion=custom_promotion&source=header&spot_id=19529) starts happy hour at 3pm weekdays, but [general hours](https://messhallkitchen.com/) start at 4pm Monday-Thursday. Those windows are conflicting. Friday is primary. Guide-only all-night Monday and $1 Tuesday claims were not imported.
- **Formosa:** its [official location page](https://theformosacafe.com/location) lists 90069 in the visit block and 90046 in the FAQ. JSON uses 90046, with the discrepancy preserved for geocoding resolution.
- **Gracias Madre:** [homepage](https://graciasmadre.com/) promotes $9 margaritas; the linked current PDF prints $11 Purista, $7 cerveza, $10 nachos, and a $12 meal. PDF terms were retained; Purista is conflicting. The unconflicted cerveza and $7 tostada still support a strict combo.
- **Il Cielo:** [main menu](https://www.ilcielo.com/menus/) says Wednesday-Friday and Sunday 5:30-7:30pm; [bar page](https://www.ilcielo.com/bar-cielo/) says Monday-Friday 5-8pm with Friday 5:30pm start. No definitive schedule is claimed.
- **33 Taps:** late windows use each branch's documented closing time. Sunday kitchens close before the 9:30pm late offer begins. Afternoon food/drink pairs are clean; late offers must respect the kitchen limits in JSON.
- **Ocean Prime:** $2 oysters and the $20 Veuve glass are Friday-only, not available throughout the weekday schedule. Unpriced discounts were not converted into invented final food prices.
- **Lawry's:** the current [linked happy-hour PDF](https://www.lawrysonline.com/wp-content/uploads/2026/05/9642-BH-Bar-Book-INSERTS-Happy-Hour-Beer-Q3-4.25x11-061325-HAPPY-HOUR.pdf) agrees with the live page on 4:30-6:30pm. An [older indexed PDF](https://www.lawrysonline.com/wp-content/uploads/2024/02/Beverly-Hills-Happy-Hour-Menu.pdf) was seen only as a search result, not directly reviewed; its 5:30pm end was not adopted. The $5-off Bar Bites offer establishes eligibility, not a printed final Sando price.
- **Bacari Silverlake:** official 5-6pm used, not the 4-6pm claim in a [secondary guide search result](https://hhatlas.com/los-angeles/silver-lake-echo-park/bacari-silver-lake/). Guide item claims were not adopted.
- **Prospect Gourmand:** official 3pm-close used, not the 3-6pm claim in a [tourism guide search result](https://lovebeverlyhills.com/articles/view/best-beverly-hills-happy-hours). End times come from the official page's own daily closing hours.
- **Marea:** menu explicitly includes Saturday; contact page omits it. Saturday remains primary on the menu evidence. Bar/lounge restriction retained. Mixed extracted menus prevented reliable item attribution.
- **IKI:** the offer names the 740 S Western and 6565 Sunset branches. The separate IKI Nori at 6464 Sunset is not a retained location.

## Access and Exclusions

- Edendale's [happy-hour PDF](https://theedendale.com/wp-content/uploads/2025/05/Edendale-Happy-Hour-Menu.pdf) returned an internal access error. Search snippets were secondary only; no snippet prices adopted. Source reviewedOn is null. Monday all-night service is acknowledged in notes but not assigned a guessed numeric end time.
- L&E's [linked image menu](https://images.squarespace-cdn.com/content/v1/68b39499dcf6053c8e04aa04/029f8ae1-627d-4b9e-8735-8f999f3071f3/NEW%2BUPSTAIRS%2BMENU%2B%2B8.16.26.jpg) was inaccessible through the tool. Image source is unreviewed, with reviewedOn null.
- Postal completion only: [Discover Los Angeles for Edendale](https://www.discoverlosangeles.com/eat-drink/edendale-grill) and [OpenTable for L&E](https://www.opentable.com/l-and-e-oyster-bar) were directly reviewed but remain secondary. Their older regular menu descriptions were not used.
- **Electric Owl excluded:** [official homepage](https://www.electricowl.la/) explicitly announces closure.
- **EMC Koreatown excluded:** its [older official page](https://emcseafoodgroup.com/location/) still lists happy hour, but [Eater's search result](https://la.eater.com/venue/7903/emc-seafood) and [Wanderlog's search result](https://wanderlog.com/place/details/418148/emc-seafood--raw-bar) say permanently closed. Closure results are secondary, not directly reviewed; conservative exclusion avoids presenting a disputed operating location.
- **Jemma excluded:** its indexed Aperitivo PDF redirected to a generic page when opened, so the search snippet was not treated as a reviewed current menu.
- No excluded neighborhood was added to reach 24. No branch was duplicated as multiple records for multiple windows. Two IKI branches, two 33 Taps branches, and two Bacari branches are physically distinct addresses.

## Limits

Live official listings demonstrate currently published offers, not same-day phone confirmation or guaranteed availability. Menu dating and website maintenance vary. No source-access restrictions were bypassed. Taxes, tips, service charges, holidays, private events, and item availability can affect the final bill. Exact cents are printed per-item amounts only; ranges, bundles split into components, and computed discount prices were not used. End times are exclusive; midnight closes use 00:00. No demographic or geographic inference substitutes for the parent's final geocoding check.
