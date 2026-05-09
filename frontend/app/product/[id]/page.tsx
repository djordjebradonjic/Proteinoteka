import { notFound } from "next/navigation";
import { Product } from "@/types/product";
import ProductPageContent from "./ProductPageContent";

const API = process.env.NEXT_PUBLIC_API_URL ?? "";

interface StorePrice { id: number; storeName: string; price: string; numericPrice: number | null; }

async function fetchProduct(id: string): Promise<Product | null> {
  try {
    const res = await fetch(`${API}/api/v1/products/${id}`, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

async function fetchSimilar(category: string, productId: number): Promise<Product[]> {
  try {
    const res = await fetch(`${API}/api/v1/products?category=${category}&size=7`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.content as Product[]).filter((p) => p.id !== productId).slice(0, 6);
  } catch { return []; }
}

async function fetchStorePrices(name: string, brand: string | null): Promise<StorePrice[]> {
  try {
    const params = new URLSearchParams({ name });
    if (brand) params.set("brand", brand);
    const res = await fetch(`${API}/api/v1/products/by-name?${params}`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!id || id === "undefined" || isNaN(Number(id))) notFound();

  const product = await fetchProduct(id);
  if (!product) notFound();

  // Fetch supporting data in parallel — no sequential waterfall
  const [similar, storePrices] = await Promise.all([
    product.proteinSource
      ? fetchSimilar(product.proteinSource, product.id)
      : Promise.resolve([]),
    product.name
      ? fetchStorePrices(product.name, product.brand)
      : Promise.resolve([]),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    ...(product.imageUrl && { image: product.imageUrl }),
    ...(product.aiDescription || product.description
      ? { description: (product.aiDescription || product.description)?.slice(0, 500) }
      : {}),
    ...(product.brand && { brand: { "@type": "Brand", name: product.brand } }),
    offers: {
      "@type": "Offer",
      priceCurrency: "RSD",
      price: product.numericPrice ?? undefined,
      availability: "https://schema.org/InStock",
      url: `https://proteinoteka.rs/product/${product.id}`,
      seller: {
        "@type": "Organization",
        name: product.storeName,
      },
    },
    ...(product.valueScore != null && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: product.valueScore.toFixed(1),
        bestRating: "10",
        worstRating: "1",
        reviewCount: "1",
      },
    }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductPageContent
        product={product}
        similar={similar}
        storePrices={storePrices}
      />
    </>
  );
}
