"use client";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  removeFromWishlist,
  clearWishlist,
  closeWishlist,
} from "@/store/wishlistSlice";
import { addToCompare, removeFromCompare } from "@/store/compareSlice";
import { X, Heart, ExternalLink, ShoppingCart, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { productUrl } from "@/lib/productUrl";
import { useEffect, useState } from "react";
import { analytics } from "@/lib/analytics";

function ValueBadge({ score }: { score: number }) {
  const color =
    score >= 9.0 ? "#22c55e"
      : score >= 7.0 ? "#16a34a"
      : score >= 5.5 ? "#FF9900"
      : score >= 4.0 ? "#f97316"
      : "#ef4444";
  const label =
    score >= 9.0 ? "Best in class"
      : score >= 7.0 ? "Odlična kupovina"
      : score >= 5.5 ? "Dobar izbor"
      : score >= 4.0 ? "Prosečno"
      : "Ne preporučuje se";
  return (
    <span
      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap"
      style={{ backgroundColor: color + "22", color }}
    >
      {score.toFixed(1)} · {label}
    </span>
  );
}

export default function WishlistDrawer() {
  const dispatch = useAppDispatch();
  const items = useAppSelector(
    (state) => (state as any).wishlist.items,
  ) as any[];
  const isOpen = useAppSelector((state) => (state as any).wishlist.isOpen);
  const compareIds = useAppSelector(
    (state) => (state as any).compare.ids,
  ) as number[];
  const compareCount = compareIds.length;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") dispatch(closeWishlist());
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [dispatch]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const toggleCompare = (productId: number, productName: string) => {
    if (compareIds.includes(productId)) {
      dispatch(removeFromCompare(productId));
    } else if (compareCount < 4) {
      dispatch(addToCompare({ id: productId, name: productName }));
    }
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-[100] transition-opacity"
          onClick={() => dispatch(closeWishlist())}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-4 right-0 max-h-[90vh] w-[85vw] sm:w-[400px] bg-white z-[101] shadow-2xl flex flex-col transition-transform duration-300 ease-in-out rounded-l-2xl ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-[#FF9900]" fill="#FF9900" />
            <h2 className="font-bold text-slate-800 text-base">
              Lista željenih
            </h2>
            {mounted && items.length > 0 && (
              <span className="text-xs font-bold bg-[#FF9900] text-white px-2 py-0.5 rounded-full">
                {items.length}
              </span>
            )}
          </div>
          <button
            onClick={() => dispatch(closeWishlist())}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto">
          {!mounted || items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
              <Heart className="w-12 h-12 text-slate-200 mb-3" />
              <p className="font-semibold text-slate-400 text-sm">
                Lista je prazna
              </p>
              <p className="text-slate-400 text-xs mt-1">
                Klikni srce na proizvodu da ga dodaš ovde
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {items.filter((product: any) => product?.id != null).map((product: any) => {
                const isComparing = compareIds.includes(product.id);
                const isDisabled = compareCount >= 4 && !isComparing;

                return (
                  <li
                    key={product.id}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                      isComparing
                        ? "bg-[#FFF3DC] shadow-[inset_0_0_0_2px_rgba(255,180,0,0.4)]"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    {/* Slika */}
                    <div className="w-14 h-14 shrink-0 bg-slate-50 rounded-lg flex items-center justify-center overflow-hidden border border-slate-100">
                      {product.imageUrl ? (
                        <Image
                          src={product.imageUrl}
                          alt={product.name}
                          width={56}
                          height={56}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <Heart className="w-5 h-5 text-slate-300" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate leading-tight">
                        {product.name}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                        {product.brand && <span>{product.brand}</span>}
                        {product.brand && product.storeName && (
                          <span className="mx-1">·</span>
                        )}
                        {product.storeName && <span>{product.storeName}</span>}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs font-bold text-slate-800">
                          {product.price}
                        </span>
                        {product.valueScore != null && (
                          <ValueBadge score={product.valueScore} />
                        )}
                      </div>

                      {/* Compare dugme */}
                      <button
                        onClick={() => toggleCompare(product.id, product.name)}
                        disabled={isDisabled}
                        className={`mt-1.5 flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-all border ${
                          isComparing
                            ? "bg-white text-[#FF9900] border-[#FF9900]"
                            : isDisabled
                              ? "bg-slate-100 text-slate-300 border-transparent cursor-not-allowed"
                              : "bg-white text-slate-500 border-slate-200 hover:text-[#FF9900] hover:border-[#FF9900]"
                        }`}
                      >
                        <span
                          className={`w-3.5 h-3.5 border rounded-sm flex items-center justify-center shrink-0 ${
                            isComparing
                              ? "bg-[#FF9900] border-[#FF9900]"
                              : "border-slate-400"
                          }`}
                        >
                          {isComparing && (
                            <span className="text-white text-[8px] font-black">
                              ✓
                            </span>
                          )}
                        </span>
                        {isComparing
                          ? "U poređenju"
                          : isDisabled
                            ? "Maksimum 4"
                            : "Uporedi"}
                      </button>
                    </div>

                    {/* Akcije */}
                    <div className="flex flex-col items-center gap-1.5 shrink-0">
                      <Link
                        href={product.id ? productUrl(product) : "/"}
                        onClick={() => dispatch(closeWishlist())}
                        className="p-1.5 rounded-lg bg-[#131921] hover:bg-[#243860] text-white transition-colors"
                        aria-label="Pogledaj detalje"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                      <a
                        href={product.id ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/${product.id}/buy` : "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => analytics.outboundClick(product.id, product.name, product.storeName ?? "")}
                        className="p-1.5 rounded-lg bg-[#FF9900] hover:bg-[#e68a00] text-white transition-colors"
                        aria-label="Kupi"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => dispatch(removeFromWishlist(product.id))}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                        aria-label="Ukloni"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        {mounted && items.length > 0 && (
          <div className="border-t border-slate-100 px-4 py-3 flex items-center justify-between gap-3">
            <button
              onClick={() => dispatch(clearWishlist())}
              className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 font-medium transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Obriši sve
            </button>
            <span className="text-xs text-slate-400">
              {items.length} {items.length === 1 ? "proizvod" : "proizvoda"}
              {compareIds.length > 0 && (
                <span className="ml-2 text-[#FF9900] font-semibold">
                  · {compareIds.length} u poređenju
                </span>
              )}
            </span>
          </div>
        )}
      </div>
    </>
  );
}
