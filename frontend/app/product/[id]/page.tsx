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
    // Koristimo axios instancu koju si već definisao
    api.get(`/products/${id}`)
      .then((res) => setProduct(res.data))
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <ProductSkeleton />; // Izdvojio sam skeleton radi preglednosti

  if (!product) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-slate-500 font-medium">Proizvod nije pronađen</p>
          <Button className="mt-4" variant="outline" onClick={() => router.push("/")}>Povratak na početnu</Button>
        </div>
      </main>
    );
  }

  // Formatiranje podataka za grafikon
  const chartData = [...(product.priceHistory || [])]
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map(h => ({
      datum: new Date(h.timestamp).toLocaleDateString("sr-RS", { day: "2-digit", month: "short" }),
      cena: typeof h.price === 'string' ? parseFloat(h.price.replace(/[^0-9]/g, '')) : h.price,
      punaCena: h.price
    }));

  return (
    <main className="min-h-screen bg-slate-50 pb-12">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button onClick={() => router.back()} className="text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-1 text-sm mb-6">
          ← Nazad na listu
        </button>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Slika Proizvoda */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 flex items-center justify-center aspect-square shadow-sm">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="max-h-full w-auto object-contain hover:scale-105 transition-transform duration-300" />
            ) : (
              <div className="text-slate-300 italic">Nema dostupne fotografije</div>
            )}
          </div>

          {/* Info Sekcija */}
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-2">
              {product.brand && <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none">{product.brand}</Badge>}
              <Badge variant="outline" className="text-slate-500">{product.storeName}</Badge>
            </div>

            <h1 className="text-3xl font-extrabold text-slate-900 leading-tight">{product.name}</h1>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">Trenutna cena</p>
                  <p className="text-4xl font-black text-green-600">{product.price} <span className="text-lg">RSD</span></p>
                </div>
                {product.valueScore && (
                   <div className="text-right">
                      <p className="text-xs text-slate-400 font-bold uppercase">Isplativost</p>
                      <p className="text-sm font-bold text-blue-600">{product.valueScore} RSD/g proteina</p>
                   </div>
                )}
              </div>
            </div>

            <Button asChild size="lg" className="w-full bg-blue-600 hover:bg-blue-700 text-lg h-14 rounded-xl shadow-lg shadow-blue-100">
              <a href={product.productUrl} target="_blank" rel="noopener noreferrer">Poseti prodavnicu →</a>
            </Button>
          </div>
        </div>

        {/* Grafikon Istorije Cena */}
        {chartData.length > 1 && (
          <Card className="mt-10 border-none shadow-sm overflow-hidden">
            <CardContent className="p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-8 flex items-center gap-2">
                <span className="w-2 h-6 bg-green-500 rounded-full"></span>
                Kretanje cene kroz vreme
              </h2>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="datum" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} dy={10} />
                    <YAxis hide domain={['dataMin - 200', 'dataMax + 200']} />
                    <Tooltip 
                      cursor={{ stroke: '#e2e8f0', strokeWidth: 2 }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl text-xs">
                              <p className="font-bold mb-1">{payload[0].payload.datum}</p>
                              <p className="text-green-400 text-sm">{payload[0].value} RSD</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line type="stepAfter" dataKey="cena" stroke="#16a34a" strokeWidth={4} dot={{ r: 0 }} activeDot={{ r: 6, fill: '#16a34a' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}

function ProductSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-20 animate-pulse">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="aspect-square bg-slate-200 rounded-2xl" />
        <div className="space-y-6">
          <div className="h-4 bg-slate-200 rounded w-1/4" />
          <div className="h-10 bg-slate-200 rounded w-full" />
          <div className="h-32 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}