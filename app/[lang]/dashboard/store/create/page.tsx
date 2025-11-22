"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import StoreForm from "../components/StoreForm";
import { API_URL } from "../../../../api/config";
import useTranslations from "@/app/hooks/useTranslations";

export default function CreateStorePage() {
  const router = useRouter();
  const params = useParams();

  // 🔤 Locale & translations (same pattern as LoginPage)
  const lang = (params?.lang as string) || "en";
  const { t } = useTranslations(lang);

  // 🚏 Locale-aware URL builder
  const to = (path: string) => `/${lang}${path}`;

  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState({ name: "", price: "", img: "" });

  // Default store structure
  const [form, setForm] = useState({
    brand: "",
    tagline: "",
    templateId: "restaurant",
    sections: {
      brand: { logo: "", heroImage: "" },
      about: { story: "" },
      menu: [] as Array<{ name: string; price: number; img?: string }>,
      contact: { phone: "", email: "", address: "", mapUrl: "", hours: "" },
      social: { instagram: "", facebook: "", tiktok: "", whatsapp: "" },
    },
  });

  // ------------------------
  // SUBMIT HANDLER + VALIDATION
  // ------------------------
  const submit = async () => {
    // Brand required
    if (!form.brand.trim()) {
      alert(t("store.validation.brand_required"));
      return;
    }

    // Logo required
    if (!form.sections.brand.logo) {
      alert(t("store.validation.logo_required"));
      return;
    }

    // Hero banner required
    if (!form.sections.brand.heroImage) {
      alert(t("store.validation.hero_required"));
      return;
    }

    // At least one product
    if (form.sections.menu.length === 0) {
      alert(t("store.validation.product_required"));
      return;
    }

    // Per-product validation
    for (const item of form.sections.menu) {
      if (!item.name || !item.name.trim()) {
        alert(t("store.validation.product_name_required"));
        return;
      }
      if (
        item.price === undefined ||
        item.price === null ||
        isNaN(Number(item.price))
      ) {
        alert(t("store.validation.product_price_invalid"));
        return;
      }
    }

    setSaving(true);

    try {
      const res = await fetch(`${API_URL}/store/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json().catch(() => ({}));

      setSaving(false);

      if (res.ok && data.success && data.store?.id) {
        // ✅ Locale-aware redirect
        router.push(to(`/dashboard/store/${data.store.id}`));
        return;
      }

      alert(
        data.error ||
          t("store.errors.create_failed")
      );
    } catch (err) {
      console.error("Store creation error:", err);
      setSaving(false);
      alert(t("errors.SERVER_ERROR"));
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 px-8 py-10">
      {/* Page Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-purple-700">
          {t("store.create_title")}
        </h1>
        <p className="text-gray-500 mt-1">
          {t("store.create_subtitle")}
        </p>
      </div>

      {/* Store Form */}
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
