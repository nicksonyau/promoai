"use client";
import { useEffect, useState } from "react";
import { API_URL } from "../../../../api/config";

type Template = {
  id: string;
  name: string;
  theme: string;
  sections: string[];
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/templates`)
      .then((res) => res.json())
      .then((data) => setTemplates(data.templates || []))
      .finally(() => setLoading(false));
  }, []);

  // 🚀 DELETE function
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      const res = await fetch(`${API_URL}/template/delete/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        // ✅ refresh list after delete
        const refreshed = await fetch(`${API_URL}/templates`).then((r) =>
          r.json()
        );
        setTemplates(refreshed.templates || []);
      } else {
        const errMsg = await res.text();
        alert("Failed to delete template: " + errMsg);
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Something went wrong");
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Templates</h1>
        <a
          href="/dashboard/admin/templates/new"
          className="px-4 py-2 bg-purple-600 text-white rounded-lg"
        >
          + Upload New Template
        </a>
      </div>

      {loading ? (
        <p>Loading templates...</p>
      ) : templates.length === 0 ? (
        <p className="text-gray-500">
          No templates found. Upload one to get started.
        </p>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {templates.map((t) => (
            <div
              key={t.id}
              className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <h2 className="text-lg font-semibold">{t.name}</h2>
                <p className="text-sm text-gray-500">Theme: {t.theme}</p>
                <p className="text-sm mt-1">
                  Sections: {t.sections?.join(", ") || "N/A"}
                </p>
              </div>
              <div className="flex justify-between items-center mt-4 space-x-4">
                <a
                  href={`/dashboard/admin/templates/${t.id}`}
                  className="text-purple-600 text-sm font-medium hover:underline"
                >
                  View Details →
                </a>
                  
                <a
                  href={`/preview/${t.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 text-sm font-medium hover:underline"
                >
                  Preview
                </a>
                
                <button
                  onClick={() => handleDelete(t.id)}
                  className="text-red-600 text-sm font-medium hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
