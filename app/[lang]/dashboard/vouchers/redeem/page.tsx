// File: /app/promo/[promoId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { API_URL } from "../../../../api/config";
import { QRCodeCanvas } from "qrcode.react";
import toast from "react-hot-toast";

export default function PublicPromoPage() {
  const { promoId } = useParams();
  const [voucher, setVoucher] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/voucher/detail?promoId=${promoId}`);
      const data = await res.json();
      if (res.ok && data.voucher) setVoucher(data.voucher);
      else toast.error(data.error || "Failed to load");
    } catch (e) {
      console.error(e);
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!promoId) return;
    load();
  }, [promoId]);

  const claim = async () => {
    if (!promoId) return;
    try {
      const res = await fetch(`${API_URL}/voucher/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promoId }),
      });
      const data = await res.json();
      if (res.ok && data.claim) {
        toast.success(`Claimed: ${data.claim.id}`);
      } else {
        toast.error(data.error || "Claim failed");
      }
    } catch (e) {
      console.error(e);
      toast.error("Network error");
    }
  };

  if (!voucher) return <div className="p-8 text-gray-500">{loading ? "Loading..." : "Promo not found"}</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow p-6">
        <div className="w-full h-44 rounded overflow-hidden bg-gray-50 mb-4">
          {voucher.image ? <img src={voucher.image} alt={voucher.title} className="w-full h-full object-cover" /> : null}
        </div>

        <h1 className="text-2xl font-bold text-gray-800">{voucher.title}</h1>
        <p className="text-sm text-gray-500 mt-1">Discount: {voucher.discount}{voucher.type==="percent"?"%":""}</p>
        <p className="text-xs text-gray-400 mt-2">Quota: {voucher.quota || "unlimited"} • Claimed: {voucher.claimed || 0}</p>

        <div className="mt-4 flex items-center gap-3">
          <button onClick={claim} className="px-5 py-2 bg-purple-600 text-white rounded-md">Claim Voucher</button>
          <div className="ml-auto text-right">
            <QRCodeCanvas value={`${window.location.origin}/promo/${voucher.promoId}`} size={80} includeMargin />
            <p className="text-xs text-gray-400">Scan to open</p>
          </div>
        </div>
      </div>
    </div>
  );
}
