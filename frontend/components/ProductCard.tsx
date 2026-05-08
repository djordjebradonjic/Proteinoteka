"use client";

import { useEffect, useState } from "react";
import { Product } from "@/types/product";
import Image from "next/image";
import Link from "next/link";
import { PriceTrendIndicator } from "@/components/PriceTrendIndicator";
import PricePerGramBadge from "@/components/PricePerGramBadge";
import { Heart } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addToWishlist,
  removeFromWishlist,
  openWishlist,
  closeWishlist,
} from "@/store/wishlistSlice";
import { addToCompare, removeFromCompare } from "@/store/compareSlice";
import { trackEvent } from "@/lib/trackEvent";

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

export default function ProductCard({ product, priority = false }: ProductCardProps) {
  const dispatch = useAppDispatch();
  const [mounted, setMounted] = useState(false);
  const [imgError, setImgError] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const wishlistItems = useAppSelector(
    (state) => (state as any).wishlist.items,
  ) as any[];
  const wished = mounted && wishlistItems.some((p: any) => p.id === product.id);

  const compareIds = useAppSelector(
    (state) => (state as any).compare.ids,
  ) as number[];
  const isComparing = compareIds.includes(product.id);
  const compareCount = compareIds.length;

  const toggleWish = (e: React.MouseEvent) => {
    e.preventDefault();
    if (wished) {
      dispatch(removeFromWishlist(product.id));
    } else {
      dispatch(addToWishlist(product));
      dispatch(openWishlist());
      setTimeout(() => {
        dispatch(closeWishlist());
      }, 1500);
    }
  };

  const toggleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isComparing) {
      dispatch(removeFromCompare(product.id));
    } else if (compareCount < 4 && product.id && typeof product.id === "number") {
      dispatch(addToCompare({ id: product.id, name: product.name }));
      trackEvent({ eventType: "COMPARE_CLICK", productId: product.id, store: product.storeName });
    }
  };

  const productHref = product.id ? `/product/${product.id}` : "/";

  const vs = product.valueScore;
  const vsBg =
    vs == null || vs <= 0 ? null
    : vs >= 9.0 ? "#22c55e"
    : vs >= 8.0 ? "#16a34a"
    : vs >= 7.0 ? "#FF9900"
    : vs >= 6.0 ? "#f97316"
    : "#ef4444";
  const vsLabel =
    vs == null || vs <= 0 ? null
    : vs >= 9.0 ? "Best in class"
    : vs >= 8.0 ? "Odlična kupovina"
    : vs >= 7.0 ? "Dobar izbor"
    : vs >= 6.0 ? "Prosečno"
    : "Ne preporučuje se";

  const saveScrollAndTrack = () => {
    sessionStorage.setItem(
      `scroll:${window.location.pathname}${window.location.search}`,
      String(window.scrollY),
    );
    if (product.id && typeof product.id === "number")
      trackEvent({ eventType: "PRODUCT_VIEW", productId: product.id, store: product.storeName });
  };

  return (
    <div
      className={`group relative flex flex-col overflow-hidden transition-all duration-200 h-full rounded-lg cursor-pointer ${
        isComparing
          ? "bg-[#FFF3DC] shadow-[0_0_0_3px_rgba(255,180,0,0.4),0_4px_16px_rgba(255,153,0,0.2)] scale-[1.02]"
          : "bg-white"
      }`}
    >
      <Link
        href={productHref}
        className="absolute inset-0 z-[1]"
        aria-label={product.name}
        onClick={saveScrollAndTrack}
      />
      {/* Slika */}
      <div className="relative flex items-center justify-center bg-[#F5F5F5] p-4 md:p-6 h-40 md:h-56">
        {product.imageUrl && !imgError ? (
          <div className="relative w-full h-full">
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 300px"
              className="object-contain transition-transform duration-200 group-hover:scale-105"
              priority={priority}
              referrerPolicy="no-referrer-when-downgrade"
              onError={() => setImgError(true)}
            />
          </div>
        ) : product.storeName?.toLowerCase().includes("pansport") ? (
          <div className="relative w-full h-full">
            <Image
              src="/protein-gym.jpg"
              alt={product.name}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 300px"
              className="object-contain transition-transform duration-200 group-hover:scale-105"
            />
          </div>
        ) : (
          <div className="w-full h-full bg-slate-100 rounded flex items-center justify-center text-slate-400 text-xs">
            Nema slike
          </div>
        )}

        {/* Gornji levi — Compare */}
        <button
          onClick={toggleCompare}
          className={`absolute top-2 left-2 z-10 flex items-center gap-1 px-1.5 py-1 rounded text-[10px] font-semibold transition-all border-2 ${
            isComparing
              ? "bg-white/90 text-[#FF9900] border-[#FF9900]"
              : compareCount >= 4
                ? "bg-slate-100 text-slate-300 cursor-not-allowed border-transparent"
                : "bg-white/90 text-slate-500 hover:bg-white hover:text-[#FF9900] shadow-sm border-transparent hover:border-[#FF9900]"
          }`}
          disabled={compareCount >= 4 && !isComparing}
          aria-label={`Uporedi: ${product.name}`}
        >
          <span
            className={`w-5 h-5 border-2 rounded-sm flex items-center justify-center shrink-0 ${
              isComparing ? "bg-[#FF9900] border-[#FF9900]" : "border-slate-400"
            }`}
          >
            {isComparing && (
              <span className="text-[#1B2B4B] text-xs font-black">✓</span>
            )}
          </span>
          <span className="text-[10px]">Uporedi</span>
        </button>

        {/* Gornji desni — Wishlist */}
        <button
          onClick={toggleWish}
          className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-white shadow-sm hover:scale-110 transition-transform"
          aria-label={wished ? `Ukloni ${product.name} sa liste željenih` : `Dodaj ${product.name} na listu željenih`}
        >
          <Heart
            className="w-4 h-4 md:w-5 md:h-5"
            strokeWidth={1.8}
            fill={wished ? "#FF6B00" : "none"}
            color={wished ? "#FF6B00" : "#CBD5E1"}
          />
        </button>

        {/* Value Score badge — bottom of image */}
        {vsBg && vs != null && (
          <div className="absolute bottom-2 inset-x-2 z-10 flex justify-center pointer-events-none">
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white shadow-lg"
              style={{ backgroundColor: vsBg }}
            >
              <span className="text-xs leading-none">⚡</span>
              <span className="text-sm font-black tabular-nums leading-none">{vs.toFixed(1)}</span>
              <span className="hidden sm:block text-[9px] font-semibold uppercase tracking-widest opacity-90 leading-none">
                {vsLabel}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Sadržaj */}
      <div className="flex flex-col flex-1 px-2 md:px-3 pt-2 md:pt-3 pb-0 gap-1">
        <div className="flex items-center justify-between h-5">
          <p className="text-[10px] md:text-[11px] font-medium text-[#8A8A9A] uppercase tracking-widest truncate max-w-[60%]">
            {product.brand}
          </p>
          <span className="text-[9px] md:text-[10px] font-medium text-[#5A6478] bg-[#F5F5F5] px-1.5 py-0.5 rounded shrink-0">
            {product.storeName}
          </span>
        </div>

        <h3 className="font-bold text-[#1A1A1A] text-xs md:text-sm leading-snug line-clamp-2 h-8 md:h-10 uppercase">
          {product.name}
        </h3>

        <p className="text-sm md:text-base font-semibold text-[#1A1A1A] h-6 flex items-center gap-1">
          {product.price.toLocaleString()}
          <span className="text-[10px] font-medium text-[#8A8A9A]">
            RSD
          </span>
          <PriceTrendIndicator currentPrice={product.numericPrice} previousPrice={product.previousPrice} />
        </p>

        <div className="mb-1">
          <PricePerGramBadge
            numericPrice={product.numericPrice}
            proteinPer100g={product.proteinPer100g}
            primaryWeightGrams={product.primaryWeightGrams}
          />
        </div>
        <div className="h-4">
          {product.proteinPer100g && (
            <p className="text-xs text-[#9CA3AF]">
              🥩 {product.proteinPer100g}g/100g
            </p>
          )}
        </div>
      </div>

      {/* Dugme */}
      <div className="relative z-10 flex flex-col gap-1.5 mt-auto px-2 pb-2 pt-3">
        <Link
          href={productHref}
          onClick={saveScrollAndTrack}
          className="w-full bg-[#1B2B4B] text-white font-bold text-xs md:text-sm py-2.5 md:py-3 text-center hover:bg-[#243860] transition-colors uppercase tracking-wide rounded-md"
        >
          Detalji
        </Link>
      </div>
    </div>
  );
}
