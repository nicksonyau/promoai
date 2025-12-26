"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Loader2, Plus, Trash2, Send, Shield, ToggleLeft, ToggleRight } from "lucide-react";
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

type KVPair = { key: string; value: string };

type EventType = { id: string; name: string; description?: string | null };

type Subscription = {
  id: string;

  // Hook0-like fields
  description?: string | null;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  url: string;

  enabled: boolean;

  // Hook0-like extra fields
  headers?: KVPair[]; // headers sent to endpoint
  labels?: KVPair[]; // used for filtering (future)
  metadata?: KVPair[]; // arbitrary UI metadata

  eventTypeIds: string[];

  signing?: { mode?: "none" | "hmac-sha256"; secret?: string | null; header?: string | null };
  createdAt?: string | null;
  updatedAt?: string | null;
};

type ListResp<T> =
  | { success: true; data: { items: T[]; cursor?: string | null } }
  | { success: false; error?: string };

type SimpleResp = { success: true; data?: any } | { success: false; error?: string };

function uniq(arr: string[]) {
  return Array.from(new Set(arr.filter(Boolean)));
}

function cleanPairs(pairs: KVPair[]) {
  return pairs
    .map((p) => ({ key: (p.key || "").trim(), value: (p.value || "").trim() }))
    .filter((p) => p.key.length > 0);
}

