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

Default `GEMINI_MODEL=gemini-3.5-flash-lite`. The app makes one bounded structured-output request. It has no paid grounding tools, paid-model fallbacks, or automatic billing upgrade. A model name alone cannot prove account billing status; verify Free in AI Studio. On quota or account failure, show an error and preserve browsing.

Submitted text goes to Google to interpret optional preferences. Free-tier content may be used to improve Google's products; the interface discloses this. The application does not persist/log queries. Restaurant offers and prices are from the reviewed dataset. Live menu/social retrieval is not implemented.

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
