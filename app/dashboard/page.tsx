"use client";
import {
  Package,
  Zap,
  Users,
  BookOpen,
  BarChart3,
} from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Title */}
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
      <p className="text-gray-600">Welcome back! Here’s what’s happening today.</p>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Customers</p>
            <p className="text-xl font-bold">1,245</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Products</p>
            <p className="text-xl font-bold">38</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Promotions Sent</p>
            <p className="text-xl font-bold">112</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Engagement Rate</p>
            <p className="text-xl font-bold">23%</p>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Access</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm text-center hover:shadow-md transition cursor-pointer">
            <Zap className="w-8 h-8 text-purple-600 mx-auto mb-3" />
            <p className="font-bold text-gray-700">Quick Wins</p>
            <p className="text-sm text-gray-500">Generate a new promo</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm text-center hover:shadow-md transition cursor-pointer">
            <Package className="w-8 h-8 text-purple-600 mx-auto mb-3" />
            <p className="font-bold text-gray-700">My Products</p>
            <p className="text-sm text-gray-500">Manage your product list</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm text-center hover:shadow-md transition cursor-pointer">
            <Users className="w-8 h-8 text-purple-600 mx-auto mb-3" />
            <p className="font-bold text-gray-700">Customer Hub</p>
            <p className="text-sm text-gray-500">View customer insights</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm text-center hover:shadow-md transition cursor-pointer">
            <BookOpen className="w-8 h-8 text-purple-600 mx-auto mb-3" />
            <p className="font-bold text-gray-700">Blog</p>
            <p className="text-sm text-gray-500">Learn marketing tips</p>
          </div>
        </div>
      </div>
    </div>
  );
}
