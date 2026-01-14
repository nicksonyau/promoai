"use client";

// app/[lang]/dashboard/chat-page/[widgetId]/page.tsx
// PromoHubAI – Chat Page (Tidio-inspired)
// Backend:
// GET  /chat-page/get/:widgetId
// POST /chat-page/create
// PUT  /chat-page/update/:widgetId

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { Loader2, Check, Pencil, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";

/* ---------------------------------------------
   Types
---------------------------------------------- */
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

// backend GET supports both shapes
type ApiResp =
  | { success: true; exists: boolean; data: ChatPageConfig | null }
  | { success: true; data: GetDoc }
  | { success: false; error?: string };

type SaveResp = { success: true; data?: any } | { success: false; error?: string };

type SaveState =
  | { state: "idle" }
  | { state: "saving" }
  | { state: "saved"; at: number }
  | { state: "error"; message: string };

type HasRecordState = "unknown" | "yes" | "no";

/* ---------------------------------------------
   Defaults (your tested code)
---------------------------------------------- */
const DEFAULT_CONFIG: ChatPageConfig = {
  widgetId: "default",
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

/* ---------------------------------------------
   Helpers
---------------------------------------------- */
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

// UUID (accepts v1-v5 style; your ids are v4)
function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function getWidgetIdFromPathname(pathname: string | null): string | null {
  if (!pathname) return null;
  const parts = pathname.split("/").filter(Boolean);
  const idx = parts.findIndex((p) => p === "chat-page");
  if (idx === -1) return null;
  const cand = parts[idx + 1];
  return cand ? String(cand) : null;
}

function normalizeConfig(input: any, widgetId: string): ChatPageConfig {
  const c = isObj(input) ? input : {};
  const cfg: ChatPageConfig = {
    ...DEFAULT_CONFIG,
    ...c,
    widgetId,
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

function unwrapGet(json: ApiResp | null): { exists: boolean; config: ChatPageConfig | null } | null {
  if (!json || (json as any).success !== true) return null;

  // Shape A
  if (typeof (json as any).exists === "boolean") {
    return {
      exists: (json as any).exists,
      config: ((json as any).data ?? null) as any,
    };
  }

  // Shape B
  const d = (json as any).data as GetDoc | undefined;
  if (d && typeof d.exists === "boolean") {
    return { exists: d.exists, config: (d.config ?? null) as any };
  }

  return null;
}

/* ---------------------------------------------
   Page
---------------------------------------------- */
export default function ChatPageSettingsPage() {
  const params = useParams();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const lang = useMemo(() => (pathname?.split("/")[1] as string) || "en", [pathname]);
  const seedName = useMemo(() => (searchParams?.get("name") || "").trim(), [searchParams]);

  // ✅ widgetId: params OR pathname fallback (fixes your "default" bug)
  const WIDGET_ID = useMemo(() => {
    const p = (params as any)?.widgetId ? String((params as any).widgetId) : "";
    const fromPath = getWidgetIdFromPathname(pathname) || "";
    const id = (p || fromPath || "").trim();
    return id;
  }, [params, pathname]);

  // fatal verification
  const [fatalError, setFatalError] = useState<string | null>(null);

  const [config, setConfig] = useState<ChatPageConfig>(() =>
    normalizeConfig(DEFAULT_CONFIG, "default")
  );

  const [hydrating, setHydrating] = useState(true);
  const [save, setSave] = useState<SaveState>({ state: "idle" });
  const [hasRecord, setHasRecord] = useState<HasRecordState>("unknown");

  const [isEditing, setIsEditing] = useState(false);
  const [snapshot, setSnapshot] = useState<string>("");

  const dirty = useMemo(() => JSON.stringify(config) !== snapshot, [config, snapshot]);

  // ✅ alert widgetId on load (once per widgetId)
  useEffect(() => {
    if (!WIDGET_ID) return;
    try {
      const key = `__chatpage_alerted_${WIDGET_ID}`;
      if (typeof window !== "undefined" && !sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        alert(`Chat Page widgetId = ${WIDGET_ID}`);
      }
    } catch {
      // ignore storage issues
      alert(`Chat Page widgetId = ${WIDGET_ID}`);
    }
  }, [WIDGET_ID]);

  // ✅ verify widgetId early; if wrong -> hard stop
  useEffect(() => {
    if (!WIDGET_ID) {
      setFatalError("Missing widgetId in URL. Expected /{lang}/dashboard/chat-page/<widgetId>.");
      return;
    }
    if (!isUuid(WIDGET_ID)) {
      setFatalError(`Invalid widgetId: "${WIDGET_ID}". Expected a UUID.`);
      return;
    }
    setFatalError(null);
  }, [WIDGET_ID]);

  // Load config
  useEffect(() => {
    if (fatalError) return;
    if (!WIDGET_ID) return;

    let cancelled = false;

    (async () => {
      try {
        setHydrating(true);
        setHasRecord("unknown");
        setSave({ state: "idle" });

        const res = await apiFetch(`/chat-page/get/${encodeURIComponent(WIDGET_ID)}`, {
          method: "GET",
          headers: { Accept: "application/json" },
        });

        if (cancelled) return;

        // Treat 404 as new record
        if (res.status === 404) {
          const base = normalizeConfig(DEFAULT_CONFIG, WIDGET_ID);
          const init = seedName
            ? { ...base, header: { ...(base.header ?? {}), title: seedName } }
            : base;

          setHasRecord("no");
          setConfig(init);

          // ✅ new record = unlocked, no Edit, Save allowed
          setIsEditing(true);

          // ✅ allow save even if user didn't change anything yet (create record for list)
          setSnapshot("");
          return;
        }

        const json = (await res.json().catch(() => null)) as ApiResp | null;
        const doc = unwrapGet(json);

        if (!doc) {
          const base = normalizeConfig(DEFAULT_CONFIG, WIDGET_ID);
          const init = seedName
            ? { ...base, header: { ...(base.header ?? {}), title: seedName } }
            : base;

          setHasRecord("unknown");
          setConfig(init);
          setIsEditing(true);
          setSnapshot("");
          return;
        }

        if (doc.exists === false) {
          const base = normalizeConfig(DEFAULT_CONFIG, WIDGET_ID);
          const init = seedName
            ? { ...base, header: { ...(base.header ?? {}), title: seedName } }
            : base;

          setHasRecord("no");
          setConfig(init);

          // ✅ new record = unlocked, no Edit, Save allowed
          setIsEditing(true);
          setSnapshot("");
          return;
        }

        // Exists: lock until Edit
        const serverCfg = normalizeConfig(doc.config ?? DEFAULT_CONFIG, WIDGET_ID);
        setHasRecord("yes");
        setConfig(serverCfg);
        setSnapshot(JSON.stringify(serverCfg));
        setIsEditing(false);
      } catch {
        const base = normalizeConfig(DEFAULT_CONFIG, WIDGET_ID);
        const init = seedName
          ? { ...base, header: { ...(base.header ?? {}), title: seedName } }
          : base;

        if (cancelled) return;
        setHasRecord("unknown");
        setConfig(init);
        setIsEditing(true);
        setSnapshot("");
      } finally {
        if (!cancelled) setHydrating(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [WIDGET_ID, seedName, fatalError]);

  async function onSave() {
    try {
      if (fatalError) return;
      if (hydrating) return;
      if (!isEditing) return;
      if (!dirty) return;

      // validation (your tested logic)
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
      if (config.theme?.userBubbleColor && !isValidHexColor(config.theme.userBubbleColor)) {
        setSave({ state: "error", message: "Invalid userBubbleColor" });
        return;
      }
      if (config.theme?.input?.borderColor && !isValidHexColor(config.theme.input.borderColor)) {
        setSave({ state: "error", message: "Invalid input.borderColor" });
        return;
      }
      if (config.theme?.input?.focusColor && !isValidHexColor(config.theme.input.focusColor)) {
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

      const payload: ChatPageConfig = { ...config, widgetId: WIDGET_ID };

      const doCreate = () =>
        apiFetch("/chat-page/create", {
          method: "POST",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

      const doUpdate = () =>
        apiFetch(`/chat-page/update/${encodeURIComponent(WIDGET_ID)}`, {
          method: "PUT",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

      let res: Response;

      if (hasRecord === "yes") {
        res = await doUpdate();
        if (res.status === 404) {
          const c = await doCreate();
          res = c.status === 409 ? await doUpdate() : c;
        }
      } else {
        res = await doCreate();
        if (res.status === 409) res = await doUpdate();
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

  function patchBranding<K extends keyof NonNullable<ChatPageConfig["branding"]>>(
    key: K,
    value: NonNullable<ChatPageConfig["branding"]>[K]
  ) {
    setConfig((s) => ({ ...s, branding: { ...(s.branding ?? {}), [key]: value } }));
  }

  function patchHeader<K extends keyof NonNullable<ChatPageConfig["header"]>>(
    key: K,
    value: NonNullable<ChatPageConfig["header"]>[K]
  ) {
    setConfig((s) => ({ ...s, header: { ...(s.header ?? {}), [key]: value } }));
  }

  function patchAppearance<K extends keyof NonNullable<ChatPageConfig["appearance"]>>(
    key: K,
    value: NonNullable<ChatPageConfig["appearance"]>[K]
  ) {
    setConfig((s) => ({ ...s, appearance: { ...(s.appearance ?? {}), [key]: value } }));
  }

  function patchTheme<K extends keyof NonNullable<ChatPageConfig["theme"]>>(
    key: K,
    value: NonNullable<ChatPageConfig["theme"]>[K]
  ) {
    setConfig((s) => ({ ...s, theme: { ...(s.theme ?? {}), [key]: value } }));
  }

  function patchThemeInput<
    K extends keyof NonNullable<NonNullable<ChatPageConfig["theme"]>["input"]>
  >(key: K, value: NonNullable<NonNullable<ChatPageConfig["theme"]>["input"]>[K]) {
    setConfig((s) => ({
      ...s,
      theme: { ...(s.theme ?? {}), input: { ...(s.theme?.input ?? {}), [key]: value } },
    }));
  }

  const accent = config.theme?.accentColor ?? DEFAULT_CONFIG.theme!.accentColor!;
  const userBubble = config.theme?.userBubbleColor ?? accent;
  const botStyle = config.theme?.botBubbleStyle ?? "light";
  const inputBorder = config.theme?.input?.borderColor ?? "#E5E7EB";
  const sendBtn = config.theme?.input?.sendButtonColor ?? accent;

  if (fatalError) {
    return (
      <div className="p-8 max-w-3xl">
        <div className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-semibold text-red-700">Chat Page Error</div>
          <div className="mt-2 text-sm text-red-600">{fatalError}</div>
          <div className="mt-4">
            <Link
              href={`/${lang}/dashboard/chat-page`}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link
            href={`/${lang}/dashboard/chat-page`}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">Chat Page</h1>
            <p className="text-sm text-gray-500 mt-1">Left: configuration. Right: live preview.</p>
            <p className="text-xs text-gray-400 mt-1">Widget ID: {WIDGET_ID}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {save.state === "error" ? <div className="text-sm text-red-600">{save.message}</div> : null}

          {/* ✅ Hide Edit button if new record */}
          {hasRecord === "yes" ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              disabled={hydrating || isEditing}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm disabled:opacity-60"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </button>
          ) : null}

          <button
            type="button"
            onClick={onSave}
            disabled={hydrating || save.state === "saving" || !isEditing || !dirty}
            className="inline-flex items-center gap-2 rounded-lg bg-purple-600 text-white px-4 py-2 text-sm font-medium disabled:opacity-60"
          >
            {save.state === "saving" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {save.state === "saved" ? <Check className="h-4 w-4" /> : null}
            <span>{save.state === "saving" ? "Saving…" : save.state === "saved" ? "Saved" : "Save"}</span>
          </button>
        </div>
      </div>

      {/* Two-column */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 items-start">
        {/* LEFT */}
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

        {/* RIGHT */}
        <div className="sticky top-20 h-fit min-w-0">
          <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
            <div className="text-sm font-medium mb-3 flex items-center justify-between">
              <span>Live Preview</span>
              {hydrating ? <span className="text-xs text-gray-400">Loading…</span> : null}
            </div>

            <ChatPagePreview config={config} />
            <div className="mt-3 text-xs text-gray-500">Preview updates instantly (client-only).</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------
   Preview
---------------------------------------------- */
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
          background: "linear-gradient(135deg, #eef2ff 0%, #ffffff 55%, #f5f3ff 100%)",
        };

  const botBubbleBg = botStyle === "brand-soft" ? "rgba(109,40,217,0.10)" : "#F3F4F6";

  return (
    <div className="relative rounded-2xl overflow-hidden border border-gray-100">
      <div className="p-6" style={{ ...containerStyle, minHeight: 560 }}>
        <div className="max-w-md mx-auto text-center">
          {config.branding?.companyLogo ? (
            <img
              src={config.branding.companyLogo}
              alt="logo"
              className="mx-auto h-12 w-12 rounded-2xl border border-gray-200 bg-white object-contain"
            />
          ) : (
            <div className="mx-auto h-12 w-12 rounded-2xl border border-gray-200 bg-white" />
          )}

          <div className="mt-3 text-xl font-semibold text-gray-900">{config.header?.title || "Welcome"}</div>
          <div className="mt-1 text-sm text-gray-600">{config.header?.welcomeMessage || "Ask us anything"}</div>

          {config.branding?.companyUrl ? (
            <div className="mt-1 text-xs text-gray-500">{config.branding.companyUrl}</div>
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

/* ---------------------------------------------
   UI Helpers
---------------------------------------------- */
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
