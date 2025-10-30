"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/config";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      // Backend returns { success: true, user } on success, 401 with { error } on fail
      if (res.ok && data?.success) {
        // temp session: store user; later replace with JWT/cookie
        if (data.user) localStorage.setItem("user", JSON.stringify(data.user));

        setMessage("Login successful ✅");
        // Use replace to avoid going back to login on back button
        router.replace("/dashboard");
        return;
      }

      // server gave an error (e.g., 401)
      setMessage(data?.error || "Invalid email or password");
    } catch (err) {
      setMessage("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h2 className="text-3xl font-bold text-purple-600 mb-4">Login</h2>
        <p className="text-gray-600 mb-6">
          Welcome back to PromoAI! Please login.
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

        {message && (
          <p className="mt-4 text-center text-gray-700">{message}</p>
        )}
      </div>
    </div>
  );
}
