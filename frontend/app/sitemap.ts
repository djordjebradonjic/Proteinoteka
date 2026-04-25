import { MetadataRoute } from "next";
import { CATEGORIES } from "@/lib/categories";

// Keširaj sitemap na 1 sat da ne bi stalno udarao na Railway API
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://proteinoteka.rs";

  const categoryPages: MetadataRoute.Sitemap = CATEGORIES.map((c) => ({
    url: `${baseUrl}/kategorija/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.9,
  }));

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...categoryPages,
  ];

  try {
   
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products?size=2000`, 
      { next: { revalidate: 3600 } }
    );
    
    if (!res.ok) return staticPages;

    const data = await res.json();
    
    const products = data.content || [];

    const productPages: MetadataRoute.Sitemap = products.map(
      (product: { id: number }) => ({
        url: `${baseUrl}/product/${product.id}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      })
    );

    return [...staticPages, ...productPages];
  } catch (error) {
    console.error("Sitemap error:", error);
    return staticPages;
  }
}