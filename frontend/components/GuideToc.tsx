"use client";

import { useState } from "react";
import { List, ChevronDown, ChevronUp } from "lucide-react";

export interface TocSection {
  id: string;
  title: string;
  level?: 2 | 3;
}

export default function GuideToc({ sections }: { sections: TocSection[] }) {
  const [open, setOpen] = useState(false);

  let h2n = 0;
  const items = sections.map((s) => {
    const isH3 = s.level === 3;
    if (!isH3) h2n++;
    return { ...s, n: isH3 ? null : h2n };
  });

  const h2Count = items.filter((s) => s.n !== null).length;

  return (
    <nav
      className="mb-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
      aria-label="Sadržaj članka"
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <List className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-sm font-bold text-slate-700">Sadržaj</span>
          <span className="text-xs text-slate-400 hidden sm:inline">
            ({h2Count} {h2Count === 1 ? "sekcija" : h2Count < 5 ? "sekcije" : "sekcija"})
          </span>
        </div>
        <span className="text-slate-400 sm:hidden">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      <div className={`border-t border-slate-100 px-5 pb-5 pt-3 sm:block ${open ? "block" : "hidden"}`}>
        <ol className="space-y-2">
          {items.map((s) => {
            const isH3 = s.level === 3;
            return (
              <li key={s.id} className={isH3 ? "ml-5" : ""}>
                <a
                  href={`#${s.id}`}
                  onClick={() => setOpen(false)}
                  className={
                    isH3
                      ? "text-[13px] text-slate-500 hover:text-slate-800 hover:underline leading-snug"
                      : "text-[14px] text-[#FF9900] hover:underline leading-snug"
                  }
                >
                  {s.n !== null && (
                    <span className="font-mono text-slate-400 text-xs mr-1.5">{s.n}.</span>
                  )}
                  {s.title}
                </a>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
