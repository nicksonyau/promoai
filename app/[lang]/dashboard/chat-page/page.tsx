// app/[lang]/dashboard/chat-page/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

type ChatPageRecord = {
  id: string;
  name?: string;
  chatbotId?: string;
  createdAt?: number | string;
  updatedAt?: number | string;
};

function fmt(ts?: number | string) {
  if (!ts) return "-";
  try {
    const d = typeof ts === "number" ? new Date(ts) : new Date(String(ts));
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleString();
  } catch {
    return "-";
  }
}

export default function ChatPageListPage() {
  const router = useRouter();
  const pathname = usePathname();
  const lang = useMemo(
    () => (pathname?.split("/")[1] as string) || "en",
    [pathname]
  );

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [items, setItems] = useState<ChatPageRecord[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await apiFetch("/chatpage/list");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to load");

      const list = Array.isArray(data?.list) ? data.list : [];
      const normalized: ChatPageRecord[] = list
        .map((it: any) => ({
          id: String(it?.id || it?.widgetId || ""),
          name: it?.name,
          chatbotId: it?.chatbotId,
          createdAt: it?.createdAt,
          updatedAt: it?.updatedAt,
        }))
        .filter((x: any) => !!x.id);

      setItems(normalized);
    } catch (e: any) {
      setItems([]);
      setErr(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onCreate = async () => {
    if (creating) return;

   // const name = prompt("Chat Page name?", "My Chat Page");
   // if (name === null) return;

    setCreating(true);
    setErr(null);

    try {
      const widgetId =
        (globalThis.crypto as any)?.randomUUID?.() ||
        `cp_${Date.now()}_${Math.random().toString(16).slice(2)}`;

        const name = widgetId;
      router.push(
        `/${lang}/dashboard/chat-page/${encodeURIComponent(
          widgetId
        )}?name=${encodeURIComponent(
          (name || "").trim() || "My Chat Page"
        )}`
      );
    } catch (e: any) {
      setErr(e?.message || "Failed to create");
    } finally {
      setCreating(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!id) return;
    if (!confirm("Delete this chat page?")) return;

    setErr(null);
    try {
      const res = await apiFetch(`/chatpage/delete/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Delete failed");
      await load();
    } catch (e: any) {
      setErr(e?.message || "Failed to delete");
    }
  };

  return (
    <div className="p-10 max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Chat Page</h1>
          <p className="text-gray-500 mt-1">
            Create and manage standalone chat pages. Each page can be linked to a
            different chatbot.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCreate}
            disabled={creating}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold disabled:opacity-60"
          >
            {creating ? "Creating..." : "+ Create New"}
          </button>

          <button
            onClick={load}
            className="px-4 py-2 rounded-xl bg-white ring-1 ring-gray-200 hover:bg-gray-50 text-sm font-medium"
          >
            Refresh
          </button>
        </div>
      </div>

      {err && (
        <div className="mb-6 bg-white rounded-2xl shadow-sm ring-1 ring-red-200">
          <div className="p-4 text-sm text-red-600">{err}</div>
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200">
          <div className="p-10 text-center">
            <div className="text-gray-900 font-semibold">No chat pages yet</div>
            <div className="text-gray-500 text-sm mt-1">
              Click <span className="font-medium">Create New</span> to generate
              your first chat page.
            </div>

            <button
              onClick={onCreate}
              className="mt-6 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold"
            >
              + Create New
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="p-10 text-center text-gray-500">Loading…</div>
      ) : items.length > 0 ? (
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="font-semibold text-gray-900">Your Chat Pages</div>
            <div className="text-sm text-gray-500">
              ID, linked chatbot, last updated.
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {items.map((it) => (
              <div
                key={it.id}
                className="px-5 py-4 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <div className="font-semibold text-gray-900 truncate">
                      {it.name || "Untitled Chat Page"}
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 font-mono">
                      {it.id}
                    </span>
                  </div>

                  <div className="mt-1 text-sm text-gray-500">
                    Chatbot ID:{" "}
                    <span className="font-mono text-gray-700">
                      {it.chatbotId ? it.chatbotId : "Not linked"}
                    </span>
                    <span className="mx-2 text-gray-300">•</span>
                    Updated: {fmt(it.updatedAt)}
                  </div>
                </div>

                <div className="flex gap-3 shrink-0">
                  <Link
                    href={`/${lang}/dashboard/chat-page/${encodeURIComponent(
                      it.id
                    )}`}
                    className="px-4 py-2 rounded-xl bg-white ring-1 ring-gray-200 hover:bg-gray-50 text-sm font-medium"
                  >
                    Edit
                  </Link>

                  <button
                    onClick={() => onDelete(it.id)}
                    className="px-4 py-2 rounded-xl bg-white ring-1 ring-red-200 hover:bg-red-50 text-sm font-medium text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
