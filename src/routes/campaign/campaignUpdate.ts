// File: src/routes/campaignUpdate.ts
import { Env } from "../index";
import {
  base64ToArrayBuffer,
  uploadToR2,
  r2UrlForKey,
  jsonResponse,
} from "../_lib/utils";

// ==============================
// Helper: upload base64 image → R2
// ==============================
async function uploadImage(env: Env, base64: string, key: string) {
  if (!base64 || !base64.startsWith("data:")) return null;
  if (!env.MY_R2_BUCKET) return null;

  const extMatch = base64.match(/^data:image\/([a-zA-Z0-9+]+);base64,/);
  const ext = extMatch ? extMatch[1] : "png";

  const objectKey = `campaigns/${key}.${ext}`;

  const { buffer, contentType } = base64ToArrayBuffer(base64);
  await uploadToR2(env, objectKey, buffer, contentType);

  return {
    objectKey,
    url: r2UrlForKey(objectKey),
  };
}

// ==============================
// UPDATE CAMPAIGN
// ==============================
export async function campaignUpdateHandler(
  req: Request,
  env: Env
): Promise<Response> {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "PUT, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    const id = req.url.split("/campaign/update/")[1];
    if (!id) return jsonResponse({ success: false, error: "Missing campaign ID" }, 400);

    const body = await req.json();

    const campaigns =
      (await env.KV.get("campaigns", { type: "json" })) || [];

    const index = campaigns.findIndex((c: any) => c.id === id);
    if (index === -1) {
      return jsonResponse({ success: false, error: "Campaign not found" }, 404);
    }

    const existing = campaigns[index];
    const r2Keys = existing.r2Keys || [];

    // ==============================
    // Update banner image
    // ==============================
    let bannerImage = body.bannerImage ?? existing.bannerImage;

    if (typeof bannerImage === "string" && bannerImage.startsWith("data:")) {
      const up = await uploadImage(env, bannerImage, `${id}/banner`);
      if (up) {
        bannerImage = up.url;
        r2Keys.push(up.objectKey);
      }
    }

    // ==============================
    // Update product images
    // ==============================
    const products = Array.isArray(body.products)
      ? body.products
      : existing.products || [];

    const finalProducts: any[] = [];

    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      let img = p.img ?? "";

      if (typeof img === "string" && img.startsWith("data:")) {
        const up = await uploadImage(env, img, `${id}/products/product-${i}`);
        if (up) {
          img = up.url;
          r2Keys.push(up.objectKey);
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
    // Merge updated data
    // ==============================
    const updated = {
      ...existing,
      ...body,
      bannerImage,
      products: finalProducts,
      r2Keys,
      updatedAt: new Date().toISOString(),
    };

    campaigns[index] = updated;

    // ==============================
    // Save back to KV
    // ==============================
    await env.KV.put("campaigns", JSON.stringify(campaigns));

    return jsonResponse({ success: true, campaign: updated }, 200);
  } catch (err: any) {
    console.error("❌ campaignUpdateHandler error:", err);
    return jsonResponse(
      { success: false, error: err?.message || "Update failed" },
      500
    );
  }
}
