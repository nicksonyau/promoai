"use client";

import { useState } from "react";
import { useBroadcast } from "../BroadcastContext";
import { apiFetch } from "@/lib/api";
import { validateStep } from "./_validate";
import { useParams, usePathname } from "next/navigation";

type Resp = { success: boolean; id?: string; error?: string };

export default function StepReviewConfirm() {
  const { draft } = useBroadcast();

  const params = useParams() as any;
  const pathname = usePathname();

  const editId = params?.id as string | undefined;
  const isEdit =
    typeof editId === "string" &&
    editId.length > 0 &&
    pathname.includes("/broadcasts/") &&
    pathname.includes("/edit");

  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const recipients = Array.isArray(draft.audience?.numbers)
    ? draft.audience!.numbers
    : [];

  async function save() {
    setResult(null);

    const v1 = validateStep(1, draft);
    const v2 = validateStep(2, draft);
    const v3 = validateStep(3, draft);

    if (!v1.ok || !v2.ok || !v3.ok) {
      setResult("❌ Fix errors before save");
      return;
    }

    if (!recipients.length) {
      setResult("❌ No recipients selected");
      return;
    }

    if (!draft.channel?.id) {
      setResult("❌ Please select a channel");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: draft.name ?? "",
        recipients,
        templates: draft.templates ?? [],
        message: draft.message ?? "",
        attachments: draft.attachments ?? [],
        settings: draft.settings ?? {},
        scheduleAt: draft.scheduleAt ?? null,

        // ✅ channel persistence
        channel: draft.channel ?? null,
        channelId: draft.channel?.id ?? null,
        channelLabel: draft.channel?.label ?? null,
      };

      const url = isEdit ? `/broadcast/update/${editId}` : "/broadcast/create";

      console.log("[UI] broadcast save", { url, payload });

      const res = await apiFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json().catch(() => null)) as Resp | null;

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || `Save failed (HTTP ${res.status})`);
      }

      const id = data.id || editId;
      setResult(isEdit ? `✅ Broadcast updated: ${id}` : `✅ Broadcast created: ${id}`);
    } catch (e: any) {
      setResult(`❌ Save failed: ${e?.message || "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-lg font-semibold">Review & Confirm</div>
        <div className="text-sm text-gray-500">Double-check before sending.</div>
      </div>

      <div className="rounded-xl border p-4 space-y-2">
        <Row k="Name" v={draft.name || "—"} />
        <Row k="Channel" v={draft.channel?.label || "—"} />
        <Row k="Audience" v={String(recipients.length)} />
        <Row k="Templates" v={String((draft.templates ?? []).length)} />
        <Row k="Attachments" v={String((draft.attachments ?? []).length)} />
        <Row k="Schedule" v={draft.scheduleAt || "Immediate"} />
      </div>

      <div className="rounded-xl border p-4 space-y-3">
        <div className="text-sm font-semibold">{isEdit ? "Update Broadcast" : "Create Broadcast"}</div>

        <button
          onClick={save}
          disabled={saving}
          className="w-full rounded bg-purple-600 px-3 py-2 text-sm text-white disabled:opacity-50"
        >
          {saving ? "Saving..." : isEdit ? "Update Broadcast" : "Create Broadcast"}
        </button>

        <div className="text-xs text-gray-500">
          Will send <span className="font-mono">{recipients.length}</span> recipients to{" "}
          <span className="font-mono">{isEdit ? `/broadcast/update/${editId}` : "/broadcast/create"}</span>
        </div>
      </div>

      {result && (
        <pre className="rounded-xl bg-gray-50 border p-4 text-xs whitespace-pre-wrap">
          {result}
        </pre>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <div className="text-gray-500">{k}</div>
      <div className="text-right">{v}</div>
    </div>
  );
}
