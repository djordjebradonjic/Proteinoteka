"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { Product } from "@/types/product";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import SortSelect from "@/components/SortSelect";
import ProductGrid from "@/components/ProductGrid";
import ProductSection from "@/components/ProductSection";
import ProductCarousel from "@/components/ProductCarousel";

const CompareBar = dynamic(() => import("./CompareBar"), { ssr: false });
const KontaktSekcija = dynamic(() => import("./KontaktFoma"));
const WishlistDrawer = dynamic(() => import("./WishlistDrawer"), { ssr: false });
const ProteinCalculatorWizard = dynamic(() => import("@/components/ProteinCalculatorWizard"), { ssr: false });

interface Props {
  initialProducts: Product[];
  initialTotalPages: number;
  initialCategory?: string;
  topValueProducts?: Product[];
  priceDropProducts?: Product[];
}

// Fallback shown while ProductSection hydrates.
// Must match ProductSection's initial layout exactly so the swap is invisible (no CLS).
function ProductFallback({
  initialProducts,
  initialTotalPages,
}: {
  initialProducts: Product[];
  initialTotalPages: number;
}) {
  return (
    <div
      id="product-grid"
      className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-6 items-start relative"
    >
      {/* Sidebar placeholder — same width as real SidebarFilter */}
      <div className="hidden md:block w-64 shrink-0 self-start sticky top-24" />

      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2">
          <SortSelect value="id,desc" onSortChange={() => {}} />
        </div>
        <ProductGrid
          products={initialProducts}
          loading={false}
          searchQuery=""
          currentPage={0}
          totalPages={initialTotalPages}
          onPageChange={() => {}}
        />
      </div>
    </div>
  );
}

export default function HomeContent({
  initialProducts,
  initialTotalPages,
  initialCategory = "",
  topValueProducts = [],
  priceDropProducts = [],
}: Props) {
  const showCarousels = !initialCategory && (topValueProducts.length > 0 || priceDropProducts.length > 0);

  return (
    <main className="min-h-screen bg-white">
      <Header />
      {!initialCategory && <HeroSection />}

      {/* Carousels — homepage only, above the main grid */}
      {showCarousels && (
        <div className="max-w-7xl mx-auto px-4 pt-6 pb-2 space-y-5">
          {topValueProducts.length > 0 && (
            <ProductCarousel
              products={topValueProducts}
              title="Najisplativije trenutno"
              subtitle="Najbolji odnos cene i proteina"
            />
          )}
          {priceDropProducts.length > 0 && (
            <ProductCarousel
              products={priceDropProducts}
              title="Cena pala 🔥"
              subtitle="Proizvodi sa sniženom cenom u poslednjih 7 dana"
              showPriceDropBadge
            />
          )}
          <div className="border-t border-slate-100 pt-1" />
        </div>
      )}

      {/* ProductSection owns all useSearchParams logic.
          The fallback renders identical markup to ProductSection's default state
          so static HTML → hydrated state is a seamless swap with zero CLS. */}
      <Suspense
        fallback={
          <ProductFallback
            initialProducts={initialProducts}
            initialTotalPages={initialTotalPages}
          />
        }
      >
        <ProductSection
          initialProducts={initialProducts}
          initialTotalPages={initialTotalPages}
          initialCategory={initialCategory}
        />
      </Suspense>

      <CompareBar />
      <KontaktSekcija />
      <WishlistDrawer />
      <ProteinCalculatorWizard />
    </main>
  );
}
