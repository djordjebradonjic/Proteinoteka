import Link from "next/link";
import Image from "next/image";
import { Package } from "lucide-react";
import { Product } from "@/types/product";
import { productUrl } from "@/lib/productUrl";
import PriceTag from "@/components/PriceTag";
import { getScoreConfig } from "@/lib/scoreColor";
import CreatinePriceMeta from "@/components/creatine/CreatinePriceMeta";

// Same shell as the protein FeaturedValueCard, but the protein-only "RSD/g proteina" line (which needs
// proteinPer100g — a field creatine products don't have) is replaced with CreatinePriceMeta's
// price-per-100g / price-per-serving, reusing the same formatting the rest of the creatine section uses.

interface Props { product: Product }

export default function CreatineFeaturedValueCard({ product }: Props) {
  const vs = product.valueScore;
  const cfg = vs != null ? getScoreConfig(vs) : null;
  const detailUrl = productUrl(product);

  return (
    <div className="flex-shrink-0 w-[calc(50%-8px)] sm:w-56 bg-white rounded-2xl border border-slate-100 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 flex flex-col overflow-hidden">

      {/* Image */}
      <Link href={detailUrl} className="block">
        <div className="h-40 bg-slate-50 flex items-center justify-center p-4">
          {product.imageUrl ? (
            <Image src={product.imageUrl} alt={product.name} width={120} height={120}
              className="object-contain max-h-full" referrerPolicy="no-referrer-when-downgrade" unoptimized />
          ) : (
            <Package className="w-12 h-12 text-slate-200" />
          )}
        </div>
      </Link>

      {/* Body */}
      <div className="flex flex-col flex-1 p-3 gap-2">
        <div className="flex items-center justify-between gap-1">
          {product.brand && (
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium truncate">{product.brand}</p>
          )}
          {product.primaryWeightGrams && (
            <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">{product.primaryWeightGrams}g</span>
          )}
        </div>

        <Link href={detailUrl}>
          <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2 hover:text-[#FF9900] transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Value Score hero block */}
        {vs != null && cfg && (
          <div className={`${cfg.bg} border ${cfg.border} rounded-xl p-2 sm:p-3`}>
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Value Score</p>
              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                {cfg.dot} {cfg.label}
              </span>
            </div>
            <p className={`text-2xl sm:text-3xl font-bold ${cfg.text} leading-none mt-1`}>
              {vs.toFixed(1)}
              <span className="text-sm font-normal opacity-50"> /10</span>
            </p>
            {product.percentileRank != null && product.percentileRank >= 10 && (
              <p className={`mt-1 text-[9px] ${cfg.text} opacity-70 hidden sm:block`}>
                Bolji od {product.percentileRank}% kreatina
              </p>
            )}
          </div>
        )}

        {/* Price + price-per-100g / per-serving */}
        <div className="mt-auto pt-1">
          <PriceTag price={product.numericPrice} className="text-lg font-semibold text-slate-900" />
          <CreatinePriceMeta product={product} size="sm" />
        </div>

        {/* CTA */}
        <Link
          href={detailUrl}
          className="block w-full text-center bg-[#1B2B4B] hover:bg-[#243860] text-white text-sm font-bold py-2.5 rounded-xl transition-colors mt-1"
        >
          Detalji →
        </Link>
      </div>
    </div>
  );
}
