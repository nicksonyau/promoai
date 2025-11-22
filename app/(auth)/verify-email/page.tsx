"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { API_URL } from "../../api/config";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [status, setStatus] = useState<"checking" | "success" | "error">("checking");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    async function runVerify() {
      if (!token) {
        setStatus("error");
        setMessage("Invalid verification link (no token).");
        return;
      }

      try {
        const res = await fetch(`${API_URL}/verify?token=${encodeURIComponent(token)}`, {
          method: "GET",
          headers: { Accept: "application/json" },
        });

        const data = await res.json().catch(() => ({ success: false, error: "Invalid server response" }));

        if (res.ok && data.success) {
          setStatus("success");
          setMessage(data.message || "Email verified successfully.");

          // Auto-redirect to login
          setTimeout(() => (window.location.href = "/login?verified=1"), 2000);
        } else {
          setStatus("error");
          setMessage(data.error || "Verification failed.");
        }
      } catch (err) {
        console.error("[FRONT] verify error", err);
        setStatus("error");
        setMessage("Network error while verifying your email.");
      }
    }

    runVerify();
  }, [token]);

  const handleResend = async () => {
    if (!email) return alert("Missing email parameter to resend verification.");

    try {
      const res = await fetch(`${API_URL}/resend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok && data.success) alert("Verification email resent successfully ✅");
      else alert("Failed to resend: " + (data.error || "Unknown error"));
    } catch (err) {
      console.error(err);
      alert("Network error while resending.");
    }
  };

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
            <h2 className="text-2xl font-bold text-green-600 mb-2">Verification successful 🎉</h2>
            <p className="mb-4">{message}</p>
            <button
              onClick={() => (window.location.href = "/login?verified=1")}
              className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Go to Login
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <h2 className="text-2xl font-bold text-red-600 mb-2">Verification failed</h2>
            <p className="text-gray-600 mb-6">{message}</p>

            <div className="flex justify-center gap-3">
              <button
                onClick={handleResend}
                className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Resend email
              </button>
              <button
                onClick={() => (window.location.href = "/register")}
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
