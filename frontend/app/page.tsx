"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Product } from "@/types/product";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import StoreFilter from "@/components/StoreFilter";
import ProductGrid from "@/components/ProductGrid";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [selectedStore, setSelectedStore] = useState("Sve");
  const [selectedBrand, setSelectedBrand] = useState("Sve");
  const [loading, setLoading] = useState(true);

  const stores = ["Sve", ...Array.from(new Set(products.map((p) => p.storeName)))];
  const brands = ["Sve", ...Array.from(new Set(products.map((p) => p.brand).filter(Boolean) as string[]))];

  useEffect(() => {
    api.get("/products")
      .then((res) => {
        setProducts(res.data);
        setFiltered(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = products;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q)
      );
    }

    if (selectedStore !== "Sve") {
      result = result.filter((p) => p.storeName === selectedStore);
    }

    if (selectedBrand !== "Sve") {
      result = result.filter((p) => p.brand === selectedBrand);
    }

    setFiltered(result);
  }, [search, selectedStore, selectedBrand, products]);

  const handleReset = () => {
    setSelectedStore("Sve");
    setSelectedBrand("Sve");
    setSearch("");
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <SearchBar value={search} onChange={setSearch} />
        <StoreFilter
          stores={stores}
          brands={brands}
          selectedStore={selectedStore}
          selectedBrand={selectedBrand}
          onStoreChange={setSelectedStore}
          onBrandChange={setSelectedBrand}
          onReset={handleReset}
          hasActiveFilters={selectedStore !== "Sve" || selectedBrand !== "Sve" || !!search}
        />
        {!loading && (
          <p className="text-sm text-slate-500 mb-4">
            Pronađeno <span className="font-semibold text-slate-700">{filtered.length}</span> proizvoda
          </p>
        )}
        <ProductGrid products={filtered} loading={loading} searchQuery={search} />
      </div>
    </main>
  );
}