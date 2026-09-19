import type { Product } from "@/types/product";

// Live statistics for brand landing pages, grouped by product line (e.g. Scitec "100% Whey
// Professional" vs "100% Whey Isolate"). Every number the page prints is derived from the
// fetched product list, so the copy can't drift away from the price table it sits next to.

export interface BrandLine {
  key: string;
  label: string;
  /** Qualitative one-liner only — no figures, those come from the data. */
  blurb: string;
  /** Tested against the product name. Lines are matched in the order given, first match wins. */
  match: RegExp;
}

export interface LineStat {
  line: BrandLine;
  count: number;
  stores: number;
  /** Median grams of protein per 100 g of product. */
  proteinMedian: number | null;
  /** Median price per gram of protein (site currency). */
  gpMedian: number | null;
  /** Listing with the lowest price per gram of protein in this line. */
  best: Product | null;
}

export interface SamePackSpread {
  name: string;
  weightG: number;
  stores: number;
  low: Product;
  high: Product;
  diff: number;
  pct: number; // 0..1, high/low - 1
}

const plausibleProtein = (p: Product) =>
  p.proteinPer100g != null && p.proteinPer100g >= 40 && p.proteinPer100g <= 95;

const usable = (p: Product) => p.numericPrice > 0 && (p.primaryWeightGrams ?? 0) > 0;

const pricePerGProtein = (p: Product) =>
  p.numericPrice / (p.primaryWeightGrams! * (p.proteinPer100g! / 100));

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** Serbian plural form: 1, 21 -> one; 2-4, 22-24 -> few; everything else (5-20, 25...) -> many. */
export function srPlural(n: number, forms: { one: string; few: string; many: string }): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms.one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms.few;
  return forms.many;
}

/** "1,5 kg" / "500 g" in Serbian formatting. */
export function formatWeightG(g: number): string {
  return g >= 1000
    ? `${(g / 1000).toLocaleString("sr-RS", { maximumFractionDigits: 2 })} kg`
    : `${Math.round(g)} g`;
}

/** Whether `a` is cheaper, pricier or about the same as `b` (within 5%), so copy never asserts a stale ordering. */
export function compareCost(a: number, b: number): "cheaper" | "pricier" | "similar" {
  const ratio = a / b;
  if (ratio < 0.95) return "cheaper";
  if (ratio > 1.05) return "pricier";
  return "similar";
}

export function classifyLine(name: string, lines: BrandLine[]): BrandLine | null {
  return lines.find((l) => l.match.test(name)) ?? null;
}

/** One entry per line that has at least one listing, cheapest per gram of protein first. */
export function computeLineStats(products: Product[], lines: BrandLine[]): LineStat[] {
  const buckets = new Map<string, Product[]>();
  for (const p of products) {
    const line = classifyLine(p.name, lines);
    if (!line || p.numericPrice <= 0) continue;
    buckets.set(line.key, [...(buckets.get(line.key) ?? []), p]);
  }

  const stats: LineStat[] = [];
  for (const line of lines) {
    const members = buckets.get(line.key);
    if (!members) continue;
    const scored = members.filter((p) => usable(p) && plausibleProtein(p));
    const best = [...scored].sort((a, b) => pricePerGProtein(a) - pricePerGProtein(b))[0] ?? null;
    stats.push({
      line,
      count: members.length,
      stores: new Set(members.map((p) => p.storeName)).size,
      proteinMedian: median(members.filter(plausibleProtein).map((p) => p.proteinPer100g!)),
      gpMedian: median(scored.map(pricePerGProtein)),
      best,
    });
  }
  return stats.sort((a, b) => (a.gpMedian ?? Infinity) - (b.gpMedian ?? Infinity));
}

/**
 * The same pack sold in the most stores (cross-store product group), with its cheapest and
 * priciest listing. Uses the audited groupId, which already guarantees same brand, protein
 * type and pack size within 5%. Null when no group is sold in at least `minStores` stores.
 */
export function widestSamePackSpread(products: Product[], minStores = 3): SamePackSpread | null {
  const groups = new Map<number, Product[]>();
  for (const p of products) {
    if (p.groupId == null || !usable(p)) continue;
    groups.set(p.groupId, [...(groups.get(p.groupId) ?? []), p]);
  }

  let best: SamePackSpread | null = null;
  for (const members of groups.values()) {
    // one listing per store, cheapest wins
    const perStore = new Map<string, Product>();
    for (const p of members) {
      const cur = perStore.get(p.storeName);
      if (!cur || p.numericPrice < cur.numericPrice) perStore.set(p.storeName, p);
    }
    if (perStore.size < minStores) continue;

    const listings = [...perStore.values()].sort((a, b) => a.numericPrice - b.numericPrice);
    const low = listings[0];
    const high = listings[listings.length - 1];
    const weights = listings.map((p) => p.primaryWeightGrams!);
    if (Math.max(...weights) / Math.min(...weights) > 1.05) continue;

    const candidate: SamePackSpread = {
      name: low.name,
      weightG: Math.round(median(weights)!),
      stores: listings.length,
      low,
      high,
      diff: high.numericPrice - low.numericPrice,
      pct: high.numericPrice / low.numericPrice - 1,
    };
    if (!best || candidate.stores > best.stores || (candidate.stores === best.stores && candidate.pct > best.pct)) {
      best = candidate;
    }
  }
  return best;
}

export interface PackRow {
  product: Product;
  weightG: number;
  gp: number; // price per gram of protein
}

/** Listings with usable weight/protein/price, smallest pack first (cheapest first within a size). */
export function packRows(products: Product[]): PackRow[] {
  return products
    .filter((p) => usable(p) && plausibleProtein(p))
    .map((p) => ({ product: p, weightG: p.primaryWeightGrams!, gp: pricePerGProtein(p) }))
    .sort((a, b) => a.weightG - b.weightG || a.product.numericPrice - b.product.numericPrice);
}

export interface PackTrend {
  small: PackRow;
  large: PackRow;
  cmp: "cheaper" | "pricier" | "similar"; // the large pack vs the small one, per gram of protein
}

/**
 * Whether the biggest pack is actually cheaper per gram of protein than the smallest one
 * (best listing of each). Null when there are no two clearly different pack sizes.
 */
export function packSizeTrend(rows: PackRow[]): PackTrend | null {
  if (rows.length < 2) return null;
  const minW = rows[0].weightG;
  const maxW = rows[rows.length - 1].weightG;
  if (maxW / minW < 1.5) return null;
  const best = (group: PackRow[]) => [...group].sort((a, b) => a.gp - b.gp)[0];
  const small = best(rows.filter((r) => r.weightG / minW < 1.2));
  const large = best(rows.filter((r) => r.weightG / maxW > 0.83));
  return { small, large, cmp: compareCost(large.gp, small.gp) };
}

export interface SourceGp {
  gp: number; // median price per gram of protein
  count: number;
}

/** Median price per gram of protein per protein source (whey_isolate, casein, ...). */
export function medianGpBySource(products: Product[]): Record<string, SourceGp> {
  const bySource = new Map<string, number[]>();
  for (const p of products) {
    if (!p.proteinSource || !usable(p) || !plausibleProtein(p)) continue;
    bySource.set(p.proteinSource, [...(bySource.get(p.proteinSource) ?? []), pricePerGProtein(p)]);
  }
  const out: Record<string, SourceGp> = {};
  for (const [source, values] of bySource) out[source] = { gp: median(values)!, count: values.length };
  return out;
}
