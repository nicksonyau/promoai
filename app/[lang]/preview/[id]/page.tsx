"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import GenericModernTemplate from "@/components/templates/GenericModernTemplate";
import { API_URL } from "../../../api/config";

const resolveImageUrl = (url?: string | null): string => {
  if (!url) return "";
  if (typeof url !== "string") return "";
  if (url.startsWith("http") || url.startsWith("data:")) return url;
  if (url.startsWith("/r2/")) return `${API_URL}${url}`;
  return url;
};

export default function PreviewPage() {
  const { id } = useParams() as { id: string };
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    async function load() {
      try {
        const res = await fetch(`${API_URL}/store/${id}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Not found");
        const raw = await res.json();
        const data = raw.store ?? raw;
        const sections = data.sections ?? {};

        let enabled = (data.sectionsEnabled || [])
          .map((e: any) => (typeof e === "string" ? e : e?.key || null))
          .filter(Boolean)
          .map((e: string) => e.toLowerCase().trim());

        if (enabled.includes("products")) {
          enabled = enabled.filter(e => e !== "products");
          enabled.push("menu");
        }

        let menuItemsRaw: any[] = [];
        if (Array.isArray(sections.menu)) {
          if (sections.menu[0]?.name) menuItemsRaw = sections.menu;
          else if (sections.menu[0]?.items) menuItemsRaw = sections.menu[0].items;
        }

        // FIXED: Handle both string URLs and {img, caption} objects
        const rawGallery = Array.isArray(sections.gallery) ? sections.gallery : [];
        const gallery = rawGallery
          .map((item: any) => {
            if (!item) return "";
            // If it's a string, return it directly
            if (typeof item === "string") return item;
            // If it's an object, extract the img property
            return item.img || item.image || "";
          })
          .map(resolveImageUrl)
          .filter((url: string) => url && url.trim() !== "");

        // Auto-enable sections based on content
        if (menuItemsRaw.length > 0) enabled.push("menu");
        if ((sections.services || []).length > 0) enabled.push("services");
        if (gallery.length > 0) enabled.push("gallery");
        if (sections.contact && Object.values(sections.contact || {}).some(v => v)) enabled.push("contact");

        // Remove duplicates
        enabled = [...new Set(enabled)];

        setStore({
          brand: data.brand || "Your Store",
          tagline: data.tagline || "",
          logo: resolveImageUrl(sections.brand?.logo),
          heroImage: resolveImageUrl(sections.brand?.heroImage),
          about: enabled.includes("about") ? (sections.about?.story || "").trim() : "",
          menuItems: menuItemsRaw.map((m: any) => ({
            name: m.name || "Item",
            image: resolveImageUrl(m.img || m.image),
            description: m.description || (m.price ? `RM ${m.price}` : ""),
          })),
          services: sections.services || [],
          gallery,
          contact: enabled.includes("contact") ? [
            sections.contact?.address,
            sections.contact?.phone,
            sections.contact?.email,
            sections.contact?.hours ? `Hours: ${sections.contact.hours}` : ""
          ].filter(Boolean).join(" • ") : "",
          mapUrl: sections.contact?.mapUrl || "",
          enabled,
        });
      } catch (err) {
        console.error(err);
        setStore(null);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-2xl">
        Loading…
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500 text-2xl">
        Store not found
      </div>
    );
  }

  return <GenericModernTemplate key={id} {...store} />;
}