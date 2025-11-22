"use client";
import { useState } from "react";
import { API_URL } from "../../../../../api/config";

export default function NewTemplatePage() {
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [theme, setTheme] = useState("modern");
  const [sections, setSections] = useState("hero, menu, about, contact");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleUpload() {
    if (!id || !name) {
      setMsg("❌ Please fill in Template ID and Name.");
      return;
    }

    setLoading(true);
    setMsg("");

    const body = {
      id,
      name,
      theme,
      sections: sections
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0),
      pages: {
        hero: { title: "{name}", subtitle: "{tagline}" },
        about: { text: "Describe your brand story here." },
        contact: { address: "{contact.address}", phone: "{contact.phone}" },
      },
      products: [
        { item: "Sample Product 1", price: "$10.00" },
        { item: "Sample Product 2", price: "$15.00" },
      ],
    };

    try {
      const res = await fetch(`${API_URL}/template/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        setMsg("✅ Template uploaded successfully!");
        setId("");
        setName("");
        setSections("hero, menu, about, contact");
      } else {
        setMsg("❌ " + (data.error || "Upload failed"));
      }
    } catch (e: any) {
      setMsg("❌ " + e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Upload New Template</h1>

      <div className="space-y-4">
        <div>
          <label className="block text-sm mb-1 font-medium">Template ID</label>
          <input
            className="w-full border px-3 py-2 rounded"
            placeholder="e.g. kopitiam"
            value={id}
            onChange={(e) => setId(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm mb-1 font-medium">Template Name</label>
          <input
            className="w-full border px-3 py-2 rounded"
            placeholder="e.g. Kopitiam Classic"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm mb-1 font-medium">Theme</label>
          <select
            className="w-full border px-3 py-2 rounded"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
          >
            <option value="modern">Modern</option>
            <option value="heritage">Heritage (Kopitiam)</option>
            <option value="minimal">Minimal</option>
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1 font-medium">Sections (comma separated)</label>
          <input
            className="w-full border px-3 py-2 rounded"
            placeholder="e.g. hero, menu, about, contact"
            value={sections}
            onChange={(e) => setSections(e.target.value)}
          />
        </div>

        <button
          onClick={handleUpload}
          disabled={loading}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg"
        >
          {loading ? "Uploading..." : "Upload Template"}
        </button>

        {msg && <p className="mt-3 text-sm">{msg}</p>}
      </div>
    </div>
  );
}
