"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { Product } from "@/types/product";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import SortSelect from "@/components/SortSelect";
import ProductGrid from "@/components/ProductGrid";
import ProductSection from "@/components/ProductSection";
import FeaturedSection from "@/components/FeaturedSection";

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
  return (
    <main className="min-h-screen bg-white overflow-x-hidden">
      <Header />
      {!initialCategory && <HeroSection />}

      {/* Featured tabbed section — homepage only, above the main grid */}
      {!initialCategory && (
        <FeaturedSection
          topValueProducts={topValueProducts}
          priceDropProducts={priceDropProducts}
        />
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
