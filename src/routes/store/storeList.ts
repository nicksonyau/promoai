// src/routes/storeList.ts
import { jsonResponse } from "../_lib/utils";
export async function storeListHandler(req: Request, env: any): Promise<Response> {
  const start = Date.now();
  try {
    const cache = caches.default;
    const key = new Request(req.url, req);
    const cached = await cache.match(key);
    if (cached) {
      const body = await cached.clone().json();
      return jsonResponse({ ...body, fromCache: true, duration_ms: Date.now()-start }, 200);
    }

    const raw = (await env.KV.get("stores", { type: "json" })) || [];
    const arr = Array.isArray(raw) ? raw : [];
    const stores = arr.map((s:any)=>({
      id: s.id,
      brand: s.brand,
      tagline: s.tagline,
      template: s.template,
      logoUrl: s.logoUrl || s.logo || null,
      createdAt: s.createdAt || null,
    }));
    const body = { success:true, count: stores.length, stores };
    const resp = new Response(JSON.stringify(body), { headers: { "Content-Type":"application/json" } });
    resp.headers.append("Cache-Control", "max-age=15");
    await cache.put(key, resp.clone());
    console.log("storeList:", { count: stores.length, duration_ms: Date.now()-start });
    return resp;
  } catch (err:any) {
    console.error("storeList error:", err);
    return jsonResponse({ success:false, error: err?.message || "Failed" }, 500);
  }
}
