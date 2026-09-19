import Link from "next/link";
import type { Product } from "@/types/product";
import { productUrl } from "@/lib/productUrl";
import { formatPrice } from "@/lib/formatPrice";
import { CURRENT_MARKET } from "@/lib/marketConfig";
import {
  classifyLine,
  formatWeightG,
  srPlural,
  computeLineStats,
  widestSamePackSpread,
  type BrandLine,
} from "@/lib/brand-line-stats";

const IS_HR = CURRENT_MARKET === "hr";
const UNIT = IS_HR ? "€" : "RSD";

const fmtGram = (v: number) => `${v.toFixed(IS_HR ? 3 : 1).replace(".", ",")} ${UNIT}`;

interface Props {
  brandName: string;
  products: Product[];
  lines: BrandLine[];
}

// Server component: everything numeric is computed from the brand's own product list.
export function BrandLineGuide({ brandName, products, lines }: Props) {
  const stats = computeLineStats(products, lines);
  const spread = widestSamePackSpread(products);
  if (stats.length === 0 && !spread) return null;

  return (
    <section className="space-y-4">
      {stats.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="text-xl font-extrabold text-slate-900 mb-1">
            {brandName}: cena po gramu proteina po linijama
          </h2>
          <p className="text-sm text-slate-500 mb-4">
            Poređano od najjeftinije linije, kao medijana svih ponuda. Cena po gramu proteina ne meri kvalitet
            proteina (goveđi ili biljni protein nisu isto što i whey), zato uz nju gledaj i value score.
          </p>
          <div className="divide-y divide-slate-100">
            {stats.map(({ line, count, stores, proteinMedian, gpMedian, best }) => (
              <div key={line.key} className="py-3 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-x-6 gap-y-1">
                <div>
                  <p className="font-bold text-slate-900 text-sm">{line.label}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{line.blurb}</p>
                  {best && (
                    <Link href={productUrl(best)} className="text-xs font-semibold text-[#FF9900] hover:underline">
                      Najpovoljnija po gramu proteina: {formatPrice(best.numericPrice)}, {formatWeightG(best.primaryWeightGrams!)} ({best.storeName})
                    </Link>
                  )}
                </div>
                <div className="text-sm sm:text-right">
                  {gpMedian != null && (
                    <p className="font-black text-slate-900">
                      {fmtGram(gpMedian)}
                      <span className="text-xs font-medium text-slate-500"> / g proteina</span>
                    </p>
                  )}
                  <p className="text-xs text-slate-500">
                    {proteinMedian != null && `~${Math.round(proteinMedian)} g proteina/100 g · `}
                    {count} {srPlural(count, { one: "ponuda", few: "ponude", many: "ponuda" })} u {stores}{" "}
                    {srPlural(stores, { one: "prodavnici", few: "prodavnice", many: "prodavnica" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {spread && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-2">
            Isto pakovanje, različita cena
          </p>
          <p className="text-sm text-slate-800 leading-relaxed">
            <strong>{classifyLine(spread.name, lines)?.label ?? spread.name} {formatWeightG(spread.weightG)}</strong> se
            prodaje u {spread.stores}{" "}
            {srPlural(spread.stores, { one: "prodavnici", few: "prodavnice", many: "prodavnica" })}: od{" "}
            <Link href={productUrl(spread.low)} className="font-semibold text-[#FF9900] hover:underline">
              {formatPrice(spread.low.numericPrice)} ({spread.low.storeName})
            </Link>{" "}
            do{" "}
            <Link href={productUrl(spread.high)} className="font-semibold text-[#FF9900] hover:underline">
              {formatPrice(spread.high.numericPrice)} ({spread.high.storeName})
            </Link>
            . Razlika je {formatPrice(spread.diff)} ({Math.round(spread.pct * 100)}%) za identičan proizvod.
          </p>
        </div>
      )}
    </section>
  );
}
