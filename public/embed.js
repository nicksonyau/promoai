(() => {
  "use strict";

  const VERSION = "1.0.1"; // bump to reduce cache confusion

  // Prevent double-injection
  if (window.__PH_EMBED__ && window.__PH_EMBED__.v === VERSION) return;
  window.__PH_EMBED__ = { v: VERSION, ts: Date.now() };

  // -----------------------------
  // Helpers
  // -----------------------------
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const fetchWithTimeout = async (url, opts = {}, timeoutMs = 8000) => {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), timeoutMs);
    try {
      return await fetch(url, { ...opts, signal: ctl.signal });
    } finally {
      clearTimeout(t);
    }
  };

  const safeJson = async (res, fallback = null) => {
    try {
      return await res.json();
    } catch {
      return fallback;
    }
  };

  const sanitizeText = (s) =>
    String(s ?? "").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]));

  // Find current script robustly
  const pickScript = () => {
    const cs = document.currentScript;
    if (cs) return cs;
    const scripts = document.getElementsByTagName("script");
    for (let i = scripts.length - 1; i >= 0; i--) {
      const s = scripts[i];
      const src = (s && s.getAttribute && s.getAttribute("src")) || "";
      if (src && src.includes("embed.js")) return s;
    }
    return null;
  };

  const cs = pickScript();
  const readAttr = (k) => (cs && cs.getAttribute ? cs.getAttribute(k) : null);

  const srcUrl = (() => {
    try {
      const src = cs && cs.src ? cs.src : "";
      return src ? new URL(src, window.location.href) : null;
    } catch {
      return null;
    }
  })();

  const q = (k) => (srcUrl ? srcUrl.searchParams.get(k) : null);

  // Debug toggle (no noise unless enabled)
  const DEBUG =
    String(readAttr("data-debug") || q("debug") || "").trim() === "1";

  const log = (...args) => {
    if (DEBUG) console.log("[PromoHubAI embed]", ...args);
  };
  const warn = (...args) => {
    if (DEBUG) console.warn("[PromoHubAI embed]", ...args);
  };

  // -----------------------------
  // IDs
  // -----------------------------
  const chatbotId = (readAttr("data-chatbot-id") || q("chatbotId") || "").trim();
  const widgetId = (readAttr("data-widget-id") || q("widgetId") || "").trim();
  const companyId = (readAttr("data-company-id") || q("companyId") || "").trim();

  if (!chatbotId) {
    console.error("[PromoHubAI embed] Missing chatbotId");
    return;
  }
  if (!widgetId) {
    console.error("[PromoHubAI embed] Missing widgetId");
    return;
  }

  // -----------------------------
  // API base (PRODUCTION SAFE)
  // -----------------------------
  const scriptHost = (() => {
    try {
      return srcUrl ? srcUrl.hostname : "";
    } catch {
      return "";
    }
  })();

  const apiBase =
    (readAttr("data-api-base") || q("apiBase") || "").trim() ||
    (scriptHost.includes("localhost") ? "http://localhost:8787" : "https://api.promohubai.com");

  const api = (path) => `${apiBase}${path.startsWith("/") ? path : `/${path}`}`;

  // -----------------------------
  // Session
  // -----------------------------
  const LS_SESSION = "phai:session";
  let sessionId = null;
  try {
    sessionId = localStorage.getItem(LS_SESSION);
  } catch {}
  if (!sessionId) {
    const id =
      (crypto && crypto.randomUUID)
        ? crypto.randomUUID()
        : `s_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    sessionId = `phai_${id}`;
    try {
      localStorage.setItem(LS_SESSION, sessionId);
    } catch {}
  }

  // -----------------------------
  // Defaults
  // -----------------------------
  const DEFAULT_APPEARANCE = {
    brandName: "PromoAI",
    brandLogo: "",
    brandColor: "#6D28D9",
    actionColor: "#6D28D9",
    backgroundColor: "#EEF2FF",
    backgroundImage: "",
    title: "Hi there 👋",
    message: "How can we help you today?",
    position: "right", // "left" | "right"
    showWhenOffline: true,
    enableSound: true,
    onlineStatus: "We reply immediately",
    offlineStatus: "We typically reply within a few minutes.",
  };

  let appearance = { ...DEFAULT_APPEARANCE };
  let starters = [];

  // ✅ Endpoint: GET /chat-widget/appearance/get/:widgetId
  // ✅ FIX: embed passes companyId via querystring so backend can read KV without session
  async function loadWidgetSettings() {
    const url =
      api(`/chat-widget/appearance/get/${encodeURIComponent(widgetId)}`) +
      (companyId ? `?companyId=${encodeURIComponent(companyId)}` : "");

    log("settings GET", { url, widgetId, companyId });

    let lastErr = null;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const res = await fetchWithTimeout(
          url,
          { method: "GET", headers: { Accept: "application/json" } },
          8000
        );

        if (!res.ok) {
          lastErr = new Error(`settings http ${res.status}`);
          await sleep(250 * attempt);
          continue;
        }

        const json = await safeJson(res, null);
        if (!json || json.success !== true || !json.data) {
          lastErr = new Error("invalid settings json");
          await sleep(250 * attempt);
          continue;
        }

        if (json.data.exists === false) {
          log("settings exists=false, using defaults");
          return;
        }

        appearance = { ...DEFAULT_APPEARANCE, ...(json.data.appearance || {}) };
        starters = Array.isArray(json.data.starters) ? json.data.starters : [];

        log("settings loaded", {
          brandColor: appearance.brandColor,
          actionColor: appearance.actionColor,
          backgroundColor: appearance.backgroundColor,
          starters: starters.length,
          updatedAt: json.data.updatedAt || null,
        });
        return;
      } catch (e) {
        lastErr = e;
        await sleep(250 * attempt);
      }
    }

    warn("settings load failed, using defaults:", lastErr);
  }

  // -----------------------------
  // Shadow DOM host
  // -----------------------------
  const HOST_ID = `ph-embed-host-${widgetId.slice(0, 8)}`;
  if (document.getElementById(HOST_ID)) return;

  const host = document.createElement("div");
  host.id = HOST_ID;
  host.style.cssText = "position:fixed;bottom:18px;right:18px;z-index:2147483647;";
  document.body.appendChild(host);

  const shadow = host.attachShadow ? host.attachShadow({ mode: "open" }) : host;

  const style = document.createElement("style");
  shadow.appendChild(style);

  const root = document.createElement("div");
  shadow.appendChild(root);

  const state = { open: false, screen: "home" }; // home | chat

  const renderCss = () => {
    const posLeft = appearance.position === "left";
    host.style.right = posLeft ? "" : "18px";
    host.style.left = posLeft ? "18px" : "";

    const statusText = appearance.showWhenOffline ? appearance.onlineStatus : appearance.offlineStatus;

    style.textContent = `
      .btn{width:56px;height:56px;border-radius:999px;border:0;cursor:pointer;
        background:${appearance.actionColor};color:#fff;font-size:22px;
        box-shadow:0 12px 30px rgba(0,0,0,.25)}
      .panel{width:380px;height:560px;background:#fff;border-radius:16px;overflow:hidden;
        box-shadow:0 18px 60px rgba(0,0,0,.3);margin-bottom:10px;display:${state.open ? "flex" : "none"};
        flex-direction:column}
      .hdr{padding:16px;background:${appearance.brandColor};color:#fff;display:flex;align-items:center;justify-content:space-between;gap:10px}
      .hdrLeft{display:flex;align-items:center;gap:10px}
      .logo{width:28px;height:28px;border-radius:999px;background:rgba(255,255,255,.25);overflow:hidden;flex:0 0 auto}
      .logo img{width:100%;height:100%;object-fit:cover;display:${appearance.brandLogo ? "block" : "none"}}
      .bn{font-weight:700;font-size:14px;line-height:1.1}
      .st{font-size:12px;opacity:.9;line-height:1.1}
      .close{cursor:pointer;font-size:20px;line-height:1}
      .home{padding:14px;background:${appearance.backgroundColor};flex:1;overflow:auto;display:${state.screen === "home" ? "block" : "none"}}
      .hero{background:${appearance.brandColor};color:#fff;border-radius:14px;padding:14px;margin-bottom:12px;
        background-size:cover;background-position:center;
        ${appearance.backgroundImage ? `background-image:url(${appearance.backgroundImage});` : ""}}
      .title{font-size:18px;font-weight:800;margin-top:6px}
      .msg{font-size:13px;opacity:.95;margin-top:4px}
      .starter{display:flex;flex-direction:column;gap:8px;margin-top:12px}
      .sbtn{background:rgba(255,255,255,.85);border-radius:12px;padding:10px 12px;font-size:13px;cursor:pointer;
        display:flex;align-items:center;justify-content:space-between}
      .cta{background:rgba(255,255,255,.9);border-radius:12px;padding:12px;margin-top:12px}
      .ctaTitle{font-weight:700;font-size:14px}
      .ctaSub{font-size:12px;color:#666;margin-top:4px}
      .start{margin-top:12px;width:100%;padding:12px 14px;border:0;border-radius:999px;background:${appearance.actionColor};
        color:#fff;font-weight:700;cursor:pointer}
      .chat{display:${state.screen === "chat" ? "flex" : "none"};flex:1;flex-direction:column}
      .msgs{flex:1;padding:14px;overflow-y:auto;background:#fff}
      .row{padding:10px;display:flex;gap:8px;background:#fff;border-top:1px solid #eee}
      .in{flex:1;padding:12px;border-radius:10px;border:1px solid #ddd;outline:none}
      .send{padding:12px 16px;background:${appearance.actionColor};color:#fff;border:none;border-radius:10px;cursor:pointer;font-weight:700}
      .bUser{display:flex;justify-content:flex-end;margin:6px}
      .bAi{display:flex;justify-content:flex-start;margin:6px}
      .pillUser{background:${appearance.actionColor};color:#fff;padding:8px 12px;border-radius:10px;max-width:85%;white-space:pre-wrap}
      .pillAi{background:#eee;padding:8px 12px;border-radius:10px;max-width:85%;white-space:pre-wrap}
      @media (max-width:480px){.panel{width:calc(100vw - 24px);height:70vh}}
    `;
  };

  const create = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };

  const nodes = {};

  function buildUi() {
    root.innerHTML = "";

    nodes.panel = create("div", "panel");

    // header
    const hdr = create("div", "hdr");
    const hdrLeft = create("div", "hdrLeft");

    const logo = create("div", "logo");
    const img = document.createElement("img");
    img.src = appearance.brandLogo || "";
    logo.appendChild(img);

    const meta = create("div");
    meta.appendChild(create("div", "bn", sanitizeText(appearance.brandName)));

    const statusText = appearance.showWhenOffline ? appearance.onlineStatus : appearance.offlineStatus;
    meta.appendChild(create("div", "st", sanitizeText(statusText)));

    hdrLeft.appendChild(logo);
    hdrLeft.appendChild(meta);

    const close = create("div", "close", "✕");
    close.addEventListener("click", () => {
      state.open = false;
      render();
    });

    hdr.appendChild(hdrLeft);
    hdr.appendChild(close);

    // home
    const home = create("div", "home");
    const hero = create("div", "hero");
    hero.appendChild(create("div", "title", sanitizeText(appearance.title)));
    hero.appendChild(create("div", "msg", sanitizeText(appearance.message)));

    const starterBox = create("div", "starter");
    const enabled = (starters || []).filter((s) => s && s.enabled !== false && s.text);
    enabled.slice(0, 5).forEach((s) => {
      const item = create("div", "sbtn", `<span>${sanitizeText(s.text)}</span><span style="opacity:.6">›</span>`);
      item.addEventListener("click", () => {
        openChat();
        sendMessage(s.text);
      });
      starterBox.appendChild(item);
    });

    const cta = create("div", "cta");
    cta.appendChild(create("div", "ctaTitle", "Chat with us"));
    cta.appendChild(create("div", "ctaSub", sanitizeText(statusText)));

    const start = create("button", "start", "Chat with us");
    start.addEventListener("click", () => openChat());

    home.appendChild(hero);
    home.appendChild(starterBox);
    home.appendChild(cta);
    home.appendChild(start);

    // chat
    const chat = create("div", "chat");
    const msgs = create("div", "msgs");
    const row = create("div", "row");
    const input = document.createElement("input");
    input.className = "in";
    input.placeholder = "Type your message…";

    const send = create("button", "send", "➤");
    send.addEventListener("click", () => sendMessage());
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") sendMessage();
    });

    row.appendChild(input);
    row.appendChild(send);

    chat.appendChild(msgs);
    chat.appendChild(row);

    nodes.msgs = msgs;
    nodes.input = input;

    nodes.panel.appendChild(hdr);
    nodes.panel.appendChild(home);
    nodes.panel.appendChild(chat);

    // button
    const btn = create("button", "btn", "💬");
    btn.addEventListener("click", () => {
      state.open = !state.open;
      render();
    });

    root.appendChild(nodes.panel);
    root.appendChild(btn);
  }

  const addBubble = (role, text) => {
    const wrap = create("div", role === "user" ? "bUser" : "bAi");
    const pill = create("div", role === "user" ? "pillUser" : "pillAi", sanitizeText(text));
    wrap.appendChild(pill);
    nodes.msgs.appendChild(wrap);
    nodes.msgs.scrollTop = nodes.msgs.scrollHeight;
    return pill;
  };

  let welcomeLoaded = false;
  async function loadWelcome() {
    if (welcomeLoaded) return;
    welcomeLoaded = true;

    try {
      const res = await fetchWithTimeout(
        api(`/chatbot/chat_init?chatbotId=${encodeURIComponent(chatbotId)}`),
        { method: "GET" },
        8000
      );
      const data = await safeJson(res, null);
      if (data && data.success) {
        if (data.welcomeMessage) addBubble("assistant", data.welcomeMessage);
        if (data.quickMenu) {
          const lines = String(data.quickMenu).split("\n");
          addBubble("assistant", lines.map((m, i) => `${i + 1}. ${m}`).join("\n"));
        }
        return;
      }
    } catch {}
    addBubble("assistant", "Hello! How can I assist you today?");
  }

  function openChat() {
    state.screen = "chat";
    render();
    loadWelcome();
  }

  async function sendMessage(override) {
    const msg = String(override ?? nodes.input.value ?? "").trim();
    if (!msg) return;

    addBubble("user", msg);
    nodes.input.value = "";

    const loading = addBubble("assistant", "...");

    try {
      const res = await fetchWithTimeout(
        api("/chatbot/chat"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chatbotId,
            sessionId,
            message: msg,
            companyId,
          }),
        },
        15000
      );

      const data = await safeJson(res, null);
      const reply = (data && data.reply) || "Sorry, something went wrong.";
      loading.innerHTML = sanitizeText(reply);
    } catch {
      loading.innerHTML = "Oops! Connection error.";
    }
  }

  function render() {
    renderCss();
    buildUi();
  }

  // -----------------------------
  // Boot
  // -----------------------------
  (async () => {
    await loadWidgetSettings(); // ✅ loads backend setting by widgetId (+ companyId)
    render();
  })();
})();
