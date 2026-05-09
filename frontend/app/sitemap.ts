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
    // SEO landing pages
    { url: `${BASE}/najbolji-whey-protein-srbija`, changeFrequency: "weekly" as const, priority: 0.85, lastModified: now },
    { url: `${BASE}/najjeftiniji-whey-protein`,    changeFrequency: "weekly" as const, priority: 0.85, lastModified: now },
    { url: `${BASE}/whey-protein-cena`,            changeFrequency: "weekly" as const, priority: 0.85, lastModified: now },
    { url: `${BASE}/whey-isolate-srbija`,          changeFrequency: "weekly" as const, priority: 0.85, lastModified: now },
    { url: `${BASE}/protein-za-masu`,              changeFrequency: "weekly" as const, priority: 0.85, lastModified: now },
    { url: `${BASE}/whey-protein-do-3000-dinara`,  changeFrequency: "weekly" as const, priority: 0.85, lastModified: now },
    { url: `${BASE}/whey-protein-do-5000-dinara`,  changeFrequency: "weekly" as const, priority: 0.85, lastModified: now },
    // Store pages
    { url: `${BASE}/ogistrashop-proteini`,    changeFrequency: "weekly" as const, priority: 0.8, lastModified: now },
    { url: `${BASE}/supplementshop-proteini`, changeFrequency: "weekly" as const, priority: 0.8, lastModified: now },
    { url: `${BASE}/pansport-proteini`,       changeFrequency: "weekly" as const, priority: 0.8, lastModified: now },
    { url: `${BASE}/fitlab-proteini`,         changeFrequency: "weekly" as const, priority: 0.8, lastModified: now },
    { url: `${BASE}/proteinbox-proteini`,     changeFrequency: "weekly" as const, priority: 0.8, lastModified: now },
    { url: `${BASE}/proteini-si-srbija`,      changeFrequency: "weekly" as const, priority: 0.8, lastModified: now },
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
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    return [...staticPages, ...productPages];
  } catch {
    return staticPages;
  }
}
