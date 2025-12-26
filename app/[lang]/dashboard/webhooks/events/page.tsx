"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Loader2, Send, RefreshCcw } from "lucide-react";
import {
  Card,
  PageShell,
  SearchBox,
  LoadingBlock,
  Pill,
  Drawer,
  TextInput,
  CodeBlock,
  CopyButton,
  errMsg,
  prettyJson,
} from "../_ui";

const API = {
  list: "/webhooks/events/list",
  get: (id: string) => `/webhooks/events/get/${encodeURIComponent(id)}`,
  ingest: "/webhooks/events/ingest",
  eventTypes: "/webhooks/event-types/list",
};

type EventType = { id: string; name: string; description?: string | null };

type WebhookEvent = {
  id: string;
  type: string;
  receivedAt: string;
  occurredAt?: string;
  labels?: Record<string, string>;
  payload?: any;
};

type ListResp<T> =
  | { success: true; data: { items: T[]; cursor?: string | null } }
  | { success: false; error?: string };

type SimpleResp =
  | { success: true; data?: any }
  | { success: false; error?: string };

export default function WebhookEventsPage() {
  const [hydrating, setHydrating] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);

  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [q, setQ] = useState("");

  const [toast, setToast] = useState<{ kind: "idle" | "error" | "success"; msg?: string }>({
    kind: "idle",
  });

  // drawer
  const [drawer, setDrawer] = useState<{ open: boolean; ev: WebhookEvent | null }>({ open: false, ev: null });

  // send modal
  const [sendOpen, setSendOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState<{
    eventTypeId: string;
    labels: { key: string; value: string }[];
    occurredAt: string;
    payloadText: string;
  }>({
    eventTypeId: "",
    labels: [{ key: "all", value: "yes" }],
    occurredAt: "",
    payloadText: `{"test": true}`,
  });

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return events;
    return events.filter((e) => {
      const id = (e.id || "").toLowerCase();
      const t = (e.type || "").toLowerCase();
      return id.includes(s) || t.includes(s);
    });
  }, [events, q]);

  function eventName(id: string) {
    return eventTypes.find((x) => x.id === id)?.name || id;
  }

  async function load(first = false) {
    try {
      if (first) setHydrating(true);

      const [eRes, tRes] = await Promise.all([
        apiFetch(`${API.list}?limit=50`, { method: "GET", headers: { Accept: "application/json" } }),
        apiFetch(API.eventTypes, { method: "GET", headers: { Accept: "application/json" } }),
      ]);

      const eJson = (await eRes.json().catch(() => null)) as ListResp<WebhookEvent> | null;
      const tJson = (await tRes.json().catch(() => null)) as ListResp<EventType> | null;

      if (!eJson?.success) throw new Error((eJson as any)?.error || `Events list failed (${eRes.status})`);
      if (!tJson?.success) throw new Error((tJson as any)?.error || `EventTypes failed (${tRes.status})`);

      setEvents(eJson.data.items || []);
      setCursor(eJson.data.cursor || null);
      setEventTypes(tJson.data.items || []);
      setToast({ kind: "idle" });

      // default select first event type
      if (!draft.eventTypeId && (tJson.data.items || []).length) {
        setDraft((p) => ({ ...p, eventTypeId: tJson.data.items[0].id }));
      }
    } catch (e: any) {
      setToast({ kind: "error", msg: errMsg(e) });
    } finally {
      setHydrating(false);
    }
  }

  async function loadMore() {
    if (!cursor) return;
    try {
      setLoadingMore(true);
      const res = await apiFetch(`${API.list}?limit=50&cursor=${encodeURIComponent(cursor)}`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      const json = (await res.json().catch(() => null)) as ListResp<WebhookEvent> | null;
      if (!json?.success) throw new Error((json as any)?.error || `Load more failed (${res.status})`);

      setEvents((p) => [...p, ...(json.data.items || [])]);
      setCursor(json.data.cursor || null);
    } catch (e: any) {
      setToast({ kind: "error", msg: errMsg(e) });
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function openDrawer(ev: WebhookEvent) {
    try {
      // fetch full detail (payload may be large)
      const res = await apiFetch(API.get(ev.id), { method: "GET", headers: { Accept: "application/json" } });
      const json = (await res.json().catch(() => null)) as SimpleResp | null;
      if (!json?.success) throw new Error((json as any)?.error || `Get failed (${res.status})`);
      setDrawer({ open: true, ev: json.data as any });
    } catch (e: any) {
      setToast({ kind: "error", msg: errMsg(e) });
    }
  }

  function labelsObjFromPairs(pairs: { key: string; value: string }[]) {
    const out: Record<string, string> = {};
    for (const p of pairs || []) {
      const k = String(p?.key || "").trim();
      const v = String(p?.value || "").trim();
      if (!k) continue;
      out[k] = v;
    }
    return out;
  }

  async function sendEvent() {
    try {
      const eventTypeId = String(draft.eventTypeId || "").trim();
      if (!eventTypeId) {
        setToast({ kind: "error", msg: "Please select an event type." });
        return;
      }

      let payload: any = null;
      try {
        payload = draft.payloadText?.trim() ? JSON.parse(draft.payloadText) : null;
      } catch {
        setToast({ kind: "error", msg: "Payload must be valid JSON." });
        return;
      }

      const body = {
        eventTypeId,
        occurredAt: draft.occurredAt?.trim() || undefined,
        labels: labelsObjFromPairs(draft.labels),
        payload,
      };

      setSending(true);
      const res = await apiFetch(API.ingest, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = (await res.json().catch(() => null)) as SimpleResp | null;
      if (!json?.success) throw new Error((json as any)?.error || `Ingest failed (${res.status})`);

      setToast({ kind: "success", msg: "Event sent." });
      setSendOpen(false);

      await load(true);
    } catch (e: any) {
      setToast({ kind: "error", msg: errMsg(e) });
    } finally {
      setSending(false);
    }
  }

  return (
    <PageShell
      title="Events"
      subtitle="Events that PromoHubAI received and forwarded to subscriptions (webhooks)."
      right={
        toast.kind !== "idle" ? (
          <div className={toast.kind === "error" ? "text-sm text-red-600" : "text-sm text-green-600"}>
            {toast.msg}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => load(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium"
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </button>

            <button
              type="button"
              onClick={() => setSendOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-purple-600 text-white px-4 py-2 text-sm font-medium"
            >
              <Send className="h-4 w-4" />
              Send an event
            </button>
          </div>
        )
      }
    >
      <Card
        title="All events"
        right={<SearchBox value={q} onChange={setQ} placeholder="Search by event ID or type…" />}
      >
        {hydrating ? (
          <LoadingBlock label="Loading events…" />
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-gray-500">No events yet.</div>
        ) : (
          <div className="divide-y">
            {filtered.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => openDrawer(e)}
                className="w-full text-left py-3 flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="font-medium text-gray-900 truncate">{e.id}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    <span className="mr-2">{new Date(e.receivedAt).toLocaleString()}</span>
                    <span className="mr-2">·</span>
                    <span className="text-gray-700">{eventName(e.type)}</span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill tone="blue">{e.type}</Pill>
                    {e.labels && Object.keys(e.labels).length ? (
                      <Pill tone="gray">{Object.keys(e.labels).length} label(s)</Pill>
                    ) : (
                      <Pill tone="gray">No labels</Pill>
                    )}
                  </div>
                </div>

                <div className="text-xs text-gray-400 whitespace-nowrap">
                  View
                </div>
              </button>
            ))}
          </div>
        )}

        {cursor ? (
          <div className="pt-3 flex justify-center">
            <button
              type="button"
              onClick={loadMore}
              disabled={loadingMore}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium disabled:opacity-60"
            >
              {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Load more
            </button>
          </div>
        ) : null}
      </Card>

      {/* Drawer */}
      <Drawer
        open={drawer.open}
        title="Event"
        subtitle={drawer.ev ? `${drawer.ev.id} · ${drawer.ev.type}` : ""}
        onClose={() => setDrawer({ open: false, ev: null })}
        width="lg"
      >
        {drawer.ev ? (
          <div className="space-y-4">
            <Card title="Meta">
              <div className="text-sm text-gray-700 space-y-2">
                <div>
                  <div className="text-gray-500">Event ID</div>
                  <div className="font-medium">{drawer.ev.id}</div>
                </div>
                <div>
                  <div className="text-gray-500">Event type</div>
                  <div className="font-medium">{drawer.ev.type}</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <div className="text-gray-500">Occurred at</div>
                    <div className="font-medium">{drawer.ev.occurredAt}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Received at</div>
                    <div className="font-medium">{drawer.ev.receivedAt}</div>
                  </div>
                </div>
              </div>
            </Card>

            <Card
              title="Labels"
              right={drawer.ev.labels ? <CopyButton text={prettyJson(drawer.ev.labels)} /> : null}
            >
              {drawer.ev.labels && Object.keys(drawer.ev.labels).length ? (
                <CodeBlock value={prettyJson(drawer.ev.labels)} />
              ) : (
                <div className="text-sm text-gray-500">No labels.</div>
              )}
            </Card>

            <Card
              title="Payload"
              right={<CopyButton text={prettyJson(drawer.ev.payload)} />}
            >
              <CodeBlock value={prettyJson(drawer.ev.payload)} />
            </Card>
          </div>
        ) : null}
      </Drawer>

      {/* Send event modal */}
      {sendOpen ? (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between">
              <div>
                <div className="text-lg font-semibold">Send a test event</div>
                <div className="text-sm text-gray-500 mt-1">
                  Choose an event type, labels, and JSON payload. PromoHubAI will route it to subscriptions.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSendOpen(false)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium"
              >
                Close
              </button>
            </div>

            <div className="p-5 space-y-5 overflow-y-auto max-h-[70vh]">
              <div className="rounded-2xl border border-gray-200 p-4">
                <div className="text-xs text-gray-500 mb-1">Event Type</div>
                <select
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                  value={draft.eventTypeId}
                  onChange={(e) => setDraft((p) => ({ ...p, eventTypeId: e.target.value }))}
                >
                  <option value="">Select event type…</option>
                  {eventTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.id})
                    </option>
                  ))}
                </select>
              </div>

              <LabelsEditor
                rows={draft.labels}
                onChange={(labels) => setDraft((p) => ({ ...p, labels }))}
              />

              <TextInput
                label="Occurred at (optional)"
                value={draft.occurredAt}
                onChange={(v) => setDraft((p) => ({ ...p, occurredAt: v }))}
                placeholder="2025-12-25T10:00:00.000Z"
              />

              <div className="rounded-2xl border border-gray-200 p-4">
                <div className="text-sm font-semibold text-gray-900">Payload (JSON)</div>
                <div className="text-xs text-gray-500 mt-1">Must be valid JSON.</div>
                <div className="mt-3">
                  <textarea
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-mono min-h-[140px]"
                    value={draft.payloadText}
                    onChange={(e) => setDraft((p) => ({ ...p, payloadText: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={sendEvent}
                disabled={sending}
                className="inline-flex items-center gap-2 rounded-lg bg-purple-600 text-white px-4 py-2 text-sm font-medium disabled:opacity-60"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send event
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}

function LabelsEditor({
  rows,
  onChange,
}: {
  rows: { key: string; value: string }[];
  onChange: (rows: { key: string; value: string }[]) => void;
}) {
  const list = rows || [];
  return (
    <div className="rounded-2xl border border-gray-200 p-4">
      <div className="text-sm font-semibold text-gray-900">Event labels</div>
      <div className="text-xs text-gray-500 mt-1">
        Subscriptions will trigger when their labels are part of the event labels.
      </div>

      <div className="mt-3 space-y-2">
        {list.map((r, idx) => (
          <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
            <div className="md:col-span-5">
              <input
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                placeholder="Label key"
                value={r.key || ""}
                onChange={(e) => {
                  const next = [...list];
                  next[idx] = { ...next[idx], key: e.target.value };
                  onChange(next);
                }}
              />
            </div>
            <div className="md:col-span-6">
              <input
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                placeholder="Label value"
                value={r.value || ""}
                onChange={(e) => {
                  const next = [...list];
                  next[idx] = { ...next[idx], value: e.target.value };
                  onChange(next);
                }}
              />
            </div>
            <div className="md:col-span-1 flex justify-end">
              <button
                type="button"
                onClick={() => onChange(list.filter((_, i) => i !== idx))}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium"
                aria-label="Remove"
              >
                –
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3">
        <button
          type="button"
          onClick={() => onChange([...(list || []), { key: "", value: "" }])}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium"
        >
          +
        </button>
      </div>
    </div>
  );
}
