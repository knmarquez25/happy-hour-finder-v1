import { serviceError } from "./ai.js";
import {
  identity,
  normalizeCandidate,
  normalizeApproval,
  publicUrl,
} from "../src/candidates.js";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function createReviewStore({
  url = process.env.SUPABASE_URL || "",
  anonKey = process.env.SUPABASE_ANON_KEY || "",
  serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  ownerId = process.env.OWNER_USER_ID || "",
  fetchImpl = fetch,
} = {}) {
  const configured = Boolean(
    /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url) &&
    anonKey &&
    serviceKey &&
    uuid.test(ownerId),
  );
  async function api(path, { method = "GET", body, token, auth = false } = {}) {
    if (!configured)
      throw serviceError(
        "The shared review queue is not configured yet. Nothing has been saved.",
        503,
      );
    let r;
    try {
      r = await fetchImpl(url + path, {
        method,
        headers: {
          apikey: auth ? anonKey : serviceKey,
          Authorization: "Bearer " + (token || serviceKey),
          "Content-Type": "application/json",
          Prefer:
            method === "POST"
              ? "resolution=ignore-duplicates,return=representation"
              : "return=representation",
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
        signal: AbortSignal.timeout(10000),
      });
    } catch {
      throw serviceError(
        "The review service is unavailable. Please try again.",
        503,
      );
    }
    if (!r.ok)
      throw serviceError(
        auth
          ? "Owner sign-in has expired or is invalid."
          : "The review queue could not save this change. Please retry.",
        auth ? 401 : 503,
      );
    try {
      return await r.json();
    } catch {
      throw serviceError(
        "The review service returned an unreadable response.",
        503,
      );
    }
  }
  async function owner(token) {
    if (typeof token !== "string" || token.length < 5 || token.length > 5000)
      throw serviceError("Owner sign-in is required.", 401);
    const user = await api("/auth/v1/user", { auth: true, token });
    if (user.id !== ownerId)
      throw serviceError(
        "Only the app owner can approve or reject a place.",
        403,
      );
    return user.id;
  }
  const checkId = (id) => {
    if (!uuid.test(id)) throw serviceError("Invalid submission ID.", 400);
  };
  return {
    configured,
    publicConfig: () => ({
      configured,
      ...(configured ? { url, anonKey } : {}),
    }),
    owner,
    async list() {
      const columns =
        "id,status,payload,menu_lookup,approved_payload,created_at,reviewed_at,review_evidence(id,source_url,note,created_at)";
      async function listStatus(status) {
        const rows = [];
        const order =
          status === "pending" ? "created_at.desc,id.asc" : "id.asc";
        for (let offset = 0; offset < 10000; offset += 200) {
          const page = await api(
            `/rest/v1/review_candidates?select=${columns}&status=eq.${status}&order=${order}&limit=200&offset=${offset}&review_evidence.limit=10`,
          );
          rows.push(...page);
          if (page.length < 200) return rows;
        }
        throw serviceError(
          "The review list is too large to load safely. Contact the app owner.",
          503,
        );
      }
      return [
        ...(await listStatus("pending")),
        ...(await listStatus("approved")),
      ];
    },
    async save(candidates) {
      if (!candidates.length) return [];
      return api("/rest/v1/review_candidates?on_conflict=candidate_key", {
        method: "POST",
        body: candidates.slice(0, 6).map((raw) => {
          const payload = normalizeCandidate(raw);
          return {
            candidate_key: identity(payload),
            payload,
            status: "pending",
          };
        }),
      });
    },
    async saveMenu(id, candidate, notice) {
      checkId(id);
      const menu_lookup = {
        candidate: candidate === null ? null : normalizeCandidate(candidate),
        checkedAt: new Date().toISOString(),
        notice: String(notice || "Menu remains unverified.").slice(0, 750),
      };
      const rows = await api(
        `/rest/v1/review_candidates?id=eq.${id}&status=eq.pending`,
        { method: "PATCH", body: { menu_lookup } },
      );
      if (!rows.length)
        throw serviceError(
          "This submission was already reviewed. Refresh the queue.",
          409,
        );
      return rows[0];
    },
    async evidence(id, input) {
      checkId(id);
      let source_url;
      try {
        source_url = publicUrl(input.sourceUrl);
      } catch {
        throw serviceError("Use a public HTTPS menu or photo link.", 400);
      }
      if (
        typeof input.note !== "string" ||
        !input.note.trim() ||
        input.note.length > 750
      )
        throw serviceError(
          "Add evidence details between 1 and 750 characters.",
          400,
        );
      return api("/rest/v1/review_evidence", {
        method: "POST",
        body: { candidate_id: id, source_url, note: input.note.trim() },
      });
    },
    async decide(id, input, token) {
      checkId(id);
      const reviewed_by = await owner(token);
      if (!["approved", "rejected"].includes(input.status))
        throw serviceError("Choose approve or reject.", 400);
      let approved_payload = null;
      if (input.status === "approved")
        try {
          approved_payload = normalizeApproval(input.payload);
        } catch (e) {
          throw serviceError(e.message, 400);
        }
      const rows = await api(
        `/rest/v1/review_candidates?id=eq.${id}&status=eq.pending`,
        {
          method: "PATCH",
          body: {
            status: input.status,
            approved_payload,
            reviewed_by,
            reviewed_at: new Date().toISOString(),
          },
        },
      );
      if (!rows.length)
        throw serviceError(
          "This submission was already reviewed or changed. Refresh the queue.",
          409,
        );
      return rows[0];
    },
  };
}
