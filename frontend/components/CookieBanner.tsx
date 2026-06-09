"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("cookie_consent")) {
      setVisible(true);
    }

    const handleOpen = () => {
      localStorage.removeItem("cookie_consent");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (typeof window !== "undefined" && (window as any).gtag) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).gtag("consent", "update", {
          analytics_storage: "denied",
          ad_storage: "denied",
          ad_user_data: "denied",
          ad_personalization: "denied",
        });
      }
      setVisible(true);
    };

    window.addEventListener("cookie-settings", handleOpen);
    return () => window.removeEventListener("cookie-settings", handleOpen);
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie_consent", "accepted");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof window !== "undefined" && (window as any).gtag) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).gtag("consent", "update", {
        analytics_storage: "granted",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      });
    }
    setVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem("cookie_consent", "rejected");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Saglasnost za kolačiće"
        className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl p-6"
      >
        <div className="flex items-start gap-3 mb-5">
          <span className="text-2xl leading-none mt-0.5">🍪</span>
          <div>
            <h2 className="text-gray-900 font-bold text-base mb-1">
              Koristimo kolačiće
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Koristimo anonimnu analitiku poseta (Google Analytics) kako bismo
              poboljšali korisničko iskustvo. Ne pratimo lične podatke.{" "}
              <Link
                href="/privacy-policy"
                className="text-[#e07b00] hover:underline font-medium"
              >
                Politika privatnosti
              </Link>
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleReject}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Odbij sve
          </button>
          <button
            onClick={handleAccept}
            className="flex-1 px-4 py-2.5 text-sm font-bold bg-[#FF9900] hover:bg-[#e68a00] text-[#131921] rounded-xl transition-colors cursor-pointer"
          >
            Prihvati sve
          </button>
        </div>
      </div>
    </div>
  );
}
