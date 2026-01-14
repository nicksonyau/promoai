"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  Users,
  User,
  BarChart3,
  Settings,
  FileText,
  Send,
  Inbox,
  Plug,
  MessageSquare,
  Code,
  ChevronLeft,
  ChevronRight,
  Handshake,
} from "lucide-react";
import { useEffect, useState } from "react";

/* ------------------------------------------
   TYPES
------------------------------------------*/

type MenuItem = {
  name: string;
  href: string;
  icon: any;
  children?: MenuItem[];
};

/* ------------------------------------------
   MENU DEFINITIONS
------------------------------------------*/

const merchantMenu: MenuItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  //{ name: "My Channel", href: "/dashboard/channels", icon: Store },
  { name: "Inbox", href: "/dashboard/inbox", icon: Inbox },

  { name: "Contacts", href: "/dashboard/contacts", icon: Users },
 // { name: "Templates", href: "/dashboard/templates", icon: FileText },
  //{ name: "Broadcasts", href: "/dashboard/broadcasts", icon: Send },

  {
    name: "My Chatbot",
    href: "/dashboard/chatbot",
    icon: MessageSquare,
    children: [
      { name: "Chat Widget", href: "/dashboard/chat-widget", icon: Plug },
    ],
  },

    // { name: "Chat Page", href: "/dashboard/chat-page", icon: MessageSquare },
  { name: "API", href: "/dashboard/api", icon: Code },
  { name: "Leads", href: "/dashboard/leads", icon: Handshake },

  { name: "Reports", href: "/dashboard/reports", icon: BarChart3 },

  // ✅ keep Settings and Billing separate
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
  { name: "Billing", href: "/dashboard/settings/billing", icon: Settings },

  { name: "Profile", href: "/dashboard/profile", icon: User },
];

const adminMenu: MenuItem[] = [
  { name: "Admin Users", href: "/dashboard/admin/users", icon: Users },
  { name: "Admin Logs", href: "/dashboard/admin/logs", icon: FileText },
  { name: "Templates", href: "/dashboard/admin/templates", icon: FileText },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
  { name: "Profile", href: "/dashboard/profile", icon: User },
];

/* ------------------------------------------
   HELPERS
------------------------------------------*/

function isRouteActive(pathname: string, fullPath: string) {
  // active on exact or any sub-route
  return pathname === fullPath || pathname.startsWith(`${fullPath}/`);
}

/* ------------------------------------------
   COMPONENT
------------------------------------------*/

export default function Sidebar() {
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const prefix = (path: string) => `/${locale}${path}`;

  const [view, setView] = useState<"merchant" | "admin">("merchant");
  const [role, setRole] = useState<"merchant" | "admin">("merchant");
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setRole(
      (localStorage.getItem("role") as "merchant" | "admin") || "merchant"
    );
    setView(
      (localStorage.getItem("dashboardView") as "merchant" | "admin") ||
        "merchant"
    );
    setCollapsed(localStorage.getItem("sidebarCollapsed") === "true");
  }, []);

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("sidebarCollapsed", String(next));
  };

  // ✅ FIX: you were always returning merchantMenu
  const menuToShow =
    view === "admin" && role === "admin" ? adminMenu : merchantMenu;

  const billingPath = prefix("/dashboard/settings/billing");
  const settingsPath = prefix("/dashboard/settings");

  return (
    <aside
      className={`h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-200 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-3 border-b border-gray-200">
        {!collapsed && (
          <h1 className="text-xl font-bold text-purple-600">PromoHubAI</h1>
        )}
        <button
          onClick={toggleCollapse}
          className="p-1 rounded hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-300"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Menu */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {menuToShow.map((item) => {
          const Icon = item.icon;
          const fullPath = prefix(item.href);

          // ✅ Special-case to prevent Settings + Billing both active
          let isActive = false;

          if (item.href === "/dashboard") {
            // exact only
            isActive = pathname === fullPath;
          } else if (item.href === "/dashboard/settings") {
            // active for settings pages, but NOT billing
            isActive =
              isRouteActive(pathname, settingsPath) &&
              !isRouteActive(pathname, billingPath);
          } else if (item.href === "/dashboard/settings/billing") {
            // billing only
            isActive = isRouteActive(pathname, billingPath);
          } else {
            isActive = isRouteActive(pathname, fullPath);
          }

          const isChildActive =
            item.children?.some((c) => {
              const childFull = prefix(c.href);
              return isRouteActive(pathname, childFull);
            }) ?? false;

          const active = isActive || isChildActive;

          const focusRing = !active
            ? "focus-visible:ring-2 focus-visible:ring-purple-300"
            : "";

          return (
            <div key={item.name}>
              <Link
                href={fullPath}
                title={collapsed ? item.name : undefined}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition
                  focus:outline-none ${focusRing}
                  ${
                    active
                      ? "bg-purple-100 text-purple-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-purple-600 focus-visible:bg-purple-100 focus-visible:text-purple-600"
                  }
                  ${collapsed ? "justify-center" : ""}
                `}
              >
                <Icon className="w-5 h-5" />
                {!collapsed && item.name}
              </Link>

              {!collapsed && item.children && (
                <div className="ml-8 mt-1 space-y-1">
                  {item.children.map((child) => {
                    const ChildIcon = child.icon;
                    const childPath = prefix(child.href);

                    const childActive = isRouteActive(pathname, childPath);

                    const childFocusRing = !childActive
                      ? "focus-visible:ring-2 focus-visible:ring-purple-200"
                      : "";

                    return (
                      <Link
                        key={child.name}
                        href={childPath}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition
                          focus:outline-none ${childFocusRing}
                          ${
                            childActive
                              ? "bg-purple-50 text-purple-600"
                              : "text-gray-500 hover:bg-gray-50 hover:text-purple-600 focus-visible:bg-purple-50 focus-visible:text-purple-600"
                          }
                        `}
                      >
                        <ChildIcon className="w-4 h-4" />
                        {child.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
