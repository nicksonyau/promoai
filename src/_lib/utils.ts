// src/_lib/utils.ts
export interface Env {
  KV: KVNamespace;
  MY_R2_BUCKET?: R2Bucket;
}

export function base64ToArrayBuffer(dataUrl: string): { buffer: ArrayBuffer; contentType: string } {
  if (!dataUrl || typeof dataUrl !== "string") throw new Error("Invalid base64 data");
  const m = dataUrl.match(/^data:(.+);base64,(.*)$/);
  if (!m) throw new Error("Invalid data URL");
  const contentType = m[1];
  const base64 = m[2];
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return { buffer: bytes.buffer, contentType };
}

export async function uploadToR2(env: Env, objectKey: string, buffer: ArrayBuffer | Uint8Array, contentType = "application/octet-stream") {
  if (!env.MY_R2_BUCKET) throw new Error("R2 binding MY_R2_BUCKET not configured");
  // ensure buffer is Uint8Array
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  await env.MY_R2_BUCKET.put(objectKey, bytes, { httpMetadata: { contentType } });
}

export function r2UrlForKey(objectKey: string) {
  // Using Option A: proxy path /r2/<objectKey>
  return `/r2/${objectKey}`;
}

export async function invalidateCacheFor(reqUrl: string) {
  try {
    if (typeof caches === "undefined" || !caches.default) return;
    await caches.default.delete(new Request(reqUrl));
  } catch (e) {
    console.warn("invalidateCacheFor failed", e);
  }
}

export function jsonResponse(obj: any, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });
}
