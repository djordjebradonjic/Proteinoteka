"use client";

import { useEffect, useState } from "react";

const DISMISS_KEY = "newsletter_prompt_dismissed_at";
const SUBSCRIBED_KEY = "newsletter_subscribed";
const DISMISS_COOLDOWN_MS = 60 * 24 * 60 * 60 * 1000; // 60 days
const SCROLL_THRESHOLD = 0.5;
const TIME_THRESHOLD_MS = 25_000;

export type NewsletterTriggerReason = "modal_scroll" | "modal_exit_intent";

function isSuppressed(): boolean {
  try {
    if (localStorage.getItem(SUBSCRIBED_KEY) === "1") return true;
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt && Date.now() - parseInt(dismissedAt, 10) < DISMISS_COOLDOWN_MS) return true;
  } catch {
    // localStorage unavailable — fail open (don't suppress) but don't crash
  }
  return false;
}

/**
 * Fires at most once per session, on the first of: 50% scroll depth,
 * 25s on page, or exit-intent (desktop only). Respects a 14-day dismiss
 * cooldown and never re-fires once the visitor has subscribed.
 */
export function useNewsletterTrigger(enabled: boolean): {
  reason: NewsletterTriggerReason | null;
  dismiss: () => void;
  markSubscribed: () => void;
} {
  const [reason, setReason] = useState<NewsletterTriggerReason | null>(null);

  useEffect(() => {
    if (!enabled || isSuppressed()) return;

    let fired = false;
    const fire = (r: NewsletterTriggerReason) => {
      if (fired) return;
      fired = true;
      setReason(r);
    };

    const onScroll = () => {
      const scrolled = window.scrollY + window.innerHeight;
      const total = document.documentElement.scrollHeight;
      if (total > 0 && scrolled / total >= SCROLL_THRESHOLD) {
        fire("modal_scroll");
      }
    };

    const timer = setTimeout(() => fire("modal_scroll"), TIME_THRESHOLD_MS);

    const isDesktop = window.matchMedia("(pointer: fine)").matches;
    const onMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) fire("modal_exit_intent");
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    if (isDesktop) {
      document.addEventListener("mouseleave", onMouseLeave);
    }

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
      if (isDesktop) {
        document.removeEventListener("mouseleave", onMouseLeave);
      }
    };
  }, [enabled]);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // ignore
    }
    setReason(null);
  };

  const markSubscribed = () => {
    try {
      localStorage.setItem(SUBSCRIBED_KEY, "1");
    } catch {
      // ignore
    }
    setReason(null);
  };

  return { reason, dismiss, markSubscribed };
}
