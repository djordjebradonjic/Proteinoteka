import { cache } from "react";
import type { Product } from "@/types/product";
import { CURRENT_MARKET } from "@/lib/marketConfig";

// Live price statistics for /whey-protein-cena. Everything the page states as a number
// (price ranges per type, store count, cross-store spread, ...) is derived here from the
// current catalog instead of being hand-typed, so the copy can't drift away from the data.

const API = process.env.NEXT_PUBLIC_API_URL ?? "";
const PAGE_SIZE = 100; // keeps each response well under Next's 2MB data-cache item limit
const MAX_PAGES = 60;

export const WHEY_SOURCES = ["whey_concentrate", "whey_isolate", "hydrolysate"] as const;
export const TYPE_SOURCES = [...WHEY_SOURCES, "casein", "vegan", "blend"] as const;
export type TypeSource = (typeof TYPE_SOURCES)[number];

// Stores whose listings we compare against the domestic ones in the import FAQ.
const FOREIGN_STORES = ["MyProtein", "GymBeam"];

// Some mass gainers are stored as whey_concentrate (e.g. "Mutant Mass"); their protein %
// and price per gram are not comparable with whey, so they never enter any statistic.
const GAINER_RE = /\b(mass|gainer)\b/i;

// A listing whose price per gram of protein is below this share of its type's median is
// treated as a data error (wrong weight/price), not as a bargain, and is never ranked.
const IMPLAUSIBLE_SHARE_OF_MEDIAN = 0.4;
// Between the two shares a listing is only ranked if another store lists the same pack at a
// similar price (a lone very cheap listing is far more likely a scraping error than a deal).
const NEEDS_CORROBORATION_SHARE_OF_MEDIAN = 0.6;
const CORROBORATION_PRICE_TOLERANCE = 0.25;
const MIN_RANKED_WEIGHT_G = 900;
const RANKED_LIMIT = 20;
const MIN_SAMPLE = 10;

// ── Fetching ──────────────────────────────────────────────────────────────────

// Deliberately throws instead of returning [] on failure: this feeds an ISR page, and a
// swallowed failure would be cached as a "valid" empty page (see the sitemap precedent);
// throwing makes Next keep serving the last good render instead.
export const fetchMarketCatalog = cache(async (): Promise<Product[]> => {
  if (!API) throw new Error("whey-price-stats: NEXT_PUBLIC_API_URL is not set");

  const byId = new Map<number, Product>();
  for (let page = 0; page < MAX_PAGES; page++) {
    const res = await fetch(
      `${API}/api/v1/products?market=${CURRENT_MARKET}&size=${PAGE_SIZE}&page=${page}`,
      { next: { revalidate: 21600, tags: ["products"] } },
    );
    if (!res.ok) {
      throw new Error(`whey-price-stats: products fetch failed on page ${page} (HTTP ${res.status})`);
    }
    const body = (await res.json()) as { content: Product[]; page: { totalPages: number } };
    for (const p of body.content) byId.set(p.id, p);
    if (page + 1 >= body.page.totalPages) break;
  }
  if (byId.size === 0) throw new Error("whey-price-stats: catalog is empty, refusing to render");
  return [...byId.values()];
});

// ── Math helpers ──────────────────────────────────────────────────────────────

function quantile(sorted: number[], q: number): number {
  const i = q * (sorted.length - 1);
  const lo = Math.floor(i);
  const hi = Math.min(lo + 1, sorted.length - 1);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}

function median(values: number[]): number {
  return quantile([...values].sort((a, b) => a - b), 0.5);
}

const usable = (p: Product) =>
  p.numericPrice > 0 && (p.primaryWeightGrams ?? 0) > 0 && !GAINER_RE.test(p.name);

const hasPlausibleProtein = (p: Product) =>
  p.proteinPer100g != null && p.proteinPer100g >= 50 && p.proteinPer100g <= 95;

const pricePerKg = (p: Product) => p.numericPrice / (p.primaryWeightGrams! / 1000);
const pricePerGProtein = (p: Product) =>
  p.numericPrice / (p.primaryWeightGrams! * (p.proteinPer100g! / 100));

const isWhey = (p: Product) => (WHEY_SOURCES as readonly string[]).includes(p.proteinSource ?? "");

// ── Result shapes ─────────────────────────────────────────────────────────────

export interface TypeStat {
  count: number;
  stores: number;
  kgLow: number; // 10th percentile, RSD per kg of product
  kgMedian: number;
  kgHigh: number; // 90th percentile
  gpLow: number; // RSD per gram of protein
  gpMedian: number;
  gpHigh: number;
  proteinMedian: number | null; // g protein per 100g
}

