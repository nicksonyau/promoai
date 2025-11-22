// File: src/routes/campaignCreate.ts
import { Env } from "../index";
import {
  base64ToArrayBuffer,
  uploadToR2,
  r2UrlForKey,
  jsonResponse,
} from "../_lib/utils";

// ==============================
// TypeScript Types
// ==============================
interface ProductInput {
  name: string;
  orgPrice: string;
  promoPrice: string;
  img?: string;
}

interface CampaignInput {
  storeId: string;
  type: string;
  title: string;
  description?: string;
  bannerImage?: string;
  products?: ProductInput[];
  cta?: {
    whatsapp?: string;
    orderUrl?: string;
  };
  startDate?: string;
  endDate?: string;
}

interface Campaign extends CampaignInput {
  id: string;
  r2Keys: string[];
  createdAt: string;
  updatedAt?: string;
}

// ==============================
// CORS: OPTIONS preflight
// ==============================
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

// ==============================
// Helper: Upload base64 → R2
// ==============================
async function uploadImage(
  env: Env,
  base64: string,
  key: string
): Promise<{ objectKey: string; url: string } | null> {
  // Skip if not base64
  if (!base64 || !base64.startsWith("data:")) return null;

  // Skip if R2 not configured
  if (!env.MY_R2_BUCKET) {
    console.warn("⚠️ R2 bucket not configured, skipping upload");
    return null;
  }

  try {
    // Extract image format
    const m = base64.match(/^data:image\/([a-zA-Z0-9+]+);base64,/);
    const ext = m ? m[1] : "png";

    // Generate unique object key
    const timestamp = Date.now();
    const objectKey = `campaigns/${key}_${timestamp}.${ext}`;

    // Convert and upload
    const { buffer, contentType } = base64ToArrayBuffer(base64);
    await uploadToR2(env, objectKey, buffer, contentType);

    console.log(`✅ Uploaded to R2: ${objectKey}`);

    return {
      objectKey,
      url: r2UrlForKey(objectKey),
    };
  } catch (error) {
    console.error("❌ Error uploading to R2:", error);
    return null;
  }
}

// ==============================
// Validation Helper
// ==============================
function validateCampaignInput(body: any): {
  valid: boolean;
  error?: string;
} {
  if (!body.storeId || typeof body.storeId !== "string") {
    return { valid: false, error: "Missing or invalid storeId" };
  }

  if (!body.title || typeof body.title !== "string" || body.title.trim() === "") {
    return { valid: false, error: "Missing or invalid title" };
  }

  if (!body.type || typeof body.type !== "string") {
    return { valid: false, error: "Missing or invalid type" };
  }

  // Validate type is one of allowed values
  const allowedTypes = ["flash-sale", "seasonal", "bundle", "clearance", "new-arrival"];
  if (!allowedTypes.includes(body.type)) {
    return { 
      valid: false, 
      error: `Invalid type. Must be one of: ${allowedTypes.join(", ")}` 
    };
  }

  // Validate dates if provided
  if (body.startDate && isNaN(Date.parse(body.startDate))) {
    return { valid: false, error: "Invalid startDate format" };
  }

  if (body.endDate && isNaN(Date.parse(body.endDate))) {
    return { valid: false, error: "Invalid endDate format" };
  }

  if (body.startDate && body.endDate) {
    const start = new Date(body.startDate);
    const end = new Date(body.endDate);
    if (end <= start) {
      return { valid: false, error: "endDate must be after startDate" };
    }
  }

  return { valid: true };
}

