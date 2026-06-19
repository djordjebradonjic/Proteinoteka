"use client";

import { useEffect, useState } from "react";
import { Store, Zap, BarChart2 } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";
import { navigateTo } from "@/lib/navigation";
import SearchAutocomplete from "@/components/SearchAutocomplete";

interface HeroProps {
  selectedCategories?: string[];
  onCategoryToggle?: (val: string) => void;
}

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
  { x: 38, y: 55, s: 2, dur: 8,  del: 3.4 },
  { x: 65, y: 80, s: 3, dur: 11, del: 0.4 },
  { x: 25, y: 38, s: 2, dur: 7,  del: 2.9 },
  { x: 93, y: 55, s: 2, dur: 9,  del: 1.5 },
  { x: 55, y: 10, s: 3, dur: 13, del: 0.2 },
  { x: 42, y: 42, s: 2, dur: 8,  del: 2.0 },
];

const BADGES = [
  {
    icon: Zap,
    value: "Value Score",
    label: "Objektivna ocena 0–10 za svaki protein",
    delay: 0.35,
  },
  {
    icon: BarChart2,
    value: "RSD/g proteina",
    label: "Prava mera isplativosti, ne cena kutije",
    delay: 0.45,
  },
  {
    icon: Store,
    value: "9 prodavnica",
    label: "Isti protein, sve cene, jedan pregled",
    delay: 0.55,
  },
] as const;

function readUrlCategories(): string[] {
  if (typeof window === "undefined") return [];
  return (new URLSearchParams(window.location.search).get("category") ?? "")
    .split(",")
    .filter(Boolean);
}

