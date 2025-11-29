"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";  // ← ONLY THIS LINE ADDED

export default function EditChatbotPage() {
  const { id } = useParams();
  const chatbotId = id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("persona");

  const [form, setForm] = useState<any>({});

  const update = (key: string, value: string) => {
    setForm((prev: any) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const res = await apiFetch(`/chatbot/configGet/${chatbotId}`);  // ← uses token
      const data = await res.json();

      if (data?.success && data?.data) {
        setForm(data.data);
      }
    } catch (err) {
      console.error("Failed to load chatbot config", err);
    }
    setLoading(false);
  };

  const onSave = async () => {
    setSaving(true);
    try {
      await apiFetch(`/chatbot/configUpdate/${chatbotId}`, {  // ← uses token
        method: "PUT",
        body: JSON.stringify(form),
      });
    } catch (err) {
      console.error("Error saving chatbot", err);
    }
    setSaving(false);
  };

  const tabs = [
    { id: "persona", label: "AI Persona" },
    { id: "business", label: "Business" },
    { id: "menu", label: "Menu" },
    { id: "lead", label: "Lead Capture" },
    { id: "promo", label: "Sales Intelligence" },
    { id: "behavior", label: "Behavior" },
  ];

  if (loading) {
    return (
      <div className="p-10 text-center text-gray-500">Loading chatbot...</div>
    );
  }

  return (
    <div className="p-10 max-w-6xl mx-auto">
      <div className="p-4 bg-indigo-50 border border-indigo-200 rounded mb-6 flex justify-between">
        <div className="font-semibold text-indigo-700">
          Editing Chatbot: {chatbotId}
        </div>

        <button
          onClick={() => navigator.clipboard.writeText(chatbotId)}
          className="text-indigo-600 underline"
        >
          Copy ID
        </button>
      </div>

      <h1 className="text-3xl font-bold mb-6">Edit Chatbot</h1>

      <div className="flex mb-8 border-b">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-5 py-3 -mb-px border-b-2 text-sm font-medium transition-all
              ${
                activeTab === t.id
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-indigo-600"
              }
            `}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ALL YOUR ORIGINAL PANELS — 100% UNCHANGED */}
      <Panel isActive={activeTab === "persona"}>
        <Section title="AI Role">
          <textarea rows={5} className="w-full p-3 border rounded" value={form.aiRole || ""} onChange={(e) => update("aiRole", e.target.value)} />
        </Section>
        <Section title="Tone of Voice">
          <input className="w-full p-3 border rounded" value={form.toneOfVoice || ""} onChange={(e) => update("toneOfVoice", e.target.value)} />
        </Section>
        <Section title="Do Rules">
          <textarea rows={4} className="w-full p-3 border rounded" value={form.doRules || ""} onChange={(e) => update("doRules", e.target.value)} />
        </Section>
        <Section title="Don't Rules">
          <textarea rows={4} className="w-full p-3 border rounded" value={form.dontRules || ""} onChange={(e) => update("dontRules", e.target.value)} />
        </Section>
      </Panel>

      {/* BUSINESS */}
      <Panel isActive={activeTab === "business"}>
        <Section title="Business Name">
          <input className="w-full p-3 border rounded" value={form.businessName || ""} onChange={(e) => update("businessName", e.target.value)} />
        </Section>
        <Section title="Brand Tagline">
          <input className="w-full p-3 border rounded" value={form.brandTagline || ""} onChange={(e) => update("brandTagline", e.target.value)} />
        </Section>
        <Section title="Business Description">
          <textarea rows={4} className="w-full p-3 border rounded" value={form.businessDescription || ""} onChange={(e) => update("businessDescription", e.target.value)} />
        </Section>
        <Section title="Operating Hours">
          <input className="w-full p-3 border rounded" value={form.operatingHours || ""} onChange={(e) => update("operatingHours", e.target.value)} />
        </Section>
        <Section title="Location">
          <input className="w-full p-3 border rounded" value={form.location || ""} onChange={(e) => update("location", e.target.value)} />
        </Section>
        <Section title="Social Links">
          <textarea rows={3} className="w-full p-3 border rounded" value={form.socialLinks || ""} onChange={(e) => update("socialLinks", e.target.value)} />
        </Section>
      </Panel>

      {/* MENU */}
      <Panel isActive={activeTab === "menu"}>
        <Section title="Quick Menu (one per line)">
          <textarea rows={10} className="w-full p-3 border rounded" value={form.quickMenu || ""} onChange={(e) => update("quickMenu", e.target.value)} />
        </Section>
      </Panel>

      {/* LEAD */}
      <Panel isActive={activeTab === "lead"}>
        <Section title="Lead Goal">
          <textarea rows={3} className="w-full p-3 border rounded" value={form.goal || ""} onChange={(e) => update("goal", e.target.value)} />
        </Section>
        <Section title="Lead Priority Field">
          <input className="w-full p-3 border rounded" value={form.leadPriorityField || ""} onChange={(e) => update("leadPriorityField", e.target.value)} />
        </Section>
        <Section title="Lead Capture Message">
          <textarea rows={3} className="w-full p-3 border rounded" value={form.leadCaptureMessage || ""} onChange={(e) => update("leadCaptureMessage", e.target.value)} />
        </Section>
      </Panel>

      {/* PROMO */}
      <Panel isActive={activeTab === "promo"}>
        <Section title="Selling Points">
          <textarea rows={3} className="w-full p-3 border rounded" value={form.sellingPoints || ""} onChange={(e) => update("sellingPoints", e.target.value)} />
        </Section>
        <Section title="Best Sellers">
          <textarea rows={3} className="w-full p-3 border rounded" value={form.bestSellers || ""} onChange={(e) => update("bestSellers", e.target.value)} />
        </Section>
        <Section title="Promo Logic Source">
          <input className="w-full p-3 border rounded" value={form.promoLogicSource || ""} onChange={(e) => update("promoLogicSource", e.target.value)} />
        </Section>
      </Panel>

      {/* BEHAVIOR */}
      <Panel isActive={activeTab === "behavior"}>
        <Section title="Default Greeting">
          <textarea rows={3} className="w-full p-3 border rounded" value={form.defaultGreeting || ""} onChange={(e) => update("defaultGreeting", e.target.value)} />
        </Section>
        <Section title="Fallback Message">
          <textarea rows={3} className="w-full p-3 border rounded" value={form.fallbackMessage || ""} onChange={(e) => update("fallbackMessage", e.target.value)} />
        </Section>
        <Section title="Closing Message">
          <textarea rows={3} className="w-full p-3 border rounded" value={form.closingMessage || ""} onChange={(e) => update("closingMessage", e.target.value)} />
        </Section>
      </Panel>

      <button
        onClick={onSave}
        disabled={saving}
        className="mt-10 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold"
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}

function Panel({ isActive, children }: any) {
  return <div className={isActive ? "" : "hidden"}>{children}</div>;
}

function Section({ title, children }: any) {
  return (
    <div className="mb-6">
      <div className="font-semibold mb-1">{title}</div>
      {children}
    </div>
  );
}