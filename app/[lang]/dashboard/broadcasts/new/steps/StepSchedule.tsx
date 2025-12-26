"use client";

import { useBroadcast } from "../BroadcastContext";

/* ----------------------------------
   SPEED PRESETS (UNOFFICIAL SAFE)
----------------------------------- */

type SpeedPreset = "safe" | "normal";

const SPEED_PRESETS: Record<
  SpeedPreset,
  { label: string; desc: string; min: number; max: number }
> = {
  safe: {
    label: "Safe (Recommended)",
    desc: "Lowest risk. Best for new or warming numbers.",
    min: 120,
    max: 600,
  },
  normal: {
    label: "Normal",
    desc: "Balanced speed. Use only for healthy numbers.",
    min: 30,
    max: 120,
  },
};

export default function StepSchedule() {
  const { draft, update, setSettings, prev, next } = useBroadcast();

  const speed = (draft.settings.speed || "safe") as SpeedPreset;
  const hours = draft.settings.broadcastHours;

  function setSpeed(preset: SpeedPreset) {
    const p = SPEED_PRESETS[preset];
    setSettings({
      speed: preset,
      delayMin: p.min,
      delayMax: p.max,
    });
  }

  /** 
   * ✅ IMPORTANT
   * ❌ DO NOT call /broadcast/create here
   * This step only configures schedule & behavior
   */
  function onContinue() {
    console.log("[broadcast][schedule] draft snapshot", {
      name: draft.name,
      recipients: draft.audienceNumbers,
      scheduleAt: draft.scheduleAt,
      settings: draft.settings,
    });

    next(); // → StepReviewConfirm
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="text-xl font-semibold text-gray-900">
          Schedule & Send
        </div>
        <div className="text-sm text-gray-600">
          Broadcasts are queued safely. Messages are sent gradually to reduce
          risk on unofficial WhatsApp numbers.
        </div>
      </div>

      {/* Schedule */}
      <Card title="Schedule">
        <div className="text-xs text-gray-500 mb-2">
          Leave empty to queue immediately after confirmation.
        </div>
        <input
          type="datetime-local"
          value={draft.scheduleAt ?? ""}
          onChange={(e) => update({ scheduleAt: e.target.value || null })}
          className="w-full rounded-xl bg-gray-50 px-3 py-2 text-sm ring-1 ring-black/5 focus:ring-2 focus:ring-purple-500"
        />
      </Card>

      {/* Speed */}
      <Card title="Sending speed">
        <div className="space-y-2">
          {(Object.keys(SPEED_PRESETS) as SpeedPreset[]).map((k) => {
            const p = SPEED_PRESETS[k];
            const active = speed === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setSpeed(k)}
                className={[
                  "w-full text-left rounded-xl px-3 py-3 ring-1 transition",
                  active
                    ? "bg-purple-50 ring-purple-300"
                    : "bg-white ring-black/5 hover:bg-gray-50",
                ].join(" ")}
              >
                <div className="text-sm font-medium text-gray-900">
                  {p.label}
                </div>
                <div className="text-xs text-gray-500">
                  {p.desc} · {p.min}–{p.max}s delay
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Broadcast hours */}
      <Card title="Broadcast hours">
        <div className="flex flex-wrap gap-2 mb-3">
          <Chip
            active={hours === "24_7"}
            onClick={() => setSettings({ broadcastHours: "24_7" })}
          >
            Send 24/7
          </Chip>
          <Chip
            active={hours !== "24_7"}
            onClick={() =>
              setSettings({
                broadcastHours: { startHHmm: "09:00", endHHmm: "21:00" },
              })
            }
          >
            Custom window
          </Chip>
        </div>

        {hours !== "24_7" && (
          <div className="grid grid-cols-2 gap-3">
            <input
              value={hours.startHHmm}
              onChange={(e) =>
                setSettings({
                  broadcastHours: {
                    ...hours,
                    startHHmm: e.target.value,
                  },
                })
              }
              className="rounded-xl bg-gray-50 px-3 py-2 text-sm ring-1 ring-black/5"
            />
            <input
              value={hours.endHHmm}
              onChange={(e) =>
                setSettings({
                  broadcastHours: {
                    ...hours,
                    endHHmm: e.target.value,
                  },
                })
              }
              className="rounded-xl bg-gray-50 px-3 py-2 text-sm ring-1 ring-black/5"
            />
          </div>
        )}
      </Card>

      {/* Behavior */}
      <Card title="Behavior">
        <Toggle
          label="Simulate human behaviour"
          desc="Typing indicator and read receipts."
          value={draft.settings.simulateHuman}
          onChange={(v) => setSettings({ simulateHuman: v })}
        />

        <div className="mt-3 rounded-xl bg-gray-50 p-3 text-sm">
          <div className="font-medium">Daily limit</div>
          <div className="text-xs text-gray-600">
            Based on channel score:{" "}
            <span className="font-semibold">
              {draft.settings.dailyLimit}
            </span>{" "}
            messages/day
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={prev}
          className="rounded-xl bg-gray-100 px-6 py-2 text-sm"
        >
          ← Back
        </button>

        <button
          type="button"
          onClick={onContinue}
          className="rounded-xl bg-emerald-600 px-6 py-2 text-sm text-white hover:bg-emerald-700"
        >
          Review & Confirm →
        </button>
      </div>
    </div>
  );
}

/* ---------- UI helpers ---------- */

function Card({ title, children }: any) {
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5 space-y-3">
      <div className="text-sm font-semibold text-gray-900">{title}</div>
      {children}
    </div>
  );
}

function Chip({ active, onClick, children }: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full px-3 py-1.5 text-sm ring-1 transition",
        active
          ? "bg-purple-100 ring-purple-300 text-purple-700"
          : "bg-white ring-black/5 text-gray-700 hover:bg-gray-50",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function Toggle({ label, desc, value, onChange }: any) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-gray-50 p-3">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-gray-500">{desc}</div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={[
          "h-7 w-12 rounded-full relative transition",
          value ? "bg-emerald-500" : "bg-gray-300",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-0.5 h-6 w-6 rounded-full bg-white transition",
            value ? "left-6" : "left-0.5",
          ].join(" ")}
        />
      </button>
    </div>
  );
}
