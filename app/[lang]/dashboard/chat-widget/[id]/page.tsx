"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  Image as ImageIcon,
  Volume2,
  VolumeX,
  Loader2,
  Check,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

// -----------------------------
// Types
// -----------------------------
type WidgetAppearance = {
  brandName: string;
  brandLogo?: string; // dataURL (client-only)
  brandColor: string;
  actionColor: string;
  backgroundColor: string;
  backgroundImage?: string; // dataURL (client-only)
  title: string;
  message: string;
  position: "left" | "right";
  showWhenOffline: boolean;
  enableSound: boolean;
  onlineStatus: string;
  offlineStatus: string;
};

type ConversationStarter = {
  id: string;
  text: string;
  enabled: boolean;
  intent: string;
};

type ApiDoc = {
  exists: boolean;
  appearance: WidgetAppearance;
  starters: ConversationStarter[];
  updatedAt: string | null;
};

type ApiResp =
  | { success: true; data: ApiDoc }
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

const DEFAULT_APPEARANCE: WidgetAppearance = {
  brandName: "PromoAI",
  brandLogo: undefined,
  brandColor: "#6D28D9",
  actionColor: "#6D28D9",
  backgroundColor: "#EEF2FF",
  backgroundImage: undefined,
  title: "Hi there 👋",
  message: "How can we help you today?",
  position: "right",
  showWhenOffline: true,
  enableSound: true,
  onlineStatus: "We reply immediately",
  offlineStatus: "We typically reply within a few minutes.",
};

function makeDefaultStarters(): ConversationStarter[] {
  return [
    {
      id:
        (globalThis.crypto as any)?.randomUUID?.() ||
        `st_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      text: "Do you offer discount codes?",
      enabled: true,
      intent: "discount_inquiry",
    },
    {
      id:
        (globalThis.crypto as any)?.randomUUID?.() ||
        `st_${Date.now() + 1}_${Math.random().toString(16).slice(2)}`,
      text: "What is my order status?",
      enabled: true,
      intent: "order_status",
    },
    {
      id:
        (globalThis.crypto as any)?.randomUUID?.() ||
        `st_${Date.now() + 2}_${Math.random().toString(16).slice(2)}`,
      text: "What is the exchange policy?",
      enabled: true,
      intent: "exchange_policy",
    },
  ];
}

// -----------------------------
// Small helpers (defensive)
// -----------------------------
function isObj(v: any): v is Record<string, any> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function pickPosition(v: any): "left" | "right" {
  return v === "left" || v === "right" ? v : DEFAULT_APPEARANCE.position;
}

function normalizeAppearance(input: any): WidgetAppearance {
  const a = isObj(input) ? input : {};
  return {
    ...DEFAULT_APPEARANCE,
    ...a,
    position: pickPosition(a.position),
    showWhenOffline:
      typeof a.showWhenOffline === "boolean"
        ? a.showWhenOffline
        : DEFAULT_APPEARANCE.showWhenOffline,
    enableSound:
      typeof a.enableSound === "boolean"
        ? a.enableSound
        : DEFAULT_APPEARANCE.enableSound,
  };
}

function normalizeStarters(input: any): ConversationStarter[] {
  const arr = Array.isArray(input) ? input : [];
  const cleaned = arr
    .map((x) => (isObj(x) ? x : null))
    .filter(Boolean)
    .map((x: any) => ({
      id:
        typeof x.id === "string" && x.id.length > 0
          ? x.id
          : (globalThis.crypto as any)?.randomUUID?.() ||
            `st_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      text: typeof x.text === "string" ? x.text : "",
      enabled: typeof x.enabled === "boolean" ? x.enabled : true,
      intent: typeof x.intent === "string" ? x.intent : "custom_intent",
    }))
    .filter((x) => x.text.trim().length > 0);

  return cleaned.length > 0 ? cleaned : makeDefaultStarters();
}

function errToMessage(e: any) {
  return String(e?.message || e || "Request failed");
}

function safeId(v: any) {
  return typeof v === "string" ? v.trim() : "";
}

