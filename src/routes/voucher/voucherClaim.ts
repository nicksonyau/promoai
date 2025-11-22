import { jsonResponse } from "../../_lib/utils";
import { nowIso } from "../../_lib/voucherUtils";

export async function voucherClaimHandler(req: Request, env: any) {
  try {
    const body = await req.json();
    const { promoId, userId } = body;

    if (!promoId || !userId) {
      return jsonResponse({ success: false, error: "promoId & userId required" }, 400);
    }

    const key = `voucher_claims:${promoId}:${userId}`;
    const exists = await env.KV.get(key);
    if (exists) {
      return jsonResponse({ success: false, error: "Already claimed" }, 409);
    }

    const claim = {
      promoId,
      userId,
      claimedAt: nowIso(),
    };

    await env.KV.put(key, JSON.stringify(claim));

    return jsonResponse({ success: true, claim });
  }
  catch (err: any) {
    return jsonResponse({ success: false, error: "Server error" }, 500);
  }
}
