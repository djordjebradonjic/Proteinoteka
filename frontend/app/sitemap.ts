import { MetadataRoute } from "next";
import { CATEGORIES } from "@/lib/categories";

export const revalidate = 3600;

const BASE = "https://proteinoteka.rs";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE,                     changeFrequency: "daily"   as const, priority: 1.0, lastModified: now },
    { url: `${BASE}/privacy-policy`, changeFrequency: "monthly" as const, priority: 0.3, lastModified: now },
    { url: `${BASE}/terms-of-use`,   changeFrequency: "monthly" as const, priority: 0.3, lastModified: now },
    { url: `${BASE}/blog`,           changeFrequency: "weekly"  as const, priority: 0.5, lastModified: now },
    { url: `${BASE}/kontakt`,        changeFrequency: "monthly" as const, priority: 0.3, lastModified: now },
    ...CATEGORIES.map((c) => ({
      url: `${BASE}/kategorija/${c.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.9,
      lastModified: now,
    })),
  ];

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/ids`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return staticPages;

    const ids: number[] = await res.json();
    const productPages: MetadataRoute.Sitemap = ids.map((id) => ({
      url: `${BASE}/product/${id}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    return [...staticPages, ...productPages];
  } catch {
    return staticPages;
  }
}
