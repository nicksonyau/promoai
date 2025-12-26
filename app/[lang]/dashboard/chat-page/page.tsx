// app/[lang]/dashboard/chat-page/page.tsx
// PromoHubAI – Chat Page (Tidio-inspired)
// Scope: Chat landing page config (separate from widget config)
// Backend:
// GET  /chat-page/get/:widgetId
// POST /chat-page/create
// PUT  /chat-page/update/:widgetId

"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { Loader2, Check, Pencil } from "lucide-react";
import { apiFetch } from "@/lib/api";

const WIDGET_ID = "default";

// -----------------------------
// Types
// -----------------------------
export type ChatPageConfig = {
  widgetId: string;
  companyId?: string;

  branding?: {
    companyName?: string;
    companyUrl?: string;
    companyLogo?: string; // URL (for now)
  };

  appearance?: {
    backgroundMode?: "widget" | "solid" | "image";
    backgroundColor?: string; // hex
    backgroundImage?: string; // URL
  };

  header?: {
    title?: string;
    welcomeMessage?: string;
  };

  theme?: {
    accentColor?: string; // hex
    userBubbleColor?: string; // hex
    botBubbleStyle?: "light" | "brand-soft";
    input?: {
      borderColor?: string; // hex
      focusColor?: string; // hex
      sendButtonColor?: string; // hex
    };
  };

  createdAt?: string;
  updatedAt?: string;
};

type GetDoc = {
  exists: boolean;
  config?: ChatPageConfig | null;
  updatedAt?: string | null;
};

// ✅ backend GET currently returns shape A:
// { success:true, exists:boolean, data: ChatPageConfig|null }
//
// but your older UI expected shape B:
// { success:true, data:{ exists, config } }
//
// so support BOTH
type ApiResp =
  | { success: true; exists: boolean; data: ChatPageConfig | null }
  | { success: true; data: GetDoc }
  | { success: false; error?: string };

type SaveResp =
  | { success: true; data?: any }
  | { success: false; error?: string };

type SaveState =
  | { state: "idle" }
  | { state: "saving" }
  | { state: "saved"; at: number }
  | { state: "error"; message: string };

type HasRecordState = "unknown" | "yes" | "no";

// -----------------------------
// Defaults
// -----------------------------
const DEFAULT_CONFIG: ChatPageConfig = {
  widgetId: WIDGET_ID,
  branding: {
    companyName: "PromoHubAI",
    companyUrl: "",
    companyLogo: "",
  },
  header: {
    title: "Welcome",
    welcomeMessage: "Ask us anything",
  },
  appearance: {
    backgroundMode: "widget",
    backgroundColor: "#ffffff",
    backgroundImage: "",
  },
  theme: {
    accentColor: "#6D28D9",
    userBubbleColor: "#6D28D9",
    botBubbleStyle: "light",
    input: {
      borderColor: "#E5E7EB",
      focusColor: "#6D28D9",
      sendButtonColor: "#6D28D9",
    },
  },
};

// -----------------------------
// Small helpers (defensive)
// -----------------------------
function isObj(v: any): v is Record<string, any> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function errToMessage(e: any) {
  return String(e?.message || e || "Request failed");
}

function isValidHexColor(value?: string) {
  if (!value || typeof value !== "string") return false;
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);
}

function normalizeConfig(input: any): ChatPageConfig {
  const c = isObj(input) ? input : {};
  const cfg: ChatPageConfig = {
    ...DEFAULT_CONFIG,
    ...c,
    widgetId:
      typeof c.widgetId === "string" && c.widgetId ? c.widgetId : WIDGET_ID,
    branding: {
      ...DEFAULT_CONFIG.branding,
      ...(isObj(c.branding) ? c.branding : {}),
    },
    header: {
      ...DEFAULT_CONFIG.header,
      ...(isObj(c.header) ? c.header : {}),
    },
    appearance: {
      ...DEFAULT_CONFIG.appearance,
      ...(isObj(c.appearance) ? c.appearance : {}),
    },
    theme: {
      ...DEFAULT_CONFIG.theme,
      ...(isObj(c.theme) ? c.theme : {}),
      input: {
        ...DEFAULT_CONFIG.theme?.input,
        ...(isObj(c.theme?.input) ? c.theme.input : {}),
      },
    },
  };
  return cfg;
}

