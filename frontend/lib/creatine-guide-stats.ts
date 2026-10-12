import { cache } from "react";
import { fetchCreatinePage } from "@/lib/creatine-data";
import type { Product } from "@/types/product";

// Live numbers for the creatine guides. Everything the guide states about price (median per 100 g, cost of a
// month, pack-size effect, cheapest packs) is derived from the current catalog, so the copy cannot drift away
// from the data. Powders only: a capsule or a gummy is sold by the piece and the pack rarely states how much
// creatine is in it, so its price per gram of creatine is unknowable (see the value score guide).

// Forms of plain creatine monohydrate. Blends, HCl, buffered, nitrate etc. are a different product and would
// pull the median around in both directions.
const MONOHYDRATE_TYPES = new Set(["monohydrate", "micronized", "creapure"]);

const PAGE_SIZE = 48; // the API caps a page at 48 for callers without the server token
const MAX_PAGES = 20;
const MIN_PACK_G = 100; // below this a pack is a sachet sample, not a way of buying creatine
const MIN_RANKED_PACK_G = 250;
// A price per 100 g far under the median is more likely a scraping error than a bargain. Under the hard floor it
// never counts; between the floor and the soft limit it counts only when other listings sit at a similar price
// (one brand's whole range of sizes at ~0.35x the median is a real price, a lone 0.3x row is a typo).
const HARD_FLOOR_SHARE_OF_MEDIAN = 0.2;
const SOFT_LIMIT_SHARE_OF_MEDIAN = 0.4;
const CORROBORATION_TOLERANCE = 0.25;
const CORROBORATING_LISTINGS = 2;
const MIN_SAMPLE = 12;
const RANKED_LIMIT = 5;
const DOSE_G = 5;
const MONTH_G = 150; // 5 g a day for 30 days

export interface Pack {
  product: Product;
  per100: number;
  packGrams: number;
}

export interface Band {
  key: "small" | "medium" | "large";
  min: number; // grams, inclusive
  max: number; // grams, inclusive; Infinity for the last band
  count: number;
  median100: number;
  cheapest: Pack;
}

export interface CreatineGuideStats {
  /** Plain monohydrate powders that enter the statistics. */
  count: number;
  stores: number;
  median100: number;
  /** Cheapest believable pack. */
  min100: number;
  /** Price of one 5 g dose at the median and at the cheapest believable pack. */
  doseMedian: number;
  doseMin: number;
  /** A month at 5 g a day. */
  monthMedian: number;
  monthMin: number;
  bands: Band[];
  /** Each brand's cheapest pack of 250 g and up, cheapest brand first. */
  ranked: Pack[];
  /** Creapure® only; null when too few listings to say anything. */
  creapure: { count: number; median100: number } | null;
  /** Powder listings that are not plain monohydrate (blends, HCl, buffered, unknown type); not part of the median above. */
  otherCount: number;
  /** Median price per 100 g of the same listings that are not plain monohydrate. */
  otherMedian100: number | null;
}

function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

// Deliberately throws on a failed fetch (no catch-to-empty): this feeds ISR pages, and a swallowed outage would
// be cached as a page without its price section.
const fetchAllPowders = cache(async (): Promise<Product[]> => {
  const byId = new Map<number, Product>();
  for (let page = 0; page < MAX_PAGES; page++) {
    const res = await fetchCreatinePage({ form: "powder", sort: "numericPrice,asc", page, size: PAGE_SIZE });
    for (const p of res.content) byId.set(p.id, p);
    if (page + 1 >= res.totalPages) break;
  }
  return [...byId.values()];
});

function toPack(p: Product): Pack | null {
  const g = p.primaryWeightGrams;
  if (!g || g < MIN_PACK_G || !p.numericPrice || p.numericPrice <= 0) return null;
  return { product: p, per100: (p.numericPrice / g) * 100, packGrams: g };
}

const BANDS: Pick<Band, "key" | "min" | "max">[] = [
  { key: "small", min: 0, max: 300 },
  { key: "medium", min: 301, max: 600 },
  { key: "large", min: 601, max: Infinity },
];

/** null when the market has too few creatine powders to say anything (the guide then simply omits the section). */
export const getCreatineGuideStats = cache(async (): Promise<CreatineGuideStats | null> => {
  const all = await fetchAllPowders();
  const packs = all.map(toPack).filter((x): x is Pack => x !== null);

  const mono = packs.filter((x) => MONOHYDRATE_TYPES.has(x.product.creatineType ?? ""));
  if (mono.length < MIN_SAMPLE) return null;

  const med = median(mono.map((x) => x.per100));
  const believable = mono.filter((x) => {
    if (x.per100 >= med * SOFT_LIMIT_SHARE_OF_MEDIAN) return true;
    if (x.per100 < med * HARD_FLOOR_SHARE_OF_MEDIAN) return false;
    const neighbours = mono.filter(
      (y) => y !== x && Math.abs(y.per100 - x.per100) <= x.per100 * CORROBORATION_TOLERANCE,
    ).length;
    return neighbours >= CORROBORATING_LISTINGS;
  });
  const med2 = median(believable.map((x) => x.per100));
  const min100 = Math.min(...believable.map((x) => x.per100));

  const bands: Band[] = [];
  for (const b of BANDS) {
    const inBand = believable.filter((x) => x.packGrams >= b.min && x.packGrams <= b.max);
    if (inBand.length < 3) continue;
    const cheapest = inBand.reduce((a, c) => (c.per100 < a.per100 ? c : a));
    bands.push({ ...b, count: inBand.length, median100: median(inBand.map((x) => x.per100)), cheapest });
  }

  // One row per brand (its cheapest pack): one brand's range of sizes must not fill the whole list.
  const seen = new Set<string>();
  const ranked: Pack[] = [];
  for (const x of [...believable].sort((a, b) => a.per100 - b.per100)) {
    if (x.packGrams < MIN_RANKED_PACK_G) continue;
    const key = (x.product.brand ?? x.product.name).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    ranked.push(x);
    if (ranked.length === RANKED_LIMIT) break;
  }

  const creapureRows = believable.filter((x) => x.product.creatineType === "creapure");
  const other = packs.filter((x) => !MONOHYDRATE_TYPES.has(x.product.creatineType ?? ""));

  return {
    count: believable.length,
    stores: new Set(believable.map((x) => x.product.storeName)).size,
    median100: med2,
    min100,
    doseMedian: (med2 * DOSE_G) / 100,
    doseMin: (min100 * DOSE_G) / 100,
    monthMedian: (med2 * MONTH_G) / 100,
    monthMin: (min100 * MONTH_G) / 100,
    bands,
    ranked,
    creapure: creapureRows.length >= 3 ? { count: creapureRows.length, median100: median(creapureRows.map((x) => x.per100)) } : null,
    otherCount: other.length,
    otherMedian100: other.length >= 5 ? median(other.map((x) => x.per100)) : null,
  };
});
