// /broadcasts/[id]/edit/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";

import { BroadcastProvider, useBroadcast } from "../../new/BroadcastContext";
import BroadcastFlow from "../../new/BroadcastFlow";

function EditBootstrap({ id }: { id: string }) {
  const { update, setStep } = useBroadcast();
  const [error, setError] = useState<string | null>(null);
  const hydrated = useRef(false);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;

    async function load() {
      try {
        const res = await apiFetch(`/broadcast/get/${id}`);
        const data = await res.json();

        if (!data?.success) throw new Error(data?.error || "Failed to load broadcast");

        const b = data.broadcast;

        const channel =
          b.channel ??
          (b.channelId
            ? { id: String(b.channelId), label: String(b.channelLabel ?? b.channelId) }
            : null);

        const numbers = Array.isArray(b.recipients) ? b.recipients : [];

        update({
          name: b.name ?? "",
          message: b.message ?? "",
          templates: b.templates ?? [],
          attachments: b.attachments ?? [],
          scheduleAt: b.scheduledAt ?? null,
          settings: b.settings ?? {},

          // ✅ hydrate channel
          channel,

          // ✅ IMPORTANT: Step 1 supports "contacts", not "manual"
          audience: {
            mode: "contacts",
            numbers,
          },
          audienceCount: numbers.length,
        });

        setStep(1);
      } catch (e: any) {
        setError(e?.message || "Failed to load broadcast");
      }
    }

    load();
  }, [id, update, setStep]);

  if (error) {
    return (
      <div className="p-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return <BroadcastFlow />;
}

export default function Page() {
  const params = useParams<{ id: string }>();
  if (!params?.id) return null;

  return (
    <BroadcastProvider>
      <EditBootstrap id={params.id} />
    </BroadcastProvider>
  );
}
