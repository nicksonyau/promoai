"use client";

import { useState } from "react";

export default function VoucherForm({ initial, onSubmit, saving }: any) {
  const [form, setForm] = useState(
    initial ?? {
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

  const set = (k: string, v: any) => setForm({ ...form, [k]: v });

  return (
    <div className="space-y-5">
      <div>
        <label className="font-medium">Voucher Title</label>
        <input
          className="input"
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
        />
      </div>

      <div>
        <label className="font-medium">Description</label>
        <textarea
          className="input"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>

      <div>
        <label className="font-medium">Discount Type</label>
        <select
          className="input"
          value={form.discountType}
          onChange={(e) => set("discountType", e.target.value)}
        >
          <option value="percentage">Percentage (%)</option>
          <option value="fixed">Fixed Amount (RM)</option>
          <option value="free-item">Free Item</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="font-medium">Discount Value</label>
          <input
            className="input"
            type="number"
            value={form.discountValue}
            onChange={(e) => set("discountValue", e.target.value)}
          />
        </div>

        <div>
          <label className="font-medium">Min Spend (RM)</label>
          <input
            className="input"
            type="number"
            value={form.minSpend}
            onChange={(e) => set("minSpend", e.target.value)}
          />
        </div>
      </div>

      {form.discountType === "percentage" && (
        <div>
          <label className="font-medium">Max Discount (RM)</label>
          <input
            className="input"
            type="number"
            value={form.maxDiscount}
            onChange={(e) => set("maxDiscount", e.target.value)}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="font-medium">Total Quantity</label>
          <input
            className="input"
            type="number"
            value={form.totalQuantity}
            onChange={(e) => set("totalQuantity", e.target.value)}
          />
        </div>

        <div>
          <label className="font-medium">Per User Limit</label>
          <input
            className="input"
            type="number"
            value={form.perUserLimit}
            onChange={(e) => set("perUserLimit", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="font-medium">Valid From</label>
          <input
            className="input"
            type="datetime-local"
            value={form.validFrom}
            onChange={(e) => set("validFrom", e.target.value)}
          />
        </div>

        <div>
          <label className="font-medium">Valid Until</label>
          <input
            className="input"
            type="datetime-local"
            value={form.validUntil}
            onChange={(e) => set("validUntil", e.target.value)}
          />
        </div>
      </div>

      <button
        disabled={saving}
        onClick={() => onSubmit(form)}
        className="btn-primary w-full mt-5"
      >
        {saving ? "Saving..." : "Save Voucher"}
      </button>
    </div>
  );
}
