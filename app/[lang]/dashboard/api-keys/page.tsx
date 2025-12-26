"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Loader2, Plus, Copy, Check, Trash2, KeyRound, Search } from "lucide-react";

type ApiKeyListItem = {
  keyId: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsedAt?: string | null;
  revokedAt?: string | null;
};

type ListResp =
  | {
      success: true;
      data: {
        items: ApiKeyListItem[];
        cursor: string | null;
        list_complete?: boolean;
      };
    }
  | { success: false; error?: string };

type CreateResp =
  | {
      success: true;
      data: {
        keyId: string;
        name: string;
        prefix: string;
        secret: string; // show once
        createdAt: string;
      };
    }
  | { success: false; error?: string };

type SimpleResp = { success: true; data?: any } | { success: false; error?: string };

type Toast =
  | { kind: "idle" }
  | { kind: "success"; msg: string; at: number }
  | { kind: "error"; msg: string; at: number };

function errMsg(e: any) {
  return String(e?.message || e || "Request failed");
}

function fmtDate(v?: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function maskPrefix(prefix: string) {
  // show like phk_abcd1234.... (not secret)
  if (!prefix) return "—";
  return `${prefix}…`;
}

export default function ApiKeysPage() {
  const [items, setItems] = useState<ApiKeyListItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hydrating, setHydrating] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter(
      (x) =>
        x.name.toLowerCase().includes(s) ||
        x.prefix.toLowerCase().includes(s) ||
        x.keyId.toLowerCase().includes(s)
    );
  }, [items, q]);

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [toast, setToast] = useState<Toast>({ kind: "idle" });

  async function load(first = false) {
    try {
      if (first) {
        setHydrating(true);
      } else {
        setLoadingMore(true);
      }

      const url = first ? "/api-keys/list?limit=20" : `/api-keys/list?limit=20&cursor=${encodeURIComponent(cursor || "")}`;
      const res = await apiFetch(url, { method: "GET", headers: { Accept: "application/json" } });
      const json = (await res.json().catch(() => null)) as ListResp | null;

      if (!json?.success) {
        throw new Error((json as any)?.error || `List failed (${res.status})`);
      }

      const next = json.data.items || [];
      setItems((prev) => (first ? next : [...prev, ...next]));
      setCursor(json.data.cursor ?? null);
    } catch (e: any) {
      setToast({ kind: "error", msg: errMsg(e), at: Date.now() });
    } finally {
      setHydrating(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createKey() {
    try {
      const name = newName.trim();
      if (!name) {
        setToast({ kind: "error", msg: "Please enter a key name.", at: Date.now() });
        return;
      }

      setCreating(true);
      setNewSecret(null);
      setCopied(false);

      const res = await apiFetch("/api-keys/create", {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      const json = (await res.json().catch(() => null)) as CreateResp | null;
      if (!json?.success) {
        throw new Error((json as any)?.error || `Create failed (${res.status})`);
      }

      setNewSecret(json.data.secret);
      setToast({ kind: "success", msg: "API key created. Copy it now — it won’t be shown again.", at: Date.now() });

      // refresh list from top
      setCursor(null);
      await load(true);
    } catch (e: any) {
      setToast({ kind: "error", msg: errMsg(e), at: Date.now() });
    } finally {
      setCreating(false);
    }
  }

  async function revokeKey(keyId: string) {
    try {
      const ok = confirm("Revoke this API key? This will immediately stop all requests using it.");
      if (!ok) return;

      const res = await apiFetch(`/api-keys/revoke/${keyId}`, {
        method: "POST",
        headers: { Accept: "application/json" },
      });

      const json = (await res.json().catch(() => null)) as SimpleResp | null;
      if (!json?.success) {
        throw new Error((json as any)?.error || `Revoke failed (${res.status})`);
      }

      setToast({ kind: "success", msg: "Key revoked.", at: Date.now() });
      await load(true);
    } catch (e: any) {
      setToast({ kind: "error", msg: errMsg(e), at: Date.now() });
    }
  }

  async function copySecret() {
    if (!newSecret) return;
    try {
      await navigator.clipboard.writeText(newSecret);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setToast({ kind: "error", msg: "Copy failed. Please copy manually.", at: Date.now() });
    }
  }

  return (
    <div className="p-8 max-w-7xl">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <KeyRound className="h-6 w-6" />
            API keys
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage secret keys used to authenticate requests to your webhook/events API.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {toast.kind === "error" ? <div className="text-sm text-red-600">{toast.msg}</div> : null}
          {toast.kind === "success" ? <div className="text-sm text-green-600">{toast.msg}</div> : null}

          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-purple-600 text-white px-4 py-2 text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            Create key
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between gap-3">
          <div className="relative w-full max-w-sm">
            <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search keys…"
              className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2 text-sm outline-none"
            />
          </div>

          <div className="text-xs text-gray-500">
            {hydrating ? "Loading…" : `${items.length} key(s)`}
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[900px] w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-3 pr-4">Name</th>
                <th className="py-3 pr-4">Key</th>
                <th className="py-3 pr-4">Created</th>
                <th className="py-3 pr-4">Last used</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {hydrating ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-500">
                    <Loader2 className="h-5 w-5 animate-spin inline-block mr-2" />
                    Loading API keys…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-500">
                    No API keys yet.
                  </td>
                </tr>
              ) : (
                filtered.map((k) => {
                  const revoked = !!k.revokedAt;
                  return (
                    <tr key={k.keyId} className="border-b last:border-b-0">
                      <td className="py-3 pr-4 font-medium text-gray-900">{k.name}</td>
                      <td className="py-3 pr-4 text-gray-700">{maskPrefix(k.prefix)}</td>
                      <td className="py-3 pr-4 text-gray-700">{fmtDate(k.createdAt)}</td>
                      <td className="py-3 pr-4 text-gray-700">{fmtDate(k.lastUsedAt)}</td>
                      <td className="py-3 pr-4">
                        {revoked ? (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                            Revoked
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs text-green-700">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-2 text-right">
                        <button
                          type="button"
                          onClick={() => revokeKey(k.keyId)}
                          disabled={revoked}
                          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-900 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Revoke
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {!hydrating && cursor ? (
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
      </div>

      {/* Create modal */}
      {createOpen ? (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="text-lg font-semibold">Create API key</div>
              <div className="text-sm text-gray-500 mt-1">
                The secret will be shown once. Store it securely.
              </div>
            </div>

            <div className="p-5 space-y-4">
              <label className="block text-sm space-y-1">
                <span className="text-gray-600">Key name</span>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Production Webhook Sender"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none"
                  disabled={creating}
                />
              </label>

              {newSecret ? (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <div className="text-xs text-gray-500 mb-2">Your API key (copy now)</div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs break-all bg-white border border-gray-200 rounded-lg p-2">
                      {newSecret}
                    </code>
                    <button
                      type="button"
                      onClick={copySecret}
                      className="inline-flex items-center gap-2 rounded-lg bg-purple-600 text-white px-3 py-2 text-xs font-medium"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setCreateOpen(false);
                  setNewName("");
                  setNewSecret(null);
                  setCopied(false);
                }}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium"
                disabled={creating}
              >
                Close
              </button>

              <button
                type="button"
                onClick={createKey}
                disabled={creating}
                className="inline-flex items-center gap-2 rounded-lg bg-purple-600 text-white px-4 py-2 text-sm font-medium disabled:opacity-60"
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Create
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
