"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { API_URL } from "../../../api/config";

type StoreInfo = {
  id: string;
  name: string;
  template: string;
  tagline: string;
  updatedAt: string;
  logo?: string;
};

export default function StoreListPage() {
  const pathname = usePathname();

  // Locale detection: /en/dashboard/store → "en"
  const locale = pathname.split("/")[1] || "en";
  const to = (path: string) => `/${locale}${path}`;

  const [stores, setStores] = useState<StoreInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  // -----------------------------------------------------
  // 🔥 FIX: R2 IMAGE RESOLVER (critical for thumbnails)
  // -----------------------------------------------------
  const resolveImageUrl = (url?: string | null) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    if (url.startsWith("/r2/")) return `${API_URL}${url}`;
    return url;
  };

  // -----------------------------------------------------
  // Fetch all stores (multi-tenant + auth)
  // -----------------------------------------------------
  useEffect(() => {
    async function fetchStores() {
      try {
        const token = localStorage.getItem("sessionToken");

        if (!token) {
          console.error("❌ No session token found.");
          throw new Error("Unauthorized");
        }

        const res = await fetch(`${API_URL}/store/list`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          console.error("❌ Store list error:", await res.text());
          throw new Error("Failed to fetch store list");
        }

        const data = await res.json();
        console.log("🧠 [PromoHubAI] Raw Store List Data:", data);

        const mappedStores =
          data?.stores?.map((s: any) => ({
            id: s.id,
            name: s.brand,
            template: s.template || "restaurant",
            tagline: s.tagline || "",
            updatedAt: s.createdAt
              ? new Date(s.createdAt).toLocaleString()
              : "N/A",
            logo: resolveImageUrl(s.logoUrl),
          })) || [];

        setStores(mappedStores);
      } catch (err) {
        console.error("Error loading stores:", err);
      } finally {
        setLoading(false);
      }
    }

    // 🔥 Wait for token (fix for first-load blank)
    setTimeout(fetchStores, 150);
  }, []);

  // -----------------------------------------------------
  // Delete store
  // -----------------------------------------------------
  const handleDelete = async (id: string, name: string) => {
    const confirmed = confirm(`Are you sure you want to delete "${name}"?`);
    if (!confirmed) return;

    setDeleting(id);

    try {
      const token = localStorage.getItem("sessionToken");

      const res = await fetch(`${API_URL}/store/delete/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to delete store");

      setStores((prev) => prev.filter((s) => s.id !== id));
      alert(`✅ Store "${name}" deleted successfully.`);
    } catch (err) {
      console.error("Delete error:", err);
      alert("❌ Failed to delete store. Please try again.");
    } finally {
      setDeleting(null);
    }
  };

  // -----------------------------------------------------
  // Loading state
  // -----------------------------------------------------
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        Loading stores...
      </div>
    );
  }

  // -----------------------------------------------------
  // UI
  // -----------------------------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-extrabold text-gray-800">
            Manage Your Stores
          </h1>

          <Link
            href={to("/dashboard/store/create")}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-full font-semibold hover:opacity-90 transition shadow-md hover:shadow-lg"
          >
            + Add New Store
          </Link>
        </div>

        {/* Store Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {stores.map((store) => (
            <div
              key={store.id}
              className="bg-white shadow-lg rounded-2xl overflow-hidden hover:shadow-2xl transition transform hover:-translate-y-1"
            >
              {/* Thumbnail */}
              <div className="relative">
                <img
                  src={resolveImageUrl(store.logo)}
                  alt={store.name}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>

                <div className="absolute bottom-3 left-4 text-white">
                  <h2 className="text-xl font-bold">{store.name}</h2>
                  <p className="text-sm opacity-80">{store.tagline}</p>
                </div>
              </div>

              {/* Info */}
              <div className="p-6">
                <p className="text-gray-500 text-sm mb-4">
                  Template:{" "}
                  <span className="font-semibold text-gray-700 capitalize">
                    {store.template}
                  </span>
                  <br />
                  Updated: {store.updatedAt}
                </p>

                {/* Buttons */}
                <div className="flex gap-3">
                  <Link
                    href={to(`/preview/${store.id}`)}
                    className="flex-1 text-center bg-[#FFD700] text-[#2D1B0D] font-semibold py-2 rounded-full hover:brightness-110 transition"
                  >
                    Preview
                  </Link>

                  <Link
                    href={to(`/dashboard/store/${store.id}`)}
                    className="flex-1 text-center bg-gray-100 text-gray-700 font-semibold py-2 rounded-full hover:bg-gray-200 transition"
                  >
                    Edit
                  </Link>

                  <button
                    onClick={() => handleDelete(store.id, store.name)}
                    disabled={deleting === store.id}
                    className={`flex-1 text-center font-semibold py-2 rounded-full transition ${
                      deleting === store.id
                        ? "bg-gray-400 text-white cursor-not-allowed"
                        : "bg-red-100 text-red-600 hover:bg-red-200"
                    }`}
                  >
                    {deleting === store.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {stores.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            No stores found. Create your first store to get started.
          </div>
        )}
      </div>
    </div>
  );
}
