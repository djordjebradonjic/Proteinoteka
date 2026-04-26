const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

interface TrackPayload {
  eventType: "PRODUCT_VIEW" | "CLICK_OUT" | "SEARCH" | "COMPARE_CLICK";
  productId?: number;
  store?: string;
  query?: string;
}

export function trackEvent(payload: TrackPayload): void {
  if (!API_BASE) return;
  fetch(`${API_BASE}/api/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {});
}
