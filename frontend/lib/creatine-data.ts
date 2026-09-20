import { apiFetch } from "@/lib/apiFetch";
import { CURRENT_MARKET } from "@/lib/marketConfig";
import { isCreatine } from "@/lib/creatine";
import type { Product } from "@/types/product";

// Server-side reads of the creatine section (SSR / ISR / sitemap). Every call answers for ONE market and
// the creatine family; the list endpoints default to protein, so `productType=creatine` is always sent.

const API = process.env.NEXT_PUBLIC_API_URL ?? "";
const REVALIDATE = 21600;

export interface CreatineStorePrice {
  id: number;
  storeName: string;
  price: string;
  numericPrice: number | null;
  name: string | null;
  primaryWeightGrams: number | null;
  canonicalSlug: string | null;
  url: string | null;
}

export interface CreatinePage {
  content: Product[];
  totalPages: number;
  totalItems: number;
}

function listUrl(params: Record<string, string | number>): string {
  const url = new URL(`${API}/api/v1/products`);
  url.searchParams.set("productType", "creatine");
  url.searchParams.set("market", CURRENT_MARKET);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  return url.toString();
}

/**
 * One page of the creatine list. Errors propagate on purpose (no catch-to-empty): this feeds a page under
 * ISR, and swallowing a transient backend outage into "no results" would bake the empty page into the cache.
 */
export async function fetchCreatinePage(params: {
  form?: string;
  sort?: string;
  page?: number;
  size?: number;
}): Promise<CreatinePage> {
  const query: Record<string, string | number> = {
    sort: params.sort ?? "valueScore,desc",
    page: params.page ?? 0,
    size: params.size ?? 12,
  };
  if (params.form) query.productForm = params.form;
  const res = await apiFetch(listUrl(query), { next: { revalidate: REVALIDATE, tags: ["products"] } });
  if (!res.ok) throw new Error(`Failed to fetch creatine products, received status ${res.status}`);
  const data = await res.json();
  const content: Product[] = data.content ?? [];
  // A backend that predates the creatine family ignores `productType=creatine` and answers with protein.
  // Never show that as creatine (deploy order: backend first); an empty page is noindexed by the caller.
  if (content.some((p) => !isCreatine(p))) return { content: [], totalPages: 0, totalItems: 0 };
  return {
    content,
    totalPages: data.page?.totalPages ?? 0,
    totalItems: data.page?.totalElements ?? 0,
  };
}

/**
 * The product, or null only when the backend says it does not exist. Any other failure throws: the pages are
 * ISR-cached, and a transient outage must not turn into a cached 404 (or into a redirect).
 */
export async function fetchCreatineProduct(id: number): Promise<Product | null> {
  const res = await apiFetch(`${API}/api/v1/products/${id}`, { next: { revalidate: 86400, tags: ["products"] } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch creatine product ${id}, received status ${res.status}`);
  return res.json();
}

/** Cheapest first. Throws on failure for the same reason: a page baked without its price table stays that way. */
export async function fetchCreatineStorePrices(id: number): Promise<CreatineStorePrice[]> {
  const res = await apiFetch(`${API}/api/v1/products/${id}/store-prices`, { next: { revalidate: 86400, tags: ["products"] } });
  if (!res.ok) throw new Error(`Failed to fetch store prices of ${id}, received status ${res.status}`);
  return res.json();
}

/** Other creatine of the same form, best value first (piece packs are unscored, so cheapest first). */
export async function fetchSimilarCreatine(product: Product, limit = 4): Promise<Product[]> {
  try {
    const counted = product.productForm === "capsule" || product.productForm === "tablet" || product.productForm === "gummy";
    const res = await apiFetch(
      listUrl({
        productForm: product.productForm ?? "powder",
        sort: counted ? "numericPrice,asc" : "valueScore,desc",
        size: limit + 2,
        page: 0,
      }),
      { next: { revalidate: 86400, tags: ["products"] } },
    );
    if (!res.ok) return [];
    const data = await res.json();
    return ((data.content ?? []) as Product[]).filter((p) => p.id !== product.id).slice(0, limit);
  } catch {
    return [];
  }
}

/**
 * Every creatine listing of this market, for the sitemap. Throws on failure (a sitemap baked from a partial
 * read would stay partial for a day); returns nothing when the backend does not know the family yet.
 */
export async function fetchAllCreatine(): Promise<Product[]> {
  const all: Product[] = [];
  for (let page = 0; page < 20; page++) {
    const res = await apiFetch(listUrl({ size: 100, page, sort: "id,asc" }), { next: { revalidate: REVALIDATE, tags: ["products"] } });
    if (!res.ok) throw new Error(`Failed to fetch creatine sitemap page ${page}, received status ${res.status}`);
    const data = await res.json();
    const rows: Product[] = data.content ?? [];
    if (rows.some((p) => !isCreatine(p))) return [];
    all.push(...rows);
    if (page + 1 >= (data.page?.totalPages ?? 0)) break;
  }
  return all;
}
