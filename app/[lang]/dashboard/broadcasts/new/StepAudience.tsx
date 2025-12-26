"use client";

import { useEffect, useState } from "react";
import { useBroadcast } from "../BroadcastContext";

const PLAN_LIMIT = 500;

function normalizeNumber(n: string) {
  let x = n.replace(/\D/g, "");
  if (x.startsWith("0")) x = "6" + x;
  if (!x.startsWith("60")) x = "60" + x;
  return "+" + x;
}

export default function StepAudience() {
  const { draft, update, next } = useBroadcast();
  const [raw, setRaw] = useState(draft.audienceRaw || "");
  const [valid, setValid] = useState<string[]>([]);
  const [invalid, setInvalid] = useState<string[]>([]);

  useEffect(() => {
    const parts = raw.split(/[\n, ]+/).filter(Boolean);
    const v: string[] = [];
    const iv: string[] = [];

    parts.forEach(p => {
      try {
        const n = normalizeNumber(p);
        if (n.length >= 10) v.push(n);
        else iv.push(p);
      } catch {
        iv.push(p);
      }
    });

    const unique = Array.from(new Set(v));

    setValid(unique);
    setInvalid(iv);

    update({
      audienceRaw: raw,
      audienceNumbers: unique,
      audienceCount: unique.length,
    });
  }, [raw]);

  const exceeded = valid.length > PLAN_LIMIT;

  return (
    <div className="bg-white rounded-xl border p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Select Audience</h2>
        <p className="text-sm text-gray-500">
          Paste WhatsApp numbers separated by comma or new line.
        </p>
      </div>

      <textarea
        rows={6}
        value={raw}
        onChange={e => setRaw(e.target.value)}
        placeholder="+60123456789, +60129876543"
        className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
      />

      <div className="flex justify-between text-sm">
        <div>
          <span className="text-green-600 font-medium">
            ✔ {valid.length} valid
          </span>
          {invalid.length > 0 && (
            <span className="ml-3 text-red-500">
              ⚠ {invalid.length} invalid
            </span>
          )}
        </div>

        <div className={exceeded ? "text-red-600" : "text-gray-600"}>
          {valid.length} / {PLAN_LIMIT} recipients
        </div>
      </div>

      {exceeded && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded text-sm">
          You have exceeded your plan limit. Please reduce recipients or upgrade.
        </div>
      )}

      <div className="flex justify-end">
        <button
          disabled={valid.length === 0 || exceeded}
          onClick={next}
          className="bg-purple-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
