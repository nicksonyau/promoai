"use client";

import { useState } from "react";
import type { ChatPageConfig } from "./types";
import { ChevronDown } from "lucide-react";

type Props = {
  config: ChatPageConfig;
  onChange: (c: ChatPageConfig) => void;
  disabled?: boolean;
};

function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <button
        type="button"
        className="w-full px-4 py-3 flex items-center justify-between"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="text-sm font-semibold text-gray-900">{title}</div>
        <ChevronDown
          className={`h-4 w-4 text-gray-500 transition ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="px-4 pb-4 pt-1 space-y-4">{children}</div>}
    </div>
  );
}

function Label({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="space-y-1">
      <div className="text-sm font-medium text-gray-900">{title}</div>
      {hint ? <div className="text-xs text-gray-500">{hint}</div> : null}
    </div>
  );
}

function TextInput({
  disabled,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      disabled={disabled}
      className={[
        "w-full rounded-xl border px-3 py-2 text-sm outline-none",
        "border-gray-200 bg-white",
        disabled
          ? "bg-gray-50 text-gray-500 cursor-not-allowed"
          : "focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100",
      ].join(" ")}
    />
  );
}

function Select({
  disabled,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      disabled={disabled}
      className={[
        "w-full rounded-xl border px-3 py-2 text-sm outline-none bg-white",
        "border-gray-200",
        disabled
          ? "bg-gray-50 text-gray-500 cursor-not-allowed"
          : "focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100",
      ].join(" ")}
    />
  );
}

function ColorRow({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-sm text-gray-700">{label}</div>
      <div className="flex items-center gap-2">
        <div
          className="h-7 w-7 rounded-lg border border-gray-200"
          style={{ background: value }}
        />
        <input
          type="color"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className={disabled ? "opacity-50 cursor-not-allowed" : ""}
        />
      </div>
    </div>
  );
}

export default function ChatPageForm({ config, onChange, disabled }: Props) {
  const accent = config.theme?.accentColor ?? "#6d28d9";
  const userBubble = config.theme?.userBubbleColor ?? accent;

  const inputBorder = config.theme?.input?.borderColor ?? "#e5e7eb";
  const inputFocus = config.theme?.input?.focusColor ?? accent;
  const inputSend = config.theme?.input?.sendButtonColor ?? accent;

  const bgMode = config.appearance?.backgroundMode ?? "widget";

  return (
    <div className="space-y-4">
      <Section title="Header">
        <div className="space-y-2">
          <Label title="Page title" />
          <TextInput
            disabled={disabled}
            value={config.header?.title ?? ""}
            onChange={(e) =>
              onChange({
                ...config,
                header: { ...config.header, title: e.target.value },
              })
            }
            placeholder="Welcome"
          />
        </div>

        <div className="space-y-2">
          <Label title="Welcome message" />
          <TextInput
            disabled={disabled}
            value={config.header?.welcomeMessage ?? ""}
            onChange={(e) =>
              onChange({
                ...config,
                header: { ...config.header, welcomeMessage: e.target.value },
              })
            }
            placeholder="Ask us anything"
          />
        </div>
      </Section>

      <Section title="Branding" defaultOpen={false}>
        <div className="space-y-2">
          <Label title="Company URL" hint="Optional, shown under header." />
          <TextInput
            disabled={disabled}
            value={config.branding?.companyUrl ?? ""}
            onChange={(e) =>
              onChange({
                ...config,
                branding: { ...config.branding, companyUrl: e.target.value },
              })
            }
            placeholder="https://thrivosign.com"
          />
        </div>

        <div className="space-y-2">
          <Label title="Logo URL" hint="URL for now (upload later)." />
          <TextInput
            disabled={disabled}
            value={config.branding?.companyLogo ?? ""}
            onChange={(e) =>
              onChange({
                ...config,
                branding: { ...config.branding, companyLogo: e.target.value },
              })
            }
            placeholder="https://…/logo.png"
          />
        </div>
      </Section>

      <Section title="Theme">
        <ColorRow
          label="Accent color"
          value={accent}
          disabled={disabled}
          onChange={(v) =>
            onChange({ ...config, theme: { ...config.theme, accentColor: v } })
          }
        />

        <ColorRow
          label="User bubble"
          value={userBubble}
          disabled={disabled}
          onChange={(v) =>
            onChange({
              ...config,
              theme: { ...config.theme, userBubbleColor: v },
            })
          }
        />

        <div className="space-y-2">
          <Label title="Bot bubble style" />
          <Select
            disabled={disabled}
            value={config.theme?.botBubbleStyle ?? "light"}
            onChange={(e) =>
              onChange({
                ...config,
                theme: {
                  ...config.theme,
                  botBubbleStyle: e.target.value as any,
                },
              })
            }
          >
            <option value="light">Light</option>
            <option value="brand-soft">Brand soft</option>
          </Select>
        </div>

        <div className="pt-2 border-t border-gray-100 space-y-3">
          <ColorRow
            label="Input border"
            value={inputBorder}
            disabled={disabled}
            onChange={(v) =>
              onChange({
                ...config,
                theme: {
                  ...config.theme,
                  input: { ...config.theme?.input, borderColor: v },
                },
              })
            }
          />
          <ColorRow
            label="Input focus"
            value={inputFocus}
            disabled={disabled}
            onChange={(v) =>
              onChange({
                ...config,
                theme: {
                  ...config.theme,
                  input: { ...config.theme?.input, focusColor: v },
                },
              })
            }
          />
          <ColorRow
            label="Send button"
            value={inputSend}
            disabled={disabled}
            onChange={(v) =>
              onChange({
                ...config,
                theme: {
                  ...config.theme,
                  input: { ...config.theme?.input, sendButtonColor: v },
                },
              })
            }
          />
        </div>
      </Section>

      <Section title="Background" defaultOpen={false}>
        <div className="space-y-2">
          <Label title="Background mode" />
          <Select
            disabled={disabled}
            value={bgMode}
            onChange={(e) =>
              onChange({
                ...config,
                appearance: {
                  ...config.appearance,
                  backgroundMode: e.target.value as any,
                },
              })
            }
          >
            <option value="widget">Use widget theme</option>
            <option value="solid">Solid color</option>
            <option value="image">Image</option>
          </Select>
        </div>

        {bgMode === "solid" ? (
          <ColorRow
            label="Background color"
            value={config.appearance?.backgroundColor ?? "#ffffff"}
            disabled={disabled}
            onChange={(v) =>
              onChange({
                ...config,
                appearance: { ...config.appearance, backgroundColor: v },
              })
            }
          />
        ) : null}

        {bgMode === "image" ? (
          <div className="space-y-2">
            <Label title="Background image URL" />
            <TextInput
              disabled={disabled}
              value={config.appearance?.backgroundImage ?? ""}
              onChange={(e) =>
                onChange({
                  ...config,
                  appearance: {
                    ...config.appearance,
                    backgroundImage: e.target.value,
                  },
                })
              }
              placeholder="https://…/bg.jpg"
            />
          </div>
        ) : null}
      </Section>
    </div>
  );
}
