import Image from "next/image"
import Link from "next/link"

export default function HomePage() {
  return (
    <main className="bg-gray-50 text-gray-900">

      {/* ================= HEADER ================= */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Image
              src="/images/pai-logo4.png"
              alt="PAI Logo"
              width={60}
              height={60}
            />
            <span className="text-xl font-bold text-gray-900">
              PromoHubAI
            </span>
          </div>

          <nav className="hidden md:flex gap-8 text-gray-600">
            <a href="#products" className="hover:text-purple-600">Product</a>
            <a href="#usecases" className="hover:text-purple-600">Use Case</a>
            <a href="#pricing" className="hover:text-purple-600">Pricing</a>
            <a href="/blog" className="hover:text-purple-600">Resources</a>
          </nav>

          <Link href="/register">
            <button className="bg-purple-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-purple-700">
              Get Started
            </button>
          </Link>
        </div>
      </header>

      {/* ================= HERO ================= */}
      <section className="bg-gradient-to-b from-purple-50 to-white py-32 px-6 text-center">
        <h1 className="text-6xl font-bold max-w-4xl mx-auto leading-tight">
          Customer Experience Software <br />
          <span className="text-purple-600">
            for WhatsApp-First & Web-Driven Businesses
          </span>
        </h1>

        <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
          Engage customers on WhatsApp and your website using AI-powered automation
          and seamless human takeover — all in one platform.
        </p>

        <div className="mt-10 flex justify-center gap-4">
          <Link href="/register">
            <button className="bg-purple-600 text-white px-8 py-3 rounded-xl font-semibold">
              Start Free
            </button>
          </Link>
          <button className="border px-8 py-3 rounded-xl font-semibold hover:bg-gray-100">
            Book a Demo
          </button>
        </div>
      </section>

      {/* ================= PRODUCTS ================= */}
      <section id="products" className="max-w-7xl mx-auto py-24 px-6">
        <h2 className="text-4xl font-bold text-center mb-16">
          Two Core Products. One Growth Platform.
        </h2>

        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h3 className="text-2xl font-bold mb-4">WhatsApp Marketing</h3>
            <p className="text-gray-600 mb-6">
              Reach and engage customers where they respond most —
              via QR campaigns, broadcasts, vouchers, and automation.
            </p>
          </div>
          <Image
            src="/images/whatsapp-marketing.png"
            alt="WhatsApp Marketing"
            width={520}
            height={360}
            className="rounded-xl shadow-md"
          />

          <Image
            src="/images/customer-service.png"
            alt="Customer Service"
            width={520}
            height={360}
            className="rounded-xl shadow-md"
          />
          <div>
            <h3 className="text-2xl font-bold mb-4">Customer Service</h3>
            <p className="text-gray-600 mb-6">
              Automate customer support with AI while allowing human takeover
              — faster responses, lower cost, happier customers.
            </p>
          </div>
        </div>
      </section>

      {/* ================= USE CASE (SINGLE FLOW IMAGE) ================= */}
      <section id="usecases" className="bg-white border-t border-b py-24">
        <div className="max-w-7xl mx-auto px-6 text-center">
          
          <h2 className="text-4xl font-bold mb-6">
            WhatsApp Marketing for Customer Retention
          </h2>

          <p className="text-gray-600 mb-14 max-w-3xl mx-auto">
            A simple, proven flow that turns first-time visitors into loyal customers —
            from first contact to repeat engagement.
          </p>

          <Image
            src="/images/whatsapp-retention-flow.png"
            alt="WhatsApp Retention Flow"
            width={900}
            height={360}
            className="mx-auto rounded-xl shadow-md"
            priority
          />
        </div>
      </section>

      {/* ================= PRICING ================= */}
      <section id="pricing" className="bg-gray-50 py-24">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-12">Simple Pricing</h2>

          <div className="grid md:grid-cols-3 gap-8">
            <Price name="Starter" price="$10" />
            <Price name="Pro" price="$29" highlight />
            <Price name="Business" price="$59" />
          </div>
        </div>
      </section>

      <footer className="bg-white border-t py-10 text-center text-gray-500">
        © 2025 PromoHubAI. All rights reserved.
      </footer>

    </main>
  )
}

/* ================= PRICE COMPONENT ================= */

function Price({
  name,
  price,
  highlight = false
}: {
  name: string
  price: string
  highlight?: boolean
}) {
  return (
    <div className={`bg-white border rounded-2xl p-8 ${highlight ? "border-purple-600" : ""}`}>
      <h3 className="text-xl font-bold mb-2">{name}</h3>
      <p className="text-4xl font-bold mb-6">{price}/mo</p>
      <Link href="/register">
        <button className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700">
          Get Started
        </button>
      </Link>
    </div>
  )
}
