"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { API_URL } from "../../../../../api/config";
import toast from "react-hot-toast";

export default function VoucherEditPage() {
  const { promoId } = useParams(); // ✅ FIX: Next.js App Router param access
  const [loading, setLoading] = useState(true);

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

  // --------------------------
  // LOAD EXISTING VOUCHER
  // --------------------------
  useEffect(() => {
    if (!promoId) return;

    (async () => {
      try {
        const res = await fetch(`${API_URL}/voucher/detail?promoId=${promoId}`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          toast.error("Failed to load voucher");
          return;
        }

        const v = data.voucher;

        setForm({
          promoId: v.promoId,
          storeId: v.storeId,
          title: v.title,
          type: v.type,
          discount: v.discount,
          expiry: v.expiry,
          quota: v.quota,
          image: v.image,
        });

        setPreview(v.image);

      } catch (err) {
        console.error(err);
        toast.error("Network error loading voucher");
      } finally {
        setLoading(false);
      }
    })();
  }, [promoId]);

  // --------------------------
  // UPLOAD NEW IMAGE
  // --------------------------
  const uploadImage = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("promoId", String(promoId));

    const res = await fetch(`${API_URL}/voucher/upload`, {
      method: "POST",
      body: fd,
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      toast.error("Upload failed");
      return null;
    }

    return data.key;
  };

  const onFileChange = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));

    const r2Key = await uploadImage(file);
    if (r2Key) {
      setForm((f) => ({ ...f, image: r2Key }));
      toast.success("Image uploaded");
    }
  };

  // --------------------------
  // SAVE
  // --------------------------
  const save = async () => {
    try {
      const res = await fetch(`${API_URL}/voucher/update/${promoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("Voucher updated");
        window.location.href = "/dashboard/vouchers";
      } else {
        toast.error(data.error || "Update failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error");
    }
  };

  if (loading) return <div className="p-8">Loading…</div>;

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-purple-700 mb-6">
        Edit Voucher: {promoId}
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

        <div>
          <label className="block text-sm font-semibold mb-2">
            Voucher Image
          </label>
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
          onClick={save}
          className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
