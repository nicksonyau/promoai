// src/routes/storeGet.ts
import { r2UrlForKey, jsonResponse } from "../_lib/utils";

export async function storeGetHandler(req: Request, env: any): Promise<Response> {
  const start = Date.now();

  try {
    const url = new URL(req.url);
    const storeId = url.pathname.split("/").pop();

    if (!storeId) {
      return jsonResponse({ success: false, error: "Missing storeId" }, 400);
    }

    // Fetch KV data
    const raw = await env.KV.get(`store:${storeId}`);
    if (!raw) return jsonResponse({ success: false, error: "Not found" }, 404);

    const store = JSON.parse(raw);

    // ---------- NORMALIZATION ----------
    const fix = (val: any) => {
      if (!val) return null;

      if (typeof val !== "string") return val;

      // Already correct:
      if (val.startsWith("http")) return val;
      if (val.startsWith("/r2/")) return val;

      // Already stored as full R2 key (good)
      if (val.startsWith(`stores/${storeId}/`)) {
        return r2UrlForKey(val);
      }

      // NEW FIX ✔ — auto-detect naked filenames like "logo.png"
      if (/^[\w\-.]+\.(png|jpg|jpeg|webp)$/i.test(val)) {
        return r2UrlForKey(`stores/${storeId}/${val}`);
      }

      return val;
    };

    // Fix brand images
    if (store.sections?.brand) {
      store.sections.brand.logo = fix(store.sections.brand.logo);
      store.sections.brand.heroImage = fix(store.sections.brand.heroImage);
    }

    // Fix menu images
    if (Array.isArray(store.sections?.menu)) {
      store.sections.menu = store.sections.menu.map((item: any) => ({
        ...item,
        img: fix(item.img),
      }));
    }

    const result = {
      success: true,
      store,
      duration_ms: Date.now() - start,
    };

    console.log("storeGet:", result);
    return jsonResponse(result, 200);

  } catch (err: any) {
    console.error("storeGet error:", err);
    return jsonResponse({ success: false, error: err?.message || "Failed" }, 500);
  }
}
