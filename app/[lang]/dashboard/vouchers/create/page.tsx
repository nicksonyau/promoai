"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { apiFetch } from "@/lib/api";   // <-- REQUIRED
import VoucherForm from "../components/VoucherForm";

export default function VoucherCreatePage() {
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [initialised, setInitialised] = useState(false);

  // -----------------------------
  // Load user session
  // -----------------------------
  useEffect(() => {
    try {
      const userStr = localStorage.getItem("user");
      const token = localStorage.getItem("sessionToken");

      if (!token) {
        toast.error("Missing sessionToken. Please log in again.");
        setInitialised(true);
        return;
      }

      setSessionToken(token);

      if (!userStr) {
        toast.error("Not logged in");
        setInitialised(true);
        return;
      }

      const user = JSON.parse(userStr);

      if (!user.companyId) {
        toast.error("companyId missing in user session");
      } else {
        setCompanyId(user.companyId);
        console.log("[VoucherCreatePage] companyId =", user.companyId);
      }
    } catch (err) {
      console.error("[VoucherCreatePage] Failed to load session:", err);
    } finally {
      setInitialised(true);
    }
  }, []);

  // -----------------------------
  // Submit handler (uses apiFetch)
  // -----------------------------
  const submit = async (body: any) => {
    if (!companyId) return toast.error("companyId missing");
    if (!sessionToken) return toast.error("Missing session token");

    setSaving(true);

    try {
      const res = await apiFetch("/voucher/create", {
        method: "POST",
        body: JSON.stringify({
          ...body
          // companyId NO NEED here — backend pulls from session
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!data.success) {
        console.error("[VoucherCreatePage] Create error:", data);
        toast.error(data.error || "Failed to create voucher");
        return;
      }

      toast.success("Voucher created!");
      router.push("/en/dashboard/vouchers");
    } catch (err) {
      console.error("[VoucherCreatePage] Network error:", err);
      toast.error("Network error while creating voucher");
    }

    setSaving(false);
  };

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold mb-2">Create Voucher</h1>
      <p className="text-sm text-gray-500 mb-6">
        Set up a discount voucher for this company.
      </p>

      {!initialised && <div className="text-gray-500">Loading session...</div>}

      {initialised && (!companyId || !sessionToken) && (
        <div className="text-gray-500">Unable to load company session.</div>
      )}

      {initialised && companyId && sessionToken && (
        <VoucherForm onSubmit={submit} saving={saving} />
      )}
    </div>
  );
}
