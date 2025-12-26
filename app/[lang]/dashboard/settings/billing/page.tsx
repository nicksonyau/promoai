"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

type SubscriptionGetResp = {
  success: boolean;
  subscription: any | null;
  requiresActivation?: boolean;
  error?: string;
};

type Interval = "monthly" | "yearly";

function humanizeKey(k: string) {
  return String(k || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function safeDateLabel(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function normalizePlanKey(name: string) {
  return String(name || "").trim().toLowerCase();
}

export default function BillingPage() {
  const router = useRouter();
  const params = useParams() as any;
  const lang = typeof params?.lang === "string" ? params.lang : "en";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [subscription, setSubscription] = useState<any | null>(null);
  const [requiresActivation, setRequiresActivation] = useState<boolean>(false);

  const [interval, setInterval] = useState<Interval>("monthly");
  const [checkingOut, setCheckingOut] = useState<string | null>(null);

  async function loadSubscription() {
    setLoading(true);
    setError(null);

    try {
      console.log("[Billing] loading subscription...");
      const res = await apiFetch("/subscription/get", { method: "GET" });
      const data = (await res.json().catch(() => null)) as SubscriptionGetResp | null;

      console.log("[Billing] /subscription/get res.ok=", res.ok, "data=", data);

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Failed to load subscription");
      }

      setSubscription(data.subscription ?? null);
      setRequiresActivation(!!data.requiresActivation);
    } catch (e: any) {
      console.error("[Billing] load error:", e);
      setError(e?.message || "Internal error");
      setSubscription(null);
      setRequiresActivation(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!alive) return;
      await loadSubscription();
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const featuresObj = useMemo(() => {
    const caps = subscription?.capabilities;
    if (caps && typeof caps === "object") return caps;

    const limits = subscription?.limits;
    if (limits && typeof limits === "object") return limits;

    return {};
  }, [subscription]);

  const entries = useMemo(
    () => Object.entries(featuresObj as Record<string, any>),
    [featuresObj]
  );

  const planLabel = subscription?.plan ? String(subscription.plan).toUpperCase() : "—";
  const planKey = subscription?.plan ? normalizePlanKey(subscription.plan) : "";
  const statusLabel = subscription?.status ? String(subscription.status).toUpperCase() : "—";
  const intervalLabel = subscription?.interval ? String(subscription.interval).toUpperCase() : "—";

  const showActivationCta = !subscription || requiresActivation;

  async function startCheckout(targetPlan: string) {
    const plan = normalizePlanKey(targetPlan);

    try {
      setCheckingOut(plan);
      setError(null);

      console.log("[Billing] checkout start:", { plan, interval });

      const res = await apiFetch("/subscription/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan, interval }),
      });

      // Prefer JSON; fallback to text to see backend errors clearly
      let data: any = null;
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        data = await res.json().catch(() => null);
      } else {
        const txt = await res.text().catch(() => "");
        data = { success: false, error: txt || "Non-JSON response" };
      }

      console.log("[Billing] /subscription/checkout res.ok=", res.ok, "data=", data);

      if (!res.ok || !data?.success || !data?.url) {
        throw new Error(data?.error || "Checkout failed");
      }

      // ✅ Redirect to Stripe Checkout URL
      window.location.href = data.url;
    } catch (e: any) {
      console.error("[Billing] checkout error:", e);
      setError(e?.message || "Checkout failed");
    } finally {
      setCheckingOut(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Billing</h1>
          <p className="text-gray-600">Manage your subscription.</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Loading subscription…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Billing</h1>
          <p className="text-gray-600">Manage your subscription.</p>
        </div>

        <Link
          href={`/${lang}/pricing`}
          className="text-sm font-medium text-purple-700 hover:underline"
        >
          View Pricing
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-700">Error</p>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Activation CTA */}
      {showActivationCta && (
        <div className="rounded-2xl border border-purple-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">No active plan</p>
              <p className="text-sm text-gray-600">
                Please select a plan to activate your workspace.
              </p>
            </div>

            <button
              type="button"
              onClick={() => router.push(`/${lang}/pricing`)}
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700"
            >
              Choose a Plan
            </button>
          </div>
        </div>
      )}

      {/* Subscription summary */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-gray-500">Current Plan</p>
            <p className="text-2xl font-bold text-gray-900">{planLabel}</p>
          </div>

          <button
            type="button"
            onClick={() => router.push(`/${lang}/pricing`)}
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-200"
          >
            Change Plan
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500">Status</p>
            <p className="text-sm font-semibold text-gray-900">{statusLabel}</p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500">Billing Interval</p>
            <p className="text-sm font-semibold text-gray-900">{intervalLabel}</p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500">Renews / Ends</p>
            <p className="text-sm font-semibold text-gray-900">
              {safeDateLabel(subscription?.endDate)}
            </p>
          </div>
        </div>

        <div className="mt-3 text-sm text-gray-600">
          <span className="font-medium text-gray-900">Start:</span>{" "}
          {safeDateLabel(subscription?.startDate)}
        </div>
      </div>

      {/* Included features */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">Included Features</h3>

        {entries.length === 0 ? (
          <p className="text-sm text-gray-500">No feature details found for this subscription.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
            {entries.map(([k, v]) => {
              const isBool = typeof v === "boolean";
              const label = humanizeKey(k);

              return (
                <li
                  key={k}
                  className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3"
                >
                  <span className="text-gray-800">{label}</span>
                  <span className="font-semibold text-gray-900">
                    {isBool ? (v ? "✓" : "✕") : String(v)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Upgrade */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Upgrade</h3>
            <p className="text-sm text-gray-600">Upgrade plan via Stripe Checkout.</p>
          </div>

          <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1">
            <button
              type="button"
              onClick={() => setInterval("monthly")}
              className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                interval === "monthly"
                  ? "bg-purple-600 text-white"
                  : "text-gray-800 hover:bg-gray-100"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setInterval("yearly")}
              className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                interval === "yearly"
                  ? "bg-purple-600 text-white"
                  : "text-gray-800 hover:bg-gray-100"
              }`}
            >
              Yearly
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          <UpgradeCard
            title="Starter"
            subtitle="For solo & micro businesses"
            current={planKey === "starter"}
            disabled={checkingOut !== null}
            loading={checkingOut === "starter"}
            onClick={() => startCheckout("starter")}
          />
          <UpgradeCard
            title="Growth"
            subtitle="For SMEs"
            current={planKey === "growth"}
            disabled={checkingOut !== null}
            loading={checkingOut === "growth"}
            onClick={() => startCheckout("growth")}
          />
          <UpgradeCard
            title="Business"
            subtitle="For agencies & multi-outlet"
            current={planKey === "business"}
            disabled={checkingOut !== null}
            loading={checkingOut === "business"}
            onClick={() => startCheckout("business")}
          />
        </div>
      </div>
    </div>
  );
}

function UpgradeCard({
  title,
  subtitle,
  current,
  disabled,
  loading,
  onClick,
}: {
  title: string;
  subtitle: string;
  current: boolean;
  disabled: boolean;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-lg font-bold text-gray-900">{title}</p>
      <p className="text-sm text-gray-600">{subtitle}</p>

      <button
        type="button"
        disabled={disabled || current}
        onClick={onClick}
        className={`mt-4 w-full rounded-lg px-4 py-2 text-sm font-semibold transition ${
          current
            ? "bg-gray-100 text-gray-700"
            : "bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60"
        }`}
      >
        {current ? "Current Plan" : loading ? "Redirecting…" : `Upgrade to ${title}`}
      </button>
    </div>
  );
}
