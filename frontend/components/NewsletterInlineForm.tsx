"use client";

import { useState } from "react";
import { Loader2, Check, Mail } from "lucide-react";
import { CURRENT_MARKET } from "@/lib/marketConfig";

const IS_HR = CURRENT_MARKET === "hr";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type NewsletterSource =
  | "footer"
  | "modal_scroll"
  | "modal_exit_intent"
  | "inline_banner"
  | "alert_crosssell"
  | "landing_page"
  | "kontakt_page";

type Status = "idle" | "loading" | "success" | "error";

interface Props {
  source: NewsletterSource;
  /** "dark" for footer (dark background), "light" for everywhere else */
  variant?: "dark" | "light";
  className?: string;
  /** Overrides the default "Prijavi se" button label */
  ctaLabel?: string;
}

export default function NewsletterInlineForm({ source, variant = "light", className = "", ctaLabel }: Props) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  const isDark = variant === "dark";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email)) {
      setError(IS_HR ? "Unesi ispravan email." : "Unesi ispravan email.");
      setStatus("error");
      return;
    }
    if (!consent) {
      setError(IS_HR ? "Potrebna je saglasnost za primanje newslettera." : "Potrebna je saglasnost za primanje newslettera.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setError("");

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim(), source }),
      });
      if (!res.ok) throw new Error("failed");
      setStatus("success");
      try {
        localStorage.setItem("newsletter_subscribed", "1");
      } catch {
        // ignore
      }
    } catch {
      setError(IS_HR ? "Trenutno ne možemo da te prijavimo. Pokušaj ponovo." : "Trenutno ne možemo da te prijavimo. Pokušaj ponovo.");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className={`flex items-center gap-2 text-sm font-medium ${isDark ? "text-emerald-400" : "text-emerald-600"} ${className}`}>
        <Check className="w-4 h-4 shrink-0" strokeWidth={2.5} />
        {IS_HR ? "Prijavljen si! Provjeri inbox." : "Prijavljen si! Proveri inbox."}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          inputMode="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (status === "error") setStatus("idle"); }}
          placeholder="tvoj@email.com"
          autoComplete="email"
          className={`flex-1 min-w-0 px-3 py-2.5 rounded-xl text-sm border-2 outline-none transition-colors ${
            isDark
              ? "bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-[#FF9900]"
              : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-[#FF9900]"
          }`}
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#FF9900] hover:bg-[#e68a00] disabled:opacity-60 text-[#131921] font-bold text-sm rounded-xl transition-colors shrink-0"
        >
          {status === "loading" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Mail className="w-4 h-4" />
              {ctaLabel ?? "Prijavi se"}
            </>
          )}
        </button>
      </div>

      <label className="flex items-start gap-2 mt-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => { setConsent(e.target.checked); if (status === "error") setStatus("idle"); }}
          className="mt-0.5 shrink-0"
        />
        <span className={`text-xs leading-snug ${isDark ? "text-white/50" : "text-slate-500"}`}>
          {IS_HR
            ? "Slažem se da primam newsletter s najvećim uštedama, 2x mjesečno. Odjava u jednom kliku."
            : "Slažem se da primam newsletter sa najvećim uštedama, 2x mesečno. Odjava u jednom kliku."}
        </span>
      </label>

      {status === "error" && error && (
        <p className="text-xs text-red-400 mt-1.5 font-medium">{error}</p>
      )}
    </form>
  );
}
