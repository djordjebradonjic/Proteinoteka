import Link from "next/link";
import Image from "next/image";
import { Product } from "@/types/product";
import { productUrl } from "@/lib/productUrl";
import PriceTag from "@/components/PriceTag";
import { getScoreColor, getScoreBg } from "@/lib/scoreColor";

export function SEOProductCard({ product, rank }: { product: Product; rank: number }) {
  const score = product.valueScore;
  const pricePerProtein =
    product.numericPrice && product.proteinPer100g && product.primaryWeightGrams
      ? (product.numericPrice / ((product.proteinPer100g / 100) * product.primaryWeightGrams)).toFixed(0)
      : null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex gap-3 hover:shadow-md hover:border-[#FF9900] transition-all duration-150">
      {/* Rank */}
      <div className="shrink-0 w-8 h-8 rounded-full bg-[#131921] text-white text-sm font-black flex items-center justify-center mt-0.5">
        {rank}
      </div>

      {/* Image */}
      {product.imageUrl && (
        <div className="shrink-0 w-14 h-14 bg-slate-50 rounded-lg overflow-hidden flex items-center justify-center border border-slate-100">
          <Image
            src={product.imageUrl}
            alt={product.name}
            width={56}
            height={56}
            className="w-full h-full object-contain p-1"
            unoptimized
          />
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <Link
          href={productUrl(product)}
          className="font-semibold text-slate-900 text-sm hover:text-[#FF9900] line-clamp-2 leading-snug"
        >
          {product.name}
        </Link>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {product.brand && (
            <span className="text-[10px] text-slate-500">{product.brand}</span>
          )}
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
            {product.storeName}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <PriceTag price={product.numericPrice} className="text-base font-black text-slate-900" />
          {score != null && (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: getScoreBg(score), color: getScoreColor(score) }}
            >
              ⚡ {score.toFixed(1)}/10
            </span>
          )}
          {product.proteinPer100g != null && (
            <span className="text-[10px] text-slate-500">🥩 {product.proteinPer100g}g/100g</span>
          )}
          {pricePerProtein && (
            <span className="text-[10px] text-slate-400">{pricePerProtein} RSD/g proteina</span>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="shrink-0 flex flex-col justify-center">
        <Link
          href={productUrl(product)}
          className="px-3 py-2 rounded-lg bg-[#131921] hover:bg-[#243860] text-white text-xs font-bold whitespace-nowrap transition-colors"
        >
          Pogledaj →
        </Link>
      </div>
    </div>
  );
}
