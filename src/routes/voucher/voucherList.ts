// src/routes/voucher/voucherList.ts
import { jsonResponse } from "../../_lib/utils";

export async function voucherListHandler(req: Request, env: any) {
  try {
    console.log("📥 voucherListHandler START");

    const keys = await env.KV.list({ prefix: "voucher:" });
    console.log("🔑 Voucher keys:", keys.keys.map((k) => k.name));

    const base = env.WORKER_URL || "http://localhost:8787";

    const fix = (val: any) => {
      if (!val) return null;
      if (typeof val !== "string") return val;

      // Already a full URL
      if (val.startsWith("http://") || val.startsWith("https://")) {
        return val;
      }

      // Remove extra prefix and slashes
      let cleaned = val
        .replace(/^\/?r2\//, "")
        .replace(/^\/+/, "");

      const finalUrl = `${base}/r2/${cleaned}`;
      console.log("🔗 FIXED IMAGE URL:", { original: val, finalUrl });
      return finalUrl;
    };

    const vouchers: any[] = [];

    for (const k of keys.keys) {
      const raw = await env.KV.get(k.name);
      console.log("📦 RAW KV VALUE:", { key: k.name, raw });

      if (!raw) continue;
      const v = JSON.parse(raw);

      const fixedVoucher = {
        ...v,
        image: fix(v.image),
      };

      console.log("✨ CLEANED VOUCHER OBJECT:", fixedVoucher);
      vouchers.push(fixedVoucher);
    }

    const finalResponse = { success: true, vouchers };

    console.log("📤 FINAL RESPONSE BODY:", finalResponse);

    return jsonResponse(finalResponse);
  } catch (err: any) {
    console.error("❌ voucherList error:", err);
    return jsonResponse(
      { success: false, error: "Failed to list vouchers" },
      500
    );
  }
}
