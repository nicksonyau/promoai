"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Subscription = {
  plan: string;
  status: string;
  interval: string;
  startDate?: string;
  endDate?: string;
  stripe?: {
    customerId?: string;
    subscriptionId?: string;
  };
};

type Invoice = {
  id: string;
  number?: string;
  status: string;
  amountPaid: number;
  currency: string;
  created: number;
  invoicePdf?: string;
  hostedInvoiceUrl?: string;
};

export default function BillingListPage() {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);

      const subRes = await apiFetch("/subscription/get");
      const subData = await subRes.json();
      if (subRes.ok && subData.success) {
        setSubscription(subData.subscription);
      }

      const invRes = await apiFetch("/subscription/invoices");
      const invData = await invRes.json();
      if (invRes.ok && invData.success) {
        setInvoices(invData.invoices || []);
      }
    } catch (e: any) {
      setError("Failed to load billing information");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-sm text-gray-500">Loading billing information…</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-8 p-8">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Billing & Subscription
        </h1>
        <p className="text-sm text-gray-600">
          Manage your plan, payments, and invoices.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* PLAN SUMMARY */}
      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">
          Current Plan
        </h2>

        {!subscription ? (
          <p className="text-sm text-gray-500">No active subscription.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Info label="Plan" value={subscription.plan?.toUpperCase()} />
            <Info label="Status" value={subscription.status?.toUpperCase()} />
            <Info
              label="Billing Interval"
              value={subscription.interval?.toUpperCase()}
            />

            <Info
              label="Start Date"
              value={formatDate(subscription.startDate)}
            />
            <Info
              label="Next Renewal"
              value={formatDate(subscription.endDate)}
            />
          </div>
        )}
      </section>

      {/* STRIPE METADATA */}
      {subscription?.stripe && (
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">
            Payment Provider
          </h2>

          <div className="space-y-2 text-sm text-gray-700">
            <p>
              <span className="font-medium">Provider:</span> Stripe
            </p>
            <p>
              <span className="font-medium">Customer ID:</span>{" "}
              {subscription.stripe.customerId}
            </p>
            <p>
              <span className="font-medium">Subscription ID:</span>{" "}
              {subscription.stripe.subscriptionId}
            </p>
          </div>
        </section>
      )}

      {/* INVOICES */}
      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">
          Invoices
        </h2>

        {invoices.length === 0 ? (
          <p className="text-sm text-gray-500">No invoices available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-2">Invoice</th>
                  <th className="py-2">Date</th>
                  <th className="py-2">Amount</th>
                  <th className="py-2">Status</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b last:border-0">
                    <td className="py-3 font-medium text-gray-900">
                      {inv.number || inv.id}
                    </td>
                    <td className="py-3">
                      {new Date(inv.created * 1000).toLocaleDateString()}
                    </td>
                    <td className="py-3">
                      {(inv.amountPaid / 100).toFixed(2)}{" "}
                      {inv.currency.toUpperCase()}
                    </td>
                    <td className="py-3 capitalize">
                      {inv.status}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-2">
                        {inv.hostedInvoiceUrl && (
                          <a
                            href={inv.hostedInvoiceUrl}
                            target="_blank"
                            className="rounded-md border px-3 py-1 text-xs font-semibold hover:bg-gray-100"
                          >
                            View
                          </a>
                        )}
                        {inv.invoicePdf && (
                          <a
                            href={inv.invoicePdf}
                            target="_blank"
                            className="rounded-md bg-purple-600 px-3 py-1 text-xs font-semibold text-white hover:bg-purple-700"
                          >
                            Download
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

/* ---------- helpers ---------- */

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-xl border p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-semibold text-gray-900">
        {value || "—"}
      </p>
    </div>
  );
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}
