"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  children: React.ReactNode;
  className?: string;
  /** Tailwind `from-*` class that matches the parent background for the fade overlay */
  fadeFrom?: string;
  gap?: string;
}

export default function ScrollableRow({
  children,
  className = "",
  fadeFrom = "from-white",
  gap = "gap-4",
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
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      el.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [check]);

  // Re-check when children change (e.g. tab switch)
  useEffect(() => { check(); }, [children, check]);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({
      left: dir === "right"
        ? Math.max(280, el.clientWidth * 0.7)
        : -Math.max(280, el.clientWidth * 0.7),
      behavior: "smooth",
    });
  };

  return (
    <div className="relative">
      {/* Left fade + arrow */}
      <div
        className={`absolute left-0 top-0 bottom-2 w-14 bg-gradient-to-r ${fadeFrom} to-transparent pointer-events-none z-10 transition-opacity duration-200 ${canLeft ? "opacity-100" : "opacity-0"}`}
      />
      <button
        onClick={() => scroll("left")}
        className={`flex absolute left-2 top-1/2 -translate-y-1/2 z-20
          w-8 h-8 sm:w-9 sm:h-9 rounded-full items-center justify-center
          bg-white/95 border border-slate-200 shadow-md
          text-slate-500 hover:text-[#FF9900] hover:border-[#FF9900] hover:shadow-lg
          transition-all duration-200
          ${canLeft ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        aria-label="Prethodni"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Right fade + arrow */}
      <div
        className={`absolute right-0 top-0 bottom-2 w-14 bg-gradient-to-l ${fadeFrom} to-transparent pointer-events-none z-10 transition-opacity duration-200 ${canRight ? "opacity-100" : "opacity-0"}`}
      />
      <button
        onClick={() => scroll("right")}
        className={`flex absolute right-2 top-1/2 -translate-y-1/2 z-20
          w-8 h-8 sm:w-9 sm:h-9 rounded-full items-center justify-center
          bg-white/95 border border-slate-200 shadow-md
          text-slate-500 hover:text-[#FF9900] hover:border-[#FF9900] hover:shadow-lg
          transition-all duration-200
          ${canRight ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        aria-label="Sledeći"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Scroll container */}
      <div
        ref={scrollRef}
        className={`flex flex-nowrap ${gap} overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden ${className}`}
        style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
      >
        {children}
      </div>
    </div>
  );
}
