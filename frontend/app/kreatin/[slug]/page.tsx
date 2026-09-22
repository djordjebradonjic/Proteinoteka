import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import CreatineProductContent from "@/components/creatine/CreatineProductContent";
import { CURRENT_MARKET, MARKET_CONFIG } from "@/lib/marketConfig";
import { safeJsonLd } from "@/lib/jsonLd";
import { extractProductId, productUrl } from "@/lib/productUrl";
import { displayName } from "@/lib/productDisplayName";
import { formatPrice } from "@/lib/formatPrice";
import {
  CREATINE_COPY,
  CREATINE_PATH,
  FORM_LABELS,
  TYPE_LABELS,
  isCreatine,
  packLabel,
  storeCount,
} from "@/lib/creatine";
import {
  fetchCreatineProduct,
  fetchCreatineStorePrices,
  fetchSimilarCreatine,
} from "@/lib/creatine-data";

export const revalidate = 86400;

const MARKET = MARKET_CONFIG[CURRENT_MARKET];
const BASE = `https://${MARKET.domain}`;
const COPY = CREATINE_COPY;
const MAX_TITLE_CHARS = 65;

interface Params { params: Promise<{ slug: string }> }

const NOT_FOUND_META: Metadata = { title: { absolute: "Kreatin | Proteinoteka" }, robots: { index: false, follow: true } };

/** Offers are re-read at least weekly (ISR is daily, prices are scraped weekly), so that is how long one is valid. */
function weekFromNow(): string {
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
}

function buildTitle(name: string): string {
  const full = name + COPY.product.titleSuffix;
  if (full.length <= MAX_TITLE_CHARS) return full;
  const maxName = MAX_TITLE_CHARS - COPY.product.titleSuffix.length;
  return name.slice(0, maxName).replace(/\s+\S*$/, "") + COPY.product.titleSuffix;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const id = extractProductId(slug);
  if (!id) return NOT_FOUND_META;

  const product = await fetchCreatineProduct(id);
  if (!product || !isCreatine(product) || (product.market && product.market !== CURRENT_MARKET)) return NOT_FOUND_META;

  // Same duplicate-consolidation rule as the protein pages: every member of a cross-store group points its
  // canonical at the group's oldest listing (the backend's groupCanonicalId), the page itself still renders.
  let canonical = `${BASE}${productUrl(product)}`;
  if (product.groupCanonicalId != null && product.groupCanonicalId !== product.id) {
    const head = await fetchCreatineProduct(product.groupCanonicalId);
    if (head && isCreatine(head)) canonical = `${BASE}${productUrl(head)}`;
  }

  const storePrices = await fetchCreatineStorePrices(product.id);
  const priced = storePrices.filter((sp) => sp.numericPrice != null && sp.numericPrice > 0);

  const shownName = displayName(product);
  const pack = packLabel(product);
  const title = buildTitle(shownName);
  const priceHint =
    priced.length > 1
      ? ` ${CURRENT_MARKET === "hr" ? "Cijena" : "Cena"} od ${formatPrice(Math.min(...priced.map((sp) => sp.numericPrice!)))} do ${formatPrice(Math.max(...priced.map((sp) => sp.numericPrice!)))} u ${storeCount(priced.length)}.`
      : "";
  const description = `${shownName}${pack ? ` (${pack})` : ""}.${priceHint} ${COPY.product.descSuffix}`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "Proteinoteka",
      locale: MARKET.ogLocale,
      type: "website",
      images: product.imageUrl
        ? [{ url: product.imageUrl, width: 800, height: 800, alt: product.name }]
        : [{ url: `${BASE}/opengraph-image`, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: product.imageUrl ? [product.imageUrl] : [`${BASE}/opengraph-image`],
    },
  };
}

