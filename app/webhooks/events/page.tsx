"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { ArrowRight, Loader2 } from "lucide-react";
import {
  Card,
  PageShell,
  SearchBox,
  LoadingBlock,
  Pill,
  Drawer,
  CodeBlock,
  CopyButton,
  errMsg,
  fmtDate,
  prettyJson,
  SelectInput,
  useDebounced,
} from "../_ui";

// ---- MAP THESE to your backend ----
const API = {
  list: "/webhooks/events/list",                 // supports ?limit=50&cursor=...
  get: (id: string) => `/webhooks/events/get/${encodeURIComponent(id)}`,
  eventTypes: "/webhooks/event-types/list",
};

type EventType = { id: string; name: string };

type WebhookEvent = {
  id: string;
  typeId: string; // eventTypeId
  createdAt?: string | null;
  status?: "pending" | "delivered" | "failed" | "partial" | string;
  // minimal list fields; details fetched by get()
};

type EventDetail = WebhookEvent & {
  payload?: any;
  attempts?: number;
  lastError?: string | null;
  subscriptions?: Array<{ subscriptionId: string; status: string }>;
};

type ListResp<T> = { success: true; data: { items: T[]; cursor?: string | null } } | { success: false; error?: string };
type GetResp = { success: true; data: EventDetail } | { success: false; error?: string };

function toneForStatus(s?: string) {
  const v = (s || "").toLowerCase();
  if (v === "delivered" || v === "success") return "green";
  if (v === "failed" || v === "error") return "red";
  if (v === "pending") return "yellow";
  if (v === "partial") return "purple";
  return "gray";
}

