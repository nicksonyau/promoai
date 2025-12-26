"use client";

import { useBroadcast } from "../BroadcastContext";

export default function StepSchedule() {
  const { draft, update, prev } = useBroadcast();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Schedule & Send</h2>

      <div className="flex gap-4">
        <input
          type="number"
          className="border rounded px-3 py-2 w-28"
          value={draft.delayMin}
          onChange={e => update({ delayMin: Number(e.target.value) })}
        />
        <input
          type="number"
          className="border rounded px-3 py-2 w-28"
          value={draft.delayMax}
          onChange={e => update({ delayMax: Number(e.target.value) })}
        />
      </div>

      <div className="flex justify-between">
        <button onClick={prev}>← Back</button>
        <button className="bg-green-600 text-white px-6 py-2 rounded">
          Schedule Broadcast
        </button>
      </div>
    </div>
  );
}