export default async function CreatineProductPage({ params }: Params) {
  const { slug } = await params;
  const id = extractProductId(slug);
  if (!id) notFound();

  const product = await fetchCreatineProduct(id);
  if (!product) notFound();

  // A product of the other market, on this deployment: hard 404 (no cross-domain duplicates).
  if (product.market && product.market !== CURRENT_MARKET) notFound();

  // Not a creatine at all (a protein reached through the wrong prefix): send it to where it lives.
  if (!isCreatine(product)) permanentRedirect(productUrl(product));

  // Stale or mistyped slug: one canonical URL per product.
  const canonicalPath = productUrl(product);
  if (`${CREATINE_PATH}/${slug}` !== canonicalPath) permanentRedirect(canonicalPath);

  const [storePrices, similar] = await Promise.all([
    fetchCreatineStorePrices(product.id),
    fetchSimilarCreatine(product),
  ]);

  const canonicalUrl = `${BASE}${canonicalPath}`;
  const priced = storePrices.filter((sp) => sp.numericPrice != null && sp.numericPrice > 0);
  const priceValidUntil = weekFromNow();

  const offers =
    priced.length > 1
      ? {
          "@type": "AggregateOffer",
          priceCurrency: MARKET.currency,
          lowPrice: Math.min(...priced.map((sp) => sp.numericPrice!)),
          highPrice: Math.max(...priced.map((sp) => sp.numericPrice!)),
          offerCount: priced.length,
          offers: priced.map((sp) => ({
            "@type": "Offer",
            price: sp.numericPrice,
            priceCurrency: MARKET.currency,
            availability: "https://schema.org/InStock",
            itemCondition: "https://schema.org/NewCondition",
            priceValidUntil,
            seller: { "@type": "Organization", name: sp.storeName },
            ...(sp.url && { url: sp.url }),
          })),
        }
      : {
          "@type": "Offer",
          price: product.numericPrice,
          priceCurrency: MARKET.currency,
          availability: "https://schema.org/InStock",
          itemCondition: "https://schema.org/NewCondition",
          priceValidUntil,
          url: canonicalUrl,
          seller: { "@type": "Organization", name: product.storeName },
        };

  const formLabel = FORM_LABELS[product.productForm ?? ""] ?? null;
  const typeLabel = product.creatineType ? TYPE_LABELS[product.creatineType] ?? null : null;
  const pack = packLabel(product);
  const plainDescription = product.aiDescription
    ? product.aiDescription.slice(0, 500)
    : [product.brand, product.name, typeLabel, formLabel, pack].filter(Boolean).join(" – ");

  const properties = [
    ...(product.valueScore != null ? [{ "@type": "PropertyValue", name: "Proteinoteka Value Score", value: Math.round(product.valueScore * 10) / 10, maxValue: 10 }] : []),
    ...(formLabel ? [{ "@type": "PropertyValue", name: COPY.product.form, value: formLabel }] : []),
    ...(typeLabel ? [{ "@type": "PropertyValue", name: COPY.product.type, value: typeLabel }] : []),
    ...(pack ? [{ "@type": "PropertyValue", name: COPY.product.pack, value: pack }] : []),
    ...(product.servingsPerContainer ? [{ "@type": "PropertyValue", name: COPY.product.servings, value: product.servingsPerContainer }] : []),
  ];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      sku: String(product.id),
      ...(product.imageUrl && { image: product.imageUrl }),
      ...(product.brand && { brand: { "@type": "Brand", name: product.brand } }),
      description: plainDescription,
      category: COPY.navLabel,
      offers,
      ...(properties.length > 0 && { additionalProperty: properties }),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: COPY.breadcrumbHome, item: BASE },
        { "@type": "ListItem", position: 2, name: COPY.navLabel, item: `${BASE}${CREATINE_PATH}` },
        { "@type": "ListItem", position: 3, name: product.name, item: canonicalUrl },
      ],
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <CreatineProductContent product={product} storePrices={storePrices} similar={similar} />
    </>
  );
}
