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
      <div className="flex items-center justify-center py-12 text-slate-400">
        <p className="text-sm">Trenutno nema proizvoda sa padom cene.</p>
      </div>
    );
  }

  return (
    <div
      className="flex gap-3 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-4 md:gap-4 md:overflow-visible md:pb-0"
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
          <div key={product.id} className="relative flex-shrink-0 w-[156px] md:w-auto">
            {priceDrop > 0 && (
              <div className="absolute top-[7px] left-[7px] z-30 pointer-events-none">
                <span className="flex items-center gap-0.5 bg-green-500 text-white text-[10px] font-black px-2 py-[3px] rounded-md shadow-md leading-none whitespace-nowrap">
                  ▼ {Math.round(priceDrop).toLocaleString()} RSD
                </span>
              </div>
            )}
            <div className="h-full rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
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
    <section className="max-w-7xl mx-auto px-4 sm:px-6 mb-10">
      <style>{`
        @keyframes ftab {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="bg-gradient-to-b from-slate-50 to-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8">

        {/* Header */}
        <div className="mb-5">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1A1A1A] leading-tight">
            Izdvojeno
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Najpametnije kupovine trenutno na tržištu
          </p>
        </div>

        {/* Pill tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-150 ${
                activeTab === tab.id
                  ? "bg-[#1B2B4B] text-white shadow-sm"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-[#1B2B4B] hover:text-[#1B2B4B]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content — key re-mounts on switch, triggering the fade */}
        <div key={activeTab} style={{ animation: "ftab 0.18s ease-out" }}>
          {activeTab === "value" ? (
            <CardRow products={topValueProducts} />
          ) : (
            <CardRow products={priceDropProducts} showPriceDropBadge />
          )}
        </div>

      </div>
    </section>
  );
}
