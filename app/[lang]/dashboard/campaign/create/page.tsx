"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";
import { API_URL } from "../../../../api/config";

// ------------------------------
// Image Resolver (same as store)
// ------------------------------
const resolveImageUrl = (url?: string | null): string => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (url.startsWith("data:image")) return url;
  const clean = url.replace(/^\/+/, "");
  return `${API_URL}/${clean}`;
};

export default function CampaignCreatePage() {
  const router = useRouter();
  const params = useParams();
  const lang = (params?.lang as string) || "en";

  // ------------------------------
  // State
  // ------------------------------
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<any>({
    // still present for future store linkage, but hidden for now
    storeId: "",
    type: "flash-sale",
    title: "",
    description: "",
    bannerImage: "",
    products: [],
    cta: {
      whatsapp: "",
      orderUrl: "",
    },
    startDate: "",
    endDate: "",
  });

  // ------------------------------
  // Add Product Row
  // ------------------------------
  const addProduct = () => {
    setForm((prev: any) => ({
      ...prev,
      products: [
        ...prev.products,
        { name: "", orgPrice: "", promoPrice: "", img: "" },
      ],
    }));
  };

  // ------------------------------
  // Update Product
  // ------------------------------
  const updateProduct = (i: number, key: string, value: any) => {
    setForm((prev: any) => {
      const updated = [...prev.products];
      updated[i][key] = value;
      return { ...prev, products: updated };
    });
  };

  // ------------------------------
  // Remove Product
  // ------------------------------
  const removeProduct = (i: number) => {
    setForm((prev: any) => {
      const updated = [...prev.products];
      updated.splice(i, 1);
      return { ...prev, products: updated };
    });
  };

  // ------------------------------
  // Validate Before Submit
  // ------------------------------
  const validate = () => {
    // storeId is intentionally NOT required now (companyId is used on backend)
    if (!form.title.trim()) return "Campaign title is required";
    if (!form.bannerImage) return "Banner image is required";

    if (!Array.isArray(form.products) || form.products.length === 0) {
      return "Please add at least one product";
    }

    for (const p of form.products) {
      if (!p.name || !p.name.trim()) return "Each product must have a name";

      if (!p.orgPrice || isNaN(Number(p.orgPrice))) {
        return "Each product must have a valid original price";
      }
      if (!p.promoPrice || isNaN(Number(p.promoPrice))) {
        return "Each product must have a valid promo price";
      }
    }

    return null;
  };

  // ------------------------------
  // Submit (Create Campaign)
  // ------------------------------
  const submit = async () => {
    const err = validate();
    if (err) return toast.error(err);

    setSaving(true);
    try {
      const token = localStorage.getItem("sessionToken");

      const res = await fetch(`${API_URL}/campaign/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      setSaving(false);

      if (!res.ok || !data.success) {
        console.error("[CAMPAIGN CREATE FAILED]", data);
        toast.error(data.error || "Failed to create campaign");
        return;
      }

      toast.success("Campaign created!");
      router.push(`/${lang}/dashboard/campaign`);
    } catch (err) {
      console.error("[CAMPAIGN CREATE ERROR]", err);
      toast.error("Server error");
      setSaving(false);
    }
  };

  // ------------------------------
  // Page UI
  // ------------------------------
  return (
    <div className="max-w-4xl mx-auto p-6 lg:p-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Create Campaign
      </h1>

      {/* ---------------------- */}
      {/* Basic Info */}
      {/* ---------------------- */}
      <div className="form-card mb-6">
        <label className="form-label">Campaign Title</label>
        <input
          type="text"
          className="form-input"
          value={form.title}
          onChange={(e) =>
            setForm((prev: any) => ({ ...prev, title: e.target.value }))
          }
        />

        <label className="form-label mt-4">Description</label>
        <textarea
          className="form-textarea"
          rows={3}
          value={form.description}
          onChange={(e) =>
            setForm((prev: any) => ({ ...prev, description: e.target.value }))
          }
        />
      </div>

      {/* ---------------------- */}
      {/* Banner Image */}
      {/* ---------------------- */}
      <div className="form-card mb-6">
        <label className="form-label">Banner Image</label>
        <input
          type="file"
          accept="image/*"
          className="form-input"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () =>
              setForm((prev: any) => ({
                ...prev,
                bannerImage: reader.result as string,
              }));
            reader.readAsDataURL(file);
          }}
        />

        {form.bannerImage && (
          <img
            src={resolveImageUrl(form.bannerImage)}
            className="mt-4 rounded-lg max-h-60 object-cover border"
            alt="Campaign banner preview"
          />
        )}
      </div>

      {/* ---------------------- */}
      {/* Products */}
      {/* ---------------------- */}
      <div className="form-card mb-6">
        <div className="flex justify-between items-center">
          <label className="form-label">Products</label>
          <button type="button" onClick={addProduct} className="btn-secondary text-sm">
            + Add Product
          </button>
        </div>

        {form.products.length === 0 && (
          <p className="text-gray-500 mt-2">No products added yet.</p>
        )}

        <div className="space-y-5 mt-4">
          {form.products.map((p: any, i: number) => (
            <div key={i} className="border p-4 rounded-xl bg-white shadow-sm">
              <div className="form-grid-2 gap-4">
                <div>
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={p.name}
                    onChange={(e) =>
                      updateProduct(i, "name", e.target.value)
                    }
                  />
                </div>

                <div>
                  <label className="form-label">Original Price</label>
                  <input
                    type="text"
                    className="form-input"
                    value={p.orgPrice}
                    onChange={(e) =>
                      updateProduct(i, "orgPrice", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="form-grid-2 gap-4 mt-4">
                <div>
                  <label className="form-label">Promo Price</label>
                  <input
                    type="text"
                    className="form-input"
                    value={p.promoPrice}
                    onChange={(e) =>
                      updateProduct(i, "promoPrice", e.target.value)
                    }
                  />
                </div>

                <div>
                  <label className="form-label">Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="form-input"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () =>
                        updateProduct(i, "img", reader.result as string);
                      reader.readAsDataURL(file);
                    }}
                  />
                </div>
              </div>

              {p.img && (
                <img
                  src={resolveImageUrl(p.img)}
                  className="mt-4 rounded-md max-h-40 object-cover border"
                  alt="Product preview"
                />
              )}

              <button
                type="button"
                className="btn-danger mt-4"
                onClick={() => removeProduct(i)}
              >
                Remove Product
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ---------------------- */}
      {/* CTA Section */}
      {/* ---------------------- */}
      <div className="form-card mb-6">
        <label className="form-label">WhatsApp</label>
        <input
          type="text"
          className="form-input"
          placeholder="60123456789"
          value={form.cta.whatsapp}
          onChange={(e) =>
            setForm((prev: any) => ({
              ...prev,
              cta: { ...prev.cta, whatsapp: e.target.value },
            }))
          }
        />

        <label className="form-label mt-4">Order URL</label>
        <input
          type="text"
          className="form-input"
          placeholder="https://..."
          value={form.cta.orderUrl}
          onChange={(e) =>
            setForm((prev: any) => ({
              ...prev,
              cta: { ...prev.cta, orderUrl: e.target.value },
            }))
          }
        />
      </div>

      {/* ---------------------- */}
      {/* Buttons */}
      {/* ---------------------- */}
      <div className="flex justify-end mt-6">
        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="btn-primary"
        >
          {saving ? "Saving..." : "Create Campaign"}
        </button>
      </div>
    </div>
  );
}
