import { CURRENT_MARKET, MARKET_CONFIG } from "@/lib/marketConfig";

interface Props {
  numericPrice: number;
  proteinPer100g: number | null;
  primaryWeightGrams: number | null;
  size?: "sm" | "md";
}

type Tier = { label: string; valueCls: string; badgeCls: string };

const { currency } = MARKET_CONFIG[CURRENT_MARKET];
const isEur = currency === "EUR";

function getTier(v: number): Tier {
  if (isEur) {
    if (v < 0.05) return { label: "Odlična vrijednost", valueCls: "text-green-700", badgeCls: "bg-green-100 text-green-700" };
    if (v <= 0.09) return { label: "Prosječna vrijednost", valueCls: "text-amber-700", badgeCls: "bg-amber-100 text-amber-700" };
    return { label: "Visoka cijena", valueCls: "text-red-700", badgeCls: "bg-red-100 text-red-700" };
  }
  if (v < 5)  return { label: "Odlična vrednost", valueCls: "text-green-700", badgeCls: "bg-green-100 text-green-700" };
  if (v <= 9) return { label: "Prosečna vrednost", valueCls: "text-amber-700",  badgeCls: "bg-amber-100  text-amber-700"  };
  return       { label: "Visoka cena",          valueCls: "text-red-700",   badgeCls: "bg-red-100   text-red-700"   };
}

export default function PricePerGramBadge({
  numericPrice,
  proteinPer100g,
  primaryWeightGrams,
  size = "sm",
}: Props) {
  if (!numericPrice || !proteinPer100g || !primaryWeightGrams) return null;
  if (numericPrice <= 0 || proteinPer100g <= 0 || primaryWeightGrams <= 0) return null;

  const v = numericPrice / ((proteinPer100g / 100) * primaryWeightGrams);
  if (!isFinite(v) || v > 50) return null;

  const tier = getTier(v);
  const isMd = size === "md";

  const metricSize = isMd ? "text-base" : "text-xs md:text-sm";
  const pillSize   = isMd ? "text-sm px-3 py-1" : "text-[10px] md:text-xs px-2 py-0.5";

  return (
    <div className="flex items-start gap-1">
      {/* 🏷️ fixed in its own column */}
      <span className={`font-bold leading-none pt-px ${metricSize} ${tier.valueCls}`}>🏷️</span>

      {/* Number + pill in the same column → pill aligns with number */}
      <div className="flex flex-col gap-1">
        <p className={`font-bold leading-none ${metricSize}`}>
          <span className={tier.valueCls}>{v.toFixed(isEur ? 2 : 1)}</span>
          <span className="text-[#8A8A9A] font-normal"> {currency}/g proteina</span>
        </p>
        <span className={`inline-flex items-center w-fit rounded-full font-semibold leading-none ${tier.badgeCls} ${pillSize}`}>
          {tier.label}
        </span>
      </div>
    </div>
  );
}
