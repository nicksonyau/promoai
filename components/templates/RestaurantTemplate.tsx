"use client";

import React, { useEffect, useRef, useState } from "react";
import { API_URL } from "../../config";


type MenuItem = { name: string; price?: number | string; img?: string; description?: string };
type MenuSection = { sectionName: string; items: MenuItem[] };

type Props = {
  templateId?: string;
  brand?: string;
  tagline?: string;
  logo?: string;
  heroImage?: string;
  about?: string;
  menuSections?: MenuSection[];
  services?: { name?: string; description?: string }[];
  gallery?: { img?: string; caption?: string }[];
  contact?: { phone?: string; email?: string; address?: string; hours?: string };
  social?: any;
  sectionsEnabled?: string[];
};

const SECTION_LABELS: Record<string, string> = {
  brand: "Brand",
  about: "About",
  products: "Products",
  services: "Services",
  gallery: "Gallery",
  contact: "Contact",
};

function resolveImage(src?: string) {
  if (!src) return "";
  if (src.startsWith("http") || src.startsWith("data:")) return src;
  if (src.startsWith("/r2/")) return `${API_URL}${src}`;
  return src;
}

export default function RestaurantTemplate(props: Props) {
  const {
    brand,
    tagline,
    logo,
    heroImage,
    about,
    menuSections = [],
    services = [],
    gallery = [],
    contact,
    sectionsEnabled = ["brand", "about", "products", "services", "gallery", "contact"],
  } = props;

  // normalize enabled set for quick lookup
  const enabled = new Set(sectionsEnabled || []);

  // nav order we want to show (match your request)
  const NAV_ORDER = ["brand", "about", "products", "services", "gallery", "contact"];

  const navRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    // set up refs for enabled sections
    NAV_ORDER.forEach((k) => {
      sectionRefs.current[k] = document.getElementById(`section-${k}`);
    });

    const onScroll = () => {
      const entries = NAV_ORDER.filter((k) => enabled.has(k))
        .map((k) => {
          const el = sectionRefs.current[k];
          if (!el) return { key: k, top: 999999 };
          const rect = el.getBoundingClientRect();
          return { key: k, top: Math.abs(rect.top - 80) }; // 80 offset
        })
        .sort((a, b) => a.top - b.top);

      if (entries.length) setActive(entries[0].key);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [sectionsEnabled]);

  const handleNavClick = (key: string) => {
    const el = sectionRefs.current[key];
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 70; // offset for header
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen">
      {/* Top hero header */}
      <header className="relative bg-black text-white">
        <div
          className="h-64 bg-cover bg-center bg-no-repeat flex items-center"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), url('${resolveImage(heroImage)}')`,
          }}
        >
          <div className="container mx-auto px-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white overflow-hidden flex-shrink-0">
                {logo ? <img src={resolveImage(logo)} alt="logo" className="w-full h-full object-contain" /> : null}
              </div>
              <div>
                <h1 className="text-4xl font-bold leading-none">{brand}</h1>
                {tagline && <p className="text-sm opacity-80 mt-1">{tagline}</p>}
              </div>
            </div>

            {/* Top navigation - only enabled entries */}
            <nav ref={navRef} aria-label="page navigation" className="text-sm">
              <ul className="flex gap-6 items-center">
                {NAV_ORDER.filter((k) => enabled.has(k)).map((k) => (
                  <li key={k}>
                    <button
                      onClick={() => handleNavClick(k)}
                      className={`py-3 ${active === k ? "text-yellow-400 font-semibold" : "text-gray-200 hover:text-white"}`}
                    >
                      {SECTION_LABELS[k] === "Products" ? "Menu" : SECTION_LABELS[k]}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        {/* Brand (Hero repeated as an anchor) */}
        {enabled.has("brand") && (
          <section id="section-brand" className="py-8" style={{ scrollMarginTop: 80 }}>
            {/* Empty spacer since hero exists; include a small intro */}
            <div className="prose">
              <h2>Welcome</h2>
              <p>{tagline || "Welcome to our page."}</p>
            </div>
          </section>
        )}

        {/* About */}
        {enabled.has("about") && (
          <section id="section-about" className="py-12" style={{ scrollMarginTop: 80 }}>
            <h2 className="text-3xl font-bold mb-4">About</h2>
            <p className="text-gray-700 max-w-prose">{about || "Tell visitors about your business."}</p>
          </section>
        )}

        {/* Products / Menu */}
        {enabled.has("products") && (
          <section id="section-products" className="py-12" style={{ scrollMarginTop: 80 }}>
            <h2 className="text-3xl font-bold mb-6">Menu</h2>

            {menuSections.length === 0 && (
              <div className="text-gray-500 italic">No menu items yet.</div>
            )}

            {menuSections.map((sec, sIdx) => (
              <div key={sIdx} className="mb-8">
                <h3 className="text-xl font-semibold mb-3">{sec.sectionName}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {sec.items.map((it, idx) => (
                    <div key={idx} className="border rounded-lg p-4 bg-white shadow-sm">
                      <div className="w-full h-40 bg-gray-100 rounded overflow-hidden mb-3">
                        {it.img ? (
                          <img src={it.img} alt={it.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">No image</div>
                        )}
                      </div>
                      <div className="font-semibold text-lg">{it.name}</div>
                      <div className="text-yellow-600 font-bold mt-1">RM {Number(it.price || 0).toFixed(2)}</div>
                      {it.description && <p className="text-sm text-gray-600 mt-2">{it.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Services */}
        {enabled.has("services") && (
          <section id="section-services" className="py-12" style={{ scrollMarginTop: 80 }}>
            <h2 className="text-3xl font-bold mb-6">Services</h2>

            {services.length === 0 && <div className="text-gray-500 italic">No services listed.</div>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {services.map((s, i) => (
                <div key={i} className="border rounded-lg p-4 bg-white">
                  <div className="font-semibold">{s.name}</div>
                  <div className="text-sm text-gray-600 mt-2">{s.description}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Gallery */}
        {enabled.has("gallery") && (
          <section id="section-gallery" className="py-12" style={{ scrollMarginTop: 80 }}>
            <h2 className="text-3xl font-bold mb-6">Gallery</h2>

            {gallery.length === 0 && <div className="text-gray-500 italic">No images yet.</div>}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {gallery.map((g, i) => (
                <div key={i} className="rounded overflow-hidden border bg-white">
                  <img src={resolveImage(g.img)} alt={g.caption || `Gallery ${i + 1}`} className="w-full h-40 object-cover" />
                  {g.caption && <div className="p-2 text-sm text-gray-600">{g.caption}</div>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Contact */}
        {enabled.has("contact") && (
          <section id="section-contact" className="py-12" style={{ scrollMarginTop: 80 }}>
            <h2 className="text-3xl font-bold mb-4">Contact</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <div className="font-semibold">Address</div>
                <div className="text-gray-700">{contact?.address || "—"}</div>
              </div>
              <div>
                <div className="font-semibold">Phone / Email</div>
                <div className="text-gray-700">{contact?.phone || "—"} {contact?.email ? ` • ${contact.email}` : ""}</div>
                {contact?.hours && <div className="text-gray-600 mt-2">Hours: {contact.hours}</div>}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
