"use client";

import { formatPrice } from "@/lib/formatPrice";

interface Props {
  price: number | null | undefined;
  className?: string;
  currencyClassName?: string;
}

export default function PriceTag({ price, className = "text-base font-bold text-slate-900", currencyClassName }: Props) {
  if (price == null || price <= 0) return <span className={className}>—</span>;

  return (
    <span className={className}>
      {Math.round(price).toLocaleString("de-DE")}
      <span className={currencyClassName ?? "text-[0.7em] font-medium text-[#8A8A9A] ml-1"}>RSD</span>
    </span>
  );
}
