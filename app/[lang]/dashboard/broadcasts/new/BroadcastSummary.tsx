"use client";

import { useBroadcast } from "./BroadcastContext";

export default function BroadcastSummary() {
  const { draft } = useBroadcast();

  return (
    <div className="bg-white border rounded-xl p-4 space-y-3 sticky top-6">
      <h3 className="font-semibold">Campaign Summary</h3>

      <div className="text-sm">
        <b>Name:</b> {draft.name || "—"}
      </div>

      <div className="text-sm">
        <b>Audience:</b> {draft.audienceCount}
      </div>

      <div className="text-sm">
        <b>Delay:</b> {draft.delayMin}s – {draft.delayMax}s
      </div>

      <div className="text-xs text-orange-600">
        ⚠ Human-like sending enabled
      </div>
    </div>
  );
}
