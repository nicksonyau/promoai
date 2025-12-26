"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import {
  Loader2,
  Plus,
  Trash2,
  Send,
  Shield,
  ToggleLeft,
  ToggleRight,
  RotateCcw,
  Save,
} from "lucide-react";
import {
  Card,
  PageShell,
  SearchBox,
  LoadingBlock,
  Pill,
  TextInput,
  Drawer,
  CopyButton,
  CodeBlock,
  errMsg,
  prettyJson,
} from "../_ui";

// ---- MAP THESE to your backend ----
const API = {
  list: "/webhooks/subscriptions/list",
  create: "/webhooks/subscriptions/create",
  update: (id: string) => `/webhooks/subscriptions/update/${encodeURIComponent(id)}`,
  remove: (id: string) => `/webhooks/subscriptions/delete/${encodeURIComponent(id)}`,
  test: (id: string) => `/webhooks/subscriptions/test/${encodeURIComponent(id)}`,
  eventTypes: "/webhooks/event-types/list",
};

type EventType = { id: string; name: string; description?: string | null };

type KVPair = { name: string; value: string };
type LabelPair = { key: string; value: string };

type DeliveryPolicy = {
  retries: number; // 0..20
  backoff: "fixed" | "expo";
  timeoutMs: number; // 1000..60000
  disableAfterFailures: number; // 0..1000 (0 = never)
};

type Signing =
  | { mode: "none"; header?: string | null; secret?: string | null }
  | { mode: "hmac-sha256"; header?: string | null; secret?: string | null };

type Subscription = {
  id: string;
  description?: string;
  enabled: boolean;

  endpoint: {
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    url: string;
    headers: KVPair[];
  };

  labels: LabelPair[];
  metadata?: any[];
  eventTypeIds: string[];

  signing: Signing;

  delivery: DeliveryPolicy;

  // optional summary fields
  createdAt?: string | null;
  updatedAt?: string | null;
  lastDelivery?: {
    at?: string;
    ok?: boolean;
    status?: number;
    latencyMs?: number;
    error?: string;
  } | null;
};

type ListResp<T> =
  | { success: true; data: { items: T[]; cursor?: string | null } }
  | { success: false; error?: string };

type SimpleResp =
  | { success: true; data?: any }
  | { success: false; error?: string };

