"use client";

import { useState } from "react";
import Link from "next/link";
import { X, ChevronUp, BookOpen } from "lucide-react";

const GUIDES = [
  {
    slug: "najbolji-protein-za-pocetnike",
    title: "Najbolji protein za početnike — top izbori i cene",
    readMin: 6,
  },
  {
    slug: "whey-protein-za-pocetnike",
    title: "Whey protein za početnike — šta, koliko i odakle?",
    readMin: 7,
  },
  {
    slug: "protein-za-mrsavljenje",
    title: "Protein za mršavljenje — koji tip pomaže i koliko košta",
    readMin: 8,
  },
  {
    slug: "koliko-proteina-dnevno",
    title: "Koliko proteina dnevno treba uzimati?",
    readMin: 4,
  },
  {
    slug: "whey-isolate-vs-concentrate",
    title: "Whey Isolate vs Concentrate — koja je razlika?",
    readMin: 4,
  },
  {
    slug: "scitec-nutrition-whey",
    title: "Scitec Nutrition 100% Whey Protein — sastav, pakovanja i cene",
    readMin: 6,
  },
  {
    slug: "biotechusa-100-pure-whey",
    title: "BioTech USA 100% Pure Whey i ISO Whey Zero — recenzija",
    readMin: 6,
  },
  {
    slug: "gold-standard-whey-recenzija",
    title: "Gold Standard 100% Whey — sastav, pakovanja i cene",
    readMin: 6,
  },
  {
    slug: "protein-za-zene",
    title: "Protein za žene — mitovi i istine",
    readMin: 7,
  },
  {
    slug: "da-li-protein-goji",
    title: "Da li protein goji?",
    readMin: 4,
  },
  {
    slug: "kada-piti-protein",
    title: "Kada piti protein — pre ili posle treninga?",
    readMin: 4,
  },
  {
    slug: "koliko-novca-mesecno-za-proteine",
    title: "Koliko novca mesečno treba za proteine u Srbiji?",
    readMin: 5,
  },
];

interface Props {
  currentSlug: string;
}

export default function VodiciNav({ currentSlug }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Spacer so fixed bar doesn't hide last content */}
      <div className="h-20" aria-hidden="true" />

      {/* Fixed bottom bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 border-t border-slate-200 bg-white/90 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <BookOpen className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-sm text-slate-500 truncate hidden sm:block">
              Istražite sve vodiče o proteinima
            </span>
            <span className="text-sm text-slate-500 sm:hidden">Vodiči</span>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#1B2B4B] hover:bg-[#243860] text-white text-sm font-semibold rounded-full transition-colors shrink-0"
          >
            Svi vodiči
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Backdrop + bottom drawer */}
      {open && (
        <>
          <style>{`
            @keyframes slideUp {
              from { transform: translateY(100%); }
              to   { transform: translateY(0); }
            }
          `}</style>

          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />

          <div
            className="fixed bottom-0 inset-x-0 z-50 bg-white rounded-t-2xl shadow-2xl max-h-[75vh] flex flex-col"
            style={{ animation: "slideUp 0.25s cubic-bezier(0.16,1,0.3,1)" }}
          >
            {/* Drag handle */}
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mt-3 shrink-0" />

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100 shrink-0">
              <h2 className="font-bold text-slate-900 text-base">Svi vodiči</h2>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
                aria-label="Zatvori"
              >
                <X className="w-4 h-4 text-slate-600" />
              </button>
            </div>

            {/* Guide list */}
            <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
              {GUIDES.map((g) => {
                const isCurrent = g.slug === currentSlug;
                return (
                  <Link
                    key={g.slug}
                    href={`/vodici/${g.slug}`}
                    onClick={() => setOpen(false)}
                    className={`flex items-center justify-between px-5 py-4 transition-colors ${
                      isCurrent
                        ? "bg-[#FFF8EC]"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="min-w-0 flex items-center gap-3">
                      {isCurrent && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF9900] shrink-0" />
                      )}
                      <span
                        className={`text-sm font-medium leading-snug ${
                          isCurrent ? "text-[#b36b00]" : "text-slate-800"
                        }`}
                      >
                        {g.title}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 shrink-0 ml-4">
                      {g.readMin} min
                    </span>
                  </Link>
                );
              })}

              {/* Link to full guides index */}
              <Link
                href="/vodici"
                onClick={() => setOpen(false)}
                className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
              >
                <span className="text-sm font-medium text-[#FF9900]">
                  Sve kategorije vodiča →
                </span>
              </Link>
            </div>
          </div>
        </>
      )}
    </>
  );
}
