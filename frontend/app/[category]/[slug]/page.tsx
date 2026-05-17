import { notFound, permanentRedirect } from "next/navigation";
import { Metadata } from "next";
import { Product } from "@/types/product";
import ProductPageContent from "@/app/product/[id]/ProductPageContent";
import {
  productUrl,
  extractProductId,
  isValidProductCategory,
  PRODUCT_CATEGORY_LABELS,
  KATEGORIJA_SLUGS,
} from "@/lib/productUrl";

export const revalidate = 86400;

const API      = process.env.NEXT_PUBLIC_API_URL ?? "";
const BASE_URL = "https://proteinoteka.rs";

interface StorePrice { id: number; storeName: string; price: string; numericPrice: number | null; }
interface Params { params: Promise<{ category: string; slug: string }> }

// ── Data fetching ──────────────────────────────────────────────────────────────

async function fetchProduct(id: number): Promise<Product | null> {
  try {
    const res = await fetch(`${API}/api/v1/products/${id}`, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

async function fetchSimilar(category: string, excludeId: number): Promise<Product[]> {
  try {
    const res = await fetch(`${API}/api/v1/products?category=${category}&size=7`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.content as Product[]).filter((p) => p.id !== excludeId).slice(0, 6);
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

// ── Metadata ───────────────────────────────────────────────────────────────────

const SUFFIX = " – Cena u Srbiji | Proteinoteka"; // 31 chars
// Truncate product name at a word boundary so the full title stays under this limit.
// Raise this value if you find important product names getting cut.
const MAX_TITLE_CHARS = 65;

function buildProductTitle(name: string): string {
  const full = name + SUFFIX;
  if (full.length <= MAX_TITLE_CHARS) return full;
  // Trim name to fit, cutting at the last space before the limit
  const maxName = MAX_TITLE_CHARS - SUFFIX.length;
  const trimmed = name.slice(0, maxName).replace(/\s+\S*$/, "");
  return trimmed + SUFFIX;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const id = extractProductId(slug);
  if (!id) return { title: { absolute: "Proizvod | Proteinoteka" } };

  const product = await fetchProduct(id);
  if (!product) return { title: { absolute: "Proizvod | Proteinoteka" } };

  const canonical   = `${BASE_URL}${productUrl(product)}`;
  const title       = buildProductTitle(product.name);
  const description = `${product.name} — uporedi cene u srpskim prodavnicama. Trenutna najniža cena i dostupnost na jednom mestu.`;

  return {
    title:       { absolute: title },
    description,
    alternates:  { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "Proteinoteka",
      images: product.imageUrl
        ? [{ url: product.imageUrl, width: 800, height: 800, alt: product.name }]
        : [],
      locale: "sr_RS",
      type: "website",
    },
    twitter: {
      title,
      description,
    },
  };
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function ProductSlugPage({ params }: Params) {
  const { category, slug } = await params;

  // Unknown category segment → 404 (avoids collisions with other two-segment routes)
  if (!isValidProductCategory(category)) notFound();

  const id = extractProductId(slug);
  if (!id) notFound();

  const product = await fetchProduct(id);
  if (!product) notFound();

  // Canonical enforcement: stale or mistyped URLs redirect to the current canonical form
  const canonical = productUrl(product);
  if (`/${category}/${slug}` !== canonical) {
    permanentRedirect(canonical);
  }

  const [similar, storePrices] = await Promise.all([
    product.proteinSource ? fetchSimilar(product.proteinSource, product.id) : [],
    product.name          ? fetchStorePrices(product.name, product.brand)   : [],
  ]);

  // ── Schema.org ─────────────────────────────────────────────────────────────
  const canonicalUrl   = `${BASE_URL}${canonical}`;
  const catKey         = product.proteinSource ?? "";
  const catLabel       = PRODUCT_CATEGORY_LABELS[catKey] ?? null;
  const kategorijSlug  = product.proteinSource ? KATEGORIJA_SLUGS[product.proteinSource] : null;

  const plainDescription = product.description
    ? product.description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 500)
    : undefined;

  const breadcrumbItems: object[] = [
    { "@type": "ListItem", position: 1, name: "Početna", item: BASE_URL },
  ];
  if (catLabel && kategorijSlug) {
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 2,
      name: catLabel,
      item: `${BASE_URL}/kategorija/${kategorijSlug}`,
    });
    breadcrumbItems.push({ "@type": "ListItem", position: 3, name: product.name, item: canonicalUrl });
  } else {
    breadcrumbItems.push({ "@type": "ListItem", position: 2, name: product.name, item: canonicalUrl });
  }

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      ...(product.imageUrl && { image: product.imageUrl }),
      ...(product.brand && { brand: { "@type": "Brand", name: product.brand } }),
      ...(plainDescription && { description: plainDescription }),
      offers: {
        "@type": "Offer",
        price: product.numericPrice,
        priceCurrency: "RSD",
        availability: "https://schema.org/InStock",
        url: canonicalUrl,
        seller: { "@type": "Organization", name: product.storeName },
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
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbItems,
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductPageContent product={product} similar={similar} storePrices={storePrices} />
    </>
  );
}