export interface SizeStat {
  label: string;
  count: number;
  gpMedian: number;
}

export interface BudgetStat {
  count: number;
  medianWeightG: number;
  medianProtein: number;
  gpMedian: number;
  concentrateShare: number; // 0..1
  lowProteinCount: number; // listings under 65g protein per 100g
}

export interface CrossStoreSpread {
  groups: number;
  median: number; // 0..1, (max/min - 1)
  shareOver10: number; // share of groups whose spread is above 10%
  max: number;
}

export interface ForeignVsDomestic {
  foreign: number; // median RSD per gram of protein
  domestic: number;
  foreignCount: number;
  domesticCount: number;
}

export interface RankedProduct {
  product: Product;
  pricePerGProtein: number;
}

export interface WheyPriceStats {
  wheyListings: number;
  stores: number;
  types: Record<TypeSource, TypeStat | null>;
  concentrateBySize: SizeStat[];
  budget: { under3000: BudgetStat | null; from3000to5000: BudgetStat | null; over5000: BudgetStat | null };
  crossStore: CrossStoreSpread | null;
  foreignVsDomestic: ForeignVsDomestic | null;
  /** Share (0..1) of whey isolates that cost less per kg than the median whey concentrate. */
  isolateBelowConcentrateShare: number | null;
  ranked: RankedProduct[];
}

// ── Computation ───────────────────────────────────────────────────────────────

function typeStat(products: Product[]): TypeStat | null {
  if (products.length === 0) return null;
  const kg = products.map(pricePerKg).sort((a, b) => a - b);
  const withProtein = products.filter(hasPlausibleProtein);
  const gp = withProtein.map(pricePerGProtein).sort((a, b) => a - b);
  if (gp.length === 0) return null;
  return {
    count: products.length,
    stores: new Set(products.map((p) => p.storeName)).size,
    kgLow: quantile(kg, 0.1),
    kgMedian: quantile(kg, 0.5),
    kgHigh: quantile(kg, 0.9),
    gpLow: quantile(gp, 0.1),
    gpMedian: quantile(gp, 0.5),
    gpHigh: quantile(gp, 0.9),
    proteinMedian: median(withProtein.map((p) => p.proteinPer100g!)),
  };
}

function budgetStat(products: Product[]): BudgetStat | null {
  const withProtein = products.filter(hasPlausibleProtein);
  if (withProtein.length < MIN_SAMPLE) return null;
  return {
    count: withProtein.length,
    medianWeightG: median(withProtein.map((p) => p.primaryWeightGrams!)),
    medianProtein: median(withProtein.map((p) => p.proteinPer100g!)),
    gpMedian: median(withProtein.map(pricePerGProtein)),
    concentrateShare:
      withProtein.filter((p) => p.proteinSource === "whey_concentrate").length / withProtein.length,
    lowProteinCount: withProtein.filter((p) => p.proteinPer100g! < 65).length,
  };
}

function crossStoreSpread(whey: Product[]): CrossStoreSpread | null {
  const groups = new Map<number, Product[]>();
  for (const p of whey) {
    if (p.groupId == null) continue;
    groups.set(p.groupId, [...(groups.get(p.groupId) ?? []), p]);
  }
  const spreads: number[] = [];
  for (const members of groups.values()) {
    // Only same-weight listings from at least two stores are a fair "same product" comparison.
    if (new Set(members.map((m) => m.storeName)).size < 2) continue;
    if (new Set(members.map((m) => m.primaryWeightGrams)).size !== 1) continue;
    const prices = members.map((m) => m.numericPrice);
    spreads.push(Math.max(...prices) / Math.min(...prices) - 1);
  }
  if (spreads.length < MIN_SAMPLE) return null;
  return {
    groups: spreads.length,
    median: median(spreads),
    shareOver10: spreads.filter((s) => s > 0.1).length / spreads.length,
    max: Math.max(...spreads),
  };
}

function foreignVsDomestic(whey: Product[]): ForeignVsDomestic | null {
  const concentrate = whey.filter((p) => p.proteinSource === "whey_concentrate" && hasPlausibleProtein(p));
  const foreign = concentrate.filter((p) => FOREIGN_STORES.includes(p.storeName));
  const domestic = concentrate.filter((p) => !FOREIGN_STORES.includes(p.storeName));
  if (foreign.length < MIN_SAMPLE || domestic.length < MIN_SAMPLE) return null;
  return {
    foreign: median(foreign.map(pricePerGProtein)),
    domestic: median(domestic.map(pricePerGProtein)),
    foreignCount: foreign.length,
    domesticCount: domestic.length,
  };
}

