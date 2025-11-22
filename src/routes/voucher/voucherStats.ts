import { jsonResponse } from "../../_lib/utils";

export async function voucherStatsHandler(req: Request, env: any) {
  try {
    const url = new URL(req.url);
    const promoId = url.searchParams.get("promoId");

    if (!promoId) {
      return jsonResponse({ success: false, error: "promoId required" }, 400);
    }

    const claims = await env.KV.list({ prefix: `voucher_claims:${promoId}` });
    const redeemed = await env.KV.list({ prefix: `voucher_redeemed:${promoId}` });

    return jsonResponse({
      success: true,
      stats: {
        totalClaimed: claims.keys.length,
        totalRedeemed: redeemed.keys.length,
      },
    });
  }
  catch (err) {
    return jsonResponse({ success: false, error: "Server error" }, 500);
  }
}
