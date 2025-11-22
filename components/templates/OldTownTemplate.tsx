"use client";
import React, { useEffect, useState } from "react";

type MenuItem = {
  name: string;
  description: string;
  image?: string;
};

type Props = {
  logo?: string;
  brand?: string;
  tagline?: string;
  heroImage?: string;
  highlightImage?: string;
  about?: string;
  menuItems?: MenuItem[];
  contact?: string;
  year?: number;
};

export default function OldTownTemplate({
  logo,
  brand = "PromoHubAI Café",
  tagline = "AI-powered Taste of the Future",
  heroImage,
  highlightImage,
  about = "Discover our modern take on classic kopitiam flavors — where heritage meets innovation.",
  menuItems = [],
  contact = "Find us in Kuala Lumpur or WhatsApp us at +6012-3456789",
  year = new Date().getFullYear(),
}: Props) {
  /** ✅ Local defaults (static fallback assets) */
  const defaultLogo = "/images/default-logo.png";
  const defaultHero = "/images/default-hero.jpg";
  const defaultHighlight = "/images/menu-latte.jpg";
  const defaultMenuImages = [
    "/images/menu-latte.jpg",
    "/images/menu-toast.jpg",
    "/images/menu-nasilemak.jpg",
  ];

  /** ✅ Safe verified image state */
  const [safeLogo, setSafeLogo] = useState(defaultLogo);
  const [safeHero, setSafeHero] = useState(defaultHero);
  const [safeHighlight, setSafeHighlight] = useState(defaultHighlight);

  /** ✅ Verify image existence */
  useEffect(() => {
    const verifyImage = (
      src: string | undefined,
      fallback: string,
      setter: React.Dispatch<React.SetStateAction<string>>
    ) => {
      if (!src) return setter(fallback);
      const img = new Image();
      img.src = src;
      img.onload = () => setter(src);
      img.onerror = () => setter(fallback);
    };

    verifyImage(logo, defaultLogo, setSafeLogo);
    verifyImage(heroImage, defaultHero, setSafeHero);
    verifyImage(highlightImage, defaultHighlight, setSafeHighlight);
  }, [logo, heroImage, highlightImage]);

  /** ✅ Menu fallback logic */
  const itemsToShow =
    menuItems && menuItems.length > 0
      ? menuItems.map((m, i) => ({
          ...m,
          image:
            m.image &&
            m.image.startsWith("/") &&
            !m.image.includes("undefined")
              ? m.image
              : `/images/menu-${["latte", "toast", "nasilemak"][i % 3]}.jpg`,
        }))
      : [
          {
            name: "AI Latte",
            description: "A smooth, perfectly balanced latte.",
            image: defaultMenuImages[0],
          },
          {
            name: "Smart Toast",
            description: "Golden kaya toast with tradition and love.",
            image: defaultMenuImages[1],
          },
          {
            name: "Heritage Nasi Lemak",
            description: "Classic Malaysian comfort food, reimagined.",
            image: defaultMenuImages[2],
          },
        ];

  return (
    <div className="font-sans text-gray-900 bg-white">
      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-transparent backdrop-blur-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-8 py-4">
          <div className="flex items-center gap-3">
            <img
              src={safeLogo}
              alt="Logo"
              className="h-12 w-12 object-cover rounded-full shadow-sm border border-white/40"
            />
            <span className="text-white font-semibold text-xl tracking-wide drop-shadow-md">
              {brand}
            </span>
          </div>
          <div className="hidden md:flex space-x-10 text-white font-medium">
            <a href="#about" className="hover:text-[#FFD700] transition">
              About
            </a>
            <a href="#menu" className="hover:text-[#FFD700] transition">
              Menu
            </a>
            <a href="#contact" className="hover:text-[#FFD700] transition">
              Contact
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header
        className="h-screen flex items-center justify-center text-center relative"
        style={{
          backgroundImage: `url(${safeHero})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/80"></div>
        <div className="relative z-10 max-w-3xl px-6">
          <h1 className="text-6xl md:text-7xl font-extrabold text-white mb-6 tracking-tight drop-shadow-lg">
            {brand}
          </h1>
          <p className="text-2xl text-white/90 mb-8">{tagline}</p>
          <a
            href="#menu"
            className="px-10 py-4 rounded-full font-bold text-lg shadow-lg transition transform hover:scale-105"
            style={{ backgroundColor: "#FFD700", color: "#2D1B0D" }}
          >
            Explore Menu
          </a>
        </div>
      </header>

      {/* About / Highlight Section */}
      <section id="about" className="py-24 px-6 bg-[#FFFDF5]">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <img
            src={safeHighlight}
            alt="Highlight"
            className="rounded-3xl shadow-xl hover:scale-105 transition-transform duration-500"
          />
          <div>
            <h2 className="text-4xl font-bold mb-6 text-[#FFD700]">
              A Heritage of Taste
            </h2>
            <p className="text-lg leading-relaxed text-gray-700">{about}</p>
          </div>
        </div>
      </section>

      {/* Menu Section */}
      <section
        id="menu"
        className="bg-gradient-to-b from-[#FFFBEA] to-white py-24 px-6"
      >
        <div className="max-w-7xl mx-auto">
          <h2 className="text-center text-5xl font-extrabold mb-16 text-[#FFD700] tracking-tight">
            Our Signature Menu
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-12">
            {itemsToShow.map((item, i) => (
              <div
                key={i}
                className="bg-white rounded-3xl shadow-xl overflow-hidden group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-[1.02]"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-72 object-cover group-hover:scale-110 transition-transform duration-700"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        defaultMenuImages[i % defaultMenuImages.length];
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-black/5 to-transparent opacity-0 group-hover:opacity-100 transition duration-500"></div>
                </div>

                <div className="p-6">
                  <h3 className="text-2xl font-bold mb-3 text-[#2D1B0D]">
                    {item.name}
                  </h3>
                  <p className="text-gray-600 text-lg">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 px-6 text-center bg-[#FFFDF5]">
        <h2 className="text-4xl font-bold mb-6 text-[#FFD700]">Contact Us</h2>
        <p className="text-lg text-gray-700">{contact}</p>
      </section>

      {/* Footer */}
      <footer
        className="py-10 text-center text-white text-lg"
        style={{ backgroundColor: "#2D1B0D" }}
      >
        © {year} {brand}. All Rights Reserved.
      </footer>
    </div>
  );
}
