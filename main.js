(() => {
  "use strict";

  // evitar doble carga
  if (window.__GHL_CONVERSATIONS_FLOAT_V2__) return;
  window.__GHL_CONVERSATIONS_FLOAT_V2__ = true;

  console.log("[CONV-FLOAT] v2 inicializado");

  const BTN_CLASS = "ghl-conv-toggle-btn";
  const STYLE_ID = "ghl-conv-panel-style";

  // ====== estilos mínimos (botón y panel vacío) ======
  const ensureStyles = () => {
    if (document.getElementById(STYLE_ID)) return;
    const s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = `
      .${BTN_CLASS}{
        position:fixed;
        bottom:24px;
        right:24px;
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
    `;
    document.head.appendChild(s);
    console.log("[CONV-FLOAT] estilos inyectados");
  };

  // ====== botón flotante ======
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
      alert("Click en botón de conversaciones (script mínimo ok)");
    });
    return btn;
  };

  const injectButton = () => {
    ensureStyles();
    if (document.getElementById("ghl-conv-toggle-floating")) {
      console.log("[CONV-FLOAT] botón ya existe, no se duplica");
      return;
    }
    const btn = makeToggleButton();
    document.body.appendChild(btn);
    console.log("[CONV-FLOAT] botón inyectado en el DOM");
  };

  // ====== esperar a que exista <body> y luego inyectar ======
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
    } catch (e) {}
  });

  window.addEventListener("popstate", () =>
    window.dispatchEvent(new Event("ghl:navigation"))
  );
  window.addEventListener("ghl:navigation", handle);

  // primer intento inmediato + reintentos
  handle();
  setTimeout(handle, 500);
  setTimeout(handle, 1000);
})();
