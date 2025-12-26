// Chatbot Widget Appearance – PromoHubAI
// Inspired by Tidio, improved for SEA SMEs
// Runtime-accurate live preview
// Stack: Next.js 14 + React + TailwindCSS

"use client";

import { useState } from "react";
import { Palette, Sliders, Image as ImageIcon } from "lucide-react";

// -----------------------------
// Types
// -----------------------------
type WidgetAppearance = {
  brandName: string;
  brandColor: string;
  actionColor: string;
  backgroundColor: string;
  backgroundImage?: string;
  position: "left" | "right";
  title: string;
  subtitle: string;
};

// -----------------------------
// Page
// -----------------------------
export default function ChatWidgetAppearancePage() {
  const [state, setState] = useState<WidgetAppearance>({
    brandName: "PromoAI",
    brandColor: "#6D28D9",
    actionColor: "#6D28D9",
    backgroundColor: "#EEF2FF",
    position: "right",
    title: "Hi there 👋",
    subtitle: "How can we help you today?",
  });

  function update<K extends keyof WidgetAppearance>(key: K, value: WidgetAppearance[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }

  function uploadBg(file: File) {
    const reader = new FileReader();
    reader.onload = () => update("backgroundImage", reader.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Settings */}
      <div className="w-full lg:w-1/2 overflow-y-auto p-8 space-y-6">
        <Header />

        <Card title="Brand">
          <Input label="Brand name" value={state.brandName} onChange={(v) => update("brandName", v)} />
          <Color label="Brand color" value={state.brandColor} onChange={(v) => update("brandColor", v)} />
          <Color label="Action color" value={state.actionColor} onChange={(v) => update("actionColor", v)} />
        </Card>

        <Card title="Home screen">
          <Input label="Title" value={state.title} onChange={(v) => update("title", v)} />
          <Textarea label="Message" value={state.subtitle} onChange={(v) => update("subtitle", v)} />
        </Card>

        <Card title="Background">
          <Color label="Background color" value={state.backgroundColor} onChange={(v) => update("backgroundColor", v)} />

          <label className="block text-sm">
            <div className="mb-1 text-gray-600 flex items-center gap-2">
              <ImageIcon size={14} /> Background image
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files && uploadBg(e.target.files[0])}
              className="block text-sm"
            />
          </label>
        </Card>

        <Card title="Position">
          <select
            value={state.position}
            onChange={(e) => update("position", e.target.value as any)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          >
            <option value="right">Bottom right</option>
            <option value="left">Bottom left</option>
          </select>
        </Card>
      </div>

      {/* Preview */}
      <div className="hidden lg:flex w-1/2 items-center justify-center bg-gray-50">
        <WidgetPreview state={state} />
      </div>
    </div>
  );
}

// -----------------------------
// Preview
// -----------------------------
function WidgetPreview({ state }: { state: WidgetAppearance }) {
  return (
    <div className="relative w-[360px] h-[640px] rounded-3xl bg-white shadow-lg overflow-hidden">
      <div
        className="h-56 p-5 text-white"
        style={{
          backgroundColor: state.backgroundColor,
          backgroundImage: state.backgroundImage ? `url(${state.backgroundImage})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="font-semibold" style={{ color: state.brandColor }}>
          {state.brandName}
        </div>
        <div className="mt-6 text-xl font-semibold text-gray-900">{state.title}</div>
        <div className="mt-2 text-sm text-gray-700">{state.subtitle}</div>
      </div>

      <div className="absolute bottom-4 left-4 right-4">
        <button
          className="w-full py-3 rounded-xl text-white text-sm font-medium"
          style={{ backgroundColor: state.actionColor }}
        >
          Chat with us
        </button>
      </div>
    </div>
  );
}

// -----------------------------
// UI
// -----------------------------
function Header() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Live Chat Appearance</h1>
      <p className="text-sm text-gray-500">Customize how your chat widget looks on your website.</p>
    </div>
  );
}

function Card({ title, children }: any) {
  return (
    <div className="bg-white rounded-xl p-5 space-y-4">
      <div className="text-sm font-medium">{title}</div>
      {children}
    </div>
  );
}

function Input({ label, value, onChange }: any) {
  return (
    <label className="block text-sm">
      <div className="mb-1 text-gray-600">{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border px-3 py-2 text-sm"
      />
    </label>
  );
}

function Textarea({ label, value, onChange }: any) {
  return (
    <label className="block text-sm">
      <div className="mb-1 text-gray-600">{label}</div>
      <textarea
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border px-3 py-2 text-sm"
      />
    </label>
  );
}

function Color({ label, value, onChange }: any) {
  return (
    <label className="block text-sm">
      <div className="mb-1 text-gray-600">{label}</div>
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
