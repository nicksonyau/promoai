// voucherUtils.ts
export function generateCode(prefix = "VC", length = 8) {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // avoid ambiguous
  let s = "";
  for (let i = 0; i < length; i++)
    s += chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}_${s}`;
}

export function nowIso() {
  return new Date().toISOString();
}

export function parseIntSafe(v: any, fallback = 0) {
  const n = parseInt(`${v}`, 10);
  return Number.isNaN(n) ? fallback : n;
}
