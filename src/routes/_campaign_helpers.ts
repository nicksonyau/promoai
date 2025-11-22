// src/routes/_campaign_helpers.ts

export interface Env {
  KV: KVNamespace;
  MY_R2_BUCKET?: R2Bucket;
}

/**
 * Internal R2 delete (self-contained)
 * Does NOT import deleteFromR2 from utils.ts anymore.
 */
async function _deleteR2Object(env: Env, key: string): Promise<boolean> {
  if (!env.MY_R2_BUCKET) return false;
  try {
    await env.MY_R2_BUCKET.delete(key);
    return true;
  } catch (err) {
    console.error("⚠️ R2 delete failed:", key, err);
    return false;
  }
}

/**
 * Delete multiple R2 assets for a campaign
 * FIXES: “No matching export for deleteR2Keys”
 */
export async function deleteR2Keys(env: Env, keys: string[]) {
  if (!keys || keys.length === 0) return;
  for (const key of keys) {
    await _deleteR2Object(env, key);
  }
}

/**
 * Extract R2 object keys from campaign KV entry.
 * This helps campaignDelete.ts know what to remove.
 */
export function extractCampaignR2Keys(campaign: any): string[] {
  if (!campaign) return [];

  const keys: string[] = [];

  // banner
  if (campaign.bannerImage) {
    keys.push(String(campaign.bannerImage).replace("/r2/", ""));
  }

  // product images
  if (Array.isArray(campaign.products)) {
    for (const p of campaign.products) {
      if (p.img) {
        keys.push(String(p.img).replace("/r2/", ""));
      }
    }
  }

  return keys;
}
