import { Product } from "@/types/product";
import { productUrl } from "@/lib/productUrl";
import { CURRENT_MARKET } from "@/lib/marketConfig";
import Link from "next/link";

const IS_HR = CURRENT_MARKET === "hr";

interface Props {
  products: Product[];
}

// Computed live from this page's own (already-filtered-by-weight) product list, so the
// numbers are always specific to the range and can't drift into filler text that's
// identical across weight-range pages except for the swapped-in kilogram figure.
export function WeightRangeInsights({ products }: Props) {
  const withData = products.filter(
    (p) => p.proteinPer100g != null && p.primaryWeightGrams != null && p.numericPrice > 0,
  );
  if (withData.length === 0) return null;

  const priced = withData.map((p) => {
    const totalProteinG = (p.proteinPer100g! / 100) * p.primaryWeightGrams!;
    return { product: p, totalProteinG, pricePerGProtein: p.numericPrice / totalProteinG };
  });

  const avgPricePerGProtein =
    priced.reduce((sum, x) => sum + x.pricePerGProtein, 0) / priced.length;
  const bestPerGProtein = [...priced].sort((a, b) => a.pricePerGProtein - b.pricePerGProtein)[0];

  const avgWeightG = withData.reduce((sum, p) => sum + p.primaryWeightGrams!, 0) / withData.length;
  const servings = Math.max(1, Math.round(avgWeightG / 30));
  const daysOneServing = servings;
  const daysTwoServings = Math.max(1, Math.round(servings / 2));

  const unit = IS_HR ? "€" : "RSD";
  const fmtPerGram = (v: number) => `${v.toFixed(IS_HR ? 3 : 1)} ${unit}/g proteina`;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
      <h2 className="text-base font-bold text-slate-900">
        {IS_HR ? "Što znače brojevi u ovom rasponu" : "Šta znače brojevi u ovom opsegu"}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
            {IS_HR ? "Prosječna cijena po gramu proteina" : "Prosečna cena po gramu proteina"}
          </p>
          <p className="text-lg font-black text-slate-900">{fmtPerGram(avgPricePerGProtein)}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
            {IS_HR ? "Najisplativiji po gramu proteina" : "Najisplativiji po gramu proteina"}
          </p>
          <Link href={productUrl(bestPerGProtein.product)} className="text-sm font-bold text-[#FF9900] hover:underline">
            {bestPerGProtein.product.name} — {fmtPerGram(bestPerGProtein.pricePerGProtein)}
          </Link>
        </div>
      </div>
      <p className="text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
        {IS_HR
          ? `Prosječno pakiranje u ovom rasponu (${(avgWeightG / 1000).toFixed(1)}kg) traje oko ${servings} porcija — to je ~${daysOneServing} dana uz jednu porciju dnevno, ili ~${daysTwoServings} dana uz dvije porcije dnevno.`
          : `Prosečno pakovanje u ovom opsegu (${(avgWeightG / 1000).toFixed(1)}kg) traje oko ${servings} porcija — to je ~${daysOneServing} dana uz jednu porciju dnevno, ili ~${daysTwoServings} dana uz dve porcije dnevno.`}
      </p>
    </div>
  );
}
