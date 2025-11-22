"use client";
import { useEffect, useState } from "react";
import { API_URL } from "../../../../../api/config";

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
    fetch(`${API_URL}/fnb/templates`)
      .then((res) => res.json())
      .then((data) => setTemplates(data.templates || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Templates</h1>
        <a
          href="/dashboard/admin/fnb/templates/new"
          className="px-4 py-2 bg-purple-600 text-white rounded-lg"
        >
          + Upload New Template
        </a>
      </div>

      {loading ? (
        <p>Loading templates...</p>
      ) : templates.length === 0 ? (
        <p className="text-gray-500">No templates found. Upload one to get started.</p>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {templates.map((t) => (
            <div
              key={t.id}
              className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition"
            >
              <h2 className="text-lg font-semibold">{t.name}</h2>
              <p className="text-sm text-gray-500">Theme: {t.theme}</p>
              <p className="text-sm mt-1">
                Sections: {t.sections?.join(", ") || "N/A"}
              </p>
              <a
                href={`/dashboard/admin/templates/${t.id}`}
                className="text-purple-600 text-sm mt-2 inline-block"
              >
                View Details →
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}