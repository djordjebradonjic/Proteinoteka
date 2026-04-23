"use client";

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
    if (wished) dispatch(decrement());
    else dispatch(increment());
    setWished(!wished);
  };

  return (
    <div className="group flex flex-col bg-white overflow-hidden transition-all duration-200">
      {/* Slika */}
      <div className="relative flex items-center justify-center bg-[#F5F5F5] p-4 md:p-6 h-40 md:h-56">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            referrerPolicy="no-referrer-when-downgrade"
            className="h-full w-full object-contain transition-transform duration-200 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-slate-100 rounded flex items-center justify-center text-slate-400 text-xs">
            Nema slike
          </div>
        )}
        <button
          onClick={toggleWish}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-white shadow-sm hover:scale-110 transition-transform"
          aria-label="Dodaj u wish listu"
        >
          <Heart
            className="w-4 h-4 md:w-5 md:h-5"
            strokeWidth={1.8}
            fill={wished ? "#ef4444" : "none"}
            color={wished ? "#ef4444" : "#CBD5E1"}
          />
        </button>
      </div>

      {/* Sadržaj */}
      <div className="flex flex-col flex-1 px-2 md:px-3 pt-2 md:pt-3 pb-0 gap-1">
        {/* Brand + Prodavnica */}
        <div className="flex items-center justify-between h-5">
          <p className="text-[10px] md:text-[11px] font-medium text-[#8A8A9A] uppercase tracking-widest truncate max-w-[60%]">
            {product.brand}
          </p>
          <span className="text-[9px] md:text-[10px] font-medium text-[#5A6478] bg-[#F5F5F5] px-1.5 py-0.5 rounded shrink-0">
            {product.storeName}
          </span>
        </div>

        {/* Naziv */}
        <h3 className="font-bold text-[#1A1A1A] text-xs md:text-sm leading-snug line-clamp-2 h-8 md:h-10 uppercase">
          {product.name}
        </h3>

        {/* Cena */}
        <p className="text-sm md:text-base font-semibold text-[#1A1A1A] h-6 flex items-center">
          {product.price.toLocaleString()}
          <span className="text-[10px] font-medium text-[#8A8A9A] ml-1">
            RSD
          </span>
        </p>

        {/* Value score */}
        <div className="h-6">
          {product.valueScore && (
            <div className="inline-flex items-center gap-0.5 bg-[#FFF8EC] text-[#b36b00] text-[10px] md:text-xs font-semibold px-1.5 py-0.5 rounded w-fit border border-[#FFD980]">
              ⚡ {product.valueScore} RSD/g
            </div>
          )}
        </div>

        {/* Proteini */}
        <div className="h-4 mb-1">
          {product.proteinPer100g && (
            <p className="text-[10px] md:text-xs text-[#4A5568]">
              🥩 {product.proteinPer100g}g/100g
            </p>
          )}
        </div>
      </div>

      {/* Dugmad — fiksno na dnu */}
      <div className="flex flex-col gap-1.5 mt-auto px-2 pb-2 pt-3">
        <Link
          href={`/product/${product.id}`}
          className="w-full bg-[#1B2B4B] text-white font-bold text-xs md:text-sm py-2.5 md:py-3 text-center hover:bg-[#243860] transition-colors uppercase tracking-wide rounded-md"
        >
          Detalji
        </Link>
        <a
          href={product.productUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-[#FFF0D6] hover:bg-[#FFE4B5] text-[#CC7700] font-medium text-xs md:text-sm py-2 md:py-2.5 text-center transition-colors uppercase tracking-wide rounded-md border border-[#FFD580]"
        >
          Kupi
        </a>
      </div>
    </div>
  );
}
