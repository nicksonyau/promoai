"use client";

import { useCallback } from "react";

/**
 * Duplicate type (avoid circular import)
 */
export interface ChatbotFormData {
  aiRole: string;
  toneOfVoice: string;
  doRules: string;
  dontRules: string;

  businessName: string;
  brandTagline: string;
  businessDescription: string;
  industry: string;
  category: string;
  operatingHours: string;
  location: string;
  socialLinks: string;

  goal: string;
  leadPriorityField: string;
  leadCaptureMessage: string;

  sellingPoints: string;
  bestSellers: string;
  promoLogicSource: string;

  defaultGreeting: string;
  fallbackMessage: string;
  closingMessage: string;

  quickMenu: string;
}

interface Props {
  form: ChatbotFormData;
  setForm: (v: ChatbotFormData) => void;
  saving: boolean;
  onSubmit: () => void;
  activeTab: string;
}

export default function ChatbotForm({
  form,
  setForm,
  saving,
  onSubmit,
  activeTab,
}: Props) {
  const update = useCallback(
    (key: keyof ChatbotFormData, value: string) =>
      setForm((prev) => ({ ...prev, [key]: value })),
    [setForm]
  );

  const Input = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
  }) => (
    <label className="block space-y-1 w-full">
      <div className="font-medium">{label}</div>
      <input
        className="border rounded p-2 w-full min-w-0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );

  const Text = ({
    label,
    value,
    rows = 4,
    onChange,
  }: {
    label: string;
    value: string;
    rows?: number;
    onChange: (v: string) => void;
  }) => (
    <label className="block space-y-1 w-full">
      <div className="font-medium">{label}</div>
      <textarea
        className="border rounded p-2 w-full min-w-0"
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );

  return (
    <div className="space-y-10">

      {/* PERSONA */}
      <div className={activeTab === "persona" ? "block" : "hidden"}>
        <div className="space-y-6">
          <Text label="AI Role" value={form.aiRole} rows={5} onChange={(v) => update("aiRole", v)} />
          <Text label="Tone of Voice" value={form.toneOfVoice} onChange={(v) => update("toneOfVoice", v)} />
          <Text label="Do Rules" rows={5} value={form.doRules} onChange={(v) => update("doRules", v)} />
          <Text label="Don't Rules" rows={5} value={form.dontRules} onChange={(v) => update("dontRules", v)} />
        </div>
      </div>

      {/* BUSINESS */}
      <div className={activeTab === "business" ? "block" : "hidden"}>
        <div className="space-y-6">
          <Input label="Business Name" value={form.businessName} onChange={(v) => update("businessName", v)} />
          <Input label="Brand Tagline" value={form.brandTagline} onChange={(v) => update("brandTagline", v)} />
          <Text label="Business Description" value={form.businessDescription} onChange={(v) => update("businessDescription", v)} />

          <label className="block space-y-1 w-full">
            <div className="font-medium">Industry</div>
            <select
              className="border rounded p-2 w-full min-w-0"
              value={form.industry}
              onChange={(e) => update("industry", e.target.value)}
            >
              <option value="F&B">Food & Beverage</option>
              <option value="Retail">Retail</option>
              <option value="Beauty">Beauty & Wellness</option>
              <option value="Services">Services</option>
              <option value="Education">Education</option>
              <option value="Fitness">Fitness & Sports</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Hotel">Hotel & Accommodation</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Automotive">Automotive</option>
              <option value="General Business">General Business</option>
            </select>
          </label>

          <label className="block space-y-1 w-full">
            <div className="font-medium">Category</div>
            <select
              className="border rounded p-2 w-full min-w-0"
              value={form.category}
              onChange={(e) => update("category", e.target.value)}
            >
              <option value="Cafe">Cafe</option>
              <option value="Restaurant">Restaurant</option>
              <option value="Bar">Bar & Lounge</option>
              <option value="Bakery">Bakery</option>
              <option value="Clothing">Clothing & Apparel</option>
              <option value="Supermarket">Supermarket / Grocery</option>
              <option value="Salon">Salon / Hair / Nails</option>
              <option value="Spa">Spa & Massage</option>
              <option value="Repair">Repair Services</option>
              <option value="Coaching">Coaching & Classes</option>
              <option value="General Services">General Services</option>
            </select>
          </label>

          <Input label="Operating Hours" value={form.operatingHours} onChange={(v) => update("operatingHours", v)} />
          <Input label="Location" value={form.location} onChange={(v) => update("location", v)} />
          <Text label="Social Links" rows={3} value={form.socialLinks} onChange={(v) => update("socialLinks", v)} />
        </div>
      </div>

      {/* LEAD */}
      <div className={activeTab === "lead" ? "block" : "hidden"}>
        <div className="space-y-6">
          <Text label="Lead Goal" value={form.goal} onChange={(v) => update("goal", v)} />
          <Input label="Lead Priority Field" value={form.leadPriorityField} onChange={(v) => update("leadPriorityField", v)} />
          <Text label="Lead Capture Message" value={form.leadCaptureMessage} onChange={(v) => update("leadCaptureMessage", v)} />
        </div>
      </div>

      {/* PROMO */}
      <div className={activeTab === "promo" ? "block" : "hidden"}>
        <div className="space-y-6">
          <Text label="Selling Points" value={form.sellingPoints} onChange={(v) => update("sellingPoints", v)} />
          <Text label="Best Sellers" value={form.bestSellers} onChange={(v) => update("bestSellers", v)} />
          <Input label="Promo Logic Source" value={form.promoLogicSource} onChange={(v) => update("promoLogicSource", v)} />
        </div>
      </div>

      {/* BEHAVIOR */}
      <div className={activeTab === "behavior" ? "block" : "hidden"}>
        <div className="space-y-6">
          <Text label="Default Greeting" value={form.defaultGreeting} onChange={(v) => update("defaultGreeting", v)} />
          <Text label="Fallback Message" value={form.fallbackMessage} onChange={(v) => update("fallbackMessage", v)} />
          <Text label="Closing Message" value={form.closingMessage} onChange={(v) => update("closingMessage", v)} />
        </div>
      </div>

      {/* QUICK MENU */}
      <div className={activeTab === "quickmenu" ? "block" : "hidden"}>
        <div className="space-y-6">
          <Text label="Quick Menu (JSON)" value={form.quickMenu} rows={12} onChange={(v) => update("quickMenu", v)} />
        </div>
      </div>

      <button
        onClick={onSubmit}
        disabled={saving}
        className="bg-indigo-600 text-white px-6 py-3 rounded hover:bg-indigo-700 disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Settings"}
      </button>
    </div>
  );
}
