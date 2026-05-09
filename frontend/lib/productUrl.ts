// URL segments used in product page paths: /{category}/{name-slug}-{id}
// Optimised for search volume rather than literal DB enum values.
export const PRODUCT_CATEGORY_SLUGS: Record<string, string> = {
  whey_concentrate: "whey-protein",
  whey_isolate:     "whey-izolat",
  hydrolysate:      "hidrolizat",
  casein:           "kazein",
  vegan:            "biljni-protein",
  blend:            "protein-blend",
};

// Category labels shown in breadcrumbs and metadata
export const PRODUCT_CATEGORY_LABELS: Record<string, string> = {
  whey_concentrate: "Whey Protein",
  whey_isolate:     "Whey Izolat",
  hydrolysate:      "Hidrolizat",
  casein:           "Kazein",
  vegan:            "Biljni Protein",
  blend:            "Protein Blend",
};

// Slugs used in /kategorija/[slug] listing pages (separate from product URL segments)
export const KATEGORIJA_SLUGS: Record<string, string> = {
  whey_concentrate: "whey-concentrate",
  whey_isolate:     "whey-isolate",
  hydrolysate:      "hidrolizat",
  casein:           "kazein",
  vegan:            "biljni-protein",
  blend:            "blend",
};

const VALID_PRODUCT_CATEGORIES = new Set([
  ...Object.values(PRODUCT_CATEGORY_SLUGS),
  "suplementi",
]);

export function isValidProductCategory(segment: string): boolean {
  return VALID_PRODUCT_CATEGORIES.has(segment);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[šŠ]/g, "s")
    .replace(/[čČ]/g, "c")
    .replace(/[ćĆ]/g, "c")
    .replace(/[žŽ]/g, "z")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function productUrl(product: {
  id: number;
  name: string;
  proteinSource?: string | null;
}): string {
  const category =
    product.proteinSource && PRODUCT_CATEGORY_SLUGS[product.proteinSource]
      ? PRODUCT_CATEGORY_SLUGS[product.proteinSource]
      : "suplementi";
  const nameSlug = slugify(product.name);
  return `/${category}/${nameSlug}-${product.id}`;
}

// Extracts the numeric product ID from the trailing segment of the slug.
// URL pattern: /{category}/{anything}-{id}  e.g. /whey-protein/on-gold-standard-2000g-42
export function extractProductId(slug: string): number | null {
  const lastDash = slug.lastIndexOf("-");
  if (lastDash === -1) return null;
  const idStr = slug.slice(lastDash + 1);
  const id = parseInt(idStr, 10);
  return !isNaN(id) && id > 0 && String(id) === idStr ? id : null;
}
