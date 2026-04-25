export const CATEGORIES = [
  { label: "Whey Concentrate", slug: "whey-concentrate", value: "whey_concentrate" },
  { label: "Whey Isolate",     slug: "whey-isolate",     value: "whey_isolate"     },
  { label: "Hidrolizat",       slug: "hidrolizat",       value: "hydrolysate"      },
  { label: "Kazein",           slug: "kazein",           value: "casein"           },
  { label: "Biljni protein",   slug: "biljni-protein",   value: "vegan"            },
  { label: "Blend",            slug: "blend",            value: "blend"            },
] as const;

export type CategoryValue = typeof CATEGORIES[number]["value"];
export type CategorySlug  = typeof CATEGORIES[number]["slug"];

export function getCategoryBySlug(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function getCategoryByValue(value: string) {
  return CATEGORIES.find((c) => c.value === value);
}
