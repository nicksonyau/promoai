// File: src/routes/campaignList.ts
import { Env } from "../index";
import { jsonResponse } from "../_lib/utils";

// ==============================
// TypeScript Types
// ==============================
interface Campaign {
  id: string;
  storeId: string;
  type: string;
  title: string;
  description?: string;
  bannerImage?: string;
  bannerImageUrl?: string;
  products?: any[];
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt?: string;
  r2Keys?: string[];
}

interface CampaignListItem {
  id: string;
  storeId: string;
  title: string;
  type: string;
  description?: string;
  bannerImage: string | null;
  bannerImageUrl: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  productCount: number;
  status: "active" | "expired" | "upcoming";
}

// ==============================
// CORS Headers
// ==============================
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// ==============================
// Helper: Fix Image URL
// ==============================
function fixImageUrl(env: Env, val: any): string | null {
  if (!val) return null;
  if (typeof val !== "string") return null;

  // Already a full URL
  if (val.startsWith("http://") || val.startsWith("https://")) {
    return val;
  }

  // Base worker URL (from env or default)
  const base = env.WORKER_URL || "http://localhost:8787";

  // Normalize path: remove "/r2/" or "r2/" prefix and leading slashes
  let cleaned = val
    .replace(/^\/r2\//, "")
    .replace(/^r2\//, "")
    .replace(/^\/+/, "");

  // Return full URL
  return `${base}/r2/${cleaned}`;
}

// ==============================
// Helper: Determine Campaign Status
// ==============================
function getCampaignStatus(
  startDate?: string,
  endDate?: string
): "active" | "expired" | "upcoming" {
  const now = new Date();

  if (endDate) {
    const end = new Date(endDate);
    if (end < now) {
      return "expired";
    }
  }

  if (startDate) {
    const start = new Date(startDate);
    if (start > now) {
      return "upcoming";
    }
  }

  return "active";
}

// ==============================
// GET CAMPAIGN LIST
// ==============================
export async function campaignListHandler(
  req: Request,
  env: Env
): Promise<Response> {
  try {
    // Handle OPTIONS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
      });
    }

    // Only accept GET
    if (req.method !== "GET") {
      return jsonResponse(
        { success: false, error: "Method not allowed" },
        405
      );
    }

    // Parse query parameters
    const url = new URL(req.url);
    const storeId = url.searchParams.get("storeId");
    const type = url.searchParams.get("type");
    const status = url.searchParams.get("status");
    const sortBy = url.searchParams.get("sortBy") || "createdAt";
    const sortOrder = url.searchParams.get("sortOrder") || "desc";
    const limit = parseInt(url.searchParams.get("limit") || "100");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    // ==============================
    // Load campaigns from KV
    // ==============================
    let campaigns: Campaign[];
    try {
      const raw = await env.KV.get("campaigns", { type: "json" });
      campaigns = (raw as Campaign[]) || [];
    } catch (error) {
      console.error("❌ Error loading campaigns from KV:", error);
      return jsonResponse(
        { success: false, error: "Failed to load campaigns from database" },
        500
      );
    }

    // ==============================
    // Filter campaigns
    // ==============================
    let filtered = campaigns;

    // Filter by storeId
    if (storeId) {
      filtered = filtered.filter((c) => c.storeId === storeId);
    }

    // Filter by type
    if (type) {
      filtered = filtered.filter((c) => c.type === type);
    }

    // Filter by status
    if (status) {
      filtered = filtered.filter((c) => {
        const campaignStatus = getCampaignStatus(c.startDate, c.endDate);
        return campaignStatus === status;
      });
    }

    // ==============================
    // Map to list items with fixed URLs
    // ==============================
    const list: CampaignListItem[] = filtered.map((c) => {
      // Fix banner image URLs
      const bannerImage = fixImageUrl(env, c.bannerImage || c.bannerImageUrl);
      const bannerImageUrl = fixImageUrl(env, c.bannerImageUrl || c.bannerImage);

      return {
        id: c.id,
        storeId: c.storeId,
        title: c.title || "",
        type: c.type || "",
        description: c.description || "",
        bannerImage,
        bannerImageUrl,
        startDate: c.startDate || null,
        endDate: c.endDate || null,
        createdAt: c.createdAt || null,
        updatedAt: c.updatedAt || null,
        productCount: Array.isArray(c.products) ? c.products.length : 0,
        status: getCampaignStatus(c.startDate, c.endDate),
      };
    });

    // ==============================
    // Sort campaigns
    // ==============================
    list.sort((a, b) => {
      let aVal: any = a[sortBy as keyof CampaignListItem];
      let bVal: any = b[sortBy as keyof CampaignListItem];

      // Handle null/undefined
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      // Sort dates
      if (sortBy === "createdAt" || sortBy === "updatedAt" || sortBy === "startDate" || sortBy === "endDate") {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      // Compare
      if (sortOrder === "desc") {
        return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
      } else {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      }
    });

    // ==============================
    // Pagination
    // ==============================
    const total = list.length;
    const paginated = list.slice(offset, offset + limit);

    // ==============================
    // Success response
    // ==============================
    return new Response(
      JSON.stringify({
        success: true,
        campaigns: paginated,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
        filters: {
          storeId: storeId || null,
          type: type || null,
          status: status || null,
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...CORS_HEADERS,
        },
      }
    );
  } catch (err: any) {
    console.error("❌ campaignListHandler error:", err);

    return jsonResponse(
      {
        success: false,
        error: "Internal server error",
        details: err?.message || "Unknown error",
      },
      500
    );
  }
}