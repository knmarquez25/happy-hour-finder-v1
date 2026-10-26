# Free setup: GitHub Pages + Gemini + Render

The website stays on GitHub Pages. A Render **Free** Node service keeps the Gemini key private and accepts requests from the specific GitHub Pages origin. Do not enable billing, choose paid hosting, or add paid fallback models.

## Local build

Requires Node 22+:

```sh
npm ci
npm start
```

Open <http://127.0.0.1:4176>. All 111 records and menu subtotals work without a key. The previous interface remains at `/legacy.html`. For local AI, copy `.env.example` to `.env` and enter `GEMINI_API_KEY` privately, then restart. Never paste a key into chat, browser JavaScript, GitHub, or screenshots. `.env` is ignored and is not served by the app.

## Gemini free project

Use a key from a **Free** project in [Google AI Studio](https://aistudio.google.com/apikey). Do not link a billing account. Google currently lists [Gemini 3.5 Flash-Lite](https://ai.google.dev/gemini-api/docs/pricing) with free input/output within free-tier limits. New projects should use a current model rather than legacy 2.5 models with restricted access.

Default `GEMINI_MODEL=gemini-3.5-flash-lite`. The app makes one bounded structured-output request. The original preference parser has no grounding tools; the separate discovery workflow below uses a model listed for free search. There are no paid-model fallbacks or automatic billing upgrades. A model name alone cannot prove account billing status; verify Free in AI Studio. On quota or account failure, show an error and preserve browsing.

Submitted text goes to Google to interpret optional preferences. Free-tier content may be used to improve Google's products; the interface discloses this. The application does not persist/log queries. Restaurant offers and prices are from the reviewed dataset. Additional grounded discoveries are kept in the separate owner-review workflow below; social-platform access is not guaranteed.

## Render Free backend

Publish the reviewed code to GitHub first. Create a [Free Render web service](https://render.com/docs/free) using public repository `https://github.com/knmarquez25/happy-hour-finder-v1` and the branch containing this iteration. The public-repository option avoids granting a new integration access to private repositories.

The included `render.yaml` selects `plan: free`, Node 22, `npm ci`, `npm start`, and health check `/api/status`. In a manual service flow, enter those same values and choose **Free**.

| Setting           | Value                                                      |
| ----------------- | ---------------------------------------------------------- |
| `NODE_VERSION`    | `22`                                                       |
| `HOST`            | `0.0.0.0`                                                  |
| `GEMINI_MODEL`    | `gemini-3.5-flash-lite`                                    |
| `ALLOWED_ORIGINS` | `https://knmarquez25.github.io`                            |
| `GEMINI_API_KEY`  | User enters privately in Render's secret environment field |

Render supplies `PORT`. Never paste a key into YAML. Blueprint setup prompts for it with `sync: false`; it is not stored in Git. Do not select a paid instance or paid upgrade. Free services sleep when idle and have resource limits; the first request can wait for a wakeup.

## GitHub Pages connection

When Render supplies an actual live service URL, set `apiBase` in `src/config.js` to that address and publish the updated file. This is a **public backend address, never a key**. Empty `apiBase` means local/same-server hosting.

Use the repository's GitHub Pages configuration to publish the frontend branch. The public website remains `https://knmarquez25.github.io/happy-hour-finder-v1/`. Pages serves static files; it cannot run Node or store a runtime API secret. The backend allows exact-origin CORS/preflight from that website, without wildcard origins or browser-stored keys.

Verify the actual public site in a private/incognito window: browse all records, ask `Tacos and margaritas around $25`, inspect interpreted criteria/results, select menu items, and Clear. Record model, request, returned fields/result IDs, and latency before claiming live-model evaluation. Until this succeeds, public acceptance remains pending.

## Class post

[Bruin Learn — Final Build](https://bruinlearn.ucla.edu/courses/237790/discussion_topics/1491803) requires a gallery/build link and answers to all six steps. No separate gallery URL appears in its instructions. Update `docs/final-submission.md` with the actual verified URL and live-build status before posting; never submit localhost or an older build as this AI iteration.

## Limits and tests

Controls: 1,000 query characters, 8 KiB body, 10 requests/address/minute, 100/process/hour, two concurrent calls, 20-second provider timeout, validated model output, private static paths blocked. These are demo controls, not distributed authentication or account cost guarantees. Proxy socket addresses may be shared and process restarts reset counters. Keep the provider project on Free.

```sh
npm test
npm run test:discovery-browser
npm run test:cross-origin
npm run evaluate
npm run evaluate:holdout
```

The discovery browser test needs the local server running and Chrome installed. The cross-origin test starts its own two servers. Both use explicit provider fixtures, not the user's key. Historical engine benchmarks remain separate from new AI/UI verification.

References: [structured output](https://ai.google.dev/gemini-api/docs/structured-output), [key security](https://ai.google.dev/gemini-api/docs/api-key), [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages), [Render secret prompts](https://render.com/docs/blueprint-spec#prompting-for-secret-values).

## New-place discovery and owner review

The new workflow uses a separate grounded Google Search call on `gemini-2.5-flash-lite`, followed by schema extraction on the existing Gemini model. This model is listed with free-tier search access; actual project eligibility and quotas must be tested. There is no paid-model fallback. A failed search preserves the researched list and displays the service error. Search is limited to LA and Orange County and six candidates per request; every saved offer needs a cited happy-hour passage naming the location and menu item. Citations/search summaries are unverified, not live restaurant confirmation.

Supabase Free provides durable candidates/evidence and owner Auth. Run `supabase/reviews.sql` in a dedicated project. Tables have RLS and no anon/authenticated grants. Create the owner's email/password user through the Supabase dashboard; the owner enters the password privately. Add these to Render's private environment, preserving the Gemini key:

- `SUPABASE_URL`: project HTTPS URL, without trailing slash.
- `SUPABASE_ANON_KEY`: legacy anon/public client key.
- `SUPABASE_SERVICE_ROLE_KEY`: legacy service_role key, server only.
- `OWNER_USER_ID`: the Auth user's UUID; never accept a client claim of ownership.
- `SEARCH_MODEL=gemini-2.5-flash-lite`.

Rebuild/deploy the latest branch after saving. The public config endpoint exposes only the project URL and anon key, never the service role or owner password. Owner login goes directly to Supabase; the access token stays in memory and expires. Reloading requires signing in again. Every approval/rejection validates the token with Supabase and compares its user ID with `OWNER_USER_ID`. Disable public Auth signups if this project will only host the owner account.

A search automatically adds new candidates to **Needs verification**. Visitors can append public evidence links and notes. The owner opens **Owner sign in**, reviews/edits the menu and restaurant source, chooses county and a shared schedule/seating restriction, confirms the items have no additional purchase conditions, and approves. That operation atomically stores an approval snapshot and reviewer date. Pending records cannot enter approved browsing or combo totals. Community evidence cannot edit the approval snapshot. Unknown prices remain null. This first version publishes one shared schedule from the owner form; use only the items supported together under that schedule. Conditional purchase/pairing offers should remain pending or be rejected.

Published records are paginated independently of the pending queue; the pending interface shows the latest 200 submissions and latest ten evidence notes per place. Process quotas are demo protections, not distributed abuse prevention. Add CAPTCHA/accountability and larger queue pagination before wide public distribution. Reject is retained in the database rather than deleted; reopening/editing published snapshots needs a future owner-management screen.

Run `npm test`, `npm run test:discovery-browser`, and `npm run test:reviews-browser`. The latter tests discovery fixtures, missing prices, community evidence, owner editing/publication, reload persistence and narrow viewports. These do not prove the live free model or cloud credentials work. Public acceptance requires a real search, a saved candidate surviving reload, a rejected non-owner decision and an owner-confirmed publication.
