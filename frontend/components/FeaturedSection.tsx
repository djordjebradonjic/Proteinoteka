"use client";

import { useState } from "react";
import { Product } from "@/types/product";
import FeaturedValueCard from "@/components/FeaturedValueCard";
import FeaturedPriceDropCard from "@/components/FeaturedPriceDropCard";
import ScrollableRow from "@/components/ScrollableRow";

interface Props {
  topValueProducts: Product[];
  priceDropProducts: Product[];
}

type Tab = "value" | "drops";

export default function FeaturedSection({ topValueProducts, priceDropProducts }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("value");

  if (!topValueProducts.length && !priceDropProducts.length) return null;

  const tabs: { id: Tab; label: string }[] = [
    { id: "value", label: "⚡ Najbolji Value Score" },
    { id: "drops", label: "🔥 Najveći pad cene" },
  ];

  return (
    <section
      aria-label="Izdvojeno"
      className="mb-6 overflow-x-hidden"
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
            Pametna kupovina danas
          </h2>
          <p className="text-sm text-slate-500 mt-0.5 hidden sm:block">
            Proteini sa najboljim Value Score-om i najvećim padom cene
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
            topValueProducts.length ? (
              <ScrollableRow fadeFrom="from-[#fff7ed]">
                {topValueProducts.map((p) => (
                  <FeaturedValueCard key={p.id} product={p} />
                ))}
              </ScrollableRow>
            ) : (
              <p className="text-sm text-slate-500 py-8 text-center">Nema podataka.</p>
            )
          ) : (
            priceDropProducts.length ? (
              <ScrollableRow fadeFrom="from-[#f8fafc]">
                {priceDropProducts.map((p) => (
                  <FeaturedPriceDropCard key={p.id} product={p} />
                ))}
              </ScrollableRow>
            ) : (
              <p className="text-sm text-slate-500 py-8 text-center">Trenutno nema proizvoda sa padom cene.</p>
            )
          )}
        </div>

      </div>
    </section>
  );
}
