"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import StoreForm from "../components/StoreForm";
import { API_URL } from "../../../../api/config";
import useTranslations from "@/app/hooks/useTranslations";

export default function EditStorePage() {
  const router = useRouter();
  const params = useParams();

  const lang = (params?.lang as string) || "en";
  const id = params?.id as string;

  const { t } = useTranslations(lang);
  const to = (path: string) => `/${lang}${path}`;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<any>({
    id: "",
    brand: "",
    tagline: "",
    templateId: "restaurant",
    companyId: "",                     // ⭐ added
    sections: {
      brand: { logo: "", heroImage: "" },
      about: { story: "" },
      menu: [],
      services: [],
      gallery: [],
      contact: { phone: "", email: "", address: "", mapUrl: "", hours: "" },
      social: { instagram: "", facebook: "", tiktok: "", whatsapp: "" },
    },
    sectionsEnabled: ["brand", "about", "products", "services", "gallery", "contact"],
  });

  const [product, setProduct] = useState({ name: "", price: "", img: "" });

  // R2 resolver
  const resolveImage = (url?: string) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    if (url.startsWith("/r2/")) return `${API_URL}${url}`;
    return url;
  };

  // LOAD STORE DATA
  useEffect(() => {
    if (!id) return;

    async function load() {
      try {
        const token = localStorage.getItem("sessionToken");

        const res = await fetch(`${API_URL}/store/${id}`, {
          cache: "no-store",
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();

        if (!data?.store) {
          alert("Store not found");
          setLoading(false);
          return;
        }

        let store = data.store;

        // normalize
        store.sections = store.sections ?? {};
        store.sections.brand = store.sections.brand ?? { logo: "", heroImage: "" };
        store.sections.about = store.sections.about ?? { story: "" };
        store.sections.services = store.sections.services ?? [];
        store.sections.gallery = store.sections.gallery ?? [];
        store.sections.contact = store.sections.contact ?? {
          phone: "",
          email: "",
          address: "",
          mapUrl: "",
          hours: "",
        };
        store.sections.social = store.sections.social ?? {
          instagram: "",
          facebook: "",
          tiktok: "",
          whatsapp: "",
        };

        // Menu fix
        if (!store.sections.menu) {
          store.sections.menu = [{ sectionName: "Menu", items: [] }];
        } else if (
          Array.isArray(store.sections.menu) &&
          store.sections.menu.length > 0 &&
          !store.sections.menu[0].items
        ) {
          store.sections.menu = [
            { sectionName: "Menu", items: store.sections.menu },
          ];
        }

        // sectionsEnabled normalize
        let enabled = store.sectionsEnabled || [];
        if (!Array.isArray(enabled)) enabled = [];
        enabled = enabled
          .filter((e) => e)
          .map((e: any) => (typeof e === "string" ? e : e?.key))
          .filter(Boolean);

        if (!enabled.includes("brand")) enabled.unshift("brand");
        if (enabled.length === 0)
          enabled = ["brand", "about", "products", "services", "gallery", "contact"];

        // Fix image URLs
        store.sections.brand.logo = resolveImage(store.sections.brand.logo);
        store.sections.brand.heroImage = resolveImage(store.sections.brand.heroImage);

        if (store.sections.menu?.[0]?.items) {
          store.sections.menu[0].items = store.sections.menu[0].items.map((it: any) => ({
            ...it,
            img: resolveImage(it.img),
          }));
        }

        setForm({
          ...store,
          templateId: store.template ?? "restaurant",
          sectionsEnabled: enabled,
        });

        setLoading(false);
      } catch (err) {
        console.error("[STORE LOAD ERROR]", err);
        alert("Failed to load store");
        setLoading(false);
      }
    }

    load();
  }, [id]);

  const deleteImage = (path: string) => {
    setForm((prev: any) => {
      const updated = structuredClone(prev);
      const parts = path.split(".");
      let obj = updated;

      while (parts.length > 1) obj = obj[parts.shift()!];
      obj[parts[0]] = "";
      return updated;
    });
  };

  const validate = () => {
    if (!form.brand.trim()) return "Brand name required.";
    if (!form.sections.brand.logo) return "Logo required.";
    if (!form.sections.brand.heroImage) return "Hero banner required.";

    const menu = form.sections.menu?.[0]?.items || [];
    if (menu.length === 0) return "At least one menu item required.";

    for (const item of menu) {
      if (!item.name?.trim()) return "Menu item name required.";
      if (isNaN(Number(item.price))) return "Menu item price invalid.";
    }

    return null;
  };

  const submit = async () => {
    const error = validate();
    if (error) return alert(error);

    setSaving(true);

    try {
      const token = localStorage.getItem("sessionToken");

      const res = await fetch(`${API_URL}/store/update/${form.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      setSaving(false);

      if (!data.success) {
        alert("Update failed");
        return;
      }

      router.push(to(`/dashboard/store/${form.id}`));
    } catch (err) {
      console.error(err);
      alert("Server error");
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-gray-500">Loading...</div>;

  return (
    <>
      {/* ⭐ SHOW companyId + storeId */}
      <div className="p-4 mb-6 bg-gray-100 rounded-lg border text-gray-700">
        <div><b>Store ID:</b> {form.id}</div>
        <div><b>Company ID:</b> {form.companyId || "—"}</div>
      </div>

      <StoreForm
        form={form}
        setForm={setForm}
        product={product}
        setProduct={setProduct}
        deleteImage={deleteImage}
        saving={saving}
        onSubmit={submit}
      />
    </>
  );
}
