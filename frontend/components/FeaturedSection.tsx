"use client";

import { useState } from "react";
import { Product } from "@/types/product";
import ProductCard from "@/components/ProductCard";

interface Props {
  topValueProducts: Product[];
  priceDropProducts: Product[];
}

type Tab = "value" | "drops";

function CardRow({
  products,
  showPriceDropBadge = false,
}: {
  products: Product[];
  showPriceDropBadge?: boolean;
}) {
  if (!products.length) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-slate-400">Trenutno nema proizvoda sa padom cene.</p>
      </div>
    );
  }

  return (
    <div
      className="
        flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden
        md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:pb-0 md:snap-none
        lg:grid-cols-5
      "
      style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
    >
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
            className="
              relative flex-shrink-0 snap-start
              w-[220px] sm:w-[calc(50%-6px)]
              md:w-auto md:flex-shrink
            "
          >
            {priceDrop > 0 && (
              <div className="absolute top-[7px] left-[7px] z-30 pointer-events-none">
                <span className="flex items-center gap-0.5 bg-green-500 text-white text-[10px] font-black px-2 py-[3px] rounded-md shadow-md leading-none whitespace-nowrap">
                  ▼ {Math.round(priceDrop).toLocaleString()} RSD
                </span>
              </div>
            )}
            {/* White card elevated against dark bg */}
            <div className="h-full rounded-xl overflow-hidden ring-1 ring-white/[0.09] shadow-[0_4px_24px_rgba(0,0,0,0.35)] hover:shadow-[0_8px_36px_rgba(0,0,0,0.5)] hover:ring-white/20 transition-all duration-200">
              <ProductCard product={product} priority={false} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function FeaturedSection({ topValueProducts, priceDropProducts }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("value");

  if (!topValueProducts.length && !priceDropProducts.length) return null;

  const tabs: { id: Tab; label: string }[] = [
    { id: "value", label: "⚡ Najbolja vrednost" },
    { id: "drops", label: "🔥 Najveći pad cene" },
  ];

  return (
    <section aria-label="Izdvojeno">
      <style>{`
        @keyframes ftab {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ── Dark body ──────────────────────────────────────────────────────── */}
      <div style={{ backgroundColor: "#131921" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 sm:pt-10 lg:pt-12 pb-8 sm:pb-10">

          {/* Header */}
          <div className="mb-5 sm:mb-6">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white leading-tight">
              Izdvojeno
            </h2>
            <p className="hidden sm:block text-sm text-slate-400 mt-1">
              Najpametnije kupovine trenutno na tržištu
            </p>
          </div>

          {/* Pill tabs — min-h-[44px] for touch targets */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`min-h-[44px] px-4 sm:px-5 py-2 rounded-full text-sm font-semibold transition-all duration-150 ${
                  activeTab === tab.id
                    ? "bg-white text-[#131921] shadow-md"
                    : "border border-white/20 text-slate-300 hover:border-white/40 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content — key triggers fade on switch */}
          <div key={activeTab} style={{ animation: "ftab 0.18s ease-out" }}>
            {activeTab === "value" ? (
              <CardRow products={topValueProducts} />
            ) : (
              <CardRow products={priceDropProducts} showPriceDropBadge />
            )}
          </div>

        </div>
      </div>

      {/* ── Gradient fade dark → white ──────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="h-12 sm:h-16"
        style={{
          background:
            "linear-gradient(180deg, #131921 0%, rgba(19,25,33,0.45) 55%, #ffffff 100%)",
        }}
      />
    </section>
  );
}
