# Approved free-hosting follow-up

The user requires no payment, obtained a private Gemini key, chose GitHub hosting, and authorized GitHub Pages + Render Free. This supersedes the original OpenAI choice and same-origin-only hosting. The key must stay private and must not be printed or committed.

Use Gemini 3.5 Flash-Lite structured JSON extraction, `GEMINI_API_KEY` on the server only, no paid fallback/grounding. User verifies their Google project is Free; a model name cannot determine billing. Update privacy copy for Google's free-tier data use. Add exact-origin CORS for `https://knmarquez25.github.io`. Public `src/config.js` contains only the actual future Render URL. `render.yaml` selects Free and prompts for the private secret. Data and one-list behavior remain unchanged.

Tests: Gemini and CORS expectations observed failing before migration, then passing. Added actual browser preflight across two local servers using an external-provider fixture, and global/concurrent quota regressions. Full suite passes 76/76. Deployment requires authenticated hosting setup, user-entered secret, public-window acceptance and real free-tier model smoke test; fixtures are not live evaluation.

Fresh read-only provider/hosting review: no critical or important issues. Deferred minor observations: reverse-proxy socket addresses may share the per-address quota; Retry-After stays 60 seconds even for the hourly cap. Both are demo limitations, not claims of distributed quota enforcement.

Published implementation branch `codex/ai-menu-discovery` at `c43210a5c93d934b2ee584ec42a53ffe55061c02` using the connected GitHub plugin. No secrets uploaded. Render account created/verified by user; Free compute selected before any service creation. Backend deployment and actual endpoint wiring remain in progress.

Deployment completed: user entered the key directly into Render and deployed; service reports Node/Free and live at https://happy-hour-finder-ai.onrender.com. Config commit `70681b3885ecbd1b4d43fed27642f77b1da7b783` wires that public URL. Pages source changed to `codex/ai-menu-discovery` / root; run `40270820162` succeeded. No main-branch merge or paid plan used.

Live verification: three predeclared smoke cases passed in a fresh unauthenticated Chrome context through the actual Pages + Render + Gemini connection. Tacos/margarita/$25 and Pasadena matched all expected fields; near-me requested clarification and retained 111 records. Warm latencies 1236/810/944 ms. Coyote custom menu subtotal $14.75; Clear restores 111. Results in evaluation/live-smoke.json. This sample is not broad model accuracy, a user study, or current restaurant verification. Class discussion has not been submitted.
