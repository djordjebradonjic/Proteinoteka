"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

const STORAGE_KEY = "vs_banner_dismissed";

const pillars = [
  { icon: "💰", label: "Vrednost/cena", weight: "35%" },
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
    <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Šta je Value Score?
          </p>
          <p className="text-sm text-slate-600 mb-3">
            Algoritamska ocena <span className="font-semibold text-slate-800">1–10</span> koja meri koliko je protein objektivan izbor za tvoj novac. Računa se iz 5 faktora:
          </p>
          <div className="flex flex-wrap gap-2">
            {pillars.map((p) => (
              <div
                key={p.label}
                className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1"
              >
                <span className="text-sm">{p.icon}</span>
                <span className="text-xs text-slate-700 font-medium">{p.label}</span>
                <span className="text-xs text-slate-400">{p.weight}</span>
              </div>
            ))}
          </div>
        </div>
        <button
          onClick={dismiss}
          aria-label="Zatvori"
          className="shrink-0 mt-0.5 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
