"use client";

import PriceFilter from "@/components/PriceFilter";
import { useEffect, useState, useCallback } from "react";
import api from "@/lib/axios";
import { Product } from "@/types/product";
import Header from "@/components/Header";

import StoreFilter from "@/components/StoreFilter";
import ProductGrid from "@/components/ProductGrid";
import SortSelect from "@/components/SortSelect";
import { useDebounce } from "use-debounce";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import SidebarFilter from "./SIdeBarFilter";


interface Props {
  initialProducts: Product[];
  initialTotalPages: number;
}

export default function HomeContent({ initialProducts, initialTotalPages }: Props) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const search = searchParams.get("query") || "";
  const selectedStore = searchParams.get("store") || "Sve";
  const page = Number(searchParams.get("page")) || 0;
  const sort = searchParams.get("sort") || "id,desc";

  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [loading, setLoading] = useState(true);

  const stores = ["Sve", "Pansport", "Proteini.si"];

  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";

  const [debouncedMinPrice] = useDebounce(minPrice, 500);
  const [debouncedMaxPrice] = useDebounce(maxPrice, 500);

  const [brands, setBrands] = useState<string[]>([]);

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

  const fetchBrands = useCallback(async () => {
    try {
      const res = await api.get("/products/brands");
      setBrands(res.data);
    } catch (err) {
      console.error("Neuspešno učitavanje brendova", err);
    }
  }, []);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/products?page=${page}&size=12&sort=${sort}`;
      const brandParam = searchParams.get("brand") || "";
      if (search) url += `&name=${encodeURIComponent(search)}`;
      if (selectedStore !== "Sve") url += `&storeName=${encodeURIComponent(selectedStore)}`;
      if (brandParam && brandParam !== "Sve") url += `&brand=${encodeURIComponent(brandParam)}`;
      if (minPrice) url += `&minPrice=${minPrice}`;
      if (maxPrice) url += `&maxPrice=${maxPrice}`;
      const res = await api.get(url);
      setProducts(res.data.content);
      setTotalPages(res.data.page.totalPages);
    } catch (error) {
      console.error("Greška pri učitavanju:", error);
    } finally {
      setLoading(false);
    }
  }, [page, selectedStore, search, sort, debouncedMinPrice, debouncedMaxPrice, searchParams]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleReset = () => {
    replace(pathname);
  };

 return (
  <main className="min-h-screen bg-slate-50">
    <Header
      searchValue={search}
      onSearchChange={(val) => updateFilters("query", val)}
    />
    <div className="max-w-7xl mx-auto px-4 py-8 flex gap-6 items-start">
      
      <SidebarFilter
        brands={brands}
        selectedStore={selectedStore}
        selectedBrand={searchParams.get("brand") || "Sve"}
        minPrice={minPrice}
        maxPrice={maxPrice}
        onStoreChange={(val) => updateFilters("store", val)}
        onBrandChange={(val) => updateFilters("brand", val)}
        onMinChange={(val) => updateFilters("minPrice", val)}
        onMaxChange={(val) => updateFilters("maxPrice", val)}
        onReset={handleReset}
        hasActiveFilters={selectedStore !== "Sve" || !!search || sort !== "id,desc"}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <SortSelect
            value={sort}
            onSortChange={(val) => updateFilters("sort", val)}
          />
          {!loading && (
            <p className="text-sm text-slate-500">
              Stranica <span className="font-semibold text-slate-700">{page + 1}</span> od {totalPages}
            </p>
          )}
        </div>
        <ProductGrid
          products={products}
          loading={loading}
          searchQuery={search}
          currentPage={page}
          totalPages={totalPages}
          onPageChange={(newPage) => {
            updateFilters("page", newPage);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      </div>

    </div>
  </main>
);
}