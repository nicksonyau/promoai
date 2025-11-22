// src/_lib/r2Fix.ts

export function fixR2Url(env: any, key: string | null): string | null {
  if (!key) return null;
  if (typeof key !== "string") return key;

  // fully qualified URL
  if (key.startsWith("http://") || key.startsWith("https://")) {
    return key;
  }

  // local dev default
  const base = env.WORKER_URL || "http://127.0.0.1:8787";

  // normalize:
  let cleaned = key
    .replace(/^\/r2\//, "")
    .replace(/^r2\//, "")
    .replace(/^\/+/, "");

  return `${base}/r2/${cleaned}`;
}
