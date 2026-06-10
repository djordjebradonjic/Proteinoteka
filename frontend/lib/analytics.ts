// Central analytics hub — GA4 + Vercel Analytics + internal backend.
// All tracking calls go through here. Do NOT call gtag or track() directly.

import { track } from "@vercel/analytics";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type AnalyticsEventName =
  | "view_item_card"
  | "view_item_details"
  | "click_buy_featured"  // reserved — featured cards currently show Detalji
  | "click_buy_details"
  | "outbound_click"
  | "compare_click"
  | "search"
  | "alert_cta_clicked"
  | "alert_modal_opened"
  | "alert_created"
  | "alert_updated"
  | "alert_deleted"
  | "alert_failed";

interface EventParams {
  product_id: number;
  product_name: string;
  store: string;
  [key: string]: string | number | undefined;
}

// ── Dedup guard (click events) ────────────────────────────────────────────────
// Prevents double-fire from:
//   - React event bubbling (Link wrapping a Button)
//   - Mobile double-tap
//   - Rapid repeated clicks
// 500 ms cooldown per unique key.

const _recentClicks = new Map<string, number>();
const CLICK_COOLDOWN_MS = 500;

function _isDuplicateClick(key: string): boolean {
  const now = Date.now();
  const last = _recentClicks.get(key);
  if (last !== undefined && now - last < CLICK_COOLDOWN_MS) return true;
  _recentClicks.set(key, now);
  // Prevent unbounded growth
  if (_recentClicks.size > 100) {
    const [oldest] = [..._recentClicks.entries()].sort((a, b) => a[1] - b[1]);
    _recentClicks.delete(oldest[0]);
  }
  return false;
}

// ── Session view guard ────────────────────────────────────────────────────────
// view_item_card and view_item_details fire at most once per product per session.
// Also protects against React StrictMode double-invoking effects in development.

