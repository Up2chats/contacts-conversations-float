(() => {
  "use strict";
  if (window.__GHL_CONVERSATIONS_FLOAT__) return;
  window.__GHL_CONVERSATIONS_FLOAT__ = true;

  /* =========================
   *  CONFIG
   * ========================= */

  const REFRESH_INTERVAL_MS = 10000; // auto refresh cada 10s
  const PAGE_LIMIT = 20;

  const API_BASE = "https://services.leadconnectorhq.com";
  const API_VERSION = "2021-04-15";

  const STYLE_ID = "ghl-conv-panel-style";
  const BTN_CLASS = "ghl-conv-toggle-btn";

  const getLocationIdFromPath = () =>
    (location.pathname.match(/\/location\/([^/]+)/) || [])[1] || null;

  // leemos data-* del script
  const currentScript =
    document.currentScript ||
    (function () {
      const scripts = document.getElementsByTagName("script");
      return scripts[scripts.length - 1];
    })();

  const DATA_LOCATION_ID = currentScript?.dataset.locationId || null;
  const DATA_TOKEN = currentScript?.dataset.token || null;

  const getLocationId = () => DATA_LOCATION_ID || getLocationIdFromPath();
  const getToken = () => DATA_TOKEN;

  /* =========================
   *  ESTILOS
   * ========================= */

  const ensureStyles = () => {
    if (document.getElementById(STYLE_ID)) return;
    const s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = `
      .${BTN_CLASS}{
        display:inline-flex;
        align-items:center;
        justify-content:center;
        margin-left:6px;
        cursor:pointer;
      }
      .${BTN_CLASS} svg{
        width:18px;
        height:18px;
        color:#4b5563;
      }
      .${BTN_CLASS}:hover svg{
        color:#2563eb;
      }

      #ghl-conv-panel-backdrop{
        position:fixed;
        inset:0;
        pointer-events:none;
        z-index:100000;
      }
      #ghl-conv-panel{
        position:absolute;
        right:40px;
        top:80px;
        width:380px;
        max-width:calc(100vw - 40px);
        height:520px;
        max-height:calc(100vh - 40px);
        background:#fff;
        border-radius:18px;
        box-shadow:0 22px 60px rgba(15,23,42,0.32);
        display:flex;
        flex-direction:column;
        pointer-events:auto;
        overflow:hidden;
      }
      #ghl-conv-panel-header{
        flex:0 0 auto;
        padding:12px 16px;
        display:flex;
        align-items:center;
        justify-content:space-between;
        border-bottom:1px solid #e5e7eb;
        gap:8px;
      }
      #ghl-conv-panel-header h3{
        margin:0;
        font-size:15px;
        font-weight:600;
        color:#111827;
      }
      #ghl-conv-panel-header-right{
        display:flex;
        align-items:center;
        gap:6px;
      }
      .ghl-conv-icon-btn{
        width:32px;
        height:32px;
        border-radius:999px;
        border:1px solid #e5e7eb;
        background:#f9fafb;
        display:inline-flex;
        align-items:center;
        justify-content:center;
        cursor:pointer;
      }
      .ghl-conv-icon-btn svg{
        width:16px;
        height:16px;
        color:#4b5563;
      }
      .ghl-conv-icon-btn:hover{
        background:#eef2ff;
        border-color:#c7d2fe;
      }
      #ghl-conv-panel-close{
        padding:6px 12px;
        border-radius:999px;
        border:1px solid #e5e7eb;
        background:#f9fafb;
        cursor:pointer;
        font-size:13px;
      }
      #ghl-conv-panel-close:hover{
        background:#f3f4f6;
      }

      #ghl-conv-search-wrap{
        flex:0 0 auto;
        padding:8px 16px 6px 16px;
      }
      #ghl-conv-search{
        width:100%;
        border-radius:999px;
        border:1px solid #d1d5db;
        padding:7px 14px;
        font-size:13px;
        outline:none;
        background:#f9fafb;
      }
      #ghl-conv-search:focus{
        border-color:#2563eb;
        background:#fff;
      }
      #ghl-conv-meta{
        padding:0 16px 6px 16px;
        font-size:12px;
        color:#6b7280;
        flex:0 0 auto;
      }

      #ghl-conv-list{
        flex:1 1 auto;
        overflow-y:auto;
        padding:0 6px 6px 6px;
      }
      .ghl-conv-row{
        display:flex;
        align-items:flex-start;
        padding:8px 10px;
        border-radius:12px;
        cursor:pointer;
        gap:8px;
      }
      .ghl-conv-row:hover{
        background:#f3f4ff;
      }
      .ghl-conv-avatar{
        width:32px;
        height:32px;
        border-radius:999px;
        background:#fee2e2;
        color:#b91c1c;
        display:flex;
        align-items:center;
        justify-content:center;
        font-size:13px;
        font-weight:600;
        flex-shrink:0;
      }
      .ghl-conv-main{
        flex:1 1 auto;
        min-width:0;
      }
      .ghl-conv-top{
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:4px;
        margin-bottom:2px;
      }
      .ghl-conv-name{
        font-size:13px;
        font-weight:600;
        color:#111827;
        max-width:210px;
        white-space:nowrap;
        overflow:hidden;
        text-overflow:ellipsis;
      }
      .ghl-conv-time{
        font-size:11px;
        color:#6b7280;
        flex-shrink:0;
      }
      .ghl-conv-bottom{
        display:flex;
        align-items:center;
        gap:6px;
      }
      .ghl-conv-channel{
        font-size:11px;
        color:#6b7280;
        flex-shrink:0;
      }
      .ghl-conv-snippet{
        font-size:12px;
        color:#4b5563;
        max-width:210px;
        white-space:nowrap;
        overflow:hidden;
        text-overflow:ellipsis;
      }
      .ghl-conv-unread{
        min-width:16px;
        height:16px;
        border-radius:999px;
        background:#2563eb;
        color:#fff;
        font-size:11px;
        display:inline-flex;
        align-items:center;
        justify-content:center;
        padding:0 4px;
        margin-left:auto;
        flex-shrink:0;
      }
      .ghl-conv-empty{
        padding:20px 16px;
        font-size:13px;
        color:#6b7280;
        text-align:center;
      }
      #ghl-conv-status{
        padding:4px 16px 8px 16px;
        font-size:11px;
        color:#6b7280;
        flex:0 0 auto;
      }
    `;
    document.head.appendChild(s);
  };

  /* =========================
   *  API
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
          try {
            resolve(xhr.responseText ? JSON.parse(xhr.responseText) : null);
          } catch (e) {
            resolve(null);
          }
        } else {
          reject(
            new Error("HTTP " + xhr.status + " - " + (xhr.responseText || ""))
          );
        }
      };
      xhr.onerror = () => reject(new Error("Error de red"));
      xhr.send(null);
    });

  const fetchConversations = (locId, token, limit, searchTerm) => {
    const params = [
      "locationId=" + encodeURIComponent(locId),
      "limit=" + (limit || PAGE_LIMIT),
      "status=all",
      "sort=desc",
      "sortBy=last_message_date",
    ];

    if (searchTerm && searchTerm.trim()) {
      params.push("searchTerm=" + encodeURIComponent(searchTerm.trim()));
    }

    const path = "/conversations/search?" + params.join("&");
    return apiFetch("GET", path, token);
  };

  /* =========================
   *  HELPERS
   * ========================= */

  const formatTime = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getName = (item) => {
    const c = item.contact || {};

    const first = c.firstName || c.first_name || "";
    const last = c.lastName || c.last_name || "";

    let name = `${first} ${last}`.trim();

    if (!name) {
      name =
        c.fullName ||
        c.full_name ||
        item.contactName ||
        item.contact_name ||
        "";
    }

    return name || "Sin nombre";
  };

  const getInitials = (item) => {
    const name = getName(item);
    const parts = name.split(/\s+/).filter(Boolean);
    if (!parts.length) return "CT";
    const a = (parts[0][0] || "").toUpperCase();
    const b = (parts[1]?.[0] || "").toUpperCase();
    return (a + b).trim();
  };

  const getSnippet = (item) => {
    const text = item.lastMessageBody || "";
    if (text) return text;
    if (item.type) return item.type;
    return "";
  };

  const getChannel = (item) => {
    const ch = item.channel || item.type || "";
    if (!ch) return "";
    return String(ch).toUpperCase();
  };

  const debounce = (fn, ms = 200) => {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  };

  /* =========================
   *  STATE
   * ========================= */

  const state = {
    open: false,
    autoRefreshTimer: null,
    currentSearchTerm: "",
    lastRequestId: 0,
    currentLimit: PAGE_LIMIT,
    total: null,
    dom: {},
  };

  /* =========================
   *  RENDER
   * ========================= */

  const filterBySearch = (items) => {
    const term = (state.currentSearchTerm || "").trim().toLowerCase();
    if (!term) return items;

    return items.filter((item) => {
      const name = (getName(item) || "").toLowerCase();
      const snippet = (getSnippet(item) || "").toLowerCase();
      const phone = (
        item.phone ||
        item.phoneNumber ||
        item.contact?.phone ||
        ""
      )
        .toString()
        .toLowerCase();

      return (
        name.includes(term) || snippet.includes(term) || phone.includes(term)
      );
    });
  };

  const renderList = (items) => {
    const list = state.dom.list;
    list.innerHTML = "";

    if (!items || !items.length) {
      const empty = document.createElement("div");
      empty.className = "ghl-conv-empty";
      empty.textContent = "No se encontraron conversaciones.";
      list.appendChild(empty);
      return;
    }

    items.forEach((item) => {
      const row = document.createElement("div");
      row.className = "ghl-conv-row";

      const avatar = document.create
