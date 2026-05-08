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
        <p className="text-sm text-slate-500">Trenutno nema proizvoda sa padom cene.</p>
      </div>
    );
  }

  return (
    <div
      className="flex flex-nowrap gap-4 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden"
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
            className="relative flex-shrink-0 w-[220px]"
          >
            {priceDrop > 0 && (
              <div className="absolute top-[7px] left-[7px] z-30 pointer-events-none">
                <span className="flex items-center gap-0.5 bg-green-500 text-white text-[10px] font-black px-2 py-[3px] rounded-md shadow-md leading-none whitespace-nowrap">
                  ▼ {Math.round(priceDrop).toLocaleString()} RSD
                </span>
              </div>
            )}
            <div className="h-full rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200">
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
    <section
      aria-label="Izdvojeno"
      className="mb-6"
      style={{
        background: "linear-gradient(135deg, #fff7ed 0%, #f8fafc 100%)",
        borderBottom: "1px solid #e2e8f0",
      }}
    >
      <style>{`
        @keyframes ftab {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* Header */}
        <div className="mb-4 sm:mb-5">
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
            Izdvojeno
          </h2>
          <p className="text-sm text-slate-500 mt-0.5 hidden sm:block">
            Najpametnije kupovine trenutno na tržištu
          </p>
        </div>

        {/* Pill tabs */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`min-h-[44px] px-4 sm:px-5 py-2 rounded-full text-sm font-semibold transition-all duration-150 ${
                activeTab === tab.id
                  ? "bg-[#FF9900] text-[#131921] font-bold shadow-sm"
                  : "bg-white border border-slate-200 text-slate-500 hover:border-[#FF9900] hover:text-[#FF9900]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
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
