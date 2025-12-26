"use client";

import { useBroadcast } from "./BroadcastContext";
import BroadcastStepper from "./BroadcastStepper";
import StepAudience from "./steps/StepAudience";
import StepMessage from "./steps/StepMessage";
import StepSchedule from "./steps/StepSchedule";

export default function BroadcastPage() {
  const { step } = useBroadcast();

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-8">
      <BroadcastStepper />

      {step === 1 && <StepAudience />}
      {step === 2 && <StepMessage />}
      {step === 3 && <StepSchedule />}
    </div>
  );
}
