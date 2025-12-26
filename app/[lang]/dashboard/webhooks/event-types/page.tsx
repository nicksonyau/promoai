"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Card, PageShell, SearchBox, LoadingBlock, Pill, TextInput, errMsg } from "../_ui";

// ---- MAP THESE to your backend ----
const API = {
  list: "/webhooks/event-types/list",
  create: "/webhooks/event-types/create",
  remove: (id: string) => `/webhooks/event-types/delete/${encodeURIComponent(id)}`,
};

type EventType = {
  id: string;
  name: string; // e.g. invoice.paid
  description?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type ListResp =
  | { success: true; data: { items: EventType[] } }
  | { success: false; error?: string };

type CreateResp =
  | { success: true; data: EventType }
  | { success: false; error?: string };

type SimpleResp = { success: true; data?: any } | { success: false; error?: string };

export default function EventTypesPage() {
  const [items, setItems] = useState<EventType[]>([]);
  const [hydrating, setHydrating] = useState(true);

  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter(
      (x) =>
        (x.name || "").toLowerCase().includes(s) ||
        (x.description || "").toLowerCase().includes(s)
    );
  }, [items, q]);

  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState<{ kind: "idle" | "error" | "success"; msg?: string }>({
    kind: "idle",
  });

  // ----------------------------
  // FIX #1: cache-busted load()
  // - prevents any intermediary caching
  // - still works with your backend "no-store"
  // ----------------------------
  async function load() {
    try {
      setHydrating(true);

      // cache buster avoids stale edge/proxy/browser caching
      const url = `${API.list}?_=${Date.now()}`;

      const res = await apiFetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        // Next.js fetch hint; safe even if apiFetch wraps fetch
        cache: "no-store" as any,
      });

      const json = (await res.json().catch(() => null)) as ListResp | null;
      if (!json?.success) throw new Error((json as any)?.error || `List failed (${res.status})`);

      setItems(json.data.items || []);
      setToast({ kind: "idle" });
    } catch (e: any) {
      setToast({ kind: "error", msg: errMsg(e) });
    } finally {
      setHydrating(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----------------------------
  // FIX #2: optimistic create()
  // - Cloudflare KV list is eventually consistent
  // - so we insert created record immediately using create response
  // - then background refresh later
  // ----------------------------
  async function create() {
    try {
      const n = name.trim();
      if (!n) {
        setToast({ kind: "error", msg: "Event name is required." });
        return;
      }
      setSaving(true);

      const res = await apiFetch(API.create, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ name: n, description: desc.trim() }),
      });

      const json = (await res.json().catch(() => null)) as CreateResp | null;
      if (!json?.success) throw new Error((json as any)?.error || `Create failed (${res.status})`);

      const created = json.data;

      // ✅ instant UI update (read-after-write safe under KV eventual consistency)
      setItems((prev) => {
        const exists = prev.some((x) => x.id === created.id);
        const next = exists ? prev : [created, ...prev];
        // keep newest first (defensive)
        next.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
        return next;
      });

      setName("");
      setDesc("");
      setToast({ kind: "success", msg: "Event type created." });

      // Optional: background refresh after KV catches up
      window.setTimeout(() => {
        load();
      }, 800);
    } catch (e: any) {
      setToast({ kind: "error", msg: errMsg(e) });
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    try {
      const ok = confirm("Delete this event type? Existing subscriptions may break.");
      if (!ok) return;

      const res = await apiFetch(API.remove(id), {
        method: "DELETE",
        headers: { Accept: "application/json" },
      });

      const json = (await res.json().catch(() => null)) as SimpleResp | null;
      if (!json?.success) throw new Error((json as any)?.error || `Delete failed (${res.status})`);

      // Optimistic removal (also avoids KV list lag)
      setItems((prev) => prev.filter((x) => x.id !== id));

      setToast({ kind: "success", msg: "Deleted." });

      // background refresh
      window.setTimeout(() => {
        load();
      }, 500);
    } catch (e: any) {
      setToast({ kind: "error", msg: errMsg(e) });
    }
  }

  return (
    <PageShell
      title="Event Types"
      subtitle="Define the canonical event names you emit (e.g. lead.created, invoice.paid)."
      right={
        toast.kind !== "idle" ? (
          <div className={toast.kind === "error" ? "text-sm text-red-600" : "text-sm text-green-600"}>
            {toast.msg}
          </div>
        ) : null
      }
    >
      <Card title="Create event type">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end">
          <TextInput
            label="Event name"
            value={name}
            onChange={setName}
            placeholder="invoice.paid"
            disabled={saving}
          />
          <TextInput
            label="Description"
            value={desc}
            onChange={setDesc}
            placeholder="Triggered when payment is completed"
            disabled={saving}
          />
          <button
            type="button"
            onClick={create}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-purple-600 text-white px-4 py-2 text-sm font-medium disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add
          </button>
        </div>
      </Card>

      <div className="mt-6" />

      <Card title="All event types" right={<SearchBox value={q} onChange={setQ} placeholder="Search event types…" />}>
        {hydrating ? (
          <LoadingBlock label="Loading event types…" />
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-gray-500">No event types found.</div>
        ) : (
          <div className="divide-y">
            {filtered.map((it) => (
              <div key={it.id} className="py-3 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-medium text-gray-900 flex items-center gap-2">
                    {it.name}
                    <Pill tone="blue">event</Pill>
                  </div>
                  {it.description ? <div className="text-sm text-gray-500 mt-0.5">{it.description}</div> : null}
                  <div className="text-xs text-gray-400 mt-1">ID: {it.id}</div>
                </div>

                <button
                  type="button"
                  onClick={() => remove(it.id)}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-900"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </PageShell>
  );
}
