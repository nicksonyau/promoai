"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PricingPage() {
  const router = useRouter();
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState(false);

  async function activateFreePlan() {
    try {
      setLoading(true);

      const res = await fetch("/subscription/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          plan: "free",
          interval,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to activate plan");
      }

      router.replace("/dashboard");
    } catch (e) {
      console.error(e);
      alert("Unable to activate Free plan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="bg-gray-50 text-gray-900">

      {/* ================= HEADER ================= */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-bold">
            PromoHubAI
          </Link>

          <Link href="/register">
            <button className="bg-purple-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-purple-700">
              Get Started
            </button>
          </Link>
        </div>
      </header>

      {/* ================= HERO ================= */}
      <section className="py-20 text-center px-6">
        <h1 className="text-5xl font-bold mb-4">
          Simple Pricing That Scales
        </h1>
        <p className="max-w-2xl mx-auto text-gray-600 mb-8">
          Start free. Upgrade when your WhatsApp engagement grows.
        </p>

        {/* Billing Toggle */}
        <div className="inline-flex bg-white border rounded-full p-1">
          <button
            onClick={() => setInterval("monthly")}
            className={`px-6 py-2 rounded-full text-sm font-semibold ${
              interval === "monthly"
                ? "bg-purple-600 text-white"
                : "text-gray-600"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setInterval("yearly")}
            className={`px-6 py-2 rounded-full text-sm font-semibold ${
              interval === "yearly"
                ? "bg-purple-600 text-white"
                : "text-gray-600"
            }`}
          >
            Yearly (Save 20%)
          </button>
        </div>
      </section>

      {/* ================= PLANS ================= */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-4 gap-8">

          <Plan
            name="Free"
            price="$0"
            bestFor="POC / Trial"
            interval={interval}
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
            onChoose={activateFreePlan}
            loading={loading}
          />

          <Plan
            name="Starter"
            price={interval === "monthly" ? "$10 / month" : "$96 / year"}
            bestFor="Solo founders & micro businesses"
            highlights={[ /* unchanged */ ]}
            link="/register"
          />

          <Plan
            name="Growth"
            price={interval === "monthly" ? "$29 / month" : "$278 / year"}
            bestFor="SMEs, cafés & online shops"
            badge="Most Popular"
            highlights={[ /* unchanged */ ]}
            link="/register"
          />

          <Plan
            name="Business"
            price={interval === "monthly" ? "$59 / month" : "$566 / year"}
            bestFor="Agencies & multi-outlet brands"
            highlights={[ /* unchanged */ ]}
            link="/register"
          />
        </div>
      </section>

      <footer className="bg-white border-t py-8 text-center text-gray-500">
        © 2025 PromoHubAI. All rights reserved.
      </footer>
    </main>
  );
}

/* ================= PLAN CARD ================= */

function Plan({
  name,
  price,
  bestFor,
  highlights,
  badge,
  link,
  onChoose,
  loading,
}: {
  name: string;
  price: string;
  bestFor: string;
  highlights: string[];
  badge?: string;
  link?: string;
  onChoose?: () => void;
  loading?: boolean;
}) {
  const popular = badge === "Most Popular";

  return (
    <div
      className={`relative rounded-2xl p-6 flex flex-col ${
        popular
          ? "bg-white border-2 border-purple-600 shadow-2xl scale-[1.03]"
          : "bg-white border shadow-sm"
      }`}
    >
      {popular && (
        <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full">
          MOST POPULAR
        </span>
      )}

      <h3 className="text-2xl font-bold mb-1">{name}</h3>
      <p className="text-gray-500 text-sm mb-4">{bestFor}</p>
      <p className="text-4xl font-extrabold mb-6">{price}</p>

      <ul className="space-y-2 text-sm text-gray-700 flex-1">
        {highlights.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="text-green-500 font-bold">✓</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>

      {onChoose ? (
        <button
          disabled={loading}
          onClick={onChoose}
          className="mt-6 w-full py-3 rounded-lg font-semibold bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? "Activating..." : "Start Free"}
        </button>
      ) : (
        <Link href={link || "/register"}>
          <button className="mt-6 w-full py-3 rounded-lg font-semibold bg-gray-100 hover:bg-gray-200">
            Choose {name}
          </button>
        </Link>
      )}
    </div>
  );
}