// ==============================
// CREATE CAMPAIGN
// ==============================
export async function campaignCreateHandler(
  req: Request,
  env: Env
): Promise<Response> {
  try {
    // Handle OPTIONS preflight
    if (req.method === "OPTIONS") return onRequestOptions();

    // Only accept POST
    if (req.method !== "POST") {
      return jsonResponse(
        { success: false, error: "Method not allowed" },
        405
      );
    }

    // Parse request body
    let body: CampaignInput;
    try {
      body = await req.json();
    } catch (error) {
      return jsonResponse(
        { success: false, error: "Invalid JSON in request body" },
        400
      );
    }

    // Validate input
    const validation = validateCampaignInput(body);
    if (!validation.valid) {
      return jsonResponse(
        { success: false, error: validation.error },
        400
      );
    }

    // ==============================
    // Generate Campaign ID
    // ==============================
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).slice(2, 8);
    const id = `campaign_${body.storeId}_${timestamp}_${randomStr}`;

    const r2Keys: string[] = [];

    // ==============================
    // Upload bannerImage → R2
    // ==============================
    let bannerImage = body.bannerImage || "";
    let bannerImageUrl = "";

    if (typeof bannerImage === "string" && bannerImage.startsWith("data:")) {
      const upload = await uploadImage(env, bannerImage, `${id}/banner`);
      if (upload) {
        bannerImageUrl = upload.url;
        bannerImage = upload.url; // Store full URL
        r2Keys.push(upload.objectKey);
      }
    } else if (bannerImage && bannerImage.startsWith("http")) {
      // Already a URL, keep as-is
      bannerImageUrl = bannerImage;
    }

    // ==============================
    // Upload each product image → R2
    // ==============================
    const products = Array.isArray(body.products) ? body.products : [];
    const finalProducts: ProductInput[] = [];

    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      let img = p.img || "";

      if (typeof img === "string" && img.startsWith("data:")) {
        const upload = await uploadImage(
          env,
          img,
          `${id}/products/product-${i}`
        );
        if (upload) {
          img = upload.url;
          r2Keys.push(upload.objectKey);
        }
      }

      finalProducts.push({
        name: p.name || "",
        orgPrice: p.orgPrice || "",
        promoPrice: p.promoPrice || "",
        img,
      });
    }

    // ==============================
    // Create campaign object
    // ==============================
    const now = new Date().toISOString();
    const newCampaign: Campaign = {
      id,
      storeId: body.storeId,
      type: body.type,
      title: body.title.trim(),
      description: body.description?.trim() || "",
      bannerImage, // Full URL
      bannerImageUrl, // Explicitly set for consistency
      products: finalProducts,
      cta: {
        whatsapp: body.cta?.whatsapp?.trim() || "",
        orderUrl: body.cta?.orderUrl?.trim() || "",
      },
      startDate: body.startDate || now,
      endDate: body.endDate || "",
      r2Keys, // Track uploaded files for cleanup
      createdAt: now,
    };

    // ==============================
    // Load existing campaigns
    // ==============================
    let campaigns: Campaign[];
    try {
      const raw = await env.KV.get("campaigns", { type: "json" });
      campaigns = (raw as Campaign[]) || [];
    } catch (error) {
      console.error("❌ Error reading campaigns from KV:", error);
      campaigns = [];
    }

    // Check for duplicate ID (extremely unlikely but safe)
    const exists = campaigns.some((c) => c.id === id);
    if (exists) {
      return jsonResponse(
        { success: false, error: "Campaign ID conflict, please retry" },
        409
      );
    }

    // ==============================
    // Save to KV
    // ==============================
    campaigns.push(newCampaign);

    try {
      await env.KV.put("campaigns", JSON.stringify(campaigns));
      console.log(`✅ Campaign created: ${id}`);
    } catch (error) {
      console.error("❌ Error saving to KV:", error);
      return jsonResponse(
        { success: false, error: "Failed to save campaign to database" },
        500
      );
    }

    // ==============================
    // Success Response
    // ==============================
    return jsonResponse(
      {
        success: true,
        id,
        campaign: newCampaign,
        message: "Campaign created successfully",
      },
      201
    );
  } catch (err: any) {
    console.error("❌ campaignCreateHandler error:", err);

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