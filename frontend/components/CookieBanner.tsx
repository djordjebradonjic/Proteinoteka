"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const root = document.documentElement;
    if (visible && bannerRef.current) {
      const update = () => {
        const h = bannerRef.current?.offsetHeight ?? 0;
        root.style.setProperty("--cookie-h", `${h}px`);
      };
      update();
      const ro = new ResizeObserver(update);
      ro.observe(bannerRef.current);
      return () => ro.disconnect();
    } else {
      root.style.removeProperty("--cookie-h");
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      ref={bannerRef}
      role="dialog"
      aria-modal="true"
      aria-label="Saglasnost za kolačiće"
      className="fixed bottom-0 left-0 right-0 z-50"
    >
      {/* Card floating above bottom edge */}
      <div className="mx-3 mb-3 sm:mx-6 sm:mb-4 md:mx-auto md:max-w-3xl bg-white rounded-2xl shadow-[0_-2px_24px_rgba(0,0,0,0.12),0_4px_24px_rgba(0,0,0,0.12)] px-5 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Text */}
          <div className="flex items-start sm:items-center gap-2.5 flex-1 min-w-0">
            <span className="text-xl shrink-0">🍪</span>
            <p className="text-sm text-gray-700 leading-relaxed">
              Pomozi nam da poboljšamo sajt — koristimo samo anonimnu statistiku
              poseta.{" "}
              <Link
                href="/privacy-policy"
                className="text-[#e07b00] hover:underline font-medium whitespace-nowrap"
              >
                Saznaj više
              </Link>
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 shrink-0 sm:pl-2">
            <button
              onClick={handleReject}
              className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              Odbij
            </button>
            <button
              onClick={handleAccept}
              className="flex-1 sm:flex-none px-5 py-2 text-sm font-bold bg-[#FF9900] hover:bg-[#e68a00] text-[#131921] rounded-xl transition-colors cursor-pointer shadow-sm"
            >
              Prihvati
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
