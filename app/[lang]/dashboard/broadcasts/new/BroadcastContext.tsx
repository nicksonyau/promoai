"use client";

import React, {
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";

import {
  AudienceQuery,
  BroadcastDraft,
  BroadcastStep,
  BroadcastSettings,
  ChannelRef,
  TemplatePick,
  Attachment,
} from "./types";

import { computeDailyLimit } from "./_lib/limits";

/* =========================
   Context Types
========================= */

type BroadcastCtx = {
  step: BroadcastStep;
  draft: BroadcastDraft;

  setStep: (s: BroadcastStep) => void;
  next: () => void;
  prev: () => void;

  update: (patch: Partial<BroadcastDraft>) => void;

  // Convenience updaters
  setChannel: (ch?: ChannelRef) => void;
  setAudience: (aud: AudienceQuery) => void;
  setAudienceCount: (count?: number) => void;

  addTemplate: (t: TemplatePick) => void;
  updateTemplate: (templateId: string, patch: Partial<TemplatePick>) => void;
  removeTemplate: (templateId: string) => void;

  addAttachment: (a: Attachment) => void;
  removeAttachment: (id: string) => void;
  replaceAttachments: (items: Attachment[]) => void;

  setSettings: (patch: Partial<BroadcastSettings>) => void;
};

const BroadcastContext = createContext<BroadcastCtx | null>(null);

/* =========================
   Provider
========================= */

export function BroadcastProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [step, setStep] = useState<BroadcastStep>(1);

  const [draft, setDraft] = useState<BroadcastDraft>({
    name: "",
    channel: undefined,

    audience: { mode: "all" },
    audienceCount: undefined,

    templates: [],
    message: "",
    attachments: [],

    scheduleAt: null,

    settings: {
      speed: "normal",
      broadcastHours: "24_7",
      simulateHuman: true,
      stopIfReply: false,
      dailyLimit: 50,
    },
  });

  /* =========================
     Memoized API (FIXED)
     IMPORTANT: depends on `draft`
  ========================= */

  const api = useMemo<BroadcastCtx>(() => {
    /* ---------- Core updater ---------- */
    const update = (patch: Partial<BroadcastDraft>) => {
      setDraft((d) => ({ ...d, ...patch }));
    };

    /* ---------- Channel ---------- */
    const setChannel = (ch?: ChannelRef) => {
      setDraft((d) => {
        const score = ch?.score ?? 0;
        const dailyLimit = computeDailyLimit(score);

        return {
          ...d,
          channel: ch,
          settings: {
            ...d.settings,
            dailyLimit,
          },
        };
      });
    };

    /* ---------- Audience ---------- */
    const setAudience = (aud: AudienceQuery) => {
      setDraft((d) => ({ ...d, audience: aud }));
    };

    const setAudienceCount = (count?: number) => {
      setDraft((d) => ({ ...d, audienceCount: count }));
    };

    /* ---------- Templates ---------- */
    const addTemplate = (t: TemplatePick) => {
      setDraft((d) => {
        if (d.templates.some((x) => x.templateId === t.templateId)) {
          return d;
        }
        return { ...d, templates: [...d.templates, t] };
      });
    };

    const updateTemplate = (
      templateId: string,
      patch: Partial<TemplatePick>
    ) => {
      setDraft((d) => ({
        ...d,
        templates: d.templates.map((x) =>
          x.templateId === templateId ? { ...x, ...patch } : x
        ),
      }));
    };

    const removeTemplate = (templateId: string) => {
      setDraft((d) => ({
        ...d,
        templates: d.templates.filter(
          (x) => x.templateId !== templateId
        ),
      }));
    };

    /* ---------- Attachments ---------- */
    const addAttachment = (a: Attachment) => {
      setDraft((d) => ({
        ...d,
        attachments: [...d.attachments, a],
      }));
    };

    const removeAttachment = (id: string) => {
      setDraft((d) => ({
        ...d,
        attachments: d.attachments.filter((x) => x.id !== id),
      }));
    };

    const replaceAttachments = (items: Attachment[]) => {
      setDraft((d) => ({ ...d, attachments: items }));
    };

    /* ---------- Settings ---------- */
    const setSettings = (patch: Partial<BroadcastSettings>) => {
      setDraft((d) => ({
        ...d,
        settings: { ...d.settings, ...patch },
      }));
    };

    return {
      step,
      draft,

      setStep,
      next: () =>
        setStep((s) => Math.min(4, s + 1) as BroadcastStep),
      prev: () =>
        setStep((s) => Math.max(1, s - 1) as BroadcastStep),

      update,

      setChannel,
      setAudience,
      setAudienceCount,

      addTemplate,
      updateTemplate,
      removeTemplate,

      addAttachment,
      removeAttachment,
      replaceAttachments,

      setSettings,
    };
  }, [step, draft]); // ✅ CRITICAL FIX

  return (
    <BroadcastContext.Provider value={api}>
      {children}
    </BroadcastContext.Provider>
  );
}

/* =========================
   Hook
========================= */

export function useBroadcast() {
  const ctx = useContext(BroadcastContext);
  if (!ctx) {
    throw new Error(
      "useBroadcast must be used inside <BroadcastProvider>"
    );
  }
  return ctx;
}
