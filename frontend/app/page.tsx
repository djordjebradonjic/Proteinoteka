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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/products")
      .then((res) => {
        setProducts(res.data);
        setFiltered(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      products.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q)
      )
    );
  }, [search, products]);

  return (
    <main className="min-h-screen bg-slate-50">

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800">
            💪 Proteinoteka
          </h1>
          <span className="text-sm text-slate-500">
            Poređenje cena proteina u Srbiji
          </span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Hero pretraga */}
        <div className="text-center mb-10">
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

        {/* Broj rezultata */}
        {!loading && (
          <p className="text-sm text-slate-500 mb-4">
            Pronađeno {filtered.length} proizvoda
          </p>
        )}

        {/* Loading */}
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
                
                {/* Slika */}
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
                  {/* Brand */}
                  {p.brand && (
                    <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">
                      {p.brand}
                    </p>
                  )}
                  
                  {/* Naziv */}
                  <h3 className="font-semibold text-slate-800 text-sm leading-snug mb-2 line-clamp-2">
                    {p.name}
                  </h3>

                  {/* Cena */}
                  <p className="text-xl font-bold text-green-600">
                    {p.price} RSD
                  </p>

                  {/* Prodavnica */}
                  <Badge variant="outline" className="mt-2 text-xs">
                    {p.storeName}
                  </Badge>
                </CardContent>

                <CardFooter className="px-4 pb-4">
                  <Button asChild className="w-full" size="sm">
                    <a href={p.url} target="_blank" rel="noopener noreferrer">
                      Kupi →
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