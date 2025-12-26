"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Loader2, Save } from "lucide-react";
import { Card, PageShell, ToggleRow, TextInput, SelectInput, errMsg } from "../_ui";

// ---- MAP THESE to your backend ----
const API = {
  get: "/webhooks/settings/get",
  update: "/webhooks/settings/update",
};

type WebhookSettings = {
  signingMode: "none" | "hmac-sha256";
  signatureHeader: string;   // e.g. "X-PromoHub-Signature"
  timeoutMs: number;         // per delivery
  maxAttempts: number;       // retries
  backoff: "fixed" | "exponential";
  enabled: boolean;
};

type GetResp = { success: true; data: WebhookSettings } | { success: false; error?: string };
type SaveResp = { success: true; data?: any } | { success: false; error?: string };

const DEFAULTS: WebhookSettings = {
  signingMode: "hmac-sha256",
  signatureHeader: "X-PromoHub-Signature",
  timeoutMs: 8000,
  maxAttempts: 6,
  backoff: "exponential",
  enabled: true,
};

function clampInt(v: string, fallback: number, min: number, max: number) {
  const n = Number.parseInt(v, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export default function WebhookSettingsPage() {
  const [cfg, setCfg] = useState<WebhookSettings>(DEFAULTS);
  const [hydrating, setHydrating] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ kind: "idle" | "error" | "success"; msg?: string }>({ kind: "idle" });

  async function load() {
    try {
      setHydrating(true);
      const res = await apiFetch(API.get, { method: "GET", headers: { Accept: "application/json" } });
      const json = (await res.json().catch(() => null)) as GetResp | null;

      if (!json?.success) {
        // if backend not ready, stay defaults
        setToast({ kind: "idle" });
        return;
      }
      setCfg({ ...DEFAULTS, ...json.data });
    } catch {
      // keep defaults
    } finally {
      setHydrating(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    try {
      setSaving(true);
      setToast({ kind: "idle" });

      const res = await apiFetch(API.update, {
        method: "PUT",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(cfg),
      });

      const json = (await res.json().catch(() => null)) as SaveResp | null;
      if (!json?.success) throw new Error((json as any)?.error || `Save failed (${res.status})`);

      setToast({ kind: "success", msg: "Saved." });
    } catch (e: any) {
      setToast({ kind: "error", msg: errMsg(e) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageShell
      title="Settings"
      subtitle="Global webhook delivery settings: signing, timeouts, retries, and delivery behavior."
      right={
        toast.kind !== "idle" ? (
          <div className={toast.kind === "error" ? "text-sm text-red-600" : "text-sm text-green-600"}>{toast.msg}</div>
        ) : null
      }
    >
      <Card
        title="Delivery settings"
        right={
          <button
            type="button"
            onClick={save}
            disabled={saving || hydrating}
            className="inline-flex items-center gap-2 rounded-lg bg-purple-600 text-white px-4 py-2 text-sm font-medium disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </button>
        }
      >
        {hydrating ? (
          <div className="py-6 text-sm text-gray-500 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : (
          <div className="space-y-6">
            <ToggleRow
              label="Enable webhooks"
              hint="Turn off to stop ALL deliveries."
              checked={cfg.enabled}
              onChange={(v) => setCfg((s) => ({ ...s, enabled: v }))}
              disabled={saving}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectInput
                label="Signing mode"
                value={cfg.signingMode}
                onChange={(v) => setCfg((s) => ({ ...s, signingMode: v as any }))}
                options={[
                  { label: "HMAC-SHA256 (recommended)", value: "hmac-sha256" },
                  { label: "None", value: "none" },
                ]}
                disabled={saving}
              />

              <TextInput
                label="Signature header"
                value={cfg.signatureHeader}
                onChange={(v) => setCfg((s) => ({ ...s, signatureHeader: v }))}
                placeholder="X-PromoHub-Signature"
                disabled={saving}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <TextInput
                label="Timeout (ms)"
                value={String(cfg.timeoutMs)}
                onChange={(v) => setCfg((s) => ({ ...s, timeoutMs: clampInt(v, s.timeoutMs, 1000, 60000) }))}
                disabled={saving}
              />
              <TextInput
                label="Max attempts"
                value={String(cfg.maxAttempts)}
                onChange={(v) => setCfg((s) => ({ ...s, maxAttempts: clampInt(v, s.maxAttempts, 1, 20) }))}
                disabled={saving}
              />
              <SelectInput
                label="Retry backoff"
                value={cfg.backoff}
                onChange={(v) => setCfg((s) => ({ ...s, backoff: v as any }))}
                options={[
                  { label: "Exponential", value: "exponential" },
                  { label: "Fixed", value: "fixed" },
                ]}
                disabled={saving}
              />
            </div>

            <div className="text-xs text-gray-500">
              Suggested defaults: HMAC signing, 8s timeout, 6 attempts, exponential backoff.
            </div>
          </div>
        )}
      </Card>
    </PageShell>
  );
}
