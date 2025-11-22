// src/app/_components/resolveImageUrl.ts

// Base URL for API/R2 image proxy
const API_IMAGE_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

/**
 * Resolve image URLs automatically.
 * Supports:
 *  - Base64 images
 *  - Full HTTP URLs
 *  - Cloudflare R2 objects (/r2/<key>)
 *  - Direct stored paths
 */
export function resolveImageUrl(src?: string | null): string {
  if (!src) return "";

  // Base64 image
  if (src.startsWith("data:")) return src;

  // Already an external link
  if (src.startsWith("http")) return src;

  // R2 route
  if (src.startsWith("/r2/")) return `${API_IMAGE_BASE}${src}`;

  // Otherwise return raw path (fallback)
  return src;
}
