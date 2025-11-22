"use client"
import { useState } from "react"
import { API_URL } from "@/config"

export default function Register() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || "Something went wrong")
      } else {
        setMessage(data.message || "Registration successful")
      }
    } catch (err) {
      setMessage("Error connecting to server")
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h2 className="text-3xl font-bold text-purple-600 mb-4">Create your account</h2>
        <p className="text-gray-600 mb-6">Start using PromoAI to generate promotional content.</p>

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Password (min 8 characters)</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
              minLength={8}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-purple-600 text-white px-5 py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
          >
            Sign Up
          </button>
        </form>

        <div className="mt-6 text-center text-gray-600">
          <span>Already have an account? </span>
          <a href="/login" className="text-purple-600 hover:underline">Login here</a>
        </div>

        {message && (
          <p className="mt-4 text-center text-gray-700">{message}</p>
        )}
      </div>
    </div>
  )
}