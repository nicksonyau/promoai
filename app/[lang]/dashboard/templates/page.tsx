"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import {
  Plus,
  CheckCircle,
  Clock,
  XCircle,
  Pencil,
  Trash2,
  Send,
} from "lucide-react";

type Template = {
  id: string;
  name: string;
  category: "UTILITY" | "AUTHENTICATION" | "MARKETING";
  language: string;
  status?: "draft" | "submitted" | "approved" | "rejected";
  createdAt?: string;
};

function formatDateTimeUTC(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";

  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mi = String(d.getUTCMinutes()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd} ${hh}:${mi} UTC`;
}

export default function TemplatesPage() {
  const { lang } = useParams<{ lang: string }>();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await apiFetch("/watemplates");
      const data = await res.json();
      if (data?.success) setTemplates(data.templates || []);
      else setTemplates([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function renderStatus(status?: string) {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 text-green-700">
            <CheckCircle className="w-4 h-4" /> Approved
          </span>
        );
      case "submitted":
        return (
          <span className="inline-flex items-center gap-1 text-yellow-700">
            <Clock className="w-4 h-4" /> Submitted
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 text-red-700">
            <XCircle className="w-4 h-4" /> Rejected
          </span>
        );
      default:
        return <span className="text-gray-500">Draft</span>;
    }
  }

  function canEdit(t: Template) {
    return t.status === "draft" || t.status === "rejected" || !t.status;
  }

  function canSubmit(t: Template) {
    return t.status === "draft" || t.status === "rejected" || !t.status;
  }

  async function handleDelete(id: string) {
    const ok = window.confirm("Delete this template? This cannot be undone.");
    if (!ok) return;

    try {
      setDeletingId(id);
      const res = await apiFetch(`/watemplates/delete/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok || !data?.success) {
        alert(data?.error || "Failed to delete template");
        return;
      }

      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch (e: any) {
      alert(e?.message || "Failed to delete template");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSubmit(id: string) {
    const ok = window.confirm("Submit this template for approval?");
    if (!ok) return;

    try {
      setSubmittingId(id);

      const res = await apiFetch(`/watemplates/submit`, {
        method: "POST",
        body: JSON.stringify({ id }),
      });
      const data = await res.json();

      if (!res.ok || !data?.success) {
        alert(data?.error || "Failed to submit template");
        return;
      }

      setTemplates((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: "submitted" } : t))
      );
    } catch (e: any) {
      alert(e?.message || "Failed to submit template");
    } finally {
      setSubmittingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Template Library</h1>
          <p className="text-sm text-gray-500">Templates for broadcast / automation</p>
        </div>

        <Link
          href={`/${lang}/dashboard/templates/create`}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm"
        >
          <Plus className="w-4 h-4" />
          New Template
        </Link>
      </div>

      {/* ✅ softer outer border + subtle shadow */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          {/* ✅ softer header separator */}
          <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
            <tr>
              <th className="px-6 py-3 text-left">Name</th>
              <th className="px-6 py-3 text-center">Category</th>
              <th className="px-6 py-3 text-center">Language</th>
              <th className="px-6 py-3 text-center">Created</th>
              <th className="px-6 py-3 text-center">Status</th>
              <th className="px-6 py-3 text-right">Action</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                  Loading templates…
                </td>
              </tr>
            )}

            {!loading && templates.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                  No templates created yet
                </td>
              </tr>
            )}

            {templates.map((t) => (
              // ✅ ultra-light row separators
              <tr key={t.id} className="border-t border-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{t.name}</td>
                <td className="px-6 py-4 text-center">{t.category}</td>
                <td className="px-6 py-4 text-center">{t.language}</td>
                <td className="px-6 py-4 text-center text-gray-600">
                  {formatDateTimeUTC(t.createdAt)}
                </td>
                <td className="px-6 py-4 text-center">{renderStatus(t.status)}</td>

                <td className="px-6 py-4 text-right">
                  <div className="inline-flex items-center gap-4 justify-end">
                    {canEdit(t) ? (
                      <Link
                        href={`/${lang}/dashboard/templates/${t.id}/edit`}
                        className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-800"
                      >
                        <Pencil className="w-4 h-4" />
                        Edit
                      </Link>
                    ) : (
                      <span className="text-gray-400">Locked</span>
                    )}

                    {canSubmit(t) && (
                      <button
                        onClick={() => handleSubmit(t.id)}
                        disabled={submittingId === t.id}
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 disabled:opacity-50"
                      >
                        <Send className="w-4 h-4" />
                        {submittingId === t.id ? "Submitting..." : "Submit"}
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(t.id)}
                      disabled={deletingId === t.id}
                      className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      {deletingId === t.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
