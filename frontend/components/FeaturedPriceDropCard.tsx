import Link from "next/link";
import Image from "next/image";
import { Package } from "lucide-react";
import { Product } from "@/types/product";
import { productUrl } from "@/lib/productUrl";
import { formatPrice } from "@/lib/formatPrice";
import PriceTag from "@/components/PriceTag";

interface Props { product: Product }

export default function FeaturedPriceDropCard({ product }: Props) {
  const curr    = product.numericPrice;
  const prev    = product.previousPrice ?? null;
  const hasDrop = prev != null && prev > curr && curr > 0;

  const dropPct = hasDrop ? Math.round(((prev! - curr) / prev!) * 100) : 0;
  const savings  = hasDrop ? Math.round(prev! - curr) : 0;

  const detailUrl = productUrl(product);

  return (
    <div className="flex-shrink-0 w-[calc(50%-8px)] sm:w-56 bg-white rounded-2xl border border-slate-100 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 flex flex-col overflow-hidden">

      {/* Image */}
      <Link href={detailUrl} className="block relative">
        <div className="h-40 bg-slate-50 flex items-center justify-center p-4">
          {product.imageUrl ? (
            <Image src={product.imageUrl} alt={product.name} width={120} height={120}
              className="object-contain max-h-full" referrerPolicy="no-referrer-when-downgrade" unoptimized />
          ) : (
            <Package className="w-12 h-12 text-slate-200" />
          )}
        </div>
        {hasDrop && (
          <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-black px-2.5 py-1 rounded-full shadow-md">
            -{dropPct}%
          </div>
        )}
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

        {/* Price drop hero block */}
        {hasDrop ? (
          <div className="bg-red-50 border border-red-100 rounded-xl p-2 sm:p-3">
            <div className="flex items-center justify-between">
              <p className="text-xl sm:text-2xl font-bold text-red-600 leading-none">🔥 -{dropPct}%</p>
              {savings > 0 && (
                <p className="text-[11px] text-green-600 font-semibold hidden sm:block">
                  Uštedite <PriceTag price={savings} className="text-[11px] text-green-600 font-semibold" currencyClassName="text-[0.85em] ml-0.5 text-green-500" />
                </p>
              )}
            </div>
            <div className="flex items-baseline gap-2 flex-wrap mt-1">
              {prev != null && (
                <span className="text-sm line-through text-slate-400"><PriceTag price={prev} className="text-sm line-through text-slate-400" currencyClassName="text-[0.85em] ml-0.5 text-slate-400" /></span>
              )}
              <PriceTag price={product.numericPrice} className="text-lg font-bold text-slate-900" />
            </div>
          </div>
        ) : (
          <div className="mt-auto pt-1">
            <PriceTag price={product.numericPrice} className="text-lg font-semibold text-slate-900" />
          </div>
        )}

        {/* CTA */}
        <Link
          href={detailUrl}
          className="block w-full text-center bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-2.5 rounded-xl transition-colors mt-1"
        >
          Detalji →
        </Link>
      </div>
    </div>
  );
}