export default function EventsPage() {
  const [hydrating, setHydrating] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [items, setItems] = useState<WebhookEvent[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);

  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [toast, setToast] = useState<string>("");

  const [q, setQ] = useState("");
  const dq = useDebounced(q, 200);

  const [status, setStatus] = useState<string>("all");
  const [type, setType] = useState<string>("all");

  const [drawer, setDrawer] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [detail, setDetail] = useState<EventDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  function typeName(id: string) {
    return eventTypes.find((x) => x.id === id)?.name || id;
  }

  const filtered = useMemo(() => {
    const s = dq.trim().toLowerCase();
    return items.filter((x) => {
      if (status !== "all" && (x.status || "").toLowerCase() !== status) return false;
      if (type !== "all" && x.typeId !== type) return false;
      if (!s) return true;
      return x.id.toLowerCase().includes(s) || typeName(x.typeId).toLowerCase().includes(s);
    });
  }, [items, dq, status, type, eventTypes]);

  async function load(first = false) {
    try {
      if (first) setHydrating(true);
      else setLoadingMore(true);

      if (first) setCursor(null);

      const url = first
        ? `${API.list}?limit=50`
        : `${API.list}?limit=50&cursor=${encodeURIComponent(cursor || "")}`;

      const [r, et] = await Promise.all([
        apiFetch(url, { method: "GET", headers: { Accept: "application/json" } }),
        eventTypes.length ? Promise.resolve(null) : apiFetch(API.eventTypes, { method: "GET", headers: { Accept: "application/json" } }),
      ]);

      const json = (await r.json().catch(() => null)) as ListResp<WebhookEvent> | null;
      if (!json?.success) throw new Error((json as any)?.error || `List failed (${r.status})`);

      if (et) {
        const etJson = (await et.json().catch(() => null)) as ListResp<EventType> | null;
        if (etJson?.success) setEventTypes(etJson.data.items || []);
      }

      setItems((prev) => (first ? json.data.items || [] : [...prev, ...(json.data.items || [])]));
      setCursor(json.data.cursor ?? null);
      setToast("");
    } catch (e: any) {
      setToast(errMsg(e));
    } finally {
      setHydrating(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function openDetail(id: string) {
    try {
      setDrawer({ open: true, id });
      setDetail(null);
      setDetailLoading(true);

      const res = await apiFetch(API.get(id), { method: "GET", headers: { Accept: "application/json" } });
      const json = (await res.json().catch(() => null)) as GetResp | null;
      if (!json?.success) throw new Error((json as any)?.error || `Get failed (${res.status})`);

      setDetail(json.data);
    } catch (e: any) {
      setDetail({ id, typeId: "", payload: { error: errMsg(e) } } as any);
    } finally {
      setDetailLoading(false);
    }
  }

  return (
    <PageShell
      title="Events"
      subtitle="Browse events emitted by your system and inspect payload + delivery summary."
      right={toast ? <div className="text-sm text-red-600">{toast}</div> : null}
    >
      <Card
        title="All events"
        right={
          <div className="flex items-center gap-3">
            <SelectInput
              label="Status"
              value={status}
              onChange={setStatus}
              options={[
                { label: "All", value: "all" },
                { label: "Pending", value: "pending" },
                { label: "Delivered", value: "delivered" },
                { label: "Failed", value: "failed" },
                { label: "Partial", value: "partial" },
              ]}
            />
            <SelectInput
              label="Type"
              value={type}
              onChange={setType}
              options={[
                { label: "All", value: "all" },
                ...eventTypes.map((x) => ({ label: x.name, value: x.id })),
              ]}
            />
            <div className="pt-5">
              <SearchBox value={q} onChange={setQ} placeholder="Search by event id / type…" />
            </div>
          </div>
        }
      >
        {hydrating ? (
          <LoadingBlock label="Loading events…" />
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-gray-500">No events found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-3 pr-4">Event</th>
                  <th className="py-3 pr-4">Type</th>
                  <th className="py-3 pr-4">Created</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id} className="border-b last:border-b-0">
                    <td className="py-3 pr-4 font-medium text-gray-900">{e.id}</td>
                    <td className="py-3 pr-4 text-gray-700">{typeName(e.typeId)}</td>
                    <td className="py-3 pr-4 text-gray-700">{fmtDate(e.createdAt)}</td>
                    <td className="py-3 pr-4">
                      <Pill tone={toneForStatus(e.status) as any}>{e.status || "unknown"}</Pill>
                    </td>
                    <td className="py-3 pr-2 text-right">
                      <button
                        type="button"
                        onClick={() => openDetail(e.id)}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-900"
                      >
                        View <ArrowRight className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {cursor ? (
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={() => load(false)}
                  disabled={loadingMore}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium disabled:opacity-60"
                >
                  {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Load more
                </button>
              </div>
            ) : null}
          </div>
        )}
      </Card>

      <Drawer
        open={drawer.open}
        title="Event details"
        subtitle={drawer.id || ""}
        onClose={() => setDrawer({ open: false, id: null })}
        width="lg"
      >
        {detailLoading ? (
          <LoadingBlock label="Loading event…" />
        ) : detail ? (
          <div className="space-y-5">
            <Card title="Summary">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">Event ID</div>
                  <div className="font-medium text-gray-900 mt-1">{detail.id}</div>
                </div>
                <div>
                  <div className="text-gray-500">Type</div>
                  <div className="font-medium text-gray-900 mt-1">{typeName(detail.typeId)}</div>
                </div>
                <div>
                  <div className="text-gray-500">Status</div>
                  <div className="mt-1">
                    <Pill tone={toneForStatus(detail.status) as any}>{detail.status || "unknown"}</Pill>
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Created</div>
                  <div className="font-medium text-gray-900 mt-1">{fmtDate(detail.createdAt)}</div>
                </div>
              </div>
              {detail.lastError ? <div className="mt-3 text-sm text-red-600">{detail.lastError}</div> : null}
            </Card>

            <Card title="Payload" right={<CopyButton text={prettyJson(detail.payload)} />}>
              <CodeBlock value={prettyJson(detail.payload)} />
            </Card>

            {detail.subscriptions && detail.subscriptions.length ? (
              <Card title="Per-subscription status">
                <div className="divide-y">
                  {detail.subscriptions.map((s) => (
                    <div key={s.subscriptionId} className="py-3 flex items-center justify-between text-sm">
                      <div className="font-medium text-gray-900">{s.subscriptionId}</div>
                      <Pill tone={toneForStatus(s.status) as any}>{s.status}</Pill>
                    </div>
                  ))}
                </div>
              </Card>
            ) : null}
          </div>
        ) : (
          <div className="text-sm text-gray-500">No details.</div>
        )}
      </Drawer>
    </PageShell>
  );
}
