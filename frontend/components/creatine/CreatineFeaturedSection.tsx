"use client";

import { useState } from "react";
import { Product } from "@/types/product";
import CreatineFeaturedValueCard from "@/components/creatine/CreatineFeaturedValueCard";
import FeaturedPriceDropCard from "@/components/FeaturedPriceDropCard";
import ScrollableRow from "@/components/ScrollableRow";
import { CREATINE_COPY } from "@/lib/creatine";

// The creatine twin of FeaturedSection: same tabbed carousel pattern, copy sourced from CREATINE_COPY.featured
// instead of inline ternaries. FeaturedPriceDropCard is reused unmodified (it's generic); the value tab uses
// CreatineFeaturedValueCard since creatine has no proteinPer100g to compute a "RSD/g proteina" line from.

const COPY = CREATINE_COPY.featured;

interface Props {
  topRatedProducts: Product[];
  priceDropProducts: Product[];
}

type Tab = "rated" | "drops";

export default function CreatineFeaturedSection({ topRatedProducts, priceDropProducts }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("rated");

  if (!topRatedProducts.length && !priceDropProducts.length) return null;

  const tabs: { id: Tab; label: string }[] = [
    { id: "rated", label: COPY.tabRated },
    { id: "drops", label: COPY.tabDrops },
  ];

  return (
    <section
      aria-label={COPY.title}
      className="mb-6 overflow-x-hidden"
      style={{
        background: "linear-gradient(135deg, #fff7ed 0%, #f8fafc 100%)",
        borderBottom: "1px solid #e2e8f0",
      }}
    >
      <style>{`
        @keyframes creatineFtab {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* Header */}
        <div className="mb-4 sm:mb-5">
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">{COPY.title}</h2>
          <p className="text-sm text-slate-500 mt-0.5 hidden sm:block">{COPY.subtitle}</p>
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
        <div key={activeTab} style={{ animation: "creatineFtab 0.18s ease-out" }}>
          {activeTab === "rated" ? (
            topRatedProducts.length ? (
              <ScrollableRow fadeFrom="from-[#fff7ed]">
                {topRatedProducts.map((p) => (
                  <CreatineFeaturedValueCard key={p.id} product={p} />
                ))}
              </ScrollableRow>
            ) : (
              <p className="text-sm text-slate-500 py-8 text-center">{COPY.emptyRated}</p>
            )
          ) : (
            priceDropProducts.length ? (
              <ScrollableRow fadeFrom="from-[#f8fafc]">
                {priceDropProducts.map((p) => (
                  <FeaturedPriceDropCard key={p.id} product={p} />
                ))}
              </ScrollableRow>
            ) : (
              <p className="text-sm text-slate-500 py-8 text-center">{COPY.emptyDrops}</p>
            )
          )}
        </div>

      </div>
    </section>
  );
}
