/**
 * Constant-time string comparison (for cookies, tokens and credentials), so response timing
 * doesn't reveal how many leading characters matched. Runs on both the Node and Edge runtimes.
 */
export function safeEqual(a: string | undefined | null, b: string | undefined | null): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const encoder = new TextEncoder();
  const x = encoder.encode(a);
  const y = encoder.encode(b);
  // Always walk the longer input so length differences don't short-circuit the loop.
  let diff = x.length ^ y.length;
  const len = Math.max(x.length, y.length);
  for (let i = 0; i < len; i++) {
    diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  }
  return diff === 0;
}
