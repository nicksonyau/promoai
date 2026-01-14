"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";

/* ---------------------------------------------
   Types (defensive)
--------------------------------------------- */

type EmbedMode = "chatwidget" | "chatpage";

type EmbedConfig = {
  mode?: EmbedMode;
  chatWidgetId?: string;
  chatPageId?: string;
  publicUrl?: string; // persisted
};

type ChatbotConfig = {
  embed?: EmbedConfig;
};

type ListItem = {
  id: string;
  name?: string;
  title?: string;
};

/* ---------------------------------------------
   Single source of truth for domain
--------------------------------------------- */

const YOUR_DOMAIN = "http://localhost:3000";

// TEMP: you hardcoded this in test.html
const COMPANY_ID = "80e19a17-49ea-4ba3-973f-f987cf2921f6";

// TEMP: your worker
const API_BASE = "http://localhost:8787";

/* ---------------------------------------------
   Helpers
--------------------------------------------- */

function asConfig(x: any): ChatbotConfig {
  const v = x?.data ?? x;
  if (!v || typeof v !== "object") return {};
  return v as ChatbotConfig;
}

function pickList(x: any): ListItem[] {
  const list = x?.list;
  if (!Array.isArray(list)) return [];
  return list
    .map((it: any) => {
      const id = typeof it?.id === "string" ? it.id : "";
      if (!id) return null;
      const name = typeof it?.name === "string" ? it.name : undefined;
      const title = typeof it?.title === "string" ? it.title : undefined;
      return { id, name, title } as ListItem;
    })
    .filter(Boolean) as ListItem[];
}

function copyToClipboard(text: string) {
  if (!text) return;
  try {
    void navigator.clipboard.writeText(text);
  } catch {
    // ignore
  }
}

function joinBase(base: string, pathWithLeadingSlash: string) {
  const b = (base || "").trim().replace(/\/+$/, "");
  const p = (pathWithLeadingSlash || "").trim();
  return `${b}${p.startsWith("/") ? "" : "/"}${p}`;
}

/* ---------------------------------------------
   Component
--------------------------------------------- */

