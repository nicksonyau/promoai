import Image from "next/image"

export default function Home() {
  return (
    <div className="bg-gray-50 min-h-screen text-gray-900 font-sans">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto flex justify-between items-center py-4 px-6">
          <h1 className="text-2xl font-bold text-purple-600">PromoAI</h1>
          <nav className="space-x-6 text-gray-600">
            <a href="#features" className="hover:text-purple-600">Features</a>
            <a href="#pricing" className="hover:text-purple-600">Pricing</a>
            <a href="#about" className="hover:text-purple-600">About</a>
            <a href="/blog" className="hover:text-purple-600">Blog</a> 
          </nav>
         <a href="/register">
          <button className="bg-purple-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-purple-700">
            Get Started
          </button>
        </a>
        </div>
      </header>

      {/* Hero Section with Gradient Background */}
      <section className="relative text-center py-32 px-6 bg-gradient-to-r from-purple-100 via-white to-purple-100 overflow-hidden">
        {/* Decorative SVG background */}
        <div className="absolute inset-0 -z-10 opacity-30">
          <svg
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1440 320"
          >
            <path
              fill="#7C3AED"
              fillOpacity="0.2"
              d="M0,160L48,170.7C96,181,192,203,288,192C384,181,480,139,576,117.3C672,96,768,96,864,122.7C960,149,1056,203,1152,208C1248,213,1344,171,1392,149.3L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            ></path>
          </svg>
        </div>

        <h2 className="text-5xl font-bold mb-6 leading-tight relative z-10">
          Supercharge Your Marketing with <span className="text-purple-600">PromoAI</span>
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-10 relative z-10">
          PromoAI helps you create compelling promotional content in seconds.
          Designed with simplicity, powered by AI — so you can focus on growing your brand.
        </p>
        <button className="bg-purple-600 text-white px-8 py-3 rounded-xl text-lg font-semibold hover:bg-purple-700 shadow-md relative z-10">
          Try PromoAI Free
        </button>

        {/* Hero Image */}
        <div className="mt-12 flex justify-center relative z-10">
          <Image
            src="/hero.svg"
            alt="PromoAI Dashboard"
            width={800}
            height={400}
            className="rounded-xl shadow-lg"
          />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-6xl mx-auto py-20 px-6 grid md:grid-cols-3 gap-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 text-center">
          <Image src="/feature1.svg" alt="Fast AI" width={80} height={80} className="mx-auto mb-4"/>
          <h3 className="text-xl font-bold mb-3 text-purple-600">⚡ Fast Generation</h3>
          <p className="text-gray-600">Produce promotional content instantly with AI-powered suggestions tailored for your products.</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 text-center">
          <Image src="/feature2.svg" alt="Brand Alignment" width={80} height={80} className="mx-auto mb-4"/>
          <h3 className="text-xl font-bold mb-3 text-purple-600">🎨 Brand Alignment</h3>
          <p className="text-gray-600">Customize content so it fits your brand voice and style guidelines with ease.</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 text-center">
          <Image src="/feature3.svg" alt="Smart Insights" width={80} height={80} className="mx-auto mb-4"/>
          <h3 className="text-xl font-bold mb-3 text-purple-600">🤖 Smart Insights</h3>
          <p className="text-gray-600">AI learns from your past campaigns and provides insights to maximize engagement.</p>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="max-w-6xl mx-auto py-20 px-6 text-center">
        <h2 className="text-3xl font-bold mb-10">Simple Pricing</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
            <Image src="/starter.svg" alt="Starter Plan" width={60} height={60} className="mx-auto mb-4"/>
            <h3 className="text-xl font-bold mb-2">Starter</h3>
            <p className="text-gray-600 mb-4">For individuals and freelancers</p>
            <p className="text-4xl font-bold mb-6">$0<span className="text-lg">/mo</span></p>
            <button className="bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700">
              Get Started Free
            </button>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
            <Image src="/pro.svg" alt="Pro Plan" width={60} height={60} className="mx-auto mb-4"/>
            <h3 className="text-xl font-bold mb-2">Pro</h3>
            <p className="text-gray-600 mb-4">For growing businesses</p>
            <p className="text-4xl font-bold mb-6">$19<span className="text-lg">/mo</span></p>
            <button className="bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700">
              Upgrade to Pro
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white text-center py-8 text-gray-600">
        <p>&copy; 2025 PromoAI. All rights reserved.</p>
      </footer>
    </div>
  )
}
