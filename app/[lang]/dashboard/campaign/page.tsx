"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { Eye, Pencil, Trash2, Filter, RefreshCw } from "lucide-react";
import { API_URL } from "../../../api/config";

interface Campaign {
  id: string;
  companyId: string;
  title: string;
  type: string;
  description?: string;
  bannerImage?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  productCount?: number;
  status?: "active" | "expired" | "upcoming";
}

const resolveImageUrl = (url?: string | null): string => {
  if (!url) return "/images/promo-default.jpg";
  if (url.startsWith("http")) return url;
  if (url.startsWith("data:image")) return url;
  const clean = url.replace(/^\/+/, "");
  return `${API_URL}/${clean}`;
};

const formatDate = (v?: string | null): string => {
  if (!v) return "-";
  try {
    return new Date(v).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
    });
  } catch {
    return "-";
  }
};

export default function CampaignDashboardPage() {
  const { lang } = useParams();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filtered, setFiltered] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [deleting, setDeleting] = useState<string | null>(null);

  // LOAD CAMPAIGNS
  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("sessionToken");

      const res = await fetch(`${API_URL}/campaigns`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Fail");

      setCampaigns(data.campaigns);
      setFiltered(data.campaigns);
    } catch (e: any) {
      toast.error(e.message || "Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  // APPLY FILTER
  useEffect(() => {
    let f = [...campaigns];
    if (filterType !== "all") f = f.filter((c) => c.type === filterType);
    if (filterStatus !== "all") f = f.filter((c) => c.status === filterStatus);
    setFiltered(f);
  }, [campaigns, filterType, filterStatus]);

  const handleDelete = async (c: Campaign) => {
    if (!confirm(`Delete "${c.title}"?`)) return;

    setDeleting(c.id);
    try {
      const token = localStorage.getItem("sessionToken");
      const res = await fetch(`${API_URL}/campaign/delete/${c.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Delete fail");

      toast.success("Deleted");
      setCampaigns((p) => p.filter((x) => x.id !== c.id));
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDeleting(null);
    }
  };

  const types = Array.from(new Set(campaigns.map((c) => c.type))).filter(Boolean);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-b-2 border-indigo-600 rounded-full" />
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto p-6 lg:p-10">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Campaigns</h1>
          <p className="text-gray-600">{filtered.length} results</p>
        </div>

        <Link
          href={`/${lang}/dashboard/campaign/create`}
          className="px-5 py-2 bg-indigo-600 text-white rounded-lg"
        >
          + Create Campaign
        </Link>
      </div>

      {/* Filters */}
      {campaigns.length > 0 && (
        <div className="bg-white p-4 rounded-xl shadow mb-6 border">
          <div className="flex gap-4 flex-wrap">
            <div>
              <label className="text-sm">Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="form-select"
              >
                <option value="all">All</option>
                {types.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="form-select"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="upcoming">Upcoming</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            {(filterType !== "all" || filterStatus !== "all") && (
              <button
                onClick={() => {
                  setFilterType("all");
                  setFilterStatus("all");
                }}
                className="text-indigo-600"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* No campaigns */}
      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No campaigns found.
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((c) => (
          <CampaignCard
            key={c.id}
            campaign={c}
            lang={lang as string}
            isDeleting={deleting === c.id}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}

function CampaignCard({
  campaign,
  lang,
  onDelete,
  isDeleting,
}: {
  campaign: Campaign;
  lang: string;
  onDelete: (c: Campaign) => void;
  isDeleting: boolean;
}) {
  const [err, setErr] = useState(false);

  const url = err ? "/images/promo-default.jpg" : resolveImageUrl(campaign.bannerImage);

  return (
    <div className="bg-white border rounded-xl shadow hover:shadow-lg">
      <div className="h-48 bg-gray-100 overflow-hidden">
        <img
          src={url}
          onError={() => setErr(true)}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="p-5 space-y-3">
        <h2 className="font-semibold text-lg">{campaign.title}</h2>
        <p className="text-sm text-gray-600">{campaign.type}</p>

        <div className="flex justify-between text-xs text-gray-500 pt-2 border-t">
          <span>{formatDate(campaign.startDate)}</span>
          <span>→</span>
          <span>{formatDate(campaign.endDate)}</span>
        </div>
      </div>

      <div className="flex gap-2 px-5 pb-5">
        <Link
          href={`/${lang}/promo/${campaign.id}`}
          className="flex-1 text-center bg-indigo-600 text-white py-2 rounded-lg"
        >
          <Eye size={16} />
        </Link>

        <Link
          href={`/${lang}/dashboard/campaign/${campaign.id}`}
          className="flex-1 text-center bg-gray-100 py-2 rounded-lg"
        >
          <Pencil size={16} />
        </Link>

        <button
          onClick={() => onDelete(campaign)}
          disabled={isDeleting}
          className="p-2 bg-red-50 text-red-600 rounded-lg"
        >
          {isDeleting ? (
            <div className="animate-spin h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full" />
          ) : (
            <Trash2 size={16} />
          )}
        </button>
      </div>
    </div>
  );
}
