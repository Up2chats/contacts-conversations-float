(() => {
  "use strict";

  if (window.__GHL_CONVERSATIONS_FLOAT_V4__) return;
  window.__GHL_CONVERSATIONS_FLOAT_V4__ = true;

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
  // Solo mostrar el botón en esta location (si se define en el script)
  // <script src="..." data-location-id="XXX" data-token="YYY">
  const TARGET_LOCATION_ID = DATA_LOCATION_ID || "";  // si está vacío => cualquier location
  
  // ¿La URL actual corresponde a una location donde DEBEMOS mostrar el botón?
  const urlMatches = () => {
  const path = location.pathname || "";

  // 1) NUNCA mostrar en vistas de cuentas de agencia (/accounts, /sub-accounts, etc.)
  if (/\/accounts(?:\/|$)/.test(path)) {
    return false;
  }

  // 2) Necesitamos que haya /location/:id en la URL
  const locInPath = getLocationIdFromPath(); // lo que viene en /location/:id...
  if (!locInPath) return false;

  // 3) Si NO se pasó data-location-id => cualquier location es válida
  if (!TARGET_LOCATION_ID) return true;

  // 4) Si se pasó data-location-id => solo esa location
  return locInPath === TARGET_LOCATION_ID;
};
  /* =========================
   *  ESTILOS
   * ========================= */

  const ensureStyles = () => {
    if (document.getElementById(STYLE_ID)) return;
    const s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = `
      .${BTN_CLASS}{
        position:fixed;
        bottom:110px;
        right:5px;
        width:42px;
        height:42px;
        border-radius:999px;
        background:#ffffff;
        border:1px solid #e5e7eb;
        box-shadow:0 12px 30px rgba(15,23,42,0.28);
        display:inline-flex;
        align-items:center;
        justify-content:center;
        cursor:pointer;
        z-index:100001;
      }
      .${BTN_CLASS} svg{
        width:20px;
        height:20px;
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
        position:fixed;
        right:24px;
        bottom:96px;
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
        transition:transform 0.18s ease-out, opacity 0.18s ease-out;
      }
      #ghl-conv-panel-header{
        flex:0 0 auto;
        padding:12px 16px;
        display:flex;
        align-items:center;
        justify-content:space-between;
        border-bottom:1px solid #e5e7eb;
        gap:8px;
        cursor:move;
        user-select:none;
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
      #ghl-conv-load-more{
        margin:0 16px 10px 16px;
        padding:6px 12px;
        font-size:12px;
        border-radius:999px;
        border:1px solid #e5e7eb;
        background:#f9fafb;
        cursor:pointer;
      }
      #ghl-conv-load-more:hover{
        background:#eef2ff;
      }

      /* === POPUP DE FILTROS === */
      #ghl-conv-filter-popover{
        position:absolute;
        top:56px;
        right:16px;
        width:340px;
        max-width:calc(100% - 32px);
        background:#ffffff;
        border-radius:14px;
        box-shadow:0 18px 45px rgba(15,23,42,0.35);
        padding:12px 14px 12px 14px;
        z-index:100002;
        border:1px solid #e5e7eb;
      }
      .ghl-filter-title{
        font-size:13px;
        font-weight:600;
        color:#111827;
        margin-bottom:6px;
      }
      .ghl-filter-row{
        margin-bottom:10px;
      }
      .ghl-filter-label{
        font-size:12px;
        color:#4b5563;
        margin-bottom:4px;
        display:block;
      }
      .ghl-filter-select{
        width:100%;
        border-radius:8px;
        border:1px solid #d1d5db;
        padding:6px 8px;
        font-size:12px;
        background:#f9fafb;
      }
      .ghl-filter-select:focus{
        outline:none;
        border-color:#2563eb;
        background:#ffffff;
      }
      .ghl-filter-chips{
        display:flex;
        flex-wrap:wrap;
        gap:6px;
      }
      .ghl-filter-chip{
        border-radius:999px;
        border:1px solid #d1d5db;
        padding:3px 9px;
        font-size:11px;
        background:#f9fafb;
        cursor:pointer;
      }
      .ghl-filter-chip.ghl-selected{
        background:#e0edff;
        border-color:#2563eb;
        color:#1d4ed8;
      }
      .ghl-filter-footer{
        display:flex;
        justify-content:flex-end;
        gap:8px;
        margin-top:8px;
      }
      .ghl-filter-btn{
        border-radius:999px;
        border:1px solid #e5e7eb;
        padding:5px 12px;
        font-size:12px;
        cursor:pointer;
        background:#f9fafb;
      }
      .ghl-filter-btn-primary{
        background:#2563eb;
        color:#ffffff;
        border-color:#2563eb;
      }
      .ghl-filter-btn-primary:hover{
        background:#1d4ed8;
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

  const fetchConversations = (locId, token, { limit, query, filters } = {}) => {
    const params = [
      "locationId=" + encodeURIComponent(locId),
      "limit=" + (limit || PAGE_LIMIT),
      "status=" + encodeURIComponent(filters?.status || "all"),
      "sort=desc",
      "sortBy=last_message_date",
    ];

    if (query && query.trim()) {
      params.push("searchTerm=" + encodeURIComponent(query.trim()));
    }

    if (filters) {
      if (filters.channels && filters.channels.length) {
        params.push(
          "lastMessageChannel=" +
            encodeURIComponent(filters.channels.join(","))
        );
      }
      if (filters.direction) {
        params.push(
          "lastMessageDirection=" + encodeURIComponent(filters.direction)
        );
      }
      if (filters.action) {
        params.push(
          "lastMessageAction=" + encodeURIComponent(filters.action)
        );
      }
      if (filters.startAfterDate) {
        params.push(
          "startAfterDate=" + encodeURIComponent(filters.startAfterDate)
        );
      }
    }

    const path = "/conversations/search?" + params.join("&");
    return apiFetch("GET", path, token);
  };

  /* =========================
   *  HELPERS / STATE
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
    const raw = item.lastMessageType || item.channel || item.type || "";
    if (!raw) return "";
    let v = String(raw).trim().toUpperCase();
    v = v.replace(/^TYPE(?:_CUSTOM)?[\s._-]*/i, "");
    v = v.replace(/[^A-Z0-9]/g, "");
    return v;
  };

  const state = {
    open: false,
    autoRefreshTimer: null,
    currentSearchTerm: "",
    lastRequestId: 0,
    currentLimit: PAGE_LIMIT,
    total: null,
    dom: {},
    filters: {
      channels: [],
      status: "all",
      direction: "",
      action: "",
      startAfterDate: "",
    },
  };

  const stopAutoRefresh = () => {
    if (state.autoRefreshTimer) {
      clearInterval(state.autoRefreshTimer);
      state.autoRefreshTimer = null;
    }
  };

  const startAutoRefresh = () => {
    stopAutoRefresh();
    if (!REFRESH_INTERVAL_MS || REFRESH_INTERVAL_MS <= 0) return;
    state.autoRefreshTimer = setInterval(() => {
      if (!state.open) return;
      loadConversations(false);
    }, REFRESH_INTERVAL_MS);
  };

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
      const email = (
        item.contact?.email ||
        item.contact?.emailAddress ||
        item.email ||
        ""
      )
        .toString()
        .toLowerCase();

      return (
        name.includes(term) ||
        snippet.includes(term) ||
        phone.includes(term) ||
        email.includes(term)
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

      const avatar = document.createElement("div");
      avatar.className = "ghl-conv-avatar";
      avatar.textContent = getInitials(item);

      const main = document.createElement("div");
      main.className = "ghl-conv-main";

      const top = document.createElement("div");
      top.className = "ghl-conv-top";

      const nameEl = document.createElement("div");
      nameEl.className = "ghl-conv-name";
      const name = getName(item);
      nameEl.textContent = name;
      nameEl.title = name;

      const timeEl = document.createElement("div");
      timeEl.className = "ghl-conv-time";
      timeEl.textContent = formatTime(item.lastMessageDate);

      top.appendChild(nameEl);
      top.appendChild(timeEl);

      const bottom = document.createElement("div");
      bottom.className = "ghl-conv-bottom";

      const chEl = document.createElement("div");
      chEl.className = "ghl-conv-channel";
      chEl.textContent = getChannel(item);

      const snip = document.createElement("div");
      snip.className = "ghl-conv-snippet";
      snip.textContent = getSnippet(item);

      bottom.appendChild(chEl);
      bottom.appendChild(snip);

      const unread = (item.unreadCount || item.unread_count || 0) | 0;
      if (unread > 0) {
        const badge = document.createElement("div");
        badge.className = "ghl-conv-unread";
        badge.textContent = unread > 9 ? "9+" : String(unread);
        bottom.appendChild(badge);
      }

      main.appendChild(top);
      main.appendChild(bottom);

      row.appendChild(avatar);
      row.appendChild(main);

      row.addEventListener("click", () => {
        const contactId =
          item.contactId ||
          item.contact?.id ||
          item.contact?.contactId ||
          null;
        const locId = getLocationId();
        const convId = item.id;

        if (window.ghlOpenFloatingConversation && contactId) {
          window.ghlOpenFloatingConversation(contactId);
        } else if (locId && convId) {
          const url = `https://app.gohighlevel.com/v2/location/${locId}/conversations/conversations/${convId}?category=team-inbox&tab=all`;
          window.open(url, "_blank");
        }
      });

      list.appendChild(row);
    });
  };

  const setMeta = (shownCount, total) => {
    if (!state.dom.meta) return;
    const term = state.currentSearchTerm?.trim();
    const totalSafe = total ?? shownCount;
    const label = term
      ? `Resultados: ${shownCount} conversación(es) (de ${totalSafe}) para “${term}”`
      : `Mostrando ${shownCount} de ${totalSafe} conversaciones`;
    state.dom.meta.textContent = label;
  };

  const updateLoadMoreButton = (fetchedCount, total) => {
    const btn = state.dom.loadMore;
    if (!btn) return;

    const t = total ?? fetchedCount;

    if (fetchedCount >= t) {
      btn.style.display = "none";
      btn.disabled = false;
      btn.textContent = "Cargar más conversaciones";
      return;
    }

    btn.style.display = "block";
    btn.disabled = false;
    btn.textContent = "Cargar más conversaciones";
  };

  /* =========================
   *  LOAD
   * ========================= */

  const loadConversations = async (showSpinner = true) => {
    const locId = getLocationId();
    const token = getToken();
    if (!locId || !token) {
      console.warn("Sin locationId o token configurado para conversaciones.");
      return;
    }

    const reqId = ++state.lastRequestId;

    if (showSpinner && state.dom.status) {
      state.dom.status.textContent = "Actualizando conversaciones...";
    }

    try {
      const data = await fetchConversations(locId, token, {
        limit: state.currentLimit || PAGE_LIMIT,
        query: state.currentSearchTerm || "",
        filters: state.filters,
      });

      if (reqId !== state.lastRequestId) return;

      const items =
        data?.conversations ||
        data?.items ||
        data?.records ||
        data?.data ||
        [];

      const total = data?.total || data?.totalCount || items.length;
      state.total = total;

      const filtered = filterBySearch(items);

      renderList(filtered);
      setMeta(filtered.length, total);
      updateLoadMoreButton(items.length, total);

      if (state.dom.status) state.dom.status.textContent = "";
    } catch (e) {
      console.error("Error cargando conversaciones", e);
      if (state.dom.status) {
        state.dom.status.textContent =
          "Error al cargar conversaciones. Reintenta más tarde.";
      }
    }
  };

  /* =========================
   *  DRAG DEL PANEL
   * ========================= */

  const setupPanelDrag = (panel, handleEl) => {
    let offsetX = 0;
    let offsetY = 0;
    let dragging = false;

    const onDown = (e) => {
      if (e.button !== 0) return;
      if (e.target.closest("button")) return;
      dragging = true;
      const rect = panel.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    };

    const onMove = (e) => {
      if (!dragging) return;
      const x = e.clientX - offsetX;
      const y = e.clientY - offsetY;
      const maxX = window.innerWidth - panel.offsetWidth - 10;
      const maxY = window.innerHeight - panel.offsetHeight - 10;
      const newX = Math.max(10, Math.min(maxX, x));
      const newY = Math.max(10, Math.min(maxY, y));
      panel.style.left = newX + "px";
      panel.style.top = newY + "px";
      panel.style.right = "auto";
      panel.style.bottom = "auto";
    };

    const onUp = () => {
      dragging = false;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };

    handleEl.addEventListener("mousedown", onDown);
  };

  /* =========================
   *  POPUP DE FILTROS
   * ========================= */

  const openFilterPopover = () => {
    const panel = state.dom.panel;
    if (!panel) return;

    let pop = document.getElementById("ghl-conv-filter-popover");
    if (pop) {
      pop.remove();
      return;
    }

    pop = document.createElement("div");
    pop.id = "ghl-conv-filter-popover";
    pop.innerHTML = `
      <div class="ghl-filter-title">Filtros</div>

      <div class="ghl-filter-row">
        <span class="ghl-filter-label">Last Message Channel</span>
        <div class="ghl-filter-chips" data-filter="channels">
          <button type="button" class="ghl-filter-chip" data-value="EMAIL">Email</button>
          <button type="button" class="ghl-filter-chip" data-value="SMS">SMS</button>
          <button type="button" class="ghl-filter-chip" data-value="GBP">GBP</button>
          <button type="button" class="ghl-filter-chip" data-value="LIVE_CHAT">Live Chat</button>
          <button type="button" class="ghl-filter-chip" data-value="WHATSAPP">WhatsApp</button>
          <button type="button" class="ghl-filter-chip" data-value="FACEBOOK">Facebook</button>
          <button type="button" class="ghl-filter-chip" data-value="CALLS">Calls</button>
        </div>
      </div>

      <div class="ghl-filter-row">
        <span class="ghl-filter-label">Status</span>
        <select class="ghl-filter-select" id="ghl-filter-status">
          <option value="all">Todos</option>
          <option value="read">Read</option>
          <option value="unread">Unread</option>
          <option value="starred">Starred</option>
          <option value="recents">Recents</option>
        </select>
      </div>

      <div class="ghl-filter-row">
        <span class="ghl-filter-label">Last Message Direction</span>
        <select class="ghl-filter-select" id="ghl-filter-direction">
          <option value="">Cualquiera</option>
          <option value="inbound">Inbound</option>
          <option value="outbound">Outbound</option>
        </select>
      </div>

      <div class="ghl-filter-row">
        <span class="ghl-filter-label">Last Message Action</span>
        <select class="ghl-filter-select" id="ghl-filter-action">
          <option value="">Cualquiera</option>
          <option value="automated">Automated</option>
          <option value="manual">Manual</option>
        </select>
      </div>

      <div class="ghl-filter-footer">
        <button type="button" class="ghl-filter-btn" data-role="clear">Limpiar</button>
        <button type="button" class="ghl-filter-btn" data-role="cancel">Cancelar</button>
        <button type="button" class="ghl-filter-btn ghl-filter-btn-primary" data-role="apply">Aplicar</button>
      </div>
    `;

    pop.addEventListener("mousedown", (e) => e.stopPropagation());

    panel.appendChild(pop);

    const channels = state.filters.channels || [];
    pop
      .querySelectorAll('.ghl-filter-chip')
      .forEach((chip) => {
        const val = chip.getAttribute("data-value");
        if (channels.includes(val)) {
          chip.classList.add("ghl-selected");
        }
        chip.addEventListener("click", () => {
          chip.classList.toggle("ghl-selected");
        });
      });

    const statusSel = pop.querySelector("#ghl-filter-status");
    const dirSel = pop.querySelector("#ghl-filter-direction");
    const actSel = pop.querySelector("#ghl-filter-action");

    statusSel.value = state.filters.status || "all";
    dirSel.value = state.filters.direction || "";
    actSel.value = state.filters.action || "";

    const btnClear = pop.querySelector('[data-role="clear"]');
    const btnCancel = pop.querySelector('[data-role="cancel"]');
    const btnApply = pop.querySelector('[data-role="apply"]');

    btnCancel.addEventListener("click", () => {
      pop.remove();
    });

    btnClear.addEventListener("click", () => {
      pop
        .querySelectorAll(".ghl-filter-chip.ghl-selected")
        .forEach((c) => c.classList.remove("ghl-selected"));
      statusSel.value = "all";
      dirSel.value = "";
      actSel.value = "";

      state.filters = {
        channels: [],
        status: "all",
        direction: "",
        action: "",
        startAfterDate: "",
      };
      state.currentLimit = PAGE_LIMIT;
      loadConversations(true);
      pop.remove();
    });

    btnApply.addEventListener("click", () => {
      const selectedChannels = Array.from(
        pop.querySelectorAll(".ghl-filter-chip.ghl-selected")
      ).map((c) => c.getAttribute("data-value"));

      const newStatus = statusSel.value || "all";
      const newDir = dirSel.value || "";
      const newAct = actSel.value || "";

      state.filters = {
        ...state.filters,
        channels: selectedChannels,
        status: newStatus,
        direction: newDir,
        action: newAct,
      };

      state.currentLimit = PAGE_LIMIT;
      loadConversations(true);
      pop.remove();
    });
  };

  /* =========================
   *  PANEL UI
   * ========================= */

  const openPanel = () => {
    ensureStyles();
    if (state.open) return;

    let backdrop = document.getElementById("ghl-conv-panel-backdrop");
    if (!backdrop) {
      backdrop = document.createElement("div");
      backdrop.id = "ghl-conv-panel-backdrop";
      document.body.appendChild(backdrop);
    }

    const panel = document.createElement("div");
    panel.id = "ghl-conv-panel";

    const header = document.createElement("div");
    header.id = "ghl-conv-panel-header";

    const title = document.createElement("h3");
    title.textContent = "Conversaciones";

    const hRight = document.createElement("div");
    hRight.id = "ghl-conv-panel-header-right";

    const btnFilter = document.createElement("button");
    btnFilter.type = "button";
    btnFilter.className = "ghl-conv-icon-btn";
    btnFilter.title = "Filtros";
    btnFilter.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="3 4 21 4 14 12 14 19 10 21 10 12 3 4"></polygon>
      </svg>`;
    btnFilter.onclick = (e) => {
      e.stopPropagation();
      openFilterPopover();
    };

    const btnRefresh = document.createElement("button");
    btnRefresh.type = "button";
    btnRefresh.className = "ghl-conv-icon-btn";
    btnRefresh.title = "Actualizar ahora";
    btnRefresh.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="23 4 23 10 17 10"></polyline>
        <polyline points="1 20 1 14 7 14"></polyline>
        <path d="M3.51 9a9 9 0 0 1 14.88-3.36L23 10"></path>
        <path d="M1 14l4.62 4.36A9 9 0 0 0 20.49 15"></path>
      </svg>`;
    btnRefresh.onclick = (e) => {
      e.stopPropagation();
      loadConversations(true);
    };

    const btnClose = document.createElement("button");
    btnClose.type = "button";
    btnClose.id = "ghl-conv-panel-close";
    btnClose.textContent = "Cerrar";
    btnClose.onclick = (e) => {
      e.stopPropagation();
      closePanel();
    };

    hRight.appendChild(btnFilter);
    hRight.appendChild(btnRefresh);
    hRight.appendChild(btnClose);

    header.appendChild(title);
    header.appendChild(hRight);

    const searchWrap = document.createElement("div");
    searchWrap.id = "ghl-conv-search-wrap";

    const search = document.createElement("input");
    search.id = "ghl-conv-search";
    search.type = "text";
    search.placeholder = "Buscar por nombre o mensaje…";
    search.autocomplete = "off";
    searchWrap.appendChild(search);

    const meta = document.createElement("div");
    meta.id = "ghl-conv-meta";

    const list = document.createElement("div");
    list.id = "ghl-conv-list";

    const status = document.createElement("div");
    status.id = "ghl-conv-status";

    const loadMore = document.createElement("button");
    loadMore.id = "ghl-conv-load-more";
    loadMore.textContent = "Cargar más conversaciones";
    loadMore.style.display = "none";
    loadMore.onclick = () => {
      loadMore.disabled = true;
      loadMore.textContent = "Cargando...";
      state.currentLimit = (state.currentLimit || PAGE_LIMIT) + PAGE_LIMIT;
      loadConversations(true);
    };

    panel.appendChild(header);
    panel.appendChild(searchWrap);
    panel.appendChild(meta);
    panel.appendChild(list);
    panel.appendChild(status);
    panel.appendChild(loadMore);

    backdrop.appendChild(panel);

    state.open = true;
    state.dom = { panel, list, meta, status, search, loadMore };

    setupPanelDrag(panel, header);

    const debounceSearch = (fn, ms = 400) => {
      let t;
      return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), ms);
      };
    };

    const onSearch = debounceSearch(() => {
      state.currentSearchTerm = search.value || "";
      state.currentLimit = PAGE_LIMIT;
      loadConversations(true);
    });

    search.addEventListener("input", onSearch);

    loadConversations(true);
    startAutoRefresh();
  };

  const closePanel = () => {
    stopAutoRefresh();
    state.open = false;
    state.lastRequestId++;
    const panel = document.getElementById("ghl-conv-panel");
    if (panel) panel.remove();

    try {
      if (window.ghlCloseAllFloatingConversations) {
        window.ghlCloseAllFloatingConversations();
      }
    } catch (e) {
      console.warn("No se pudieron cerrar las ventanas flotantes:", e);
    }
  };

  /* =========================
   *  BOTÓN FLOTANTE
   * ========================= */

  const makeToggleButton = () => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = BTN_CLASS;
    btn.id = "ghl-conv-toggle-floating";
    btn.title = "Ver conversaciones recientes";
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
      </svg>`;
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (state.open) {
        closePanel();
      } else {
        openPanel();
      }
    });
    return btn;
  };

  const injectButton = () => {
  // No metas el botón si la URL actual no corresponde
  if (!urlMatches()) return;

  ensureStyles();
  if (document.getElementById("ghl-conv-toggle-floating")) return;

  const btn = makeToggleButton();
  document.body.appendChild(btn);
};

  const debounce = (fn, ms = 200) => {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  };

  const handle = debounce(injectButton, 200);
  const observer = new MutationObserver(handle);
  observer.observe(document.documentElement, { childList: true, subtree: true });

  ["pushState", "replaceState"].forEach((fn) => {
    try {
      const orig = history[fn];
      history[fn] = function () {
        const ret = orig.apply(this, arguments);
        window.dispatchEvent(new Event("ghl:navigation"));
        return ret;
      };
    } catch {}
  });
// Cada vez que cambie la URL
window.addEventListener("ghl:navigation", () => {
  if (state.open) {
    closePanel();
  }

  const btn = document.getElementById("ghl-conv-toggle-floating");

  if (!urlMatches()) {
    if (btn) btn.remove();
    return;
  }

  if (!btn) {
    injectButton();
  }
});

  handle();
  setTimeout(handle, 500);
  setTimeout(handle, 1000);
})();