function isolateBelowConcentrateShare(whey: Product[], concentrate: TypeStat | null): number | null {
  const isolates = whey.filter((p) => p.proteinSource === "whey_isolate");
  if (!concentrate || isolates.length < MIN_SAMPLE) return null;
  return isolates.filter((p) => pricePerKg(p) < concentrate.kgMedian).length / isolates.length;
}

function isCorroborated(product: Product, byGroup: Map<number, Product[]>): boolean {
  if (product.groupId == null) return false;
  return (byGroup.get(product.groupId) ?? []).some(
    (other) =>
      other.storeName !== product.storeName &&
      other.primaryWeightGrams === product.primaryWeightGrams &&
      Math.abs(other.numericPrice / product.numericPrice - 1) <= CORROBORATION_PRICE_TOLERANCE,
  );
}

function rank(whey: Product[], types: Record<TypeSource, TypeStat | null>): RankedProduct[] {
  const byGroup = new Map<number, Product[]>();
  for (const p of whey) {
    if (p.groupId != null) byGroup.set(p.groupId, [...(byGroup.get(p.groupId) ?? []), p]);
  }

  const candidates: RankedProduct[] = [];
  for (const product of whey) {
    if (!hasPlausibleProtein(product) || product.primaryWeightGrams! < MIN_RANKED_WEIGHT_G) continue;
    const typeMedian = types[product.proteinSource as TypeSource]?.gpMedian;
    const gp = pricePerGProtein(product);
    if (typeMedian != null) {
      if (gp < typeMedian * IMPLAUSIBLE_SHARE_OF_MEDIAN) continue;
      if (gp < typeMedian * NEEDS_CORROBORATION_SHARE_OF_MEDIAN && !isCorroborated(product, byGroup)) continue;
    }
    candidates.push({ product, pricePerGProtein: gp });
  }
  candidates.sort((a, b) => a.pricePerGProtein - b.pricePerGProtein);

  // The same product is listed by several stores under one groupId — keep only its cheapest
  // listing so the ranking isn't three copies of one product.
  const seenGroups = new Set<number>();
  const ranked: RankedProduct[] = [];
  for (const c of candidates) {
    const groupId = c.product.groupId;
    if (groupId != null) {
      if (seenGroups.has(groupId)) continue;
      seenGroups.add(groupId);
    }
    ranked.push(c);
    if (ranked.length === RANKED_LIMIT) break;
  }
  return ranked;
}

export function computeWheyPriceStats(catalog: Product[]): WheyPriceStats {
  const clean = catalog.filter(usable);
  const whey = clean.filter(isWhey);

  const types = Object.fromEntries(
    TYPE_SOURCES.map((s) => [s, typeStat(clean.filter((p) => p.proteinSource === s))]),
  ) as Record<TypeSource, TypeStat | null>;

  const concentrate = whey.filter((p) => p.proteinSource === "whey_concentrate" && hasPlausibleProtein(p));
  const sizeBuckets: [string, number, number][] = [
    ["do 900g", 0, 900],
    ["900g–1,5kg", 900, 1500],
    ["1,5–2,5kg", 1500, 2500],
    ["2,5kg i više", 2500, Infinity],
  ];
  const concentrateBySize = sizeBuckets
    .map(([label, lo, hi]) => {
      const inBucket = concentrate.filter((p) => p.primaryWeightGrams! >= lo && p.primaryWeightGrams! < hi);
      return { label, count: inBucket.length, gpMedian: inBucket.length ? median(inBucket.map(pricePerGProtein)) : 0 };
    })
    .filter((b) => b.count >= MIN_SAMPLE);

  return {
    wheyListings: whey.length,
    stores: new Set(whey.map((p) => p.storeName)).size,
    types,
    concentrateBySize,
    budget: {
      under3000: budgetStat(whey.filter((p) => p.numericPrice < 3000)),
      from3000to5000: budgetStat(whey.filter((p) => p.numericPrice >= 3000 && p.numericPrice < 5000)),
      over5000: budgetStat(whey.filter((p) => p.numericPrice >= 5000)),
    },
    crossStore: crossStoreSpread(whey),
    foreignVsDomestic: foreignVsDomestic(whey),
    isolateBelowConcentrateShare: isolateBelowConcentrateShare(whey, types.whey_concentrate),
    ranked: rank(whey, types),
  };
}

export const getWheyPriceStats = cache(async (): Promise<WheyPriceStats> =>
  computeWheyPriceStats(await fetchMarketCatalog()),
);
