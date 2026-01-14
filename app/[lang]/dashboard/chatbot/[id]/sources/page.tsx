"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { apiFetch } from "@/lib/api";

interface ChatbotRecord {
  id: string;
  businessName: string;
  companyId: string;
  updatedAt?: number;
  createdAt?: number;
}

export default function ChatbotListPage() {
  const pathname = usePathname();
  const lang = (pathname?.split("/")[1] as string) || "en";

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ChatbotRecord[]>([]);
  const [selectBot, setSelectBot] = useState<string | null>(null);

  /* -------------------------
     Load Chatbots
  ------------------------- */
  const load = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/chatbot/list");
      if (!res.ok) throw new Error("Failed to load");

      const data = await res.json();

      const list = (data.list || []).map((item: any): ChatbotRecord => ({
        id: item.id,
        businessName: item.businessName || "Unnamed",
        companyId: item.companyId || "unknown",
        updatedAt: item.updatedAt,
        createdAt: item.createdAt,
      }));

      setItems(list);
    } catch (e) {
      console.error("Failed to load chatbots", e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  /* -------------------------
     Delete Chatbot
  ------------------------- */
  const deleteItem = async (id: string) => {
    if (!id || !confirm("Delete this chatbot?")) return;

    try {
      const res = await apiFetch(`/chatbot/delete/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Delete failed");
      }
      await load();
    } catch {
      alert("Failed to delete chatbot");
    }
  };

  /* -------------------------
     Helpers
  ------------------------- */
  const goEdit = (id: string) => {
    try {
      localStorage.setItem("activeChatbotId", id);
    } catch {}
    window.location.href = `/${lang}/dashboard/chatbot/${id}`;
  };

  const goCreate = () => {
    try {
      localStorage.removeItem("activeChatbotId");
    } catch {}
    window.location.href = `/${lang}/dashboard/chatbot/new`;
  };

  /* -------------------------
     UI STATES
  ------------------------- */
  if (loading) {
    return <div className="p-10 text-center text-gray-500">Loading…</div>;
  }

  /* -------------------------
     UI
  ------------------------- */
  return (
    <div className="p-10 max-w-5xl mx-auto">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Chatbots</h1>

        {/* ✅ Create → chatbot/[id] (new mode) */}
        <button
          onClick={goCreate}
          className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          + Create New Chatbot
        </button>
      </div>

      {/* EMPTY STATE */}
      {items.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-10 text-center text-gray-500">
          No chatbots created yet.
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 text-sm text-gray-600">
            {items.length} chatbot{items.length > 1 ? "s" : ""}
          </div>

          <div className="divide-y divide-gray-100">
            {items.map((bot) => (
              <div
                key={bot.id}
                className="px-5 py-4 flex items-start justify-between gap-6"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <div className="font-semibold text-gray-900 truncate">
                      {bot.businessName}
                    </div>

                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                      ID
                    </span>

                    <span className="font-mono text-xs text-gray-500 truncate">
                      {bot.id}
                    </span>
                  </div>

                  <div className="mt-1 text-xs text-gray-500 flex gap-4">
                    <span className="font-mono">
                      Company: {bot.companyId}
                    </span>
                    <span>
                      Updated:{" "}
                      {bot.updatedAt
                        ? new Date(bot.updatedAt).toLocaleString()
                        : "-"}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 flex flex-wrap items-center gap-3 text-sm">
                  <Link
                    href={`/${lang}/dashboard/chatbot/${bot.id}/history`}
                    className="text-gray-700 hover:text-gray-900"
                  >
                    History
                  </Link>

                  <button
                    onClick={() => setSelectBot(bot.id)}
                    className="text-gray-700 hover:text-gray-900"
                  >
                    Add Source
                  </button>
                  
                <Link
                    href={`/${lang}/dashboard/chatbot/${bot.id}/embed`}
                    className="text-gray-700 hover:text-gray-900"
                  >
                    Embed
                  </Link>
                  
                  {/* ✅ Explicit ID pass */}
                  <button
                    onClick={() => goEdit(bot.id)}
                    className="text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => deleteItem(bot.id)}
                    className="text-red-600 hover:text-red-700 font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SOURCE MODAL */}
      {selectBot && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white rounded-2xl p-6 w-80 space-y-4 shadow-lg">
            <h2 className="text-lg font-semibold">Add Data Source</h2>

            <Link
              href={`/${lang}/dashboard/chatbot/${selectBot}/sources/web`}
              className="block w-full text-center py-2 border rounded-lg hover:bg-gray-50"
            >
              🌐 Website Link
            </Link>

            <Link
              href={`/${lang}/dashboard/chatbot/${selectBot}/sources/file`}
              className="block w-full text-center py-2 border rounded-lg hover:bg-gray-50"
            >
              📄 Upload File
            </Link>

            <button
              onClick={() => setSelectBot(null)}
              className="block w-full text-center py-2 text-gray-600 hover:underline"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
