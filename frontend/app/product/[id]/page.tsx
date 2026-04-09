"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import { Product } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';


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
           

           {product.proteinPer100g && (
             <p className="text-sm text-slate-500 mt-2">
             🥩 {product.proteinPer100g}g proteina na 100g
            </p>
           )}
            {product.valueScore && (
              <p className="text-sm font-medium text-green-700 mt-1">
            ⚡ {product.valueScore} RSD/g proteina
           </p>
           )}
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
  Kupi →
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
          <Card className="mt-8">
    <CardContent className="p-6">
      <h2 className="text-lg font-bold text-slate-800 mb-6">Trend cene</h2>
      
      <div className="h-64 w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            // Sortiramo podatke da idu od najstarijeg datuma ka najnovijem
            data={[...product.priceHistory]
              .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
              .map(h => ({
                datum: new Date(h.timestamp).toLocaleDateString("sr-RS", { day: "2-digit", month: "2-digit" }),
                cena: h.price
              }))}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="datum" 
              axisLine={false} 
              tickLine={false} 
              tick={{fill: '#94a3b8', fontSize: 12}}
              dy={10}
            />
            <YAxis 
              hide // Možeš sakriti Y osu za moderniji izgled ili ostaviti sa tickFormatter-om
              domain={['dataMin - 500', 'dataMax + 500']} 
            />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
            />
            <Line 
              type="monotone" 
              dataKey="cena" 
              stroke="#16a34a"
              strokeWidth={3} 
              dot={{ r: 4, fill: "#16a34a", strokeWidth: 2, stroke: "#fff" }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-8 space-y-2 border-t border-slate-100 pt-4">
        <p className="text-xs font-semibold text-slate-400 uppercase mb-3">Hronološki pregled</p>
        {product.priceHistory.map((h, i) => (
          <div key={i} className="flex justify-between items-center py-1">
             <span className="text-slate-500 text-sm">
                {new Date(h.timestamp).toLocaleDateString("sr-RS")}
             </span>
             <span className="text-sm font-medium text-slate-700">{h.price} RSD</span>
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