(() => {
  "use strict";
  if (window.__GHL_CONV_LIST_V1__) return;
  window.__GHL_CONV_LIST_V1__ = true;

  /* ======================================
   *  CONFIGURACIÓN
   * ====================================== */

  // ⏱ Auto-refresh en milisegundos (10s)
  const DEFAULT_REFRESH_MS = 10000;
  const DEFAULT_LIMIT = 20;

  const API_BASE = "https://services.leadconnectorhq.com";
  const CONV_VERSION = "2021-04-15";

  const STYLE_ID = "ghl-convlist-style";
  const TOGGLE_BTN_ID = "ghl-convlist-toggle-btn";
  const PANEL_ID = "ghl-convlist-panel";

  // Leemos config desde el <script ...> que carga este archivo
  const currentScript = document.currentScript;
  const LOCATION_ID =
    currentScript?.getAttribute("data-location-id") ||
    (location.pathname.match(/\/location\/([^/]+)/) || [])[1] ||
    "";
  const TOKEN = currentScript?.getAttribute("data-token") || "";
  const REFRESH_MS = Number(
    currentScript?.getAttribute("data-refresh-ms") || DEFAULT_REFRESH_MS
  );

  /* ======================================
   *  ESTILOS
   * ====================================== */

  const ensureStyle = () => {
    if (document.getElementById(STYLE_ID)) return;
    const s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = `
      /* Botón en la barra de vistas (junto a Kanban / Lista) */
      #${TOGGLE_BTN_ID}{
        display:inline-flex;
        align-items:center;
        justify-content:center;
        width:32px;
        height:32px;
        border-radius:999px;
        margin-left:8px;
        cursor:pointer;
        color:#4b5563;
        transition:background .15s ease, color .15s ease;
      }
      #${TOGGLE_BTN_ID}:hover{
        background:#eef2ff;
        color:#1d4ed8;
      }
      #${TOGGLE_BTN_ID} svg{
        width:18px;
        height:18px;
      }

      /* Panel flotante */
      #${PANEL_ID}{
        position:fixed;
        top:80px;
        right:40px;
        width:360px;
        max-width:90vw;
        height:580px;
        max-height:80vh;
        background:#fff;
        border-radius:18px;
        box-shadow:0 22px 60px rgba(15,23,42,0.32);
        display:flex;
        flex-direction:column;
        z-index:100020;
        overflow:hidden;
        resize:both;
        border:1px solid #e5e7eb;
      }
      #${PANEL_ID}.ghl-hidden{
        display:none;
      }

      .ghl-convlist-header{
        flex:0 0 auto;
        padding:10px 14px;
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:8px;
        border-bottom:1px solid #e5e7eb;
        cursor:move;
        user-select:none;
      }
      .ghl-convlist-title{
        font-size:15px;
        font-weight:600;
        color:#0f172a;
      }
      .ghl-convlist-header-right{
        display:flex;
        align-items:center;
        gap:6px;
      }
      .ghl-convlist-icon-btn{
        width:30px;
        height:30px;
        border-radius:999px;
        border:1px solid #e5e7eb;
        background:#f9fafb;
        display:inline-flex;
        align-items:center;
        justify-content:center;
        cursor:pointer;
      }
      .ghl-convlist-icon-btn svg{
        width:16px;
        height:16px;
        color:#4b5563;
      }
      .ghl-convlist-icon-btn:hover{
        background:#eef2ff;
        border-color:#c7d2fe;
      }

      .ghl-convlist-body{
        flex:1 1 auto;
        display:flex;
        flex-direction:column;
        padding:8px 10px 10px 10px;
        gap:6px;
        background:#f9fafb;
        overflow:hidden;
      }

      .ghl-convlist-search{
        flex:0 0 auto;
        margin-bottom:4px;
      }
      .ghl-convlist-search input{
        width:100%;
        border-radius:999px;
        border:1px solid #d1d5db;
        padding:6px 11px;
        font-size:13px;
        outline:none;
        background:#fff;
      }
      .ghl-convlist-search input:focus{
        border-color:#94a3b8;
      }

      .ghl-convlist-status{
        font-size:11px;
        color:#6b7280;
        padding:0 2px 2px 2px;
        flex:0 0 auto;
      }

      .ghl-convlist-list{
        flex:1 1 auto;
        overflow-y:auto;
        border-radius:10px;
        background:#fff;
        border:1px solid #e5e7eb;
      }

      .ghl-convlist-empty{
        font-size:13px;
        color:#6b7280;
        text-align:center;
        padding:18px 12px;
      }

      .ghl-convlist-item{
        display:flex;
        align-items:flex-start;
        gap:8px;
        padding:7px 10px;
        cursor:pointer;
        border-bottom:1px solid #f3f4f6;
      }
      .ghl-convlist-item:hover{
        background:#f9fafb;
      }
      .ghl-convlist-avatar{
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
      .ghl-convlist-main{
        flex:1 1 auto;
        min-width:0;
      }
      .ghl-convlist-row1{
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:6px;
        margin-bottom:2px;
      }
      .ghl-convlist-name{
        font-size:13px;
        font-weight:600;
        color:#111827;
        white-space:nowrap;
        overflow:hidden;
        text-overflow:ellipsis;
        max-width:200px;
      }
      .ghl-convlist-time{
        font-size:11px;
        color:#6b7280;
        white-space:nowrap;
        flex-shrink:0;
      }
      .ghl-convlist-row2{
        display:flex;
        align-items:center;
        gap:4px;
      }
      .ghl-convlist-channel{
        font-size:11px;
        color:#6b7280;
        flex-shrink:0;
      }
      .ghl-convlist-preview{
        font-size:12px;
        color:#4b5563;
        white-space:nowrap;
        overflow:hidden;
        text-overflow:ellipsis;
      }
      .ghl-convlist-unread{
        background:#2563eb;
        color:#fff;
        border-radius:999px;
        font-size:11px;
        padding:0 5px;
        margin-left:4px;
      }
    `;
    document.head.appendChild(s);
  };

  /* ======================================
   *  HELPERS
   * ====================================== */

  const apiFetch = (path, params = {}) =>
    new Promise((resolve, reject) => {
      if (!TOKEN) {
        reject(new Error("No token configurado para conversaciones"));
        return;
      }
      const url =
        API_BASE +
        path +
        (path.includes("?") ? "&" : "?") +
        new URLSearchParams(params).toString();

      const xhr = new XMLHttpRequest();
      xhr.open("GET", url, true);
      xhr.setRequestHeader("Accept", "application/json");
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.setRequestHeader("Version", CONV_VERSION);
      xhr.setRequestHeader("Authorization", "Bearer " + TOKEN);

      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(xhr.responseText ? JSON.parse(xhr.responseText) : null);
            } catch (e) {
              resolve(null);
            }
          } else {
            reject(new Error("HTTP " + xhr.status + " " + xhr.responseText));
          }
        }
      };
      xhr.onerror = () => reject(new Error("Error de red o CORS"));
      xhr.send();
    });

  const fetchConversations = () =>
    apiFetch("/conversations/search", {
      locationId: LOCATION_ID,
      limit: DEFAULT_LIMIT,
      status: "all",
      sort: "desc",
      sortBy: "last_message_date",
    });

  const formatTime = (isoStr) => {
    if (!isoStr) return "";
    const d = new Date(isoStr);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getName = (conv) => {
    const c = conv.contact || {};
    const full =
      conv.contactName ||
      c.name ||
      [c.firstName, c.lastName].filter(Boolean).join(" ");
    return full || "Sin nombre";
  };

  const getInitials = (name) => {
    const parts = (name || "").split(/\s+/).filter(Boolean);
    if (!parts.length) return "CT";
    const a = (parts[0]?.[0] || "").toUpperCase();
    const b = (parts[1]?.[0] || "").toUpperCase();
    return (a + b).trim();
  };

  const getPreview = (conv) => {
    const msg =
      conv.lastMessage?.body ||
      conv.last_message_body ||
      conv.lastMessageBody ||
      conv.lastMessage?.text ||
      conv.lastMessage?.message ||
      "";
    return msg || "(sin contenido)";
  };

  const getChannelLabel = (conv) => {
    const ch =
      conv.channelType ||
      conv.channel ||
      conv.type ||
      conv.provider ||
      "";
    if (!ch) return "";
    const u = ch.toString().toUpperCase();
    if (u.includes("WHATSAPP")) return "WhatsApp";
    if (u.includes("SMS")) return "SMS";
    if (u.includes("IG") || u.includes("INSTAGRAM")) return "Instagram";
    if (u.includes("FB") || u.includes("FACEBOOK")) return "Facebook";
    return ch;
  };

  const getUnread = (conv) =>
    conv.unreadCount ?? conv.unread ?? conv.unreadMessages ?? 0;

  /* ======================================
   *  PANEL + INTERFAZ
   * ====================================== */

  let panelState = {
    panel: null,
    listEl: null,
    searchInput: null,
    statusEl: null,
    conversations: [],
    filtered: [],
    refreshTimer: null,
  };

  const openFloatForContact = (contactId) => {
    if (window.__GHL_OPEN_FLOAT_FOR_CONTACT__) {
      window.__GHL_OPEN_FLOAT_FOR_CONTACT__(contactId);
      return;
    }
    // Fallback via evento custom
    window.dispatchEvent(
      new CustomEvent("ghl:open-floating-conversation", {
        detail: { contactId },
      })
    );
  };

  const renderList = () => {
    const { listEl, filtered } = panelState;
    if (!listEl) return;
    listEl.innerHTML = "";

    if (!filtered.length) {
      const empty = document.createElement("div");
      empty.className = "ghl-convlist-empty";
      empty.textContent = "No hay conversaciones para mostrar.";
      listEl.appendChild(empty);
      return;
    }

    filtered.forEach((conv) => {
      const item = document.createElement("div");
      item.className = "ghl-convlist-item";

      const name = getName(conv);
      const initials = getInitials(name);
      const time = formatTime(
        conv.lastMessageDate ||
          conv.lastMessageDateTime ||
          conv.last_message_date ||
          conv.updatedAt ||
          conv.dateUpdated
      );
      const preview = getPreview(conv);
      const channelLabel = getChannelLabel(conv);
      const unread = getUnread(conv);

      const avatar = document.createElement("div");
      avatar.className = "ghl-convlist-avatar";
      avatar.textContent = initials;

      const main = document.createElement("div");
      main.className = "ghl-convlist-main";

      const row1 = document.createElement("div");
      row1.className = "ghl-convlist-row1";

      const nameEl = document.createElement("div");
      nameEl.className = "ghl-convlist-name";
      nameEl.textContent = name;
      nameEl.title = name;

      const timeEl = document.createElement("div");
      timeEl.className = "ghl-convlist-time";
      timeEl.textContent = time;

      row1.appendChild(nameEl);
      row1.appendChild(timeEl);

      const row2 = document.createElement("div");
      row2.className = "ghl-convlist-row2";

      if (channelLabel) {
        const chEl = document.createElement("div");
        chEl.className = "ghl-convlist-channel";
        chEl.textContent = channelLabel;
        row2.appendChild(chEl);
      }

      const previewEl = document.createElement("div");
      previewEl.className = "ghl-convlist-preview";
      previewEl.textContent = preview;
      row2.appendChild(previewEl);

      if (unread > 0) {
        const badge = document.createElement("span");
        badge.className = "ghl-convlist-unread";
        badge.textContent = unread > 9 ? "9+" : String(unread);
        row2.appendChild(badge);
      }

      main.appendChild(row1);
      main.appendChild(row2);

      item.appendChild(avatar);
      item.appendChild(main);

      item.addEventListener("click", () => {
        const contactId =
          conv.contactId || conv.contact?.id || conv.contact_id;
        if (!contactId) return;
        openFloatForContact(contactId);
      });

      listEl.appendChild(item);
    });
  };

  const applyFilter = () => {
    const q = (panelState.searchInput?.value || "").trim().toLowerCase();
    if (!q) {
      panelState.filtered = panelState.conversations.slice();
    } else {
      panelState.filtered = panelState.conversations.filter((c) => {
        const name = getName(c).toLowerCase();
        const preview = getPreview(c).toLowerCase();
        return name.includes(q) || preview.includes(q);
      });
    }
    renderList();
  };

  const reloadConversations = async () => {
    if (!panelState.panel || panelState.panel.classList.contains("ghl-hidden"))
      return;
    try {
      panelState.statusEl.textContent = "Actualizando conversaciones…";
      const resp = await fetchConversations();
      const list =
        resp?.conversations || resp?.items || resp?.data || resp || [];
      // Por si algo viene desordenado:
      list.sort((a, b) => {
        const da = new Date(
          a.lastMessageDate ||
            a.lastMessageDateTime ||
            a.updatedAt ||
            a.dateUpdated ||
            0
        ).getTime();
        const db = new Date(
          b.lastMessageDate ||
            b.lastMessageDateTime ||
            b.updatedAt ||
            b.dateUpdated ||
            0
        ).getTime();
        return db - da;
      });
      panelState.conversations = list;
      applyFilter();
      panelState.statusEl.textContent = `Total: ${list.length} conversaciones cargadas`;
    } catch (e) {
      console.error("Error cargando conversaciones", e);
      panelState.statusEl.textContent =
        "Error al cargar conversaciones. Revisa el token o conexión.";
    }
  };

  const setupDrag = (panel, handle) => {
    let dragging = false;
    let offsetX = 0;
    let offsetY = 0;

    const onDown = (e) => {
      if (e.button !== 0) return;
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
      const maxX = window.innerWidth - 80;
      const maxY = window.innerHeight - 80;
      panel.style.left = Math.max(10, Math.min(maxX, x)) + "px";
      panel.style.top = Math.max(10, Math.min(maxY, y)) + "px";
      panel.style.right = "auto"; // para que no pelee con right fijo
    };

    const onUp = () => {
      dragging = false;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };

    handle.addEventListener("mousedown", onDown);
  };

  const createPanel = () => {
    if (panelState.panel) return panelState.panel;

    ensureStyle();

    const panel = document.createElement("div");
    panel.id = PANEL_ID;
    panel.className = "ghl-hidden";

    // Header
    const header = document.createElement("div");
    header.className = "ghl-convlist-header";

    const title = document.createElement("div");
    title.className = "ghl-convlist-title";
    title.textContent = "Conversaciones";

    const headerRight = document.createElement("div");
    headerRight.className = "ghl-convlist-header-right";

    // botón refrescar inmediato
    const btnRefresh = document.createElement("button");
    btnRefresh.type = "button";
    btnRefresh.className = "ghl-convlist-icon-btn";
    btnRefresh.title = "Actualizar ahora";
    btnRefresh.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="23 4 23 10 17 10"></polyline>
        <polyline points="1 20 1 14 7 14"></polyline>
        <path d="M3.51 9a9 9 0 0 1 14.13-3.36L23 10"></path>
        <path d="M20.49 15a9 9 0 0 1-14.13 3.36L1 14"></path>
      </svg>`;
    btnRefresh.onclick = () => reloadConversations();

    // botón cerrar
    const btnClose = document.createElement("button");
    btnClose.type = "button";
    btnClose.className = "ghl-convlist-icon-btn";
    btnClose.title = "Cerrar";
    btnClose.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>`;
    btnClose.onclick = () => {
      panel.classList.add("ghl-hidden");
    };

    headerRight.appendChild(btnRefresh);
    headerRight.appendChild(btnClose);

    header.appendChild(title);
    header.appendChild(headerRight);

    // Body
    const body = document.createElement("div");
    body.className = "ghl-convlist-body";

    const searchWrap = document.createElement("div");
    searchWrap.className = "ghl-convlist-search";

    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.placeholder = "Buscar por nombre o mensaje...";
    searchInput.addEventListener("input", () => applyFilter());
    searchWrap.appendChild(searchInput);

    const statusEl = document.createElement("div");
    statusEl.className = "ghl-convlist-status";
    statusEl.textContent = `Actualización cada ${REFRESH_MS / 1000}s`;

    const listEl = document.createElement("div");
    listEl.className = "ghl-convlist-list";

    body.appendChild(searchWrap);
    body.appendChild(statusEl);
    body.appendChild(listEl);

    panel.appendChild(header);
    panel.appendChild(body);

    document.body.appendChild(panel);

    panelState.panel = panel;
    panelState.listEl = listEl;
    panelState.searchInput = searchInput;
    panelState.statusEl = statusEl;

    // Drag
    setupDrag(panel, header);

    // Auto-refresh
    if (REFRESH_MS > 0) {
      panelState.refreshTimer = setInterval(() => {
        reloadConversations();
      }, REFRESH_MS);
    }

    return panel;
  };

  const togglePanel = () => {
    if (!LOCATION_ID || !TOKEN) {
      alert("Falta locationId o token para cargar las conversaciones.");
      return;
    }
    const panel = createPanel();
    const isHidden = panel.classList.contains("ghl-hidden");
    if (isHidden) {
      panel.classList.remove("ghl-hidden");
      reloadConversations();
    } else {
      panel.classList.add("ghl-hidden");
    }
  };

  /* ======================================
   *  BOTÓN EN LA BARRA DE VISTAS
   * ====================================== */

  const createToggleBtn = () => {
    ensureStyle();
    if (document.getElementById(TOGGLE_BTN_ID)) return;

    const views = document.querySelector("div.d-flex.views");
    if (!views) return;

    const btn = document.createElement("span");
    btn.id = TOGGLE_BTN_ID;
    btn.title = "Ver lista de conversaciones (flotante)";
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    `;
    btn.addEventListener("click", togglePanel);

    views.appendChild(btn);
  };

  const debounce = (fn, ms = 150) => {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  };

  const handle = debounce(() => {
    if (!LOCATION_ID || !TOKEN) return;
    createToggleBtn();
  }, 200);

  const observer = new MutationObserver(handle);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  window.addEventListener("load", handle);
  setTimeout(handle, 500);
  setTimeout(handle, 1000);
})();
