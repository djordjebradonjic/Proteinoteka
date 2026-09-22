"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Percent, BarChart2, Store } from "lucide-react";
import { navigateTo } from "@/lib/navigation";
import SearchAutocomplete from "@/components/SearchAutocomplete";
import { CREATINE_COPY, CREATINE_PATH } from "@/lib/creatine";

// Same decorative chrome as the protein HeroSection (animated dots, gradient, feature badges), but trimmed for
// creatine: copy comes from CREATINE_COPY (not the "hero" i18n namespace, which is protein-copy-coupled), and
// there are no category pills — CreatineListing already has a URL-synced form-tab picker right below, so a
// second, unsynced filter control here would just disagree with it.

const COPY = CREATINE_COPY;

const DOTS = [
  { x: 7,  y: 15, s: 2, dur: 8,  del: 0.0 },
  { x: 18, y: 60, s: 3, dur: 10, del: 1.3 },
  { x: 30, y: 30, s: 2, dur: 7,  del: 0.5 },
  { x: 45, y: 75, s: 3, dur: 9,  del: 2.2 },
  { x: 60, y: 20, s: 2, dur: 11, del: 0.9 },
  { x: 72, y: 50, s: 3, dur: 7,  del: 1.7 },
  { x: 85, y: 35, s: 2, dur: 9,  del: 0.3 },
  { x: 12, y: 82, s: 3, dur: 12, del: 3.1 },
  { x: 90, y: 70, s: 2, dur: 8,  del: 1.0 },
  { x: 52, y: 88, s: 2, dur: 10, del: 2.6 },
  { x: 4,  y: 48, s: 3, dur: 7,  del: 0.7 },
  { x: 80, y: 12, s: 2, dur: 9,  del: 1.9 },
];

const BADGE_ICONS = [Percent, BarChart2, Store] as const;
const BADGE_DELAYS = [0.35, 0.45, 0.55] as const;

