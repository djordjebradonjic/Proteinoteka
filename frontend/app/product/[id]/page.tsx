import { notFound, permanentRedirect } from "next/navigation";
import { apiFetch } from "@/lib/apiFetch";
import { Product } from "@/types/product";
import { productUrl } from "@/lib/productUrl";

const API = process.env.NEXT_PUBLIC_API_URL ?? "";

async function fetchProduct(id: string): Promise<Product | null> {
  try {
    const res = await apiFetch(`${API}/api/v1/products/${id}`, { next: { revalidate: 86400 } });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`product ${id}: API answered HTTP ${res.status}`);
    return res.json();
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("product ")) throw e;
    throw new Error(`product ${id}: API unreachable`);
  }
}

export default async function ProductRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!id || id === "undefined" || isNaN(Number(id))) notFound();

  const product = await fetchProduct(id);
  if (!product) permanentRedirect("/");
  if (product.market && product.market !== (process.env.NEXT_PUBLIC_MARKET ?? "rs")) notFound();

  permanentRedirect(productUrl(product));
}
