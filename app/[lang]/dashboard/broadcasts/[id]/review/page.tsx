"use client";

import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

export default function BroadcastReviewPage() {
  const { id } = useParams();
  const router = useRouter();

  async function start() {
    await apiFetch("/broadcast/start", {
      method: "POST",
      body: JSON.stringify({ broadcastId: id })
    });
    router.push("/en/dashboard/broadcasts");
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="text-sm text-gray-500">Step 3 of 3 · Review</div>
      <h1 className="text-2xl font-semibold">Review & Start</h1>

      <div className="border rounded p-4 text-sm space-y-2">
        <div>✔ Entry template selected</div>
        <div>✔ Audience validated</div>
        <div>✔ Safe sending mode enabled</div>
      </div>

      <button
        onClick={start}
        className="bg-green-600 text-white px-4 py-2 rounded-lg"
      >
        Start Broadcast
      </button>
    </div>
  );
}
