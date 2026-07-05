export function hasAnalyticsConsent(): boolean {
  return typeof window !== "undefined" && localStorage.getItem("cookie_consent") === "accepted";
}
