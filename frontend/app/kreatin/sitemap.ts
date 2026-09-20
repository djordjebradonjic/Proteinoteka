import { MetadataRoute } from "next";
import { CURRENT_MARKET, MARKET_CONFIG } from "@/lib/marketConfig";
import { productUrl } from "@/lib/productUrl";
import { CREATINE_PATH } from "@/lib/creatine";
import { fetchAllCreatine } from "@/lib/creatine-data";

// The creatine section's own sitemap (/kreatin/sitemap.xml, listed in robots.txt): the listing plus one URL per
// creatine product. Kept apart from app/sitemap.ts so the protein sitemap stays untouched by a new family.

export const revalidate = 86400;

const BASE = `https://${MARKET_CONFIG[CURRENT_MARKET].domain}`;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await fetchAllCreatine();
  // Nothing to index until the market actually carries creatine (the listing page is noindex then too)
  if (products.length === 0) return [];

  // A member of a cross-store group declares the group's oldest listing (lowest id) as its rel=canonical (see
  // [slug]/page.tsx generateMetadata), so only that one belongs in the sitemap. List rows carry groupId but not
  // groupCanonicalId, and a group never mixes families, so the lowest id is taken over this full read.
  const lowestIdByGroup = new Map<number, number>();
  for (const p of products) {
    if (p.groupId == null) continue;
    const current = lowestIdByGroup.get(p.groupId);
    if (current === undefined || p.id < current) lowestIdByGroup.set(p.groupId, p.id);
  }

  const now = new Date();
  return [
    { url: `${BASE}${CREATINE_PATH}`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    ...products
      .filter((p) => p.groupId == null || lowestIdByGroup.get(p.groupId) === p.id)
      .map((p) => ({
        url: `${BASE}${productUrl(p)}`,
        lastModified: p.lastUpdated ? new Date(p.lastUpdated) : now,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
  ];
}
