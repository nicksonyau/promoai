"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { apiFetch } from "@/lib/api";

interface WebSource {
  id: string;
  url: string;
  status?: "pending" | "indexed" | "error";
  createdAt?: number;
}

export default function ChatbotSourcesPage() {
  const params = useParams();
  const chatbotId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [sources, setSources] = useState<WebSource[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // -------------------------
  // Load Sources
  // -------------------------
  const loadSources = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/chatbot/sources/list/${chatbotId}`);
      const data = await res.json();
      setSources(data.list || []);
    } catch {
      toast.error("Failed to load sources");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (chatbotId) loadSources();
  }, [chatbotId]);

  // -------------------------
  // Add Website Link
  // -------------------------
  const addSource = async () => {
    if (!urlInput.trim()) return toast.error("Enter a valid URL");

    setAdding(true);
    try {
      const res = await apiFetch(`/chatbot/sources/add`, {
        method: "POST",
        body: JSON.stringify({ chatbotId, url: urlInput }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      toast.success("Link added");
      setUrlInput("");
      loadSources();
    } catch (e: any) {
      toast.error(e.message || "Add failed");
    } finally {
      setAdding(false);
    }
  };

  // -------------------------
  // Delete Source
  // -------------------------
  const removeSource = async (id: string) => {
    if (!confirm("Remove this source?")) return;
    await apiFetch(`/chatbot/sources/delete/${id}`, { method: "DELETE" });
    loadSources();
  };

  // -------------------------
  // Process Source (ALWAYS ENABLED)
  // -------------------------
  const processSource = async (id: string) => {
    setProcessingId(id);
    try {
      const res = await apiFetch(`/chatbot/sources/process/${id}`, {
        method: "POST",
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      toast.success("Source processed");
      loadSources();
    } catch (e: any) {
      toast.error(e.message || "Processing failed");
    } finally {
      setProcessingId(null);
    }
  };

  // -------------------------
  // UI
  // -------------------------
  return (
    <div className="p-10 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Knowledge Sources</h1>

      {/* ADD LINK */}
      <div className="bg-white p-5 rounded-xl border mb-6">
        <h2 className="font-semibold mb-3">Add Website Link</h2>
        <div className="flex gap-2">
          <input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com"
            className="flex-1 border px-3 py-2 rounded-md"
          />
          <button
            onClick={addSource}
            disabled={adding}
            className="bg-indigo-600 text-white px-4 rounded-md"
          >
            {adding ? "Adding…" : "Add"}
          </button>
        </div>
      </div>

      {/* SOURCE LIST */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="p-4 font-semibold">Web Sources</div>

        {loading && (
          <div className="p-6 text-gray-400 text-center">Loading...</div>
        )}

        {!loading && sources.length === 0 && (
          <div className="p-6 text-gray-400 text-center">No links added yet</div>
        )}

        {!loading && sources.length > 0 && (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">URL</th>
                <th className="p-3">Status</th>
                <th className="p-3 w-48">Action</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="p-3 break-all">{s.url}</td>
                  <td className="p-3 text-center">
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="p-3 text-center space-x-3">
                    {/* PROCESS BUTTON (ALWAYS SHOWN) */}
                    <button
                      onClick={() => processSource(s.id)}
                      disabled={processingId === s.id}
                      className="bg-black text-white px-3 py-1 rounded text-xs disabled:opacity-50"
                    >
                      {processingId === s.id ? "Processing…" : "Process"}
                    </button>

                    <button
                      onClick={() => removeSource(s.id)}
                      className="text-red-500 hover:underline text-xs"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status?: string }) {
  if (status === "indexed")
    return <span className="text-green-600 font-medium">Indexed</span>;
  if (status === "error")
    return <span className="text-red-600 font-medium">Error</span>;
  return <span className="text-gray-400">Pending</span>;
}
