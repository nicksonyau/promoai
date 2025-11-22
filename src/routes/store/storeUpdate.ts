// src/routes/storeUpdate.ts
import { base64ToArrayBuffer, uploadToR2, r2UrlForKey, invalidateCacheFor, jsonResponse } from "../_lib/utils";

export async function storeUpdateHandler(req: Request, env: any): Promise<Response> {
  const start = Date.now();
  try {
    if (req.method !== "PUT") return jsonResponse({ success: false, error: "Method not allowed" }, 405);
    const url = new URL(req.url);
    const id = url.pathname.split("/").pop();
    if (!id) return jsonResponse({ success: false, error: "Missing id" }, 400);

    const key = `store:${id}`;
    const raw = await env.KV.get(key);
    if (!raw) return jsonResponse({ success: false, error: "Not found" }, 404);
    const old = typeof raw === "string" ? JSON.parse(raw) : raw;

    const body = await req.json().catch(() => null);
    if (!body) return jsonResponse({ success: false, error: "Invalid JSON" }, 400);

    const merged = { ...old, ...body, updatedAt: new Date().toISOString() };

    // HELPER: Reupload base64 → R2 and return public URL
    async function reuploadIfBase64(val: any, prefix: string): Promise<string> {
      if (!val || typeof val !== "string") return val || "";
      if (val.startsWith("/r2/") || val.startsWith("http")) return val;
      if (!val.startsWith("data:")) return val;

      try {
        const { buffer, contentType } = base64ToArrayBuffer(val);
        const ext = contentType.split("/")[1]?.split(";")[0] || "png";
        const objectKey = `${prefix}.${ext}`;
        await uploadToR2(env, objectKey, buffer, contentType);
        return r2UrlForKey(objectKey);
      } catch (e) {
        console.warn("reuploadIfBase64 failed for", prefix, e);
        return val; // fallback to original base64
      }
    }

    // === BRAND IMAGES ===
    if (merged.sections?.brand) {
      merged.sections.brand.logo = await reuploadIfBase64(merged.sections.brand.logo, `stores/${id}/logo`);
      merged.sections.brand.heroImage = await reuploadIfBase64(merged.sections.brand.heroImage, `stores/${id}/hero`);
    }

    // === MENU IMAGES ===
    if (Array.isArray(merged.sections?.menu)) {
      for (let i = 0; i < merged.sections.menu.length; i++) {
        const section = merged.sections.menu[i];
        if (section && Array.isArray(section.items)) {
          for (let j = 0; j < section.items.length; j++) {
            const item = section.items[j];
            if (item && item.img) {
              item.img = await reuploadIfBase64(item.img, `stores/${id}/menu-${i}-${j}`);
            }
          }
        }
      }
    }

    // === GALLERY IMAGES (FIXED: Handle both string and object formats) ===
    if (Array.isArray(merged.sections?.gallery)) {
      for (let i = 0; i < merged.sections.gallery.length; i++) {
        const item = merged.sections.gallery[i];
        
        if (!item) continue;
        
        // Handle object format: {img: "...", caption: "..."}
        if (typeof item === "object" && item.img) {
          item.img = await reuploadIfBase64(item.img, `stores/${id}/gallery-${i}`);
        } 
        // Handle string format (legacy or direct URLs)
        else if (typeof item === "string") {
          merged.sections.gallery[i] = await reuploadIfBase64(item, `stores/${id}/gallery-${i}`);
        }
      }
    }

    // === SERVICES IMAGES (if you add them in future) ===
    if (Array.isArray(merged.sections?.services)) {
      for (let i = 0; i < merged.sections.services.length; i++) {
        const s = merged.sections.services[i];
        if (s && s.img) {
          s.img = await reuploadIfBase64(s.img, `stores/${id}/service-${i}`);
        }
      }
    }

    // Save updated store
    await env.KV.put(key, JSON.stringify(merged));

    // Update stores list
    const rawList = (await env.KV.get("stores", { type: "json" })) || [];
    const arr = Array.isArray(rawList) ? rawList : [];
    const others = arr.filter((s: any) => s.id !== id);
    others.unshift({
      id,
      brand: merged.brand,
      tagline: merged.tagline,
      template: merged.template,
      logoUrl: merged.sections?.brand?.logo || merged.logoUrl || null,
      updatedAt: merged.updatedAt
    });
    await env.KV.put("stores", JSON.stringify(others.slice(0, 1000)));

    // Invalidate cache
    const origin = new URL(req.url).origin;
    await invalidateCacheFor(`${origin}/stores`);

    const result = { success: true, store: merged, duration_ms: Date.now() - start };
    console.log("storeUpdate success:", result);
    return jsonResponse(result, 200);
  } catch (err: any) {
    console.error("storeUpdate error:", err);
    return jsonResponse({ success: false, error: err?.message || "Failed" }, 500);
  }
}