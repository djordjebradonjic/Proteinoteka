import Link from "next/link";
import Image from "next/image";
import { Package } from "lucide-react";
import { Product } from "@/types/product";
import { productUrl } from "@/lib/productUrl";
import PriceTag from "@/components/PriceTag";

interface Props { product: Product }

function vsConfig(vs: number) {
  if (vs >= 8.0) return { bg: "bg-green-50",  border: "border-green-200",  text: "text-green-500",  dot: "🏆", label: "Izuzetna", color: "#86efac" };
  if (vs >= 6.5) return { bg: "bg-green-50",  border: "border-green-100",  text: "text-green-600",  dot: "✅", label: "Dobra",     color: "#22c55e" };
  if (vs >= 5.0) return { bg: "bg-amber-50",  border: "border-amber-100",  text: "text-amber-500",  dot: "➡️", label: "Prosečna", color: "#f59e0b" };
  return          { bg: "bg-orange-50", border: "border-orange-100", text: "text-orange-600", dot: "⚠️", label: "Slaba",     color: "#ea580c" };
}

export default function FeaturedValueCard({ product }: Props) {
  const vs  = product.valueScore;
  const cfg = vs != null ? vsConfig(vs) : null;

  const ppg =
    product.numericPrice && product.proteinPer100g && product.primaryWeightGrams
      ? product.numericPrice / ((product.proteinPer100g / 100) * product.primaryWeightGrams)
      : null;

  const detailUrl = productUrl(product);

  return (
    <div className="flex-shrink-0 w-[calc(50%-8px)] sm:w-56 bg-white rounded-2xl border border-slate-100 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 flex flex-col overflow-hidden">

      {/* Image */}
      <Link href={detailUrl} className="block">
        <div className="h-40 bg-slate-50 flex items-center justify-center p-4">
          {product.imageUrl ? (
            <Image src={product.imageUrl} alt={product.name} width={120} height={120}
              className="object-contain max-h-full" referrerPolicy="no-referrer-when-downgrade" />
          ) : (
            <Package className="w-12 h-12 text-slate-200" />
          )}
        </div>
      </Link>

      {/* Body */}
      <div className="flex flex-col flex-1 p-3 gap-2">
        {product.brand && (
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium truncate">{product.brand}</p>
        )}

        <Link href={detailUrl}>
          <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2 hover:text-[#FF9900] transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Value Score hero block */}
        {vs != null && cfg && (
          <div className={`${cfg.bg} border ${cfg.border} rounded-xl p-3`}>
            <p className="text-[10px] text-slate-400 font-semibold mb-1 uppercase tracking-wide">Value Score</p>
            <p className={`text-3xl font-bold ${cfg.text} leading-none`}>
              {vs.toFixed(1)}
              <span className="text-sm font-normal opacity-50"> /10</span>
            </p>
            <span className={`inline-flex items-center gap-1 mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
              {cfg.dot} {cfg.label}
            </span>
            {product.percentileRank != null && product.percentileRank >= 10 && (
              <p className={`mt-1 text-[9px] ${cfg.text} opacity-70`}>
                Bolje od {product.percentileRank}% proteina
              </p>
            )}
          </div>
        )}

        {/* Price + RSD/g */}
        <div className="mt-auto pt-1">
          <PriceTag price={product.numericPrice} className="text-lg font-semibold text-slate-900" />
          {ppg != null && ppg < 50 && (
            <p className="text-xs text-slate-400">🏷️ {ppg.toFixed(1)} RSD/g proteina</p>
          )}
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
