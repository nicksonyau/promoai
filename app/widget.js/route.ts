import { NextResponse } from "next/server";

/**
 * PUBLIC CHAT WIDGET SCRIPT
 * URL:
 *   /widget.js?chatbotId=xxx&widgetId=yyy
 */

export const runtime = "edge"; // safe for public embed

function js(body: string, status = 200) {
  return new NextResponse(body, {
    status,
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export async function GET(req: Request) {
  const url = new URL(req.url);

  const chatbotId = (url.searchParams.get("chatbotId") || "").trim();
  const widgetId = (url.searchParams.get("widgetId") || "").trim();

  // Always return JS (even on error)
  if (!chatbotId || !widgetId) {
    return js(`
(() => {
  console.warn("[Widget] Missing chatbotId or widgetId");
})();
    `);
  }

  // This page MUST be public (no auth redirect)
  const iframeSrc =
    "/chat/" +
    encodeURIComponent(chatbotId) +
    "?widgetId=" +
    encodeURIComponent(widgetId);

  return js(`
(() => {
  if (window.__PROMOHUBAI_WIDGET_LOADED__) return;
  window.__PROMOHUBAI_WIDGET_LOADED__ = true;

  const HOST_ID = "promohubai-widget-host";
  const STYLE_ID = "promohubai-widget-style";

  // -----------------------
  // Style
  // -----------------------
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = \`
      #\${HOST_ID}{
        position:fixed;
        bottom:18px;
        right:18px;
        z-index:2147483647;
        font-family:system-ui,-apple-system;
      }
      #\${HOST_ID} .btn{
        width:56px;height:56px;
        border-radius:999px;
        border:0;
        cursor:pointer;
        background:#4f46e5;
        color:#fff;
        font-size:22px;
        box-shadow:0 12px 30px rgba(0,0,0,.25);
      }
      #\${HOST_ID} .panel{
        width:360px;
        height:520px;
        background:#fff;
        border-radius:16px;
        overflow:hidden;
        box-shadow:0 18px 60px rgba(0,0,0,.3);
        margin-bottom:10px;
        display:none;
      }
      #\${HOST_ID}[data-open="1"] .panel{
        display:block;
      }
      #\${HOST_ID} iframe{
        width:100%;
        height:100%;
        border:0;
      }
    \`;
    document.head.appendChild(style);
  }

  // -----------------------
  // Host
  // -----------------------
  let host = document.getElementById(HOST_ID);
  if (!host) {
    host = document.createElement("div");
    host.id = HOST_ID;
    host.setAttribute("data-open", "0");
    document.body.appendChild(host);
  }

  host.innerHTML = "";

  // Panel
  const panel = document.createElement("div");
  panel.className = "panel";

  const iframe = document.createElement("iframe");
  iframe.src = "${iframeSrc}";
  iframe.allow = "clipboard-read; clipboard-write";
  panel.appendChild(iframe);

  // Button
  const btn = document.createElement("button");
  btn.className = "btn";
  btn.innerText = "💬";
  btn.onclick = () => {
    host.setAttribute(
      "data-open",
      host.getAttribute("data-open") === "1" ? "0" : "1"
    );
  };

  host.appendChild(panel);
  host.appendChild(btn);

  console.log("[Widget] Loaded", {
    chatbotId: "${chatbotId}",
    widgetId: "${widgetId}"
  });
})();
  `);
}
