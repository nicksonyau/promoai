"use client";

import { useBroadcast } from "./BroadcastContext";
import {
  Users,
  MessageSquareText,
  CalendarClock,
  CheckCircle2,
} from "lucide-react";

const STEPS = [
  { n: 1, label: "Channel & Audience", icon: Users },
  { n: 2, label: "Message", icon: MessageSquareText },
  { n: 3, label: "Schedule & Rules", icon: CalendarClock },
  { n: 4, label: "Review", icon: CheckCircle2 },
] as const;

export default function BroadcastStepper() {
  const { step } = useBroadcast();

  return (
    <div className="bg-transparent">
      <div className="flex items-center gap-4">
        {STEPS.map((s, idx) => {
          const Icon = s.icon;
          const isActive = step === s.n;
          const isDone = step > s.n;

          return (
            <div key={s.n} className="flex items-center flex-1 min-w-0">
              {/* Icon */}
              <div
                className={[
                  "flex h-9 w-9 items-center justify-center rounded-full transition-all",
                  isDone ? "bg-emerald-500 text-white" : "",
                  isActive
                    ? "bg-purple-600 text-white ring-4 ring-purple-100"
                    : "",
                  !isDone && !isActive
                    ? "bg-gray-100 text-gray-400"
                    : "",
                ].join(" ")}
              >
                <Icon className="h-4 w-4" />
              </div>

              {/* Label */}
              <div className="ml-3 min-w-0">
                <div
                  className={[
                    "text-sm font-medium truncate",
                    isActive ? "text-gray-900" : "text-gray-500",
                  ].join(" ")}
                >
                  {s.label}
                </div>
                <div className="text-xs text-gray-400">Step {s.n}</div>
              </div>

              {/* Connector */}
              {idx !== STEPS.length - 1 && (
                <div
                  className={[
                    "mx-4 hidden md:block h-px flex-1",
                    isDone ? "bg-emerald-300" : "bg-gray-200",
                  ].join(" ")}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
