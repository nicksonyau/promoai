"use client";

import { useEffect, useState } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { API_URL } from "../../api/config";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  // ---------------------------------------
  // Locale auto-detect from current URL
  // /en/verify-email  → "en"
  // /my/verify-email  → "my"
  // /zh/verify-email  → "zh"
  // ---------------------------------------
  const locale = pathname.split("/")[1] || "en";
  const to = (path: string) => `/${locale}${path}`;

  const [status, setStatus] = useState<"checking" | "success" | "error">("checking");
  const [message, setMessage] = useState("Verifying your email...");
  const [extra, setExtra] = useState<string>("");

  // -----------------------------
  // VERIFY FUNCTION
  // -----------------------------
  async function runVerify(realToken: string) {
    try {
      console.log("[FRONT] Calling API:", `${API_URL}/verify?token=${realToken}`);

      const res = await fetch(`${API_URL}/verify?token=${encodeURIComponent(realToken)}`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      const data = await res.json().catch(() => ({
        success: false,
        error: "Invalid server response",
      }));

      console.log("[FRONT] Verify API Response:", data);

      if (res.ok && data.success) {
        setStatus("success");
        setMessage(data.message || "Email verified successfully.");

        setExtra(
          `Code: ${data.code || "N/A"}\n` +
            (typeof data.details === "string"
              ? data.details
              : JSON.stringify(data.details || {}, null, 2))
        );

        // Redirect → /en/login?verified=1
        setTimeout(() => {
          window.location.href = to(`/login?verified=1`);
        }, 10000);
      } else {
        setStatus("error");

        setMessage(
          data.error ||
            data.message ||
            "Verification failed."
        );

        setExtra(
          `Code: ${data.code || "UNKNOWN_ERROR"}\n` +
            (typeof data.details === "string"
              ? data.details
              : JSON.stringify(data.details || {}, null, 2))
        );
      }
    } catch (err) {
      console.error("[FRONT] verify error", err);
      setStatus("error");
      setMessage("Network error while verifying your email.");
      setExtra(String(err));
    }
  }

  // -----------------------------
  // useEffect hydration fix
  // -----------------------------
  useEffect(() => {
    if (token === null) {
      console.log("[FRONT] Token not ready yet.");
      return;
    }

    if (!token) {
      console.log("[FRONT] No token in URL");
      setStatus("error");
      setMessage("Invalid verification link (no token).");
      setExtra("Token missing from URL.");
      return;
    }

    runVerify(token);
  }, [token]);

  // -----------------------------
  // RESEND EMAIL
  // -----------------------------
  const handleResend = async () => {
    if (!email) return alert("Missing email parameter to resend verification.");

    try {
      console.log("[FRONT] Resend verify email:", email);

      const res = await fetch(`${API_URL}/resend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));
      console.log("[FRONT] Resend API Response:", data);

      if (res.ok && data.success) {
        alert("Verification email resent successfully ✅");
      } else {
        alert("Failed to resend: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error("[FRONT] resend error", err);
      alert("Network error while resending.");
    }
  };

  // ---------------------------------------
  // UI
  // ---------------------------------------
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-lg w-[480px] text-center">

        {status === "checking" && (
          <>
            <h2 className="text-2xl font-bold text-purple-600 mb-2">Verify your email</h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === "success" && (
          <>
            <h2 className="text-2xl font-bold text-green-600 mb-2">
              Verification successful 🎉
            </h2>
            <p className="mb-2">{message}</p>

            <div className="debug-panel">{extra}</div>

            <button
              onClick={() => (window.location.href = to(`/login?verified=1`))}
              className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 mt-4"
            >
              Go to Login Now
            </button>

            <p className="text-xs text-gray-500 mt-2">Auto-redirecting in 10 seconds…</p>
          </>
        )}

        {status === "error" && (
          <>
            <h2 className="text-2xl font-bold text-red-600 mb-2">
              Verification failed
            </h2>
            <p className="text-gray-600 mb-3">{message}</p>

            <div className="debug-panel">{extra}</div>

            <div className="flex justify-center gap-3 mt-4">
              <button
                onClick={handleResend}
                className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Resend email
              </button>

              <button
                onClick={() => (window.location.href = to(`/register`))}
                className="px-5 py-2 border rounded-lg hover:bg-gray-50"
              >
                Register again
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
