import { formatPrice } from "@/lib/formatPrice";
import { CREATINE_COPY, pricePer100g, pricePerServing, type CreatineLike } from "@/lib/creatine";

/**
 * What a creatine costs per 100 g of powder and per serving — the numbers people actually compare.
 * A piece pack has no gram price (its creatine content is rarely stated), so it shows the serving price only.
 */
export default function CreatinePriceMeta({ product, size = "sm" }: { product: CreatineLike; size?: "sm" | "md" }) {
  const per100 = pricePer100g(product);
  const perServing = pricePerServing(product);
  if (per100 == null && perServing == null) return null;

  const main = size === "md" ? "text-lg" : "text-xs md:text-sm";
  const sub = size === "md" ? "text-base" : "text-[10px] md:text-xs";

  return (
    <div className="flex flex-col gap-0.5">
      {per100 != null && (
        <p className={`font-bold leading-none ${main} text-[#1B2B4B]`}>
          <span aria-hidden>🏷️ </span>
          {formatPrice(per100)}
          <span className="font-normal text-[#8A8A9A]"> / 100 g</span>
        </p>
      )}
      {perServing != null && (
        <p className={`leading-none ${sub} text-[#5A6478]`}>
          {CREATINE_COPY.product.perServing.toLowerCase()}: <span className="font-semibold">{formatPrice(perServing)}</span>
        </p>
      )}
    </div>
  );
}
