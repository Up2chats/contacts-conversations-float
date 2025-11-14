(() => {
  "use strict";

  if (window.__GHL_CONVERSATIONS_FLOAT_V2__) return;
  window.__GHL_CONVERSATIONS_FLOAT_V2__ = true;

  console.log("[CONV-FLOAT] v2 inicializado");

  /* =========================
   * CONFIG
   * ========================= */
  const REFRESH_INTERVAL_MS = 10000;
  const PAGE_LIMIT = 20;

  const API_BASE = "https://services.leadconnectorhq.com";
  const API_VERSION = "2021-04-15";

  const BTN_CLASS = "ghl-conv-toggle-btn";
  const STYLE_ID = "ghl-conv-panel-style";

  const getLocationIdFromPath = () =>
    (location.pathname.match(/\/location\/([^/]+)/) || [])[1] || null;

  const currentScript =
    document.currentScript ||
    [...document.getElementsByTagName("script")].pop();

  const DATA_LOCATION_ID = currentScript?.dataset.locationId || null;
  const DATA_TOKEN = currentScript?.dataset.token || null;

  const getLocationId = () => DATA_LOCATION_ID || getLocationIdFromPath();
  const getToken = () => DATA_TOKEN;

  /* =========================
   * STYLES
   * ========================= */
  const ensureStyles = () => {
    if (document.getElementById(STYLE_ID)) return;

    const s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = `
      .${BTN_CLASS}{
        position:fixed; bottom:24px; right:24px;
        width:42px; height:42px;
        border-radius:999px; background:#fff;
        border:1px solid #e5e7eb;
        box-shadow:0 12px 30px rgba(15,23,42,0.28);
        display:flex; align-items:center; justify-content:center;
        cursor:pointer; z-index:999999;
      }
      .${BTN_CLASS} svg{ width:20px; height:20px; color:#4b5563; }
      .${BTN_CLASS}:hover svg{ color:#2563eb; }

      #ghl-conv-panel-backdrop {
        position:fixed; inset:0;
        pointer-events:none; z-index:999998;
      }

      #ghl-conv-panel {
        position:absolute; right:40px; top:80px;
        width:380px; height:520px; background:#fff;
        border-radius:18px;
        box-shadow:0 22px 60px rgba(15,23,42,0.32);
        display:flex; flex-direction:column;
        pointer-events:auto; overflow:hidden;
      }

      #ghl-conv-panel-header {
        padding:12px 16px; display:flex;
        justify-content:space-between; border-bottom:1px solid #e5e7eb;
      }

      #ghl-conv-search-wrap {
        padding:8px 16px;
      }

      #ghl-conv-search {
        width:100%; padding:7px 14px;
        border-radius:999px; border:1px solid #d1d5db;
        background:#f9fafb;
      }

      #ghl-conv-list {
        flex:1; overflow-y:auto; padding:8px;
      }

      .ghl-conv-row{
        padding:8px; display:flex; gap:8px;
        cursor:pointer; border-radius:12px;
      }
      .ghl-conv-row:hover{ background:#eef2ff; }
    `;
    document.head.appendChild(s);
  };

  /* =========================
   * API
   * ========================= */
  const apiFetch = (method, path, token) =>
    new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(method, API_BASE + path, true);
      xhr.setRequestHeader("Accept", "application/json");
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.setRequestHeader("Version", API_VERSION);
      xhr.setRequestHeader("Authorization", "Bearer " + token);

      xhr.onreadystatechange = () => {
        if (xhr.readyState !== 4) return;
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText || "{}"));
        } else reject(new Error(xhr.responseText));
      };

      xhr.onerror = () => reject(new Error("Network error"));
      xhr.send();
    });

  const fetchConversations = (locId, token, { limit, query }) => {
    const params = [
      "locationId=" + encodeURIComponent(locId),
      "limit=" + (limit || PAGE_LIMIT),
      "status=all",
      "sort=desc",
      "sortBy=last_message_date",
    ];

    if (query?.trim()) {
      params.push("query=" + encodeURIComponent(query));
    }

    return apiFetch("GET", "/conversations/search?" + params.join("&"), token);
  };

  /* =========================
   * STATE
   * ========================= */
  const state = {
    open: false,
    dom: {},
    searchTerm: "",
    limit: PAGE_LIMIT,
    timer: null,
    requestId: 0,
  };

  /* =========================
   * LOAD DATA
   * ========================= */
  const loadConversations = async () => {
    const loc = getLocationId();
    const token = getToken();

    if (!loc || !token) {
      console.warn("No token o locationId");
      return;
    }

    const rid = ++state.requestId;

    const data = await fetchConversations(loc, token, {
      limit: state.limit,
      query: state.searchTerm,
    }).catch((e) => {
      console.error("API ERROR:", e);
      return null;
    });

    if (!data || rid !== state.requestId) return;

    const items = data.conversations || [];

    renderList(items);
  };

  /* =========================
   * RENDER LIST
   * ========================= */
  const renderList = (items) => {
    const list = state.dom.list;
    list.innerHTML = "";

    if (!items.length) {
      list.innerHTML = `<div style="padding:16px; color:#777;">Sin resultados</div>`;
      return;
    }

    items.forEach((m) => {
      const row = document.createElement("div");
      row.className = "ghl-conv-row";
      row.innerHTML = `
        <div style="font-weight:600">${m.contactName || "Sin nombre"}</div>
      `;
      row.onclick = () => {
        window.open(
          `https://app.gohighlevel.com/v2/location/${getLocationId()}/conversations/conversations/${m.id}`,
          "_blank"
        );
      };
      list.appendChild(row);
    });
  };

  /* =========================
   * PANEL UI
   * ========================= */
  const openPanel = () => {
    ensureStyles();
    if (state.open) return;

    const backdrop = document.createElement("div");
    backdrop.id = "ghl-conv-panel-backdrop";

    const panel = document.createElement("div");
    panel.id = "ghl-conv-panel";

    const header = document.createElement("div");
    header.id = "ghl-conv-panel-header";
    header.innerHTML = `
      <div style="font-weight:600">Conversaciones</div>
      <button id="btn-close" style="border:1px solid #ddd;padding:4px 12px;border-radius:8px;">Cerrar</button>
    `;

    const searchWrap = document.createElement("div");
    searchWrap.id = "ghl-conv-search-wrap";
    searchWrap.innerHTML = `
      <input id="ghl-conv-search" placeholder="Buscar..." autocomplete="off">
    `;

    const list = document.createElement("div");
    list.id = "ghl-conv-list";

    panel.append(header, searchWrap, list);
    backdrop.appendChild(panel);
    document.body.appendChild(backdrop);

    state.open = true;
    state.dom = { panel, list };

    const searchInput = searchWrap.querySelector("#ghl-conv-search");
    searchInput.oninput = () => {
      state.searchTerm = searchInput.value;
      loadConversations();
    };

    header.querySelector("#btn-close").onclick = closePanel;

    loadConversations();
  };

  const closePanel = () => {
    state.open = false;
    const el = document.getElementById("ghl-conv-panel-backdrop");
    if (el) el.remove();
  };

  /* =========================
   * BUTTON
   * ========================= */
  const createButton = () => {
    ensureStyles();
    if (document.getElementById("ghl-conv-toggle-floating")) return;

    const btn = document.createElement("button");
    btn.id = "ghl-conv-toggle-floating";
    btn.className = BTN_CLASS;
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5A8.5 8.5 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3 8.5 8.5 0 0 1 21 11.5z"/>
      </svg>
    `;

    btn.onclick = () => {
      state.open ? closePanel() : openPanel();
    };

    document.body.appendChild(btn);
  };

  /* =========================
   * ACTIVATE
   * ========================= */
  const observer = new MutationObserver(createButton);
  observer.observe(document.documentElement, { childList: true, subtree: true });

  setTimeout(createButton, 300);
})();
