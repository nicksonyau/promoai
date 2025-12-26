export function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

// simple + deterministic rule: score >= 70 => 100/day else 50/day
export function computeDailyLimit(score: number) {
  const s = clamp(Number.isFinite(score) ? score : 0, 0, 100);
  return s >= 70 ? 100 : 50;
}
