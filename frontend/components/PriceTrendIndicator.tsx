import { CURRENT_MARKET } from "@/lib/marketConfig";

interface Props {
  currentPrice: number;
  previousPrice: number | null | undefined;
}

export function PriceTrendIndicator({ currentPrice, previousPrice }: Props) {
  if (previousPrice == null || previousPrice <= 0 || currentPrice === previousPrice) return null;

  const dropped = currentPrice < previousPrice;
  const pct = Math.round(Math.abs((currentPrice - previousPrice) / previousPrice) * 100);
  if (pct < 1) return null;

  const IS_HR = CURRENT_MARKET === "hr";
  const dropLabel  = IS_HR ? `Cijena pala za ${pct}%`    : `Cena pala za ${pct}%`;
  const raiseLabel = IS_HR ? `Cijena porasla za ${pct}%` : `Cena porasla za ${pct}%`;

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ${
        dropped
          ? "bg-green-100 text-green-700"
          : "bg-red-100 text-red-600"
      }`}
      title={dropped ? dropLabel : raiseLabel}
    >
      {dropped ? "▼" : "▲"} {pct}%
    </span>
  );
}
