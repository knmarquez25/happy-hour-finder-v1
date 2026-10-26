import { createApp } from "./http.js";
const port = Number(process.env.PORT || 4176);
const host = process.env.HOST || "127.0.0.1";
createApp().listen(port, host, () =>
  console.log(
    `Happy Hour Finder: http://${host}:${port} (Gemini ${process.env.GEMINI_API_KEY ? "configured" : "not configured; browsing available"})`,
  ),
);
