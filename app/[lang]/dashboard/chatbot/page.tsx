"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { API_URL } from "../../../api/config";

interface ChatbotRecord {
  id: string;
  businessName: string;
  updatedAt?: number;
  createdAt?: number;
}

export default function ChatbotListPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ChatbotRecord[]>([]);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const res = await fetch(`${API_URL}/chatbot/list`);
      const data = await res.json();
      setItems(data.list || []);
    } catch (e) {
      console.error("Failed to load chatbot list", e);
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Delete this chatbot?")) return;

    await fetch(`${API_URL}/chatbot/delete/${id}`, { method: "DELETE" });
    load();
  };

  // Duplicate chatbot (users love this)
  const duplicateItem = async (id: string) => {
    if (!confirm("Duplicate this chatbot?")) return;

    const res = await fetch(`${API_URL}/chatbot/configGet/${id}`);
    const data = await res.json();

    if (!data?.success) {
      alert("Cannot duplicate — failed to load chatbot config.");
      return;
    }

    // Remove old id + timestamps
    const newRecord = { ...data.data };
    delete newRecord.chatbotId;
    delete newRecord.createdAt;
    delete newRecord.updatedAt;

    const createRes = await fetch(`${API_URL}/chatbot/configCreate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newRecord),
    });

    const createData = await createRes.json();
    if (createData?.id) {
      alert("Chatbot duplicated.");
      load();
    }
  };

  return (
    <div className="p-10 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Chatbots</h1>

        <Link
          href="/dashboard/chatbot/create"
          className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          + Create New Chatbot
        </Link>
      </div>

      {loading && (
        <div className="text-gray-500 text-center py-10">Loading...</div>
      )}

      {!loading && items.length === 0 && (
        <div className="text-gray-500 text-center py-10">
          No chatbots created yet.
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-100 text-sm">
              <tr>
                <th className="p-3">Chatbot ID</th>
                <th className="p-3">Business Name</th>
                <th className="p-3">Last Updated</th>
                <th className="p-3 w-40">Actions</th>
              </tr>
            </thead>

            <tbody>
              {items.map((bot) => (
                <tr key={bot.id} className="border-t">
                  <td className="p-3 font-mono text-sm">{bot.id}</td>
                  <td className="p-3">{bot.businessName || "-"}</td>
                  <td className="p-3 text-gray-500 text-sm">
                    {bot.updatedAt
                      ? new Date(bot.updatedAt).toLocaleString()
                      : "-"}
                  </td>
                  <td className="p-3 flex gap-4">
                    <Link
                      href={`/dashboard/chatbot/${bot.id}`}
                      className="text-indigo-600 hover:underline"
                    >
                      Edit
                    </Link>

                    <button
                      onClick={() => duplicateItem(bot.id)}
                      className="text-blue-600 hover:underline"
                    >
                      Duplicate
                    </button>

                    <button
                      onClick={() => deleteItem(bot.id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
