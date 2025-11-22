"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { API_URL } from "@/config";
import toast from "react-hot-toast";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"checking" | "ready" | "invalid" | "success">("checking");

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }

    // Optional: verify token validity before showing the form
    async function checkToken() {
      try {
        const res = await fetch(`${API_URL}/user/check-reset-token?token=${token}`);
        const data = await res.json();
        if (res.ok && data.valid) setStatus("ready");
        else setStatus("invalid");
      } catch {
        setStatus("invalid");
      }
    }

    checkToken();
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) return toast.error("Passwords do not match");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/user/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("Password reset successfully ✅");
        setStatus("success");
        setTimeout(() => router.push("/login"), 1500);
      } else {
        toast.error(data.error || "Failed to reset password");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (status === "checking") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-600 text-lg">Checking reset link...</p>
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-lg w-[400px] text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Invalid or expired link</h2>
          <p className="text-gray-600 mb-4">Please request a new password reset.</p>
          <a href="/login" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            Back to Login
          </a>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-lg w-[400px] text-center">
          <h2 className="text-2xl font-bold text-green-600 mb-2">Password Reset Successful 🎉</h2>
          <p className="text-gray-600 mb-4">You can now log in with your new password.</p>
          <a href="/login" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-lg w-[400px]">
        <h2 className="text-2xl font-bold text-purple-600 mb-4 text-center">
          Reset your password
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1 text-gray-700">New Password</label>
            <input
              type="password"
              required
              minLength={8}
              className="w-full border rounded-lg px-4 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm mb-1 text-gray-700">Confirm Password</label>
            <input
              type="password"
              required
              minLength={8}
              className="w-full border rounded-lg px-4 py-2"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-purple-600 text-white px-5 py-3 rounded-lg font-semibold hover:bg-purple-700 transition ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
