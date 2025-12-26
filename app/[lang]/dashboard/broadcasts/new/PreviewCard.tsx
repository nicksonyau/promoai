"use client";

import { useBroadcast } from "./BroadcastContext";

export default function PreviewCard() {
  const { draft } = useBroadcast();

  return (
    <div className="sticky top-6 rounded-2xl border bg-white shadow-sm">
      <div className="border-b p-4">
        <div className="text-sm font-semibold text-gray-900">
          Live Preview
        </div>
        <div className="text-xs text-gray-500">
          Draft summary updates as you build
        </div>
      </div>

      <div className="space-y-4 p-4 text-sm">
        {/* Name */}
        <div>
          <div className="text-xs text-gray-500">Name</div>
          <div className="font-medium text-gray-900">
            {draft.name?.trim() || "Untitled broadcast"}
          </div>
        </div>

        {/* Channel */}
        <div>
          <div className="text-xs text-gray-500">Channel</div>
          <div className="font-medium text-gray-900">
            {draft.channel?.label || "Not selected"}
          </div>
        </div>

        {/* Audience */}
        <div>
          <div className="text-xs text-gray-500">Audience</div>
          <div className="font-medium text-gray-900">
            {draft.audienceCount ?? 0} contacts
          </div>
        </div>

        {/* Message */}
        <div>
          <div className="text-xs text-gray-500">Message</div>
          <div className="whitespace-pre-wrap text-gray-900">
            {draft.message?.trim()
              ? draft.message.slice(0, 160) +
                (draft.message.length > 160 ? "…" : "")
              : "No message yet"}
          </div>
        </div>

        {/* Attachments */}
        {draft.attachments.length > 0 && (
          <div>
            <div className="text-xs text-gray-500">Attachments</div>
            <ul className="list-disc pl-4">
              {draft.attachments.map((a) => (
                <li key={a.id}>{a.name || a.kind}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Schedule */}
        <div>
          <div className="text-xs text-gray-500">Schedule</div>
          <div className="font-medium text-gray-900">
            {draft.scheduleAt || "Not scheduled"}
          </div>
        </div>

        {/* Daily limit */}
        <div className="pt-2 text-xs text-gray-500">
          Daily limit: {draft.settings.dailyLimit} messages
        </div>
      </div>
    </div>
  );
}
