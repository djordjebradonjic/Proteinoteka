"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/types/product";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useState } from "react";
import { useAppDispatch } from "@/store/hooks";
import { increment, decrement } from "@/store/wishlistSlice";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [wished, setWished] = useState(false);
  const dispatch = useAppDispatch();

  const toggleWish = (e: React.MouseEvent) => {
    e.preventDefault();
    if (wished) {
      dispatch(decrement());
    } else {
      dispatch(increment());
    }
    setWished(!wished);
  };

  return (
    <div className="group flex flex-col bg-[#FFFDF7] rounded-xl border border-[#F0EDE6] transition-all duration-200 hover:-translate-y-1 overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_28px_rgba(255,153,0,0.12)]">
      {/* Slika */}
      <div className="relative p-3 md:p-4 flex items-center justify-center h-36 md:h-44 bg-white">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            referrerPolicy="no-referrer-when-downgrade"
            className="h-full object-contain transition-transform duration-200 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-slate-100 rounded flex items-center justify-center text-slate-400 text-sm">
            Nema slike
          </div>
        )}

        {/* Srce */}
        <button
          onClick={toggleWish}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-white shadow-sm hover:scale-110 transition-transform"
          aria-label="Dodaj u wish listu"
        >
          <Heart
            className="w-5 h-5 transition-colors"
            strokeWidth={1.8}
            fill={wished ? "#ef4444" : "none"}
            color={wished ? "#ef4444" : "#CBD5E1"}
          />
        </button>
      </div>

      {/* Sadržaj */}
      <div className="flex flex-col flex-1 px-3 md:px-4 pt-3 pb-3 md:pb-4 gap-1.5 md:gap-2">
        <div className="flex items-center justify-between h-5">
          {product.brand && (
            <p className="text-[11px] font-semibold text-[#8A8A9A] uppercase tracking-widest">
              {product.brand}
            </p>
          )}
          <span className="text-[11px] font-medium text-[#5A6478] bg-[#F1F5F9] border border-[#E2E8F0] px-2 py-0.5 rounded">
            {product.storeName}
          </span>
        </div>

        {/* Naziv */}
        <h3 className="font-semibold text-[#1A1A2E] text-sm leading-snug line-clamp-2 h-10">
          {product.name}
        </h3>

        {/* Cena */}
        <p className="text-lg md:text-2xl font-black text-[#1B2B4B] leading-none h-8 flex items-center">
          {product.price.toLocaleString()}{" "}
          <span className="text-sm font-semibold text-[#8A8A9A]">RSD</span>
        </p>

        {/* Value score badge */}
        <div className="h-7">
          {product.valueScore && (
            <div className="inline-flex items-center gap-1 bg-[#FFF8EC] text-[#b36b00] text-xs font-semibold px-2 py-1 rounded-md w-fit border border-[#FFD980]">
              ⚡ {product.valueScore} RSD/g proteina
            </div>
          )}
        </div>

        <div className="h-5">
          {product.proteinPer100g && (
            <p className="text-xs text-[#4A5568]">
              🥩 {product.proteinPer100g}g proteina/100g
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 mt-auto pt-2">
          <Link
            href={`/product/${product.id}`}
            className="w-full bg-[#1B2B4B] text-white font-bold text-sm py-2 rounded-md text-center hover:bg-[#243860] transition-colors"
          >
            Detalji
          </Link>
          <a
            href={product.productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#FFF3DC] hover:bg-[#FFE5A0] text-[#a86800] text-sm py-2 rounded-md text-center transition-colors border border-[#FFD580]"
          >
            Kupi
          </a>
        </div>
      </div>
    </div>
  );
}