function _hasSeenInSession(key: string): boolean {
  try {
    return sessionStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function _markSeenInSession(key: string): void {
  try {
    sessionStorage.setItem(key, "1");
  } catch {
    // sessionStorage blocked (private mode, etc.) — degrade gracefully
  }
}

// ── GA4 ───────────────────────────────────────────────────────────────────────

function _ga4(event: AnalyticsEventName, params: EventParams): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", event, params);
}

// ── Internal backend ──────────────────────────────────────────────────────────
// Feeds the admin panel. Only PRODUCT_VIEW and COMPARE_CLICK are needed here;
// buy-click counts come automatically from the backend /buy redirect endpoint.

type InternalEvent = "PRODUCT_VIEW" | "COMPARE_CLICK" | "SEARCH";

const _API = process.env.NEXT_PUBLIC_API_URL ?? "";

function _internal(eventType: InternalEvent, productId: number, store: string): void {
  if (!_API) return;
  fetch(`${_API}/api/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventType, productId, store }),
    keepalive: true,
  }).catch(() => {});
}

// ── Dev logger ────────────────────────────────────────────────────────────────

function _log(event: string, params: Record<string, unknown>): void {
  if (process.env.NODE_ENV === "development") {
    console.debug(`[analytics] ${event}`, params);
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export const analytics = {
  /**
   * Product card entered the viewport.
   * Call from an IntersectionObserver — never on render or hover.
   * Fires at most once per product per session.
   */
  viewItemCard(productId: number, productName: string, store: string): void {
    const key = `seen_card:${productId}`;
    if (_hasSeenInSession(key)) return;
    _markSeenInSession(key);
    const p: EventParams = { product_id: productId, product_name: productName, store };
    _ga4("view_item_card", p);
    _log("view_item_card", p);
  },

  /**
   * Product detail page opened.
   * Call from a useEffect — fires once per product per session.
   * SessionStorage guard makes it safe against StrictMode double-mount.
   */
  viewItemDetails(productId: number, productName: string, store: string): void {
    const key = `seen_detail:${productId}`;
    if (_hasSeenInSession(key)) return;
    _markSeenInSession(key);
    const p: EventParams = { product_id: productId, product_name: productName, store };
    _ga4("view_item_details", p);
    _internal("PRODUCT_VIEW", productId, store);
    _log("view_item_details", p);
  },

  /**
   * Kupi clicked on the product detail page.
   * NOTE: The backend /buy redirect endpoint independently records a ClickEvent
   * for the admin panel, so we only send to GA4 here — no /api/track call needed.
   *
   * PREVIOUS BUG: some Kupi buttons fired both trackEvent({ CLICK_OUT }) AND
   * navigated to /buy, causing every click to be double-counted in tracking_events.
   */
  clickBuyDetails(productId: number, productName: string, store: string): void {
    const key = `click_buy:${productId}`;
    if (_isDuplicateClick(key)) return;
    const p: EventParams = { product_id: productId, product_name: productName, store };
    _ga4("click_buy_details", p);
    track("click_buy_details", { product_id: productId, product_name: productName, store });
    _log("click_buy_details", p);
  },

  /**
   * Kupi clicked from WishlistDrawer or Compare page.
   * Same rule: /buy backend handles internal counting; GA4 gets the signal here.
   */
  outboundClick(productId: number, productName: string, store: string): void {
    const key = `outbound:${productId}`;
    if (_isDuplicateClick(key)) return;
    const p: EventParams = { product_id: productId, product_name: productName, store };
    _ga4("outbound_click", p);
    track("outbound_click", { product_id: productId, product_name: productName, store });
    _log("outbound_click", p);
  },

  /**
   * User performed a search (submitted or selected a suggestion).
   */
  search(query: string, productId?: number, store?: string): void {
    const key = `search:${query}`;
    if (_isDuplicateClick(key)) return;
    const p = { search_term: query, product_id: productId, product_name: query, store: store ?? "" };
    _ga4("search", p as EventParams);
    track("search", { search_term: query });
    _internal("SEARCH", productId ?? 0, store ?? "");
    _log("search", p);
  },

  /**
   * User added product to the compare tray.
   */
  compareClick(productId: number, productName: string, store: string): void {
    const key = `compare:${productId}`;
    if (_isDuplicateClick(key)) return;
    const p: EventParams = { product_id: productId, product_name: productName, store };
    _ga4("compare_click", p);
    _internal("COMPARE_CLICK", productId, store);
    _log("compare_click", p);
  },

  alertCtaClicked(productId: number, productName: string, location: "card" | "product_page" | "wishlist"): void {
    const key = `alert_cta:${productId}:${location}`;
    if (_isDuplicateClick(key)) return;
    const p: EventParams = { product_id: productId, product_name: productName, store: location };
    _ga4("alert_cta_clicked", p);
    _log("alert_cta_clicked", { ...p, location });
  },

  alertModalOpened(productId: number, productName: string): void {
    const p: EventParams = { product_id: productId, product_name: productName, store: "" };
    _ga4("alert_modal_opened", p);
    _log("alert_modal_opened", p);
  },

  alertCreated(productId: number, productName: string, hasTargetPrice: boolean, timeToCreateMs?: number): void {
    const key = `alert_created:${productId}`;
    if (_isDuplicateClick(key)) return;
    const p: EventParams = {
      product_id: productId,
      product_name: productName,
      store: "",
      has_target_price: hasTargetPrice ? 1 : 0,
      ...(timeToCreateMs !== undefined && { time_to_create_ms: Math.round(timeToCreateMs) }),
    };
    _ga4("alert_created", p);
    track("alert_created", { product_id: productId, product_name: productName, has_target_price: hasTargetPrice ? 1 : 0 });
    _log("alert_created", p);
  },

  alertUpdated(productId: number): void {
    const p: EventParams = { product_id: productId, product_name: "", store: "" };
    _ga4("alert_updated", p);
    _log("alert_updated", p);
  },

  alertDeleted(productId: number): void {
    const p: EventParams = { product_id: productId, product_name: "", store: "" };
    _ga4("alert_deleted", p);
    _log("alert_deleted", p);
  },

  alertFailed(productId: number, productName: string, reason: string): void {
    const p: EventParams = { product_id: productId, product_name: productName, store: reason };
    _ga4("alert_failed", p);
    _log("alert_failed", { ...p, reason });
  },
};
