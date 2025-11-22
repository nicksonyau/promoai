// src/_lib/utils.ts

export interface EnvCommon {
  KV: KVNamespace;
  MY_R2_BUCKET?: R2Bucket;
}

export function base64ToArrayBuffer(base64: string) {
  const m = base64.match(/^data:(.+);base64,(.*)$/);
  const raw = m ? m[2] : base64;
  const contentType = m ? m[1] : "application/octet-stream";
  const binary = atob(raw);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return { buffer: bytes.buffer, contentType };
}

export async function uploadToR2(
  env: EnvCommon,
  objectKey: string,
  buffer: ArrayBuffer,
  contentType?: string
) {
  if (!env.MY_R2_BUCKET) throw new Error("R2 bucket not bound");
  await env.MY_R2_BUCKET.put(objectKey, buffer, {
    httpMetadata: { contentType: contentType || "application/octet-stream" },
  });
  return objectKey;
}

export async function deleteFromR2(env: EnvCommon, objectKey: string) {
  if (!env.MY_R2_BUCKET) return false;
  try {
    await env.MY_R2_BUCKET.delete(objectKey);
    return true;
  } catch (e) {
    console.warn("deleteFromR2 failed", objectKey, e);
    return false;
  }
}

export function r2UrlForKey(objectKey: string) {
  // Use worker proxy route so browser fetches from same origin
  return `/r2/${objectKey}`;
}

export async function invalidateCacheFor(reqUrl: string) {
  try {
    const cache = caches.default;
    if (!cache) return;
    await cache.delete(new Request(reqUrl));
  } catch (e) {
    console.warn("invalidateCacheFor failed", reqUrl, e);
  }
}

/* ============================================================
   ✅ Shared JSON response helper (fixes build error)
   - Safe for Cloudflare Workers
   - Automatically sets correct headers
   ============================================================ */
export function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
