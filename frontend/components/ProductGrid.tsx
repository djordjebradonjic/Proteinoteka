import { Product } from "@/types/product";
import ProductCard from "./ProductCard";
import NewsletterListingBanner from "./NewsletterListingBanner";

interface ProductGridProps {
  products: Product[];
  loading: boolean;
  searchQuery: string;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function ProductGrid({
  products,
  loading,
  searchQuery,
  currentPage,
  totalPages,
  onPageChange,
}: ProductGridProps) {
  // Initial empty load — show skeletons
  if (loading && (!products || products.length === 0)) {
    return (
      <div className="flex flex-wrap gap-3 md:gap-4">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="w-[calc(50%-6px)] md:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)] xl:w-[calc(25%-12px)]"
          >
            <div className="h-[340px] md:h-[380px] bg-slate-200 animate-pulse rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (!loading && (!products || products.length === 0)) {
    return (
      <div className="text-center py-20 text-slate-400">
        <p className="text-lg">Nema rezultata za "{searchQuery}"</p>
        <p className="text-sm mt-1">Pokušaj sa drugim pojmom</p>
      </div>
    );
  }

  return (
    <>
      {/* Dim existing products during page-change fetch — no height change, no jump */}
      <div className={`flex flex-wrap gap-3 md:gap-4 transition-opacity duration-150 ${loading ? "opacity-40 pointer-events-none" : "opacity-100"}`}>
        {products.map((p, index) => (
          <div
            key={p.id}
            className="w-[calc(50%-6px)] md:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)] xl:w-[calc(25%-12px)]"
          >
            <ProductCard product={p} priority={index < 4} />
          </div>
        ))}
      </div>

      {currentPage === 0 && (
        <div className="mt-6">
          <NewsletterListingBanner />
        </div>
      )}

      <div className="flex items-center justify-center gap-1 py-8 border-t border-slate-100 flex-wrap mt-6">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0}
          className="px-3 py-2 text-sm font-medium rounded-md border border-[#E2E8F0] text-[#1B2B4B] hover:bg-[#FFF8EC] hover:border-[#FFD980] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ←
        </button>

        {Array.from({ length: totalPages }, (_, i) => {
          const showPage =
            i === 0 || i === totalPages - 1 || Math.abs(i - currentPage) <= 1;

          const showDots =
            (i === 1 && currentPage > 3) ||
            (i === totalPages - 2 && currentPage < totalPages - 4);

          if (showDots) {
            return (
              <span key={i} className="px-2 text-slate-400 text-sm">
                ...
              </span>
            );
          }

          if (!showPage) return null;

          return (
            <button
              key={i}
              onClick={() => onPageChange(i)}
              className={`min-w-[36px] h-9 text-sm font-medium rounded-md border transition-colors ${
                currentPage === i
                  ? "bg-[#1B2B4B] text-white border-[#1B2B4B]"
                  : "border-[#E2E8F0] text-[#1B2B4B] hover:bg-[#FFF8EC] hover:border-[#FFD980]"
              }`}
            >
              {i + 1}
            </button>
          );
        })}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages - 1}
          className="px-3 py-2 text-sm font-medium rounded-md border border-[#E2E8F0] text-[#1B2B4B] hover:bg-[#FFF8EC] hover:border-[#FFD980] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          →
        </button>
      </div>
    </>
  );
}
