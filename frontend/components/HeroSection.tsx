"use client";

import { useEffect, useRef, useState } from "react";
import { Store, Package, TrendingDown, ArrowDown, GitCompare } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";

interface HeroProps {
  selectedCategory: string;
  onCategoryChange: (val: string) => void;
}

function useCounter(target: number, duration = 1400) {
  const [val, setVal] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    startRef.current = null;
    const tick = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const p = Math.min((ts - startRef.current) / duration, 1);
      setVal(Math.round((1 - (1 - p) ** 3) * target));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return val;
}

// Deterministic positions — no Math.random() to avoid hydration mismatch
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

function scrollToGrid() {
  document.getElementById("product-grid")?.scrollIntoView({ behavior: "smooth" });
}

export default function HeroSection({ selectedCategory, onCategoryChange }: HeroProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Tiny delay so the animation triggers after first paint
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  const handleCategoryClick = (value: string, isActive: boolean) => {
    onCategoryChange(isActive ? "" : value);
    scrollToGrid();
  };

  return (
    <section
      className="relative overflow-hidden"
      aria-label="Hero sekcija"
      style={{ background: "#131921" }}
    >
      <style>{`
        @keyframes heroFloat {
          0%   { transform: translateY(0px)  scale(1);    opacity: 0.2; }
          100% { transform: translateY(-16px) scale(1.4); opacity: 0.55; }
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
          from { opacity: 0; transform: translateY(8px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
      `}</style>

      {/* ── Background layer ────────────────────────────── */}
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
        {/* Soft radial glow */}
        <div
          style={{
            position: "absolute",
            top: "0%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "800px",
            height: "480px",
            background:
              "radial-gradient(ellipse at 50% 30%, rgba(255,153,0,0.09) 0%, transparent 65%)",
            animation: "heroPulse 6s ease-in-out infinite",
          }}
        />
      </div>

      {/* ── Main content ────────────────────────────────── */}
      <div className="relative max-w-3xl mx-auto px-5 pt-16 pb-0 text-center">
        {/* Live badge */}
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-7 select-none"
          style={{
            border: "1px solid rgba(255,153,0,0.28)",
            background: "rgba(255,153,0,0.08)",
            color: "#FF9900",
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF9900] animate-pulse" />
          Ažurirano danas
        </div>

        {/* H1 */}
        <h1
          className="text-[2.6rem] sm:text-5xl md:text-6xl font-extrabold text-white leading-[1.1] tracking-tight mb-5"
          style={visible ? { animation: "heroIn 0.5s cubic-bezier(0.16,1,0.3,1) both" } : { opacity: 0 }}
        >
          Pronađi{" "}
          <span
            style={{
              color: "#FF9900",
              textShadow: "0 0 32px rgba(255,153,0,0.45), 0 0 8px rgba(255,153,0,0.2)",
            }}
          >
            najjeftiniji
          </span>{" "}
          protein u Srbiji.
        </h1>

        {/* Subheadline */}
        <p
          className="text-base sm:text-lg text-slate-300 font-normal max-w-lg mx-auto leading-relaxed mb-10"
          style={
            visible
              ? { animation: "heroInSub 0.5s cubic-bezier(0.16,1,0.3,1) 0.2s both" }
              : { opacity: 0 }
          }
        >
          Upoređujemo cene iz 6 vodećih prodavnica i pronalazimo najbolju ponudu.
        </p>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-0 mb-10 max-w-xs mx-auto sm:max-w-sm">
          {[
            { icon: Store,        value: "6",          label: "prodavnica",  delay: 0.35 },
            { icon: Package,      value: "250+",       label: "proizvoda",   delay: 0.45 },
            { icon: TrendingDown, value: "Mi pratimo.", label: "Ti štediš.", delay: 0.55 },
          ].map(({ icon: Icon, value, label, delay }, i) => (
            <div
              key={label}
              className="flex-1 flex flex-col items-center py-3 px-2"
              style={{
                borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.07)" : "none",
                ...(visible
                  ? { animation: `heroBadge 0.45s cubic-bezier(0.16,1,0.3,1) ${delay}s both` }
                  : { opacity: 0 }),
              }}
            >
              <Icon className="w-3.5 h-3.5 text-[#FF9900] mb-1.5" strokeWidth={2.2} />
              <span className="text-lg font-extrabold text-white tabular-nums leading-none">
                {value}
              </span>
              <span className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-medium">
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
          {/* Primary */}
          <button
            onClick={scrollToGrid}
            aria-label="Pronađi najjeftinije proteine"
            className="group inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full font-bold text-[#131921] text-sm transition-all duration-150 active:scale-[0.97]"
            style={{
              background: "linear-gradient(135deg, #FF9900 0%, #e68a00 100%)",
              boxShadow: "0 4px 28px rgba(255,153,0,0.35)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 36px rgba(255,153,0,0.55)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 28px rgba(255,153,0,0.35)";
            }}
          >
            Pronađi najjeftinije
            <ArrowDown className="w-4 h-4 transition-transform duration-200 group-hover:translate-y-0.5" />
          </button>

          {/* Secondary */}
          <button
            onClick={scrollToGrid}
            aria-label="Uporedi proizvode"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-slate-300 transition-all duration-150 hover:text-white active:scale-[0.97]"
            style={{
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.05)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.10)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.25)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.15)";
            }}
          >
            <GitCompare className="w-3.5 h-3.5" />
            Uporedi proizvode
          </button>
        </div>

        {/* Category quick links */}
        <div
          className="flex gap-2 overflow-x-auto pb-1 justify-center flex-wrap sm:flex-nowrap mb-2"
          role="navigation"
          aria-label="Kategorije proteina"
        >
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => handleCategoryClick(cat.value, active)}
                aria-pressed={active}
                className="shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-150 whitespace-nowrap"
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
        </div>
      </div>

      {/* Gradient fade into product grid */}
      <div
        className="h-24 mt-10"
        aria-hidden="true"
        style={{
          background:
            "linear-gradient(180deg, #131921 0%, rgba(19,25,33,0.55) 55%, #ffffff 100%)",
        }}
      />
    </section>
  );
}
