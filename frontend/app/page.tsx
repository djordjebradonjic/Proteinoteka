"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/axios";
import { Product } from "@/types/product";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import StoreFilter from "@/components/StoreFilter";
import ProductGrid from "@/components/ProductGrid";

import { useSearchParams, useRouter, usePathname } from "next/navigation";

export default function Home() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const search = searchParams.get("query") || "";
  const selectedStore = searchParams.get("store") || "Sve";
  const page = Number(searchParams.get("page")) || 0;

  // Ostali podaci koji ne idu u URL ostaju u useState
  const [products, setProducts] = useState<Product[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const stores = ["Sve", "Pansport", "Proteini.si"];

  const updateFilters = useCallback((name: string, value: string | number) => {
    const params = new URLSearchParams(searchParams);
    
    if (value && value !== "Sve") {
      params.set(name, value.toString());
    } else {
      params.delete(name);
    }

    if (name !== "page") {
      params.set("page", "0");
    }

    replace(`${pathname}?${params.toString()}`);
  }, [searchParams, pathname, replace]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let url = `/products?page=${page}&size=12`;
      
      if (search) url += `&name=${encodeURIComponent(search)}`;
      if (selectedStore !== "Sve") url += `&storeName=${encodeURIComponent(selectedStore)}`;

      const res = await api.get(url);
      
      setProducts(res.data.content);
      setTotalPages(res.data.page.totalPages);
    } catch (error) {
      console.error("Greška pri učitavanju:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, selectedStore, search]);

  const handleReset = () => {
 
    replace(pathname);
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-8">
        
        {/* SearchBar prosleđujemo updateFilters umesto setSearch */}
        <SearchBar 
          value={search} 
          onChange={(val) => updateFilters("query", val)} 
        />

        <StoreFilter
          stores={stores}
          brands={[]} 
          selectedStore={selectedStore}
          selectedBrand={"Sve"}
          onStoreChange={(val) => updateFilters("store", val)}
          onBrandChange={() => {}}
          onReset={handleReset}
          hasActiveFilters={selectedStore !== "Sve" || !!search}
        />
        
        {!loading && (
          <p className="text-sm text-slate-500 mb-4">
            Stranica <span className="font-semibold text-slate-700">{page + 1}</span> od {totalPages}
          </p>
        )}

        <ProductGrid 
          products={products} 
          loading={loading} 
          searchQuery={search}
          currentPage={page}
          totalPages={totalPages}
          onPageChange={(newPage) => {
            updateFilters("page", newPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </div>
    </main>
  );
}