"use client";

import { useBroadcast } from "../BroadcastContext";

export default function StepMessage() {
  const { draft, update, next, prev } = useBroadcast();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Message</h2>

      <textarea
        className="w-full border rounded p-3 h-36"
        placeholder="Write your message..."
        value={draft.message}
        onChange={e => update({ message: e.target.value })}
      />

      <div className="flex justify-between">
        <button onClick={prev}>← Back</button>
        <button
          className="bg-purple-600 text-white px-6 py-2 rounded"
          onClick={next}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
