"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/app/api/config";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function VoucherViewPage() {
  const { promoId } = useParams();
  const [voucher, setVoucher] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch(`${API_URL}/voucher/detail?promoId=${promoId}`);
      const data = await res.json();
      setVoucher(data.voucher);
    }
    load();
  }, [promoId]);

  if (!voucher) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold">{voucher.title}</h1>

      <div className="text-gray-600">{voucher.description}</div>

      <div className="p-4 bg-gray-100 rounded-lg space-y-2">
        <div>Status: {voucher.status}</div>
        <div>Remaining: {voucher.remainingQuantity}</div>
        <div>Total: {voucher.totalQuantity}</div>
        <div>Per User: {voucher.perUserLimit}</div>
        <div>Valid: {voucher.validFrom} → {voucher.validUntil}</div>
      </div>

      <div className="flex gap-3 pt-6">
        <Link
          href={`/vouchers/edit/${voucher.promoId}`}
          className="btn-primary"
        >
          Edit
        </Link>

        <Link
          href="/vouchers"
          className="btn-secondary"
        >
          Back
        </Link>
      </div>
    </div>
  );
}
