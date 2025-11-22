"use client";

import { useState, useEffect } from "react";
import { API_URL } from "../../../api/config";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("Profile");
  const [userId, setUserId] = useState<string>("");

  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });

  const [business, setBusiness] = useState({
    businessName: "",
    businessDescription: "",
    businessEmail: "",
    businessPhone: "",
  });

  const [loading, setLoading] = useState(true);

  /** ✅ Load data with dev fallback userId */
  useEffect(() => {
    // ✅ Try localStorage first → if not found, assign dev id
    const stored = typeof window !== "undefined"
      ? localStorage.getItem("user_id") || "dev-user-1"
      : "dev-user-1";

    setUserId(stored);

    async function load() {
      try {
        const res = await fetch(`${API_URL}/user/me?userId=${encodeURIComponent(stored)}`);
        const data = await res.json();

        if (data.user) {
          setProfile({
            firstName: data.user.firstName || "",
            lastName: data.user.lastName || "",
            email: data.user.email || "",
          });
        }

        if (data.business) {
          setBusiness({
            businessName: data.business.businessName || "",
            businessDescription: data.business.businessDescription || "",
            businessEmail: data.business.businessEmail || "",
            businessPhone: data.business.businessPhone || "",
          });
        }
      } catch (err) {
        console.error("❌ Failed to load settings:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  /** ✅ Save profile */
  const saveProfile = async () => {
    const res = await fetch(`${API_URL}/user/update?userId=${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });

    if (res.ok) alert("✅ Profile updated");
  };

  /** ✅ Save business */
  const saveBusiness = async () => {
    const res = await fetch(`${API_URL}/business/update?userId=${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(business),
    });

    if (res.ok) alert("✅ Business updated");
  };

  if (loading) {
    return <div className="p-10 text-gray-400">Loading settings...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-semibold mb-8">Settings</h1>

      {/* ✅ Simple Tabs */}
      <div className="flex gap-8 border-b mb-8">
        {["Profile", "Business", "Subscription"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 text-lg ${
              activeTab === tab
                ? "text-indigo-600 font-bold border-b-2 border-indigo-600"
                : "text-gray-500"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ✅ TAB: PROFILE */}
      {activeTab === "Profile" && (
        <div className="bg-white p-8 rounded-xl shadow space-y-6">
          <h2 className="text-xl font-semibold">Profile</h2>

          <div className="grid grid-cols-2 gap-4">
            <input
              className="p-3 border rounded-lg"
              placeholder="First Name"
              value={profile.firstName}
              onChange={(e) =>
                setProfile({ ...profile, firstName: e.target.value })
              }
            />
            <input
              className="p-3 border rounded-lg"
              placeholder="Last Name"
              value={profile.lastName}
              onChange={(e) =>
                setProfile({ ...profile, lastName: e.target.value })
              }
            />
          </div>

          <input
            className="w-full p-3 border rounded-lg"
            placeholder="Email"
            value={profile.email}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
          />

          <button
            className="bg-indigo-600 w-full text-white p-3 rounded-lg"
            onClick={saveProfile}
          >
            Save Changes
          </button>
        </div>
      )}

      {/* ✅ TAB: BUSINESS */}
      {activeTab === "Business" && (
        <div className="bg-white p-8 rounded-xl shadow space-y-6">
          <h2 className="text-xl font-semibold">Business Details</h2>

          <input
            className="w-full p-3 border rounded-lg"
            placeholder="Business Name"
            value={business.businessName}
            onChange={(e) =>
              setBusiness({ ...business, businessName: e.target.value })
            }
          />

          <textarea
            className="w-full p-3 border rounded-lg"
            placeholder="Business Description"
            rows={3}
            value={business.businessDescription}
            onChange={(e) =>
              setBusiness({ ...business, businessDescription: e.target.value })
            }
          />

          <div className="grid grid-cols-2 gap-4">
            <input
              className="p-3 border rounded-lg"
              placeholder="Business Email"
              value={business.businessEmail}
              onChange={(e) =>
                setBusiness({ ...business, businessEmail: e.target.value })
              }
            />
            <input
              className="p-3 border rounded-lg"
              placeholder="Business Phone"
              value={business.businessPhone}
              onChange={(e) =>
                setBusiness({ ...business, businessPhone: e.target.value })
              }
            />
          </div>

          <button
            className="bg-indigo-600 w-full text-white p-3 rounded-lg"
            onClick={saveBusiness}
          >
            Save Changes
          </button>
        </div>
      )}

      {activeTab === "Subscription" && (
        <div className="bg-white p-8 rounded-xl shadow">
          <h2 className="text-xl font-semibold">Subscription</h2>
          <p className="mt-2 text-gray-500">Subscription module coming soon.</p>
        </div>
      )}
    </div>
  );
}
