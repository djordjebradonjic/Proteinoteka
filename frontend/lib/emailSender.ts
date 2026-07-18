import { Market } from "@/lib/marketConfig";

// Only proteinoteka.rs has a Resend-verified sending domain today.
// Every outbound email — regardless of the recipient's market — must be sent
// from this domain, or Resend rejects it (no DKIM/SPF for proteinoteka.com.hr).
// Same pattern the contact form already uses (always sends from @proteinoteka.rs).
const VERIFIED_SENDING_DOMAIN = "proteinoteka.rs";

const DISPLAY_NAME: Record<Market, string> = {
  rs: "Proteinoteka",
  hr: "Proteinoteka Hrvatska",
};

export function newsletterFromAddress(market: Market): string {
  return `${DISPLAY_NAME[market]} <newsletter@${VERIFIED_SENDING_DOMAIN}>`;
}
