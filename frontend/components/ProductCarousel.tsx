"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Product } from "@/types/product";
import ProductCard from "@/components/ProductCard";

interface Props {
  products: Product[];
  title: string;
  subtitle: string;
  accentColor?: string;
  showPriceDropBadge?: boolean;
}

export default function ProductCarousel({
  products,
  title,
  subtitle,
  accentColor = "#FF9900",
  showPriceDropBadge = false,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft]   = useState(false);
  const [canRight, setCanRight] = useState(false);

  const check = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [products, check]);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({
      left: dir === "right" ? Math.max(200, el.clientWidth * 0.65) : -Math.max(200, el.clientWidth * 0.65),
      behavior: "smooth",
    });
  };

  if (!products.length) return null;

  return (
    <div>
      {/* ── Dark header band ─────────────────────────────────────────────── */}
      <div
        style={{ backgroundColor: "#131921", borderLeftColor: accentColor }}
        className="border-l-[5px]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-base sm:text-xl font-extrabold text-white leading-snug truncate">
              {title}
            </h2>
            <p className="text-[11px] sm:text-[13px] text-slate-400 mt-0.5 leading-tight">
              {subtitle}
            </p>
          </div>

          {/* Arrow buttons */}
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => scroll("left")}
              disabled={!canLeft}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-150 disabled:opacity-20"
              style={{
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.05)",
                color: "#94a3b8",
              }}
              onMouseEnter={(e) => { if (!e.currentTarget.disabled) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.12)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; }}
              aria-label="Prethodni"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll("right")}
              disabled={!canRight}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-150 disabled:opacity-20"
              style={{
                border: `1px solid ${accentColor}55`,
                background: `${accentColor}22`,
                color: accentColor,
              }}
              onMouseEnter={(e) => { if (!e.currentTarget.disabled) (e.currentTarget as HTMLElement).style.background = `${accentColor}33`; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = `${accentColor}22`; }}
              aria-label="Sledeći"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Scroll area ──────────────────────────────────────────────────── */}
      <div className="relative bg-white overflow-hidden">
        {/* Right edge fade — only visible when content overflows */}
        <div
          className="absolute right-0 top-0 bottom-0 w-12 sm:w-16 pointer-events-none z-10"
          style={{ background: "linear-gradient(to left, #ffffff, transparent)" }}
        />

        {/* Scroll container: native touch-scroll on mobile */}
        <div
          ref={scrollRef}
          onScroll={check}
          className="overflow-x-auto [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
        >
          {/*
            Inner strip:
            - w-max + px padding  → left-aligned scrollable row on small screens
            - xl: w-full max-w-7xl mx-auto justify-center → centered when all cards fit
          */}
          <div className="flex gap-3 sm:gap-4 py-4 sm:py-5 px-4 sm:px-6 w-max xl:w-full xl:max-w-7xl xl:mx-auto xl:justify-center xl:px-6">
            {products.map((product) => {
              const priceDrop =
                showPriceDropBadge &&
                product.previousPrice != null &&
                product.numericPrice != null
                  ? product.previousPrice - product.numericPrice
                  : 0;

              return (
                <div
                  key={product.id}
                  className="relative flex-shrink-0 w-[156px] sm:w-[185px] md:w-[205px] lg:w-[220px] xl:w-[232px]"
                >
                  {/* Price-drop badge */}
                  {priceDrop > 0 && (
                    <div className="absolute top-[7px] left-[7px] z-30 pointer-events-none">
                      <span className="flex items-center gap-0.5 bg-green-500 text-white text-[10px] font-black px-2 py-[3px] rounded-md shadow-lg leading-none">
                        ↓{Math.round(priceDrop).toLocaleString()} RSD
                      </span>
                    </div>
                  )}

                  {/* Card with elevation */}
                  <div className="h-full rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-200">
                    <ProductCard product={product} priority={false} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
