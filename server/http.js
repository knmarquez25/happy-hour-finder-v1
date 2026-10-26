import http from "node:http";
import { readFile, realpath } from "node:fs/promises";
import { dirname, resolve, extname, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { interpretRequest, serviceError } from "./ai.js";
import { searchPlaces } from "./search.js";
import { createReviewStore } from "./reviews.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".md": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};
const publicDocs = new Set([
  "/docs/final-submission.md",
  "/docs/ai-discovery-evaluation.md",
  "/docs/deployment.md",
  "/docs/class-post.md",
  "/docs/evaluation-report.md",
]);
async function readJson(req, allowedFields = ["query"]) {
  if (
    !req.headers["content-type"]?.toLowerCase().startsWith("application/json")
  )
    throw serviceError("Send a JSON request.", 415);
  if (Number(req.headers["content-length"]) > 8192)
    throw serviceError("Request is too large.", 413);
  const chunks = [];
  let bytes = 0;
  for await (const chunk of req) {
    bytes += chunk.length;
    if (bytes <= 8192) chunks.push(chunk);
  }
  if (bytes > 8192) throw serviceError("Request is too large.", 413);
  try {
    const data = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (
      !data ||
      Array.isArray(data) ||
      typeof data !== "object" ||
      Object.keys(data).some((k) => !allowedFields.includes(k))
    )
      throw new Error();
    return data;
  } catch {
    throw serviceError("Send a valid JSON object containing query.", 400);
  }
}
export function createApp({
  apiKey = process.env.GEMINI_API_KEY || "",
  model = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite",
  allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean),
  fetchImpl = fetch,
  rateLimit = 10,
  searchModel = process.env.SEARCH_MODEL || "gemini-2.5-flash-lite",
  searchImpl = searchPlaces,
  reviewStore = createReviewStore(),
} = {}) {
  const origins = new Set(
    allowedOrigins.map((value) => {
      const u = new URL(value);
      if (!["https:", "http:"].includes(u.protocol) || u.origin !== value)
        throw new Error(
          "ALLOWED_ORIGINS must contain exact HTTP(S) origins without paths.",
        );
      return u.origin;
    }),
  );
  let minuteStart = Date.now(),
    hourStart = Date.now(),
    hourCalls = 0,
    inFlight = 0;
  const addresses = new Map();
  let cachedReviews,
    cacheUntil = 0;
  async function reviewList() {
    if (cachedReviews && Date.now() < cacheUntil) return cachedReviews;
    const rows = await reviewStore.list();
    cachedReviews = rows;
    cacheUntil = Date.now() + 15000;
    return rows;
  }
  function reserve(req, res, cost = 1) {
    const now = Date.now();
    if (now - minuteStart >= 60000) {
      addresses.clear();
      minuteStart = now;
    }
    if (now - hourStart >= 3600000) {
      hourCalls = 0;
      hourStart = now;
    }
    const ip = req.socket.remoteAddress || "unknown";
    if (
      (addresses.get(ip) || 0) + cost > rateLimit ||
      hourCalls + cost > 100 ||
      inFlight >= 2
    ) {
      res.setHeader("Retry-After", "60");
      throw serviceError(
        "AI or review requests are busy or limited. Please try again later.",
        429,
      );
    }
    addresses.set(ip, (addresses.get(ip) || 0) + cost);
    hourCalls += cost;
    inFlight++;
  }
  const app = http.createServer(async (req, res) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    const json = (status, data) => {
      res.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      });
      res.end(JSON.stringify(data));
    };
    try {
      const url = new URL(req.url, "http://localhost");
      const reviewMatch = url.pathname.match(
        /^\/api\/reviews\/([0-9a-f-]{36})\/(evidence|decision)$/i,
      );
      const apiMethod = [
        "/api/status",
        "/api/reviews",
        "/api/review-config",
        "/api/owner",
      ].includes(url.pathname)
        ? "GET"
        : ["/api/discover", "/api/explore"].includes(url.pathname) ||
            reviewMatch
          ? "POST"
          : null;
      if (apiMethod) {
        const origin = req.headers.origin;
        if (origin) {
          let incoming;
          try {
            incoming = new URL(origin);
          } catch {
            throw serviceError(
              "This website is not allowed to use this AI endpoint.",
              403,
            );
          }
          if (
            !["http:", "https:"].includes(incoming.protocol) ||
            incoming.origin !== origin ||
            (!origins.has(origin) && incoming.host !== req.headers.host)
          )
            throw serviceError(
              "This website is not allowed to use this AI endpoint.",
              403,
            );
          res.setHeader("Access-Control-Allow-Origin", origin);
          res.setHeader("Vary", "Origin");
        }
        if (req.method === "OPTIONS") {
          const method = req.headers["access-control-request-method"];
          const headers = (req.headers["access-control-request-headers"] || "")
            .toLowerCase()
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
          if (
            !origin ||
            method !== apiMethod ||
            headers.some(
              (h) =>
                h !== "content-type" &&
                !(
                  h === "authorization" &&
                  (url.pathname === "/api/owner" ||
                    reviewMatch?.[2] === "decision")
                ),
            )
          )
            throw serviceError("Unsupported cross-origin request.", 403);
          res.writeHead(204, {
            "Access-Control-Allow-Methods": method,
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Max-Age": "600",
          });
          return res.end();
        }
      }
      if (url.pathname === "/api/status" && req.method === "GET")
        return json(200, { configured: Boolean(apiKey) });
      if (url.pathname === "/api/discover" && req.method === "POST") {
        const body = await readJson(req);
        if (
          typeof body.query !== "string" ||
          !body.query.trim() ||
          body.query.length > 1000
        )
          throw serviceError(
            "Enter a request between 1 and 1,000 characters.",
            400,
          );
        if (!apiKey)
          throw serviceError(
            "AI is not configured on this server yet. You can still browse every restaurant.",
            503,
          );
        reserve(req, res);
        try {
          return json(200, {
            preferences: await interpretRequest(body.query, {
              apiKey,
              model,
              fetchImpl,
            }),
          });
        } finally {
          inFlight--;
        }
      }
      if (url.pathname === "/api/review-config" && req.method === "GET")
        return json(200, reviewStore.publicConfig());
      if (url.pathname === "/api/reviews" && req.method === "GET")
        return json(200, { records: await reviewList() });
      if (url.pathname === "/api/owner" && req.method === "GET") {
        reserve(req, res);
        try {
          await reviewStore.owner(
            req.headers.authorization?.replace(/^Bearer /, ""),
          );
          return json(200, { owner: true });
        } finally {
          inFlight--;
        }
      }
      if (url.pathname === "/api/explore" && req.method === "POST") {
        const body = await readJson(req);
        if (
          typeof body.query !== "string" ||
          !body.query.trim() ||
          body.query.length > 1000
        )
          throw serviceError(
            "Enter a request between 1 and 1,000 characters.",
            400,
          );
        reserve(req, res, 2);
        try {
          const result = await searchImpl(body.query, {
            apiKey,
            searchModel,
            model,
            fetchImpl,
          });
          if (!reviewStore.configured)
            return json(200, {
              ...result,
              saved: false,
              records: [],
              notice:
                "These discoveries are not saved: the shared review queue needs setup.",
            });
          try {
            await reviewStore.save(result.candidates);
            cacheUntil = 0;
            return json(200, {
              ...result,
              saved: true,
              records: await reviewList(),
            });
          } catch {
            return json(200, {
              ...result,
              saved: false,
              records: [],
              notice:
                "Found these places, but the review queue could not save them. Retry before leaving this page.",
            });
          }
        } finally {
          inFlight--;
        }
      }
      if (reviewMatch && req.method === "POST") {
        const action = reviewMatch[2];
        const body = await readJson(
          req,
          action === "evidence" ? ["sourceUrl", "note"] : ["status", "payload"],
        );
        reserve(req, res);
        try {
          const record =
            action === "evidence"
              ? await reviewStore.evidence(reviewMatch[1], body)
              : await reviewStore.decide(
                  reviewMatch[1],
                  body,
                  req.headers.authorization?.replace(/^Bearer /, ""),
                );
          cacheUntil = 0;
          return json(200, { record });
        } finally {
          inFlight--;
        }
      }
      if (!["GET", "HEAD"].includes(req.method))
        return json(405, { error: "Method not allowed." });
      let pathname;
      try {
        pathname = decodeURIComponent(url.pathname);
      } catch {
        return json(404, { error: "Not found." });
      }
      if (pathname === "/") pathname = "/index.html";
      const allowed =
        ["/index.html", "/legacy.html"].includes(pathname) ||
        publicDocs.has(pathname) ||
        /^\/src\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_.-]+\.(js|css)$/.test(
          pathname,
        ) ||
        pathname === "/docs/assets/ai-discovery-desktop.png";
      if (!allowed) return json(404, { error: "Not found." });
      const target = await realpath(resolve(root, "." + pathname));
      if (
        !target.startsWith(root + sep) ||
        target !== resolve(root, "." + pathname)
      )
        return json(404, { error: "Not found." });
      const bytes = await readFile(target);
      res.writeHead(200, {
        "Content-Type": mime[extname(target)] || "application/octet-stream",
        "Cache-Control": "no-cache",
      });
      res.end(req.method === "HEAD" ? undefined : bytes);
    } catch (error) {
      if (!res.headersSent)
        json(error.status || 404, {
          error: error.status ? error.message : "Not found.",
        });
      else res.end();
    }
  });
  app.requestTimeout = 10_000;
  app.headersTimeout = 10_000;
  return app;
}
