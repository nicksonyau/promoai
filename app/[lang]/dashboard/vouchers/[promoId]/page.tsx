// File: /app/dashboard/vouchers/[promoId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { API_URL } from "../../../../api/config";
import { QRCodeCanvas } from "qrcode.react";
import toast from "react-hot-toast";

export default function VoucherDetailPage() {
  const { promoId } = useParams();
  const [loading, setLoading] = useState(false);
  const [voucher, setVoucher] = useState<any>(null);
  const [claims, setClaims] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/voucher/detail?promoId=${promoId}`);
      const data = await res.json();
      if (res.ok && data.voucher) {
        setVoucher(data.voucher);
        setClaims(data.redemptions || []);
      } else {
        toast.error(data.error || "Failed to load");
      }
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
    try {
      const res = await fetch(`${API_URL}/voucher/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promoId }),
      });
      const data = await res.json();
      if (res.ok && data.claim) {
        toast.success(`Claimed ${data.claim.id}`);
      } else {
        toast.error(data.error || "Claim failed");
      }
    } catch (e) {
      console.error(e);
      toast.error("Network error");
    }
  };

  if (!voucher)
    return (
      <div className="p-8 text-gray-500">
        {loading ? "Loading..." : "Voucher not found"}
      </div>
    );

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="bg-white rounded-xl p-6 shadow">
        <div className="flex gap-6">
          <div className="w-40 h-32 rounded overflow-hidden bg-gray-50">
            {voucher.image ? (
              <img src={voucher.image} alt={voucher.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No image</div>
            )}
          </div>

          <div className="flex-1">
            <h2 className="text-2xl font-semibold text-gray-800">{voucher.title}</h2>
            <p className="text-sm text-gray-500 mt-1">{voucher.discount}{voucher.type==="percent"?"%":""}</p>
            <p className="text-xs text-gray-400 mt-2">Quota: {voucher.quota || "unlimited"} • Claimed {voucher.claimed || 0}</p>

            <div className="mt-4 flex gap-3">
              <button onClick={claim} className="px-4 py-2 bg-purple-600 text-white rounded-md">
                Claim
              </button>
              <a href={`/promo/${voucher.promoId}`} className="px-4 py-2 border rounded-md text-purple-700">Public</a>
            </div>
          </div>

          <div className="w-40 text-center">
            <QRCodeCanvas value={`${window.location.origin}/promo/${voucher.promoId}`} size={120} includeMargin />
            <p className="text-xs text-gray-400 mt-2">Promo link</p>
          </div>
        </div>
      </div>

      {/* Redemption history (simple) */}
      <div className="mt-6 bg-white p-4 rounded-xl shadow">
        <h3 className="font-semibold mb-2">Recent redemptions</h3>
        {claims.length === 0 ? (
          <p className="text-sm text-gray-500">No redemptions yet.</p>
        ) : (
          <ul className="space-y-2">
            {claims.slice(-10).reverse().map((r: any, i: number) => (
              <li key={i} className="text-sm text-gray-600">
                {r.code || r.id} • {r.date || r.redeemedAt || r.createdAt}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
