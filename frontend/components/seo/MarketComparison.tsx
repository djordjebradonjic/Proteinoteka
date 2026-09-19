import { compareCost, type SourceGp } from "@/lib/brand-line-stats";
import { CURRENT_MARKET } from "@/lib/marketConfig";

const IS_HR = CURRENT_MARKET === "hr";
const UNIT = IS_HR ? "€" : "RSD";

export const SOURCE_LABELS: Record<string, string> = {
  whey_concentrate: "Whey koncentrat",
  whey_isolate: "Whey izolat",
  hydrolysate: "Hidrolizat",
  casein: "Kazein",
  vegan: "Biljni protein",
  blend: "Blend",
};

interface Props {
  brandName: string;
  mine: Record<string, SourceGp>;
  market: Record<string, SourceGp>;
}

const MIN_MINE = 3;
const MIN_MARKET = 8;

const fmt = (v: number) => v.toFixed(IS_HR ? 3 : 1).replace(".", ",");

// Median price per gram of protein of one brand against the whole market, per protein type.
// Only types with enough listings on both sides are shown, so a single odd listing can't decide the verdict.
export function MarketComparison({ brandName, mine, market }: Props) {
  const rows = Object.keys(SOURCE_LABELS)
    .filter((k) => mine[k]?.count >= MIN_MINE && market[k]?.count >= MIN_MARKET)
    .map((k) => {
      const diff = mine[k].gp / market[k].gp - 1;
      return { key: k, mine: mine[k], market: market[k], diff, cmp: compareCost(mine[k].gp, market[k].gp) };
    });
  if (rows.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <h2 className="text-xl font-extrabold text-slate-900 mb-1">{brandName} naspram ostalih prodavnica</h2>
      <p className="text-sm text-slate-500 mb-4">
        Medijana cene po gramu proteina za istu vrstu proteina: {brandName} naspram ponuda u ostalim prodavnicama koje pratimo.
      </p>
      <div className="divide-y divide-slate-100">
        {rows.map((r) => (
          <div key={r.key} className="py-3 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-x-6 gap-y-1 text-sm">
            <div>
              <p className="font-bold text-slate-900">{SOURCE_LABELS[r.key]}</p>
              <p className="text-xs text-slate-500">
                {brandName}: {fmt(r.mine.gp)} {UNIT}/g ({r.mine.count} ponuda) · ostale prodavnice: {fmt(r.market.gp)} {UNIT}/g ({r.market.count} ponuda)
              </p>
            </div>
            <p className="font-black text-slate-900 sm:text-right">
              {r.cmp === "similar"
                ? "na nivou ostalih prodavnica"
                : `${Math.round(Math.abs(r.diff) * 100)}% ${r.cmp === "cheaper" ? "jeftiniji" : "skuplji"}`}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
