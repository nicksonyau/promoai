"use client";

import type { ChatPageConfig } from "./types";

export default function ChatPagePreview({ config }: { config: ChatPageConfig }) {
  const accent = config.theme?.accentColor ?? "#6d28d9";
  const userBubble = config.theme?.userBubbleColor ?? accent;
  const botStyle = config.theme?.botBubbleStyle ?? "light";

  const inputBorder = config.theme?.input?.borderColor ?? "#e5e7eb";
  const sendColor = config.theme?.input?.sendButtonColor ?? accent;

  const bg =
    config.appearance?.backgroundMode === "solid"
      ? config.appearance?.backgroundColor ?? "#ffffff"
      : config.appearance?.backgroundMode === "image" && config.appearance?.backgroundImage
      ? `url(${config.appearance.backgroundImage})`
      : "linear-gradient(135deg, #eef2ff 0%, #ffffff 55%, #f5f3ff 100%)";

  const botBubbleBg = botStyle === "brand-soft" ? "rgba(109,40,217,0.10)" : "#f3f4f6";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div
        className="p-6"
        style={{
          background: bg.startsWith("url(") ? undefined : (bg as any),
          backgroundImage: bg.startsWith("url(") ? (bg as any) : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          minHeight: 620,
        }}
      >
        <div className="max-w-md mx-auto text-center">
          {config.branding?.companyLogo ? (
            <img
              src={config.branding.companyLogo}
              alt="logo"
              className="mx-auto h-12 w-12 rounded-2xl border border-gray-200 bg-white object-contain"
            />
          ) : (
            <div className="mx-auto h-12 w-12 rounded-2xl border border-gray-200 bg-white" />
          )}

          <div className="mt-3 text-xl font-semibold text-gray-900">
            {config.header?.title || "Welcome"}
          </div>
          <div className="mt-1 text-sm text-gray-600">
            {config.header?.welcomeMessage || "Ask us anything"}
          </div>

          {config.branding?.companyUrl ? (
            <div className="mt-1 text-xs text-gray-500">{config.branding.companyUrl}</div>
          ) : null}
        </div>

        <div className="mt-6 max-w-md mx-auto">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4">
            <div className="space-y-3">
              <div
                className="w-fit max-w-[85%] rounded-2xl px-3 py-2 text-sm text-gray-800"
                style={{ background: botBubbleBg }}
              >
                Hello 👋 How can we help today?
              </div>

              <div
                className="ml-auto w-fit max-w-[85%] rounded-2xl px-3 py-2 text-sm text-white"
                style={{ background: userBubble }}
              >
                I want to know your pricing.
              </div>

              <div
                className="w-fit max-w-[85%] rounded-2xl px-3 py-2 text-sm text-gray-800"
                style={{ background: botBubbleBg }}
              >
                Sure — tell me your business type and I’ll recommend a plan.
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <input
                disabled
                className="flex-1 rounded-xl px-3 py-2 text-sm outline-none bg-white"
                style={{ border: `1px solid ${inputBorder}` }}
                placeholder="Type your message…"
              />
              <button
                disabled
                className="rounded-xl px-3 py-2 text-white text-sm font-semibold"
                style={{ background: sendColor }}
              >
                →
              </button>
            </div>
          </div>
        </div>

        {/* subtle floating widget button (tidio-ish) */}
        <div className="fixed right-6 bottom-6">
          <div
            className="h-12 w-12 rounded-full shadow-lg flex items-center justify-center text-white"
            style={{ background: accent }}
          >
            💬
          </div>
        </div>
      </div>
    </div>
  );
}
