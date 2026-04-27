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

    const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}
