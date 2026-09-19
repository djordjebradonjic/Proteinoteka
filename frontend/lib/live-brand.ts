import { cache } from "react";
import type { Metadata } from "next";
import type { Product } from "@/types/product";
import { fetchBrandProducts } from "@/lib/seo-data";
import { formatPrice } from "@/lib/formatPrice";
import { rsPageMetadata } from "@/lib/seo-meta";
import type { BrandLine } from "@/lib/brand-line-stats";

// Config for brand landing pages whose every number is derived from the live catalog
// (see components/seo/LiveBrandPage.tsx). A page file is just this config.

export interface BrandFaq {
  q: string;
  a: string;
}

export interface LiveBrandConfig {
  /** URL path segment, e.g. "nutriversum-proteini". */
  slug: string;
  /** Name as shown in copy, e.g. "Nutriversum". */
  brandName: string;
  /** Brand spellings as stored in the products table (API compares case-insensitively, comma list). */
  apiBrands: string;
  h1: string;
  /** Qualitative one or two sentences, no figures — figures are appended from the data. */
  lead: string;
  lines: BrandLine[];
  /** Line whose packs get their own price-per-pack table and pack-size FAQ. */
  focusLineKey?: string;
  metaDescription: string;
  ogTitle: string;
  extraFaqs?: BrandFaq[];
  extraGuideLinks?: { label: string; href: string }[];
}

export const loadBrand = cache(async (apiBrands: string): Promise<Product[]> => {
  const fetched = await fetchBrandProducts({ brand: apiBrands, limit: 100 });
  const seen = new Set<number>();
  const products = fetched.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
  // fetch helpers swallow errors and return []; never let ISR cache that as a "valid" empty page.
  if (products.length === 0) throw new Error(`live-brand: no products returned for "${apiBrands}", refusing to render`);
  return products;
});

/** generateMetadata with the cheapest listing in the title; any failure falls back to a static title. */
export function brandMetadata(cfg: LiveBrandConfig) {
  return async (): Promise<Metadata> => {
    let from = "";
    try {
      const prices = (await loadBrand(cfg.apiBrands)).map((p) => p.numericPrice).filter((v) => v > 0);
      if (prices.length > 0) from = `, od ${formatPrice(Math.round(Math.min(...prices)))}`;
    } catch {
      /* static fallback */
    }
    return rsPageMetadata({
      path: `/${cfg.slug}`,
      title: `${cfg.brandName} proteini cena u Srbiji${from}`,
      description: cfg.metaDescription,
      ogTitle: cfg.ogTitle,
    });
  };
}