export default function HeroSection({ selectedCategories: propCategories, onCategoryToggle }: HeroProps) {
  const [visible, setVisible]               = useState(false);
  const [urlCategories, setUrlCategories]   = useState<string[]>([]);
  const [localSearch, setLocalSearch]       = useState("");

  const selectedCategories = propCategories ?? urlCategories;

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const sync = () => setUrlCategories(readUrlCategories());
    sync();
    window.addEventListener("app:urlchange", sync);
    window.addEventListener("popstate",      sync);
    return () => {
      window.removeEventListener("app:urlchange", sync);
      window.removeEventListener("popstate",      sync);
    };
  }, []);

  useEffect(() => {
    const syncSearch = () => {
      const q = new URLSearchParams(window.location.search).get("query") ?? "";
      setLocalSearch(q);
    };
    syncSearch();
    window.addEventListener("app:urlchange", syncSearch);
    window.addEventListener("popstate",      syncSearch);
    return () => {
      window.removeEventListener("app:urlchange", syncSearch);
      window.removeEventListener("popstate",      syncSearch);
    };
  }, []);

  const handleSearch = (v: string) => {
    setLocalSearch(v);
    const params = new URLSearchParams(window.location.search);
    if (v) params.set("query", v); else params.delete("query");
    params.delete("page");
    navigateTo(`${window.location.pathname}?${params.toString()}`);
  };

  const handleCategoryClick = (value: string) => {
    if (onCategoryToggle) {
      onCategoryToggle(value);
    } else {
      const params = new URLSearchParams(window.location.search);
      const current = (params.get("category") ?? "").split(",").filter(Boolean);
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      if (next.length === 0) params.delete("category");
      else params.set("category", next.join(","));
      params.delete("page");
      navigateTo(`${window.location.pathname}?${params.toString()}`);
    }
    document.getElementById("product-grid")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="hero-section"
      className="relative overflow-hidden"
      aria-label="Hero sekcija"
      style={{ background: "#131921" }}
    >
      <style>{`
        @keyframes heroFloat {
          0%   { transform: translateY(0px)   scale(1);    opacity: 0.2;  }
          100% { transform: translateY(-16px) scale(1.4);  opacity: 0.55; }
        }
        @keyframes heroPulse {
          0%, 100% { opacity: 0.07; }
          50%       { opacity: 0.14; }
        }
        @keyframes heroIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes heroInSub {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes heroBadge {
          from { opacity: 0; transform: translateY(10px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        @keyframes heroSearch {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>

      {/* Animated background */}
      <div className="absolute inset-0 pointer-events-none select-none" aria-hidden="true">
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
              animation: `heroFloat ${d.dur}s ease-in-out ${d.del}s infinite alternate`,
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
            height: "520px",
            background:
              "radial-gradient(ellipse at 50% 30%, rgba(255,153,0,0.09) 0%, transparent 65%)",
            animation: "heroPulse 6s ease-in-out infinite",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 pt-10 sm:pt-20 pb-0 text-center">

        {/* Tagline — small, above search */}
        <p
          className="text-xs sm:text-sm font-semibold uppercase tracking-widest mb-3 sm:mb-4"
          style={
            visible
              ? { color: "#FF9900", animation: "heroIn 0.4s cubic-bezier(0.16,1,0.3,1) both" }
              : { opacity: 0, color: "#FF9900" }
          }
        >
          Cene. Ocene. Jedna stranica.
        </p>

        {/* H1 — reduced size, below tagline, above search */}
        <h1
          className="text-[1.6rem] sm:text-3xl md:text-4xl font-extrabold text-white leading-[1.15] tracking-tight mb-5 sm:mb-6"
          style={visible ? { animation: "heroIn 0.5s cubic-bezier(0.16,1,0.3,1) 0.07s both" } : { opacity: 0 }}
        >
          Pronađi najbolji{" "}
          <span
            style={{
              color: "#FF9900",
              textShadow: "0 0 28px rgba(255,153,0,0.4), 0 0 8px rgba(255,153,0,0.2)",
            }}
          >
            protein
          </span>
          {" "}u Srbiji.
        </h1>

        {/* Search bar — visible on all screen sizes */}
        <div
          className="flex mb-2"
          style={
            visible
              ? { animation: "heroSearch 0.5s cubic-bezier(0.16,1,0.3,1) 0.18s both" }
              : { opacity: 0 }
          }
        >
          <SearchAutocomplete value={localSearch} onChange={handleSearch} />
        </div>

        {/* Feature badges — bigger cards */}
        <div
          className="grid grid-cols-3 gap-2 sm:gap-3 mb-6 sm:mb-8 w-full max-w-xl mx-auto mt-6 sm:mt-7"
        >
          {BADGES.map(({ icon: Icon, value, label, delay }, i) => (
            <div
              key={value}
              className="flex flex-col items-center gap-2 py-4 sm:py-5 px-2 sm:px-3 rounded-xl"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.09)",
                ...(visible
                  ? { animation: `heroBadge 0.45s cubic-bezier(0.16,1,0.3,1) ${delay}s both` }
                  : { opacity: 0 }),
              }}
            >
              <div
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "rgba(255,153,0,0.15)" }}
              >
                <Icon className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-[#FF9900]" strokeWidth={2} />
              </div>
              <span className="text-xs sm:text-sm font-extrabold text-white text-center leading-snug">
                {value}
              </span>
              <span className="text-[9px] sm:text-[11px] text-slate-400 text-center leading-snug hidden sm:block">
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Category pills */}
        <nav
          className="flex flex-wrap justify-center gap-2 pb-1 mb-2"
          aria-label="Kategorije proteina"
        >
          {CATEGORIES.map((cat) => {
            const active = selectedCategories.includes(cat.value);
            return (
              <button
                key={cat.value}
                onClick={() => handleCategoryClick(cat.value)}
                aria-pressed={active}
                className="shrink-0 px-3.5 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-150 whitespace-nowrap"
                style={
                  active
                    ? {
                        background: "#FF9900",
                        color: "#131921",
                        border: "1px solid #FF9900",
                        boxShadow: "0 0 14px rgba(255,153,0,0.35)",
                      }
                    : {
                        background: "rgba(255,255,255,0.06)",
                        color: "#cbd5e1",
                        border: "1px solid rgba(255,255,255,0.12)",
                      }
                }
                onMouseEnter={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.12)";
                    (e.currentTarget as HTMLElement).style.color = "#fff";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.25)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
                    (e.currentTarget as HTMLElement).style.color = "#cbd5e1";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.12)";
                  }
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Gradient fade into content below */}
      <div
        className="h-16 sm:h-24 mt-8 sm:mt-10"
        aria-hidden="true"
        style={{
          background:
            "linear-gradient(180deg, #131921 0%, rgba(19,25,33,0.55) 55%, #f8fafc 100%)",
        }}
      />
    </section>
  );
}
