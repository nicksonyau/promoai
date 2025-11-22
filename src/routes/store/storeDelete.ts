// src/routes/storeDelete.ts
import { invalidateCacheFor, jsonResponse } from "../_lib/utils";
export async function storeDeleteHandler(req: Request, env: any): Promise<Response> {
  try {
    if (req.method !== "DELETE") return jsonResponse({ success:false, error:"Method not allowed" }, 405);
    const id = new URL(req.url).pathname.split("/").pop();
    if (!id) return jsonResponse({ success:false, error:"Missing id" }, 400);
    const key = `store:${id}`;
    const raw = await env.KV.get(key);
    if (!raw) return jsonResponse({ success:false, error:"Not found" }, 404);

    await env.KV.delete(key);
    // remove from stores list
    const rawList = (await env.KV.get("stores", { type: "json" })) || [];
    const arr = Array.isArray(rawList) ? rawList : [];
    await env.KV.put("stores", JSON.stringify(arr.filter((s:any)=>s.id!==id)));

    // attempt R2 deletes for common names (best-effort)
    try {
      const prefixes = [`stores/${id}/`];
      if (env.MY_R2_BUCKET) {
        // possible keys -- best-effort delete
        const common = ["logo.png","logo.jpg","logo.webp","hero.png","hero.jpg"];
        await Promise.all(common.map(async filename=>{
          try { await env.MY_R2_BUCKET.delete(`stores/${id}/${filename}`); } catch(e){/*ignore*/} 
        }));
      }
    } catch(e){ console.warn("R2 cleanup partial", e); }

    const origin = new URL(req.url).origin;
    await invalidateCacheFor(`${origin}/stores`);
    return jsonResponse({ success:true, id }, 200);
  } catch (err:any) {
    console.error("storeDelete error:", err);
    return jsonResponse({ success:false, error: err?.message || "Failed" }, 500);
  }
}
