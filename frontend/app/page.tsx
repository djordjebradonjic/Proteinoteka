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
  const [page, setPage] = useState(0); // Pratimo stranicu
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedStore, setSelectedStore] = useState("Sve");
  const [loading, setLoading] = useState(true);

  // Za filtre (ovo možemo ostaviti hardkodovano ili vući posebnim API-jem kasnije)
  const stores = ["Sve", "Pansport",  "Proteinisi"]; 

  // Glavna funkcija za učitavanje podataka sa servera
  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Pravimo URL sa parametrima za paginaciju i filtere
      let url = `/products?page=${page}&size=12`;
      
      if (search) url += `&name=${encodeURIComponent(search)}`;
      if (selectedStore !== "Sve") url += `&storeName=${encodeURIComponent(selectedStore)}`;

      const res = await api.get(url);
      
      // PAŽNJA: Spring Boot Page vraća podatke u 'content' polju
      setProducts(res.data.content);
      setTotalPages(res.data.totalPages);
    } catch (error) {
      console.error("Greška pri učitavanju:", error);
    } finally {
      setLoading(false);
    }
  };

  // Okidamo fetch kada se promeni stranica, pretraga ili prodavnica
  useEffect(() => {
    fetchProducts();
  }, [page, selectedStore]);

  // Poseban useEffect za pretragu (sa malim zakašnjenjem da ne šaljemo zahtev za svako slovo)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setPage(0); // Resetujemo na prvu stranu pri novoj pretrazi
      fetchProducts();
    }, 500); // Čekamo 500ms nakon što korisnik prestane da kuca

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handleReset = () => {
    setSelectedStore("Sve");
    setSearch("");
    setPage(0);
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <SearchBar value={search} onChange={setSearch} />
        <StoreFilter
          stores={stores}
          brands={[]} // Brendove ćemo rešiti kasnije
          selectedStore={selectedStore}
          selectedBrand={"Sve"}
          onStoreChange={(val) => { setSelectedStore(val); setPage(0); }}
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
            setPage(newPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </div>
    </main>
  );
}