// File: src/routes/campaignGet.ts
import { Env } from "../index";
import { jsonResponse } from "../_lib/utils";

// ==============================
// GET CAMPAIGN BY ID
// ==============================
export async function campaignGetHandler(
  req: Request,
  env: Env
): Promise<Response> {
  try {
    // ------------------------------
    // CORS PREFLIGHT
    // ------------------------------
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    // ------------------------------
    // EXTRACT ID
    // ------------------------------
    const id = req.url.split("/campaign/")[1];
    if (!id) {
      return jsonResponse(
        { success: false, error: "Missing campaign ID" },
        400
      );
    }

    // ------------------------------
    // LOAD FROM KV
    // ------------------------------
    const campaigns =
      (await env.KV.get("campaigns", { type: "json" })) || [];

    const campaign = campaigns.find((c: any) => c.id === id);

    if (!campaign) {
      return jsonResponse(
        { success: false, error: "Campaign not found" },
        404
      );
    }

    // Debug raw values BEFORE fixing
    console.log("📦 RAW bannerImage:", campaign.bannerImage);
    console.log(
      "🧾 RAW product images:",
      Array.isArray(campaign.products)
        ? campaign.products.map((p: any) => p.img)
        : []
    );

    // ===========================================================
    // 🔧 FIX FUNCTION — uses FRONTEND_URL for local development
    // ===========================================================
    const fix = (val: any): string | null => {
      if (!val) return null;

      if (typeof val !== "string") return val;

      // Already full URL
      if (val.startsWith("http://") || val.startsWith("https://")) {
        return val;
      }

      // FRONTEND URL (LOCAL or PROD)
      const base = env.WORKER_URL || "http://localhost:8787";

      // Remove "/r2/" prefix and leading slashes
      let cleaned = val
        .replace(/^\/r2\//, "")  // remove /r2/
        .replace(/^r2\//, "")    // remove r2/
        .replace(/^\/+/, "");    // remove leading slashes

      // For example → campaigns/abc/banner.jpeg
      return `${base}/r2/${cleaned}`;
    };

    // ===========================================================
    // CLEANED RESPONSE (used by frontend)
    // ===========================================================
    const cleaned = {
      ...campaign,
      bannerImage: fix(campaign.bannerImage),

      products: Array.isArray(campaign.products)
        ? campaign.products.map((p: any) => ({
            ...p,
            img: fix(p.img),
          }))
        : [],
    };

    // Debug fixed URLs
    console.log("🔗 FIXED bannerImage:", cleaned.bannerImage);
    console.log(
      "🔗 FIXED product images:",
      cleaned.products.map((p: any) => p.img)
    );

    return new Response(JSON.stringify(cleaned), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });

  } catch (err: any) {
    console.error("❌ campaignGet error:", err);
    return jsonResponse(
      { success: false, error: "Failed to load campaign" },
      500
    );
  }
}
