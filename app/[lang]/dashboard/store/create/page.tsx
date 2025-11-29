"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import StoreForm from "../components/StoreForm";
import { API_URL } from "../../../../api/config";
import useTranslations from "@/app/hooks/useTranslations";

export default function CreateStorePage() {
  const router = useRouter();
  const params = useParams();

  // Locale
  const lang = (params?.lang as string) || "en";
  const { t } = useTranslations(lang);
  const to = (path: string) => `/${lang}${path}`;

  const [saving, setSaving] = useState(false);

  const [product, setProduct] = useState({
    name: "",
    price: "",
    img: "",
  });

  // Default structure (unchanged)
  const [form, setForm] = useState({
    brand: "",
    tagline: "",
    templateId: "restaurant",
    slug: "",
    publicUrl: "",
    sectionsEnabled: ["brand", "about", "products", "services", "gallery", "contact"],
    sections: {
      brand: { logo: "", heroImage: "" },
      about: { story: "" },
      menu: [
        {
          sectionName: "Menu",
          items: [] as Array<{ name: string; price: number; img?: string }>,
        },
      ],
      contact: { phone: "", email: "", address: "", mapUrl: "", hours: "" },
      social: { instagram: "", facebook: "", tiktok: "", whatsapp: "" },
      services: [],
      gallery: [],
    },
  });

  // -------------------------------
  // SUBMIT HANDLER (WITH AUTH FIX)
  // -------------------------------
  const submit = async () => {
    // validation
    if (!form.brand.trim()) return alert(t("store.validation.brand_required"));
    if (!form.sections.brand.logo) return alert(t("store.validation.logo_required"));
    if (!form.sections.brand.heroImage) return alert(t("store.validation.hero_required"));

    const menu = form.sections.menu ?? [];
    const firstSection = menu[0] ?? { items: [] };
    const items = firstSection.items ?? [];

    if (items.length === 0) {
      alert(t("store.validation.product_required"));
      return;
    }

    for (const item of items) {
      if (!item.name?.trim()) return alert(t("store.validation.product_name_required"));
      if (isNaN(Number(item.price))) return alert(t("store.validation.product_price_invalid"));
    }

    // ---------------------------
    // NEW: AUTH HEADER REQUIRED
    // ---------------------------
    const token = localStorage.getItem("sessionToken");
    if (!token) {
      alert("Missing session token. Please login again.");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`${API_URL}/store/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`, // 🔥 FIXED
        },
        body: JSON.stringify(form),
      });

      const data = await res.json().catch(() => ({}));
      setSaving(false);

      if (res.ok && data.success && data.store?.id) {
        router.push(to(`/dashboard/store/${data.store.id}`));
        return;
      }

      alert(data.error || t("store.errors.create_failed"));
    } catch (err) {
      console.error("Store creation error:", err);
      setSaving(false);
      alert(t("errors.SERVER_ERROR"));
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 px-8 py-10">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-purple-700">
          {t("store.create_title")}
        </h1>
        <p className="text-gray-500 mt-1">{t("store.create_subtitle")}</p>
      </div>

      <StoreForm
        form={form}
        setForm={setForm}
        product={product}
        setProduct={setProduct}
        deleteImage={(path: string) =>
          setForm((prev: any) => {
            const updated = structuredClone(prev);
            const keys = path.split(".");
            let obj = updated;
            while (keys.length > 1) obj = obj[keys.shift()!];
            obj[keys[0]] = "";
            return updated;
          })
        }
        onSubmit={submit}
        saving={saving}
      />
    </div>
  );
}
