"use client";

import { usePathname } from "next/navigation";
import { useNewsletterTrigger } from "@/lib/useNewsletterTrigger";
import NewsletterModal from "@/components/NewsletterModal";

// Only prompt on pages where the visitor is actively browsing deals —
// home/listing and category pages — not on every product detail page.
function isEligiblePath(pathname: string): boolean {
  if (pathname === "/") return true;
  if (pathname.startsWith("/kategorija")) return true;
  return false;
}

export default function NewsletterPrompt() {
  const pathname = usePathname();
  const enabled = isEligiblePath(pathname);
  const { reason, dismiss, markSubscribed } = useNewsletterTrigger(enabled);

  if (!reason) return null;

  return (
    <NewsletterModal
      source={reason}
      onClose={dismiss}
      onSubscribed={markSubscribed}
    />
  );
}
