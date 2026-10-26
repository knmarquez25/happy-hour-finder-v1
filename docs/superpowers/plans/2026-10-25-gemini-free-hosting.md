# Approved free-hosting follow-up

The user requires no payment, obtained a private Gemini key, chose GitHub hosting, and authorized GitHub Pages + Render Free. This supersedes the original OpenAI choice and same-origin-only hosting. The key must stay private and must not be printed or committed.

Use Gemini 3.5 Flash-Lite structured JSON extraction, `GEMINI_API_KEY` on the server only, no paid fallback/grounding. User verifies their Google project is Free; a model name cannot determine billing. Update privacy copy for Google's free-tier data use. Add exact-origin CORS for `https://knmarquez25.github.io`. Public `src/config.js` contains only the actual future Render URL. `render.yaml` selects Free and prompts for the private secret. Data and one-list behavior remain unchanged.

Tests: Gemini and CORS expectations observed failing before migration, then passing. Added actual browser preflight across two local servers using an external-provider fixture, and global/concurrent quota regressions. Full suite passes 76/76. Deployment requires authenticated hosting setup, user-entered secret, public-window acceptance and real free-tier model smoke test; fixtures are not live evaluation.
