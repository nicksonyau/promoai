"use client";

import { useState } from "react";

export default function VoucherForm({
  initial,
  saving,
  onSubmit,
}: {
  initial?: any;
  saving: boolean;
  onSubmit: (body: any) => void;
}) {
  const [form, setForm] = useState(
    initial || {
      title: "",
      description: "",
      discountType: "percentage",
      discountValue: 10,
      minSpend: 0,
      maxDiscount: 0,
      totalQuantity: 100,
      perUserLimit: 1,
      validFrom: "",
      validUntil: "",
    }
  );

  const set = (field: string, value: any) =>
    setForm((prev: any) => ({ ...prev, [field]: value }));

  const inputBase =
    "w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm " +
    "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition";

  const labelBase = "block text-sm font-medium text-gray-800";
  const hintBase = "mt-1 text-xs text-gray-500";

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-gray-900">Voucher details</h2>
        <p className="text-sm text-gray-500">
          Set the basic information and discount rules for this voucher.
        </p>
      </div>

      {/* Basic info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2 space-y-1">
          <label className={labelBase}>Voucher title</label>
          <input
            className={inputBase}
            placeholder="e.g. RM10 off weekday lunch"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
          />
          <p className={hintBase}>
            Customers will see this title on the voucher and landing page.
          </p>
        </div>

        <div className="md:col-span-2 space-y-1">
          <label className={labelBase}>Description</label>
          <textarea
            className={inputBase + " min-h-[90px] resize-y"}
            placeholder="Briefly describe when and how this voucher can be used."
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
          <p className={hintBase}>
            Optional, but helps customers understand the promotion clearly.
          </p>
        </div>
      </div>

      {/* Discount settings */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-800">
          Discount settings
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1">
            <label className={labelBase}>Discount type</label>
            <select
              className={inputBase}
              value={form.discountType}
              onChange={(e) => set("discountType", e.target.value)}
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed amount (RM)</option>
              <option value="free-item">Free item</option>
            </select>
            <p className={hintBase}>Choose how this voucher gives value.</p>
          </div>

          <div className="space-y-1">
            <label className={labelBase}>Discount value</label>
            <input
              type="number"
              className={inputBase}
              value={form.discountValue}
              onChange={(e) => set("discountValue", Number(e.target.value))}
              min={0}
            />
            <p className={hintBase}>
              For percentage, enter 10 for 10%. For fixed, enter RM amount.
            </p>
          </div>

          <div className="space-y-1">
            <label className={labelBase}>Minimum spend (RM)</label>
            <input
              type="number"
              className={inputBase}
              value={form.minSpend}
              onChange={(e) => set("minSpend", Number(e.target.value))}
              min={0}
            />
            <p className={hintBase}>Leave as 0 if there is no minimum spend.</p>
          </div>
        </div>

        {form.discountType === "percentage" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <label className={labelBase}>Max discount (RM)</label>
              <input
                type="number"
                className={inputBase}
                value={form.maxDiscount}
                onChange={(e) => set("maxDiscount", Number(e.target.value))}
                min={0}
              />
              <p className={hintBase}>
                Optional cap for percentage discounts. Leave 0 for no cap.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Limits */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-800">Usage limits</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className={labelBase}>Total quantity</label>
            <input
              type="number"
              className={inputBase}
              value={form.totalQuantity}
              onChange={(e) => set("totalQuantity", Number(e.target.value))}
              min={1}
            />
            <p className={hintBase}>
              Maximum number of vouchers that can be claimed in total.
            </p>
          </div>

          <div className="space-y-1">
            <label className={labelBase}>Per user limit</label>
            <input
              type="number"
              className={inputBase}
              value={form.perUserLimit}
              onChange={(e) => set("perUserLimit", Number(e.target.value))}
              min={1}
            />
            <p className={hintBase}>
              How many times each customer can claim or use this voucher.
            </p>
          </div>
        </div>
      </div>

      {/* Validity */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-800">Validity period</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className={labelBase}>Valid from</label>
            <input
              type="datetime-local"
              className={inputBase}
              value={form.validFrom}
              onChange={(e) => set("validFrom", e.target.value)}
            />
            <p className={hintBase}>
              Customers can start claiming / using from this date and time.
            </p>
          </div>

          <div className="space-y-1">
            <label className={labelBase}>Valid until</label>
            <input
              type="datetime-local"
              className={inputBase}
              value={form.validUntil}
              onChange={(e) => set("validUntil", e.target.value)}
            />
            <p className={hintBase}>
              Voucher will automatically expire after this time.
            </p>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="pt-2">
        <button
          disabled={saving}
          onClick={() => onSubmit(form)}
          className="w-full md:w-auto px-6 py-2.5 rounded-xl bg-purple-600 text-white font-medium
                     hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed
                     transition shadow-sm"
        >
          {saving ? "Saving..." : "Save Voucher"}
        </button>
      </div>
    </div>
  );
}
