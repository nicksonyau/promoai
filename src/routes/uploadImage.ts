// src/routes/uploadImage.ts
import { base64ToArrayBuffer, uploadToR2, r2UrlForKey } from "../_lib/utils";

export default {
  async fetch(req: Request, env: any) {
    try {
      if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

      const body = await req.json().catch(() => null);
      if (!body) return new Response(JSON.stringify({ success: false, error: "Invalid JSON" }), { status: 400, headers: { "Content-Type": "application/json" } });

      const { storeId = "anon", data, filename } = body;
      if (!data) return new Response(JSON.stringify({ success: false, error: "Missing data" }), { status: 400, headers: { "Content-Type": "application/json" } });

      const match = String(data).match(/^data:(.+);base64,(.*)$/);
      if (!match) return new Response(JSON.stringify({ success: false, error: "Not a base64 data URL" }), { status: 400, headers: { "Content-Type": "application/json" } });

      const contentType = match[1];
      const ext = filename ? filename.split(".").pop() : (contentType.split("/")[1] || "png");
      const objectKey = `stores/${storeId}/${Date.now()}-${Math.random().toString(36).slice(2,7)}.${ext}`;

      const { buffer } = base64ToArrayBuffer(data);
      await uploadToR2(env, objectKey, buffer, contentType);

      const url = r2UrlForKey(objectKey);
      return new Response(JSON.stringify({ success: true, key: objectKey, url }), { headers: { "Content-Type": "application/json" } });
    } catch (err:any) {
      console.error("uploadImage error:", err);
      return new Response(JSON.stringify({ success: false, error: err.message || String(err) }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
  }
}
