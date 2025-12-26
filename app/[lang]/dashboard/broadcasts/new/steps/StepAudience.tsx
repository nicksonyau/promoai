"use client";

import { useBroadcast } from "../BroadcastContext";

export default function StepAudience() {
  const { draft, update, next } = useBroadcast();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Account & Audience</h2>

      <input
        className="w-full border rounded px-3 py-2"
        placeholder="Campaign name"
        value={draft.name}
        onChange={e => update({ name: e.target.value })}
      />

      <button
        className="bg-purple-600 text-white px-6 py-2 rounded"
        onClick={() => {
          update({ audienceCount: 320 }); // placeholder
          next();
        }}
      >
        Continue →
      </button>
    </div>
  );
}
