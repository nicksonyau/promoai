"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useBroadcast } from "../../new/BroadcastContext";
import BroadcastFlow from "../../new/BroadcastFlow";

function EditBootstrap({ id }: { id: string }) {
  const { update, setStep } = useBroadcast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🔒 guard to prevent double execution
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    async function load() {
      try {
        const res = await apiFetch(`/broadcast/get/${id}`);
        const data = await res.json();

        if (!data?.success) {
          throw new Error(data?.error || "Failed to load broadcast");
        }

        const b = data.broadcast;

        update({
          name: b.name ?? "",
          message: b.message ?? "",
          templates: b.templates ?? [],
          attachments: b.attachments ?? [],
          scheduleAt: b.scheduledAt ?? null,
          settings: b.settings ?? {},
          audience: {
            mode: "manual",
            numbers: b.recipients ?? [],
          },
          audienceCount: Array.isArray(b.recipients)
            ? b.recipients.length
            : 0,
        });

        setStep(1);
      } catch (e: any) {
        setError(e.message || "Failed to load broadcast");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id, update, setStep]);

  if (loading) {
    return <div className="p-8 text-gray-500">Loading…</div>;
  }

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

export default EditBootstrap;
