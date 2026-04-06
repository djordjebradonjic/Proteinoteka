"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import { Product } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";

export default function ProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/products/${id}`)
      .then((res) => setProduct(res.data))
      .finally(() => setLoading(false));
  }, [id]);

  // Loading
  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="h-80 bg-slate-200 rounded-lg animate-pulse" />
            <div className="space-y-4">
              <div className="h-6 bg-slate-200 rounded animate-pulse w-1/3" />
              <div className="h-10 bg-slate-200 rounded animate-pulse" />
              <div className="h-20 bg-slate-200 rounded animate-pulse" />
              <div className="h-12 bg-slate-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Nije pronađen
  if (!product) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-slate-500">Proizvod nije pronađen</p>
          <Button className="mt-4" onClick={() => router.push("/")}>
            Nazad na početnu
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Nazad dugme */}
        <button
          onClick={() => router.back()}
          className="text-slate-500 hover:text-slate-800 flex items-center gap-1 text-sm mb-6"
        >
          ← Nazad
        </button>

        <div className="grid md:grid-cols-2 gap-8">

          {/* Slika */}
          <div className="bg-white rounded-xl border border-slate-200 p-8 flex items-center justify-center h-80">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="h-full object-contain"
              />
            ) : (
              <div className="text-slate-300 text-sm">Nema slike</div>
            )}
          </div>

          {/* Detalji */}
          <div className="flex flex-col gap-4">

            {/* Brand i prodavnica */}
            <div className="flex items-center gap-2 flex-wrap">
              {product.brand && (
                <Badge variant="secondary">{product.brand}</Badge>
              )}
              <Badge variant="outline">{product.storeName}</Badge>
            </div>

            {/* Naziv */}
            <h1 className="text-2xl font-bold text-slate-800">
              {product.name}
            </h1>

            {/* Cena */}
            <div className="bg-green-50 border border-green-100 rounded-lg p-4">
              <p className="text-sm text-slate-500 mb-1">Cena</p>
              <p className="text-3xl font-bold text-green-600">
                {product.price} RSD
              </p>
            </div>

            {/* Pakovanja */}
            {product.weights?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-slate-600 mb-2">Pakovanja</p>
                <div className="flex flex-wrap gap-2">
                  {product.weights.map((w) => (
                    <span
                      key={w}
                      className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm"
                    >
                      {w}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Ukusi */}
            {product.flavours?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-slate-600 mb-2">Dostupni ukusi</p>
                <div className="flex flex-wrap gap-2">
                  {product.flavours.map((f) => (
                    <span
                      key={f}
                      className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Kupi dugme */}
            <Button asChild size="lg" className="mt-auto">
              <a href={product.productUrl} target="_blank" rel="noopener noreferrer">
                Kupi na {product.storeName} →
              </a>
            </Button>

          </div>
        </div>

        {/* Opis */}
        {product.description && (
          <Card className="mt-8">
            <CardContent className="p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Opis proizvoda</h2>
              <div
                className="text-slate-600 text-sm leading-relaxed prose max-w-none"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </CardContent>
          </Card>
        )}

        {/* Istorija cena */}
        {product.priceHistory?.length > 0 && (
          <Card className="mt-4">
            <CardContent className="p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Istorija cena</h2>
              <div className="space-y-2">
                {product.priceHistory.map((h, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 text-sm">
                      {new Date(h.timestamp).toLocaleDateString("sr-RS", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric"
                      })}
                    </span>
                    <span className="font-semibold text-slate-700">{h.price} RSD</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </main>
  );
}