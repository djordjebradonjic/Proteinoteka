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
    <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">

      {/* Gornji red: badge + naslov + X */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-full text-white shadow-md shrink-0"
          style={{ backgroundColor: "#4ade80" }}
        >
          <span className="text-base leading-none">⚡</span>
          <span className="text-lg font-black tabular-nums leading-none">8.4</span>
          <span className="text-sm font-semibold tracking-wide opacity-95 leading-none">
            Izuzetna
          </span>
        </div>
        <p className="flex-1 text-base font-semibold text-slate-700 leading-snug">
          Šta predstavlja ova ocena?
        </p>
        <button
          onClick={dismiss}
          aria-label="Zatvori"
          className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Opis */}
      <p className="text-sm text-slate-500 mb-3">
        Objektivna i sveobuhvatna ocena proteina, na skali od 1 do 10. Ovih 5 faktora formira ocenu:
      </p>

      {/* Faktori — 2 kolone na mobilnom, red na desktopu */}
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        {pillars.map((p) => (
          <div
            key={p.label}
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5"
          >
            <span className="text-base">{p.icon}</span>
            <span className="text-sm text-slate-700 font-medium">{p.label}</span>
            <span className="text-sm text-slate-400 ml-auto sm:ml-0">{p.weight}</span>
          </div>
        ))}
      </div>

    </div>
  );
}
