"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { API_URL } from "../../../../api/config";

const resolveImageUrl = (url?: string | null): string => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (url.startsWith("data:image")) return url;
  return `${API_URL}/${url.replace(/^\/+/, "")}`;
};

export default function CampaignEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const lang = (params?.lang as string) || "en";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<any>({
    type: "flash-sale",
    title: "",
    description: "",
    bannerImage: "",
    products: [],
    cta: { whatsapp: "", orderUrl: "" },
    startDate: "",
    endDate: "",
    companyId: null, // ADDED default
  });

  // -----------------------------
  // Load Campaign
  // -----------------------------
  useEffect(() => {
    if (!id) return;

    (async () => {
      try {
        const token = localStorage.getItem("sessionToken");
        const res = await fetch(`${API_URL}/campaign/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error || "Failed to load");
          return;
        }

        setForm({
          type: data.type || "flash-sale",
          title: data.title || "",
          description: data.description || "",
          bannerImage: resolveImageUrl(data.bannerImage),
          products: Array.isArray(data.products) ? data.products : [],
          cta: {
            whatsapp: data?.cta?.whatsapp || "",
            orderUrl: data?.cta?.orderUrl || "",
          },
          startDate: data.startDate || "",
          endDate: data.endDate || "",
          companyId: data.companyId || null, // ✅ ADDED
        });

        toast.success("Campaign loaded");
      } catch (err) {
        toast.error("Network error");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // -----------------------------
  // Helpers
  // -----------------------------
  const fileToBase64 = (file: File) =>
    new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });

  const updateProduct = (i: number, key: string, val: any) => {
    setForm((prev: any) => {
      const copy = [...prev.products];
      copy[i][key] = val;
      return { ...prev, products: copy };
    });
  };

  const removeProduct = (i: number) => {
    setForm((prev: any) => {
      const copy = [...prev.products];
      copy.splice(i, 1);
      return { ...prev, products: copy };
    });
  };

  const addProduct = () => {
    setForm((prev: any) => ({
      ...prev,
      products: [
        ...prev.products,
        { name: "", orgPrice: "", promoPrice: "", img: "" },
      ],
    }));
  };

  const validate = () => {
    if (!form.title.trim()) return "Title required";
    if (!form.bannerImage) return "Banner required";
    if (!Array.isArray(form.products) || form.products.length === 0)
      return "At least 1 product";

    for (let p of form.products) {
      if (!p.name) return "Product name required";
      if (!p.orgPrice || isNaN(Number(p.orgPrice)))
        return "Invalid original price";
      if (!p.promoPrice || isNaN(Number(p.promoPrice)))
        return "Invalid promo price";
    }

    return null;
  };

  // -----------------------------
  // Save Update
  // -----------------------------
  const save = async () => {
    const err = validate();
    if (err) return toast.error(err);

    setSaving(true);
    try {
      const token = localStorage.getItem("sessionToken");

      const res = await fetch(`${API_URL}/campaign/update/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      setSaving(false);

      if (!res.ok || !data.success) {
        toast.error(data.error || "Failed to update");
        return;
      }

      toast.success("Updated successfully");
      router.push(`/${lang}/dashboard/campaign`);
    } catch (err) {
      toast.error("Server error");
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div className="max-w-4xl mx-auto p-6 lg:p-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Edit Campaign
      </h1>

      {/* SHOW COMPANY ID */}
      <p className="text-gray-500 mb-6">
        Company ID:{" "}
        <span className="font-mono text-purple-700">{form.companyId}</span>
      </p>

      {/* BASIC INFO */}
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

        <label className="form-label mt-4">Campaign Type</label>
        <select
          value={form.type}
          className="form-input"
          onChange={(e) =>
            setForm((prev: any) => ({ ...prev, type: e.target.value }))
          }
        >
          <option value="flash-sale">Flash Sale</option>
          <option value="seasonal">Seasonal</option>
          <option value="bundle">Bundle</option>
          <option value="clearance">Clearance</option>
          <option value="new-arrival">New Arrival</option>
        </select>
      </div>

      {/* BANNER */}
      <div className="form-card mb-6">
        <label className="form-label">Banner Image</label>
        <input
          type="file"
          accept="image/*"
          className="form-input"
          onChange={async (e) => {
            if (e.target.files?.[0]) {
              const base64 = await fileToBase64(e.target.files[0]);
              setForm((prev: any) => ({ ...prev, bannerImage: base64 }));
            }
          }}
        />

        {form.bannerImage && (
          <img
            src={resolveImageUrl(form.bannerImage)}
            className="mt-4 rounded-lg max-h-60 object-cover border"
          />
        )}
      </div>

      {/* PRODUCTS */}
      <div className="form-card mb-6">
        <div className="flex justify-between items-center">
          <label className="form-label">Products</label>
          <button onClick={addProduct} className="btn-secondary text-sm">
            + Add Product
          </button>
        </div>

        <div className="mt-4 space-y-5">
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
                    onChange={async (e) => {
                      if (e.target.files?.[0]) {
                        const base64 = await fileToBase64(e.target.files[0]);
                        updateProduct(i, "img", base64);
                      }
                    }}
                  />
                </div>
              </div>

              {p.img && (
                <img
                  src={resolveImageUrl(p.img)}
                  className="mt-4 rounded-md max-h-40 object-cover border"
                />
              )}

              <button
                onClick={() => removeProduct(i)}
                className="btn-danger mt-4"
              >
                Remove Product
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="form-card mb-6">
        <label className="form-label">WhatsApp</label>
        <input
          className="form-input"
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
          className="form-input"
          value={form.cta.orderUrl}
          onChange={(e) =>
            setForm((prev: any) => ({
              ...prev,
              cta: { ...prev.cta, orderUrl: e.target.value },
            }))
          }
        />
      </div>

      <div className="flex justify-end mt-6">
        <button
          onClick={save}
          disabled={saving}
          className="btn-primary"
        >
          {saving ? "Updating..." : "Update Campaign"}
        </button>
      </div>
    </div>
  );
}
