"use client";

import React from "react";

const SafeImage = ({ src, alt, className, fallback }: any) => {
  if (!src || src.trim() === "" || src.length < 20) {
    return fallback || <div className={`${className} bg-gray-200`} />;
  }
  return <img src={src} alt={alt} className={className} loading="lazy" />;
};

type Props = {
  brand: string;
  tagline?: string;
  logo?: string;
  heroImage?: string;
  about?: string;
  menuItems?: any[];
  services?: any[];
  gallery?: string[];
  contact?: string;
  mapUrl?: string;
  enabled: string[];
};

export default function GenericModernTemplate({
  brand = "Your Store",
  tagline = "",
  logo = "",
  heroImage = "",
  about = "",
  menuItems = [],
  services = [],
  gallery = [],
  contact = "",
  mapUrl = "",
  enabled = [],
}: Props) {
  const has = (key: string) => enabled.map(e => e.toLowerCase()).includes(key.toLowerCase());

  return (
    <div className="font-sans text-gray-900 bg-white min-h-screen">
      {/* NAVBAR */}
      <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <SafeImage
              src={logo}
              alt="logo"
              className="h-12 w-12 rounded-full object-cover border-2 border-gray-300"
              fallback={<div className="h-12 w-12 bg-gray-300 rounded-full" />}
            />
            <div>
              <h1 className="text-xl font-bold">{brand}</h1>
              {tagline && <p className="text-sm text-gray-600">{tagline}</p>}
            </div>
          </div>

          <div className="hidden md:flex gap-8 text-gray-700 font-medium text-sm">
            {has("about") && <a href="#about" className="hover:text-indigo-600 transition">About</a>}
            {has("menu") && <a href="#menu" className="hover:text-indigo-600 transition">Menu</a>}
            {has("services") && <a href="#services" className="hover:text-indigo-600 transition">Services</a>}
            {has("gallery") && <a href="#gallery" className="hover:text-indigo-600 transition">Gallery</a>}
            {has("contact") && <a href="#contact" className="hover:text-indigo-600 transition">Contact</a>}
          </div>
        </div>
      </nav>

      {/* HERO */}
      <header
        className="h-screen flex items-center justify-center text-center relative overflow-hidden"
        style={{
          backgroundImage: heroImage ? `url(${heroImage})` : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 px-6 max-w-4xl">
          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 drop-shadow-2xl">{brand}</h1>
          {tagline && <p className="text-2xl md:text-4xl text-white/90 mb-10 font-light">{tagline}</p>}
          {has("menu") && (
            <a href="#menu" className="inline-block px-12 py-5 bg-white text-indigo-600 rounded-full text-lg font-bold hover:bg-gray-100 transition shadow-2xl">
              View Menu
            </a>
          )}
        </div>
      </header>

      {/* ABOUT */}
      {has("about") && about && (
        <section id="about" className="py-28 max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-5xl font-bold mb-10">Our Story</h2>
          <p className="text-lg leading-relaxed text-gray-700 whitespace-pre-line">{about}</p>
        </section>
      )}

      {/* MENU */}
      {has("menu") && menuItems.length > 0 && (
        <section id="menu" className="py-28 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-5xl font-bold mb-16 text-center">Our Menu</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {menuItems.map((item, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition hover:-translate-y-2">
                  <SafeImage
                    src={item.image}
                    alt={item.name}
                    className="h-64 w-full object-cover"
                    fallback={<div className="h-64 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center"><span className="text-gray-500">No image</span></div>}
                  />
                  <div className="p-6">
                    <h3 className="text-2xl font-bold mb-2">{item.name}</h3>
                    {item.description && <p className="text-gray-600">{item.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SERVICES */}
      {has("services") && services.length > 0 && (
        <section id="services" className="py-28 max-w-6xl mx-auto px-6">
          <h2 className="text-5xl font-bold mb-16 text-center">Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {services.map((s: any, i: number) => {
              const title = typeof s === "string" ? s : (s.title || s.name || "Untitled Service");
              const desc = typeof s === "string" ? "" : (s.desc || s.description || "");
              return (
                <div key={i} className="bg-white p-10 rounded-2xl shadow-xl hover:shadow-2xl transition">
                  <h3 className="text-3xl font-bold mb-4">{title}</h3>
                  {desc && <p className="text-gray-600 text-lg">{desc}</p>}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* GALLERY */}
      {has("gallery") && (
        <section id="gallery" className="py-28 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-5xl font-bold mb-16 text-center">Gallery</h2>
            {gallery.length === 0 ? (
              <p className="text-center text-gray-500 italic text-xl">No photos added yet</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {gallery.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt={`Gallery ${i + 1}`}
                    className="rounded-2xl h-64 w-full object-cover shadow-xl hover:scale-105 transition cursor-zoom-in"
                    loading="lazy"
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* CONTACT */}
      {has("contact") && contact && (
        <section id="contact" className="py-28 bg-gray-900 text-white">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-5xl font-bold mb-10">Get in Touch</h2>
            <p className="text-xl mb-8 leading-relaxed">{contact}</p>
            {mapUrl && (
              <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-6 underline text-lg hover:text-indigo-300 transition">
                Open in Google Maps →
              </a>
            )}
          </div>
        </section>
      )}

      <footer className="py-10 text-center bg-black text-white text-sm">
        © {new Date().getFullYear()} {brand}. All rights reserved.
      </footer>
    </div>
  );
}