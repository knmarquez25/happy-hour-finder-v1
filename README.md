# Happy Hour Finder V1

A small class-project web app that ranks real DTLA happy-hour options based on:

- requested day and time
- budget
- atmosphere
- food and drink preferences
- distance
- overall reputation
- quick preset searches and budget changes
- neighborhood filtering

The ranking intentionally gives the most weight to whether happy hour is active at the requested time. This V1 uses a 28-restaurant DTLA seed list from public happy-hour guides and labels uncertainty instead of claiming live verification.

## Try It Locally

```bash
npm run dev
```

Then open `http://localhost:4173`.

## Realistic Example

Input: Downtown LA, Thursday 5:30 PM, within 3 miles, about $25, tacos or seafood, margaritas, lively atmosphere.

Output: The app ranked Sol Agave first with a score of 92 because its listed happy hour is active, the budget estimate fits, and its food/drink tags match tacos, seafood, and margaritas. Kombu Sushi ranked second with a score of 88, and Resident and The Mermaid tied next at 84.

Users can also try preset searches like "Cozy date night" or "Seafood + wine," then change the budget with one click to see how the ranking shifts.

## Assignment Questions

**What are you trying to improve?** Choosing a happy-hour spot without opening a bunch of menus and guessing which deal is currently active.

**What would the system need to know?** Location, requested day/time, distance, budget, food/drink preferences, atmosphere, and verified happy-hour details.

**What should it produce?** A ranked list with match scores, specials, popular items, uncertainty notes, and a suggested food/drink combo.

**How would you know it was good?** The top results should be open for happy hour at the requested time and fit the user's budget and vibe.

**What feedback would improve it?** Users could flag outdated hours, bad matches, missing deals, or combos that exceed the budget.

## Reflection

**One thing I learned from testing it:** Timing matters more than ratings for happy hour recommendations.

**One limitation of the current version:** It uses a curated DTLA seed list and does not yet verify live menus or prices in real time.

**The next improvement I'd make:** Expand toward a 150+ restaurant LA dataset by connecting to live restaurant/menu sources and adding a confidence score for verified happy-hour information.
