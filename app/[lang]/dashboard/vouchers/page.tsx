"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/app/api/config";
import toast from "react-hot-toast";

export default function VouchersDashboard() {
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [token, setToken] = useState<string | null>(null);

  // -----------------------------
  // LOAD SESSION TOKEN
  // -----------------------------
  useEffect(() => {
    try {
      const t = localStorage.getItem("sessionToken");
      if (!t) {
        toast.error("Not logged in");
        return;
      }
      setToken(t);
    } catch (err) {
      console.error("[VoucherDashboard] Error loading token:", err);
    }
  }, []);

  // -----------------------------
  // LOAD VOUCHERS (AUTH REQUIRED)
  // -----------------------------
  const loadVouchers = async (sessionToken: string) => {
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/voucher/list`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.error || "Failed to load vouchers");
        return;
      }

      setTemplates(data.vouchers || []);
    } catch (err) {
      console.error(err);
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadVouchers(token);
  }, [token]);

  // -----------------------------
  // DELETE VOUCHER
  // -----------------------------
  const deleteVoucher = async (promoId: string) => {
    if (!token) return toast.error("Not logged in");

    const confirmDelete = confirm("Delete this voucher permanently?");
    if (!confirmDelete) return;

    try {
      const res = await fetch(`${API_URL}/voucher/delete/${promoId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.error || "Failed to delete");
        return;
      }

      toast.success("Voucher deleted");
      loadVouchers(token); // refresh list
    } catch (err) {
      console.error(err);
      toast.error("Network error");
    }
  };

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-purple-700">Vouchers</h1>

        <a
          href="/en/dashboard/vouchers/create"
          className="px-4 py-2 bg-purple-600 text-white rounded-lg shadow hover:bg-purple-700 transition"
        >
          + New Voucher
        </a>
      </div>

      {/* EMPTY / LOADING / LIST */}
      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : templates.length === 0 ? (
        <div className="text-gray-500">No vouchers yet.</div>
      ) : (
        <div className="space-y-4">
          {templates.map((v) => {
            const desc = v.description || "";
            const shortDesc =
              desc.length > 80 ? desc.slice(0, 80) + "..." : desc;

            return (
              <div
                key={v.promoId}
                className="bg-white rounded-2xl p-5 shadow-sm border hover:shadow-md transition"
              >
                {/* TOP */}
                <div className="flex justify-between items-start">
                  <div
                    className="cursor-pointer"
                    onClick={() =>
                      (window.location.href = `/en/dashboard/vouchers/${v.promoId}/edit`)
                    }
                  >
                    <div className="text-xl font-semibold text-gray-800">
                      {v.title}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {shortDesc}
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      v.status === "active"
                        ? "bg-green-100 text-green-700"
                        : v.status === "upcoming"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {v.status}
                  </span>
                </div>

                {/* BOTTOM */}
                <div className="flex justify-between items-center mt-4">
                  <p className="text-xs text-gray-400">ID: {v.promoId}</p>

                  <div className="flex gap-4 text-sm">
                    <a
                      href={`/en/dashboard/vouchers/${v.promoId}/edit`}
                      className="text-purple-600 hover:underline"
                    >
                      Edit →
                    </a>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteVoucher(v.promoId);
                      }}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
