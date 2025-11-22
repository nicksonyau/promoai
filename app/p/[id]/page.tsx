"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import RestaurantTemplate from "@/components/templates/RestaurantTemplate";
import OldTownTemplate from "@/components/templates/OldTownTemplate";
import { API_URL } from "../../api/config";

type StoreSections = {
  brand?: { logo?: string; heroImage?: string };
  about?: { story?: string };
  menu?: { name: string; price?: number; img?: string; description?: string }[];
  contact?: { phone?: string; email?: string; address?: string; mapUrl?: string; hours?: string };
  social?: { instagram?: string; facebook?: string; tiktok?: string; whatsapp?: string };
};

type StoreShape = {
  templateId?: string;
  brand?: string;
  tagline?: string;
  sections?: StoreSections;
};

/** 
 * 🔥 Resolve any image:
 * - Base64 remains base64
 * - Full http URLs stay as-is
 * - /r2/... → http://localhost:8787/r2/...
 */
const resolveImageUrl = (url?: string | null): string => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (url.startsWith("data:")) return url; // base64 preview
  if (url.startsWith("/r2/")) return `${API_URL}${url}`;
  return url;
};

export default function PreviewPage() {
  const { id } = useParams() as { id: string };
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    async function fetchStore() {
      try {
        const res = await fetch(`${API_URL}/store/${id}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`Store not found (${res.status})`);

        const raw = await res.json();
        const data: StoreShape = raw.store ?? raw;

        console.log("📦 Loaded Store:", data);

        const sections = data.sections ?? {};

        // ---------------------------
        // BRAND
        // ---------------------------
        const logo = resolveImageUrl(sections.brand?.logo) || "/images/default-logo.png";

        const heroImage =
          resolveImageUrl(sections.brand?.heroImage) ||
          "https://source.unsplash.com/1600x900/?restaurant,food";

        // ---------------------------
        // ABOUT
        // ---------------------------
        const about = sections.about?.story || "";

        // ---------------------------
        // MENU (Normalize & FINAL FIX)
        // ---------------------------
        const menuItems =
          (sections.menu || []).map((m) => ({
            name: m.name,
            image: resolveImageUrl(m.img),   // ← FIX HERE
            description:
              m.description?.trim() ??
              (m.price !== undefined && m.price !== null ? `RM ${m.price}` : ""),
          })) || [];

        // ---------------------------
        // CONTACT
        // ---------------------------
        const c = sections.contact || {};
        const contact = [c.address, c.phone, c.email].filter(Boolean).join(" • ");

        // ---------------------------
        // NORMALIZED TEMPLATE PROPS
        // ---------------------------
        const normalized = {
          templateId: (data.templateId || "restaurant").toLowerCase(),
          brand: data.brand || "",
          tagline: data.tagline || "",
          logo,
          heroImage,
          about,
          menuItems,
          contact,
          social: sections.social || {},
        };

        setStore(normalized);
      } catch (err) {
        console.error("❌ Preview Error:", err);
        setStore(null);
      } finally {
        setLoading(false);
      }
    }

    fetchStore();
  }, [id]);

  // ---------------------------
  // LOADING + ERROR STATES
  // ---------------------------
  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-600">
        Loading store preview...
      </div>
    );

  if (!store)
    return (
      <div className="flex justify-center items-center min-h-screen text-red-500">
        ❌ Store not found
      </div>
    );

  // ---------------------------
  // RENDER TEMPLATES
  // ---------------------------
  switch (store.templateId) {
    case "oldtown":
    case "kopitiam":
      return <OldTownTemplate {...store} />;

    default:
      return <RestaurantTemplate {...store} />;
  }
}
