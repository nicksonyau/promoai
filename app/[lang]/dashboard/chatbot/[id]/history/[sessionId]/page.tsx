"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function ChatSessionReplayPage() {
  const params = useParams();

  const lang = (params?.lang as string) || "en";
  const chatbotId = params?.id as string;
  const sessionId = params?.sessionId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chat, setChat] = useState<ChatMessage[]>([]);

  // -------------------------
  // LOAD SESSION CHAT
  // -------------------------
  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch(
        `/chatbot/history/session/${chatbotId}/${sessionId}`
      );
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data?.error || "History API not available");
      }

      setChat(data.chat || []);
    } catch (e: any) {
      setError(e.message || "Failed to load session");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (chatbotId && sessionId) void load();
  }, [chatbotId, sessionId]);

  // -------------------------
  // UI
  // -------------------------
  return (
    <div className="p-10 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Chat Session</h1>
          <p className="text-xs text-gray-500 mt-1">
            {chatbotId} / {sessionId}
          </p>
        </div>
        <Link
          href={`/${lang}/dashboard/chatbot/${chatbotId}/history`}
          className="text-sm px-3 py-1 border rounded hover:bg-gray-50"
        >
          Back to history
        </Link>
      </div>

      {/* States */}
      {loading && (
        <div className="p-6 text-gray-500 text-center">Loading chat…</div>
      )}

      {error && (
        <div className="p-6 text-red-500 text-center">
          {error}
          <div className="text-xs text-gray-400 mt-2">
            Expected API:
            <div className="font-mono">
              GET /chatbot/history/session/{chatbotId}/{sessionId}
            </div>
          </div>
        </div>
      )}

      {!loading && !error && chat.length === 0 && (
        <div className="p-6 text-gray-400 text-center">
          No messages in this session.
        </div>
      )}

      {/* Chat bubble UI */}
      {!loading && !error && chat.length > 0 && (
        <div className="border rounded-lg bg-white">
          <div className="p-3 font-semibold border-b">
            Conversation
          </div>

          <div className="p-4 space-y-2 max-h-[70vh] overflow-y-auto">
            {chat.map((m, i) => (
              <div
                key={i}
                className={`flex ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`rounded-lg px-3 py-2 max-w-[70%] text-sm ${
                    m.role === "user"
                      ? "bg-indigo-100 text-indigo-900"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
