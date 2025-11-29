"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  Package,
  Users,
  TicketPercent,
  BarChart3,
  Settings,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";

/* ------------------------------------------
   MENU DEFINITIONS
------------------------------------------*/

const merchantMenu = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "My Store", href: "/dashboard/store", icon: Store },
  { name: "My Campaign", href: "/dashboard/campaign", icon: Package },
  { name: "Voucher", href: "/dashboard/vouchers", icon: TicketPercent },
  { name: "My Chatbot", href: "/dashboard/chatbot", icon: Package },
  { name: "Customer Hub", href: "/dashboard/customers", icon: Users },
  { name: "Reports", href: "/dashboard/reports", icon: BarChart3 },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
  { name: "Profile", href: "/dashboard/profile", icon: Settings },
];

const adminMenu = [
  { name: "Admin Users", href: "/dashboard/admin/users", icon: Users },
  { name: "Admin Logs", href: "/dashboard/admin/logs", icon: Users },
  { name: "Templates", href: "/dashboard/admin/templates", icon: Users },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
  { name: "Profile", href: "/dashboard/profile", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  // Extract locale (/en/dashboard → en)
  const locale = pathname.split("/")[1] || "en";
  const prefix = (path: string) => `/${locale}${path}`;

  // DEFAULT = MERCHANT (correct)
  const [view, setView] = useState<"merchant" | "admin">("merchant");
  const [role, setRole] = useState<"merchant" | "admin">("merchant");

  /* LOAD ROLE + VIEW FROM LOCALSTORAGE */
  useEffect(() => {
    const savedRole = (localStorage.getItem("role") as "merchant" | "admin") || "merchant";
    const savedView = (localStorage.getItem("dashboardView") as "merchant" | "admin") || "merchant";

    setRole(savedRole);
    setView(savedView);
  }, []);

  /* SWITCH VIEW BUTTON */
  const switchView = () => {
    const next = view === "merchant" ? "admin" : "merchant";
    setView(next);
    localStorage.setItem("dashboardView", next);
  };

  const menuToShow = view === "admin" ? adminMenu : merchantMenu;

  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center justify-center border-b border-gray-200">
        <h1 className="text-xl font-bold text-purple-600">PromoHubAI</h1>
      </div>

      {/* Menu */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {menuToShow.map((item) => {
          const Icon = item.icon;

          const fullPath = prefix(item.href);
          const isActive = pathname === fullPath;

          return (
            <Link
              key={item.name}
              href={fullPath}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                isActive
                  ? "bg-purple-100 text-purple-600"
                  : "text-gray-600 hover:bg-gray-50 hover:text-purple-600"
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer buttons */}
      <div className="p-4 border-t border-gray-200 flex flex-col gap-2">

        <button
          onClick={switchView}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 transition"
        >
          <ShieldCheck className="w-5 h-5" />
          {view === "admin" ? "Switch to Merchant View" : "Switch to Admin View"}
        </button>

        <button
          onClick={() => {
            localStorage.clear();
            document.cookie = "role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
            window.location.href = `/${locale}/login`;
          }}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-purple-600"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
