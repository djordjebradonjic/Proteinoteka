interface Props {
  currentPrice: number;
  previousPrice: number | null | undefined;
}

export function PriceTrendIndicator({ currentPrice, previousPrice }: Props) {
  if (previousPrice == null || currentPrice === previousPrice) return null;

  const dropped = currentPrice < previousPrice;
  return (
    <span
      className={`text-[11px] font-black leading-none ${dropped ? "text-green-500" : "text-red-500"}`}
      title={dropped ? "Cena je pala" : "Cena je porasla"}
      aria-label={dropped ? "Cena je pala" : "Cena je porasla"}
    >
      {dropped ? "▼" : "▲"}
    </span>
  );
}