// ✅ unwrap GET response into a single shape
function unwrapGet(json: ApiResp | null): { exists: boolean; config: ChatPageConfig | null } | null {
  if (!json || (json as any).success !== true) return null;

  // Shape A: { success:true, exists:boolean, data: ChatPageConfig|null }
  if (typeof (json as any).exists === "boolean") {
    return {
      exists: (json as any).exists,
      config: ((json as any).data ?? null) as any,
    };
  }

  // Shape B: { success:true, data:{ exists, config } }
  const d = (json as any).data as GetDoc | undefined;
  if (d && typeof d.exists === "boolean") {
    return { exists: d.exists, config: (d.config ?? null) as any };
  }

  return null;
}

// -----------------------------
// Page
// -----------------------------
export default function ChatPageSettingsPage() {
  const [config, setConfig] = useState<ChatPageConfig>(DEFAULT_CONFIG);

  const [hydrating, setHydrating] = useState(true);
  const [save, setSave] = useState<SaveState>({ state: "idle" });
  const [hasRecord, setHasRecord] = useState<HasRecordState>("unknown");

  const [isEditing, setIsEditing] = useState(false);
  const [snapshot, setSnapshot] = useState<string>("");

  const dirty = useMemo(
    () => JSON.stringify(config) !== snapshot,
    [config, snapshot]
  );

  // -----------------------------
  // Load config (and auto-create when missing)
  // -----------------------------
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setHydrating(true);
        setHasRecord("unknown");

        const res = await apiFetch(`/chat-page/get/${WIDGET_ID}`, {
          method: "GET",
          headers: { Accept: "application/json" },
        });

        if (cancelled) return;

        // keep your old 404 fallback (even if backend usually returns 200 exists=false)
        if (res.status === 404) {
          const init = normalizeConfig(DEFAULT_CONFIG);
          setHasRecord("no");
          setConfig(init);
          setSnapshot(JSON.stringify(init));
          return;
        }

        const json = (await res.json().catch(() => null)) as ApiResp | null;
        const doc = unwrapGet(json);

        if (!doc) {
          const init = normalizeConfig(DEFAULT_CONFIG);
          setHasRecord("unknown");
          setConfig(init);
          setSnapshot(JSON.stringify(init));
          return;
        }

        // ✅ No record: set defaults + AUTO CREATE FIRST (your requirement)
        if (doc.exists === false) {
          const init = normalizeConfig(DEFAULT_CONFIG);

          setHasRecord("no");
          setConfig(init);
          setSnapshot(JSON.stringify(init));

          try {
            const createRes = await apiFetch("/chat-page/create", {
              method: "POST",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ ...init, widgetId: WIDGET_ID }),
            });

            // if already exists, do update (same pattern as your widget)
            if (createRes.status === 409) {
              await apiFetch(`/chat-page/update/${WIDGET_ID}`, {
                method: "PUT",
                headers: {
                  Accept: "application/json",
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ ...init, widgetId: WIDGET_ID }),
              });
            }

            if (!cancelled) setHasRecord("yes");
          } catch {
            // leave as "no" — user can still Save to create
          }

          return;
        }

        // Exists: load from server
        const serverCfg = normalizeConfig(doc.config ?? DEFAULT_CONFIG);
        setHasRecord("yes");
        setConfig(serverCfg);
        setSnapshot(JSON.stringify(serverCfg));
      } catch {
        const init = normalizeConfig(DEFAULT_CONFIG);
        if (cancelled) return;
        setHasRecord("unknown");
        setConfig(init);
        setSnapshot(JSON.stringify(init));
      } finally {
        if (!cancelled) setHydrating(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // -----------------------------
  // Save: create or update
  // -----------------------------
  async function onSave() {
    try {
      if (!isEditing) return;
      if (!dirty) return;

      // lightweight client validation (same strictness feel)
      const accent = config.theme?.accentColor;
      if (accent && !isValidHexColor(accent)) {
        setSave({ state: "error", message: "Invalid accentColor" });
        return;
      }
      if (
        config.appearance?.backgroundMode === "solid" &&
        config.appearance?.backgroundColor &&
        !isValidHexColor(config.appearance.backgroundColor)
      ) {
        setSave({ state: "error", message: "Invalid backgroundColor" });
        return;
      }
      if (
        config.theme?.userBubbleColor &&
        !isValidHexColor(config.theme.userBubbleColor)
      ) {
        setSave({ state: "error", message: "Invalid userBubbleColor" });
        return;
      }
      if (
        config.theme?.input?.borderColor &&
        !isValidHexColor(config.theme.input.borderColor)
      ) {
        setSave({ state: "error", message: "Invalid input.borderColor" });
        return;
      }
      if (
        config.theme?.input?.focusColor &&
        !isValidHexColor(config.theme.input.focusColor)
      ) {
        setSave({ state: "error", message: "Invalid input.focusColor" });
        return;
      }
      if (
        config.theme?.input?.sendButtonColor &&
        !isValidHexColor(config.theme.input.sendButtonColor)
      ) {
        setSave({ state: "error", message: "Invalid input.sendButtonColor" });
        return;
      }

      setSave({ state: "saving" });

      const payload = { ...config, widgetId: WIDGET_ID };

      const doCreate = () =>
        apiFetch("/chat-page/create", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

      const doUpdate = () =>
        apiFetch(`/chat-page/update/${WIDGET_ID}`, {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

      let res: Response;

      if (hasRecord === "yes") {
        res = await doUpdate();

        // ✅ safety: if update says not found, fallback create then update
        if (res.status === 404) {
          const c = await doCreate();
          if (c.status === 409) {
            res = await doUpdate();
          } else {
            res = c;
          }
        }
      } else {
        res = await doCreate();

        // same pattern as your widget page
        if (res.status === 409) {
          res = await doUpdate();
        }
      }

      const json = (await res.json().catch(() => null)) as SaveResp | null;

      if (!json?.success) {
        const msg = (json as any)?.error || `Save failed (${res.status})`;
        setSave({ state: "error", message: msg });
        return;
      }

      setHasRecord("yes");
      setSnapshot(JSON.stringify(payload));
      setSave({ state: "saved", at: Date.now() });
      window.setTimeout(() => setSave({ state: "idle" }), 1600);
      setIsEditing(false);
    } catch (e: any) {
      setSave({ state: "error", message: errToMessage(e) });
    }
  }

  // -----------------------------
  // Update helpers
  // -----------------------------
  function patchBranding<K extends keyof NonNullable<ChatPageConfig["branding"]>>(
    key: K,
    value: NonNullable<ChatPageConfig["branding"]>[K]
  ) {
    setConfig((s) => ({
      ...s,
      branding: { ...(s.branding ?? {}), [key]: value },
    }));
  }

  function patchHeader<K extends keyof NonNullable<ChatPageConfig["header"]>>(
    key: K,
    value: NonNullable<ChatPageConfig["header"]>[K]
  ) {
    setConfig((s) => ({
      ...s,
      header: { ...(s.header ?? {}), [key]: value },
    }));
  }

  function patchAppearance<
    K extends keyof NonNullable<ChatPageConfig["appearance"]>
  >(key: K, value: NonNullable<ChatPageConfig["appearance"]>[K]) {
    setConfig((s) => ({
      ...s,
      appearance: { ...(s.appearance ?? {}), [key]: value },
    }));
  }

  function patchTheme<K extends keyof NonNullable<ChatPageConfig["theme"]>>(
    key: K,
    value: NonNullable<ChatPageConfig["theme"]>[K]
  ) {
    setConfig((s) => ({
      ...s,
      theme: { ...(s.theme ?? {}), [key]: value },
    }));
  }

  function patchThemeInput<
    K extends keyof NonNullable<NonNullable<ChatPageConfig["theme"]>["input"]>
  >(key: K, value: NonNullable<NonNullable<ChatPageConfig["theme"]>["input"]>[K]) {
    setConfig((s) => ({
      ...s,
      theme: {
        ...(s.theme ?? {}),
        input: { ...(s.theme?.input ?? {}), [key]: value },
      },
    }));
  }

  const accent = config.theme?.accentColor ?? DEFAULT_CONFIG.theme!.accentColor!;
  const userBubble = config.theme?.userBubbleColor ?? accent;
  const botStyle = config.theme?.botBubbleStyle ?? "light";
  const inputBorder = config.theme?.input?.borderColor ?? "#E5E7EB";
  const sendBtn = config.theme?.input?.sendButtonColor ?? accent;

  return (
    <div className="p-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Chat Page</h1>
          <p className="text-sm text-gray-500 mt-1">
            Left: configuration. Right: live preview.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {save.state === "error" ? (
            <div className="text-sm text-red-600">{save.message}</div>
          ) : null}

          <button
            type="button"
            onClick={() => setIsEditing(true)}
            disabled={hydrating || isEditing}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm disabled:opacity-60"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={hydrating || save.state === "saving" || !isEditing || !dirty}
            className="inline-flex items-center gap-2 rounded-lg bg-purple-600 text-white px-4 py-2 text-sm font-medium disabled:opacity-60"
          >
            {save.state === "saving" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            {save.state === "saved" ? <Check className="h-4 w-4" /> : null}
            <span>
              {save.state === "saving"
                ? "Saving…"
                : save.state === "saved"
                ? "Saved"
                : "Save"}
            </span>
          </button>
        </div>
      </div>

      {/* Two-column: same row like chat-widget */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 items-start">
        {/* ================= LEFT SETTINGS ================= */}
        <div className="space-y-6 min-w-0">
          <Card title="Header">
            <div className="space-y-4">
              <Input
                label="Page title"
                value={config.header?.title ?? ""}
                disabled={!isEditing}
                onChange={(v) => patchHeader("title", v)}
              />
              <Input
                label="Welcome message"
                value={config.header?.welcomeMessage ?? ""}
                disabled={!isEditing}
                onChange={(v) => patchHeader("welcomeMessage", v)}
              />
            </div>
          </Card>

          <Card title="Branding">
            <div className="space-y-4">
              <Input
                label="Company name"
                value={config.branding?.companyName ?? ""}
                disabled={!isEditing}
                onChange={(v) => patchBranding("companyName", v)}
              />
              <Input
                label="Company URL"
                value={config.branding?.companyUrl ?? ""}
                disabled={!isEditing}
                onChange={(v) => patchBranding("companyUrl", v)}
              />
              <Input
                label="Company logo URL"
                value={config.branding?.companyLogo ?? ""}
                disabled={!isEditing}
                onChange={(v) => patchBranding("companyLogo", v)}
              />
            </div>
          </Card>

          <Card title="Theme">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Color
                  label="Accent color"
                  value={accent}
                  disabled={!isEditing}
                  onChange={(v) => patchTheme("accentColor", v)}
                />
                <Color
                  label="User bubble"
                  value={userBubble}
                  disabled={!isEditing}
                  onChange={(v) => patchTheme("userBubbleColor", v)}
                />
              </div>

              <Select
                label="Bot bubble style"
                value={botStyle}
                disabled={!isEditing}
                onChange={(v) => patchTheme("botBubbleStyle", v as any)}
                options={[
                  { label: "Light", value: "light" },
                  { label: "Brand soft", value: "brand-soft" },
                ]}
              />

              <div className="pt-4 border-t border-gray-100 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Color
                    label="Input border"
                    value={inputBorder}
                    disabled={!isEditing}
                    onChange={(v) => patchThemeInput("borderColor", v)}
                  />
                  <Color
                    label="Send button"
                    value={sendBtn}
                    disabled={!isEditing}
                    onChange={(v) => patchThemeInput("sendButtonColor", v)}
                  />
                </div>

                <Color
                  label="Input focus"
                  value={config.theme?.input?.focusColor ?? accent}
                  disabled={!isEditing}
                  onChange={(v) => patchThemeInput("focusColor", v)}
                />
              </div>
            </div>
          </Card>

          <Card title="Background">
            <div className="space-y-4">
              <Select
                label="Background mode"
                value={config.appearance?.backgroundMode ?? "widget"}
                disabled={!isEditing}
                onChange={(v) => patchAppearance("backgroundMode", v as any)}
                options={[
                  { label: "Use widget theme", value: "widget" },
                  { label: "Solid color", value: "solid" },
                  { label: "Image", value: "image" },
                ]}
              />

              {(config.appearance?.backgroundMode ?? "widget") === "solid" ? (
                <Color
                  label="Background color"
                  value={config.appearance?.backgroundColor ?? "#ffffff"}
                  disabled={!isEditing}
                  onChange={(v) => patchAppearance("backgroundColor", v)}
                />
              ) : null}

              {(config.appearance?.backgroundMode ?? "widget") === "image" ? (
                <Input
                  label="Background image URL"
                  value={config.appearance?.backgroundImage ?? ""}
                  disabled={!isEditing}
                  onChange={(v) => patchAppearance("backgroundImage", v)}
                />
              ) : null}
            </div>

            {!isEditing ? (
              <div className="mt-4 text-xs text-gray-500">
                Click <span className="font-medium">Edit</span> to change settings.
              </div>
            ) : null}
          </Card>
        </div>

        {/* ================= RIGHT LIVE PREVIEW ================= */}
        <div className="sticky top-20 h-fit min-w-0">
          <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
            <div className="text-sm font-medium mb-3 flex items-center justify-between">
              <span>Live Preview</span>
              {hydrating ? (
                <span className="text-xs text-gray-400">Loading…</span>
              ) : null}
            </div>

            <ChatPagePreview config={config} />
            <div className="mt-3 text-xs text-gray-500">
              Preview updates instantly (client-only).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// -----------------------------
// Preview (right column)
// -----------------------------
function ChatPagePreview({ config }: { config: ChatPageConfig }) {
  const accent = config.theme?.accentColor ?? "#6D28D9";
  const userBubble = config.theme?.userBubbleColor ?? accent;
  const botStyle = config.theme?.botBubbleStyle ?? "light";

  const inputBorder = config.theme?.input?.borderColor ?? "#E5E7EB";
  const sendBtn = config.theme?.input?.sendButtonColor ?? accent;

  const bgMode = config.appearance?.backgroundMode ?? "widget";

  const containerStyle: CSSProperties =
    bgMode === "solid"
      ? { backgroundColor: config.appearance?.backgroundColor ?? "#ffffff" }
      : bgMode === "image" && config.appearance?.backgroundImage
      ? {
          backgroundImage: `url(${config.appearance.backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }
      : {
          background:
            "linear-gradient(135deg, #eef2ff 0%, #ffffff 55%, #f5f3ff 100%)",
        };

  const botBubbleBg =
    botStyle === "brand-soft" ? "rgba(109,40,217,0.10)" : "#F3F4F6";

  return (
    <div className="relative rounded-2xl overflow-hidden border border-gray-100">
      <div className="p-6" style={{ ...containerStyle, minHeight: 560 }}>
        <div className="max-w-md mx-auto text-center">
          {/* logo */}
          {config.branding?.companyLogo ? (
            <img
              src={config.branding.companyLogo}
              alt="logo"
              className="mx-auto h-12 w-12 rounded-2xl border border-gray-200 bg-white object-contain"
            />
          ) : (
            <div className="mx-auto h-12 w-12 rounded-2xl border border-gray-200 bg-white" />
          )}

          <div className="mt-3 text-xl font-semibold text-gray-900">
            {config.header?.title || "Welcome"}
          </div>

          <div className="mt-1 text-sm text-gray-600">
            {config.header?.welcomeMessage || "Ask us anything"}
          </div>

          {config.branding?.companyUrl ? (
            <div className="mt-1 text-xs text-gray-500">
              {config.branding.companyUrl}
            </div>
          ) : null}
        </div>

        <div className="mt-6 max-w-md mx-auto">
          <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-4">
            <div className="space-y-3">
              <div
                className="w-fit max-w-[85%] rounded-2xl px-3 py-2 text-sm text-gray-800"
                style={{ background: botBubbleBg }}
              >
                Hello 👋 How can we help today?
              </div>

              <div
                className="ml-auto w-fit max-w-[85%] rounded-2xl px-3 py-2 text-sm text-white"
                style={{ background: userBubble }}
              >
                I want to know your pricing.
              </div>

              <div
                className="w-fit max-w-[85%] rounded-2xl px-3 py-2 text-sm text-gray-800"
                style={{ background: botBubbleBg }}
              >
                Sure — tell me your business type and I’ll recommend a plan.
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <input
                disabled
                className="flex-1 rounded-xl px-3 py-2 text-sm outline-none bg-white"
                style={{ border: `1px solid ${inputBorder}` }}
                placeholder="Type your message…"
              />
              <button
                disabled
                className="rounded-xl px-3 py-2 text-white text-sm font-semibold"
                style={{ background: sendBtn }}
              >
                →
              </button>
            </div>
          </div>
        </div>

        {/* floating launcher (subtle) */}
        <div className="absolute right-5 bottom-5">
          <div
            className="h-12 w-12 rounded-full shadow-lg flex items-center justify-center text-white"
            style={{ background: accent }}
            title="Launcher"
          >
            💬
          </div>
        </div>
      </div>
    </div>
  );
}

// -----------------------------
// UI Helpers (same style vibe as your widget page)
// -----------------------------
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="block text-sm space-y-1">
      <span className="text-gray-600">{label}</span>
      <input
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 bg-white disabled:bg-gray-50 disabled:text-gray-500"
      />
    </label>
  );
}

function Color({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-center justify-between text-sm">
      <span className="text-gray-600">{label}</span>
      <input
        type="color"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-12 rounded border border-gray-200 bg-white disabled:opacity-60"
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
  disabled?: boolean;
}) {
  return (
    <label className="block text-sm space-y-1">
      <span className="text-gray-600">{label}</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 bg-white disabled:bg-gray-50 disabled:text-gray-500"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
