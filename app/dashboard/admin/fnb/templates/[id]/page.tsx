"use client";
import { useState } from "react";
import { API_URL } from "../../../../../api/config";

export default function NewTemplatePage() {
  const [id, setId] = useState("kopitiam");
  const [name, setName] = useState("Kopitiam Classic");
  const [theme, setTheme] = useState("heritage");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleUpload() {
    setLoading(true);
    setMsg("");

    const body = {
      id,
      name,
      theme,
      sections: ["hero", "menu", "about", "contact"],
      pages: {
        hero: { title: "{name}", subtitle: "{tagline}" },
        menu: {
          items: [
            { item: "Kaya Toast", price: "RM 3.50" },
            { item: "Nasi Lemak", price: "RM 8.90" },
            { item: "White Coffee", price: "RM 4.50" }
          ]
        },
        about: { text: "Serving Malaysians with the true taste of kopitiam." },
        contact: { address: "{contact.address}", phone: "{contact.phone}" }
      },
      products: [
        { item: "Kaya Toast", price: "RM 3.50" },
        { item: "Soft-boiled Eggs", price: "RM 4.00" },
        { item: "White Coffee", price: "RM 4.50" }
      ]
    };

    try {
      const res = await fetch(`${API_URL}/fnb/template/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setMsg("✅ Template uploaded successfully!");
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
      <h1 className="text-2xl font-bold mb-4">Upload New FnB Template</h1>
      <div className="space-y-4">
        <div>
          <label className="block text-sm">Template ID</label>
          <input
            className="w-full border px-3 py-2 rounded"
            value={id}
            onChange={(e) => setId(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm">Template Name</label>
          <input
            className="w-full border px-3 py-2 rounded"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm">Theme</label>
          <select
            className="w-full border px-3 py-2 rounded"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
          >
            <option value="heritage">Heritage (Kopitiam)</option>
            <option value="modern">Modern Café</option>
            <option value="minimal">Minimal</option>
          </select>
        </div>
        <button
          onClick={handleUpload}
          disabled={loading}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg"
        >
          {loading ? "Uploading..." : "Upload Template"}
        </button>
        {msg && <p className="mt-3">{msg}</p>}
      </div>
    </div>
  );
}