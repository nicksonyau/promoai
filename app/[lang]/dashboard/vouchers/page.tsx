"use client";

import { useEffect, useState } from "react";
import { API_URL } from "../../../api/config";
import toast from "react-hot-toast";

type VoucherTemplate = {
  promoId: string;
  storeId: string;
  title: string;
  type?: string;
  discount?: number;
  expiry?: string | null;
  quota?: number;
  claimed?: number;
  redeemed?: number;
  image?: string | null;
  mode?: string;
};

export default function VouchersDashboard() {
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<VoucherTemplate[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/voucher/list`);
      const data = await res.json();
      if (res.ok && data?.vouchers) {
        setTemplates(data.vouchers);
      } else {
        toast.error(data?.error || "Failed to load vouchers");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const quickClaim = async (promoId: string) => {
    try {
      const res = await fetch(`${API_URL}/voucher/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promoId }),
      });
      const data = await res.json();
      if (res.ok && data.claim) {
        toast.success(`Voucher claimed`);
      } else {
        toast.error(data.error || "Claim failed");
      }
    } catch (e) {
      console.error(e);
      toast.error("Network error");
    }
  };

  const deleteVoucher = async (promoId: string) => {
    if (!confirm(`Delete voucher "${promoId}"? This cannot be undone.`)) return;

    try {
      const res = await fetch(`${API_URL}/voucher/delete/${promoId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("Deleted successfully");
        load();
      } else {
        toast.error(data.error || "Failed to delete");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error");
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-purple-700">Vouchers</h1>
        <a
          href="/dashboard/vouchers/new"
          className="px-4 py-2 bg-purple-600 text-white rounded-md shadow-sm hover:bg-purple-700"
        >
          + New Voucher
        </a>
      </div>

      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : templates.length === 0 ? (
        <div className="text-gray-500">No vouchers yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((t) => (
            <div key={t.promoId} className="bg-white rounded-xl p-4 shadow-sm border">
              <div className="flex gap-4">
                
                {/* IMAGE */}
                <div className="w-24 h-24 rounded overflow-hidden bg-gray-50">
                  {t.image ? (
                    <img
                      src={t.image}
                      alt={t.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                      No image
                    </div>
                  )}
                </div>

                {/* INFO */}
                <div className="flex-1">
                  <a
                    href={`/dashboard/vouchers/${t.promoId}`}
                    className="text-lg font-semibold text-gray-800 hover:text-purple-700"
                  >
                    {t.title || t.promoId}
                  </a>

                  {/* ADD PROMOID DISPLAY */}
                  <p className="text-xs text-gray-400">ID: {t.promoId}</p>

                  <p className="text-sm text-gray-500 mt-1">
                    {t.discount}
                    {t.type === "percent" ? "%" : ""} • {t.mode || "live"}
                  </p>

                  <p className="text-xs text-gray-400 mt-2">
                    Claimed: {t.claimed ?? 0} • Redeemed: {t.redeemed ?? 0}
                  </p>
                </div>

                <div className="flex flex-col gap-2">

                  <button
                    onClick={() => quickClaim(t.promoId)}
                    className="px-3 py-2 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700"
                  >
                    Quick Claim
                  </button>

                  <a
                    href={`/promo/${t.promoId}`}
                    className="px-3 py-2 border rounded-md text-sm text-purple-700 hover:bg-purple-50"
                  >
                    Public
                  </a>

                  <a
                    href={`/dashboard/vouchers/${t.promoId}/edit`}
                    className="px-3 py-2 border rounded-md text-sm text-blue-600 hover:bg-blue-50"
                  >
                    Edit
                  </a>

                  <button
                    onClick={() => deleteVoucher(t.promoId)}
                    className="px-3 py-2 bg-red-500 text-white rounded-md text-sm hover:bg-red-600"
                  >
                    Delete
                  </button>

                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