function uniq(arr: string[]) {
  return Array.from(new Set(arr.filter(Boolean)));
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function cleanPairs<T extends { [k: string]: any }>(arr: T[], k1: string, k2: string): T[] {
  const out: T[] = [];
  for (const x of arr || []) {
    const a = String((x as any)[k1] ?? "").trim();
    const b = String((x as any)[k2] ?? "").trim();
    if (!a && !b) continue;
    out.push({ ...(x as any), [k1]: a, [k2]: b });
  }
  return out;
}

function defaultDelivery(): DeliveryPolicy {
  return { retries: 3, backoff: "expo", timeoutMs: 5000, disableAfterFailures: 10 };
}

function defaultSubDraft(): Omit<Subscription, "id"> {
  return {
    description: "",
    enabled: true,
    endpoint: { method: "POST", url: "", headers: [] },
    labels: [],
    metadata: [],
    eventTypeIds: [],
    signing: { mode: "hmac-sha256", header: "X-PromoHubAI-Signature", secret: null },
    delivery: defaultDelivery(),
  };
}

export default function SubscriptionsPage() {
  const [hydrating, setHydrating] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);

  const [subs, setSubs] = useState<Subscription[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [q, setQ] = useState("");

  const [toast, setToast] = useState<{ kind: "idle" | "error" | "success"; msg?: string }>({
    kind: "idle",
  });

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [draft, setDraft] = useState<Omit<Subscription, "id">>(defaultSubDraft());
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);

  // Drawer
  const [drawer, setDrawer] = useState<{ open: boolean; sub: Subscription | null }>({
    open: false,
    sub: null,
  });
  const [edit, setEdit] = useState<{ on: boolean; working: Subscription | null }>({
    on: false,
    working: null,
  });

  const [testResp, setTestResp] = useState<any>(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return subs;
    return subs.filter((x) => {
      const url = (x.endpoint?.url || "").toLowerCase();
      const id = (x.id || "").toLowerCase();
      const desc = (x.description || "").toLowerCase();
      return url.includes(s) || id.includes(s) || desc.includes(s);
    });
  }, [subs, q]);

  async function load() {
    try {
      setHydrating(true);

      const [sRes, eRes] = await Promise.all([
        apiFetch(API.list, { method: "GET", headers: { Accept: "application/json" } }),
        apiFetch(API.eventTypes, { method: "GET", headers: { Accept: "application/json" } }),
      ]);

      const sJson = (await sRes.json().catch(() => null)) as ListResp<Subscription> | null;
      const eJson = (await eRes.json().catch(() => null)) as ListResp<EventType> | null;

      if (!sJson?.success) throw new Error((sJson as any)?.error || `List failed (${sRes.status})`);
      if (!eJson?.success) throw new Error((eJson as any)?.error || `EventTypes failed (${eRes.status})`);

      setSubs((sJson.data.items || []).map(normalizeSub));
      setEventTypes(eJson.data.items || []);
      setToast({ kind: "idle" });
    } catch (e: any) {
      setToast({ kind: "error", msg: errMsg(e) });
    } finally {
      setHydrating(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function normalizeSub(s: any): Subscription {
    // tolerate older shapes: {url, enabled, eventTypeIds, signing} OR new shape {endpoint:{...}}
    const endpoint =
      s?.endpoint?.url
        ? {
            method: (s.endpoint.method || "POST").toUpperCase(),
            url: s.endpoint.url,
            headers: Array.isArray(s.endpoint.headers) ? s.endpoint.headers : [],
          }
        : {
            method: "POST",
            url: s?.url || "",
            headers: [],
          };

    const signing = s?.signing || {};
    const mode = signing?.mode === "hmac-sha256" ? "hmac-sha256" : "none";

    const delivery = s?.delivery || defaultDelivery();

    return {
      id: String(s?.id || ""),
      description: String(s?.description || ""),
      enabled: s?.enabled !== false,
      endpoint: {
        method: (endpoint.method || "POST") as any,
        url: String(endpoint.url || ""),
        headers: Array.isArray(endpoint.headers) ? endpoint.headers : [],
      },
      labels: Array.isArray(s?.labels) ? s.labels : [],
      metadata: Array.isArray(s?.metadata) ? s.metadata : [],
      eventTypeIds: Array.isArray(s?.eventTypeIds) ? s.eventTypeIds : [],
      signing: {
        mode,
        header: signing?.header || "X-PromoHubAI-Signature",
        secret: signing?.secret ?? null, // usually absent from list
      } as Signing,
      delivery: {
        retries: clamp(Number(delivery.retries ?? 3), 0, 20),
        backoff: delivery.backoff === "fixed" ? "fixed" : "expo",
        timeoutMs: clamp(Number(delivery.timeoutMs ?? 5000), 1000, 60000),
        disableAfterFailures: clamp(Number(delivery.disableAfterFailures ?? 10), 0, 1000),
      },
      createdAt: s?.createdAt ?? null,
      updatedAt: s?.updatedAt ?? null,
      lastDelivery: s?.lastDelivery ?? null,
    };
  }

  function eventName(id: string) {
    return eventTypes.find((x) => x.id === id)?.name || id;
  }

  function openDrawer(sub: Subscription) {
    setDrawer({ open: true, sub });
    setEdit({ on: false, working: null });
    setTestResp(null);
  }

  function startEdit() {
    if (!drawer.sub) return;
    setEdit({ on: true, working: JSON.parse(JSON.stringify(drawer.sub)) as Subscription });
  }

  function cancelEdit() {
    setEdit({ on: false, working: null });
  }

  async function create() {
    try {
      const url = draft.endpoint.url.trim();
      const method = draft.endpoint.method;

      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        setToast({ kind: "error", msg: "Endpoint URL must start with https:// (or http:// for dev)." });
        return;
      }

      const payload = {
        description: (draft.description || "").trim(),
        enabled: draft.enabled !== false,
        endpoint: {
          method,
          url,
          headers: cleanPairs(draft.endpoint.headers || [], "name", "value"),
        },
        labels: cleanPairs(draft.labels || [], "key", "value"),
        metadata: Array.isArray(draft.metadata) ? draft.metadata : [],
        eventTypeIds: uniq(draft.eventTypeIds || []),
        signing: {
          mode: draft.signing?.mode === "hmac-sha256" ? "hmac-sha256" : "none",
          header: draft.signing?.header || "X-PromoHubAI-Signature",
        },
        delivery: {
          retries: clamp(Number(draft.delivery?.retries ?? 3), 0, 20),
          backoff: draft.delivery?.backoff === "fixed" ? "fixed" : "expo",
          timeoutMs: clamp(Number(draft.delivery?.timeoutMs ?? 5000), 1000, 60000),
          disableAfterFailures: clamp(Number(draft.delivery?.disableAfterFailures ?? 10), 0, 1000),
        },
      };

      setSaving(true);
      setCreatedSecret(null);
      setTestResp(null);

      const res = await apiFetch(API.create, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = (await res.json().catch(() => null)) as SimpleResp | null;
      if (!json?.success) throw new Error((json as any)?.error || `Create failed (${res.status})`);

      const created = normalizeSub((json as any).data || payload);
      const secret = (json as any)?.data?.signing?.secret ? String((json as any).data.signing.secret) : null;

      setToast({ kind: "success", msg: "Subscription created." });
      setCreatedSecret(secret);
      setCreateOpen(false);
      setDraft(defaultSubDraft());

      await load();

      // Open drawer immediately so user can copy secret "like Hook0"
      if (secret) {
        openDrawer({ ...created, signing: { ...(created.signing as any), secret } });
      }
    } catch (e: any) {
      setToast({ kind: "error", msg: errMsg(e) });
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit() {
    try {
      if (!edit.working) return;

      const s = edit.working;

      const url = (s.endpoint?.url || "").trim();
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        setToast({ kind: "error", msg: "Endpoint URL must start with https:// (or http:// for dev)." });
        return;
      }

      const body = {
        id: s.id,
        description: (s.description || "").trim(),
        enabled: s.enabled !== false,
        endpoint: {
          method: s.endpoint.method,
          url,
          headers: cleanPairs(s.endpoint.headers || [], "name", "value"),
        },
        labels: cleanPairs(s.labels || [], "key", "value"),
        metadata: Array.isArray(s.metadata) ? s.metadata : [],
        eventTypeIds: uniq(s.eventTypeIds || []),
        signing: {
          mode: s.signing?.mode === "hmac-sha256" ? "hmac-sha256" : "none",
          header: (s.signing as any)?.header || "X-PromoHubAI-Signature",
        },
        delivery: {
          retries: clamp(Number(s.delivery?.retries ?? 3), 0, 20),
          backoff: s.delivery?.backoff === "fixed" ? "fixed" : "expo",
          timeoutMs: clamp(Number(s.delivery?.timeoutMs ?? 5000), 1000, 60000),
          disableAfterFailures: clamp(Number(s.delivery?.disableAfterFailures ?? 10), 0, 1000),
        },
      };

      setSaving(true);
      const res = await apiFetch(API.update(s.id), {
        method: "PUT",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = (await res.json().catch(() => null)) as SimpleResp | null;
      if (!json?.success) throw new Error((json as any)?.error || `Update failed (${res.status})`);

      setToast({ kind: "success", msg: "Updated." });
      setEdit({ on: false, working: null });
      await load();

      // refresh drawer sub from list
      const fresh = subs.find((x) => x.id === s.id);
      if (fresh) setDrawer({ open: true, sub: fresh });
    } catch (e: any) {
      setToast({ kind: "error", msg: errMsg(e) });
    } finally {
      setSaving(false);
    }
  }

  async function rotateSecret(sub: Subscription) {
    try {
      if (sub.signing?.mode !== "hmac-sha256") return;
      setSaving(true);

      const res = await apiFetch(API.update(sub.id), {
        method: "PUT",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ id: sub.id, signing: { mode: "hmac-sha256", rotateSecret: true } }),
      });

      const json = (await res.json().catch(() => null)) as SimpleResp | null;
      if (!json?.success) throw new Error((json as any)?.error || `Rotate failed (${res.status})`);

      const secret = (json as any)?.data?.signing?.secret ? String((json as any).data.signing.secret) : null;
      setToast({ kind: "success", msg: secret ? "Secret rotated. Copy the new secret now." : "Secret rotated." });
      await load();

      if (secret) {
        openDrawer({ ...sub, signing: { ...(sub.signing as any), secret } });
      }
    } catch (e: any) {
      setToast({ kind: "error", msg: errMsg(e) });
    } finally {
      setSaving(false);
    }
  }

  async function remove(sub: Subscription) {
    try {
      const ok = confirm("Delete this subscription? Deliveries will stop.");
      if (!ok) return;

      setSaving(true);
      const res = await apiFetch(API.remove(sub.id), { method: "DELETE", headers: { Accept: "application/json" } });
      const json = (await res.json().catch(() => null)) as SimpleResp | null;
      if (!json?.success) throw new Error((json as any)?.error || `Delete failed (${res.status})`);

      setToast({ kind: "success", msg: "Deleted." });
      setDrawer({ open: false, sub: null });
      setEdit({ on: false, working: null });
      await load();
    } catch (e: any) {
      setToast({ kind: "error", msg: errMsg(e) });
    } finally {
      setSaving(false);
    }
  }

  async function test(sub: Subscription) {
    try {
      setTesting(sub.id);
      setTestResp(null);

      // tolerate backends that expect id in body as well
      const res = await apiFetch(API.test(sub.id), {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
          id: sub.id,
          eventTypeId: sub.eventTypeIds?.[0] || null,
        }),
      });

      const json = (await res.json().catch(() => null)) as any;
      setTestResp({ status: res.status, json });
    } catch (e: any) {
      setTestResp({ error: errMsg(e) });
    } finally {
      setTesting(null);
    }
  }

  return (
    <PageShell
      title="Subscriptions"
      subtitle="Hook0-style webhook subscriptions: endpoint + headers + labels + signing + delivery policy."
      right={
        toast.kind !== "idle" ? (
          <div className={toast.kind === "error" ? "text-sm text-red-600" : "text-sm text-green-600"}>
            {toast.msg}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setDraft(defaultSubDraft());
              setCreatedSecret(null);
              setCreateOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-purple-600 text-white px-4 py-2 text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            New subscription
          </button>
        )
      }
    >
      <Card
        title="All subscriptions"
        right={<SearchBox value={q} onChange={setQ} placeholder="Search by endpoint URL, ID, or description…" />}
      >
        {hydrating ? (
          <LoadingBlock label="Loading subscriptions…" />
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-gray-500">No subscriptions yet.</div>
        ) : (
          <div className="divide-y">
            {filtered.map((s) => (
              <div key={s.id} className="py-3 flex items-start justify-between gap-4">
                <button type="button" onClick={() => openDrawer(s)} className="text-left min-w-0 flex-1">
                  <div className="font-medium text-gray-900 truncate">
                    <span className="text-xs text-gray-500 mr-2">{s.endpoint.method}</span>
                    {s.endpoint.url}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {s.description ? `${s.description} · ` : ""}
                    ID: {s.id}
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {s.enabled ? <Pill tone="green">Enabled</Pill> : <Pill tone="gray">Disabled</Pill>}

                    {s.signing?.mode === "hmac-sha256" ? (
                      <Pill tone="purple">
                        <span className="inline-flex items-center gap-1">
                          <Shield className="h-3 w-3" /> Signed
                        </span>
                      </Pill>
                    ) : (
                      <Pill tone="yellow">Unsigned</Pill>
                    )}

                    <Pill tone="blue">{(s.eventTypeIds || []).length} event(s)</Pill>

                    {s.lastDelivery?.at ? (
                      s.lastDelivery.ok ? (
                        <Pill tone="green">Last OK</Pill>
                      ) : (
                        <Pill tone="red">Last Failed</Pill>
                      )
                    ) : null}
                  </div>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      // Quick toggle without full edit
                      setSaving(true);
                      try {
                        const res = await apiFetch(API.update(s.id), {
                          method: "PUT",
                          headers: { Accept: "application/json", "Content-Type": "application/json" },
                          body: JSON.stringify({ id: s.id, enabled: !s.enabled }),
                        });
                        const json = (await res.json().catch(() => null)) as SimpleResp | null;
                        if (!json?.success) throw new Error((json as any)?.error || `Update failed (${res.status})`);
                        await load();
                      } finally {
                        setSaving(false);
                      }
                    }}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-900 disabled:opacity-60"
                  >
                    {s.enabled ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                    {s.enabled ? "Disable" : "Enable"}
                  </button>

                  <button
                    type="button"
                    onClick={() => test(s)}
                    disabled={testing === s.id}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-900 disabled:opacity-60"
                  >
                    {testing === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Test
                  </button>

                  <button
                    type="button"
                    onClick={() => remove(s)}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-900 disabled:opacity-60"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Create modal */}
      {createOpen ? (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between">
              <div>
                <div className="text-lg font-semibold">Create new subscription (webhook)</div>
                <div className="text-sm text-gray-500 mt-1">
                  A subscription receives events that match its filters (event types + labels).
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium"
              >
                Close
              </button>
            </div>

            <div className="p-5 space-y-5 overflow-y-auto max-h-[70vh]">
              <TextInput
                label="Subscription description"
                value={draft.description || ""}
                onChange={(v) => setDraft((p) => ({ ...p, description: v }))}
                placeholder="my awesome api - production"
              />

              <div className="rounded-2xl border border-gray-200 p-4">
                <div className="text-sm font-semibold text-gray-900">Endpoint HTTP verb and URL</div>
                <div className="text-xs text-gray-500 mt-1">
                  Hook0 will send a webhook to this endpoint when triggered.
                </div>

                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">HTTP verb</div>
                    <select
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                      value={draft.endpoint.method}
                      onChange={(e) =>
                        setDraft((p) => ({
                          ...p,
                          endpoint: { ...p.endpoint, method: e.target.value as any },
                        }))
                      }
                    >
                      {["POST", "GET", "PUT", "PATCH", "DELETE"].map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <TextInput
                      label="URL"
                      value={draft.endpoint.url}
                      onChange={(v) =>
                        setDraft((p) => ({ ...p, endpoint: { ...p.endpoint, url: v } }))
                      }
                      placeholder="https://example.com/webhooks/promohubai"
                    />
                  </div>
                </div>
              </div>

              <KVEditor
                title="Endpoint headers"
                subtitle="Optional custom headers added to every delivery."
                rows={draft.endpoint.headers}
                onChange={(rows) =>
                  setDraft((p) => ({ ...p, endpoint: { ...p.endpoint, headers: rows } }))
                }
                kLabel="header name"
                vLabel="value"
              />

              <LabelEditor
                title="Subscription labels"
                subtitle="Used to filter which events should trigger this subscription."
                rows={draft.labels}
                onChange={(rows) => setDraft((p) => ({ ...p, labels: rows }))}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SigningMode
                  value={draft.signing?.mode === "hmac-sha256" ? "hmac-sha256" : "none"}
                  header={String((draft.signing as any)?.header || "X-PromoHubAI-Signature")}
                  onChange={(mode, header) =>
                    setDraft((p) => ({
                      ...p,
                      signing: { ...(p.signing as any), mode, header },
                    }))
                  }
                />

                <EnableMode
                  value={draft.enabled}
                  onChange={(v) => setDraft((p) => ({ ...p, enabled: v }))}
                />
              </div>

              <DeliveryPolicyEditor
                value={draft.delivery}
                onChange={(delivery) => setDraft((p) => ({ ...p, delivery }))}
              />

              <div className="rounded-2xl border border-gray-200 p-4">
                <div className="text-sm font-semibold text-gray-900">Subscribe to event types</div>
                <div className="text-xs text-gray-500 mt-1">
                  Select the event types this endpoint should receive.
                </div>

                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                  {eventTypes.map((et) => {
                    const checked = draft.eventTypeIds.includes(et.id);
                    return (
                      <label key={et.id} className="flex items-start gap-3 rounded-xl border border-gray-200 px-3 py-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const on = e.target.checked;
                            setDraft((prev) => ({
                              ...prev,
                              eventTypeIds: on
                                ? uniq([...(prev.eventTypeIds || []), et.id])
                                : (prev.eventTypeIds || []).filter((x) => x !== et.id),
                            }));
                          }}
                          className="mt-1"
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900">{et.name}</div>
                          {et.description ? (
                            <div className="text-xs text-gray-500 truncate">{et.description}</div>
                          ) : null}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {createdSecret ? (
                <Card title="New signing secret (copy now)">
                  <CodeBlock title="HMAC secret" value={createdSecret} right={<CopyButton text={createdSecret} />} />
                </Card>
              ) : null}
            </div>

            <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={create}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-purple-600 text-white px-4 py-2 text-sm font-medium disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Create
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Drawer */}
      <Drawer
        open={drawer.open}
        title="Subscription"
        subtitle={drawer.sub ? `${drawer.sub.endpoint.method} ${drawer.sub.endpoint.url}` : ""}
        onClose={() => {
          setDrawer({ open: false, sub: null });
          setEdit({ on: false, working: null });
          setTestResp(null);
        }}
        width="lg"
      >
        {drawer.sub ? (
          <div className="space-y-5 overflow-y-auto max-h-[70vh]">
            <Card
              title="Overview"
              right={
                <div className="flex items-center gap-2">
                  {!edit.on ? (
                    <>
                      <button
                        type="button"
                        onClick={() => startEdit()}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-900"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => test(drawer.sub!)}
                        disabled={testing === drawer.sub.id}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-900 disabled:opacity-60"
                      >
                        {testing === drawer.sub.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        Test
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-900"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={saveEdit}
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-lg bg-purple-600 text-white px-3 py-2 text-xs font-medium disabled:opacity-60"
                      >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save
                      </button>
                    </>
                  )}
                </div>
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">Subscription ID</div>
                  <div className="font-medium text-gray-900 mt-1">{drawer.sub.id}</div>
                </div>
                <div>
                  <div className="text-gray-500">Status</div>
                  <div className="mt-1">
                    {drawer.sub.enabled ? <Pill tone="green">Enabled</Pill> : <Pill tone="gray">Disabled</Pill>}
                  </div>
                </div>

                {drawer.sub.lastDelivery?.at ? (
                  <div className="md:col-span-2">
                    <div className="text-gray-500">Last delivery</div>
                    <div className="mt-1">
                      {drawer.sub.lastDelivery.ok ? (
                        <Pill tone="green">OK</Pill>
                      ) : (
                        <Pill tone="red">Failed</Pill>
                      )}
                      <span className="ml-2 text-xs text-gray-500">
                        {drawer.sub.lastDelivery.status ? `HTTP ${drawer.sub.lastDelivery.status}` : ""}
                        {drawer.sub.lastDelivery.latencyMs ? ` · ${drawer.sub.lastDelivery.latencyMs}ms` : ""}
                        {drawer.sub.lastDelivery.error ? ` · ${drawer.sub.lastDelivery.error}` : ""}
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>
            </Card>

            {/* Edit section */}
            {edit.on && edit.working ? (
              <Card title="Edit subscription">
                <div className="space-y-4">
                  <TextInput
                    label="Description"
                    value={edit.working.description || ""}
                    onChange={(v) => setEdit((p) => ({ ...p, working: p.working ? { ...p.working, description: v } : null }))}
                    placeholder="my awesome api - production"
                  />

                  <div className="rounded-2xl border border-gray-200 p-4">
                    <div className="text-sm font-semibold text-gray-900">Endpoint</div>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">HTTP verb</div>
                        <select
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                          value={edit.working.endpoint.method}
                          onChange={(e) =>
                            setEdit((p) => ({
                              ...p,
                              working: p.working
                                ? {
                                    ...p.working,
                                    endpoint: { ...p.working.endpoint, method: e.target.value as any },
                                  }
                                : null,
                            }))
                          }
                        >
                          {["POST", "GET", "PUT", "PATCH", "DELETE"].map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <TextInput
                          label="URL"
                          value={edit.working.endpoint.url}
                          onChange={(v) =>
                            setEdit((p) => ({
                              ...p,
                              working: p.working ? { ...p.working, endpoint: { ...p.working.endpoint, url: v } } : null,
                            }))
                          }
                          placeholder="https://example.com/webhooks/promohubai"
                        />
                      </div>
                    </div>
                  </div>

                  <KVEditor
                    title="Endpoint headers"
                    subtitle="Optional custom headers added to every delivery."
                    rows={edit.working.endpoint.headers}
                    onChange={(rows) =>
                      setEdit((p) => ({
                        ...p,
                        working: p.working ? { ...p.working, endpoint: { ...p.working.endpoint, headers: rows } } : null,
                      }))
                    }
                    kLabel="header name"
                    vLabel="value"
                  />

                  <LabelEditor
                    title="Subscription labels"
                    subtitle="Used to filter which events should trigger this subscription."
                    rows={edit.working.labels}
                    onChange={(rows) => setEdit((p) => ({ ...p, working: p.working ? { ...p.working, labels: rows } : null }))}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SigningMode
                      value={edit.working.signing?.mode === "hmac-sha256" ? "hmac-sha256" : "none"}
                      header={String((edit.working.signing as any)?.header || "X-PromoHubAI-Signature")}
                      onChange={(mode, header) =>
                        setEdit((p) => ({
                          ...p,
                          working: p.working
                            ? { ...p.working, signing: { ...(p.working.signing as any), mode, header } }
                            : null,
                        }))
                      }
                    />
                    <EnableMode
                      value={edit.working.enabled}
                      onChange={(v) => setEdit((p) => ({ ...p, working: p.working ? { ...p.working, enabled: v } : null }))}
                    />
                  </div>

                  <DeliveryPolicyEditor
                    value={edit.working.delivery}
                    onChange={(delivery) => setEdit((p) => ({ ...p, working: p.working ? { ...p.working, delivery } : null }))}
                  />

                  <div className="rounded-2xl border border-gray-200 p-4">
                    <div className="text-sm font-semibold text-gray-900">Subscribed event types</div>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                      {eventTypes.map((et) => {
                        const checked = edit.working!.eventTypeIds.includes(et.id);
                        return (
                          <label key={et.id} className="flex items-start gap-3 rounded-xl border border-gray-200 px-3 py-2">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                const on = e.target.checked;
                                setEdit((p) => ({
                                  ...p,
                                  working: p.working
                                    ? {
                                        ...p.working,
                                        eventTypeIds: on
                                          ? uniq([...(p.working.eventTypeIds || []), et.id])
                                          : (p.working.eventTypeIds || []).filter((x) => x !== et.id),
                                      }
                                    : null,
                                }));
                              }}
                              className="mt-1"
                            />
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-gray-900">{et.name}</div>
                              {et.description ? (
                                <div className="text-xs text-gray-500 truncate">{et.description}</div>
                              ) : null}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </Card>
            ) : null}

            {/* Non-edit view */}
            {!edit.on ? (
              <>
                <Card title="Subscribed events">
                  <div className="flex flex-wrap gap-2">
                    {(drawer.sub.eventTypeIds || []).map((id) => (
                      <Pill key={id} tone="blue">
                        {eventName(id)}
                      </Pill>
                    ))}
                    {(drawer.sub.eventTypeIds || []).length === 0 ? (
                      <div className="text-sm text-gray-500">No events subscribed.</div>
                    ) : null}
                  </div>
                </Card>

                <Card title="Endpoint">
                  <div className="text-sm">
                    <div className="text-gray-500">Method</div>
                    <div className="font-medium text-gray-900 mt-1">{drawer.sub.endpoint.method}</div>

                    <div className="text-gray-500 mt-4">URL</div>
                    <div className="font-medium text-gray-900 mt-1 break-all">{drawer.sub.endpoint.url}</div>

                    <div className="text-gray-500 mt-4">Headers</div>
                    {(drawer.sub.endpoint.headers || []).length ? (
                      <CodeBlock
                        value={prettyJson(drawer.sub.endpoint.headers)}
                        right={<CopyButton text={prettyJson(drawer.sub.endpoint.headers)} />}
                      />
                    ) : (
                      <div className="mt-1 text-gray-500">No headers.</div>
                    )}
                  </div>
                </Card>

                <Card title="Labels">
                  {(drawer.sub.labels || []).length ? (
                    <CodeBlock value={prettyJson(drawer.sub.labels)} right={<CopyButton text={prettyJson(drawer.sub.labels)} />} />
                  ) : (
                    <div className="text-sm text-gray-500">No labels.</div>
                  )}
                </Card>

                <Card
                  title="Signing secret"
                  right={
                    (drawer.sub.signing as any)?.secret ? <CopyButton text={String((drawer.sub.signing as any).secret)} /> : null
                  }
                >
                  {drawer.sub.signing?.mode !== "hmac-sha256" ? (
                    <div className="text-sm text-gray-500">Signing is disabled for this endpoint.</div>
                  ) : (drawer.sub.signing as any)?.secret ? (
                    <div className="space-y-2">
                      <CodeBlock title={String((drawer.sub.signing as any)?.header || "X-PromoHubAI-Signature")} value={String((drawer.sub.signing as any).secret)} />
                      <button
                        type="button"
                        onClick={() => rotateSecret(drawer.sub!)}
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-900 disabled:opacity-60"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Rotate secret
                      </button>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">
                      Secret is only shown at creation / rotation time for security.
                    </div>
                  )}
                </Card>

                <Card title="Delivery policy">
                  <CodeBlock value={prettyJson(drawer.sub.delivery)} right={<CopyButton text={prettyJson(drawer.sub.delivery)} />} />
                </Card>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => remove(drawer.sub!)}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-900 disabled:opacity-60"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>

                {testResp ? (
                  <Card title="Last test response">
                    <CodeBlock value={prettyJson(testResp)} right={<CopyButton text={prettyJson(testResp)} />} />
                  </Card>
                ) : null}
              </>
            ) : null}
          </div>
        ) : null}
      </Drawer>
    </PageShell>
  );
}

function KVEditor({
  title,
  subtitle,
  rows,
  onChange,
  kLabel,
  vLabel,
}: {
  title: string;
  subtitle?: string;
  rows: { name: string; value: string }[];
  onChange: (rows: { name: string; value: string }[]) => void;
  kLabel: string;
  vLabel: string;
}) {
  const list = rows || [];
  return (
    <div className="rounded-2xl border border-gray-200 p-4">
      <div className="text-sm font-semibold text-gray-900">{title}</div>
      {subtitle ? <div className="text-xs text-gray-500 mt-1">{subtitle}</div> : null}

      <div className="mt-3 space-y-2">
        {list.map((r, idx) => (
          <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
            <div className="md:col-span-5">
              <input
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                placeholder={kLabel}
                value={r.name || ""}
                onChange={(e) => {
                  const next = [...list];
                  next[idx] = { ...next[idx], name: e.target.value };
                  onChange(next);
                }}
              />
            </div>
            <div className="md:col-span-6">
              <input
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                placeholder={vLabel}
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
          onClick={() => onChange([...(list || []), { name: "", value: "" }])}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium"
        >
          +
        </button>
      </div>
    </div>
  );
}

function LabelEditor({
  title,
  subtitle,
  rows,
  onChange,
}: {
  title: string;
  subtitle?: string;
  rows: { key: string; value: string }[];
  onChange: (rows: { key: string; value: string }[]) => void;
}) {
  const list = rows || [];
  return (
    <div className="rounded-2xl border border-gray-200 p-4">
      <div className="text-sm font-semibold text-gray-900">{title}</div>
      {subtitle ? <div className="text-xs text-gray-500 mt-1">{subtitle}</div> : null}

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

function SigningMode({
  value,
  header,
  onChange,
}: {
  value: "none" | "hmac-sha256";
  header: string;
  onChange: (mode: "none" | "hmac-sha256", header: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 p-4">
      <div className="text-sm font-semibold text-gray-900">Signing</div>
      <div className="text-xs text-gray-500 mt-1">Protect payload integrity with HMAC.</div>

      <div className="mt-3 space-y-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            checked={value === "hmac-sha256"}
            onChange={() => onChange("hmac-sha256", header || "X-PromoHubAI-Signature")}
          />
          HMAC-SHA256 (recommended)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" checked={value === "none"} onChange={() => onChange("none", header)} />
          None
        </label>
      </div>

      <div className="mt-3">
        <div className="text-xs text-gray-500 mb-1">Signature header name</div>
        <input
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
          value={header || ""}
          onChange={(e) => onChange(value, e.target.value)}
          placeholder="X-PromoHubAI-Signature"
        />
      </div>
    </div>
  );
}

function EnableMode({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="rounded-2xl border border-gray-200 p-4">
      <div className="text-sm font-semibold text-gray-900">Status</div>
      <div className="text-xs text-gray-500 mt-1">Disable to stop deliveries immediately.</div>
      <div className="mt-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
          Enabled
        </label>
      </div>
    </div>
  );
}

function DeliveryPolicyEditor({
  value,
  onChange,
}: {
  value: any;
  onChange: (v: any) => void;
}) {
  const v = value || { retries: 3, backoff: "expo", timeoutMs: 5000, disableAfterFailures: 10 };
  return (
    <div className="rounded-2xl border border-gray-200 p-4">
      <div className="text-sm font-semibold text-gray-900">Delivery policy</div>
      <div className="text-xs text-gray-500 mt-1">Retries + backoff + timeout + auto-disable threshold.</div>

      <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <div className="text-xs text-gray-500 mb-1">Retries</div>
          <input
            type="number"
            min={0}
            max={20}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            value={Number(v.retries ?? 3)}
            onChange={(e) => onChange({ ...v, retries: clamp(Number(e.target.value || 0), 0, 20) })}
          />
        </div>

        <div>
          <div className="text-xs text-gray-500 mb-1">Backoff</div>
          <select
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            value={v.backoff === "fixed" ? "fixed" : "expo"}
            onChange={(e) => onChange({ ...v, backoff: e.target.value === "fixed" ? "fixed" : "expo" })}
          >
            <option value="expo">Exponential</option>
            <option value="fixed">Fixed</option>
          </select>
        </div>

        <div>
          <div className="text-xs text-gray-500 mb-1">Timeout (ms)</div>
          <input
            type="number"
            min={1000}
            max={60000}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            value={Number(v.timeoutMs ?? 5000)}
            onChange={(e) => onChange({ ...v, timeoutMs: clamp(Number(e.target.value || 5000), 1000, 60000) })}
          />
        </div>

        <div>
          <div className="text-xs text-gray-500 mb-1">Disable after failures</div>
          <input
            type="number"
            min={0}
            max={1000}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            value={Number(v.disableAfterFailures ?? 10)}
            onChange={(e) => onChange({ ...v, disableAfterFailures: clamp(Number(e.target.value || 10), 0, 1000) })}
          />
        </div>
      </div>

      <div className="mt-2 text-xs text-gray-500">
        Set “Disable after failures” to 0 to never auto-disable.
      </div>
    </div>
  );
}