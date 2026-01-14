"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";

/* -----------------------------
   TYPES (safe + flexible)
----------------------------- */

type UsageCounters = Record<string, number>;

type UsagePeriod = {
  key?: string; // e.g. "2026-01" (monthly) or "2026-01-08" (daily)
  from?: string;
  to?: string;
};

type UsageGetResp = {
  success: boolean;
  error?: string;

  // flexible shapes (backend may evolve)
  plan?: string;
  interval?: string;

  limits?: {
    messageLimitPerDay?: number;
    campaignLimitPerMonth?: number;
    aiReplies?: number;
    storageMb?: number;
  };

  usage?: UsageCounters; // e.g. { wa_messages: 3, ai_replies: 2 }
  period?: UsagePeriod;

  // optional extras
  updatedAt?: string;
};

type Row = {
  key: string;
  label: string;
  used: number;
  limit: number | null;
  unit?: string;
  helper?: string;
};

/* -----------------------------
   HELPERS
----------------------------- */

function safeNum(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function toUpperPlan(p?: string) {
  return (p ? String(p) : "free").toUpperCase();
}

function fmtDateTime(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function pct(used: number, limit: number | null) {
  if (!limit || limit <= 0) return 0;
  return Math.min(100, (used / limit) * 100);
}

function niceKey(k: string) {
  return k
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/* -----------------------------
   PAGE
----------------------------- */

export default function BillingUsagePage() {
  const params = useParams() as any;
  const lang = typeof params?.lang === "string" ? params.lang : "en";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<UsageGetResp | null>(null);

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch("/subscription/usage/get", { method: "GET" });
      const json = (await res.json().catch(() => null)) as UsageGetResp | null;

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Failed to load usage");
      }

      setData(json);
    } catch (e: any) {
      console.error("[BillingUsage] load error:", e);
      setError(e?.message || "Failed to load usage");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!alive) return;
      await load();
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const plan = data?.plan ?? "free";
  const limits = data?.limits ?? {};
  const usage = data?.usage ?? {};

  // If your backend returns different keys, this still works (falls back to listing raw counters).
  const rows: Row[] = useMemo(() => {
    const list: Row[] = [];

    // Canonical mapping (matches your plans)
    // You can add more counters later without breaking.
    const dailyMsgUsed =
      safeNum(usage.wa_messages) ||
      safeNum(usage.messages) ||
      safeNum(usage.messageCount) ||
      safeNum(usage.message) ||
      0;

    const aiRepliesUsed =
      safeNum(usage.ai_replies) ||
      safeNum(usage.aiReplies) ||
      safeNum(usage.ai) ||
      0;

    const campaignsUsed =
      safeNum(usage.campaigns) ||
      safeNum(usage.campaignCount) ||
      0;

    const storageUsedMb =
      safeNum(usage.storageMb) ||
      safeNum(usage.storage_mb) ||
      safeNum(usage.storage) ||
      0;

    // Show the core 4 first (even if 0)
    list.push({
      key: "messagesPerDay",
      label: "WhatsApp Messages (Daily)",
      used: dailyMsgUsed,
      limit: typeof limits.messageLimitPerDay === "number" ? limits.messageLimitPerDay : null,
      unit: "msgs",
      helper: "Daily allowed messages for your plan",
    });

    list.push({
      key: "campaignsPerMonth",
      label: "Campaigns (Monthly)",
      used: campaignsUsed,
      limit:
        typeof limits.campaignLimitPerMonth === "number" ? limits.campaignLimitPerMonth : null,
      unit: "campaigns",
      helper: "Monthly campaign allowance",
    });

    list.push({
      key: "aiReplies",
      label: "AI Replies",
      used: aiRepliesUsed,
      limit: typeof limits.aiReplies === "number" ? limits.aiReplies : null,
      unit: "replies",
      helper: "AI replies allowance (plan-based)",
    });

    list.push({
      key: "storageMb",
      label: "Storage",
      used: storageUsedMb,
      limit: typeof limits.storageMb === "number" ? limits.storageMb : null,
      unit: "MB",
      helper: "Storage allowance (plan-based)",
    });

    // Add any unknown usage keys (so you never lose visibility)
    const known = new Set([
      "wa_messages",
      "messages",
      "messageCount",
      "message",
      "ai_replies",
      "aiReplies",
      "ai",
      "campaigns",
      "campaignCount",
      "storageMb",
      "storage_mb",
      "storage",
    ]);

    Object.keys(usage).forEach((k) => {
      if (known.has(k)) return;
      const used = safeNum((usage as any)[k]);
      list.push({
        key: `extra:${k}`,
        label: niceKey(k),
        used,
        limit: null,
        helper: "Tracked usage (no limit defined yet)",
      });
    });

    return list;
  }, [usage, limits]);

  /* -----------------------------
     RENDER
  ----------------------------- */

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Usage</h1>
          <p className="text-gray-600">Plan usage & limits</p>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Loading usage…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Usage</h1>
          <p className="text-gray-600">Plan usage & limits</p>
        </div>

        <button
          type="button"
          onClick={load}
          className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-200"
        >
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-700">Error</p>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Plan Banner */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs text-gray-500">Current Plan</p>
            <p className="text-lg font-semibold text-gray-900">{toUpperPlan(plan)}</p>
          </div>

          <div className="text-xs text-gray-500">
            <div>
              <span className="font-semibold text-gray-700">Period:</span>{" "}
              {data?.period?.key || "—"}
            </div>
            <div>
              <span className="font-semibold text-gray-700">Updated:</span>{" "}
              {fmtDateTime(data?.updatedAt)}
            </div>
          </div>
        </div>
      </div>

      {/* Usage Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {rows.map((r) => (
          <div
            key={r.key}
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-bold text-gray-800">{r.label}</p>
                <p className="mt-1 text-sm text-gray-500">{r.helper || "—"}</p>
              </div>

              <div className="text-right">
                <p className="text-xl font-bold text-gray-900">
                  {r.used}
                  {r.limit !== null ? ` / ${r.limit}` : ""}
                  {r.unit ? ` ${r.unit}` : ""}
                </p>
                <p className="text-xs text-gray-500">
                  {r.limit !== null ? `${pct(r.used, r.limit).toFixed(0)}% used` : "No limit"}
                </p>
              </div>
            </div>

            <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full"
                style={{ width: `${pct(r.used, r.limit)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Raw Debug (optional but useful during build) */}
      <details className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <summary className="cursor-pointer text-sm font-semibold text-gray-900">
          Debug payload
        </summary>
        <pre className="mt-3 overflow-auto rounded-lg bg-gray-50 p-4 text-xs text-gray-700">
{JSON.stringify(data, null, 2)}
        </pre>
      </details>
    </div>
  );
}
