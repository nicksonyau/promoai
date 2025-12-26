"use client";

import React, { useMemo } from "react";
import { useBroadcast } from "./BroadcastContext";

function stepError(draft: any, step: number): string | null {
  const name = (draft?.name ?? "").trim();

  if (step === 1) {
    if (!name) return "Broadcast name is required.";
    if (!draft?.channel) return "Please select a channel.";

    const mode = draft?.audience?.mode ?? "all";

    // Only allow modes that are actually implemented.
    if (!["all", "contacts"].includes(mode)) {
      return "Audience mode not available yet. Please use All or Contacts.";
    }

    if (mode === "contacts") {
      const n =
        typeof draft?.audienceCount === "number" ? draft.audienceCount : 0;
      if (n <= 0) return "Please select at least 1 contact.";
    }

    return null;
  }

  if (step === 2) {
    const msg = (draft?.message ?? "").trim();
    const hasTemplates = (draft?.templates?.length ?? 0) > 0;
    if (!msg && !hasTemplates) return "Add a message or pick at least 1 template.";
    return null;
  }

  return null;
}

export default function ActionBar() {
  const { step, prev, next, draft } = useBroadcast();

  const err = useMemo(() => stepError(draft, step), [draft, step]);
  const canNext = !err;

  const nextLabel = step === 3 ? "Review" : step === 4 ? "Done" : "Continue";

  return (
    <div className="mt-5 flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-black/5">
      <button
        type="button"
        onClick={prev}
        disabled={step <= 1}
        className={[
          "rounded-xl px-4 py-2 text-sm font-medium",
          step <= 1
            ? "cursor-not-allowed bg-gray-100 text-gray-400"
            : "bg-gray-100 text-gray-900 hover:bg-gray-200",
        ].join(" ")}
      >
        Back
      </button>

      <div className="flex items-center gap-3">
        {err ? (
          <div className="text-sm text-red-600">{err}</div>
        ) : (
          <div className="text-xs text-gray-500"> </div>
        )}

        <button
          type="button"
          onClick={next}
          disabled={!canNext || step >= 4}
          className={[
            "rounded-xl px-5 py-2 text-sm font-semibold text-white",
            !canNext || step >= 4
              ? "cursor-not-allowed bg-purple-300"
              : "bg-purple-600 hover:bg-purple-700",
          ].join(" ")}
        >
          {nextLabel}
        </button>
      </div>
    </div>
  );
}
