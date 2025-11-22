"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { API_URL } from "@/config";
import toast from "react-hot-toast";

export default function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Show contextual toasts based on redirected query params
  useEffect(() => {
    const verifySent = searchParams.get("verify");
    const verified = searchParams.get("verified");

    if (verifySent === "sent") {
      toast.success("📩 Verification email sent! Please check your inbox.");
    }
    if (verified === "1") {
      toast.success("✅ Your email has been verified! You can now log in.");
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data?.success) {
        if (data.user) localStorage.setItem("user", JSON.stringify(data.user));

        toast.success("🎉 Login successful! Redirecting...");
        router.replace("/dashboard");
        return;
      }

      // ❌ Invalid login
      toast.error(data?.error || "Invalid email or password.");
    } catch (err) {
      console.error("[FRONT] Login error:", err);
      toast.error("⚠️ Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h2 className="text-3xl font-bold text-purple-600 mb-4">Login</h2>
        <p className="text-gray-600 mb-6">
          Welcome back to{" "}
          <span className="font-semibold text-purple-500">PromoHubAI</span>!
        </p>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full px-5 py-3 rounded-lg font-semibold text-white transition ${
              loading ? "bg-purple-400" : "bg-purple-600 hover:bg-purple-700"
            }`}
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        <div className="mt-6 text-center text-gray-600">
          <span>Don’t have an account? </span>
          <a href="/register" className="text-purple-600 hover:underline">
            Register here
          </a>
        </div>
      </div>
    </div>
  );
}
