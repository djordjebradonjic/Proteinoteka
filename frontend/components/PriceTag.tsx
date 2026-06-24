"use client";

import { CURRENT_MARKET, MARKET_CONFIG } from "@/lib/marketConfig";

interface Props {
  price: number | null | undefined;
  className?: string;
  currencyClassName?: string;
}

export default function PriceTag({ price, className = "text-base font-bold text-slate-900", currencyClassName }: Props) {
  if (price == null || price <= 0) return <span className={className}>—</span>;

  const { currency, locale } = MARKET_CONFIG[CURRENT_MARKET];
  const formattedNumber = currency === "RSD"
    ? Math.round(price).toLocaleString("de-DE")
    : price.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <span className={className}>
      {formattedNumber}
      <span className={currencyClassName ?? "text-[0.7em] font-medium text-[#8A8A9A] ml-1"}>{currency}</span>
    </span>
  );
}
