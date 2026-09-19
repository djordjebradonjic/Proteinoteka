import type { Product } from "@/types/product";

// Store price index for /gde-kupiti-protein-srbija. The only fair way to compare stores is on
// identical products, so this walks the audited cross-store product groups (same brand, same
// protein type, pack size within 5%) and asks, per group, how each store's price compares to
// the cheapest store for that very product. Everything the page prints is derived here.

/** A listing older than this is not trusted as a current price (matches the admin STALE_PRODUCT rule). */
export const FRESH_DAYS = 14;
/** A store needs this many products in common with another store before we publish an index for it. */
export const MIN_COMPARED_GROUPS = 5;
/** Groups whose priciest listing is more than this multiple of the cheapest are almost always a scraping error. */
const MAX_PLAUSIBLE_SPREAD = 2;
const GAINER_RE = /\b(mass|gainer)\b/i;

export interface StoreIndexRow {
  store: string;
  /** Listings currently in the catalog for this store. */
  listings: number;
  /** Listings refreshed within FRESH_DAYS. */
  fresh: number;
  /** Whole days since the store's most recent listing refresh; null when unknown. */
  daysAgo: number | null;
  /** Number of shared products this store was compared on (0 when no index). */
  comparedGroups: number;
  /** Mean of (store price / cheapest price) over compared groups; 1 = always cheapest. Null if too few groups. */
  index: number | null;
  /** Share (0..1) of compared groups where this store had the lowest price (ties count). */
  cheapestShare: number | null;
}

export interface StoreIndex {
  rows: StoreIndexRow[];
  /** Cross-store groups that entered the index. */
  groupsCompared: number;
  freshListings: number;
  totalListings: number;
}

const usable = (p: Product) =>
  p.numericPrice > 0 && (p.primaryWeightGrams ?? 0) > 0 && !GAINER_RE.test(p.name);

export function isFresh(p: Product, now: Date): boolean {
  if (!p.lastUpdated) return false;
  const t = new Date(p.lastUpdated).getTime();
  return Number.isFinite(t) && now.getTime() - t <= FRESH_DAYS * 86_400_000;
}

export function computeStoreIndex(products: Product[], now: Date = new Date()): StoreIndex {
  const stores = new Map<string, Product[]>();
  for (const p of products) {
    if (!usable(p) || !p.storeName) continue;
    stores.set(p.storeName, [...(stores.get(p.storeName) ?? []), p]);
  }

  // groupId -> store -> cheapest fresh listing
  const groups = new Map<number, Map<string, Product>>();
  for (const p of products) {
    if (p.groupId == null || !usable(p) || !isFresh(p, now)) continue;
    const perStore = groups.get(p.groupId) ?? new Map<string, Product>();
    const cur = perStore.get(p.storeName);
    if (!cur || p.numericPrice < cur.numericPrice) perStore.set(p.storeName, p);
    groups.set(p.groupId, perStore);
  }

  const ratios = new Map<string, number[]>();
  const cheapest = new Map<string, number>();
  let groupsCompared = 0;

  for (const perStore of groups.values()) {
    if (perStore.size < 2) continue;
    const listings = [...perStore.values()];
    const prices = listings.map((p) => p.numericPrice);
    const weights = listings.map((p) => p.primaryWeightGrams!);
    const lo = Math.min(...prices);
    if (Math.max(...prices) / lo > MAX_PLAUSIBLE_SPREAD) continue;
    if (Math.max(...weights) / Math.min(...weights) > 1.05) continue;

    groupsCompared++;
    for (const p of listings) {
      ratios.set(p.storeName, [...(ratios.get(p.storeName) ?? []), p.numericPrice / lo]);
      if (p.numericPrice === lo) cheapest.set(p.storeName, (cheapest.get(p.storeName) ?? 0) + 1);
    }
  }

  const rows: StoreIndexRow[] = [...stores.entries()].map(([store, list]) => {
    const r = ratios.get(store) ?? [];
    const enough = r.length >= MIN_COMPARED_GROUPS;
    const times = list.map((p) => (p.lastUpdated ? new Date(p.lastUpdated).getTime() : NaN)).filter(Number.isFinite);
    return {
      store,
      listings: list.length,
      fresh: list.filter((p) => isFresh(p, now)).length,
      daysAgo: times.length > 0 ? Math.floor((now.getTime() - Math.max(...times)) / 86_400_000) : null,
      comparedGroups: r.length,
      index: enough ? r.reduce((s, v) => s + v, 0) / r.length : null,
      cheapestShare: enough ? (cheapest.get(store) ?? 0) / r.length : null,
    };
  });

  // Stores with an index first (cheapest first), then the rest by size.
  rows.sort((a, b) =>
    a.index != null && b.index != null ? a.index - b.index
    : a.index != null ? -1
    : b.index != null ? 1
    : b.listings - a.listings);

  const all = [...stores.values()].flat();
  return {
    rows,
    groupsCompared,
    freshListings: all.filter((p) => isFresh(p, now)).length,
    totalListings: all.length,
  };
}