export default function CreatineHeroSection() {
  const [visible, setVisible] = useState(false);
  const [localSearch, setLocalSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const syncSearch = () => {
      const q = new URLSearchParams(window.location.search).get("query") ?? "";
      setLocalSearch(q);
    };
    syncSearch();
    window.addEventListener("app:urlchange", syncSearch);
    window.addEventListener("popstate", syncSearch);
    return () => {
      window.removeEventListener("app:urlchange", syncSearch);
      window.removeEventListener("popstate", syncSearch);
    };
  }, []);

  const handleSearch = (v: string) => {
    setLocalSearch(v);
    const params = new URLSearchParams(window.location.search);
    if (v) params.set("query", v); else params.delete("query");
    params.delete("page");
    navigateTo(`${window.location.pathname}?${params.toString()}`);
  };

  return (
    <section id="hero-section" className="relative" aria-label="Hero sekcija" style={{ background: "#131921" }}>
      <style>{`
        @keyframes creatineHeroFloat {
          0%   { transform: translateY(0px)   scale(1);   opacity: 0.2;  }
          100% { transform: translateY(-16px) scale(1.4); opacity: 0.55; }
        }
        @keyframes creatineHeroPulse {
          0%, 100% { opacity: 0.07; }
          50%      { opacity: 0.14; }
        }
        @keyframes creatineHeroIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes creatineHeroSearch {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        @keyframes creatineHeroBadge {
          from { opacity: 0; transform: translateY(10px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>

      {/* Animated background */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden" aria-hidden="true">
        {DOTS.map((d, i) => (
          <span
            key={i}
            style={{
              position: "absolute",
              left: `${d.x}%`,
              top: `${d.y}%`,
              width: d.s,
              height: d.s,
              borderRadius: "50%",
              background: "#FF9900",
              animation: `creatineHeroFloat ${d.dur}s ease-in-out ${d.del}s infinite alternate`,
            }}
          />
        ))}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "min(800px, 100%)",
            height: "480px",
            background: "radial-gradient(ellipse at 50% 30%, rgba(255,153,0,0.09) 0%, transparent 65%)",
            animation: "creatineHeroPulse 6s ease-in-out infinite",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 pt-8 sm:pt-16 pb-0 text-center">

        <nav
          className="flex items-center justify-center gap-1.5 text-xs text-white/50 mb-4"
          aria-label="Breadcrumb"
          style={visible ? { animation: "creatineHeroIn 0.4s cubic-bezier(0.16,1,0.3,1) both" } : { opacity: 0 }}
        >
          <Link href="/" className="hover:text-[#FF9900] transition-colors">{COPY.breadcrumbHome}</Link>
          <span>/</span>
          <span className="text-white/80">{COPY.navLabel}</span>
        </nav>

        <p
          className="text-xs sm:text-sm font-semibold uppercase tracking-widest mb-3 sm:mb-4"
          style={visible ? { color: "#FF9900", animation: "creatineHeroIn 0.4s cubic-bezier(0.16,1,0.3,1) 0.05s both" } : { opacity: 0, color: "#FF9900" }}
        >
          {COPY.page.eyebrow}
        </p>

        <h1
          className="text-[1.5rem] sm:text-3xl md:text-4xl font-extrabold text-white leading-[1.15] tracking-tight mb-3 sm:mb-4"
          style={visible ? { animation: "creatineHeroIn 0.5s cubic-bezier(0.16,1,0.3,1) 0.1s both" } : { opacity: 0 }}
        >
          {COPY.page.h1}
        </h1>

        <p
          className="text-sm sm:text-base text-white/70 leading-relaxed mb-6"
          style={visible ? { animation: "creatineHeroIn 0.5s cubic-bezier(0.16,1,0.3,1) 0.15s both" } : { opacity: 0 }}
        >
          {COPY.page.lead}
        </p>

        {/* Search bar */}
        <div
          className="flex mb-2 relative"
          style={visible ? { animation: "creatineHeroSearch 0.5s cubic-bezier(0.16,1,0.3,1) 0.2s both", zIndex: 50 } : { opacity: 0, zIndex: 50 }}
        >
          <SearchAutocomplete
            value={localSearch}
            onChange={handleSearch}
            productType="creatine"
            placeholder={COPY.listing.search}
            seeAllPath={CREATINE_PATH}
            gridId="creatine-list"
          />
        </div>

        {/* Feature badges — from the same 3 chips as the old static banner */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6 sm:mb-8 w-full max-w-xl mx-auto mt-6 sm:mt-7">
          {COPY.page.chips.map((chip, i) => {
            const Icon = BADGE_ICONS[i] ?? Store;
            return (
              <div
                key={chip}
                className="flex flex-col items-center gap-2 py-4 sm:py-5 px-2 sm:px-3 rounded-xl"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.09)",
                  ...(visible ? { animation: `creatineHeroBadge 0.45s cubic-bezier(0.16,1,0.3,1) ${BADGE_DELAYS[i] ?? 0.5}s both` } : { opacity: 0 }),
                }}
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,153,0,0.15)" }}>
                  <Icon className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-[#FF9900]" strokeWidth={2} />
                </div>
                <span className="text-xs sm:text-sm font-extrabold text-white text-center leading-snug">{chip}</span>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="flex justify-center mb-6" style={visible ? { animation: "creatineHeroBadge 0.45s cubic-bezier(0.16,1,0.3,1) 0.65s both" } : { opacity: 0 }}>
          <a
            href="#izdvojeno-kreatin"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-base sm:text-lg font-extrabold transition-all duration-150"
            style={{ background: "#FF9900", color: "#131921", boxShadow: "0 0 28px rgba(255,153,0,0.45), 0 4px 16px rgba(0,0,0,0.3)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#ffad33";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 0 40px rgba(255,153,0,0.6), 0 4px 20px rgba(0,0,0,0.3)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#FF9900";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 0 28px rgba(255,153,0,0.45), 0 4px 16px rgba(0,0,0,0.3)";
            }}
          >
            {COPY.hero.cta}
          </a>
        </div>
      </div>

      {/* Gradient fade into content below */}
      <div
        className="h-16 sm:h-24 mt-4 sm:mt-6"
        aria-hidden="true"
        style={{ background: "linear-gradient(180deg, #131921 0%, rgba(19,25,33,0.55) 55%, #f8fafc 100%)" }}
      />
    </section>
  );
}
