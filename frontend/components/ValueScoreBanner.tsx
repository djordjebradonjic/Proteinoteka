"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { CURRENT_MARKET } from "@/lib/marketConfig";

const IS_HR = CURRENT_MARKET === "hr";

const STORAGE_KEY = "vs_banner_dismissed";

const pillars = [
  { icon: "💰", label: IS_HR ? "Vrijednost/cijena" : "Vrednost/cena", weight: "35%" },
  { icon: "🧬", label: "Čistoća proteina", weight: "20%" },
  { icon: "⚡", label: "Digestibilnost", weight: "15%" },
  { icon: "🌿", label: "Sastojci", weight: "15%" },
  { icon: "🏅", label: "Brend", weight: "15%" },
];

export default function ValueScoreBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="relative mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 pt-4 pb-3 pr-9">

      {/* X — apsolutno gore-desno */}
      <button
        onClick={dismiss}
        aria-label="Zatvori"
        className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Badge + naslov */}
      <div className="flex items-center gap-2.5 mb-2">
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white shadow-sm shrink-0"
          style={{ backgroundColor: "#22c55e" }}
        >
          <span className="text-sm leading-none">⚡</span>
          <span className="text-base font-black tabular-nums leading-none">8.4</span>
          <span className="text-xs font-semibold opacity-95 leading-none">Odličan</span>
        </div>
        <p className="text-sm font-semibold text-slate-700 leading-snug">
          {IS_HR ? "Što predstavlja ova ocjena?" : "Šta predstavlja ova ocena?"}
        </p>
      </div>

      {/* Opis */}
      <p className="text-xs text-slate-500 mb-2">
        {IS_HR
          ? "Objektivna ocjena proteina 1–10. Ovih 5 faktora formira ocjenu:"
          : "Objektivna ocena proteina 1–10. Ovih 5 faktora formira ocenu:"}
      </p>

      {/* Faktori — vertikalni kompaktni list na mobilnom, flex red na sm+ */}
      <div className="flex flex-col gap-0.5 sm:flex-row sm:flex-wrap sm:gap-2">
        {pillars.map((p) => (
          <div
            key={p.label}
            className="flex items-center gap-2 py-1 sm:rounded-full sm:border sm:border-slate-200 sm:bg-white sm:px-3 sm:py-1.5"
          >
            <span className="text-sm w-5 shrink-0">{p.icon}</span>
            <span className="text-sm text-slate-700 font-medium">{p.label}</span>
            <span className="text-xs text-slate-400 ml-auto sm:ml-0">{p.weight}</span>
          </div>
        ))}
      </div>

    </div>
  );
}
