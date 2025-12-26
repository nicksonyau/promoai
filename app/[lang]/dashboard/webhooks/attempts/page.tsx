"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Loader2, RotateCcw } from "lucide-react";
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
  list: "/webhooks/attempts/list", // ?limit=50&cursor=...
  get: (id: string) => `/webhooks/attempts/get/${encodeURIComponent(id)}`,
  retry: (id: string) => `/webhooks/attempts/retry/${encodeURIComponent(id)}`,
};

type Attempt = {
  id: string;
  eventId: string;
  subscriptionId: string;
  createdAt?: string | null;

  status?: "success" | "failed" | "pending" | string;
  httpStatus?: number | null;
  latencyMs?: number | null;
};

type AttemptDetail = Attempt & {
  request?: { url?: string; headers?: any; body?: any };
  response?: { status?: number; headers?: any; body?: any };
  error?: string | null;
};

type ListResp<T> = { success: true; data: { items: T[]; cursor?: string | null } } | { success: false; error?: string };
type GetResp = { success: true; data: AttemptDetail } | { success: false; error?: string };
type SimpleResp = { success: true; data?: any } | { success: false; error?: string };

function tone(s?: string) {
  const v = (s || "").toLowerCase();
  if (v === "success" || v === "delivered") return "green";
  if (v === "failed" || v === "error") return "red";
  if (v === "pending") return "yellow";
  return "gray";
}

export default function AttemptsPage() {
  const [hydrating, setHydrating] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [items, setItems] = useState<Attempt[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);

  const [toast, setToast] = useState<string>("");

  const [q, setQ] = useState("");
  const dq = useDebounced(q, 200);

  const [status, setStatus] = useState<string>("all");

  const filtered = useMemo(() => {
    const s = dq.trim().toLowerCase();
    return items.filter((x) => {
      if (status !== "all" && (x.status || "").toLowerCase() !== status) return false;
      if (!s) return true;
      return (
        x.id.toLowerCase().includes(s) ||
        x.eventId.toLowerCase().includes(s) ||
        x.subscriptionId.toLowerCase().includes(s)
      );
    });
  }, [items, dq, status]);

  const [drawer, setDrawer] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [detail, setDetail] = useState<AttemptDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [retrying, setRetrying] = useState(false);

  async function load(first = false) {
    try {
      if (first) setHydrating(true);
      else setLoadingMore(true);

      if (first) setCursor(null);

      const url = first
        ? `${API.list}?limit=50`
        : `${API.list}?limit=50&cursor=${encodeURIComponent(cursor || "")}`;

      const res = await apiFetch(url, { method: "GET", headers: { Accept: "application/json" } });
      const json = (await res.json().catch(() => null)) as ListResp<Attempt> | null;
      if (!json?.success) throw new Error((json as any)?.error || `List failed (${res.status})`);

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
      setDetail({ id, eventId: "", subscriptionId: "", error: errMsg(e) } as any);
    } finally {
      setDetailLoading(false);
    }
  }

  async function retry(id: string) {
    try {
      const ok = confirm("Retry this delivery now?");
      if (!ok) return;

      setRetrying(true);
      const res = await apiFetch(API.retry(id), { method: "POST", headers: { Accept: "application/json" } });
      const json = (await res.json().catch(() => null)) as SimpleResp | null;
      if (!json?.success) throw new Error((json as any)?.error || `Retry failed (${res.status})`);

      setToast("Retry triggered.");
      await load(true);
      await openDetail(id);
    } catch (e: any) {
      setToast(errMsg(e));
    } finally {
      setRetrying(false);
    }
  }

  return (
    <PageShell
      title="Request Attempts"
      subtitle="Inspect delivery attempts, response codes, latency, and payloads. Trigger retries safely."
      right={toast ? <div className="text-sm text-red-600">{toast}</div> : null}
    >
      <Card
        title="All attempts"
        right={
          <div className="flex items-center gap-3">
            <SelectInput
              label="Status"
              value={status}
              onChange={setStatus}
              options={[
                { label: "All", value: "all" },
                { label: "Pending", value: "pending" },
                { label: "Success", value: "success" },
                { label: "Failed", value: "failed" },
              ]}
            />
            <div className="pt-5">
              <SearchBox value={q} onChange={setQ} placeholder="Search attempt / event / subscription…" />
            </div>
          </div>
        }
      >
        {hydrating ? (
          <LoadingBlock label="Loading attempts…" />
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-gray-500">No attempts found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[980px] w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-3 pr-4">Attempt</th>
                  <th className="py-3 pr-4">Event</th>
                  <th className="py-3 pr-4">Subscription</th>
                  <th className="py-3 pr-4">Created</th>
                  <th className="py-3 pr-4">HTTP</th>
                  <th className="py-3 pr-4">Latency</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id} className="border-b last:border-b-0">
                    <td className="py-3 pr-4 font-medium text-gray-900">{a.id}</td>
                    <td className="py-3 pr-4 text-gray-700">{a.eventId}</td>
                    <td className="py-3 pr-4 text-gray-700">{a.subscriptionId}</td>
                    <td className="py-3 pr-4 text-gray-700">{fmtDate(a.createdAt)}</td>
                    <td className="py-3 pr-4 text-gray-700">{a.httpStatus ?? "—"}</td>
                    <td className="py-3 pr-4 text-gray-700">{a.latencyMs != null ? `${a.latencyMs}ms` : "—"}</td>
                    <td className="py-3 pr-4">
                      <Pill tone={tone(a.status) as any}>{a.status || "unknown"}</Pill>
                    </td>
                    <td className="py-3 pr-2 text-right">
                      <button
                        type="button"
                        onClick={() => openDetail(a.id)}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-900"
                      >
                        View
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
        title="Attempt details"
        subtitle={drawer.id || ""}
        onClose={() => setDrawer({ open: false, id: null })}
        width="lg"
      >
        {detailLoading ? (
          <LoadingBlock label="Loading attempt…" />
        ) : detail ? (
          <div className="space-y-5">
            <Card
              title="Summary"
              right={
                <button
                  type="button"
                  onClick={() => retry(detail.id)}
                  disabled={retrying}
                  className="inline-flex items-center gap-2 rounded-lg bg-purple-600 text-white px-4 py-2 text-sm font-medium disabled:opacity-60"
                >
                  {retrying ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                  Retry
                </button>
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">Attempt</div>
                  <div className="font-medium text-gray-900 mt-1">{detail.id}</div>
                </div>
                <div>
                  <div className="text-gray-500">Status</div>
                  <div className="mt-1">
                    <Pill tone={tone(detail.status) as any}>{detail.status || "unknown"}</Pill>
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">HTTP status</div>
                  <div className="font-medium text-gray-900 mt-1">{detail.httpStatus ?? "—"}</div>
                </div>
                <div>
                  <div className="text-gray-500">Latency</div>
                  <div className="font-medium text-gray-900 mt-1">{detail.latencyMs != null ? `${detail.latencyMs}ms` : "—"}</div>
                </div>
              </div>

              {detail.error ? <div className="mt-3 text-sm text-red-600">{detail.error}</div> : null}
            </Card>

            <Card title="Request" right={<CopyButton text={prettyJson(detail.request)} />}>
              <CodeBlock value={prettyJson(detail.request)} />
            </Card>

            <Card title="Response" right={<CopyButton text={prettyJson(detail.response)} />}>
              <CodeBlock value={prettyJson(detail.response)} />
            </Card>
          </div>
        ) : (
          <div className="text-sm text-gray-500">No details.</div>
        )}
      </Drawer>
    </PageShell>
  );
}
