"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { API_URL } from "../../../../api/config";
import { QRCodeCanvas } from "qrcode.react";
import toast from "react-hot-toast";
import "@/app/globals.css";

export default function EditCampaignPage() {
  const { id } = useParams();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("Basic");
  const [shareUrl, setShareUrl] = useState("");

  const [form, setForm] = useState<any>({
    storeId: "",
    type: "discount",
    title: "",
    description: "",
    bannerImage: "",
    products: [],
    cta: { whatsapp: "", orderUrl: "" },
  });

  const [product, setProduct] = useState({
    name: "",
    orgPrice: "",
    promoPrice: "",
    img: "",
  });

  // Load campaign if editing
  useEffect(() => {
    if (!isEditMode) return;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/campaign/${id}`);
        const data = await res.json();

        if (res.ok && data) {
          setForm({
            storeId: data.storeId || "",
            type: data.type || "discount",
            title: data.title || "",
            description: data.description || "",
            bannerImage: data.bannerImage || "",
            products: Array.isArray(data.products) ? data.products : [],
            cta: {
              whatsapp: data?.cta?.whatsapp || "",
              orderUrl: data?.cta?.orderUrl || "",
            },
          });
          setShareUrl(`${window.location.origin}/promo/${data.id}`);
          toast.success("Campaign loaded ✅");
        } else toast.error("Failed to load campaign");
      } catch (err) {
        console.error(err);
        toast.error("Network error loading campaign");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isEditMode]);

  // Update helper
  const update = (path: string, value: any) => {
    setForm((prev: any) => {
      const cloned = structuredClone(prev);
      const keys = path.split(".");
      let obj = cloned;
      while (keys.length > 1) obj = obj[keys.shift()!];
      obj[keys[0]] = value;
      return cloned;
    });
  };

  const fileToBase64 = (file: File) =>
    new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });

  const addProduct = () => {
    if (!product.name || !product.promoPrice) return;
    update("products", [...form.products, product]);
    setProduct({ name: "", orgPrice: "", promoPrice: "", img: "" });
  };

  // Save or update
  const save = async () => {
    setSaving(true);
    try {
      const method = isEditMode ? "PUT" : "POST";
      const endpoint = isEditMode
        ? `${API_URL}/campaign/update/${id}`
        : `${API_URL}/campaign/create`;

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (res.ok && (data.id || data.success)) {
        const newId = data.id || id;
        setShareUrl(`${window.location.origin}/promo/${newId}`);
        toast.success(isEditMode ? "Updated successfully ✅" : "Created 🎉");
        setActiveTab("Preview / Publish");
      } else toast.error(data.error || "Failed to save");
    } catch (err) {
      console.error(err);
      toast.error("Network error saving campaign");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">
        Loading campaign...
      </div>
    );

  return (
    <div className="w-full bg-gray-50 min-h-screen px-8 py-10">
      {/* Header Section */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-purple-700 leading-tight">
          {isEditMode ? "Edit Promotion" : "New Promotion"}
        </h1>
        {isEditMode && (
          <p className="text-sm text-gray-400 mt-1">
            Campaign ID: <span className="font-mono">{id}</span>
          </p>
        )}
        <p className="text-gray-500 mt-2">
          For store:{" "}
          <span className="font-semibold">{form.storeId || "—"}</span>
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b mb-8 text-lg font-medium">
        {["Basic", "Products", "CTA", "Preview / Publish"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 transition-all ${
              activeTab === tab
                ? "border-b-2 border-purple-600 text-purple-700"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="max-w-3xl space-y-6">

        {/* BASIC */}
        {activeTab === "Basic" && (
          <>
            <div>
              <label className="block text-sm font-semibold mb-1">
                Promotion Type
              </label>
              <select
                value={form.type}
                onChange={(e) => update("type", e.target.value)}
                className="form-input w-full"
              >
                <option value="discount">% Discount</option>
                <option value="b1f1">Buy 1 Free 1</option>
                <option value="voucher">Voucher / Cashback</option>
                <option value="seasonal">Seasonal Campaign</option>
                <option value="flashdeal">Flash Deal</option>
              </select>
            </div>

            <input
              placeholder="Promotion Title"
              className="form-input w-full"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
            />

            <textarea
              placeholder="Describe the promotion"
              className="form-textarea w-full"
              rows={4}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
            />

            <div>
              <label className="block text-sm font-semibold mb-1">
                Campaign Banner
              </label>
              <input
                type="file"
                onChange={async (e) => {
                  if (e.target.files?.[0]) {
                    update(
                      "bannerImage",
                      await fileToBase64(e.target.files[0])
                    );
                  }
                }}
              />
              {form.bannerImage && (
                <img
                  src={form.bannerImage}
                  alt="Banner"
                  className="w-full rounded-lg mt-3"
                />
              )}
            </div>
          </>
        )}

        {/* PRODUCTS */}
        {activeTab === "Products" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                placeholder="Product Name"
                value={product.name}
                onChange={(e) =>
                  setProduct({ ...product, name: e.target.value })
                }
                className="form-input w-full"
              />
              <input
                placeholder="Original Price"
                value={product.orgPrice}
                onChange={(e) =>
                  setProduct({ ...product, orgPrice: e.target.value })
                }
                className="form-input w-full"
              />
              <input
                placeholder="Promo Price"
                value={product.promoPrice}
                onChange={(e) =>
                  setProduct({ ...product, promoPrice: e.target.value })
                }
                className="form-input w-full"
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-semibold mb-1 text-gray-700">
                Product Image
              </label>
              <input
                type="file"
                onChange={async (e) => {
                  if (e.target.files?.[0]) {
                    setProduct({
                      ...product,
                      img: await fileToBase64(e.target.files[0]),
                    });
                  }
                }}
              />
              {product.img && (
                <img
                  src={product.img}
                  alt="Preview"
                  className="w-24 h-24 object-cover rounded-lg mt-2 border"
                />
              )}
            </div>

            <button
              onClick={addProduct}
              className="mt-5 px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-all"
            >
              ➕ Add Product
            </button>

            {form.products.length > 0 && (
              <div className="mt-6 space-y-3">
                {form.products.map((p: any, i: number) => (
                  <div
                    key={i}
                    className="flex justify-between items-center border p-3 rounded-lg bg-white shadow-sm"
                  >
                    <div>
                      <p className="font-medium text-gray-800">{p.name}</p>
                      <p className="text-sm text-gray-500">
                        RM{p.promoPrice}{" "}
                        <span className="line-through text-gray-400">
                          RM{p.orgPrice}
                        </span>
                      </p>
                    </div>
                    {p.img && (
                      <img
                        src={p.img}
                        className="w-14 h-14 rounded object-cover border"
                        alt={p.name}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* CTA */}
        {activeTab === "CTA" && (
          <>
            <input
              placeholder="WhatsApp Link"
              className="form-input w-full"
              value={form.cta.whatsapp}
              onChange={(e) => update("cta.whatsapp", e.target.value)}
            />
            <input
              placeholder="Order URL (Grab/FoodPanda/Website)"
              className="form-input w-full"
              value={form.cta.orderUrl}
              onChange={(e) => update("cta.orderUrl", e.target.value)}
            />
          </>
        )}

        {/* PREVIEW / PUBLISH */}
        {activeTab === "Preview / Publish" && (
          <div className="flex flex-col items-center text-center space-y-6 py-8">
            <h2 className="text-2xl font-semibold text-purple-700">
              {isEditMode
                ? "Preview / Update Promotion"
                : "Promotion Published 🎉"}
            </h2>

            {shareUrl ? (
              <>
                <p className="text-gray-500">Public promo link:</p>
                <div className="flex gap-2 w-full max-w-md">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="form-input flex-1"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(shareUrl);
                      toast.success("Link copied!");
                    }}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700"
                  >
                    Copy
                  </button>
                </div>

                <div className="mt-6">
                  <QRCodeCanvas value={shareUrl} size={180} includeMargin />
                  <p className="text-xs text-gray-500 mt-2">{shareUrl}</p>
                </div>

                <button
                  onClick={() => toast.success("🎁 Voucher claimed!")}
                  className="px-5 py-2 rounded-lg border border-purple-300 text-purple-700 hover:bg-purple-100 transition"
                >
                  Claim Voucher
                </button>

                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-2 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition"
                >
                  View Public Promo
                </a>
              </>
            ) : (
              <p className="text-gray-500">
                Save your campaign first to generate a public link.
              </p>
            )}
          </div>
        )}

        {/* SAVE BUTTON */}
        {activeTab !== "Preview / Publish" && (
          <button
            onClick={save}
            className="mt-10 w-full py-3 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700"
          >
            {saving
              ? "Saving..."
              : isEditMode
              ? "Update Promotion"
              : "Publish Promotion"}
          </button>
        )}
      </div>
    </div>
  );
}
