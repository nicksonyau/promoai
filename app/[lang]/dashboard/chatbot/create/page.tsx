"use client";

import { useState, useEffect } from "react";
import { API_URL } from "../../../../api/config";

export default function ChatbotSetupPage() {
  const [activeTab, setActiveTab] = useState("persona");
  const [saving, setSaving] = useState(false);
  const [chatbotId, setChatbotId] = useState<string | null>(null);

  const DEFAULTS = {
    aiRole: "You are a friendly and helpful AI assistant for this business. You greet customers warmly, answer questions clearly, and help them make decisions. You never guess missing information—ask politely instead.",
    toneOfVoice: "Warm, friendly, concise, helpful, professional.",
    doRules: `• Give simple and clear answers\n• Be proactive and helpful\n• Suggest actions the customer can take\n• Ask for missing details if needed\n• Keep responses short (2–4 sentences)`,
    dontRules: `• Don't guess details about the business\n• Don't give long paragraphs\n• Don't use slang or emojis excessively\n• Don't refuse service unless necessary`,
    businessName: "",
    brandTagline: "",
    businessDescription: "We are a small business serving our local community with quality products and great service.",
    industry: "General Business",
    category: "General Services",
    operatingHours: "Mon–Sun: 10:00 AM – 10:00 PM",
    location: "Please share your location/address",
    socialLinks: "",
    goal: "Encourage customers to order, book, visit or contact the business.",
    leadPriorityField: "whatsapp",
    leadCaptureMessage: "I can help you with that! May I have your name and WhatsApp number so our team can contact you?",
    sellingPoints: "Affordable pricing; friendly service; trusted by local customers.",
    bestSellers: "Top 3 best-selling items or services will be highlighted here.",
    promoLogicSource: "promo-default",
    defaultGreeting: "Hi there! How can I help you today? Here are a few things you can ask me:\n• View today’s promotions\n• Check product/menu items\n• Ask about opening hours\n• Make a reservation/order\n• Get directions",
    fallbackMessage: "I'm here to help, but I may need a bit more info. Could you clarify your question?",
    closingMessage: "Happy to help! If you have more questions, just let me know anytime.",
    quickMenu: `View promotions
Check products/services
Opening hours
Location
WhatsApp contact
Make an enquiry
Best sellers
Ask a question`,
  };

  const [form, setForm] = useState<typeof DEFAULTS>(DEFAULTS);

  const update = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    setChatbotId(null);
    setForm(DEFAULTS);
  }, []);

  const onSubmit = async () => {
    setSaving(true);

    try {
      // ONLY ADDED: Get session token silently (exactly like ChatGPT)
      const token = localStorage.getItem("sessionToken");

      const res = await fetch(`${API_URL}/chatbot/configCreate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // This line is safe — if no token, it sends nothing
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (data?.id) {
        setChatbotId(data.id);
        try {
          localStorage.setItem("businessChatbotId", data.id);
        } catch {}
      }
    } catch (err) {
      console.error("Failed to create chatbot", err);
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: "persona", label: "AI Persona" },
    { id: "business", label: "Business" },
    { id: "menu", label: "Menu" },
    { id: "lead", label: "Lead Capture" },
    { id: "promo", label: "Sales Intelligence" },
    { id: "behavior", label: "Behavior" },
  ];

  return (
    <div className="p-10 max-w-6xl mx-auto">
      <div className="p-4 bg-indigo-50 border border-indigo-200 rounded mb-6 flex justify-between">
        <div className="font-semibold text-indigo-700">
          Chatbot ID: {chatbotId ?? "Not created yet"}
        </div>

        {chatbotId && (
          <button
            onClick={() => navigator.clipboard.writeText(chatbotId)}
            className="text-indigo-600 underline"
          >
            Copy
          </button>
        )}
      </div>

      <h1 className="text-3xl font-bold mb-6">Business Chatbot Setup</h1>

      <div className="flex mb-8 border-b">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-5 py-3 -mb-px border-b-2 text-sm font-medium transition-all ${
              activeTab === t.id
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-indigo-600"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ALL YOUR ORIGINAL PANELS — 100% UNCHANGED */}
      <Panel isActive={activeTab === "persona"}>
        <Section title="AI Role">
          <textarea rows={5} className="w-full p-3 border rounded" value={form.aiRole} onChange={(e) => update("aiRole", e.target.value)} />
        </Section>
        <Section title="Tone of Voice">
          <input className="w-full p-3 border rounded" value={form.toneOfVoice} onChange={(e) => update("toneOfVoice", e.target.value)} />
        </Section>
        <Section title="Do Rules">
          <textarea rows={4} className="w-full p-3 border rounded" value={form.doRules} onChange={(e) => update("doRules", e.target.value)} />
        </Section>
        <Section title="Don't Rules">
          <textarea rows={4} className="w-full p-3 border rounded" value={form.dontRules} onChange={(e) => update("dontRules", e.target.value)} />
        </Section>
      </Panel>

      <Panel isActive={activeTab === "business"}>
        <Section title="Business Name">
          <input className="w-full p-3 border rounded" value={form.businessName} onChange={(e) => update("businessName", e.target.value)} />
        </Section>
        <Section title="Brand Tagline">
          <input className="w-full p-3 border rounded" value={form.brandTagline} onChange={(e) => update("brandTagline", e.target.value)} />
        </Section>
        <Section title="Business Description">
          <textarea rows={4} className="w-full p-3 border rounded" value={form.businessDescription} onChange={(e) => update("businessDescription", e.target.value)} />
        </Section>
        <Section title="Operating Hours">
          <input className="w-full p-3 border rounded" value={form.operatingHours} onChange={(e) => update("operatingHours", e.target.value)} />
        </Section>
        <Section title="Location">
          <input className="w-full p-3 border rounded" value={form.location} onChange={(e) => update("location", e.target.value)} />
        </Section>
        <Section title="Social Links">
          <textarea rows={3} className="w-full p-3 border rounded" value={form.socialLinks} onChange={(e) => update("socialLinks", e.target.value)} />
        </Section>
      </Panel>

      <Panel isActive={activeTab === "menu"}>
        <Section title="Quick Menu (one per line)">
          <textarea rows={10} className="w-full p-3 border rounded" value={form.quickMenu} onChange={(e) => update("quickMenu", e.target.value)} />
        </Section>
      </Panel>

      <Panel isActive={activeTab === "lead"}>
        <Section title="Lead Goal">
          <textarea rows={3} className="w-full p-3 border rounded" value={form.goal} onChange={(e) => update("goal", e.target.value)} />
        </Section>
        <Section title="Lead Priority Field">
          <input className="w-full p-3 border rounded" value={form.leadPriorityField} onChange={(e) => update("leadPriorityField", e.target.value)} />
        </Section>
        <Section title="Lead Capture Message">
          <textarea rows={3} className="w-full p-3 border rounded" value={form.leadCaptureMessage} onChange={(e) => update("leadCaptureMessage", e.target.value)} />
        </Section>
      </Panel>

      <Panel isActive={activeTab === "promo"}>
        <Section title="Selling Points">
          <textarea rows={3} className="w-full p-3 border rounded" value={form.sellingPoints} onChange={(e) => update("sellingPoints", e.target.value)} />
        </Section>
        <Section title="Best Sellers">
          <textarea rows={3} className="w-full p-3 border rounded" value={form.bestSellers} onChange={(e) => update("bestSellers", e.target.value)} />
        </Section>
        <Section title="Promo Logic Source">
          <input className="w-full p-3 border rounded" value={form.promoLogicSource} onChange={(e) => update("promoLogicSource", e.target.value)} />
        </Section>
      </Panel>

      <Panel isActive={activeTab === "behavior"}>
        <Section title="Default Greeting">
          <textarea rows={3} className="w-full p-3 border rounded" value={form.defaultGreeting} onChange={(e) => update("defaultGreeting", e.target.value)} />
        </Section>
        <Section title="Fallback Message">
          <textarea rows={3} className="w-full p-3 border rounded" value={form.fallbackMessage} onChange={(e) => update("fallbackMessage", e.target.value)} />
        </Section>
        <Section title="Closing Message">
          <textarea rows={3} className="w-full p-3 border rounded" value={form.closingMessage} onChange={(e) => update("closingMessage", e.target.value)} />
        </Section>
      </Panel>

      <button
        onClick={onSubmit}
        disabled={saving}
        className="mt-10 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold"
      >
        {saving ? "Saving..." : "Save Settings"}
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