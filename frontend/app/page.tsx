"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Product } from "@/types/product";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Pozivamo backend na http://localhost:8080/api/products
    api.get("/products")
      .then((res) => {
        setProducts(res.data);
      })
      .catch((err) => {
        console.error(err);
        setError("Ne mogu da povežem frontend sa backendom. Proveri @CrossOrigin!");
      });
  }, []);

  return (
    <main className="p-10 font-sans">
      <h1 className="text-3xl font-bold mb-6">Test Povezivanja: Proteinoteka</h1>
      
      {error && <p className="text-red-500 font-bold">{error}</p>}

      <div className="grid gap-2">
        {products.length > 0 ? (
          products.map((p) => (
            <div key={p.id} className="p-3 border border-slate-200 rounded">
              <span className="font-bold">{p.brand}</span> - {p.name} 
              <span className="ml-4 text-green-600 font-mono">{p.price} RSD</span>
            </div>
          ))
        ) : (
          !error && <p>Učitavam podatke iz baze... Proveri da li ti je upaljen Spring Boot.</p>
        )}
      </div>
    </main>
  );
}