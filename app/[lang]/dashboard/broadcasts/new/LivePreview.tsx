"use client";

import { useBroadcast } from "./BroadcastContext";

function labelOr(value?: string | null, fallback = "—") {
  const v = (value ?? "").trim();
  return v ? v : fallback;
}

function formatSchedule(value: any) {
  if (!value) return "Not scheduled";
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  return "Scheduled";
}

export default function LivePreview() {
  const { draft } = useBroadcast();

  const name = labelOr(draft.name, "Untitled broadcast");
  const channel = draft.channel?.label ?? "Not selected";
  const audienceCount =
    typeof draft.audienceCount === "number" ? draft.audienceCount : 0;

  const hasTemplates = (draft.templates?.length ?? 0) > 0;
  const message =
    (draft.message ?? "").trim() ||
    (hasTemplates ? `${draft.templates.length} template(s) selected` : "No message yet");

  const schedule = formatSchedule(draft.scheduleAt);
  const dailyLimit = draft.settings?.dailyLimit ?? 0;

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <div className="mb-4">
        <div className="text-sm font-semibold text-gray-900">Live Preview</div>
        <div className=" giving text-xs text-gray-500">
          Draft summary updates as you build
        </div>
      </div>

      <div className="space-y-3 text-sm">
        <div>
          <div className="text-xs text-gray-500">Name</div>
          <div className="font-medium text-gray-900">{name}</div>
        </div>

        <div>
          <div className="text-xs text-gray-500">Channel</div>
          <div className="font-medium text-gray-900">{channel}</div>
        </div>

        <div>
          <div className="text-xs text-gray-500">Audience</div>
          <div className="font-medium text-gray-900">{audienceCount} contacts</div>
        </div>

        <div>
          <div className="text-xs text-gray-500">Message</div>
          <div className="font-medium text-gray-900">{message}</div>
        </div>

        <div>
          <div className="text-xs text-gray-500">Schedule</div>
          <div className="font-medium text-gray-900">{schedule}</div>
        </div>

        <div className="pt-2 text-xs text-gray-500">
          Daily limit: <span className="text-gray-900">{dailyLimit}</span> messages
        </div>
      </div>
    </div>
  );
}
