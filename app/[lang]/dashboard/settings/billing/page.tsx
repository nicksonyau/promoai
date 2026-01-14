"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

/* -----------------------------
   TYPES
----------------------------- */

type BillingEvent = {
  id: string;
  ts: string;
  type: "activate" | "checkout_created" | "plan_changed" | string;
  plan?: string;
  interval?: string;
  refId?: string | null;
  note?: string;
};

type BillingListResp = {
  success: boolean;
  events: BillingEvent[];
  error?: string;
};

/* -----------------------------
   HELPERS
----------------------------- */

function safeDateLabel(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function eventTitle(e: BillingEvent) {
  const plan = e.plan ? String(e.plan).toUpperCase() : "";
  switch (e.type) {
    case "activate":
      return `Plan activated${plan ? `: ${plan}` : ""}`;
    case "checkout_created":
      return `Checkout created${plan ? `: ${plan}` : ""}`;
    case "plan_changed":
      return `Plan changed${plan ? `: ${plan}` : ""}`;
    default:
      return String(e.type || "Event");
  }
}

/* -----------------------------
   PAGE
----------------------------- */

export default function BillingHistoryPage() {
  const params = useParams() as any;
  const router = useRouter();
  const lang = typeof params?.lang === "string" ? params.lang : "en";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<BillingEvent[]>([]);

  async function loadBillingHistory() {
    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch("/subscription/billing/list", {
        method: "GET",
      });

      const data = (await res.json().catch(() => null)) as BillingListResp | null;

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Failed to load billing history");
      }

      setEvents(Array.isArray(data.events) ? data.events : []);
    } catch (e: any) {
      console.error("[BillingHistory] load error:", e);
      setError(e?.message || "Failed to load billing history");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!alive) return;
      await loadBillingHistory();
    })();
    return () => {
      alive = false;
    };
  }, []);

  /* -----------------------------
     RENDER
  ----------------------------- */

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Billing</h1>
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Loading billing history…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Billing</h1>
          <p className="text-gray-600">Billing activity history</p>
        </div>

        <button
          type="button"
          onClick={loadBillingHistory}
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

      {/* Billing History */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">
          Billing History
        </h3>

        {events.length === 0 ? (
          <p className="text-sm text-gray-500">No billing activity yet.</p>
        ) : (
          <div className="divide-y rounded-xl border border-gray-200">
            {events.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() =>
                  router.push(
                    `/${lang}/dashboard/settings/billing/${e.id}`
                  )
                }
                className="w-full text-left hover:bg-gray-50 transition"
              >
                <div className="flex items-start justify-between gap-4 p-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {eventTitle(e)}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {safeDateLabel(e.ts)}
                      {e.interval ? ` · ${e.interval.toUpperCase()}` : ""}
                      {e.note ? ` · ${e.note}` : ""}
                    </p>
                  </div>

                  {e.refId ? (
                    <span className="shrink-0 rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
                      {e.refId}
                    </span>
                  ) : null}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
