// File: src/routes/campaignDelete.ts
import { Env } from "../index";
import { jsonResponse, r2UrlForKey } from "../_lib/utils";

// CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

/**
 * Helper to delete an object from R2 if bucket is configured.
 * Returns true if deleted or not configured/absent; false on explicit failure.
 */
async function deleteR2Object(env: Env, objectKey: string) {
  try {
    if (!env.MY_R2_BUCKET) {
      // Nothing to delete (R2 not configured) — treat as success
      return true;
    }
    // Cloudflare R2: env.MY_R2_BUCKET.delete(key)
    await env.MY_R2_BUCKET.delete(objectKey);
    return true;
  } catch (err) {
    console.error("❌ deleteR2Object error for", objectKey, err);
    return false;
  }
}

// DELETE handler
export async function campaignDeleteHandler(
  req: Request,
  env: Env
): Promise<Response> {
  try {
    if (req.method === "OPTIONS") return onRequestOptions();

    // parse id from url path
    // Expecting route like: /campaign/delete/:id
    const url = new URL(req.url);
    const parts = url.pathname.split("/").filter(Boolean);
    // find last segment as id
    const id = parts[parts.length - 1];

    if (!id) {
      return jsonResponse({ success: false, error: "Missing campaign id" }, 400);
    }

    // load campaigns array
    const raw = await env.KV.get("campaigns", { type: "json" });
    const campaigns: any[] = raw || [];

    const idx = campaigns.findIndex((c) => String(c.id) === String(id));
    if (idx === -1) {
      return jsonResponse({ success: false, error: "Campaign not found" }, 404);
    }

    const campaign = campaigns[idx];

    // Delete R2 objects listed in campaign.r2Keys (if any)
    const r2Keys: string[] = Array.isArray(campaign.r2Keys)
      ? campaign.r2Keys
      : [];

    // Attempt deletion for each key; keep track of failures but continue
    const deleteResults: { key: string; ok: boolean }[] = [];

    for (const key of r2Keys) {
      try {
        const ok = await deleteR2Object(env, key);
        deleteResults.push({ key, ok });
      } catch (err) {
        console.error("Error deleting R2 key", key, err);
        deleteResults.push({ key, ok: false });
      }
    }

    // Remove the campaign from array and persist
    campaigns.splice(idx, 1);
    await env.KV.put("campaigns", JSON.stringify(campaigns));

    return jsonResponse({
      success: true,
      id,
      deletedR2: deleteResults,
    }, 200);
  } catch (err: any) {
    console.error("❌ campaignDeleteHandler error:", err);
    return jsonResponse({ success: false, error: "Failed to delete campaign" }, 500);
  }
}
