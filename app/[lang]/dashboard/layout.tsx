"use client";

import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { useRouter } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col">
        {/* Top Panel */}
        <div
          className="w-full bg-white border-b border-gray-200 px-6 py-3
                      flex items-center justify-between"
        >
          {/* Search */}
          <div className="flex-1 mx-6">{/* search box later */}</div>

          {/* Right Icons */}
          <div className="flex items-center gap-5 text-gray-600">
            {/* Notifications */}
            <button
              type="button"
              onClick={() => router.push("/en/dashboard/notifications")}
              className="hover:text-purple-600 transition"
              title="Notifications"
            >
              🔔
            </button>

            {/* Settings */}
            <button
              type="button"
              onClick={() => router.push("/en/dashboard/settings")}
              className="hover:text-purple-600 transition"
              title="Settings"
            >
              ⚙️
            </button>

            {/* Profile Avatar */}
            <button
              type="button"
              onClick={() => router.push("/en/dashboard/profile")}
              className="w-8 h-8 rounded-full bg-purple-100 
                         flex items-center justify-center 
                         font-bold text-purple-600 cursor-pointer
                         hover:bg-purple-200 transition"
              title="Profile"
              aria-label="Profile"
            >
              N
            </button>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
