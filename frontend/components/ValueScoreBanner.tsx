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

          {/* Badge + naslov */}
          <div className="flex items-center gap-3 mb-2">
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white shadow-md shrink-0"
              style={{ backgroundColor: "#86efac" }}
            >
              <span className="text-xs leading-none">⚡</span>
              <span className="text-sm font-black tabular-nums leading-none text-white">8.4</span>
              <span className="text-[10px] font-semibold tracking-wide opacity-90 leading-none text-white">
                Izuzetna
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-700">
              Šta predstavlja ova ocena?
            </p>
          </div>

          {/* Opis */}
          <p className="text-sm text-slate-500 mb-3">
            Objektivna i sveobuhvatna ocena proteina, na skali od 1 do 10. Ovih 5 faktora formira ocenu:
          </p>

          {/* Faktori */}
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
