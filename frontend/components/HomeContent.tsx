"use client";

import dynamic from "next/dynamic";
import { Product } from "@/types/product";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import ProductSection from "@/components/ProductSection";
import FeaturedSection from "@/components/FeaturedSection";

const CompareBar = dynamic(() => import("./CompareBar"), { ssr: false });
const KontaktSekcija = dynamic(() => import("./KontaktFoma"));
const WishlistDrawer = dynamic(() => import("./WishlistDrawer"), { ssr: false });
const ProteinCalculatorWizard = dynamic(() => import("@/components/ProteinCalculatorWizard"), { ssr: false });

interface Props {
  initialProducts: Product[];
  initialTotalPages: number;
  initialTotalItems?: number;
  initialCategory?: string;
  topValueProducts?: Product[];
  priceDropProducts?: Product[];
}


export default function HomeContent({
  initialProducts,
  initialTotalPages,
  initialTotalItems = 0,
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

      <ProductSection
        initialProducts={initialProducts}
        initialTotalPages={initialTotalPages}
        initialTotalItems={initialTotalItems}
        initialCategory={initialCategory}
      />

      <CompareBar />
      <KontaktSekcija />
      <WishlistDrawer />
      <ProteinCalculatorWizard />
    </main>
  );
}
