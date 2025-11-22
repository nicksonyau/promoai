"use client";

import { useState } from "react";
import { API_URL } from "../../../../api/config";
import toast from "react-hot-toast";

export default function VoucherCreatePage() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    promoId: "",
    storeId: "",
    title: "",
    type: "percent",
    discount: "",
    expiry: "",
    quota: "",
    image: null as string | null,
  });

  const [preview, setPreview] = useState<string | null>(null);

  // ---------------------------
  // Upload Image to R2
  // ---------------------------
  const uploadImage = async (file: File) => {
    const fd = new FormData();
    const promoId =
      form.promoId || `voucher_${Math.random().toString(36).substring(2, 10)}`;

    fd.append("file", file);
    fd.append("promoId", promoId);

    const res = await fetch(`${API_URL}/voucher/upload`, {
      method: "POST",
      body: fd,
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      toast.error("Upload failed");
      return null;
    }

    // Set promoId (useful for final creation)
    setForm((f) => ({ ...f, promoId }));

    return data;
  };

  // ---------------------------
  // On File Select
  // ---------------------------
  const onFileChange = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));

    const uploaded = await uploadImage(file);
    if (uploaded) {
      setForm((f) => ({ ...f, image: uploaded.key }));
      toast.success("Image uploaded");
    }
  };

  // ---------------------------
  // CREATE VOUCHER
  // ---------------------------
  const createVoucher = async () => {
    if (!form.title) return toast.error("Title required");

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/voucher/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("Voucher created");
        window.location.href = "/dashboard/vouchers";
      } else {
        toast.error(data.error || "Failed to create");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------
  // RENDER
  // ---------------------------
  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-purple-700 mb-6">
        Create Voucher
      </h1>

      <div className="space-y-5">

        <input
          className="form-input w-full"
          placeholder="Voucher Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />

        <input
          className="form-input w-full"
          placeholder="Store ID"
          value={form.storeId}
          onChange={(e) => setForm({ ...form, storeId: e.target.value })}
        />

        <input
          className="form-input w-full"
          placeholder="Discount %"
          value={form.discount}
          onChange={(e) => setForm({ ...form, discount: e.target.value })}
        />

        <input
          type="date"
          className="form-input w-full"
          value={form.expiry || ""}
          onChange={(e) => setForm({ ...form, expiry: e.target.value })}
        />

        <input
          className="form-input w-full"
          placeholder="Quota"
          value={form.quota}
          onChange={(e) => setForm({ ...form, quota: e.target.value })}
        />

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-semibold mb-2">Voucher Image</label>
          <input type="file" onChange={onFileChange} />

          {preview && (
            <img
              src={preview}
              className="w-40 mt-3 rounded shadow"
              alt="preview"
            />
          )}
        </div>

        <button
          onClick={createVoucher}
          disabled={loading}
          className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          {loading ? "Creating..." : "Create Voucher"}
        </button>
      </div>
    </div>
  );
}
