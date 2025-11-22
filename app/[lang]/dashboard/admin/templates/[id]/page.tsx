"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { API_URL } from "../../../../../api/config";

type Template = {
  id: string;
  name: string;
  theme: string;
  sections?: string[];
};

export default function TemplateDetailPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();

  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 🚀 Fetch template
  useEffect(() => {
    if (!id) return;

    fetch(`${API_URL}/template/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Template not found");
        return res.json();
      })
      .then((data) => {
        // ensure mapping to correct state
        setTemplate({
          id: data.id,
          name: data.name || "",
          theme: data.theme || "",
          sections: data.sections || [],
        });
      })
      .catch((err) => console.error("Failed to load template", err))
      .finally(() => setLoading(false));
  }, [id]);

  // 🚀 Save updates
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!template) return;

    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/template/update/${template.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(template),
      });

      if (!res.ok) {
        const errMsg = await res.text();
        throw new Error(errMsg);
      }

      alert("Template updated successfully!");
      router.push("/dashboard/admin/templates");
    } catch (err: any) {
      alert("Update failed: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="p-6">Loading...</p>;
  if (!template) return <p className="p-6">Template not found.</p>;

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Edit Template</h1>
      <form onSubmit={handleSave} className="space-y-4">
        {/* Template ID */}
        <div>
          <label className="block text-sm font-medium mb-1">Template ID</label>
          <input
            type="text"
            value={template.id}
            disabled
            className="w-full border px-3 py-2 rounded bg-gray-100 text-gray-600"
          />
        </div>

        {/* Template Name */}
        <div>
          <label className="block text-sm font-medium mb-1">Template Name</label>
          <input
            type="text"
            value={template.name}
            onChange={(e) => setTemplate({ ...template, name: e.target.value })}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>

        {/* Theme */}
        <div>
          <label className="block text-sm font-medium mb-1">Theme</label>
          <select
            value={template.theme}
            onChange={(e) => setTemplate({ ...template, theme: e.target.value })}
            className="w-full border px-3 py-2 rounded"
            required
          >
            <option value="">Select Theme</option>
            <option value="modern">Modern</option>
            <option value="heritage">Heritage (Kopitiam)</option>
            <option value="minimal">Minimal</option>
          </select>
        </div>

        {/* Sections */}
        <div>
          <label className="block text-sm font-medium mb-1">Sections (comma separated)</label>
          <input
            type="text"
            value={template.sections?.join(", ") || ""}
            onChange={(e) =>
              setTemplate({
                ...template,
                sections: e.target.value.split(",").map((s) => s.trim()),
              })
            }
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        {/* Save button */}
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg"
        >
          {saving ? "Saving..." : "Update Template"}
        </button>
      </form>
    </div>
  );
}
