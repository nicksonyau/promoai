// /app/dashboard/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  title: "PromoAI Dashboard",
  description: "AI-powered promotions and growth for F&B businesses",
};

// dynamic client components (client-only, no SSR)
const SidebarClient = dynamic(() => import("@/components/Sidebar"), {
  ssr: false,
});
const TopPanelClient = dynamic(() => import("./TopPanelClient"), {
  ssr: false,
  // you can add a small loading fallback if desired
});

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50">
        <div className="flex min-h-screen">
          {/* Sidebar (client-only) */}
          <SidebarClient />

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Top Panel (client-only) */}
            <TopPanelClient />

            {/* Page Content (server children) */}
            <main className="flex-1 p-8">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
