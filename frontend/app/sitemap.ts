import { MetadataRoute } from "next";
import { CATEGORIES } from "@/lib/categories";
import { productUrl } from "@/lib/productUrl";
import { Product } from "@/types/product";

export const revalidate = 86400;

const BASE = "https://proteinoteka.rs";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE,                     changeFrequency: "daily"   as const, priority: 1.0, lastModified: now },
    { url: `${BASE}/privacy-policy`, changeFrequency: "monthly" as const, priority: 0.3, lastModified: now },
    { url: `${BASE}/terms-of-use`,   changeFrequency: "monthly" as const, priority: 0.3, lastModified: now },
    { url: `${BASE}/kontakt`,        changeFrequency: "monthly" as const, priority: 0.3, lastModified: now },
    { url: `${BASE}/kako-racunamo-value-score`, changeFrequency: "monthly" as const, priority: 0.6, lastModified: now },
    { url: `${BASE}/o-nama`,                    changeFrequency: "monthly" as const, priority: 0.5, lastModified: now },
    // Guides
    { url: `${BASE}/vodici`,                                changeFrequency: "monthly" as const, priority: 0.7, lastModified: now },
    { url: `${BASE}/vodici/koliko-proteina-dnevno`,         changeFrequency: "monthly" as const, priority: 0.7, lastModified: now },
    { url: `${BASE}/vodici/kada-piti-protein`,              changeFrequency: "monthly" as const, priority: 0.7, lastModified: now },
    { url: `${BASE}/vodici/whey-isolate-vs-concentrate`,    changeFrequency: "monthly" as const, priority: 0.7, lastModified: now },
    { url: `${BASE}/vodici/da-li-protein-goji`,                      changeFrequency: "monthly" as const, priority: 0.7, lastModified: now },
    { url: `${BASE}/vodici/protein-za-mrsavljenje`,                  changeFrequency: "monthly" as const, priority: 0.7, lastModified: now },
    { url: `${BASE}/vodici/whey-protein-za-pocetnike`,               changeFrequency: "monthly" as const, priority: 0.7, lastModified: now },
    { url: `${BASE}/vodici/koliko-novca-mesecno-za-proteine`,        changeFrequency: "weekly"  as const, priority: 0.8, lastModified: now },
    { url: `${BASE}/vodici/protein-za-zene`,                        changeFrequency: "monthly" as const, priority: 0.7, lastModified: now },
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
    { url: `${BASE}/baza-podataka`,                changeFrequency: "monthly" as const, priority: 0.5, lastModified: now },
    // Brand pages
    { url: `${BASE}/gold-standard-whey-cena`,    changeFrequency: "weekly" as const, priority: 0.85, lastModified: now },
    { url: `${BASE}/optimum-nutrition-proteini`, changeFrequency: "weekly" as const, priority: 0.85, lastModified: now },
    { url: `${BASE}/scitec-nutrition-proteini`,  changeFrequency: "weekly" as const, priority: 0.85, lastModified: now },
    { url: `${BASE}/dymatize-proteini`,          changeFrequency: "weekly" as const, priority: 0.85, lastModified: now },
    { url: `${BASE}/biotech-usa-proteini`,       changeFrequency: "weekly" as const, priority: 0.85, lastModified: now },
    // Store pages
    { url: `${BASE}/ogistrashop-proteini`,    changeFrequency: "weekly" as const, priority: 0.8, lastModified: now },
    { url: `${BASE}/supplementshop-proteini`, changeFrequency: "weekly" as const, priority: 0.8, lastModified: now },
    { url: `${BASE}/pansport-proteini`,       changeFrequency: "weekly" as const, priority: 0.8, lastModified: now },
    { url: `${BASE}/fitlab-proteini`,         changeFrequency: "weekly" as const, priority: 0.8, lastModified: now },
    { url: `${BASE}/proteinbox-proteini`,     changeFrequency: "weekly" as const, priority: 0.8, lastModified: now },
    { url: `${BASE}/proteini-si-srbija`,          changeFrequency: "weekly" as const, priority: 0.8, lastModified: now },
    { url: `${BASE}/lama-proteini`,               changeFrequency: "weekly" as const, priority: 0.8, lastModified: now },
    { url: `${BASE}/supplement-store-proteini`,   changeFrequency: "weekly" as const, priority: 0.8, lastModified: now },
    ...CATEGORIES.map((c) => ({
      url: `${BASE}/kategorija/${c.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.9,
      lastModified: now,
    })),
  ];

  try {
    // Fetch products with enough data to build slug-based URLs
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products?size=2000&sort=id,asc`,
      { next: { revalidate: 86400 } },
    );
    if (!res.ok) return staticPages;

    const data = await res.json();
    const products: Product[] = data.content ?? [];

    const productPages: MetadataRoute.Sitemap = products.map((p) => ({
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
