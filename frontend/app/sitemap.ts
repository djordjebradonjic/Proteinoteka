import { MetadataRoute } from "next";
import fs from "fs";
import path from "path";
import { CATEGORIES } from "@/lib/categories";
import { productUrl } from "@/lib/productUrl";
import { Product } from "@/types/product";
import { CURRENT_MARKET, MARKET_CONFIG } from "@/lib/marketConfig";

export const revalidate = 86400;

const BASE = `https://${MARKET_CONFIG[CURRENT_MARKET].domain}`;

// Guide URLs used to be a fully hand-maintained array — easy to forget to add a new
// guide directory to (it happened at least once). Instead, the slug list is read
// straight off the filesystem so a new guide always appears in the sitemap; only the
// per-guide priority/changeFrequency/lastModified tuning below stays manual (falls
// back to a sane default, with a build-log warning, if a guide has no tuned entry).
type GuideMeta = { changeFrequency: "weekly" | "monthly"; priority: number; lastModified?: Date };
const DEFAULT_GUIDE_META: GuideMeta = { changeFrequency: "monthly", priority: 0.6 };

function listGuideSlugs(routeSegment: string): string[] {
  const dir = path.join(process.cwd(), "app", routeSegment);
  try {
    return fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isDirectory() && fs.existsSync(path.join(dir, e.name, "page.tsx")))
      .map((e) => e.name)
      .sort();
  } catch {
    return [];
  }
}

