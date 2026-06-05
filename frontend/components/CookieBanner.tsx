"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("cookie_consent")) {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie_consent", "accepted");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof window !== "undefined" && (window as any).gtag) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).gtag("consent", "update", { analytics_storage: "granted" });
    }
    setVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem("cookie_consent", "rejected");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#131921] border-t border-white/10 shadow-2xl">
      <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-sm text-white/65 leading-relaxed flex-1">
          Koristimo kolačiće za anonimnu analitiku poseta (Google Analytics) kako bismo poboljšali korisničko iskustvo.{" "}
          <Link href="/privacy-policy" className="text-[#FF9900] hover:underline">
            Politika privatnosti
          </Link>
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleReject}
            className="px-4 py-2 text-sm text-white/60 border border-white/20 rounded-lg hover:border-white/40 transition-colors cursor-pointer"
          >
            Odbij
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 text-sm font-bold bg-[#FF9900] hover:bg-[#e68a00] text-[#131921] rounded-lg transition-colors cursor-pointer"
          >
            Prihvati
          </button>
        </div>
      </div>
    </div>
  );
}
