// Centralized client-side URL update.
// Uses replaceState (no Next.js navigation → no reload, no scroll-to-top),
// then broadcasts "app:urlchange" so all listeners can re-sync.
export function navigateTo(url: string): void {
  if (typeof window === "undefined") return;
  window.history.replaceState(null, "", url);
  window.dispatchEvent(new Event("app:urlchange"));
}
