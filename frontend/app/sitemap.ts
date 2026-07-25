import { MetadataRoute } from "next";
import { CATEGORIES } from "@/lib/categories";
import { productUrl } from "@/lib/productUrl";
import { Product } from "@/types/product";
import { CURRENT_MARKET, MARKET_CONFIG } from "@/lib/marketConfig";

export const revalidate = 86400;

const BASE = `https://${MARKET_CONFIG[CURRENT_MARKET].domain}`;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  // Fixed dates for truly static pages — avoids signalling daily changes to crawlers
  const d = (s: string) => new Date(s);

  const commonPages: MetadataRoute.Sitemap = [
    { url: BASE,                     changeFrequency: "daily"   as const, priority: 1.0, lastModified: now },
    { url: `${BASE}/privacy-policy`, changeFrequency: "monthly" as const, priority: 0.3, lastModified: d("2025-01-01") },
    { url: `${BASE}/terms-of-use`,   changeFrequency: "monthly" as const, priority: 0.3, lastModified: d("2025-01-01") },
    { url: `${BASE}/kontakt`,        changeFrequency: "monthly" as const, priority: 0.3, lastModified: d("2025-01-01") },
    { url: `${BASE}/kako-racunamo-value-score`, changeFrequency: "monthly" as const, priority: 0.6, lastModified: d("2025-03-01") },
    { url: `${BASE}/o-nama`,                    changeFrequency: "monthly" as const, priority: 0.5, lastModified: d("2025-01-01") },
    { url: `${BASE}/newsletter`,                changeFrequency: "monthly" as const, priority: 0.4, lastModified: d("2026-07-18") },
    { url: `${BASE}/baza-podataka`,             changeFrequency: "monthly" as const, priority: 0.5, lastModified: d("2025-06-01") },
    { url: `${BASE}/crni-petak`,                changeFrequency: "daily"   as const, priority: 0.9, lastModified: now },
    ...CATEGORIES.map((c) => ({
      url: `${BASE}/kategorija/${c.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.9,
      lastModified: now,
    })),
  ];

  const rsOnlyPages: MetadataRoute.Sitemap = CURRENT_MARKET === "rs" ? [
    // Guides (RS-only — Serbian language, must not appear in HR sitemap)
    { url: `${BASE}/vodici`,                                  changeFrequency: "monthly" as const, priority: 0.7, lastModified: d("2026-06-01") },
    { url: `${BASE}/vodici/koliko-proteina-dnevno`,           changeFrequency: "monthly" as const, priority: 0.7, lastModified: d("2025-04-01") },
    { url: `${BASE}/vodici/kada-piti-protein`,                changeFrequency: "monthly" as const, priority: 0.7, lastModified: d("2025-04-01") },
    { url: `${BASE}/vodici/whey-isolate-vs-concentrate`,      changeFrequency: "monthly" as const, priority: 0.7, lastModified: d("2025-04-01") },
    { url: `${BASE}/vodici/da-li-protein-goji`,               changeFrequency: "monthly" as const, priority: 0.7, lastModified: d("2025-05-01") },
    { url: `${BASE}/vodici/protein-za-mrsavljenje`,           changeFrequency: "monthly" as const, priority: 0.7, lastModified: d("2025-05-01") },
    { url: `${BASE}/vodici/najbolji-protein-za-pocetnike`,    changeFrequency: "weekly"  as const, priority: 0.85, lastModified: now },
    { url: `${BASE}/vodici/whey-protein-za-pocetnike`,        changeFrequency: "monthly" as const, priority: 0.7, lastModified: d("2025-05-01") },
    { url: `${BASE}/vodici/kako-uzimati-whey-protein`,        changeFrequency: "weekly"  as const, priority: 0.8, lastModified: now },
    { url: `${BASE}/vodici/koliko-novca-mesecno-za-proteine`, changeFrequency: "weekly"  as const, priority: 0.8, lastModified: now },
    { url: `${BASE}/vodici/scitec-nutrition-whey`,            changeFrequency: "monthly" as const, priority: 0.7, lastModified: d("2026-06-19") },
    { url: `${BASE}/vodici/biotechusa-100-pure-whey`,         changeFrequency: "monthly" as const, priority: 0.7, lastModified: d("2026-06-01") },
    { url: `${BASE}/vodici/gold-standard-whey-recenzija`,     changeFrequency: "monthly" as const, priority: 0.7, lastModified: d("2025-06-01") },
    { url: `${BASE}/vodici/protein-za-zene`,                  changeFrequency: "monthly" as const, priority: 0.7, lastModified: d("2026-05-01") },
    // SEO landing pages
    { url: `${BASE}/najbolji-whey-protein-srbija`, changeFrequency: "weekly" as const, priority: 0.85, lastModified: now },
    { url: `${BASE}/najjeftiniji-whey-protein`,    changeFrequency: "weekly" as const, priority: 0.85, lastModified: now },
    { url: `${BASE}/whey-protein-cena`,            changeFrequency: "weekly" as const, priority: 0.85, lastModified: now },
    { url: `${BASE}/whey-isolate-srbija`,          changeFrequency: "weekly" as const, priority: 0.85, lastModified: now },
    { url: `${BASE}/protein-za-masu`,              changeFrequency: "weekly" as const, priority: 0.85, lastModified: now },
    { url: `${BASE}/whey-protein-do-3000-dinara`,  changeFrequency: "weekly" as const, priority: 0.85, lastModified: now },
    { url: `${BASE}/whey-protein-do-5000-dinara`,  changeFrequency: "weekly" as const, priority: 0.85, lastModified: now },
    { url: `${BASE}/kazein-protein-srbija`,        changeFrequency: "weekly" as const, priority: 0.85, lastModified: now },
    { url: `${BASE}/biljni-protein-srbija`,        changeFrequency: "weekly" as const, priority: 0.85, lastModified: now },
    { url: `${BASE}/hidrolizat-protein-srbija`,    changeFrequency: "weekly" as const, priority: 0.85, lastModified: now },
    // Brand pages
    { url: `${BASE}/gold-standard-whey-cena`,    changeFrequency: "weekly" as const, priority: 0.85, lastModified: now },
    { url: `${BASE}/optimum-nutrition-proteini`, changeFrequency: "weekly" as const, priority: 0.85, lastModified: now },
    { url: `${BASE}/scitec-nutrition-proteini`,  changeFrequency: "weekly" as const, priority: 0.85, lastModified: now },
    { url: `${BASE}/dymatize-proteini`,          changeFrequency: "weekly" as const, priority: 0.85, lastModified: now },
    { url: `${BASE}/biotech-usa-proteini`,       changeFrequency: "weekly" as const, priority: 0.85, lastModified: now },
    // Store pages
    { url: `${BASE}/ogistrashop-proteini`,       changeFrequency: "weekly" as const, priority: 0.8, lastModified: now },
    { url: `${BASE}/supplementshop-proteini`,    changeFrequency: "weekly" as const, priority: 0.8, lastModified: now },
    { url: `${BASE}/pansport-proteini`,          changeFrequency: "weekly" as const, priority: 0.8, lastModified: now },
    { url: `${BASE}/fitlab-proteini`,            changeFrequency: "weekly" as const, priority: 0.8, lastModified: now },
    { url: `${BASE}/proteinbox-proteini`,        changeFrequency: "weekly" as const, priority: 0.8, lastModified: now },
    { url: `${BASE}/proteini-si-srbija`,         changeFrequency: "weekly" as const, priority: 0.8, lastModified: now },
    { url: `${BASE}/lama-proteini`,              changeFrequency: "weekly" as const, priority: 0.8, lastModified: now },
    { url: `${BASE}/shopbuilder-proteini`,       changeFrequency: "weekly" as const, priority: 0.8, lastModified: now },
    { url: `${BASE}/supplement-store-proteini`, changeFrequency: "weekly" as const, priority: 0.8, lastModified: now },
    { url: `${BASE}/xsport-proteini`,            changeFrequency: "weekly" as const, priority: 0.8, lastModified: now },
    // Price-range subpages
    { url: `${BASE}/najjeftiniji-whey-protein-do-500g`,       changeFrequency: "weekly" as const, priority: 0.8, lastModified: now },
    { url: `${BASE}/najjeftiniji-whey-protein-1500g-2500g`,   changeFrequency: "weekly" as const, priority: 0.8, lastModified: now },
    { url: `${BASE}/najjeftiniji-whey-protein-2500g-3500g`,   changeFrequency: "weekly" as const, priority: 0.8, lastModified: now },
    { url: `${BASE}/najjeftiniji-whey-protein-3500g-4500g`,   changeFrequency: "weekly" as const, priority: 0.8, lastModified: now },
    { url: `${BASE}/najjeftiniji-whey-protein-4500g-plus`,    changeFrequency: "weekly" as const, priority: 0.8, lastModified: now },
  ] : [];

  const hrOnlyPages: MetadataRoute.Sitemap = CURRENT_MARKET === "hr" ? [
    // Guides
    { url: `${BASE}/hr-vodici`,                                         changeFrequency: "monthly" as const, priority: 0.7,  lastModified: now },
    { url: `${BASE}/hr-vodici/najbolji-protein-za-pocetnike-hrvatska`,  changeFrequency: "weekly"  as const, priority: 0.85, lastModified: now },
    { url: `${BASE}/hr-vodici/whey-protein-za-pocetnike-hrvatska`,      changeFrequency: "monthly" as const, priority: 0.75, lastModified: now },
    { url: `${BASE}/hr-vodici/kako-uzimati-whey-protein-hrvatska`,      changeFrequency: "weekly"  as const, priority: 0.8,  lastModified: now },
    { url: `${BASE}/hr-vodici/koliko-kosta-protein-hrvatska`,           changeFrequency: "weekly"  as const, priority: 0.8,  lastModified: now },
    { url: `${BASE}/hr-vodici/koliko-proteina-dnevno-hrvatska`,        changeFrequency: "monthly" as const, priority: 0.75, lastModified: now },
    { url: `${BASE}/hr-vodici/da-li-protein-goji-hrvatska`,            changeFrequency: "monthly" as const, priority: 0.75, lastModified: now },
    { url: `${BASE}/hr-vodici/protein-za-mrsavljenje-hrvatska`,        changeFrequency: "weekly"  as const, priority: 0.8,  lastModified: now },
    // SEO landing pages
    { url: `${BASE}/najbolji-whey-protein-hrvatska`,     changeFrequency: "weekly" as const, priority: 0.85, lastModified: now },
    { url: `${BASE}/najjeftiniji-whey-protein-hrvatska`, changeFrequency: "weekly" as const, priority: 0.85, lastModified: now },
    { url: `${BASE}/whey-protein-cijena`,                changeFrequency: "weekly" as const, priority: 0.85, lastModified: now },
    { url: `${BASE}/whey-isolate-hrvatska`,              changeFrequency: "weekly" as const, priority: 0.85, lastModified: now },
    { url: `${BASE}/hidrolizat-protein-hrvatska`,        changeFrequency: "weekly" as const, priority: 0.85, lastModified: now },
    { url: `${BASE}/kazein-protein-hrvatska`,            changeFrequency: "weekly" as const, priority: 0.85, lastModified: now },
    { url: `${BASE}/biljni-protein-hrvatska`,            changeFrequency: "weekly" as const, priority: 0.85, lastModified: now },
    { url: `${BASE}/whey-protein-do-20-eura`,            changeFrequency: "weekly" as const, priority: 0.85, lastModified: now },
    { url: `${BASE}/whey-protein-do-40-eura`,            changeFrequency: "weekly" as const, priority: 0.85, lastModified: now },
    { url: `${BASE}/proteini-si-hrvatska`,               changeFrequency: "weekly" as const, priority: 0.8,  lastModified: now },
    // Price-range subpages
    { url: `${BASE}/najjeftiniji-whey-protein-hrvatska-do-500g`,       changeFrequency: "weekly" as const, priority: 0.8, lastModified: now },
    { url: `${BASE}/najjeftiniji-whey-protein-hrvatska-1500g-2500g`,   changeFrequency: "weekly" as const, priority: 0.8, lastModified: now },
    { url: `${BASE}/najjeftiniji-whey-protein-hrvatska-2500g-3500g`,   changeFrequency: "weekly" as const, priority: 0.8, lastModified: now },
    { url: `${BASE}/najjeftiniji-whey-protein-hrvatska-3500g-4500g`,   changeFrequency: "weekly" as const, priority: 0.8, lastModified: now },
    { url: `${BASE}/najjeftiniji-whey-protein-hrvatska-4500g-plus`,    changeFrequency: "weekly" as const, priority: 0.8, lastModified: now },
  ] : [];

  const staticPages = [...commonPages, ...rsOnlyPages, ...hrOnlyPages];

  try {
    // Fetch products with enough data to build slug-based URLs. Paginated rather than a
    // single size=2000 request — 2000 is Spring's default max-page-size, and the catalog
    // has grown past that per market, which was silently dropping newer products from the
    // sitemap. Capped at 25 pages (50,000 products) to match Google's per-sitemap URL limit.
    const products: Product[] = [];
    for (let page = 0; page < 25; page++) {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products?size=2000&page=${page}&sort=id,asc&market=${CURRENT_MARKET}`,
        { next: { revalidate: 86400 } },
      );
      if (!res.ok) break;

      const data = await res.json();
      const content: Product[] = data.content ?? [];
      products.push(...content);

      if (data.last !== false || content.length === 0) break;
    }

    if (products.length === 0) return staticPages;

    // Duplicate-content consolidation: when several stores sell the same physical product,
    // each store's row has its own page but only the oldest listing (lowest id) per group
    // is SEO-canonical (see [category]/[slug]/page.tsx generateMetadata). Submitting every
    // near-identical sibling for indexing wastes crawl budget and reinforces the duplicate
    // signal — only the canonical member of each group goes into the sitemap.
    const lowestIdByGroup = new Map<number, number>();
    for (const p of products) {
      if (p.groupId == null) continue;
      const current = lowestIdByGroup.get(p.groupId);
      if (current === undefined || p.id < current) lowestIdByGroup.set(p.groupId, p.id);
    }
    const canonicalProducts = products.filter(
      (p) => p.groupId == null || lowestIdByGroup.get(p.groupId) === p.id,
    );

    const productPages: MetadataRoute.Sitemap = canonicalProducts.map((p) => ({
      url: `${BASE}${productUrl(p)}`,
      lastModified: p.lastUpdated ? new Date(p.lastUpdated) : now,
      changeFrequency: "weekly" as const,
      priority: p.valueScore != null && p.valueScore >= 7 ? 0.9 : 0.75,
    }));

    return [...staticPages, ...productPages];
  } catch {
    return staticPages;
  }
}
