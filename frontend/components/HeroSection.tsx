"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, BarChart2, Package, Zap } from "lucide-react";
import SearchAutocomplete from "@/components/SearchAutocomplete";
import { CATEGORIES } from "@/lib/categories";

interface HeroProps {
  searchValue: string;
  onSearchChange: (val: string) => void;
  selectedCategory: string;
  onCategoryChange: (val: string) => void;
}

function useCounter(target: number, duration = 1400) {
  const [val, setVal] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    startRef.current = null;
    const step = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const p = Math.min((ts - startRef.current) / duration, 1);
      const eased = 1 - (1 - p) ** 3;
      setVal(Math.round(eased * target));
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return val;
}

// Deterministic dots — no Math.random() to avoid hydration mismatch
const DOTS = [
  { x: 8,  y: 12, size: 3, dur: 7,  del: 0   },
  { x: 22, y: 55, size: 2, dur: 9,  del: 1.2 },
  { x: 35, y: 28, size: 4, dur: 6,  del: 0.4 },
  { x: 48, y: 70, size: 2, dur: 11, del: 2.1 },
  { x: 61, y: 18, size: 3, dur: 8,  del: 0.8 },
  { x: 74, y: 45, size: 2, dur: 7,  del: 1.6 },
  { x: 88, y: 30, size: 4, dur: 10, del: 0.2 },
  { x: 15, y: 80, size: 2, dur: 9,  del: 3.0 },
  { x: 92, y: 72, size: 3, dur: 6,  del: 1.0 },
  { x: 55, y: 88, size: 2, dur: 8,  del: 2.5 },
  { x: 5,  y: 45, size: 3, dur: 12, del: 0.6 },
  { x: 82, y: 10, size: 2, dur: 7,  del: 1.8 },
  { x: 40, y: 60, size: 3, dur: 9,  del: 3.3 },
  { x: 68, y: 82, size: 2, dur: 8,  del: 0.3 },
  { x: 28, y: 35, size: 4, dur: 11, del: 2.8 },
  { x: 95, y: 52, size: 2, dur: 7,  del: 1.4 },
];

export default function HeroSection({
  searchValue,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
}: HeroProps) {
  const storeCount   = useCounter(6,   900);
  const productCount = useCounter(500, 1600);

  const scrollToGrid = () => {
    document.getElementById("product-grid")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative overflow-hidden" style={{ background: "#131921" }}>
      <style>{`
        @keyframes heroFloat {
          0%   { transform: translateY(0)    scale(1);    opacity: 0.25; }
          100% { transform: translateY(-18px) scale(1.5); opacity: 0.6;  }
        }
        @keyframes heroPulse {
          0%, 100% { opacity: 0.06; }
          50%       { opacity: 0.12; }
        }
      `}</style>

      {/* Floating dots */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {DOTS.map((d, i) => (
          <span
            key={i}
            style={{
              position: "absolute",
              left: `${d.x}%`,
              top: `${d.y}%`,
              width: d.size,
              height: d.size,
              borderRadius: "50%",
              background: "#FF9900",
              animation: `heroFloat ${d.dur}s ease-in-out ${d.del}s infinite alternate`,
            }}
          />
        ))}

        {/* Radial glow behind headline */}
        <div
          style={{
            position: "absolute",
            top: "10%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "700px",
            height: "400px",
            background:
              "radial-gradient(ellipse at center, rgba(255,153,0,0.10) 0%, transparent 70%)",
            animation: "heroPulse 5s ease-in-out infinite",
          }}
        />
      </div>

      {/* Main content */}
      <div className="relative max-w-4xl mx-auto px-4 pt-14 pb-0 text-center">

        {/* Live badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#FF9900]/30 bg-[#FF9900]/10 text-[#FF9900] text-xs font-semibold mb-6 select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF9900] animate-pulse" />
          Ažurirano danas
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-[3.75rem] font-extrabold text-white leading-tight tracking-tight mb-4">
          Pronađi najjeftiniji{" "}
          <span
            style={{
              background: "linear-gradient(90deg, #FF9900 0%, #ffcc55 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            protein
          </span>
          <br className="hidden sm:block" /> u Srbiji
        </h1>

        {/* Subheadline */}
        <p className="text-base sm:text-lg text-slate-400 max-w-xl mx-auto mb-8 leading-relaxed">
          Poredimo cene iz{" "}
          <span className="text-white font-semibold">6 prodavnica</span> u realnom
          vremenu. Uštedi do{" "}
          <span className="text-[#FF9900] font-semibold">40%</span> na omiljenim
          brendovima.
        </p>

        {/* Trust stats */}
        <div className="flex items-stretch justify-center gap-0 mb-10 max-w-sm mx-auto">
          {[
            {
              icon: BarChart2,
              value: `${storeCount}`,
              label: "prodavnica",
            },
            {
              icon: Package,
              value: `${productCount}+`,
              label: "proizvoda",
            },
            {
              icon: Zap,
              value: "Dnevno",
              label: "ažuriranje",
            },
          ].map(({ icon: Icon, value, label }, i) => (
            <div
              key={label}
              className="flex-1 flex flex-col items-center justify-center py-3 px-2"
              style={{
                borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.08)" : "none",
              }}
            >
              <Icon className="w-4 h-4 text-[#FF9900] mb-1" strokeWidth={2} />
              <span className="text-xl font-extrabold text-white tabular-nums leading-none">
                {value}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 uppercase tracking-wide font-medium">
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Search bar */}
        <div className="flex justify-center mb-5">
          <SearchAutocomplete value={searchValue} onChange={onSearchChange} />
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => onCategoryChange(active ? "" : cat.value)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-150 border ${
                  active
                    ? "bg-[#FF9900] border-[#FF9900] text-[#131921] shadow-[0_0_16px_rgba(255,153,0,0.4)]"
                    : "bg-white/8 border-white/15 text-slate-300 hover:bg-white/15 hover:border-white/30 hover:text-white"
                }`}
                style={!active ? { backgroundColor: "rgba(255,255,255,0.06)" } : undefined}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* CTA */}
        <button
          onClick={scrollToGrid}
          className="inline-flex items-center gap-2 px-8 py-3 rounded-full font-bold text-sm uppercase tracking-wider transition-all duration-150 active:scale-95"
          style={{
            background: "linear-gradient(135deg, #FF9900, #e68a00)",
            color: "#131921",
            boxShadow: "0 4px 24px rgba(255,153,0,0.30)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              "0 6px 32px rgba(255,153,0,0.50)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              "0 4px 24px rgba(255,153,0,0.30)";
          }}
        >
          Uporedi cene
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Gradient fade to white */}
      <div
        className="relative h-20 mt-10"
        style={{
          background:
            "linear-gradient(180deg, #131921 0%, rgba(19,25,33,0.6) 50%, #ffffff 100%)",
        }}
      />
    </section>
  );
}
