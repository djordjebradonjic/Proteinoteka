import { Product } from "@/types/product";

const API = process.env.NEXT_PUBLIC_API_URL ?? "";

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

    const res = await fetch(url.toString(), { next: { revalidate: 300 } });
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

    const res = await fetch(url.toString(), { next: { revalidate: 300 } });
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
    const res = await fetch(url.toString(), { next: { revalidate: 21600 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function fetchPriceDropProducts(days = 7, limit = 5): Promise<Product[]> {
  if (!API) return [];
  try {
    const url = new URL(`${API}/api/v1/products/price-drops`);
    url.searchParams.set("days", String(days));
    url.searchParams.set("limit", String(limit));
    const res = await fetch(url.toString(), { next: { revalidate: 21600 } });
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
    url.searchParams.set("size", String(params.limit ?? 30));
    url.searchParams.set("sort", "id,desc");
    url.searchParams.set("page", "0");

    const res = await fetch(url.toString(), { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.content ?? [];
  } catch {
    return [];
  }
}
