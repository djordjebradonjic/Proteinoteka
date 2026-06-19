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
  PRODUCT_CATEGORY_TO_KATEGORIJA,
} from "@/lib/productUrl";

export const revalidate = 86400;

const API      = process.env.NEXT_PUBLIC_API_URL ?? "";
const BASE_URL = "https://proteinoteka.rs";

interface StorePrice { id: number; storeName: string; price: string; numericPrice: number | null; name: string | null; primaryWeightGrams: number | null; proteinSource: string | null; canonicalSlug: string | null; }
interface ReviewDTO { id: number; displayName: string | null; rating: number; comment: string | null; createdAt: string; }
interface AggregateRatingDTO { averageRating: number; reviewCount: number; }
interface Params { params: Promise<{ category: string; slug: string }> }

// ── Data fetching ──────────────────────────────────────────────────────────────

async function fetchProduct(id: number): Promise<Product | null> {
  try {
    const res = await fetch(`${API}/api/v1/products/${id}`, { next: { revalidate: 86400, tags: ["products"] } });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

async function fetchSimilar(category: string, excludeId: number): Promise<Product[]> {
  try {
    const res = await fetch(`${API}/api/v1/products?category=${category}&size=7`, { next: { revalidate: 86400, tags: ["products"] } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.content as Product[]).filter((p) => p.id !== excludeId).slice(0, 6);
  } catch { return []; }
}

async function fetchStorePrices(productId: number): Promise<StorePrice[]> {
  try {
    const res = await fetch(`${API}/api/v1/products/${productId}/store-prices`, { next: { revalidate: 86400, tags: ["products"] } });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

async function fetchReviews(productId: number): Promise<ReviewDTO[]> {
  try {
    const res = await fetch(`${API}/api/v1/products/${productId}/reviews`, { next: { revalidate: 3600, tags: ["reviews"] } });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

async function fetchAggregateRating(productId: number): Promise<AggregateRatingDTO | null> {
  try {
    const res = await fetch(`${API}/api/v1/products/${productId}/reviews/aggregate`, { next: { revalidate: 3600, tags: ["reviews"] } });
    if (!res.ok) return null;
    const data: AggregateRatingDTO = await res.json();
    return data.reviewCount > 0 ? data : null;
  } catch { return null; }
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

  const descParts: string[] = [];
  if (product.proteinPer100g != null) descParts.push(`${product.proteinPer100g}g proteina/100g`);
  if (product.primaryWeightGrams != null) {
    descParts.push(product.primaryWeightGrams >= 1000
      ? `${(product.primaryWeightGrams / 1000).toFixed(1)}kg pakovanje`
      : `${product.primaryWeightGrams}g pakovanje`);
  }
  const nutritionHint = descParts.length > 0 ? ` (${descParts.join(", ")})` : "";
  const description = `${product.name}${nutritionHint} — uporedi cene u srpskim prodavnicama. Najniža cena i value score na jednom mestu.`;

  return {
    title:       { absolute: title },
    description,
    alternates:  { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "Proteinoteka",
      locale: "sr_RS",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
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
  if (!product) {
    // Product deleted or never existed — 301 to the category listing so Google
    // can recrawl a useful page instead of accumulating 404s in GSC.
    permanentRedirect(PRODUCT_CATEGORY_TO_KATEGORIJA[category] ?? "/");
  }

  // Canonical enforcement: stale or mistyped URLs redirect to the current canonical form
  const canonical = productUrl(product);
  if (`/${category}/${slug}` !== canonical) {
    permanentRedirect(canonical);
  }

  const [similar, storePrices, reviews, aggregateRating] = await Promise.all([
    product.proteinSource ? fetchSimilar(product.proteinSource, product.id) : [],
    fetchStorePrices(product.id),
    fetchReviews(product.id),
    fetchAggregateRating(product.id),
  ]);

  // ── Schema.org ─────────────────────────────────────────────────────────────
  const canonicalUrl   = `${BASE_URL}${canonical}`;
  const catKey         = product.proteinSource ?? "";
  const catLabel       = PRODUCT_CATEGORY_LABELS[catKey] ?? null;
  const kategorijSlug  = product.proteinSource ? KATEGORIJA_SLUGS[product.proteinSource] : null;

  const plainDescription = product.aiDescription
    ? product.aiDescription.slice(0, 500)
    : product.description
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

  const priceValidUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const validStorePrices = storePrices.filter(
    (sp) => sp.numericPrice != null && sp.numericPrice > 0,
  );

  const offersSchema =
    validStorePrices.length > 1
      ? {
          "@type": "AggregateOffer",
          priceCurrency: "RSD",
          lowPrice: Math.min(...validStorePrices.map((sp) => sp.numericPrice!)),
          highPrice: Math.max(...validStorePrices.map((sp) => sp.numericPrice!)),
          offerCount: validStorePrices.length,
          offers: validStorePrices.map((sp) => ({
            "@type": "Offer",
            price: sp.numericPrice,
            priceCurrency: "RSD",
            availability: "https://schema.org/InStock",
            itemCondition: "https://schema.org/NewCondition",
            priceValidUntil,
            seller: { "@type": "Organization", name: sp.storeName },
          })),
        }
      : {
          "@type": "Offer",
          price: product.numericPrice,
          priceCurrency: "RSD",
          availability: "https://schema.org/InStock",
          itemCondition: "https://schema.org/NewCondition",
          priceValidUntil,
          url: canonicalUrl,
          seller: { "@type": "Organization", name: product.storeName },
        };

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      sku: String(product.id),
      ...(product.imageUrl && { image: product.imageUrl }),
      ...(product.brand && { brand: { "@type": "Brand", name: product.brand } }),
      ...(plainDescription && { description: plainDescription }),
      ...(catLabel && { category: catLabel }),
      offers: offersSchema,
      ...(aggregateRating && {
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: aggregateRating.averageRating,
          reviewCount: aggregateRating.reviewCount,
          bestRating: 5,
          worstRating: 1,
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
      <ProductPageContent product={product} similar={similar} storePrices={storePrices} reviews={reviews} aggregateRating={aggregateRating} />
    </>
  );
}
