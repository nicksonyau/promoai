// src/routes/storePublish.ts
import { jsonResponse } from "../_lib/utils";

export interface Env {
  KV: KVNamespace;
}

export async function storePublishHandler(req: Request, env: Env): Promise<Response> {
  try {
    if (req.method !== "PUT") {
      return jsonResponse({ success: false, error: "Method not allowed" }, 405);
    }

    // Extract storeId from path
    const url = new URL(req.url);
    const parts = url.pathname.split("/");
    const storeId = parts[parts.length - 1];
    if (!storeId) {
      return jsonResponse({ success: false, error: "Missing store ID" }, 400);
    }

    // Parse body
    const body = await req.json().catch(() => ({}));
    let slug = body.slug?.toLowerCase().trim() || "";

    // Fetch store
    const key = `store:${storeId}`;
    const raw = await env.KV.get(key);
    if (!raw) {
      return jsonResponse({ success: false, error: "Store not found" }, 404);
    }

    const store = JSON.parse(raw);

    // Generate slug if empty
    if (!slug) {
      slug = (store.brand || "store")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    }

    // Build public URL
    const origin = url.origin || "http://localhost:3000";
    const publicUrl = `${origin}/p/${storeId}`;

    // Update store object
    const updated = {
      ...store,
      slug,
      publicUrl,
      published: true,
      publishedAt: new Date().toISOString(),
    };

    // Save full object
    await env.KV.put(key, JSON.stringify(updated));

    // Update store list summary
    const listRaw = (await env.KV.get("stores", { type: "json" })) || [];
    const arr = Array.isArray(listRaw) ? listRaw : [];
    const filtered = arr.filter((s: any) => s.id !== storeId);

    filtered.unshift({
      id: storeId,
      brand: store.brand,
      tagline: store.tagline,
      logoUrl: store.logoUrl || store.sections?.brand?.logo,
      slug,
      publicUrl,
      published: true,
      publishedAt: updated.publishedAt,
    });

    await env.KV.put("stores", JSON.stringify(filtered.slice(0, 1000)));

    console.log("✅ Store published:", publicUrl);

    return jsonResponse({
      success: true,
      slug,
      publicUrl,
      message: "Store published successfully",
    });
  } catch (err: any) {
    console.error("❌ storePublishHandler error:", err);
    return jsonResponse(
      { success: false, error: err?.message || "Failed to publish store" },
      500
    );
  }
}
