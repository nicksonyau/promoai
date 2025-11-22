// src/routes/storeCreate.ts
import { base64ToArrayBuffer, uploadToR2, r2UrlForKey, invalidateCacheFor, jsonResponse } from "../_lib/utils";

export interface Env { KV: KVNamespace; MY_R2_BUCKET?: R2Bucket; }

function genStoreId() { return "store_" + Math.random().toString(36).slice(2,10); }

export async function storeCreateHandler(req: Request, env: Env): Promise<Response> {
  const start = Date.now();
  try {
    if (req.method !== "POST") return jsonResponse({ success:false, error:"Method not allowed" }, 405);
    const body = await req.json().catch(()=>null);
    if (!body) return jsonResponse({ success:false, error:"Invalid JSON" }, 400);

    let { brand, tagline = "", templateId = "restaurant", sections = {} } = body as any;
    if (!brand) return jsonResponse({ success:false, error:"Missing brand" }, 400);
    const storeId = body.storeId || genStoreId();
    const storeKey = `store:${storeId}`;

    // upload helpers
    async function uploadIfBase64(val:any, prefix:string) {
      if (!val || typeof val !== "string") return val || null;
      if (val.startsWith("/r2/") || val.startsWith("http")) return val;
      // assume base64 data URL
      try {
        const { buffer, contentType } = base64ToArrayBuffer(val);
        const ext = (contentType.split("/")[1] || "png");
        const objectKey = `${prefix}.${ext}`;
        await uploadToR2(env, objectKey, buffer, contentType);
        return r2UrlForKey(objectKey);
      } catch (e) {
        console.warn("uploadIfBase64 failed:", e);
        return null;
      }
    }

    let logoUrl = null;
    if (sections.brand?.logo) {
      logoUrl = await uploadIfBase64(sections.brand.logo, `stores/${storeId}/logo`);
      if (logoUrl) sections.brand.logo = logoUrl;
    }
    if (sections.brand?.heroImage) {
      const hero = await uploadIfBase64(sections.brand.heroImage, `stores/${storeId}/hero`);
      if (hero) sections.brand.heroImage = hero;
    }
    if (Array.isArray(sections.menu)) {
      for (let i=0;i<sections.menu.length;i++){
        const item = sections.menu[i];
        if (item?.img) {
          const u = await uploadIfBase64(item.img, `stores/${storeId}/menu-${i}`);
          if (u) item.img = u;
        }
      }
    }

    const now = new Date().toISOString();
    const storeObj = { id: storeId, brand, tagline, template: templateId, sections, createdAt: now, updatedAt: now, logoUrl: logoUrl || sections.brand?.logo || null };

    console.log(JSON.stringify(storeObj, null, 2));
    await env.KV.put(storeKey, JSON.stringify(storeObj));

    // update summary list
    const existing = (await env.KV.get("stores", { type: "json" })) || [];
    const arr = Array.isArray(existing) ? existing : [];
    const filtered = arr.filter((s:any)=>s.id!==storeId);
    filtered.unshift({ id: storeId, brand, tagline, template: templateId, logoUrl: storeObj.logoUrl, createdAt: now });
    await env.KV.put("stores", JSON.stringify(filtered.slice(0,1000)));

    // invalidate /stores
    const origin = new URL(req.url).origin;
    await invalidateCacheFor(`${origin}/stores`);

    const result = { success: true, id: storeId, store: storeObj, duration_ms: Date.now()-start };
    console.log("storeCreate:", JSON.stringify(result));
    return jsonResponse(result, 200);
  } catch (err:any) {
    console.error("storeCreate error:", err);
    return jsonResponse({ success:false, error:"Failed to create store", message: err?.message || String(err) }, 500);
  }
}
