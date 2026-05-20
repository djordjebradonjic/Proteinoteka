export function formatPrice(numericPrice: number | null | undefined): string {
  if (numericPrice == null || numericPrice <= 0) return "—";
  return Math.round(numericPrice).toLocaleString("de-DE") + " RSD";
}
