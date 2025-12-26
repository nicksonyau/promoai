"use client";

import { useEffect } from "react";
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

export default function DashboardPage() {
  const router = useRouter();

  // 🔑 subscription check (NO auto-free here)
  const {
    ready,
    subscription,
    requiresActivation,
    error,
  } = useInitSubscription();

  useEffect(() => {
    if (!ready) return;

    console.log("[Dashboard] subscription:", subscription);
    console.log("[Dashboard] requiresActivation:", requiresActivation);
    console.log("[Dashboard] error:", error);

    // 🚨 HARD GATE — no plan, no dashboard
    if (requiresActivation) {
      router.replace("/en/pricing");
    }
  }, [ready, requiresActivation, subscription, error, router]);

  // ⛔ Prevent dashboard flash
  if (!ready || requiresActivation) {
    return null;
  }

  const whatsappStatus: WhatsAppStatus = "not_connected";
  const isWhatsAppConnected = whatsappStatus === "connected";

  // mocked usage
  const monthlyUsed = 0;
  const monthlyLimit = 150;

  const storageUsedMb = 0.14;
  const storageLimitMb = 5;

  return (
    <div className="space-y-8">

      {/* Subscription Banner */}
      {subscription && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-500">Current Plan</p>
          <p className="text-lg font-semibold text-gray-900">
            {String(subscription.plan).toUpperCase()}
          </p>
        </div>
      )}

      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600">
          Start by connecting your WhatsApp channel to activate features.
        </p>
      </div>

      {/* WhatsApp Channel */}
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
          title="Monthly Message Utilization"
          value={`${monthlyUsed} / ${monthlyLimit}`}
          helper="WhatsApp messages sent this month"
          percent={(monthlyUsed / monthlyLimit) * 100}
        />

        <UsageCard
          icon={<Database className="w-6 h-6" />}
          title="Storage File Manager"
          value={`${storageUsedMb.toFixed(2)} / ${storageLimitMb.toFixed(2)} MB`}
          helper={`${(storageLimitMb - storageUsedMb).toFixed(2)} MB remaining`}
          percent={(storageUsedMb / storageLimitMb) * 100}
        />
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={<Users className="w-6 h-6" />} label="Customers" value="—" />
        <StatCard icon={<Package className="w-6 h-6" />} label="Products" value="—" />
        <StatCard icon={<Zap className="w-6 h-6" />} label="Messages Sent" value="—" />
        <StatCard icon={<BarChart3 className="w-6 h-6" />} label="Engagement Rate" value="—" />
      </div>
    </div>
  );
}

/* ---------- Components ---------- */

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
        <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
          {icon}
        </div>

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
        <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
          {icon}
        </div>
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
      <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </div>
  );
}
