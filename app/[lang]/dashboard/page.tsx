"use client";

import { useEffect, useState } from "react"; // ✅ add useState
import { useRouter } from "next/navigation";
import {
  Package,
  Zap,
  Users,
  BarChart3,
  MessageCircle,
  Inbox,
  Bot,
  Database,
  Send,
} from "lucide-react";
import { useInitSubscription } from "@/lib/hooks/useInitSubscription";

type WhatsAppStatus = "not_connected" | "connected";

function safeDateLabel(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

export default function DashboardPage() {
  const router = useRouter();

  const { ready, subscription, requiresActivation, error } = useInitSubscription();

  // ✅ on-demand toggle
  const [showPlanDetail, setShowPlanDetail] = useState(false);

  useEffect(() => {
    if (!ready) return;

    if (requiresActivation) {
      router.replace("/en/dashboard/pricing");
    }
  }, [ready, requiresActivation, router]);

  if (!ready || requiresActivation) return null;

  // safe derived values
  const plan = subscription?.plan ?? "free";
  const status = subscription?.status ?? "inactive";
  const interval = subscription?.interval ?? "monthly";
  const startDate = subscription?.startDate;
  const endDate = subscription?.endDate;

  const limits = subscription?.limits ?? {};
  const msgLimitPerDay = limits.messageLimitPerDay ?? 0;
  const campaignLimitPerMonth = limits.campaignLimitPerMonth ?? 0;
  const aiReplies = limits.aiReplies ?? 0;
  const storageLimitMb = limits.storageMb ?? 0;

  const source = subscription?.source ?? "unknown";
  const stripeSubId = subscription?.stripe?.subscriptionId ?? null;
  const stripeCustomerId = subscription?.stripe?.customerId ?? null;

  const whatsappStatus: WhatsAppStatus = "not_connected";
  const isWhatsAppConnected = whatsappStatus === "connected";

  const dailyUsed = 0;
  const dailyLimit = msgLimitPerDay;

  const storageUsedMb = 0;
  const storageLimit = storageLimitMb;

  return (
    <div className="space-y-8">
      {/* ================= PLAN BANNER ================= */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-gray-500">Current Plan</p>
            <p className="text-lg font-semibold text-gray-900">
              {String(plan).toUpperCase()}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Status: <span className="font-medium text-gray-700">{String(status).toUpperCase()}</span>
              {" · "}
              Interval: <span className="font-medium text-gray-700">{String(interval).toUpperCase()}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPlanDetail((v) => !v)}
              className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-200"
            >
              {showPlanDetail ? "Hide details" : "Show details"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/en/dashboard/settings/billing")}
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700"
            >
              Billing
            </button>
          </div>
        </div>

        {/* ✅ PLAN DETAILS ON-DEMAND */}
        {showPlanDetail && (
          <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500">
              Period:{" "}
              <span className="font-medium text-gray-700">
                {safeDateLabel(startDate)} → {safeDateLabel(endDate)}
              </span>
            </p>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500">Messages / Day</p>
                <p className="text-lg font-bold text-gray-900">{msgLimitPerDay}</p>
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500">Campaigns / Month</p>
                <p className="text-lg font-bold text-gray-900">{campaignLimitPerMonth}</p>
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500">AI Replies</p>
                <p className="text-lg font-bold text-gray-900">{aiReplies}</p>
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500">Storage (MB)</p>
                <p className="text-lg font-bold text-gray-900">{storageLimitMb}</p>
              </div>
            </div>

            {(stripeSubId || stripeCustomerId) && (
              <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs text-gray-500">Billing Source</p>
                <p className="text-sm font-medium text-gray-900">
                  {String(source).toUpperCase()}
                </p>
                <div className="mt-2 text-xs text-gray-600 space-y-1">
                  {stripeSubId ? <p>Stripe Subscription: {stripeSubId}</p> : null}
                  {stripeCustomerId ? <p>Stripe Customer: {stripeCustomerId}</p> : null}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ... your existing dashboard cards below (unchanged) ... */}

      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600">
          Start by connecting your WhatsApp channel to activate features.
        </p>
      </div>

      {/* WhatsApp */}
      <PrimaryCard
        icon={<MessageCircle className="w-6 h-6" />}
        title="WhatsApp Channel"
        description={
          isWhatsAppConnected
            ? "Your WhatsApp channel is active."
            : "Connect WhatsApp to unlock inbox, chatbot, and promotions."
        }
        ctaLabel={isWhatsAppConnected ? "Manage Channel" : "Connect WhatsApp"}
      />

      {/* Inbox */}
      <PrimaryCard
        icon={<Inbox className="w-6 h-6" />}
        title="Inbox"
        description="View and manage incoming WhatsApp customer messages and leads."
        ctaLabel="Open"
      />

      {/* Chatbot */}
      <PrimaryCard
        icon={<Bot className="w-6 h-6" />}
        title="Chatbot Configuration"
        description="Configure automation for WhatsApp replies and Web chat widget."
        ctaLabel="Open"
      />

      {/* Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UsageCard
          icon={<Send className="w-6 h-6" />}
          title="Daily Message Usage"
          value={`${dailyUsed} / ${dailyLimit}`}
          helper="WhatsApp messages allowed per day"
          percent={dailyLimit > 0 ? (dailyUsed / dailyLimit) * 100 : 0}
        />

        <UsageCard
          icon={<Database className="w-6 h-6" />}
          title="Storage Usage"
          value={`${storageUsedMb.toFixed(2)} / ${storageLimit} MB`}
          helper={
            storageLimit > 0
              ? `${(storageLimit - storageUsedMb).toFixed(2)} MB remaining`
              : "—"
          }
          percent={storageLimit > 0 ? (storageUsedMb / storageLimit) * 100 : 0}
        />
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={<Users className="w-6 h-6" />} label="Customers" value="—" />
        <StatCard icon={<Package className="w-6 h-6" />} label="Campaigns" value="—" />
        <StatCard icon={<Zap className="w-6 h-6" />} label="Messages Sent" value="—" />
        <StatCard icon={<BarChart3 className="w-6 h-6" />} label="Engagement Rate" value="—" />
      </div>
    </div>
  );
} 
/* ================= COMPONENTS ================= */

function PrimaryCard({
  icon,
  title,
  description,
  ctaLabel,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  ctaLabel: string;
}) {
  return (
    <div className="bg-white border border-purple-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-lg bg-purple-100 text-purple-600">{icon}</div>

        <div className="flex-1">
          <h2 className="font-bold text-gray-800">{title}</h2>
          <p className="text-sm text-gray-500">{description}</p>
        </div>

        <button className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">
          {ctaLabel}
        </button>
      </div>
    </div>
  );
}

function UsageCard({
  icon,
  title,
  value,
  helper,
  percent,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  helper: string;
  percent: number;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3 rounded-lg bg-purple-100 text-purple-600">{icon}</div>
        <div>
          <p className="font-bold text-gray-800">{title}</p>
          <p className="text-sm text-gray-500">{helper}</p>
        </div>
      </div>

      <p className="text-xl font-bold mb-2">{value}</p>

      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-purple-600 h-2 rounded-full"
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex items-center gap-4">
      <div className="p-3 rounded-lg bg-purple-100 text-purple-600">{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </div>
  );
}
