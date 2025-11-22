// File: src/_lib/campaignTypes.ts
/**
 * Shared TypeScript types for Campaign system
 * Use across both backend (Cloudflare Workers) and frontend (Next.js)
 */

// ==============================
// Campaign Types
// ==============================

export type CampaignType = 
  | "flash-sale"
  | "seasonal"
  | "bundle"
  | "clearance"
  | "new-arrival"
  | "limited-edition"
  | "exclusive";

export type CampaignStatus = "active" | "expired" | "upcoming" | "draft";

// ==============================
// Product
// ==============================

export interface Product {
  name: string;
  orgPrice: string;
  promoPrice: string;
  img: string;
  description?: string;
  sku?: string;
  stock?: number;
}

// ==============================
// CTA (Call-to-Action)
// ==============================

export interface CTA {
  whatsapp?: string;
  orderUrl?: string;
  customText?: string;
}

// ==============================
// Campaign Analytics
// ==============================

export interface CampaignAnalytics {
  views: number;
  clicks: number;
  conversions: number;
  revenue?: number;
  lastViewedAt?: string;
}

// ==============================
// Image Metadata
// ==============================

export interface ImageMetadata {
  url: string;
  objectKey: string;
  size: number;
  mimeType: string;
  width?: number;
  height?: number;
  uploadedAt: string;
}

// ==============================
// Full Campaign
// ==============================

export interface Campaign {
  // Core fields
  id: string;
  storeId: string;
  type: CampaignType;
  title: string;
  description?: string;

  // Images
  bannerImage?: string;
  bannerImageUrl?: string;
  bannerMetadata?: ImageMetadata;

  // Products
  products: Product[];

  // CTA
  cta: CTA;

  // Dates
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt?: string;

  // R2 tracking
  r2Keys: string[];

  // Optional fields
  status?: CampaignStatus;
  analytics?: CampaignAnalytics;
  tags?: string[];
  isPublished?: boolean;
}

// ==============================
// API Request/Response Types
// ==============================

export interface CreateCampaignRequest {
  storeId: string;
  type: CampaignType;
  title: string;
  description?: string;
  bannerImage?: string;
  products?: Partial<Product>[];
  cta?: Partial<CTA>;
  startDate?: string;
  endDate?: string;
  tags?: string[];
}

export interface UpdateCampaignRequest extends Partial<CreateCampaignRequest> {
  id: string;
}

export interface CampaignListResponse {
  success: boolean;
  campaigns: Campaign[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  filters?: {
    storeId?: string | null;
    type?: string | null;
    status?: string | null;
  };
}

export interface CampaignResponse {
  success: boolean;
  campaign?: Campaign;
  id?: string;
  error?: string;
  message?: string;
}

export interface DeleteCampaignResponse {
  success: boolean;
  id?: string;
  deletedR2?: Array<{ key: string; ok: boolean }>;
  error?: string;
}

// ==============================
// Validation Schemas
// ==============================

export const CAMPAIGN_TYPES: CampaignType[] = [
  "flash-sale",
  "seasonal",
  "bundle",
  "clearance",
  "new-arrival",
  "limited-edition",
  "exclusive",
];

export const CAMPAIGN_STATUSES: CampaignStatus[] = [
  "active",
  "expired",
  "upcoming",
  "draft",
];

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_PRODUCTS = 50;
export const MAX_TITLE_LENGTH = 100;
export const MAX_DESCRIPTION_LENGTH = 500;

// ==============================
// Type Guards
// ==============================

export function isCampaignType(value: any): value is CampaignType {
  return CAMPAIGN_TYPES.includes(value);
}

export function isCampaignStatus(value: any): value is CampaignStatus {
  return CAMPAIGN_STATUSES.includes(value);
}

export function isValidImageType(mimeType: string): boolean {
  return ALLOWED_IMAGE_TYPES.includes(mimeType);
}

// ==============================
// Validators
// ==============================

export function validateCampaignInput(
  data: any
): { valid: boolean; error?: string } {
  // Check required fields
  if (!data.storeId || typeof data.storeId !== "string") {
    return { valid: false, error: "Missing or invalid storeId" };
  }

  if (!data.title || typeof data.title !== "string" || data.title.trim() === "") {
    return { valid: false, error: "Missing or invalid title" };
  }

  if (data.title.length > MAX_TITLE_LENGTH) {
    return { valid: false, error: `Title too long (max ${MAX_TITLE_LENGTH} chars)` };
  }

  if (!data.type || !isCampaignType(data.type)) {
    return {
      valid: false,
      error: `Invalid type. Must be one of: ${CAMPAIGN_TYPES.join(", ")}`,
    };
  }

  // Validate description length
  if (data.description && data.description.length > MAX_DESCRIPTION_LENGTH) {
    return {
      valid: false,
      error: `Description too long (max ${MAX_DESCRIPTION_LENGTH} chars)`,
    };
  }

  // Validate dates
  if (data.startDate && isNaN(Date.parse(data.startDate))) {
    return { valid: false, error: "Invalid startDate format (use ISO 8601)" };
  }

  if (data.endDate && isNaN(Date.parse(data.endDate))) {
    return { valid: false, error: "Invalid endDate format (use ISO 8601)" };
  }

  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    if (end <= start) {
      return { valid: false, error: "endDate must be after startDate" };
    }
  }

  // Validate products
  if (data.products && Array.isArray(data.products)) {
    if (data.products.length > MAX_PRODUCTS) {
      return { valid: false, error: `Too many products (max ${MAX_PRODUCTS})` };
    }

    for (let i = 0; i < data.products.length; i++) {
      const p = data.products[i];
      if (!p.name || typeof p.name !== "string") {
        return { valid: false, error: `Product ${i + 1}: Missing or invalid name` };
      }
    }
  }

  return { valid: true };
}

// ==============================
// Helpers
// ==============================

export function getCampaignStatus(
  startDate?: string,
  endDate?: string
): CampaignStatus {
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

export function formatCampaignType(type: CampaignType): string {
  return type
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function isExpired(endDate?: string): boolean {
  if (!endDate) return false;
  return new Date(endDate) < new Date();
}

export function isUpcoming(startDate?: string): boolean {
  if (!startDate) return false;
  return new Date(startDate) > new Date();
}

export function calculateDaysRemaining(endDate?: string): number | null {
  if (!endDate) return null;
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}