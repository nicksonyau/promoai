"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { API_URL } from "@/app/api/config";
import toast from "react-hot-toast";
import VoucherForm from "../../components/VoucherForm";

export default function VoucherEditPage() {
  const { promoId } = useParams();
  const router = useRouter();

  const [token, setToken] = useState<string | null>(null);
  const [form, setForm] = useState<any>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // -----------------------------
  // LOAD TOKEN + COMPANY ID
  // -----------------------------
  useEffect(() => {
    try {
      const t = localStorage.getItem("sessionToken");
      const userStr = localStorage.getItem("user");

      if (!t) {
        toast.error("Not logged in");
        router.push("/en/login");
        return;
      }
      setToken(t);

      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.companyId) {
          setCompanyId(user.companyId);
        }
      }
    } catch (err) {
      console.error("[VoucherEdit] Failed to load token/companyId:", err);
    }
  }, []);

  // -----------------------------
  // LOAD VOUCHER DATA
  // -----------------------------
  useEffect(() => {
    if (!token || !promoId) return;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/voucher/detail?promoId=${promoId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          toast.error(data.error || "Failed to load voucher");
          return;
        }

        setForm(data.voucher);
      } catch (err) {
        console.error(err);
        toast.error("Network error");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [token, promoId]);

  // -----------------------------
  // UPDATE HANDLER
  // -----------------------------
  const submitUpdate = async (body: any) => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/voucher/update/${promoId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("Voucher updated");
        router.push("/en/dashboard/vouchers");
      } else {
        toast.error(data.error || "Update failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  // -----------------------------
  // DELETE HANDLER
  // -----------------------------
  const submitDelete = async () => {
    if (!confirm("Delete this voucher? This action cannot be undone.")) return;

    setDeleting(true);
    try {
      const res = await fetch(`${API_URL}/voucher/delete/${promoId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("Voucher deleted");
        router.push("/en/dashboard/vouchers");
      } else {
        toast.error(data.error || "Delete failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error");
    } finally {
      setDeleting(false);
    }
  };

  // -----------------------------
  // UI
  // -----------------------------
  if (loading || !form) {
    return (
      <div className="p-8 text-gray-500 max-w-xl mx-auto">
        Loading voucher...
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      {/* Header Panel */}
      <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
        <div className="flex justify-between items-start">
          <div>
            <div className="font-semibold text-indigo-700">
              Editing Voucher: {promoId}
            </div>
            <div className="text-sm text-indigo-500 mt-1">
              Company ID: {companyId || "Unknown"}
            </div>
          </div>

          <button
            onClick={() => navigator.clipboard.writeText(promoId as string)}
            className="text-indigo-600 underline text-sm"
          >
            Copy ID
          </button>
        </div>
      </div>

      {/* Delete Button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-purple-700">
          Edit Voucher
        </h1>

        <button
          onClick={submitDelete}
          disabled={deleting}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
        >
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>

      {/* Form */}
      <VoucherForm initial={form} saving={saving} onSubmit={submitUpdate} />
    </div>
  );
}
