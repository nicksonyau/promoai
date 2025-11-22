import { jsonResponse } from "../../_lib/utils";
import { nowIso } from "../../_lib/voucherUtils";

export async function voucherRedeemHandler(req: Request, env: any) {
  try {
    const body = await req.json();
    const { promoId, userId } = body;

    if (!promoId || !userId) {
      return jsonResponse({ success: false, error: "promoId & userId required" }, 400);
    }

    const claimKey = `voucher_claims:${promoId}:${userId}`;
    const claimed = await env.KV.get(claimKey);
    if (!claimed) {
      return jsonResponse({ success: false, error: "Not claimed" }, 404);
    }

    const redeemKey = `voucher_redeemed:${promoId}:${userId}`;
    const used = await env.KV.get(redeemKey);
    if (used) {
      return jsonResponse({ success: false, error: "Already redeemed" }, 409);
    }

    const redeem = {
      promoId,
      userId,
      redeemedAt: nowIso(),
    };

    await env.KV.put(redeemKey, JSON.stringify(redeem));

    return jsonResponse({ success: true, redeem });
  }
  catch (err) {
    return jsonResponse({ success: false, error: "Server error" }, 500);
  }
}
