"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Product } from "@/types/product";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [selectedStore, setSelectedStore] = useState("Sve");
  const [selectedBrand, setSelectedBrand] = useState("Sve");
  const [loading, setLoading] = useState(true);

  const stores = ["Sve", ...Array.from(new Set(products.map((p) => p.storeName)))];
  const brands = ["Sve", ...Array.from(new Set(products.map((p) => p.brand).filter(Boolean)))];

  useEffect(() => {
    api.get("/products")
      .then((res) => {
        setProducts(res.data);
        setFiltered(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  // Filtriranje
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

  return (
    <main className="min-h-screen bg-slate-50">

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800">💪 Proteinoteka</h1>
          <span className="text-sm text-slate-500">Poređenje cena proteina u Srbiji</span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Hero pretraga */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">
            Pronađi najjeftiniji protein
          </h2>
          <p className="text-slate-500 mb-6">
            Poredimo cene sa Pansport, Proteini.si i još mnogo prodavnica
          </p>
          <Input
            placeholder="Pretraži protein ili brend..."
            className="max-w-xl mx-auto text-base h-12"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filteri */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6 flex flex-wrap gap-4 items-center">
          
          {/* Filter prodavnica */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-slate-500 font-medium">Prodavnica</span>
            <div className="flex flex-wrap gap-2">
              {stores.map((store) => (
                <button
                  key={store}
                  onClick={() => setSelectedStore(store)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors
                    ${selectedStore === store
                      ? "bg-slate-800 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                >
                  {store}
                </button>
              ))}
            </div>
          </div>

          {/* Separator */}
          <div className="w-px h-10 bg-slate-200 hidden sm:block" />

          {/* Filter brendova */}
          <div className="flex flex-col gap-1 flex-1">
            <span className="text-xs text-slate-500 font-medium">Brend</span>
            <div className="flex flex-wrap gap-2">
              {brands.slice(0, 10).map((brand) => (
                <button
                  key={brand}
                  onClick={() => setSelectedBrand(brand)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors
                    ${selectedBrand === brand
                      ? "bg-slate-800 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                >
                  {brand}
                </button>
              ))}
            </div>
          </div>

          {/* Reset */}
          {(selectedStore !== "Sve" || selectedBrand !== "Sve" || search) && (
            <button
              onClick={() => {
                setSelectedStore("Sve");
                setSelectedBrand("Sve");
                setSearch("");
              }}
              className="text-sm text-red-500 hover:text-red-700 font-medium ml-auto"
            >
              Očisti filtere ✕
            </button>
          )}
        </div>

        {/* Broj rezultata */}
        {!loading && (
          <p className="text-sm text-slate-500 mb-4">
            Pronađeno <span className="font-semibold text-slate-700">{filtered.length}</span> proizvoda
          </p>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-72 bg-slate-200 rounded-lg animate-pulse" />
            ))}
          </div>
        )}

        {/* Grid proizvoda */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((p) => (
              <Card key={p.id} className="flex flex-col hover:shadow-md transition-shadow bg-white">
                
                <div className="p-4 flex items-center justify-center h-44 bg-white rounded-t-lg">
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-100 rounded flex items-center justify-center text-slate-400">
                      Nema slike
                    </div>
                  )}
                </div>

                <CardContent className="flex-1 px-4 pb-2">
                  {p.brand && (
                    <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">
                      {p.brand}
                    </p>
                  )}
                  <h3 className="font-semibold text-slate-800 text-sm leading-snug mb-2 line-clamp-2">
                    {p.name}
                  </h3>
                  <p className="text-xl font-bold text-green-600">
                    {p.price} RSD
                  </p>
                  <Badge variant="outline" className="mt-2 text-xs">
                    {p.storeName}
                  </Badge>
                </CardContent>

                <CardFooter className="px-4 pb-4 gap-2 flex flex-col">
                  <Button asChild className="w-full" size="sm">
                    <a href={p.url} target="_blank" rel="noopener noreferrer">
                      Kupi →
                    </a>
                  </Button>
                  <Button variant="outline" asChild className="w-full" size="sm">
                    <a href={`/proizvod/${p.id}`}>
                      Detalji
                    </a>
                  </Button>
                </CardFooter>

              </Card>
            ))}
          </div>
        )}

        {/* Nema rezultata */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-20 text-slate-400">
            <p className="text-lg">Nema rezultata za "{search}"</p>
            <p className="text-sm mt-1">Pokušaj sa drugim pojmom</p>
          </div>
        )}

      </div>
    </main>
  );
}