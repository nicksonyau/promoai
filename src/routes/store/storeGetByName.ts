// src/routes/storeGetByName.ts
import { jsonResponse } from "../_lib/utils";
export async function storeGetByNameHandler(req: Request, env: any): Promise<Response> {
  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").toLowerCase();
    const raw = (await env.KV.get("stores", { type: "json" })) || [];
    const arr = Array.isArray(raw) ? raw : [];
    const filtered = arr.filter((s:any)=> s.brand && s.brand.toLowerCase().includes(q));
    return jsonResponse({ success:true, count: filtered.length, stores: filtered }, 200);
  } catch (err:any) {
    console.error("storeGetByName error:", err);
    return jsonResponse({ success:false, error: err?.message || "Failed" }, 500);
  }
}
