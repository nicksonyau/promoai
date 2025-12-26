"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export function useInitSubscription() {
  const [ready, setReady] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [requiresActivation, setRequiresActivation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await apiFetch("/subscription/get");
        const data = await res.json();

        if (cancelled) return;

        if (!res.ok || !data?.success) {
          setError(data?.error || "Subscription check failed");
        } else {
          setSubscription(data.subscription);
          setRequiresActivation(!!data.requiresActivation);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Unknown error");
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { ready, subscription, requiresActivation, error };
}
