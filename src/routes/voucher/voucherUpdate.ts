import { jsonResponse } from "../../_lib/utils";

export async function voucherUpdateHandler(req: Request, env: any) {
  try {
    const url = new URL(req.url);
    const promoId = url.pathname.split("/voucher/update/")[1];

    if (!promoId) {
      return jsonResponse(
        { success: false, error: "Missing promoId in URL" },
        400
      );
    }

    // Parse body
    const body = await req.json();

    const key = `voucher:${promoId}`;
    const raw = await env.KV.get(key);

    if (!raw) {
      return jsonResponse(
        { success: false, error: "Voucher not found" },
        404
      );
    }

    const prev = JSON.parse(raw);

    // Merge updates
    const updated = {
      ...prev,
      title: body.title ?? prev.title,
      storeId: body.storeId ?? prev.storeId,
      type: body.type ?? prev.type,
      discount: body.discount ?? prev.discount,
      expiry: body.expiry ?? prev.expiry,
      quota: body.quota ?? prev.quota,
      image: body.image ?? prev.image, // stored as R2 key
      mode: body.mode ?? prev.mode,
      updatedAt: new Date().toISOString(),
    };

    // Save back to KV
    await env.KV.put(key, JSON.stringify(updated));

    return jsonResponse({ success: true, voucher: updated });

  } catch (err: any) {
    console.error("voucherUpdate error:", err);
    return jsonResponse(
      { success: false, error: "Failed to update voucher" },
      500
    );
  }
}
