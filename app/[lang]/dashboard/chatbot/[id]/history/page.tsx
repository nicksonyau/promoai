"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

interface SessionRow {
  sessionId: string;
  ts: number;
  leadId?: string;
  phone?: string;
  email?: string;
  name?: string;
}

export default function ChatbotHistoryPage() {
  const params = useParams();
  const router = useRouter();

  const lang = (params?.lang as string) || "en";
  const chatbotId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<SessionRow[]>([]);

  // -------------------------
  // LOAD SESSION INDEX
  // -------------------------
  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch(`/chatbot/history/list/${chatbotId}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data?.error || "History API not available");
      }

      setRows(data.sessions || []);
    } catch (e: any) {
      setError(e.message || "Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (chatbotId) void load();
  }, [chatbotId]);

  // -------------------------
  // UI
  // -------------------------
  return (
    <div className="p-10 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Chatbot History</h1>
          <p className="text-sm text-gray-500 mt-1">Chatbot ID: {chatbotId}</p>
        </div>

        <Link
          href={`/${lang}/dashboard/chatbot`}
          className="text-sm px-3 py-1 border rounded hover:bg-gray-50"
        >
          Back to chatbots
        </Link>
      </div>

      {/* States */}
      {loading && (
        <div className="p-6 text-gray-500 text-center">Loading sessions…</div>
      )}

      {error && (
        <div className="p-6 text-red-500 text-center">
          {error}
          <div className="text-xs text-gray-400 mt-2">
            Expected API:
            <div className="font-mono">
              GET /chatbot/history/list/{chatbotId}
            </div>
          </div>
        </div>
      )}

      {!loading && !error && rows.length === 0 && (
        <div className="p-6 text-gray-400 text-center">
          No conversations yet.
        </div>
      )}

      {/* Table */}
      {!loading && !error && rows.length > 0 && (
        <div className="border rounded-lg overflow-hidden bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3">When</th>
                <th className="p-3">Session</th>
                <th className="p-3">Lead</th>
                <th className="p-3">Contact</th>
                <th className="p-3 w-32">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.sessionId} className="border-t">
                  <td className="p-3 text-xs text-gray-500">
                    {new Date(s.ts).toLocaleString()}
                  </td>
                  <td className="p-3 font-mono text-xs">
                    {s.sessionId}
                  </td>
                  <td className="p-3">
                    {s.name || s.leadId || "-"}
                  </td>
                  <td className="p-3 text-xs text-gray-600">
                    {s.phone || s.email || "-"}
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() =>
                        router.push(
                          `/${lang}/dashboard/chatbot/${chatbotId}/history/${s.sessionId}`
                        )
                      }
                      className="text-indigo-600 hover:underline"
                    >
                      View
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
