// src/routes/voucher/voucherCreate.ts
import { jsonResponse } from "../../_lib/utils";

export async function voucherCreateHandler(req: Request, env: any) {
  try {
    const body = await req.json();

    // If promoId not provided, generate one
    const promoId =
      body.promoId ||
      `voucher_${Math.random().toString(36).substring(2, 10)}`;

    const voucher = {
      promoId,
      storeId: body.storeId || "",
      title: body.title || "",
      type: body.type || "percent",
      discount: Number(body.discount) || 0,
      expiry: body.expiry || null,
      quota: Number(body.quota) || 0,
      claimed: 0,
      redeemed: 0,
      image: body.image || null, // R2 image key or null
      mode: body.mode || "live",
      createdAt: new Date().toISOString(),
    };

    // Save to KV
    await env.KV.put(`voucher:${promoId}`, JSON.stringify(voucher));

    return jsonResponse({ success: true, voucher });
  } catch (err: any) {
    console.error("voucherCreate error:", err);
    return jsonResponse(
      { success: false, error: "Failed to create voucher" },
      500
    );
  }
}
