"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  Package,
  Zap,
  Users,
  TicketPercent,
  Search,
  BookOpen,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";

const menuItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "My Store", href: "/dashboard/store", icon: Store },
  { name: "My Products", href: "/dashboard/products", icon: Package },
  { name: "Quick Wins", href: "/dashboard/quick-wins", icon: Zap },
  { name: "Customer Hub", href: "/dashboard/customers", icon: Users },
  { name: "Voucher", href: "/dashboard/vouchers", icon: TicketPercent },
  { name: "AI SEO", href: "/dashboard/seo", icon: Search },
  { name: "Blog / Resources", href: "/dashboard/blog", icon: BookOpen },
  { name: "Reports", href: "/dashboard/reports", icon: BarChart3 },
  { name: "Users", href: "/dashboard/admin/users", icon: Users },
  { name: "Logs", href: "/dashboard/admin/logs", icon: Users },
    { name: "Templates", href: "/dashboard/admin/templates", icon: Users },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center justify-center border-b border-gray-200">
        <h1 className="text-xl font-bold text-purple-600">PromoAI</h1>
      </div>

      {/* Menu */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
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

      {/* Logout */}
      <div className="p-4 border-t border-gray-200">
        <button className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-purple-600">
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
