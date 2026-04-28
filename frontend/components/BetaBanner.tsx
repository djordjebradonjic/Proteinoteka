"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

const STORAGE_KEY = "beta-banner-dismissed";

export default function BetaBanner() {
  // Start visible so the banner is in SSR HTML — no pop-in CLS for new users.
  // Returning visitors (who dismissed) get an immediate hide on mount instead.
  const [visible, setVisible] = useState(true);
  const [hiding, setHiding] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) setVisible(false);
  }, []);

  const dismiss = () => {
    setHiding(true);
    setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, "1");
      setVisible(false);
      setHiding(false);
    }, 300);
  };

  if (!visible) return null;

  return (
    <div
      className="relative w-full flex items-center justify-center px-4 transition-opacity duration-300"
      style={{
        backgroundColor: "#FFF3DC",
        minHeight: "36px",
        opacity: hiding ? 0 : 1,
      }}
    >
      <p className="text-xs sm:text-sm text-center text-amber-900 font-medium leading-tight py-2">
        🚀 Proteinoteka je u beta fazi — već sada možeš pronaći najjeftinije cene.
      </p>
      <button
        onClick={dismiss}
        aria-label="Zatvori obaveštenje"
        className="absolute right-3 p-1 rounded text-amber-700 hover:text-amber-900 hover:bg-amber-100 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
