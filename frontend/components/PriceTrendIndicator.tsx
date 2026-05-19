interface Props {
  currentPrice: number;
  previousPrice: number | null | undefined;
}

export function PriceTrendIndicator({ currentPrice, previousPrice }: Props) {
  if (previousPrice == null || previousPrice <= 0 || currentPrice === previousPrice) return null;

  const dropped = currentPrice < previousPrice;
  const pct = Math.round(Math.abs((currentPrice - previousPrice) / previousPrice) * 100);
  if (pct < 1) return null;

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ${
        dropped
          ? "bg-green-100 text-green-700"
          : "bg-red-100 text-red-600"
      }`}
      title={dropped ? `Cena pala za ${pct}%` : `Cena porasla za ${pct}%`}
    >
      {dropped ? "▼" : "▲"} {pct}%
    </span>
  );
}
