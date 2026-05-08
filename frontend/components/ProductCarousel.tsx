"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Product } from "@/types/product";
import ProductCard from "@/components/ProductCard";

interface Props {
  products: Product[];
  title: string;
  subtitle: string;
  showPriceDropBadge?: boolean;
}

export default function ProductCarousel({
  products,
  title,
  subtitle,
  showPriceDropBadge = false,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [products, checkScroll]);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({
      left: dir === "right" ? 240 : -240,
      behavior: "smooth",
    });
  };

  if (!products.length) return null;

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div>
          <h2 className="text-[15px] font-extrabold text-[#1A1A1A] leading-tight">{title}</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => scroll("left")}
            disabled={!canLeft}
            className="w-7 h-7 rounded-full border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 disabled:opacity-25 transition-all shadow-sm"
            aria-label="Nazad"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </button>
          <button
            onClick={() => scroll("right")}
            disabled={!canRight}
            className="w-7 h-7 rounded-full border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 disabled:opacity-25 transition-all shadow-sm"
            aria-label="Napred"
          >
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Scroll track */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-3 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: "none" }}
      >
        {products.map((product, i) => {
          const priceDrop =
            showPriceDropBadge &&
            product.previousPrice != null &&
            product.numericPrice != null
              ? product.previousPrice - product.numericPrice
              : 0;

          return (
            <div
              key={product.id}
              className="relative flex-shrink-0 w-[172px] sm:w-[196px] lg:w-[216px]"
            >
              <ProductCard product={product} priority={i < 4} />

              {/* Price-drop badge — overlays the card's top-left corner */}
              {priceDrop > 0 && (
                <div className="absolute top-[6px] left-[6px] z-30 pointer-events-none">
                  <span className="flex items-center gap-0.5 bg-green-600 text-white text-[10px] font-black px-2 py-[3px] rounded-md shadow-md leading-none">
                    ↓{Math.round(priceDrop).toLocaleString()} RSD
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
