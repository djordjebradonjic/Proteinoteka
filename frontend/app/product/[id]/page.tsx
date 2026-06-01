import { permanentRedirect } from "next/navigation";
import { Product } from "@/types/product";
import { productUrl } from "@/lib/productUrl";

const API = process.env.NEXT_PUBLIC_API_URL ?? "";

async function fetchProduct(id: string): Promise<Product | null> {
  try {
    const res = await fetch(`${API}/api/v1/products/${id}`, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
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

  permanentRedirect(productUrl(product));
}
