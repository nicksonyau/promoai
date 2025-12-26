"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Pencil, Trash2 } from "lucide-react";

type BroadcastRow = {
  id: string;
  name?: string;
  status?: string;
  createdAt?: string;
  audienceCount?: number;
};

export default function BroadcastsListPage() {
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || "en";

  const [items, setItems] = useState<BroadcastRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/broadcast/list");
      const data = await res.json();

      if (!data?.success) {
        throw new Error(data?.error || "Failed to load broadcasts");
      }

      setItems(Array.isArray(data.broadcasts) ? data.broadcasts : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load broadcasts");
    } finally {
      setLoading(false);
    }
  }

  async function deleteBroadcast(id: string) {
    if (!confirm("Delete this broadcast? This action cannot be undone.")) return;

    setDeletingId(id);
    try {
      const res = await apiFetch("/broadcast/delete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();
      if (!data?.success) {
        throw new Error(data?.error || "Delete failed");
      }

      await load(); // refresh list
    } catch (e: any) {
      alert(e?.message || "Failed to delete broadcast");
    } finally {
      setDeletingId(null);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Broadcasts</h1>
          <p className="text-sm text-gray-500">Create and manage campaigns</p>
        </div>

        <Link
          href={`/${lang}/dashboard/broadcasts/new`}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + New Broadcast
        </Link>
      </div>

      {/* Loading */}
      {loading && <div className="text-gray-500">Loading…</div>}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="bg-white rounded-xl border overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 text-sm font-medium text-gray-500 border-b">
            <div className="col-span-4">Name</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-3">Created</div>
            <div className="col-span-2 text-center">Audience</div>
            <div className="col-span-1 text-right">Action</div>
          </div>

          {/* Empty state */}
          {items.length === 0 && (
            <div className="px-6 py-6 text-sm text-gray-500">
              No broadcasts yet. Create your first campaign.
            </div>
          )}

          {/* Rows */}
          {items.map((b) => (
            <div
              key={b.id}
              className="grid grid-cols-12 gap-4 px-6 py-4 border-b last:border-b-0 items-center"
            >
              <div className="col-span-4">
                <div className="font-medium text-gray-900">
                  {b.name || "Untitled Broadcast"}
                </div>
                <div className="text-xs text-gray-400 truncate">
                  {b.id}
                </div>
              </div>

              <div className="col-span-2 text-sm text-gray-700">
                {b.status || "draft"}
              </div>

              <div className="col-span-3 text-sm text-gray-700">
                {b.createdAt
                  ? new Date(b.createdAt).toLocaleString()
                  : "—"}
              </div>

              <div className="col-span-2 text-center text-sm text-gray-700">
                {b.audienceCount ?? 0}
              </div>

              <div className="col-span-1 flex justify-end gap-3">
                <Link
                  href={`/${lang}/dashboard/broadcasts/${b.id}/edit`}
                  className="inline-flex items-center gap-1 text-purple-600 hover:underline text-sm"
                >
                  <Pencil size={14} />
                  Edit
                </Link>

                <button
                  onClick={() => deleteBroadcast(b.id)}
                  disabled={deletingId === b.id}
                  className="inline-flex items-center gap-1 text-red-600 hover:underline text-sm disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  {deletingId === b.id ? "…" : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
