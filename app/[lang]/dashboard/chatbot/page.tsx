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

  // -------------------------
  // Load Chatbots
  // -------------------------
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

  // -------------------------
  // Delete Chatbot
  // -------------------------
  const deleteItem = async (id: string) => {
    if (!id || !confirm("Delete this chatbot?")) return;

    try {
      const res = await apiFetch(`/chatbot/delete/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Delete failed");
      }
      await load();
    } catch {
      alert("Failed to delete chatbot");
    }
  };

  // -------------------------
  // UI STATES
  // -------------------------
  if (loading) return <div className="p-10 text-center text-gray-500">Loading…</div>;

  if (items.length === 0) {
    return (
      <div className="p-10 max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Chatbots</h1>
          <Link
            href={`/${lang}/dashboard/chatbot/create`}
            className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            + Create New Chatbot
          </Link>
        </div>
        <div className="text-gray-500 text-center py-10">
          No chatbots created yet.
        </div>
      </div>
    );
  }

  // -------------------------
  // UI
  // -------------------------
  return (
    <div className="p-10 max-w-5xl mx-auto">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Chatbots</h1>
        <Link
          href={`/${lang}/dashboard/chatbot/create`}
          className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          + Create New Chatbot
        </Link>
      </div>

      {/* LIST */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">Chatbot ID</th>
              <th className="p-3">Business Name</th>
              <th className="p-3">Company ID</th>
              <th className="p-3">Last Updated</th>
              <th className="p-3 w-56">Actions</th>
            </tr>
          </thead>

          <tbody>
            {items.map((bot) => (
              <tr key={bot.id} className="border-t">
                <td className="p-3 font-mono text-xs sm:text-sm">{bot.id}</td>
                <td className="p-3">{bot.businessName || "-"}</td>
                <td className="p-3 font-mono text-[11px] text-gray-600">
                  {bot.companyId}
                </td>
                <td className="p-3 text-gray-500 text-xs">
                  {bot.updatedAt ? new Date(bot.updatedAt).toLocaleString() : "-"}
                </td>
                <td className="p-3">
                  <div className="flex gap-4">

                    {/* ADD SOURCE BUTTON */}
                    <button
                      onClick={() => setSelectBot(bot.id)}
                      className="text-gray-800 hover:underline"
                    >
                      Add Source
                    </button>

                    <Link
                      href={`/${lang}/dashboard/chatbot/${bot.id}/sources`}
                      className="text-gray-700 hover:underline"
                    >
                      Sources
                    </Link>

                    <Link
                      href={`/${lang}/dashboard/chatbot/${bot.id}`}
                      className="text-indigo-600 hover:underline"
                    >
                      Edit
                    </Link>

                    <button
                      onClick={() => deleteItem(bot.id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>

                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* -------------------------
           SOURCE SELECTION MODAL
      ------------------------- */}
      {selectBot && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl p-6 w-80 space-y-4 shadow-lg">

            <h2 className="text-lg font-semibold">Add Data Source</h2>

            <Link
              href={`/${lang}/dashboard/chatbot/${selectBot}/sources/web`}
              className="block w-full text-center py-2 border rounded hover:bg-gray-50"
            >
              🌐 Website Link
            </Link>

            <Link
              href={`/${lang}/dashboard/chatbot/${selectBot}/sources/file`}
              className="block w-full text-center py-2 border rounded hover:bg-gray-50"
            >
              📄 Upload File (PDF/DOCX/TXT)
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
