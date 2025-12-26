import { BroadcastDraft, BroadcastStep } from "../types";

export function validateStep(step: BroadcastStep, d: BroadcastDraft): { ok: boolean; message?: string } {
  if (step === 1) {
    if (!d.name.trim()) return { ok: false, message: "Broadcast name is required." };
    if (!d.channel) return { ok: false, message: "Select a channel/device first." };
    if (d.channel.type === "official") return { ok: false, message: "Official channel is coming soon. Please use Unofficial for now." };
    if (!d.audience) return { ok: false, message: "Choose an audience." };
    return { ok: true };
  }

  if (step === 2) {
    const hasTemplates = d.templates.length > 0;
    const hasMessage = d.message.trim().length > 0;
    if (!hasTemplates && !hasMessage) return { ok: false, message: "Pick template(s) or type a message." };
    return { ok: true };
  }

  if (step === 3) {
    // schedule is optional; rules are always valid defaults
    return { ok: true };
  }

  if (step === 4) {
    return { ok: true };
  }

  return { ok: true };
}
