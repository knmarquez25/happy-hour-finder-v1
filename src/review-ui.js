import { escapeHtml as esc, formatMoney as money } from "./ui-state.js";
import {
  normalizeCandidate,
  identity,
  freshMenuLookup,
} from "./candidates.js?v=review-discovery-9";
import { weekdays } from "./matching.js";
export function initReviews({ endpoint, onApproved, onBrowse }) {
  const pending = document.querySelector("#pending-results"),
    status = document.querySelector("#discovery-status"),
    ownerPanel = document.querySelector("#owner-panel"),
    ownerButton = document.querySelector("#owner-toggle");
  const menus = new Map(),
    menuStates = new Map(),
    attempted = new Set(),
    queued = new Set();
  const menuQueue = [];
  let menuBusy = false,
    autoPaused = false;
  const menuObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries)
        if (entry.isIntersecting) queueMenu(entry.target.dataset.reviewId);
    },
    { rootMargin: "120px" },
  );
  let records = [],
    transient = [],
    config = {},
    token = "",
    isOwner = false,
    serial = 0,
    controller;
  const showTab = (name) => {
    document.querySelectorAll("[data-view]").forEach((b) => {
      const active = b.dataset.view === name;
      b.setAttribute("aria-selected", String(active));
      b.tabIndex = active ? 0 : -1;
    });
    document.querySelector("#browse-panel").hidden = name !== "browse";
    document.querySelector("#pending-panel").hidden = name !== "pending";
    observeMenus();
    void pumpMenus();
  };
  document.querySelectorAll("[data-view]").forEach((b) => {
    b.addEventListener("click", () => showTab(b.dataset.view));
    b.addEventListener("keydown", (e) => {
      if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
        e.preventDefault();
        const name = b.dataset.view === "browse" ? "pending" : "browse";
        showTab(name);
        document.querySelector(`[data-view="${name}"]`).focus();
      }
    });
  });
  async function api(path, options = {}) {
    const r = await fetch(endpoint(path), options);
    let data;
    try {
      data = await r.json();
    } catch {
      throw Error(
        "The discovery service is unavailable. Your researched restaurants are still here.",
      );
    }
    if (!r.ok)
      throw Object.assign(
        Error(data.error || "The review service is unavailable."),
        { status: r.status },
      );
    return data;
  }
  const post = (path, body, owner = false) =>
    api(path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(owner ? { Authorization: "Bearer " + token } : {}),
      },
      body: JSON.stringify(body),
    });
  function update(rows) {
    records = rows;
    onApproved(rows.filter((r) => r.status === "approved"));
    render();
  }
  async function load() {
    const data = await api("reviews");
    update(data.records || []);
  }
  function render() {
    const rows = [
      ...records.filter((r) => r.status === "pending"),
      ...transient,
    ];
    document.querySelector("#pending-tab").textContent =
      `Needs verification (${rows.length})`;
    pending.innerHTML = rows.length
      ? rows
          .map((r) => {
            let c;
            try {
              c = normalizeCandidate(
                menus.get(r.id) || freshMenuLookup(r)?.candidate || r.payload,
              );
            } catch {
              return "";
            }
            return `<article class="restaurant-card pending-card" data-review-id="${esc(r.id)}"><div class="card-top"><div><h3>${esc(c.name)}</h3><p class="venue-location">${esc(c.location)}</p></div><span class="evidence-tag uncertain">${r.unsaved ? "Not saved" : "Needs verification"}</span></div><p class="small muted">Menu, prices and availability need owner verification.</p>${pendingMenu(r, c)}${(r.review_evidence || []).length ? `<details><summary>Community evidence (${r.review_evidence.length})</summary>${r.review_evidence.map((e) => `<p>${esc(e.note)}<br><a href="${esc(e.source_url)}" target="_blank" rel="noreferrer">Submitted source ↗</a></p>`).join("")}</details>` : ""}${r.unsaved ? '<p class="small budget-over">This discovery is not in the shared queue. Retry after storage is connected.</p>' : `<details><summary>Add menu evidence</summary><form data-evidence><label>Menu or photo link<input type="url" name="sourceUrl" required maxlength="2048" placeholder="https://restaurant.com/happy-hour"></label><label>What does the source confirm?<textarea name="note" maxlength="750" required></textarea></label><p class="small muted">Submit public menu information only. Evidence is public and still needs owner review.</p><button class="secondary" type="submit">Submit evidence</button><p class="form-message" role="status"></p></form></details>`}${isOwner && !r.unsaved ? ownerForm(c) : ""}</article>`;
          })
          .join("")
      : '<div class="empty-state"><h3>No places waiting for verification</h3><p>Tell us what sounds good to search beyond the researched list. New discoveries appear here for source review before publication.</p></div>';
    observeMenus();
  }
  function observeMenus() {
    menuObserver.disconnect();
    if (
      !isOwner &&
      config.menuPersistence &&
      !document.querySelector("#pending-panel").hidden
    ) {
      pending
        .querySelectorAll(".pending-card")
        .forEach((card) => menuObserver.observe(card));
    }
  }
  function queueMenu(id) {
    const r = records.find((r) => r.id === id && r.status === "pending");
    if (
      !r ||
      isOwner ||
      autoPaused ||
      !config.menuPersistence ||
      attempted.has(id) ||
      queued.has(id) ||
      freshMenuLookup(r)
    )
      return;
    queued.add(id);
    menuQueue.push(id);
    void pumpMenus();
  }
  async function pumpMenus() {
    if (
      menuBusy ||
      isOwner ||
      autoPaused ||
      document.querySelector("#pending-panel").hidden
    )
      return;
    const id = menuQueue.shift();
    if (!id) return;
    queued.delete(id);
    const r = records.find((r) => r.id === id && r.status === "pending");
    if (!r || freshMenuLookup(r)) return void pumpMenus();
    menuBusy = true;
    attempted.add(id);
    try {
      await loadMenu(id, false);
    } finally {
      menuBusy = false;
      void pumpMenus();
    }
  }
  function patchMenu(id) {
    const r = records.find((r) => r.id === id && r.status === "pending");
    const card = [...pending.querySelectorAll("[data-review-id]")].find(
      (card) => card.dataset.reviewId === id,
    );
    const section = card?.querySelector(".pending-menu");
    if (r && section)
      section.outerHTML = pendingMenu(
        r,
        normalizeCandidate(
          menus.get(id) || freshMenuLookup(r)?.candidate || r.payload,
        ),
      );
  }
  function pendingMenu(r, c) {
    const saved = freshMenuLookup(r),
      state = menuStates.get(r.id);
    const loading = state?.loading;
    const message = loading
      ? "Loading available happy-hour menu items…"
      : state?.error ||
        state?.notice ||
        (saved
          ? saved.notice
          : config.menuPersistence
            ? "Additional menu items load automatically when this card is in view."
            : "");
    return `<section class="pending-menu"><h4>Happy-hour menu</h4><p class="small muted">Items found in the source; this may be a partial menu.</p>${c.items.map((i) => `<div class="menu-highlight"><span>${esc(i.name)}</span><strong>${i.priceCents === null ? "Price needs confirmation" : money(i.priceCents) + " · unverified"}</strong></div>`).join("")}<p class="small">${c.hoursText ? "Suggested hours (unverified): " + esc(c.hoursText) : "Happy-hour times need confirmation."}</p><div class="menu-source-actions"><a href="${esc(c.sourceUrl)}" target="_blank" rel="noreferrer" aria-label="Open menu source">Open menu source ↗</a>${!r.unsaved && config.menuLookup && !saved ? `<button type="button" class="secondary" data-load-menu ${loading ? "disabled" : ""}>${loading ? "Loading menu…" : state?.error ? "Retry menu lookup" : "Find more menu items"}</button>` : ""}</div><p class="small muted menu-load-status" role="status">${esc(message)}</p><details><summary>Source details</summary><p class="source-summary small">${esc(sourceSummary(c))}</p></details></section>`;
  }
  async function loadMenu(id, manual) {
    const r = records.find((r) => r.id === id && r.status === "pending");
    if (!r || menuStates.get(id)?.loading) return;
    menuStates.set(id, { loading: true });
    patchMenu(id);
    try {
      const result = await post(`reviews/${id}/menu`, {});
      if (!manual && isOwner) {
        // Preserve the review form and its original source while clearing loading.
        menuStates.set(id, {
          notice:
            "An updated menu was saved. Refresh the queue before reviewing it.",
        });
        patchMenu(id);
        return;
      }
      const lookup = freshMenuLookup({ ...r, menu_lookup: result });
      if (!lookup)
        throw Error("The saved menu did not match this place. Please retry.");
      r.menu_lookup = lookup;
      if (lookup.candidate) menus.set(id, lookup.candidate);
      menuStates.delete(id);
      if (isOwner && manual) render();
      else patchMenu(id);
    } catch (err) {
      if (err.status === 429) autoPaused = true;
      menuStates.set(id, { error: err.message });
      patchMenu(id);
    } finally {
      if (menuStates.get(id)?.loading) menuStates.delete(id);
    }
  }
  function sourceSummary(c) {
    const title = c.evidence.match(/^Page title: ([^\n]+)/)?.[1];
    const description = title || c.evidence.replace(/\s+/g, " ");
    return `${new URL(c.sourceUrl).hostname} · ${description.slice(0, 180)}${description.length > 180 ? "…" : ""}`.slice(
      0,
      240,
    );
  }
  function ownerForm(c) {
    return `<details class="owner-review"><summary>Review for publication</summary><form data-decision><label>Restaurant name<input name="name" value="${esc(c.name)}" maxlength="160" required></label><label>City or neighborhood<input name="location" value="${esc(c.location)}" maxlength="120" required></label><label>County<select name="county" required><option value="">Choose county</option><option value="LA County" ${c.county === "LA County" ? "selected" : ""}>LA County</option><option value="Orange County" ${c.county === "Orange County" ? "selected" : ""}>Orange County</option></select></label><label>Address<input name="address" value="${esc(c.address)}" maxlength="300"></label><label>Restaurant happy-hour menu link<input name="sourceUrl" type="url" value="${esc(c.sourceUrl)}" required maxlength="2048"></label><p class="small muted">Open the source and correct these extracted items and prices. Leave an unknown price blank. Publish only items that share the schedule below and have no extra purchase conditions.</p>${c.items.map((i, n) => `<div class="owner-item" data-owner-item><label>Item ${n + 1}<input name="itemName" value="${esc(i.name)}" required maxlength="150"></label><label>Type<select name="kind"><option value="food" ${i.kind === "food" ? "selected" : ""}>Food</option><option value="drink" ${i.kind === "drink" ? "selected" : ""}>Drink</option></select></label><label>Price ($)<input name="price" type="number" min="0.01" max="1000" step="0.01" value="${i.priceCents === null ? "" : (i.priceCents / 100).toFixed(2)}" placeholder="Unknown"></label></div>`).join("")}<fieldset><legend>Happy-hour days</legend>${weekdays.map((d) => `<label class="day-choice"><input type="checkbox" name="day" value="${d}">${d}</label>`).join("")}</fieldset><div class="owner-times"><label>Happy-hour start<input name="start" type="time" required></label><label>Happy-hour end<input name="end" type="time" required></label></div><label>Where the offer applies<select name="restriction"><option value="none">No seating restriction</option><option value="bar-only">Bar only</option><option value="bar-or-patio">Bar or patio</option></select></label><label class="confirmation"><input type="checkbox" name="confirmed" required>I checked the restaurant’s own happy-hour menu: every listed item applies during these same hours, with no extra purchase conditions.</label><div class="review-actions"><button class="primary" type="submit">Approve and publish</button><button class="secondary" type="button" data-reject>Reject submission</button></div><p class="form-message" role="status"></p></form></details>`;
  }
  pending.addEventListener("submit", async (e) => {
    const f = e.target;
    if (!f.matches("[data-evidence],[data-decision]")) return;
    e.preventDefault();
    const id = f.closest("[data-review-id]").dataset.reviewId,
      message = f.querySelector(".form-message");
    const submit = f.querySelector("[type=submit]");
    submit.disabled = true;
    message.textContent = "Saving…";
    try {
      if (f.matches("[data-evidence]")) {
        await post(`reviews/${id}/evidence`, {
          sourceUrl: f.elements.sourceUrl.value,
          note: f.elements.note.value,
        });
        message.textContent = "Evidence submitted for owner review.";
        f.reset();
      } else {
        const original =
          menus.get(id) ||
          freshMenuLookup(records.find((r) => r.id === id))?.candidate ||
          records.find((r) => r.id === id)?.payload;
        if (!original) throw Error("Refresh this submission before review.");
        const value = {
          ...original,
          name: f.elements.name.value,
          location: f.elements.location.value,
          county: f.elements.county.value,
          address: f.elements.address.value,
          sourceUrl: f.elements.sourceUrl.value,
          items: [...f.querySelectorAll("[data-owner-item]")].map((row) => ({
            name: row.querySelector("[name=itemName]").value,
            kind: row.querySelector("[name=kind]").value,
            priceCents:
              row.querySelector("[name=price]").value === ""
                ? null
                : Math.round(
                    Number(row.querySelector("[name=price]").value) * 100,
                  ),
          })),
          hours: [
            {
              days: [...f.querySelectorAll("[name=day]:checked")].map(
                (i) => i.value,
              ),
              start: f.elements.start.value,
              end: f.elements.end.value,
              restriction: f.elements.restriction.value,
            },
          ],
          restaurantSourceConfirmed: f.elements.confirmed.checked,
        };
        await post(
          `reviews/${id}/decision`,
          { status: "approved", payload: value },
          true,
        );
        await load();
        status.textContent = "Approved and added to Browse happy hours.";
        showTab("browse");
        onBrowse();
      }
    } catch (err) {
      message.textContent = err.message;
    } finally {
      submit.disabled = false;
    }
  });
  pending.addEventListener("click", async (e) => {
    const menuButton = e.target.closest("[data-load-menu]");
    if (menuButton) {
      const id = menuButton.closest("[data-review-id]").dataset.reviewId;
      await loadMenu(id, true);
      return;
    }
    const b = e.target.closest("[data-reject]");
    if (!b) return;
    const card = b.closest("[data-review-id]"),
      message = card.querySelector(".owner-review .form-message");
    b.disabled = true;
    try {
      await post(
        `reviews/${card.dataset.reviewId}/decision`,
        { status: "rejected" },
        true,
      );
      await load();
      status.textContent = "Submission rejected; it was not published.";
    } catch (err) {
      message.textContent = err.message;
      b.disabled = false;
    }
  });
  ownerButton.addEventListener("click", () => {
    ownerPanel.hidden = !ownerPanel.hidden;
  });
  document
    .querySelector("#owner-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = e.target,
        message = document.querySelector("#owner-message"),
        b = f.querySelector("button");
      b.disabled = true;
      try {
        if (!config.configured)
          throw Error(
            "Owner sign-in is unavailable until review storage is configured.",
          );
        const r = await fetch(
          config.url + "/auth/v1/token?grant_type=password",
          {
            method: "POST",
            headers: {
              apikey: config.anonKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: f.elements.email.value,
              password: f.elements.password.value,
            }),
          },
        );
        const data = await r.json();
        if (!r.ok || !data.access_token)
          throw Error("Sign-in failed. Check the owner account and password.");
        token = data.access_token;
        await api("owner", { headers: { Authorization: "Bearer " + token } });
        isOwner = true;
        f.reset();
        ownerPanel.hidden = true;
        ownerButton.textContent = "Owner review";
        document.querySelector("#owner-signout").hidden = false;
        message.textContent = "";
        render();
      } catch (err) {
        token = "";
        isOwner = false;
        message.textContent = err.message;
      } finally {
        b.disabled = false;
        f.elements.password.value = "";
      }
    });
  document
    .querySelector("#owner-signout")
    .addEventListener("click", async () => {
      if (token && config.url)
        fetch(config.url + "/auth/v1/logout", {
          method: "POST",
          headers: { apikey: config.anonKey, Authorization: "Bearer " + token },
        }).catch(() => {});
      token = "";
      isOwner = false;
      ownerButton.textContent = "Owner sign in";
      document.querySelector("#owner-signout").hidden = true;
      ownerPanel.hidden = true;
      render();
    });
  document.querySelector("#refresh-reviews").addEventListener("click", () =>
    load()
      .then(() => (status.textContent = "Review queue refreshed."))
      .catch((e) => (status.textContent = e.message)),
  );
  api("review-config")
    .then((c) => {
      config = c;
      return load();
    })
    .catch((e) => {
      status.textContent = e.message;
      render();
    });
  return {
    reset() {
      serial++;
      controller?.abort();
      transient = [];
      status.textContent = "";
      showTab("browse");
      document.querySelector("#search-attribution").replaceChildren();
      render();
    },
    async explore(query) {
      const own = ++serial;
      controller?.abort();
      controller = new AbortController();
      status.textContent = "Searching for additional places online…";
      transient = [];
      try {
        const result = await api("explore", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
          signal: controller.signal,
        });
        if (own !== serial) return;
        if (result.diagnostics)
          console.info(
            "Discovery review counts",
            JSON.stringify(result.diagnostics),
          );
        if (result.saved) update(result.records || []);
        else {
          transient = (result.candidates || []).map((payload, n) => ({
            id: "unsaved-" + n,
            payload,
            status: "pending",
            unsaved: true,
          }));
          render();
        }
        const attribution = document.querySelector("#search-attribution");
        attribution.replaceChildren();
        if (result.provider === "Tavily") {
          const credit = document.createElement("p");
          credit.className = "small muted";
          credit.textContent =
            "Web search by Tavily · Check each original menu before owner approval.";
          attribution.append(credit);
        }
        const count = result.candidates?.length || 0;
        status.textContent =
          result.notice ||
          (count
            ? `${count} new place${count === 1 ? "" : "s"} found. Review the unverified offers in Needs verification.`
            : "No additional source-supported places found for this request. Try a named area or a broader craving.");
        if (count) showTab("pending");
      } catch (e) {
        if (own !== serial || e.name === "AbortError") return;
        status.textContent = e.message;
      }
    },
  };
}
