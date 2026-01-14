"use client"

import Link from "next/link"
import { useState } from "react"
import { apiFetch } from "@/lib/api"

export default function PricingPage() {
  return (
    <main className="bg-gray-50 text-gray-900">
      {/* ================= PLANS ================= */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-4 gap-8">

          <Plan
            name="free"
            title="Free"
            price="$0"
            bestFor="POC / Trial"
            highlights={[
              "1 WhatsApp number",
              "10 WA messages / Day",
              "3 Campaigns / Month",
              "50 AI replies",
              "Basic analytics",
              "WA + Web chatbot",
              "Lead Management",
              "Storage up to 100MB",
              "AI Training (Up to 5 Pages)",
              "Email support",
            ]}
          />

          <Plan
            name="starter"
            title="Starter"
            price="$10 / month"
            bestFor="Solo founders & micro businesses"
            highlights={[
              "1 WhatsApp numbers",
              "50 WA messages / Day (Sandbox)",
              "10 Campaigns / Month",
              "300 AI replies",
              "Campaign scheduling",
              "WA + Web chatbot",
              "Lead Management",
              "Storage up to 5G",
              "AI Training (Up to 50 Pages)",
              "24/7 Email support",
            ]}
          />

          <Plan
            name="growth"
            title="Growth"
            price="$29 / month"
            badge="Most Popular"
            bestFor="SMEs, cafés & online shops"
            highlights={[
              "2 WhatsApp numbers",
              "100 WA messages / Day (Sandbox)",
              "30 Campaigns / Month",
              "1,000 AI replies",
              "Advanced analytics",
              "Custom AI prompts",
              "Multi-bot support",
              "WA + Web chatbot",
              "Lead Management",
              "Storage up to 10G",
              "File Attachment",
              "REST API access",
              "AI Training (Up to 100 Pages)",
              "24/7 Email + WhatsApp support",
            ]}
          />

          <Plan
            name="business"
            title="Business"
            price="$59 / month"
            bestFor="Agencies & multi-outlet brands"
            highlights={[
              "5 WhatsApp numbers",
              "500 WA messages / Day (Sandbox)",
              "Unlimited campaigns / Day",
              "50 Campaigns / Month",
              "Storage up to 30G",
              "Advanced AI reasoning",
              "API access",
              "Priority support",
              "Lead Management",
              "AI Training (Up to 300 Pages)",
              "24/7 Email + WhatsApp support",
            ]}
          />

        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="bg-white border-t py-8 text-center text-gray-500">
        © 2025 VibeSuitAI. All rights reserved.
      </footer>
    </main>
  )
}

/* ================= PLAN CARD ================= */

function Plan({
  name,
  title,
  price,
  bestFor,
  highlights,
  badge,
}: {
  name: string
  title: string
  price: string
  bestFor: string
  highlights: string[]
  badge?: string
}) {
  const popular = badge === "Most Popular"
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)

  const half = Math.ceil(highlights.length / 2)
  const visible = expanded ? highlights : highlights.slice(0, half)

  async function choosePlan() {
    try {
      setLoading(true)
      console.log("[Pricing] choose plan:", name)

      // ✅ FREE → manual activate (same as your current behavior)
      if (name === "free") {
        const res = await apiFetch("/subscription/activate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan: name }),
        })

        const data = await res.json().catch(() => null)
        if (!res.ok || !data?.success) {
          throw new Error(data?.error || "Activation failed")
        }

        console.log("[Pricing] activated free, redirecting")
        window.location.href = "/en/dashboard"
        return
      }

      // ✅ PAID → Stripe Checkout redirect (RESTORE your previous flow)
      const res = await apiFetch("/subscription/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: name, interval: "monthly" }),
      })

      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.success || !data?.url) {
        throw new Error(data?.error || "Checkout failed")
      }

      console.log("[Pricing] redirecting to Stripe:", data.url)
      window.location.href = data.url
    } catch (e: any) {
      console.error("[Pricing] choosePlan error", e)
      alert(e?.message || "Failed to choose plan")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={`
        relative rounded-2xl p-6 flex flex-col transition
        ${popular
          ? "bg-white border-2 border-purple-600 shadow-2xl scale-[1.03]"
          : "bg-white border shadow-sm"
        }
      `}
    >
      {popular && (
        <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow">
          MOST POPULAR
        </span>
      )}

      <h3 className="text-2xl font-bold mb-1">{title}</h3>
      <p className="text-gray-500 text-sm mb-4">{bestFor}</p>

      <p className="text-4xl font-extrabold mb-6">{price}</p>

      <ul className="space-y-2 text-sm text-gray-700 flex-1">
        {visible.map(item => (
          <li key={item} className="flex gap-2">
            <span className="text-green-500 font-bold">✓</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>

      {highlights.length > half && (
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="mt-3 text-sm font-medium text-purple-600 hover:underline"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}

      <button
        disabled={loading}
        onClick={choosePlan}
        className={`
          mt-6 w-full py-3 rounded-lg font-semibold transition
          ${popular
            ? "bg-purple-600 text-white hover:bg-purple-700"
            : "bg-gray-100 text-gray-900 hover:bg-gray-200"
          }
          ${loading ? "opacity-60 cursor-not-allowed" : ""}
        `}
      >
        {loading ? "Processing..." : `Choose ${title}`}
      </button>
    </div>
  )
}
