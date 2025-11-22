// File: src/routes/voucher/voucherUpload.ts
import { jsonResponse } from "../../_lib/utils";

export async function voucherUploadHandler(req: Request, env: any) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File;
    const promoId = form.get("promoId") as string;

    if (!file) {
      return jsonResponse({ success: false, error: "No file uploaded" }, 400);
    }
    if (!promoId) {
      return jsonResponse({ success: false, error: "Missing promoId" }, 400);
    }

    const ext = file.name.split(".").pop();
    const r2Key = `vouchers/${promoId}/voucher.${ext}`;

    console.log("📤 Uploading voucher image to R2:", r2Key);

    // Upload
    await env.MY_R2_BUCKET.put(r2Key, file.stream(), {
      httpMetadata: { contentType: file.type },
    });

    return jsonResponse({
      success: true,
      key: r2Key,
      url: `/r2/${r2Key}`,
    });
  } catch (err: any) {
    console.error("❌ voucherUpload error:", err);
    return jsonResponse({ success: false, error: "Upload failed" }, 500);
  }
}
