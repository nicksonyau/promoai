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

    sections: {
      brand: { logo: "", heroImage: "" },
      about: { story: "" },
      menu: [],
      services: [],
      gallery: [],
      contact: {
        phone: "",
        email: "",
        address: "",
        mapUrl: "",
        hours: "",
      },
      social: {
        instagram: "",
        facebook: "",
        tiktok: "",
        whatsapp: "",
      },
    },

    sectionsEnabled: ["brand", "about", "products", "services", "gallery", "contact"],
  });

  const [product, setProduct] = useState({ name: "", price: "", img: "" });

  // --------------------------------------------------
  // LOAD STORE DATA
  // --------------------------------------------------
  useEffect(() => {
    if (!id) return;

    async function load() {
      try {
        const res = await fetch(`${API_URL}/store/${id}`, { cache: "no-store" });
        const data = await res.json();

        if (!data?.store) {
          alert("Store not found");
          setLoading(false);
          return;
        }

        let store = data.store;

        // ---------------------------
        // NORMALIZE sections object
        // ---------------------------
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

        // ---------------------------
        // NORMALIZE MENU FORMAT
        // ---------------------------
        if (!store.sections.menu) {
          store.sections.menu = [];
        } else if (
          Array.isArray(store.sections.menu) &&
          store.sections.menu.length > 0 &&
          !store.sections.menu[0].items
        ) {
          store.sections.menu = [
            {
              sectionName: "Menu",
              items: store.sections.menu,
            },
          ];
        }

        // ---------------------------
        // SAFE NORMALIZATION of sectionsEnabled
        // supports: null, undefined, [{key:"about"}], ["about"], [null]
        // ---------------------------
        let enabled = store.sectionsEnabled;

        if (!Array.isArray(enabled)) {
          enabled = [];
        } else {
          enabled = enabled
            .filter((e: any) => e !== null && e !== undefined)
            .map((e: any) => {
              if (typeof e === "string") return e;
              if (e && typeof e.key === "string") return e.key;
              return null;
            })
            .filter(Boolean);
        }

        // Ensure required section
        if (!enabled.includes("brand")) enabled.unshift("brand");

        // Default if empty
        if (enabled.length === 0) {
          enabled = ["brand", "about", "products", "services", "gallery", "contact"];
        }

        setForm({
          ...store,
          templateId: store.template ?? "restaurant",
          sectionsEnabled: enabled,
        });

        setLoading(false);
      } catch (err) {
        console.error("[STORE LOAD ERROR]", err);
        alert("Something went wrong. Please try again later.");
        setLoading(false);
      }
    }

    load();
  }, [id]);

  // --------------------------------------------------
  // DELETE IMAGE
  // --------------------------------------------------
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

  // --------------------------------------------------
  // VALIDATION
  // --------------------------------------------------
  const validateForm = () => {
    if (!form.brand.trim()) return "Brand name required.";
    if (!form.sections.brand.logo) return "Logo required.";
    if (!form.sections.brand.heroImage) return "Hero banner required.";

    if (form.sectionsEnabled.includes("products")) {
      const menu = form.sections.menu?.[0]?.items || [];
      if (menu.length === 0) return "At least one menu item required.";
      for (const item of menu) {
        if (!item.name?.trim()) return "Menu item must have a name.";
        if (isNaN(Number(item.price))) return "Menu item price must be digits.";
      }
    }

    return null;
  };

  // --------------------------------------------------
  // SUBMIT
  // --------------------------------------------------
  const submit = async () => {
    const error = validateForm();
    if (error) return alert(error);

    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/store/update/${form.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      setSaving(false);

      if (!res.ok || !data.success) {
        console.error("[UPDATE FAILED]", data);
        alert("Update failed");
        return;
      }

      router.push(to(`/dashboard/store/${form.id}`));
    } catch (err) {
      console.error("[STORE UPDATE ERROR]", err);
      alert("Server error");
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-gray-500">Loading...</div>;
  }

  return (
    <StoreForm
      form={form}
      setForm={setForm}
      product={product}
      setProduct={setProduct}
      deleteImage={deleteImage}
      saving={saving}
      onSubmit={submit}
    />
  );
}
