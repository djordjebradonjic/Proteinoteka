import Link from "next/link";
import Image from "next/image";
import { Package } from "lucide-react";
import { Product } from "@/types/product";
import { productUrl } from "@/lib/productUrl";
import { trackEvent } from "@/lib/trackEvent";

interface Props { product: Product }

function fmtPrice(n: number): string {
  return Math.round(n).toLocaleString("de-DE").replace(".", ".") + " RSD";
}

export default function FeaturedPriceDropCard({ product }: Props) {
  const curr    = product.numericPrice;
  const prev    = product.previousPrice ?? null;
  const hasDrop = prev != null && prev > curr && curr > 0;

  const dropPct = hasDrop ? Math.round(((prev! - curr) / prev!) * 100) : 0;
  const savings  = hasDrop ? Math.round(prev! - curr) : 0;

  const buyUrl    = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/${product.id}/buy`;
  const detailUrl = productUrl(product);

  return (
    <div className="flex-shrink-0 w-56 bg-white rounded-2xl border border-slate-100 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 flex flex-col overflow-hidden">

      {/* Image */}
      <Link href={detailUrl} className="block relative">
        <div className="h-40 bg-slate-50 flex items-center justify-center p-4">
          {product.imageUrl ? (
            <Image src={product.imageUrl} alt={product.name} width={120} height={120}
              className="object-contain max-h-full" referrerPolicy="no-referrer-when-downgrade" />
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
        {product.brand && (
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium truncate">{product.brand}</p>
        )}

        <Link href={detailUrl}>
          <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2 hover:text-[#FF9900] transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Price drop hero block */}
        {hasDrop ? (
          <div className="bg-red-50 border border-red-100 rounded-xl p-3">
            <p className="text-2xl font-bold text-red-600 leading-none mb-2">
              🔥 -{dropPct}%
            </p>
            <div className="flex items-baseline gap-2 flex-wrap">
              {prev != null && (
                <span className="text-sm line-through text-slate-400">{fmtPrice(prev)}</span>
              )}
              <span className="text-lg font-bold text-slate-900">{product.price}</span>
            </div>
            {savings > 0 && (
              <p className="text-sm text-green-600 font-semibold mt-1.5">
                Uštedite {savings.toLocaleString("de-DE")} RSD
              </p>
            )}
          </div>
        ) : (
          <div className="mt-auto pt-1">
            <p className="text-lg font-semibold text-slate-900">{product.price}</p>
          </div>
        )}

        {/* Price when no drop data */}
        {!hasDrop && (
          <p className="text-lg font-semibold text-slate-900 mt-auto">{product.price}</p>
        )}

        {/* CTA */}
        <a
          href={buyUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent({ eventType: "CLICK_OUT", productId: product.id, store: product.storeName })}
          className="block w-full text-center bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-2.5 rounded-xl transition-colors mt-1"
        >
          Kupi po novoj ceni
        </a>
      </div>
    </div>
  );
}
