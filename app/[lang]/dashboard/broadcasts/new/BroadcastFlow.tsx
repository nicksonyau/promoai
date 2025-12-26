"use client";

import BroadcastStepper from "./BroadcastStepper";
import StepContainer from "./StepContainer";
import ActionBar from "./ActionBar";
import LivePreview from "./LivePreview";
import { useBroadcast } from "./BroadcastContext";

import {
  StepChannelAudience,
  StepMessage,
  StepSchedule,
  StepReviewConfirm,
} from "./steps";

export default function BroadcastFlow() {
  const { step } = useBroadcast();

  return (
    <div className="space-y-6">
      <BroadcastStepper />

      <div className="grid grid-cols-12 gap-6">
        {/* Main form */}
        <div className={step === 4 ? "col-span-12 lg:col-span-8" : "col-span-12"}>
          <StepContainer>
            {step === 1 && <StepChannelAudience />}
            {step === 2 && <StepMessage />}
            {step === 3 && <StepSchedule />}
            {step === 4 && <StepReviewConfirm />}
          </StepContainer>

          <ActionBar />
        </div>

        {/* ✅ Live Preview — ONLY show on Step 4 */}
        {step === 4 && (
          <aside className="col-span-12 lg:col-span-4">
            <div className="lg:sticky lg:top-6">
              <LivePreview />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
