"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

type BillingEvent = {
  id: string;
  ts: string;
  type: string;
  plan?: string;
  interval?: string;
  refId?: string | null;
  note?: string;
};

export default function BillingEventDetailPage() {
  const params = useParams() as any;
  const router = useRouter();
  const eventId = params?.eventId;

  const [event, setEvent] = useState<BillingEvent | null>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        // 1️⃣ load billing events
        const evRes = await apiFetch("/subscription/billing/list");
        const evData = await evRes.json();

        if (!alive) return;

        const found = evData?.events?.find((e: BillingEvent) => e.id === eventId);
        setEvent(found || null);

        // 2️⃣ load current subscription (source of truth)
        const subRes = await apiFetch("/subscription/get");
        const subData = await subRes.json();

        if (subData?.success) {
          setSubscription(subData.subscription);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [eventId]);

  if (loading) return null;

  if (!event) {
    return (
      <div className="p-6">
        <button onClick={() => router.back()} className="text-purple-600 text-sm">
          ← Back
        </button>
        <p className="mt-4 text-gray-500">Billing event not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button onClick={() => router.back()} className="text-purple-600 text-sm">
        ← Back
      </button>

      {/* Event */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Billing Event</h2>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <Field label="Type" value={event.type} />
          <Field label="Plan" value={event.plan} />
          <Field label="Interval" value={event.interval} />
          <Field label="Reference" value={event.refId} />
          <Field label="Date" value={new Date(event.ts).toLocaleString()} />
          <Field label="Note" value={event.note} />
        </div>
      </div>

      {/* ✅ Plan Details (from subscription KV) */}
      {subscription && (
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Plan Details</h2>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <Field label="Plan" value={subscription.plan?.toUpperCase()} />
            <Field label="Status" value={subscription.status} />
            <Field label="Billing Period"
              value={`${new Date(subscription.startDate).toLocaleDateString()} → ${new Date(subscription.endDate).toLocaleDateString()}`}
            />

            <Field label="Messages / Day" value={subscription.limits?.messageLimitPerDay} />
            <Field label="Campaigns / Month" value={subscription.limits?.campaignLimitPerMonth} />
            <Field label="AI Replies" value={subscription.limits?.aiReplies} />
            <Field label="Storage (MB)" value={subscription.limits?.storageMb} />
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value?: any }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-medium text-gray-900">{value ?? "—"}</p>
    </div>
  );
}