function PairEditor({
  label,
  help,
  value,
  onChange,
  keyPlaceholder = "key",
  valuePlaceholder = "value",
}: {
  label: string;
  help?: string;
  value: KVPair[];
  onChange: (pairs: KVPair[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}) {
  const pairs = value.length > 0 ? value : [{ key: "", value: "" }];

  return (
    <div className="rounded-2xl border border-gray-200 p-4">
      <div className="text-sm font-semibold text-gray-900">{label}</div>
      {help ? <div className="text-xs text-gray-500 mt-1">{help}</div> : null}

      <div className="mt-3 space-y-2">
        {pairs.map((p, idx) => (
          <div key={idx} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto_auto] gap-2 items-center">
            <input
              value={p.key}
              onChange={(e) => {
                const next = [...pairs];
                next[idx] = { ...next[idx], key: e.target.value };
                onChange(next);
              }}
              placeholder={keyPlaceholder}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            />
            <input
              value={p.value}
              onChange={(e) => {
                const next = [...pairs];
                next[idx] = { ...next[idx], value: e.target.value };
                onChange(next);
              }}
              placeholder={valuePlaceholder}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => {
                const next = pairs.filter((_, i) => i !== idx);
                onChange(next.length ? next : [{ key: "", value: "" }]);
              }}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              title="Remove"
            >
              −
            </button>
            <button
              type="button"
              onClick={() => {
                const next = [...pairs];
                next.splice(idx + 1, 0, { key: "", value: "" });
                onChange(next);
              }}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              title="Add"
            >
              +
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SubscriptionsPage() {
  const [hydrating, setHydrating] = useState(true);
  const [saving, setSaving] = useState(false);

  const [subs, setSubs] = useState<Subscription[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);

  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return subs;
    return subs.filter(
      (x) =>
        (x.url || "").toLowerCase().includes(s) ||
        (x.description || "").toLowerCase().includes(s) ||
        (x.id || "").toLowerCase().includes(s)
    );
  }, [subs, q]);

  const [toast, setToast] = useState<{ kind: "idle" | "error" | "success"; msg?: string }>({ kind: "idle" });

  // Create modal state
  const [createOpen, setCreateOpen] = useState(false);

  const [createDesc, setCreateDesc] = useState("");
  const [createMethod, setCreateMethod] = useState<"GET" | "POST" | "PUT" | "PATCH" | "DELETE">("POST");
  const [createUrl, setCreateUrl] = useState("");

  const [createEnabled, setCreateEnabled] = useState(true);
  const [createEventIds, setCreateEventIds] = useState<string[]>([]);
  const [createSigning, setCreateSigning] = useState<"none" | "hmac-sha256">("hmac-sha256");

  const [createHeaders, setCreateHeaders] = useState<KVPair[]>([{ key: "", value: "" }]);
  const [createLabels, setCreateLabels] = useState<KVPair[]>([{ key: "", value: "" }]);
  const [createMetadata, setCreateMetadata] = useState<KVPair[]>([{ key: "", value: "" }]);

  // Drawer state
  const [drawer, setDrawer] = useState<{ open: boolean; sub: Subscription | null }>({ open: false, sub: null });
  const [testResp, setTestResp] = useState<any>(null);

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

      setSubs(sJson.data.items || []);
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

  function eventName(id: string) {
    return eventTypes.find((x) => x.id === id)?.name || id;
  }

  async function create() {
    try {
      const url = createUrl.trim();
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        setToast({ kind: "error", msg: "Webhook URL must start with https:// (or http:// for dev)." });
        return;
      }

      setSaving(true);
      setTestResp(null);

      const payload = {
        description: createDesc.trim(),
        method: createMethod,
        url,
        enabled: createEnabled,
        eventTypeIds: uniq(createEventIds),
        signing: { mode: createSigning },

        // Hook0-like extras (backend must store them to be effective)
        headers: cleanPairs(createHeaders),
        labels: cleanPairs(createLabels),
        metadata: cleanPairs(createMetadata),
      };

      const res = await apiFetch(API.create, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = (await res.json().catch(() => null)) as SimpleResp | null;
      if (!json?.success) throw new Error((json as any)?.error || `Create failed (${res.status})`);

      setToast({ kind: "success", msg: "Subscription created." });
      setCreateOpen(false);

      setCreateDesc("");
      setCreateMethod("POST");
      setCreateUrl("");
      setCreateEventIds([]);
      setCreateEnabled(true);
      setCreateSigning("hmac-sha256");
      setCreateHeaders([{ key: "", value: "" }]);
      setCreateLabels([{ key: "", value: "" }]);
      setCreateMetadata([{ key: "", value: "" }]);

      await load();
    } catch (e: any) {
      setToast({ kind: "error", msg: errMsg(e) });
    } finally {
      setSaving(false);
    }
  }

  async function update(sub: Subscription, patch: Partial<Subscription>) {
    try {
      setSaving(true);

      const res = await apiFetch(API.update(sub.id), {
        method: "PUT",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ ...sub, ...patch }),
      });

      const json = (await res.json().catch(() => null)) as SimpleResp | null;
      if (!json?.success) throw new Error((json as any)?.error || `Update failed (${res.status})`);

      setToast({ kind: "success", msg: "Updated." });
      await load();
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

      const res = await apiFetch(API.remove(sub.id), { method: "DELETE", headers: { Accept: "application/json" } });
      const json = (await res.json().catch(() => null)) as SimpleResp | null;
      if (!json?.success) throw new Error((json as any)?.error || `Delete failed (${res.status})`);

      setToast({ kind: "success", msg: "Deleted." });
      await load();
    } catch (e: any) {
      setToast({ kind: "error", msg: errMsg(e) });
    }
  }

  async function test(sub: Subscription) {
    try {
      setTestResp(null);
      const res = await apiFetch(API.test(sub.id), { method: "POST", headers: { Accept: "application/json" } });
      const json = (await res.json().catch(() => null)) as any;
      setTestResp({ status: res.status, json });
    } catch (e: any) {
      setTestResp({ error: errMsg(e) });
    }
  }

  return (
    <PageShell
      title="Subscriptions"
      subtitle="Create webhook endpoints and subscribe them to event types. Toggle enablement and test delivery."
      right={
        toast.kind !== "idle" ? (
          <div className={toast.kind === "error" ? "text-sm text-red-600" : "text-sm text-green-600"}>{toast.msg}</div>
        ) : (
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-purple-600 text-white px-4 py-2 text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            New subscription
          </button>
        )
      }
    >
      <Card title="All subscriptions" right={<SearchBox value={q} onChange={setQ} placeholder="Search by URL, ID, or description…" />}>
        {hydrating ? (
          <LoadingBlock label="Loading subscriptions…" />
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-gray-500">No subscriptions yet.</div>
        ) : (
          <div className="divide-y">
            {filtered.map((s) => (
              <div key={s.id} className="py-3 flex items-start justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setDrawer({ open: true, sub: s })}
                  className="text-left min-w-0 flex-1"
                >
                  <div className="font-medium text-gray-900 truncate flex items-center gap-2">
                    <span className="inline-flex rounded-md border border-gray-200 px-2 py-0.5 text-xs">
                      {s.method || "POST"}
                    </span>
                    <span className="truncate">{s.url}</span>
                  </div>

                  {s.description ? <div className="text-xs text-gray-500 mt-1">{s.description}</div> : null}

                  <div className="text-xs text-gray-400 mt-1">ID: {s.id}</div>

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
                    {Array.isArray(s.headers) && s.headers.length ? <Pill tone="gray">{s.headers.length} header(s)</Pill> : null}
                    {Array.isArray(s.labels) && s.labels.length ? <Pill tone="gray">{s.labels.length} label(s)</Pill> : null}
                  </div>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => update(s, { enabled: !s.enabled })}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-900 disabled:opacity-60"
                  >
                    {s.enabled ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                    {s.enabled ? "Disable" : "Enable"}
                  </button>

                  <button
                    type="button"
                    onClick={() => test(s)}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-900"
                  >
                    <Send className="h-4 w-4" />
                    Test
                  </button>

                  <button
                    type="button"
                    onClick={() => remove(s)}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-900"
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
                  When this subscription is triggered by an event, the system will send a webhook to this endpoint.
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

            <div className="p-5 space-y-5">
              <TextInput
                label="Subscription description"
                value={createDesc}
                onChange={setCreateDesc}
                placeholder="my awesome api - production"
              />

              <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-4">
                <div className="rounded-2xl border border-gray-200 p-4">
                  <div className="text-sm font-semibold text-gray-900">Endpoint HTTP verb</div>
                  <div className="text-xs text-gray-500 mt-1">The HTTP method used to call your endpoint.</div>
                  <select
                    value={createMethod}
                    onChange={(e) => setCreateMethod(e.target.value as any)}
                    className="mt-3 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                </div>

                <TextInput
                  label="Endpoint URL"
                  value={createUrl}
                  onChange={setCreateUrl}
                  placeholder="https://example.com/webhooks/promohubai"
                />
              </div>

              <PairEditor
                label="Endpoint headers"
                help="These headers will be sent with every webhook request."
                value={createHeaders}
                onChange={setCreateHeaders}
                keyPlaceholder="header name"
                valuePlaceholder="value"
              />

              <PairEditor
                label="Subscription labels"
                help="Used for filtering deliveries in the future (e.g. env=prod, tenant=tvs)."
                value={createLabels}
                onChange={setCreateLabels}
                keyPlaceholder="Label key"
                valuePlaceholder="Label value"
              />

              <div className="rounded-2xl border border-gray-200 p-4">
                <div className="text-sm font-semibold text-gray-900">Select event types to listen to</div>
                <div className="text-xs text-gray-500 mt-1">Choose which events should trigger this subscription.</div>

                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                  {eventTypes.map((et) => {
                    const checked = createEventIds.includes(et.id);
                    return (
                      <label key={et.id} className="flex items-start gap-3 rounded-xl border border-gray-200 px-3 py-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const on = e.target.checked;
                            setCreateEventIds((prev) => (on ? uniq([...prev, et.id]) : prev.filter((x) => x !== et.id)));
                          }}
                          className="mt-1"
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900">{et.name}</div>
                          {et.description ? <div className="text-xs text-gray-500 truncate">{et.description}</div> : null}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <PairEditor
                label="Metadata"
                help="Optional arbitrary metadata to help your UI/backend (not sent to endpoint unless you choose)."
                value={createMetadata}
                onChange={setCreateMetadata}
                keyPlaceholder="key"
                valuePlaceholder="value"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectMode value={createSigning} onChange={setCreateSigning} />
                <EnableMode value={createEnabled} onChange={setCreateEnabled} />
              </div>
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

      {/* Drawer for details */}
      <Drawer
        open={drawer.open}
        title="Subscription"
        subtitle={drawer.sub ? drawer.sub.url : ""}
        onClose={() => setDrawer({ open: false, sub: null })}
        width="lg"
      >
        {drawer.sub ? (
          <div className="space-y-5">
            <Card title="Overview">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">Subscription ID</div>
                  <div className="font-medium text-gray-900 mt-1">{drawer.sub.id}</div>
                </div>
                <div>
                  <div className="text-gray-500">Description</div>
                  <div className="font-medium text-gray-900 mt-1">{drawer.sub.description || "—"}</div>
                </div>
                <div>
                  <div className="text-gray-500">Endpoint</div>
                  <div className="font-medium text-gray-900 mt-1">
                    {(drawer.sub.method || "POST") + " " + drawer.sub.url}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Status</div>
                  <div className="mt-1">{drawer.sub.enabled ? <Pill tone="green">Enabled</Pill> : <Pill tone="gray">Disabled</Pill>}</div>
                </div>
                <div>
                  <div className="text-gray-500">Signing</div>
                  <div className="mt-1">
                    {drawer.sub.signing?.mode === "hmac-sha256" ? <Pill tone="purple">HMAC-SHA256</Pill> : <Pill tone="yellow">None</Pill>}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Events</div>
                  <div className="font-medium text-gray-900 mt-1">{(drawer.sub.eventTypeIds || []).length}</div>
                </div>
              </div>
            </Card>

            <Card title="Endpoint headers">
              {Array.isArray(drawer.sub.headers) && drawer.sub.headers.length ? (
                <CodeBlock value={prettyJson(drawer.sub.headers)} right={<CopyButton text={prettyJson(drawer.sub.headers)} />} />
              ) : (
                <div className="text-sm text-gray-500">No endpoint headers.</div>
              )}
            </Card>

            <Card title="Subscription labels">
              {Array.isArray(drawer.sub.labels) && drawer.sub.labels.length ? (
                <CodeBlock value={prettyJson(drawer.sub.labels)} right={<CopyButton text={prettyJson(drawer.sub.labels)} />} />
              ) : (
                <div className="text-sm text-gray-500">No labels.</div>
              )}
            </Card>

            <Card title="Subscribed events">
              <div className="flex flex-wrap gap-2">
                {(drawer.sub.eventTypeIds || []).map((id) => (
                  <Pill key={id} tone="blue">
                    {eventName(id)}
                  </Pill>
                ))}
                {(drawer.sub.eventTypeIds || []).length === 0 ? <div className="text-sm text-gray-500">No events subscribed.</div> : null}
              </div>
            </Card>

            <Card
              title="Signing secret"
              right={drawer.sub.signing?.secret ? <CopyButton text={drawer.sub.signing.secret} /> : null}
            >
              {drawer.sub.signing?.mode !== "hmac-sha256" ? (
                <div className="text-sm text-gray-500">Signing is disabled for this endpoint.</div>
              ) : drawer.sub.signing?.secret ? (
                <CodeBlock title="HMAC secret" value={drawer.sub.signing.secret} />
              ) : (
                <div className="text-sm text-gray-500">
                  Secret is not returned by list endpoints (recommended). Show it only on create or via a dedicated "reveal" endpoint.
                </div>
              )}
            </Card>

            {testResp ? (
              <Card title="Last test response">
                <CodeBlock value={prettyJson(testResp)} right={<CopyButton text={prettyJson(testResp)} />} />
              </Card>
            ) : null}
          </div>
        ) : null}
      </Drawer>
    </PageShell>
  );
}

function SelectMode({ value, onChange }: { value: "none" | "hmac-sha256"; onChange: (v: any) => void }) {
  return (
    <div className="rounded-2xl border border-gray-200 p-4">
      <div className="text-sm font-semibold text-gray-900">Signing</div>
      <div className="text-xs text-gray-500 mt-1">Protect payload integrity with HMAC.</div>
      <div className="mt-3 space-y-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" checked={value === "hmac-sha256"} onChange={() => onChange("hmac-sha256")} />
          HMAC-SHA256 (recommended)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" checked={value === "none"} onChange={() => onChange("none")} />
          None
        </label>
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
