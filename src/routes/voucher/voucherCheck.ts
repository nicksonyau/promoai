// src/routes/voucherCheck.ts
import { Env } from "../index";
import { jsonResponse } from "../_lib/utils";

export async function voucherCheckHandler(req: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(req.url);
    const promoId = url.searchParams.get("promoId");
    const code = url.searchParams.get("code");
    if (!promoId || !code) return jsonResponse({ success:false, error:"promoId & code required" }, 400);

    const claims = (await env.KV.get(`voucher:claims:${promoId}`, { type: "json" })) || [];
    const c = claims.find((x:any) => x.id === code);
    if (!c) return jsonResponse({ success:false, error:"Not found" }, 404);

    return jsonResponse({ success:true, claim:c }, 200);
  } catch (err:any) {
    console.error("voucherCheck error:", err);
    return jsonResponse({ success:false, error:"Failed" }, 500);
  }
}