export default function EmbedTab() {
  const params = useParams<{ id: string }>();
  const chatbotId = (params?.id || "").trim();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [mode, setMode] = useState<EmbedMode>("chatwidget");
  const [chatWidgetId, setChatWidgetId] = useState("");
  const [chatPageId, setChatPageId] = useState("");

  const [widgets, setWidgets] = useState<ListItem[]>([]);
  const [pages, setPages] = useState<ListItem[]>([]);

  const [publicUrl, setPublicUrl] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  /* ---------------------------------------------
     Load initial: config + lists
  --------------------------------------------- */
  useEffect(() => {
    if (!chatbotId) return;

    const load = async () => {
      setLoading(true);
      setMsg(null);

      try {
        const [cfgRes, widgetRes, pageRes] = await Promise.all([
          apiFetch(`/chatbot/configGet/${chatbotId}`),
          apiFetch("/chat-widget/list"),
          apiFetch("/chatpage/list"),
        ]);

        const cfgJson = await cfgRes.json().catch(() => ({}));
        const cfg = asConfig(cfgJson);

        const embed = cfg?.embed ?? {};
        const cfgMode: EmbedMode =
          embed?.mode === "chatpage" || embed?.mode === "chatwidget"
            ? embed.mode
            : "chatwidget";

        setMode(cfgMode);
        setChatWidgetId(typeof embed?.chatWidgetId === "string" ? embed.chatWidgetId : "");
        setChatPageId(typeof embed?.chatPageId === "string" ? embed.chatPageId : "");
        setPublicUrl(typeof embed?.publicUrl === "string" ? embed.publicUrl : "");

        const wJson = await widgetRes.json().catch(() => ({}));
        setWidgets(pickList(wJson));

        const pJson = await pageRes.json().catch(() => ({}));
        setPages(pickList(pJson));
      } catch (e) {
        console.error("EmbedTab load failed", e);
        setWidgets([]);
        setPages([]);
        setMsg("Failed to load embed settings. Please refresh.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [chatbotId]);

  /* ---------------------------------------------
     Auto-fill publicUrl (only if empty)
     - We store a CUSTOMER-FACING script URL
--------------------------------------------- */
  useEffect(() => {
    if (publicUrl.trim()) return;

    if (mode === "chatwidget") {
      if (!chatWidgetId) return;

      // Store a useful default for customers: embed.js with query params
      // (embed.js supports q(chatbotId/widgetId/companyId/apiBase))
      const url = joinBase(
        YOUR_DOMAIN,
        `/embed.js?chatbotId=${encodeURIComponent(chatbotId)}&widgetId=${encodeURIComponent(
          chatWidgetId
        )}&companyId=${encodeURIComponent(COMPANY_ID)}&apiBase=${encodeURIComponent(API_BASE)}`
      );
      setPublicUrl(url);
      return;
    }

    if (mode === "chatpage") {
      if (!chatPageId) return;

      const url = joinBase(
        YOUR_DOMAIN,
        `/chat/${encodeURIComponent(chatbotId)}?pageId=${encodeURIComponent(chatPageId)}`
      );
      setPublicUrl(url);
      return;
    }
  }, [mode, chatWidgetId, chatPageId, chatbotId, publicUrl]);

  /* ---------------------------------------------
     Live Preview URL (IMPORTANT)
     - Preview must be an HTML page, not JS
--------------------------------------------- */
  const previewUrl = useMemo(() => {
    if (mode !== "chatwidget") return "";
    if (!chatbotId || !chatWidgetId) return "";

    return joinBase(
      YOUR_DOMAIN,
      `/embed-preview.html?chatbotId=${encodeURIComponent(chatbotId)}&widgetId=${encodeURIComponent(
        chatWidgetId
      )}&companyId=${encodeURIComponent(COMPANY_ID)}&apiBase=${encodeURIComponent(API_BASE)}`
    );
  }, [mode, chatbotId, chatWidgetId]);

  /* ---------------------------------------------
     Embed snippets
--------------------------------------------- */
  const snippets = useMemo(() => {
    const url = publicUrl.trim();
    if (!url) return { head: "", body: "", full: "" };

    if (mode === "chatpage") {
      const body = `<iframe
  src="${url}"
  style="width:100%;height:640px;border:0;border-radius:12px;overflow:hidden"
  loading="lazy"
  referrerpolicy="no-referrer-when-downgrade"
></iframe>`;
      return { head: "No head snippet required.", body, full: body };
    }

    // Chat widget: script only
    const head = "No head snippet required.";
    const body = `<script src="${url}" async></script>`;
    return { head, body, full: `${head}\n\n${body}` };
  }, [mode, publicUrl]);

  /* ---------------------------------------------
     Save embed settings
--------------------------------------------- */
  const save = async () => {
    if (!chatbotId) return;

    const url = publicUrl.trim();
    if (!url) {
      setMsg("Public URL is required.");
      return;
    }

    if (mode === "chatwidget" && !chatWidgetId) {
      setMsg("Please select a chat widget.");
      return;
    }
    if (mode === "chatpage" && !chatPageId) {
      setMsg("Please select a chat page.");
      return;
    }

    setSaving(true);
    setMsg(null);

    try {
      const res = await apiFetch(`/chatbot/configUpdate/${chatbotId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          embed: {
            mode,
            chatWidgetId: mode === "chatwidget" ? chatWidgetId : "",
            chatPageId: mode === "chatpage" ? chatPageId : "",
            publicUrl: url,
          } satisfies EmbedConfig,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Save failed");
      }

      setMsg("Saved.");
      setTimeout(() => setMsg(null), 1400);
    } catch (e: any) {
      console.error(e);
      setMsg(e?.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  /* ---------------------------------------------
     UI
--------------------------------------------- */
  if (loading) {
    return <div className="p-10 text-gray-500">Loading…</div>;
  }

  const selectedTitle =
    mode === "chatwidget"
      ? widgets.find((w) => w.id === chatWidgetId)?.name || ""
      : pages.find((p) => p.id === chatPageId)?.title || "";

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Embed</h1>
          <p className="text-sm text-gray-600 mt-1">
            Generate embed code and test it live. Save your selected defaults for this chatbot.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {msg && (
            <div className="text-sm text-gray-700 bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg">
              {msg}
            </div>
          )}
          <button
            onClick={save}
            disabled={saving || !publicUrl.trim()}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {/* Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left */}
        <div className="lg:col-span-2 space-y-6">
          {/* Settings */}
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Embed type
                </label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as EmbedMode)}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="chatwidget">Chat Widget (script)</option>
                  <option value="chatpage">Chat Page (iframe)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {mode === "chatwidget" ? "Select chat widget" : "Select chat page"}
                </label>

                {mode === "chatwidget" ? (
                  <select
                    value={chatWidgetId}
                    onChange={(e) => setChatWidgetId(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="">Select…</option>
                    {widgets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name || w.id}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={chatPageId}
                    onChange={(e) => setChatPageId(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="">Select…</option>
                    {pages.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title || p.id}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Public URL */}
            <div className="mt-4">
              <div className="flex items-center justify-between gap-3 mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Public URL
                </label>
                <button
                  type="button"
                  onClick={() => copyToClipboard(publicUrl.trim())}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Copy
                </button>
              </div>

              <input
                value={publicUrl}
                onChange={(e) => setPublicUrl(e.target.value)}
                placeholder={
                  mode === "chatwidget"
                    ? `${YOUR_DOMAIN}/embed.js?chatbotId=...&widgetId=...&companyId=...&apiBase=...`
                    : `${YOUR_DOMAIN}/chat/{chatbotId}?pageId=...`
                }
                className="w-full border rounded-lg px-3 py-2 font-mono text-sm"
              />

              <div className="mt-2 text-xs text-gray-500">
                Tip: This should be a <b>public link</b> (not /en/dashboard/…).
                Current selection:{" "}
                <span className="font-medium text-gray-700">
                  {selectedTitle || "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Embed code */}
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold">Embed code</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Copy and paste these snippets into your website:
                </p>
              </div>

              <button
                type="button"
                onClick={() => copyToClipboard(snippets.full)}
                className="text-sm text-indigo-600 hover:text-indigo-700"
              >
                Copy all
              </button>
            </div>

            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-800">
                  1) Inside {"<head>"}
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(snippets.head)}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Copy
                </button>
              </div>
              <pre className="bg-gray-50 border rounded-xl p-4 text-xs overflow-auto whitespace-pre-wrap">
                {snippets.head}
              </pre>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-800">
                  2) Before closing {"</body>"}
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(snippets.body)}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Copy
                </button>
              </div>
              <pre className="bg-gray-50 border rounded-xl p-4 text-xs overflow-auto whitespace-pre-wrap">
                {snippets.body || "Select a valid embed target + set a public URL."}
              </pre>
            </div>
          </div>
        </div>

        {/* Right: Live preview */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-5 sticky top-6">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <h3 className="text-base font-semibold">Live preview</h3>
                <p className="text-xs text-gray-500 mt-1">
                  This uses an HTML preview page (not the JS file).
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (previewUrl) window.open(previewUrl, "_blank");
                }}
                disabled={!previewUrl}
                className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-60"
              >
                Open
              </button>
            </div>

            {mode === "chatpage" ? (
              <iframe
                src={publicUrl.trim()}
                className="w-full h-[520px] border rounded-xl"
                loading="lazy"
              />
            ) : !previewUrl ? (
              <div className="border border-dashed rounded-xl p-4 text-sm text-gray-600">
                Select a chat widget to preview.
              </div>
            ) : (
              <iframe
                src={previewUrl}
                className="w-full h-[520px] border rounded-xl"
                loading="lazy"
              />
            )}

            <div className="mt-4 text-xs text-gray-500">
              Tip: if preview is blank, open DevTools Console inside the iframe page to see
              embed.js errors (missing chatbotId/widgetId, API base, CORS, etc).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
