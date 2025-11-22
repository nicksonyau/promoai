// src/routes/voucher/voucherDelete.ts
import { jsonResponse } from "../../_lib/utils";

export async function voucherDeleteHandler(req: Request, env: any) {
  try {
    const promoId = req.url.split("/voucher/delete/")[1];

    if (!promoId) {
      return jsonResponse({ success: false, error: "Missing promoId" }, 400);
    }

    await env.KV.delete(`voucher:${promoId}`);
    await env.KV.delete(`voucherClaims:${promoId}`);

    return jsonResponse({ success: true });
  } catch (err: any) {
    console.error("voucherDelete error:", err);
    return jsonResponse(
      { success: false, error: "Failed to delete voucher" },
      500
    );
  }
}
