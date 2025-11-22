"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { Eye, Pencil, Trash2, Filter, RefreshCw } from "lucide-react";
import { API_URL } from "../../../api/config";

// ==============================
// Types
// ==============================
interface Campaign {
  id: string;
  storeId: string;
  title: string;
  type: string;
  description?: string;
  bannerImage?: string | null;
  bannerImageUrl?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  productCount?: number;
  status?: "active" | "expired" | "upcoming";
}

// ==============================
// Helper: Resolve Image URL
// ==============================
const resolveImageUrl = (url?: string | null): string => {
  if (!url) return "/images/promo-default.jpg";
  
  // Already full URL
  if (url.startsWith("http")) return url;
  
  // Base64 image
  if (url.startsWith("data:image")) return url;

  // Relative path - construct full URL
  const cleanPath = url.replace(/^\/+/, "");
  return `${API_URL}/${cleanPath}`;
};

// ==============================
// Helper: Format Date
// ==============================
const formatDate = (dateStr?: string | null): string => {
  if (!dateStr) return "-";
  
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "-";
  }
};

// ==============================
// Main Component
// ==============================
export default function CampaignDashboardPage() {
  const { lang } = useParams();
  
  // State
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [deleting, setDeleting] = useState<string | null>(null);

  // ==============================
  // Load Campaigns
  // ==============================
  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/campaigns`, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      
      if (data.success && Array.isArray(data.campaigns)) {
        setCampaigns(data.campaigns);
        setFilteredCampaigns(data.campaigns);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err: any) {
      console.error("Failed to load campaigns:", err);
      toast.error(err?.message || "Failed to load campaigns");
      setCampaigns([]);
      setFilteredCampaigns([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on mount
  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  // ==============================
  // Apply Filters
  // ==============================
  useEffect(() => {
    let filtered = [...campaigns];

    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter((c) => c.type === filterType);
    }

    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter((c) => c.status === filterStatus);
    }

    setFilteredCampaigns(filtered);
  }, [campaigns, filterType, filterStatus]);

  // ==============================
  // Delete Campaign
  // ==============================
  const handleDelete = async (campaign: Campaign) => {
    const confirmed = window.confirm(
      `Delete campaign "${campaign.title}"?\n\nThis action cannot be undone and will remove all associated images.`
    );

    if (!confirmed) return;

    setDeleting(campaign.id);
    try {
      const res = await fetch(`${API_URL}/campaign/delete/${campaign.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();

      if (data.success) {
        toast.success("Campaign deleted successfully");
        // Remove from local state
        setCampaigns((prev) => prev.filter((c) => c.id !== campaign.id));
      } else {
        throw new Error(data.error || "Failed to delete campaign");
      }
    } catch (err: any) {
      console.error("Delete error:", err);
      toast.error(err?.message || "Failed to delete campaign");
    } finally {
      setDeleting(null);
    }
  };

  // ==============================
  // Get unique types for filter
  // ==============================
  const campaignTypes = Array.from(new Set(campaigns.map((c) => c.type))).filter(Boolean);

  // ==============================
  // Loading State
  // ==============================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  // ==============================
  // Render
  // ==============================
  return (
    <div className="max-w-7xl mx-auto p-6 lg:p-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-gray-600 mt-1">
            {filteredCampaigns.length} of {campaigns.length} campaigns
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={loadCampaigns}
            disabled={loading}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>

          <Link
            href={`/${lang}/dashboard/campaign/create`}
            className="px-5 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition shadow-sm hover:shadow-md"
          >
            + Create Campaign
          </Link>
        </div>
      </div>

      {/* Filters */}
      {campaigns.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter size={18} className="text-gray-500" />
            <span className="font-medium text-gray-700">Filters</span>
          </div>

          <div className="flex flex-wrap gap-4">
            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Types</option>
                {campaignTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1).replace(/-/g, " ")}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="upcoming">Upcoming</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            {/* Clear Filters */}
            {(filterType !== "all" || filterStatus !== "all") && (
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setFilterType("all");
                    setFilterStatus("all");
                  }}
                  className="px-4 py-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {campaigns.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No campaigns yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first campaign to start promoting your products.
            </p>
            <Link
              href={`/${lang}/dashboard/campaign/create`}
              className="inline-block px-6 py-3 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition"
            >
              Create Your First Campaign
            </Link>
          </div>
        </div>
      )}

      {/* Filtered Empty State */}
      {campaigns.length > 0 && filteredCampaigns.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
          <p className="text-gray-600">No campaigns match your filters.</p>
          <button
            onClick={() => {
              setFilterType("all");
              setFilterStatus("all");
            }}
            className="mt-4 px-4 py-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Campaign Grid */}
      {filteredCampaigns.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              lang={lang as string}
              onDelete={handleDelete}
              isDeleting={deleting === campaign.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ==============================
// Campaign Card Component
// ==============================
interface CampaignCardProps {
  campaign: Campaign;
  lang: string;
  onDelete: (campaign: Campaign) => void;
  isDeleting: boolean;
}

function CampaignCard({ campaign, lang, onDelete, isDeleting }: CampaignCardProps) {
  const [imageError, setImageError] = useState(false);

  const bannerUrl = campaign.bannerImage || campaign.bannerImageUrl || "";
  const displayUrl = imageError ? "/images/promo-default.jpg" : resolveImageUrl(bannerUrl);

  // Determine status badge
  const getStatusBadge = () => {
    const status = campaign.status || "active";
    
    const badges = {
      active: "bg-green-100 text-green-700",
      expired: "bg-red-100 text-red-700",
      upcoming: "bg-blue-100 text-blue-700",
    };

    return (
      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${badges[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200">
      {/* Image */}
      <div className="relative h-48 bg-gray-100 overflow-hidden">
        <img
          src={displayUrl}
          alt={campaign.title}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
        <div className="absolute top-3 right-3">
          {getStatusBadge()}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-3">
        <div>
          <h2 className="font-semibold text-lg text-gray-900 line-clamp-1">
            {campaign.title}
          </h2>
          <p className="text-sm text-gray-600 capitalize mt-1">
            {campaign.type?.replace(/-/g, " ") || "Campaign"}
          </p>
        </div>

        {campaign.description && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {campaign.description}
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
          <span>{formatDate(campaign.startDate)}</span>
          <span>→</span>
          <span>{formatDate(campaign.endDate)}</span>
        </div>

        {campaign.productCount !== undefined && (
          <div className="text-sm text-gray-600">
            {campaign.productCount} {campaign.productCount === 1 ? "product" : "products"}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 px-5 pb-5">
        <Link
          href={`/${lang}/promo/${campaign.id}`}
          className="flex items-center justify-center gap-1.5 flex-1 px-3 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition"
        >
          <Eye size={16} />
          Preview
        </Link>

        <Link
          href={`/${lang}/dashboard/campaign/${campaign.id}`}
          className="flex items-center justify-center gap-1.5 flex-1 px-3 py-2.5 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition"
        >
          <Pencil size={16} />
          Edit
        </Link>

        <button
          onClick={() => onDelete(campaign)}
          disabled={isDeleting}
          className="p-2.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
          title="Delete campaign"
        >
          {isDeleting ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent" />
          ) : (
            <Trash2 size={16} />
          )}
        </button>
      </div>
    </div>
  );
}
