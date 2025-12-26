"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "@/lib/api";

export default function BroadcastAudiencePage() {
  const { id } = useParams();
  const router = useRouter();
  const [phones, setPhones] = useState("");

  async function continueNext() {
    await apiFetch("/broadcast/schedule", {
      method: "POST",
      body: JSON.stringify({
        broadcastId: id,
        phones: phones.split("\n").map(p => p.trim()).filter(Boolean)
      })
    });
    router.push(`/en/dashboard/broadcasts/${id}/review`);
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="text-sm text-gray-500">Step 2 of 3 · Audience</div>
      <h1 className="text-2xl font-semibold">Select Audience</h1>

      <textarea
        rows={6}
        className="w-full border rounded p-2"
        placeholder="+60123456789"
        value={phones}
        onChange={e => setPhones(e.target.value)}
      />

      <button
        onClick={continueNext}
        className="bg-purple-600 text-white px-4 py-2 rounded-lg"
      >
        Continue →
      </button>
    </div>
  );
}
