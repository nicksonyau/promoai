"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

interface Lead {
  name?: string;
  phone?: string;
  email?: string;
  source?: string;
  stage?: string;
  chatbotId?: string;
  sessionId?: string;
  createdAt?: number;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function LeadDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [lead, setLead] = useState<Lead | null>(null);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  // -------------------------
  // LOAD LEAD + CHAT HISTORY
  // -------------------------
  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch(`/lead/history?id=${id}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load lead");
      }

      setLead(data.lead || null);
      setChat(data.chat || []);
    } catch (err: any) {
      console.error("Lead history error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) void load();
  }, [id]);

  // -------------------------
  // UI STATES
  // -------------------------
  if (loading)
    return <div className="p-10 text-gray-500 text-center">Loading lead...</div>;

  if (error)
    return (
      <div className="p-10 text-red-500 text-center">
        Failed to load lead: {error}
      </div>
    );

  if (!lead)
    return <div className="p-10 text-gray-400 text-center">Lead not found</div>;

  // -------------------------
  // PAGE UI
  // -------------------------
  return (
    <div className="p-10 max-w-5xl mx-auto space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Lead Detail</h1>
        <Link
          href="../"
          className="text-sm px-3 py-1 border rounded hover:bg-gray-50"
        >
          Back
        </Link>
      </div>

      {/* LEAD INFO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white rounded-lg p-4 border">

        <Info label="Name" value={lead.name || "Unknown"} />
        <Info label="Email" value={lead.email || "-"} />
        <Info label="Phone" value={lead.phone || "-"} />
        <Info label="Source" value={lead.source || "Chatbot"} />
        <Info label="Stage" value={lead.stage || "new"} />
        <Info
          label="Created"
          value={
            lead.createdAt
              ? new Date(lead.createdAt).toLocaleString()
              : "-"
          }
        />

      </div>

      {/* CHAT HISTORY */}
      <div className="border rounded-lg bg-white">
        <div className="p-3 font-semibold border-b">
          Chat Conversation
        </div>

        <div className="p-4 space-y-2 max-h-[65vh] overflow-y-auto">

          {chat.length === 0 && (
            <div className="text-gray-400 text-center">
              No chat history for this lead.
            </div>
          )}

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

    </div>
  );
}

// --------------------------------
// DISPLAY COMPONENT
// --------------------------------
function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="font-medium">{value || "-"}</div>
    </div>
  );
}
