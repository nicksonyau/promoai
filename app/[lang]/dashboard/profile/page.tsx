"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/config";
import toast from "react-hot-toast";

interface User {
  id?: string;
  companyId?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  countryCode?: string;
  mobile?: string;
  address?: string;
  createdAt?: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // ✅ Load user
  useEffect(() => {
    const localUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (!localUser?.email) {
      toast.error("Not logged in");
      window.location.href = "/login";
      return;
    }

    async function fetchUser() {
      setLoading(true);
      try {
        const res = await fetch(
          `${API_URL}/user/me?email=${encodeURIComponent(localUser.email)}`
        );
        const data = await res.json();

        if (res.ok && data.user) {
          setUser(data.user);
        } else {
          toast.error(data.error || "Failed to fetch profile");
        }
      } catch {
        toast.error("Network error");
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, []);

  // ✅ Save profile
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return toast.error("Missing email");

    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/user/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("Profile updated ✅");
        localStorage.setItem("user", JSON.stringify(user));
      } else toast.error(data.error || "Update failed");
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    try {
      const res = await fetch(`${API_URL}/user/send-reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });
      const data = await res.json();
      if (res.ok && data.success) toast.success("Password reset email sent 📩");
      else toast.error(data.error || "Failed to send reset email");
    } catch {
      toast.error("Network error");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading profile...</p>
      </div>
    );

  return (
    <div className="dashboard-content">
      <div className="dashboard-center">
        <div className="form-card w-full max-w-xl">
          <h2 className="form-title">My Profile</h2>

          {user && (
            <form onSubmit={handleSave} className="space-y-4">

              {/* NEW: User ID + Company ID */}
              <div className="p-4 bg-gray-100 border rounded-lg mb-4 text-sm text-gray-700">
                <p><strong>User ID:</strong> {user.id || "—"}</p>
                <p><strong>Company ID:</strong> {user.companyId || "—"}</p>
              </div>

              {/* Email */}
              <div>
                <label className="form-label">Email</label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="form-input bg-gray-100"
                />
              </div>

              {/* First + Last Name */}
              <div className="form-grid-2">
                <div>
                  <label className="form-label">First Name</label>
                  <input
                    type="text"
                    value={user.firstName || ""}
                    onChange={(e) =>
                      setUser({ ...user, firstName: e.target.value })
                    }
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Last Name</label>
                  <input
                    type="text"
                    value={user.lastName || ""}
                    onChange={(e) =>
                      setUser({ ...user, lastName: e.target.value })
                    }
                    className="form-input"
                  />
                </div>
              </div>

              {/* Country Code + Mobile */}
              <div className="form-grid-3">
                <div>
                  <label className="form-label">Country Code</label>
                  <select
                    value={user.countryCode || ""}
                    onChange={(e) =>
                      setUser({ ...user, countryCode: e.target.value })
                    }
                    className="form-select"
                  >
                    <option value="">Select</option>
                    <option value="+60">🇲🇾 Malaysia (+60)</option>
                    <option value="+65">🇸🇬 Singapore (+65)</option>
                    <option value="+62">🇮🇩 Indonesia (+62)</option>
                    <option value="+66">🇹🇭 Thailand (+66)</option>
                    <option value="+63">🇵🇭 Philippines (+63)</option>
                    <option value="+84">🇻🇳 Vietnam (+84)</option>
                    <option value="+1">🇺🇸 United States (+1)</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="form-label">Mobile No</label>
                  <input
                    type="text"
                    placeholder="e.g. 123456789"
                    value={user.mobile || ""}
                    onChange={(e) =>
                      setUser({ ...user, mobile: e.target.value })
                    }
                    className="form-input"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="form-label">Address</label>
                <textarea
                  rows={3}
                  value={user.address || ""}
                  onChange={(e) =>
                    setUser({ ...user, address: e.target.value })
                  }
                  className="form-textarea"
                />
              </div>

              {/* Created */}
              <p className="text-muted">
                Account Created:{" "}
                {user.createdAt
                  ? new Date(user.createdAt).toLocaleString()
                  : "Unknown"}
              </p>

              {/* Buttons */}
              <div className="flex flex-col gap-3 mt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className={`btn-primary ${
                    saving ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                >
                  {saving ? "Saving..." : "Save Profile"}
                </button>

                <button
                  type="button"
                  onClick={handlePasswordReset}
                  className="btn-secondary"
                >
                  Send Password Reset Email
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