function buildGuideEntries(
  routeSegment: string,
  metaOverrides: Record<string, GuideMeta>,
  indexEntry: MetadataRoute.Sitemap[number],
  now: Date,
): MetadataRoute.Sitemap {
  const slugsOnDisk = listGuideSlugs(routeSegment);
  const entries: MetadataRoute.Sitemap = [indexEntry];

  for (const slug of slugsOnDisk) {
    const meta = metaOverrides[slug];
    if (!meta) {
      console.warn(
        `[sitemap] ${routeSegment}/${slug} has no tuned sitemap entry — using defaults. ` +
          `Add it to the meta map in app/sitemap.ts to set a deliberate priority/changeFrequency.`,
      );
    }
    const m = meta ?? DEFAULT_GUIDE_META;
    entries.push({
      url: `${BASE}/${routeSegment}/${slug}`,
      changeFrequency: m.changeFrequency,
      priority: m.priority,
      lastModified: m.lastModified ?? now,
    });
  }

  for (const slug of Object.keys(metaOverrides)) {
    if (!slugsOnDisk.includes(slug)) {
      console.warn(
        `[sitemap] ${routeSegment}/${slug} has a tuned sitemap entry but no matching page.tsx on disk — remove it from app/sitemap.ts.`,
      );
    }
  }

  return entries;
}

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
    { url: `${BASE}/whey-protein-akcije`,       changeFrequency: "daily"   as const, priority: 0.85, lastModified: now },
    ...CATEGORIES.map((c) => ({
      url: `${BASE}/kategorija/${c.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.9,
      lastModified: now,
    })),
  ];

  const RS_GUIDE_META: Record<string, GuideMeta> = {
    "koliko-proteina-dnevno":           { changeFrequency: "monthly", priority: 0.7, lastModified: d("2025-04-01") },
    "kada-piti-protein":                { changeFrequency: "weekly",  priority: 0.75, lastModified: now },
    "whey-isolate-vs-concentrate":      { changeFrequency: "weekly",  priority: 0.75, lastModified: now },
    "da-li-protein-goji":               { changeFrequency: "monthly", priority: 0.7, lastModified: d("2025-05-01") },
    "protein-za-mrsavljenje":           { changeFrequency: "monthly", priority: 0.7, lastModified: d("2025-05-01") },
    "najbolji-protein-za-pocetnike":    { changeFrequency: "weekly",  priority: 0.85, lastModified: now },
    "whey-protein-za-pocetnike":        { changeFrequency: "monthly", priority: 0.7, lastModified: d("2025-05-01") },
    "kako-uzimati-whey-protein":        { changeFrequency: "weekly",  priority: 0.8, lastModified: now },
    "koliko-novca-mesecno-za-proteine": { changeFrequency: "weekly",  priority: 0.8, lastModified: now },
    "scitec-nutrition-whey":            { changeFrequency: "monthly", priority: 0.7, lastModified: d("2026-06-19") },
    "biotechusa-100-pure-whey":         { changeFrequency: "monthly", priority: 0.7, lastModified: d("2026-06-01") },
    "gold-standard-whey-recenzija":     { changeFrequency: "monthly", priority: 0.7, lastModified: d("2025-06-01") },
    "protein-za-zene":                  { changeFrequency: "monthly", priority: 0.7, lastModified: d("2026-05-01") },
    "dymatize-iso-100-recenzija":       { changeFrequency: "weekly",  priority: 0.8, lastModified: now },
    "belance-u-prahu":                  { changeFrequency: "weekly",  priority: 0.8, lastModified: now },
    "kazein-protein":                   { changeFrequency: "weekly",  priority: 0.8, lastModified: now },
    "najbolji-biljni-protein":          { changeFrequency: "weekly",  priority: 0.8, lastModified: now },
    "protein-bez-laktoze":              { changeFrequency: "weekly",  priority: 0.8, lastModified: now },
    "koji-whey-protein-kupiti":         { changeFrequency: "weekly",  priority: 0.8, lastModified: now },
  };

  const rsOnlyPages: MetadataRoute.Sitemap = CURRENT_MARKET === "rs" ? [
    // Guides (RS-only — Serbian language, must not appear in HR sitemap). Slugs are read
    // from the filesystem (see buildGuideEntries above); RS_GUIDE_META only tunes ranking hints.
    ...buildGuideEntries(
      "vodici",
      RS_GUIDE_META,
      { url: `${BASE}/vodici`, changeFrequency: "monthly", priority: 0.7, lastModified: d("2026-06-01") },
      now,
    ),
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
    { url: `${BASE}/ultimate-nutrition-proteini`, changeFrequency: "weekly" as const, priority: 0.85, lastModified: now },
    // Store pages
    { url: `${BASE}/ogistrashop-proteini`,       changeFrequency: "weekly" as const, priority: 0.8, lastModified: now },
    { url: `${BASE}/supplementshop-proteini`,    changeFrequency: "weekly" as const, priority: 0.8, lastModified: now },
    { url: `${BASE}/pansport-proteini`,          changeFrequency: "weekly" as const, priority: 0.8, lastModified: now },
    { url: `${BASE}/fitlab-proteini`,            changeFrequency: "weekly" as const, priority: 0.8, lastModified: now },
    { url: `${BASE}/gymbeam-proteini`,           changeFrequency: "weekly" as const, priority: 0.85, lastModified: now },
    { url: `${BASE}/myprotein-proteini`,         changeFrequency: "weekly" as const, priority: 0.85, lastModified: now },
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

  const HR_GUIDE_META: Record<string, GuideMeta> = {
    "najbolji-protein-za-pocetnike-hrvatska":  { changeFrequency: "weekly",  priority: 0.85, lastModified: now },
    "whey-protein-za-pocetnike-hrvatska":      { changeFrequency: "monthly", priority: 0.75, lastModified: now },
    "kako-uzimati-whey-protein-hrvatska":      { changeFrequency: "weekly",  priority: 0.8,  lastModified: now },
    "koliko-kosta-protein-hrvatska":           { changeFrequency: "weekly",  priority: 0.8,  lastModified: now },
    "koliko-proteina-dnevno-hrvatska":         { changeFrequency: "monthly", priority: 0.75, lastModified: now },
    "da-li-protein-goji-hrvatska":             { changeFrequency: "monthly", priority: 0.75, lastModified: now },
    "protein-za-mrsavljenje-hrvatska":         { changeFrequency: "weekly",  priority: 0.8,  lastModified: now },
    "kada-piti-protein-hrvatska":              { changeFrequency: "monthly", priority: 0.75, lastModified: now },
    "whey-isolate-vs-concentrate-hrvatska":    { changeFrequency: "monthly", priority: 0.75, lastModified: now },
    "protein-za-zene-hrvatska":                { changeFrequency: "monthly", priority: 0.75, lastModified: now },
  };

  const hrOnlyPages: MetadataRoute.Sitemap = CURRENT_MARKET === "hr" ? [
    // Guides — slugs read from the filesystem, see RS block above for the same pattern.
    ...buildGuideEntries(
      "hr-vodici",
      HR_GUIDE_META,
      { url: `${BASE}/hr-vodici`, changeFrequency: "monthly", priority: 0.7, lastModified: now },
      now,
    ),
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
