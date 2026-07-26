import { Product } from "@/types/product";
import { formatPrice } from "@/lib/formatPrice";

const API = process.env.NEXT_PUBLIC_API_URL ?? "";
const MARKET = process.env.NEXT_PUBLIC_MARKET ?? "rs";

export async function fetchTopProducts(params: {
  category?: string;
  sortBy?: "valueScore" | "price";
  limit?: number;
}): Promise<Product[]> {
  if (!API) return [];
  try {
    const url = new URL(`${API}/api/v1/products/top`);
    if (params.category) url.searchParams.set("category", params.category);
    if (params.sortBy)   url.searchParams.set("sortBy",   params.sortBy);
    if (params.limit)    url.searchParams.set("limit",    String(params.limit));
    url.searchParams.set("market", MARKET);

    const res = await fetch(url.toString(), { next: { revalidate: 21600, tags: ["products"] } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function fetchPriceRangeProducts(params: {
  maxPrice: number;
  limit?: number;
}): Promise<Product[]> {
  if (!API) return [];
  try {
    const url = new URL(`${API}/api/v1/products`);
    url.searchParams.set("maxPrice", String(params.maxPrice));
    url.searchParams.set("size", String(params.limit ?? 40));
    url.searchParams.set("sort", "valueScore,desc");
    url.searchParams.set("page", "0");
    url.searchParams.set("market", MARKET);

    const res = await fetch(url.toString(), { next: { revalidate: 86400, tags: ["products"] } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.content ?? [];
  } catch {
    return [];
  }
}

export async function fetchTopValueProducts(limit = 5): Promise<Product[]> {
  if (!API) return [];
  try {
    const url = new URL(`${API}/api/v1/products/top-value`);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("market", MARKET);
    const res = await fetch(url.toString(), { next: { revalidate: 21600, tags: ["products"] } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function fetchPriceDropProducts(limit = 8): Promise<Product[]> {
  if (!API) return [];
  try {
    const url = new URL(`${API}/api/v1/products/price-drops`);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("market", MARKET);
    const res = await fetch(url.toString(), { next: { revalidate: 21600, tags: ["products"] } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function fetchBlackFridayProducts(limit = 20): Promise<Product[]> {
  if (!API) return [];
  try {
    const url = new URL(`${API}/api/v1/products/black-friday`);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("market", MARKET);
    const res = await fetch(url.toString(), { next: { revalidate: 21600, tags: ["products"] } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function fetchStoreProducts(params: {
  storeName: string;
  limit?: number;
}): Promise<Product[]> {
  if (!API) return [];
  try {
    const url = new URL(`${API}/api/v1/products`);
    url.searchParams.set("storeName", params.storeName);
    // Fetch the full catalog so the component can rank by valueScore across all store products
    url.searchParams.set("size", String(params.limit ?? 100));
    url.searchParams.set("sort", "valueScore,desc");
    url.searchParams.set("page", "0");
    url.searchParams.set("market", MARKET);

    const res = await fetch(url.toString(), { next: { revalidate: 86400, tags: ["products"] } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.content ?? [];
  } catch {
    return [];
  }
}

export async function fetchProductsByQuery(params: {
  name?: string;
  brand?: string;
  limit?: number;
}): Promise<Product[]> {
  if (!API) return [];
  try {
    const url = new URL(`${API}/api/v1/products`);
    if (params.name)  url.searchParams.set("name", params.name);
    if (params.brand) url.searchParams.set("brand", params.brand);
    url.searchParams.set("size", String(params.limit ?? 100));
    url.searchParams.set("sort", "valueScore,desc");
    url.searchParams.set("page", "0");
    url.searchParams.set("market", MARKET);

    const res = await fetch(url.toString(), { next: { revalidate: 86400, tags: ["products"] } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.content ?? [];
  } catch {
    return [];
  }
}

export async function fetchBrandProducts(params: {
  brand: string;
  limit?: number;
}): Promise<Product[]> {
  if (!API) return [];
  try {
    const url = new URL(`${API}/api/v1/products`);
    url.searchParams.set("brand", params.brand);
    url.searchParams.set("size", String(params.limit ?? 100));
    url.searchParams.set("sort", "valueScore,desc");
    url.searchParams.set("page", "0");
    url.searchParams.set("market", MARKET);

    const res = await fetch(url.toString(), { next: { revalidate: 86400, tags: ["products"] } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.content ?? [];
  } catch {
    return [];
  }
}

export interface SeoCopyStats {
  cheapest: Product;
  priciest: Product;
  bestValue: Product;
  secondBestValue: Product | null;
  highestProtein: Product;
  minPriceLabel: string;
  maxPriceLabel: string;
}

// Derives the numbers used in brand/store SEO page prose (intro + FAQ) directly from the
// fetched product list, so editorial copy can't drift out of sync with the live price table
// it sits next to — recomputed on every ISR revalidation instead of being hand-typed once.
export function getSeoCopyStats(products: Product[]): SeoCopyStats | null {
  const priced = products.filter((p) => p.numericPrice > 0);
  if (priced.length === 0) return null;

  const cheapest = [...priced].sort((a, b) => a.numericPrice - b.numericPrice)[0];
  const priciest = [...priced].sort((a, b) => b.numericPrice - a.numericPrice)[0];

  const byValue = [...products]
    .filter((p) => p.valueScore != null)
    .sort((a, b) => (b.valueScore ?? 0) - (a.valueScore ?? 0));

  const byProtein = [...products]
    .filter((p) => p.proteinPer100g != null)
    .sort((a, b) => (b.proteinPer100g ?? 0) - (a.proteinPer100g ?? 0));

  if (byValue.length === 0 || byProtein.length === 0) return null;

  return {
    cheapest,
    priciest,
    bestValue: byValue[0],
    secondBestValue: byValue[1] ?? null,
    highestProtein: byProtein[0],
    minPriceLabel: formatPrice(cheapest.numericPrice),
    maxPriceLabel: formatPrice(priciest.numericPrice),
  };
}
