"use client";

import { useBroadcast } from "../BroadcastContext";

export default function StepScheduleRules() {
  const { draft, update, setSettings } = useBroadcast();

  const hours = draft.settings.broadcastHours;

  return (
    <div className="space-y-6">
      <div>
        <div className="text-lg font-semibold text-gray-900">Schedule & Rules</div>
        <div className="text-sm text-gray-600">
          Control sending speed, hours, and behavior. Daily limit derived from channel score.
        </div>
      </div>

      {/* Schedule */}
      <div className="rounded-xl border p-4 space-y-3">
        <div>
          <div className="text-sm font-medium text-gray-900">Schedule</div>
          <div className="text-xs text-gray-500">Leave empty to send immediately after confirm.</div>
        </div>
        <input
          type="datetime-local"
          value={draft.scheduleAt ?? ""}
          onChange={(e) => update({ scheduleAt: e.target.value || null })}
          className="rounded-lg border px-3 py-2 text-sm"
        />
      </div>

      {/* Speed */}
      <div className="rounded-xl border p-4 space-y-3">
        <div className="text-sm font-medium text-gray-900">Sending speed</div>
        <select
          value={draft.settings.speed}
          onChange={(e) => setSettings({ speed: e.target.value as any })}
          className="rounded-lg border px-3 py-2 text-sm"
        >
          <option value="slow">Slow (safer)</option>
          <option value="normal">Normal</option>
          <option value="fast">Fast (riskier)</option>
        </select>
        <div className="text-xs text-gray-500">
          Note: backend should enforce device limits and pacing.
        </div>
      </div>

      {/* Hours */}
      <div className="rounded-xl border p-4 space-y-3">
        <div className="text-sm font-medium text-gray-900">Broadcast hours</div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSettings({ broadcastHours: "24_7" })}
            className={[
              "rounded-full border px-3 py-1.5 text-sm",
              hours === "24_7" ? "border-purple-300 bg-purple-50 text-purple-700" : "bg-white text-gray-700",
            ].join(" ")}
          >
            Send 24/7
          </button>
          <button
            type="button"
            onClick={() => setSettings({ broadcastHours: { startHHmm: "09:00", endHHmm: "21:00" } })}
            className={[
              "rounded-full border px-3 py-1.5 text-sm",
              hours !== "24_7" ? "border-purple-300 bg-purple-50 text-purple-700" : "bg-white text-gray-700",
            ].join(" ")}
          >
            Custom window
          </button>
        </div>

        {hours !== "24_7" && (
          <div className="grid gap-2 md:grid-cols-2">
            <div>
              <div className="text-xs text-gray-500 mb-1">Start</div>
              <input
                value={hours.startHHmm}
                onChange={(e) =>
                  setSettings({
                    broadcastHours: { ...hours, startHHmm: e.target.value },
                  })
                }
                className="w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="09:00"
              />
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">End</div>
              <input
                value={hours.endHHmm}
                onChange={(e) =>
                  setSettings({
                    broadcastHours: { ...hours, endHHmm: e.target.value },
                  })
                }
                className="w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="21:00"
              />
            </div>
          </div>
        )}
      </div>

      {/* Behavior */}
      <div className="rounded-xl border p-4 space-y-3">
        <div className="text-sm font-medium text-gray-900">Behavior</div>

        <ToggleRow
          label="Simulate human behaviour"
          desc="Display typing / mark chats as read when sending."
          value={draft.settings.simulateHuman}
          onChange={(v) => setSettings({ simulateHuman: v })}
        />
        <ToggleRow
          label="Cancel following messages if client responds"
          desc="Stop scheduled follow-ups when a contact replies."
          value={draft.settings.stopIfReply}
          onChange={(v) => setSettings({ stopIfReply: v })}
        />

        <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
          <div className="font-medium">Daily limit</div>
          <div className="text-xs text-gray-600">
            Based on device score: <span className="font-semibold">{draft.settings.dailyLimit}</span> messages/day
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Backend must enforce this using a quota ledger (Durable Object / DB).
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  desc,
  value,
  onChange,
}: {
  label: string;
  desc: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
      <div className="min-w-0">
        <div className="text-sm font-medium text-gray-900">{label}</div>
        <div className="text-xs text-gray-500">{desc}</div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={[
          "h-7 w-12 rounded-full border transition relative",
          value ? "bg-emerald-100 border-emerald-200" : "bg-gray-100 border-gray-200",
        ].join(" ")}
        aria-pressed={value}
      >
        <span
          className={[
            "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition",
            value ? "left-6" : "left-0.5",
          ].join(" ")}
        />
      </button>
    </div>
  );
}
