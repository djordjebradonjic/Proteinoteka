import { Product } from "@/types/product";
import ProductCard from "./ProductCard";
import { Button } from "./ui/button";

interface ProductGridProps {
  products: Product[];
  loading: boolean;
  searchQuery: string;
  currentPage:number,
  totalPages: number,
  onPageChange: (page : number) => void;
}

export default function ProductGrid({ 
  products,
  loading,
  searchQuery,
  currentPage,
  totalPages,
  onPageChange }: ProductGridProps) {

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-72 bg-slate-200 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-20 text-slate-400">
        <p className="text-lg">Nema rezultata za "{searchQuery}"</p>
        <p className="text-sm mt-1">Pokušaj sa drugim pojmom</p>
      </div>
    );
  }

  return (
    <>
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.map((p) => (
      <ProductCard key={p.productUrl} product={p} />

      ))}
    </div>
    <div className="flex flex-col items-center justify-center gap-4 py-8 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 0}
          >
            ← Prethodna
          </Button>

          <div className="px-4 py-2 text-sm font-medium bg-slate-50 rounded-md border border-slate-200">
            Stranica <span className="text-blue-600">{currentPage + 1}</span> od {totalPages}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages - 1}
          >
            Sledeća →
          </Button>
        </div>
        
        <p className="text-xs text-slate-400 italic">
          Prikazano 12 proizvoda po stranici
        </p>
      </div>
  </>
  );
}