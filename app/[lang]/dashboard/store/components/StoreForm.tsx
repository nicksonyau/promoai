"use client";

import { useEffect, useState } from "react";

type Props = {
  form: any;
  setForm: (fn: any) => void;
  product: { name: string; price: string | number; img: string };
  setProduct: (fn: any) => void;
  deleteImage: (path: string) => void;
  onSubmit: () => void;
  saving: boolean;
};

const DEFAULT_MENU_SECTION = () => ({ sectionName: "Menu", items: [] });

export default function StoreForm({ form, setForm, product, setProduct, deleteImage, onSubmit, saving }: Props) {
  const [activeTab, setActiveTab] = useState<string>("Page Sections");
  const [error, setError] = useState<string>("");
  const [slug, setSlug] = useState<string>(form.slug || "");
  const [publicUrl, setPublicUrl] = useState<string>(form.publicUrl || "");
  const [publishing, setPublishing] = useState(false);

  // local inputs for services and gallery
  const [newService, setNewService] = useState({ name: "", description: "" });
  const [newGallery, setNewGallery] = useState({ img: "", caption: "" });

  useEffect(() => {
    // ensure sectionsEnabled exists on mount (do NOT loop)
    setForm((prev: any) => {
      if (prev.sectionsEnabled && Array.isArray(prev.sectionsEnabled)) return prev;
      return { ...prev, sectionsEnabled: ["brand", "about", "products", "services", "gallery", "contact"] };
    });

    // ensure there's at least one menu section
    setForm((prev: any) => {
      const updated = structuredClone(prev);
      updated.sections = updated.sections ?? {};
      updated.sections.menu = updated.sections.menu ?? [];
      if (updated.sections.menu.length === 0) updated.sections.menu = [DEFAULT_MENU_SECTION()];
      return updated;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (form.slug) setSlug(form.slug);
    if (form.publicUrl) setPublicUrl(form.publicUrl);
  }, [form.slug, form.publicUrl]);

  const API_IMAGE_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

  const resolveImageUrl = (src: string | undefined | null) => {
    if (!src) return "";
    if (src.startsWith("data:")) return src;
    if (src.startsWith("http")) return src;
    if (src.startsWith("/r2/")) return `${API_IMAGE_BASE}${src}`;
    return src;
  };

  const update = (path: string, value: any) => {
    setForm((prev: any) => {
      const updated = structuredClone(prev);
      const keys = path.split(".");
      let obj: any = updated;
      while (keys.length > 1) obj = obj[keys.shift()!];
      obj[keys[0]] = value;
      return updated;
    });
  };

  const fileToBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });

  const handleImageUpload = async (key: string, e: any) => {
    if (!e.target.files?.[0]) return;
    const base64 = await fileToBase64(e.target.files[0]);
    update(key, base64);
  };

  const handleProductImageUpload = async (e: any) => {
    if (!e.target.files?.[0]) return;
    const base64 = await fileToBase64(e.target.files[0]);
    setProduct((p: any) => ({ ...p, img: base64 }));
  };

  const handleGalleryImageUpload = async (e: any) => {
    if (!e.target.files?.[0]) return;
    const base64 = await fileToBase64(e.target.files[0]);
    setNewGallery((g) => ({ ...g, img: base64 }));
  };

  // convenience getters
  const menuSections = form.sections?.menu ?? [DEFAULT_MENU_SECTION()];
  const firstSection = menuSections[0];

  // validation before saving
  const validateBeforeSave = () => {
    if (!form.brand || !form.brand.trim()) {
      setError("⚠️ Brand name is required.");
      return;
    }
    if (!form.sections?.brand?.logo) {
      setError("⚠️ Brand logo is required.");
      return;
    }
    if (!form.sections?.brand?.heroImage) {
      setError("⚠️ Hero banner is required.");
      return;
    }
    // if products enabled, require at least one product
    if (form.sectionsEnabled?.includes("products")) {
      const items = firstSection?.items || [];
      if (!items.length) {
        setError("⚠️ At least one product required when Products is enabled.");
        return;
      }
    }
    setError("");
    onSubmit();
  };

  // PAGE SECTIONS config
  const PAGE_SECTIONS = [
    { key: "brand", label: "Brand" },
    { key: "about", label: "About" },
    { key: "products", label: "Products" },
    { key: "services", label: "Services" },
    { key: "gallery", label: "Gallery" },
    { key: "contact", label: "Contact" },
  ];

  const toggleSection = (key: string) => {
    if (key === "brand") return; // keep brand mandatory
    setForm((prev: any) => {
      const enabled = new Set(prev.sectionsEnabled || []);
      if (enabled.has(key)) enabled.delete(key);
      else enabled.add(key);
      return { ...prev, sectionsEnabled: Array.from(enabled) };
    });
  };

  // Products
  const addProduct = () => {
    if (!product.name || !product.name.trim()) {
      setError("⚠️ Product name is required.");
      return;
    }
    if (!product.price || isNaN(Number(product.price))) {
      setError("⚠️ Price must be a number.");
      return;
    }
    if (!product.img) {
      setError("⚠️ Product image is required.");
      return;
    }

    setForm((prev: any) => {
      const updated = structuredClone(prev);
      updated.sections = updated.sections ?? {};
      updated.sections.menu = updated.sections.menu ?? [DEFAULT_MENU_SECTION()];
      updated.sections.menu[0].items = updated.sections.menu[0].items ?? [];
      updated.sections.menu[0].items.push({
        name: product.name.trim(),
        price: Number(product.price),
        img: product.img,
      });
      return updated;
    });

    setProduct({ name: "", price: "", img: "" });
    setError("");
  };

  const deleteProduct = (sectionIndex: number, itemIndex: number) => {
    setForm((prev: any) => {
      const updated = structuredClone(prev);
      updated.sections.menu[sectionIndex].items.splice(itemIndex, 1);
      return updated;
    });
  };

  const updateSectionName = (name: string, index: number) => {
    setForm((prev: any) => {
      const updated = structuredClone(prev);
      updated.sections = updated.sections ?? {};
      updated.sections.menu = updated.sections.menu ?? [DEFAULT_MENU_SECTION()];
      updated.sections.menu[index].sectionName = name;
      return updated;
    });
  };

  // Services
  const addService = () => {
    if (!newService.name.trim()) {
      setError("⚠️ Service name required.");
      return;
    }
    update("sections.services", [...(form.sections.services || []), { ...newService }]);
    setNewService({ name: "", description: "" });
    setError("");
  };

  const deleteService = (idx: number) => {
    update("sections.services", (form.sections.services || []).filter((_: any, i: number) => i !== idx));
  };

  // Gallery
  const addGallery = () => {
    if (!newGallery.img) {
      setError("⚠️ Gallery image required.");
      return;
    }
    update("sections.gallery", [...(form.sections.gallery || []), { ...newGallery }]);
    setNewGallery({ img: "", caption: "" });
    setError("");
  };

  const deleteGallery = (idx: number) => {
    update("sections.gallery", (form.sections.gallery || []).filter((_: any, i: number) => i !== idx));
  };

  // Publish
  const handlePublish = async () => {
    try {
      setPublishing(true);
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";
      const res = await fetch(`${API}/store/publish/${form.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const data = await res.json();
      if (data?.success) {
        setPublicUrl(data.publicUrl);
        setForm((prev:any) => ({ ...prev, slug, publicUrl: data.publicUrl }));
        alert("✅ Store published successfully!");
      } else {
        alert("❌ Publish failed: " + (data?.error || "unknown"));
      }
    } catch (err) {
      console.error(err);
      alert("⚠️ Publish failed.");
    } finally {
      setPublishing(false);
    }
  };

  // Render
  return (
    <div className="max-w-5xl mx-auto w-full pb-20">
      {error && <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">{error}</div>}

      <div className="flex gap-6 border-b mb-6 overflow-x-auto whitespace-nowrap">
        {[
          "Page Sections",
          "Brand",
          "About",
          "Products",
          "Services",
          "Gallery",
          "Contact",
          "Social",
          "Publish",
        ].map((t) => (
          <button
            key={t}
            onClick={() => { setActiveTab(t); setError(""); }}
            className={`pb-3 text-sm font-semibold transition ${activeTab === t ? "text-purple-600 border-b-2 border-purple-600" : "text-gray-600 hover:text-purple-500"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* PAGE SECTIONS */}
      {activeTab === "Page Sections" && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Select sections to show on your public page</h3>
          <div className="space-y-3">
            {PAGE_SECTIONS.map((s) => (
              <label key={s.key} className="flex items-center gap-3 text-sm">
                <input type="checkbox" checked={form.sectionsEnabled?.includes(s.key)} onChange={() => toggleSection(s.key)} disabled={s.key === "brand"} />
                <span>{s.label}</span>
                {s.key === "brand" && <span className="text-xs text-gray-400 ml-2">(Always On)</span>}
              </label>
            ))}
          </div>
          <div className="mt-4 text-xs text-gray-500">These sections will appear on your public microsite.</div>
        </div>
      )}

      {/* BRAND */}
      {activeTab === "Brand" && (
        <div className="space-y-6">
          <div>
            <label className="block mb-2 text-sm font-medium">Brand Name *</label>
            <input className="w-full p-3 border rounded-lg bg-white" value={form.brand} onChange={(e) => update("brand", e.target.value)} />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium">Tagline</label>
            <input className="w-full p-3 border rounded-lg bg-white" value={form.tagline} onChange={(e) => update("tagline", e.target.value)} />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium">Logo *</label>
            <input type="file" accept="image/*" onChange={(e) => handleImageUpload("sections.brand.logo", e)} />
            {form.sections.brand?.logo && <div className="mt-2 flex items-center gap-4"><img src={resolveImageUrl(form.sections.brand.logo)} className="w-24 h-24 object-contain rounded border" /><button className="text-red-600 underline" onClick={() => deleteImage("sections.brand.logo")}>Remove</button></div>}
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium">Hero Banner *</label>
            <input type="file" accept="image/*" onChange={(e) => handleImageUpload("sections.brand.heroImage", e)} />
            {form.sections.brand?.heroImage && <div className="mt-2 relative"><img src={resolveImageUrl(form.sections.brand.heroImage)} className="w-full h-48 object-cover rounded border" /><button className="absolute top-2 right-2 bg-white px-2 py-1 rounded text-red-600" onClick={() => deleteImage("sections.brand.heroImage")}>Remove</button></div>}
          </div>
        </div>
      )}

      {/* ABOUT */}
      {activeTab === "About" && (
        <div>
          <label className="block mb-2 text-sm font-medium">Your Brand Story</label>
          <textarea className="w-full p-3 border rounded-lg bg-white" rows={6} value={form.sections.about?.story || ""} onChange={(e) => update("sections.about.story", e.target.value)} />
        </div>
      )}

      {/* PRODUCTS */}
      {activeTab === "Products" && (
        <div className="space-y-6">
          <div>
            <label className="block mb-2 text-sm font-medium">Menu Section Name</label>
            <input className="w-full p-3 border rounded-lg bg-white" value={firstSection?.sectionName || ""} onChange={(e) => updateSectionName(e.target.value, 0)} />
          </div>

          <div className="space-y-3">
            <div className="font-semibold">Add Product</div>
            <div className="flex gap-3">
              <input className="flex-1 p-3 border rounded-lg" placeholder="Name" value={product.name} onChange={(e) => setProduct((p:any) => ({ ...p, name: e.target.value }))} />
              <input className="w-32 p-3 border rounded-lg" placeholder="Price" value={product.price} onChange={(e) => setProduct((p:any) => ({ ...p, price: e.target.value }))} />
            </div>
            <input type="file" accept="image/*" onChange={handleProductImageUpload} />
            {product.img && <img src={product.img} className="w-20 h-20 object-cover rounded mt-2" />}
            <button className="bg-purple-600 text-white px-4 py-2 rounded mt-2" onClick={addProduct}>Add Product</button>
          </div>

          <div>
            <h3 className="font-semibold">Existing Products</h3>
            {(firstSection?.items || []).length === 0 ? <div className="text-gray-500 p-4 border rounded">No products yet</div> : (firstSection.items || []).map((it:any, idx:number) => (
              <div key={idx} className="flex items-center justify-between p-3 border rounded my-2 bg-gray-50">
                <div>
                  <div className="font-semibold">{it.name}</div>
                  <div className="text-sm text-gray-600">RM {Number(it.price).toFixed(2)}</div>
                </div>
                <div className="flex items-center gap-3">
                  {it.img && <img src={resolveImageUrl(it.img)} className="w-16 h-16 object-cover rounded" />}
                  <button className="text-red-600 underline" onClick={() => deleteProduct(0, idx)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SERVICES */}
      {activeTab === "Services" && (
        <div className="space-y-6">
          <div>
            <label className="block mb-2 text-sm font-medium">Add Service</label>
            <input className="w-full p-3 border rounded mb-2" placeholder="Service name" value={newService.name} onChange={(e) => setNewService(s => ({ ...s, name: e.target.value }))} />
            <textarea className="w-full p-3 border rounded mb-2" rows={3} placeholder="Brief description" value={newService.description} onChange={(e) => setNewService(s => ({ ...s, description: e.target.value }))} />
            <button className="bg-purple-600 text-white px-4 py-2 rounded" onClick={addService}>Add Service</button>
          </div>

          <div>
            <h3 className="font-semibold">Existing Services</h3>
            {(form.sections.services || []).length === 0 ? <div className="text-gray-500 p-4 border rounded">No services yet</div> : (form.sections.services || []).map((s:any, idx:number) => (
              <div key={idx} className="flex items-start justify-between p-3 border rounded my-2 bg-gray-50">
                <div>
                  <div className="font-semibold">{s.name}</div>
                  <div className="text-sm text-gray-600">{s.description}</div>
                </div>
                <button className="text-red-600 underline" onClick={() => deleteService(idx)}>Delete</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GALLERY */}
      {activeTab === "Gallery" && (
        <div className="space-y-6">
          <div>
            <label className="block mb-2 text-sm font-medium">Add Gallery Image</label>
            <input className="w-full p-3 border rounded mb-2" placeholder="Caption (optional)" value={newGallery.caption} onChange={(e) => setNewGallery(g => ({ ...g, caption: e.target.value }))} />
            <input type="file" accept="image/*" onChange={handleGalleryImageUpload} />
            {newGallery.img && <img src={newGallery.img} className="w-32 h-32 object-cover rounded mt-2" />}
            <button className="bg-purple-600 text-white px-4 py-2 rounded mt-2" onClick={addGallery}>Add to Gallery</button>
          </div>

          <div>
            <h3 className="font-semibold">Existing Gallery</h3>
            {(form.sections.gallery || []).length === 0 ? <div className="text-gray-500 p-4 border rounded">No gallery images</div> : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {(form.sections.gallery || []).map((g:any, idx:number) => (
                  <div key={idx} className="relative rounded border overflow-hidden group">
                    <img src={resolveImageUrl(g.img)} className="w-full h-32 object-cover" />
                    <div className="p-2 text-sm">{g.caption}</div>
                    <div className="p-2 text-right">
                      <button className="text-red-600 text-sm underline" onClick={() => deleteGallery(idx)}>Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONTACT */}
      {activeTab === "Contact" && (
        <div className="space-y-4">
          <input className="w-full p-3 border rounded" placeholder="Phone" value={form.sections.contact?.phone || ""} onChange={(e) => update("sections.contact.phone", e.target.value)} />
          <input className="w-full p-3 border rounded" placeholder="Email" value={form.sections.contact?.email || ""} onChange={(e) => update("sections.contact.email", e.target.value)} />
          <input className="w-full p-3 border rounded" placeholder="Address" value={form.sections.contact?.address || ""} onChange={(e) => update("sections.contact.address", e.target.value)} />
          <input className="w-full p-3 border rounded" placeholder="Opening hours" value={form.sections.contact?.hours || ""} onChange={(e) => update("sections.contact.hours", e.target.value)} />
        </div>
      )}

      {/* SOCIAL */}
      {activeTab === "Social" && (
        <div className="space-y-4">
          <input className="w-full p-3 border rounded" placeholder="Instagram URL" value={form.sections.social?.instagram || ""} onChange={(e) => update("sections.social.instagram", e.target.value)} />
          <input className="w-full p-3 border rounded" placeholder="Facebook URL" value={form.sections.social?.facebook || ""} onChange={(e) => update("sections.social.facebook", e.target.value)} />
          <input className="w-full p-3 border rounded" placeholder="TikTok URL" value={form.sections.social?.tiktok || ""} onChange={(e) => update("sections.social.tiktok", e.target.value)} />
          <input className="w-full p-3 border rounded" placeholder="WhatsApp Link" value={form.sections.social?.whatsapp || ""} onChange={(e) => update("sections.social.whatsapp", e.target.value)} />
        </div>
      )}

      {/* PUBLISH */}
      {activeTab === "Publish" && (
        <div className="space-y-6">
          <div>
            <label className="font-semibold">Store ID</label>
            <input className="w-full p-3 border rounded bg-gray-100 text-gray-600" value={form.id} readOnly />
          </div>

          <div>
            <label className="font-semibold">Public Slug</label>
            <input className="w-full p-3 border rounded" value={slug} onChange={(e) => setSlug(e.target.value)} />
            <p className="text-xs text-gray-500 mt-1">Public link: <b>/p/{slug || "your-store"}</b></p>
          </div>

          <button className="bg-purple-600 text-white px-4 py-2 rounded" onClick={handlePublish}>{publishing ? "Publishing..." : "Publish Store"}</button>

          {publicUrl && <div className="p-3 bg-green-50 text-green-700 rounded">Published: <a href={publicUrl} className="underline" target="_blank" rel="noreferrer">{publicUrl}</a></div>}
        </div>
      )}

      {/* SAVE BUTTON */}
      {activeTab !== "Publish" && (
        <div className="mt-8">
          <button onClick={validateBeforeSave} className="w-full py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}
    </div>
  );
}

// re-export PAGE_SECTIONS to keep single-source (optional)
const PAGE_SECTIONS = [
  { key: "brand", label: "Brand" },
  { key: "about", label: "About" },
  { key: "products", label: "Products" },
  { key: "services", label: "Services" },
  { key: "gallery", label: "Gallery" },
  { key: "contact", label: "Contact" },
];
