import { jsonResponse } from "../../_lib/utils";

export async function voucherDetailHandler(req: Request, env: any) {
  try {
    const url = new URL(req.url);
    const promoId = url.searchParams.get("promoId");

    if (!promoId) {
      return jsonResponse(
        { success: false, error: "Missing promoId" },
        400
      );
    }

    const key = `voucher:${promoId}`;
    const raw = await env.KV.get(key);

    if (!raw) {
      return jsonResponse(
        { success: false, error: "Voucher not found" },
        404
      );
    }

    const voucher = JSON.parse(raw);

    // Build full R2 URL for image
    let image = voucher.image || null;
    if (image && !image.startsWith("http")) {
      const base = env.WORKER_URL || "http://localhost:8787";
      image = `${base}/r2/${image.replace(/^\/?r2\//, "")}`;
    }

    return jsonResponse({
      success: true,
      voucher: {
        ...voucher,
        image,
      },
    });
  } catch (err: any) {
    console.error("voucherDetail error:", err);
    return jsonResponse(
      { success: false, error: "Failed to load voucher" },
      500
    );
  }
}