export default function ChatWidgetAppearancePage() {
  const params = useParams<{ lang: string; id: string }>();
  const widgetId = useMemo(() => safeId(params?.id), [params]);

  const [tab, setTab] = useState<"home" | "advanced">("home");

  const [appearance, setAppearance] =
    useState<WidgetAppearance>(DEFAULT_APPEARANCE);
  const [starters, setStarters] = useState<ConversationStarter[]>(
    makeDefaultStarters()
  );

  const [hydrating, setHydrating] = useState(true);
  const [save, setSave] = useState<SaveState>({ state: "idle" });

  // ✅ tracks whether backend record exists
  const [hasRecord, setHasRecord] = useState<HasRecordState>("unknown");

  const enabledStarters = useMemo(
    () => starters.filter((s) => s.enabled),
    [starters]
  );

  function updateAppearance<K extends keyof WidgetAppearance>(
    key: K,
    value: WidgetAppearance[K]
  ) {
    setAppearance((s) => ({ ...s, [key]: value }));
  }

  function readImageFile(file: File, cb: (dataUrl: string) => void) {
    const reader = new FileReader();
    reader.onload = () => cb(reader.result as string);
    reader.readAsDataURL(file);
  }

  // -----------------------------
  // Load from backend once
  // GET /chat-widget/appearance/get/:widgetId
  // backend returns { success: true, data: { exists: boolean, ... } }
  // -----------------------------
  useEffect(() => {
    if (!widgetId) {
      setHydrating(false);
      setHasRecord("unknown");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setHydrating(true);
        setHasRecord("unknown");

        const res = await apiFetch(
          `/chat-widget/appearance/get/${encodeURIComponent(widgetId)}`,
          {
            method: "GET",
            headers: { Accept: "application/json" },
          }
        );

        if (cancelled) return;

        const json = (await res.json().catch(() => null)) as ApiResp | null;

        if (!json || (json as any).success !== true) {
          setHasRecord("unknown");
          return;
        }

        // ✅ exists=false -> treat as "create mode"
        if (json.data?.exists === false) {
          setHasRecord("no");
          setAppearance(normalizeAppearance({}));
          setStarters(makeDefaultStarters());
          return;
        }

        // ✅ exists=true -> edit mode
        setHasRecord("yes");
        setAppearance(normalizeAppearance(json.data?.appearance));
        setStarters(normalizeStarters(json.data?.starters));
      } catch {
        if (cancelled) return;
        setHasRecord("unknown");
      } finally {
        if (!cancelled) setHydrating(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [widgetId]);

  // -----------------------------
  // Save: create or update
  // POST /chat-widget/appearance/create
  // PUT  /chat-widget/appearance/update/:widgetId
  // -----------------------------
  async function onSave() {
    if (!widgetId) {
      setSave({ state: "error", message: "Missing widgetId in route." });
      return;
    }

    try {
      setSave({ state: "saving" });

      const payload = { widgetId, appearance, starters };

      const doCreate = () =>
        apiFetch("/chat-widget/appearance/create", {
          method: "POST",
          headers: { Accept: "application/json" },
          body: JSON.stringify(payload),
        });

      const doUpdate = () =>
        apiFetch(
          `/chat-widget/appearance/update/${encodeURIComponent(widgetId)}`,
          {
            method: "PUT",
            headers: { Accept: "application/json" },
            body: JSON.stringify(payload),
          }
        );

      let res: Response;

      if (hasRecord === "yes") {
        res = await doUpdate();
      } else {
        // try create first
        res = await doCreate();

        // 409 means record exists -> switch to update
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
      setSave({ state: "saved", at: Date.now() });
      window.setTimeout(() => setSave({ state: "idle" }), 1600);
    } catch (e: any) {
      setSave({ state: "error", message: errToMessage(e) });
    }
  }

  return (
    <div className="p-8 max-w-7xl">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Live Chat Appearance</h1>
          <p className="text-sm text-gray-500 mt-1">
            Widget ID:{" "}
            <span className="font-mono text-gray-700">
              {widgetId || "(missing)"}
            </span>
            {hasRecord === "no" ? (
              <span className="ml-2 text-xs text-gray-500">
                • New (not saved yet)
              </span>
            ) : hasRecord === "yes" ? (
              <span className="ml-2 text-xs text-gray-500">• Existing</span>
            ) : null}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {save.state === "error" ? (
            <div className="text-sm text-red-600">{save.message}</div>
          ) : null}

          <button
            type="button"
            onClick={onSave}
            disabled={!widgetId || hydrating || save.state === "saving"}
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

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
        {/* ================= LEFT SETTINGS ================= */}
        <div className="space-y-6">
          <Card title="Appearance">
            <Tabs
              value={tab}
              onChange={setTab}
              items={[
                { value: "home", label: "Home" },
                { value: "advanced", label: "Advanced" },
              ]}
            />

            <div className="mt-6">
              {tab === "home" ? (
                <div className="space-y-8">
                  <SubSection title="Brand">
                    <Input
                      label="Brand name"
                      value={appearance.brandName}
                      onChange={(v) => updateAppearance("brandName", v)}
                    />

                    <label className="text-sm space-y-1 block">
                      <span className="text-gray-600">
                        Brand logo (optional)
                      </span>
                      <div className="flex items-center gap-3">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            readImageFile(file, (dataUrl) =>
                              updateAppearance("brandLogo", dataUrl)
                            );
                          }}
                        />
                        <ImageIcon size={16} className="text-gray-400" />
                        {appearance.brandLogo ? (
                          <button
                            className="text-xs text-gray-500 hover:text-red-500"
                            onClick={() =>
                              updateAppearance("brandLogo", undefined)
                            }
                            type="button"
                          >
                            Remove
                          </button>
                        ) : null}
                      </div>
                    </label>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Color
                        label="Brand color"
                        value={appearance.brandColor}
                        onChange={(v) => updateAppearance("brandColor", v)}
                      />
                      <Color
                        label="Action color"
                        value={appearance.actionColor}
                        onChange={(v) => updateAppearance("actionColor", v)}
                      />
                    </div>
                  </SubSection>

                  <SubSection title="Home screen">
                    <Input
                      label="Title"
                      value={appearance.title}
                      onChange={(v) => updateAppearance("title", v)}
                    />

                    <Textarea
                      label="Message"
                      value={appearance.message}
                      onChange={(v) => updateAppearance("message", v)}
                    />
                  </SubSection>

                  <SubSection title="Conversation starters">
                    <p className="text-sm text-gray-500">
                      Visitors can quickly start a conversation. Each starter
                      maps to a chatbot intent.
                    </p>

                    <div className="space-y-3">
                      {starters.map((s, index) => (
                        <div
                          key={s.id}
                          className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3"
                        >
                          <span className="text-gray-400 select-none">
                            ⋮⋮
                          </span>

                          <input
                            type="checkbox"
                            checked={s.enabled}
                            onChange={(e) => {
                              const copy = [...starters];
                              copy[index] = {
                                ...copy[index],
                                enabled: e.target.checked,
                              };
                              setStarters(copy);
                            }}
                          />

                          <input
                            value={s.text}
                            onChange={(e) => {
                              const copy = [...starters];
                              copy[index] = {
                                ...copy[index],
                                text: e.target.value,
                              };
                              setStarters(copy);
                            }}
                            className="flex-1 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-purple-200"
                          />

                          <input
                            value={s.intent}
                            onChange={(e) => {
                              const copy = [...starters];
                              copy[index] = {
                                ...copy[index],
                                intent: e.target.value,
                              };
                              setStarters(copy);
                            }}
                            placeholder="intent_key"
                            className="w-40 rounded-lg px-2 py-2 text-xs bg-gray-100"
                          />

                          <button
                            onClick={() =>
                              setStarters(
                                starters.filter((x) => x.id !== s.id)
                              )
                            }
                            className="text-gray-400 hover:text-red-500"
                            title="Remove"
                            type="button"
                          >
                            🗑
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() =>
                        setStarters([
                          ...starters,
                          {
                            id:
                              (globalThis.crypto as any)?.randomUUID?.() ||
                              `st_${Date.now()}_${Math.random()
                                .toString(16)
                                .slice(2)}`,
                            text: "New conversation starter",
                            enabled: true,
                            intent: "custom_intent",
                          },
                        ])
                      }
                      className="w-fit rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50"
                      type="button"
                    >
                      + Add new
                    </button>
                  </SubSection>

                  <SubSection title="Status text">
                    <Input
                      label="Online status"
                      value={appearance.onlineStatus}
                      onChange={(v) => updateAppearance("onlineStatus", v)}
                    />
                    <Input
                      label="Offline status"
                      value={appearance.offlineStatus}
                      onChange={(v) => updateAppearance("offlineStatus", v)}
                    />
                  </SubSection>
                </div>
              ) : (
                <div className="space-y-8">
                  <SubSection title="Background">
                    <Color
                      label="Background color"
                      value={appearance.backgroundColor}
                      onChange={(v) =>
                        updateAppearance("backgroundColor", v)
                      }
                    />

                    <label className="text-sm space-y-1 block">
                      <span className="text-gray-600">
                        Background image (optional)
                      </span>
                      <div className="flex items-center gap-3">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            readImageFile(file, (dataUrl) =>
                              updateAppearance("backgroundImage", dataUrl)
                            );
                          }}
                        />
                        <ImageIcon size={16} className="text-gray-400" />
                        {appearance.backgroundImage ? (
                          <button
                            className="text-xs text-gray-500 hover:text-red-500"
                            onClick={() =>
                              updateAppearance("backgroundImage", undefined)
                            }
                            type="button"
                          >
                            Remove
                          </button>
                        ) : null}
                      </div>
                    </label>
                  </SubSection>

                  <SubSection title="Behavior">
                    <Toggle
                      label="Display widget when agents are offline"
                      checked={appearance.showWhenOffline}
                      onChange={(v) => updateAppearance("showWhenOffline", v)}
                    />

                    <Toggle
                      label="Enable widget sounds"
                      checked={appearance.enableSound}
                      onChange={(v) => updateAppearance("enableSound", v)}
                      icon={
                        appearance.enableSound ? (
                          <Volume2 size={14} />
                        ) : (
                          <VolumeX size={14} />
                        )
                      }
                    />

                    <Select
                      label="Launcher position"
                      value={appearance.position}
                      onChange={(v) =>
                        updateAppearance("position", v as any)
                      }
                      options={[
                        { label: "Bottom right", value: "right" },
                        { label: "Bottom left", value: "left" },
                      ]}
                    />
                  </SubSection>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* ================= RIGHT LIVE PREVIEW ================= */}
        <div className="sticky top-20 h-fit">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="text-sm font-medium mb-3 flex items-center justify-between">
              <span>Live Preview</span>
              {hydrating ? (
                <span className="text-xs text-gray-400">Loading…</span>
              ) : null}
            </div>

            <div className="relative rounded-2xl bg-gray-50 p-4">
              <div className="mx-auto w-[320px]">
                <div className="rounded-2xl overflow-hidden bg-white shadow-sm">
                  <div
                    className="p-4 text-white"
                    style={{
                      backgroundColor: appearance.brandColor,
                      backgroundImage: appearance.backgroundImage
                        ? `url(${appearance.backgroundImage})`
                        : undefined,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {appearance.brandLogo ? (
                        <img
                          src={appearance.brandLogo}
                          alt="Brand logo"
                          className="h-7 w-7 rounded-full bg-white/20 object-cover"
                        />
                      ) : (
                        <div className="h-7 w-7 rounded-full bg-white/20" />
                      )}

                      <div className="font-semibold">{appearance.brandName}</div>
                      <div className="ml-auto text-white/80 text-lg leading-none">
                        ⋮
                      </div>
                    </div>

                    <div className="mt-3 text-lg font-semibold">
                      {appearance.title}
                    </div>
                    <div className="text-sm text-white/90">
                      {appearance.message}
                    </div>
                  </div>

                  <div
                    className="p-4"
                    style={{ backgroundColor: appearance.backgroundColor }}
                  >
                    <div className="space-y-2">
                      {enabledStarters.length > 0 ? (
                        enabledStarters.slice(0, 5).map((s) => (
                          <div
                            key={s.id}
                            className="flex items-center justify-between rounded-xl bg-white/80 px-3 py-2 text-sm cursor-pointer hover:bg-white"
                            title={`Intent: ${s.intent}`}
                          >
                            <span className="truncate">{s.text}</span>
                            <span className="text-gray-400">›</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500">
                          No conversation starters enabled.
                        </div>
                      )}
                    </div>

                    <div className="mt-4 rounded-xl bg-white/90 px-4 py-3">
                      <div className="text-sm font-medium">Chat with us</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {appearance.showWhenOffline
                          ? appearance.onlineStatus
                          : appearance.offlineStatus}
                      </div>
                    </div>

                    <button
                      className="mt-4 w-full rounded-full py-2.5 text-sm font-medium text-white shadow-sm"
                      style={{ backgroundColor: appearance.actionColor }}
                      type="button"
                    >
                      Chat with us
                    </button>
                  </div>
                </div>

                <div
                  className={`mt-4 flex ${
                    appearance.position === "right"
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <button
                    className="rounded-full px-4 py-2 text-sm bg-white shadow-sm"
                    type="button"
                  >
                    Chat with us 👋
                  </button>
                  <div
                    className="ml-3 h-12 w-12 rounded-full shadow-sm"
                    style={{ backgroundColor: appearance.actionColor }}
                    title="Launcher"
                  />
                </div>
              </div>
            </div>

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
// UI Helpers
// -----------------------------
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Tabs({
  value,
  onChange,
  items,
}: {
  value: string;
  onChange: (v: any) => void;
  items: { value: string; label: string }[];
}) {
  return (
    <div className="border-b border-gray-100">
      <div className="flex items-center gap-6">
        {items.map((it) => (
          <button
            key={it.value}
            type="button"
            onClick={() => onChange(it.value)}
            className={`relative pb-3 text-sm ${
              value === it.value
                ? "text-purple-700"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {it.label}
            {value === it.value ? (
              <span className="absolute left-0 right-0 -bottom-[1px] h-[2px] bg-purple-600 rounded-full" />
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block text-sm space-y-1">
      <span className="text-gray-600">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 bg-white"
      />
    </label>
  );
}

function Textarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block text-sm space-y-1">
      <span className="text-gray-600">{label}</span>
      <textarea
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 bg-white"
      />
    </label>
  );
}

function Color({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center justify-between text-sm">
      <span className="text-gray-600">{label}</span>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-12 rounded border border-gray-200 bg-white"
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <label className="block text-sm space-y-1">
      <span className="text-gray-600">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 bg-white"
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

function Toggle({
  label,
  checked,
  onChange,
  icon,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2 text-gray-800">
        {icon}
        <span>{label}</span>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4"
      />
    </div>
  );
}
