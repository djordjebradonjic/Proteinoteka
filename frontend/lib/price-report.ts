import type { Product } from "@/types/product";

// Helpers for the price report page: category labels, number formatting in Serbian, and the
// "today" snapshot computed from the live catalog (the report's own numbers come from the
// dated edition file in lib/price-reports/).

export const CATEGORY_LABELS: Record<string, string> = {
  whey_concentrate: "Whey koncentrat",
  whey_isolate: "Whey izolat",
  vegan: "Biljni protein",
  blend: "Blend (mešavine)",
  casein: "Kazein",
  hydrolysate: "Hidrolizat",
  beef: "Goveđi protein",
  egg: "Protein iz jaja",
  other: "Ostalo (hidrolizat, goveđi, jaje)",
};

export const CATEGORY_HREF: Record<string, string> = {
  whey_concentrate: "/kategorija/whey-concentrate",
  whey_isolate: "/kategorija/whey-isolate",
  vegan: "/kategorija/biljni-protein",
  blend: "/kategorija/blend",
  casein: "/kategorija/kazein",
  hydrolysate: "/kategorija/hidrolizat",
};

/** 2,4 / -29,6 with a decimal comma; `sign` adds a leading + for positive values. */
export function pct(value: number, opts: { sign?: boolean; digits?: number } = {}): string {
  const digits = opts.digits ?? 1;
  const text = Math.abs(value).toFixed(digits).replace(".", ",");
  if (value < 0) return `−${text}%`;
  return `${opts.sign && value > 0 ? "+" : ""}${text}%`;
}

// Genitive, because dates in running text are "24. juna", "od 19. septembra".
const MONTHS = ["januara", "februara", "marta", "aprila", "maja", "juna", "jula", "avgusta", "septembra", "oktobra", "novembra", "decembra"];

/** "24. juna 2026" from an ISO date (no timezone surprises: parsed as plain y-m-d). */
export function longDate(iso: string, withYear = true): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d}. ${MONTHS[m - 1]}${withYear ? ` ${y}` : ""}`;
}

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((Date.parse(toIso) - Date.parse(fromIso)) / 86_400_000);
}

// ── "Today" snapshot ──────────────────────────────────────────────────────────

const GAINER_RE = /\b(mass|gainer)\b/i;

/** Same rule the value score uses: an explicit "hydro" in the name beats a whey/blend label. */
export function effectiveCategory(p: Product): string | null {
  const src = (p.proteinSource ?? "").toLowerCase();
  const name = p.name.toLowerCase();
  const beefy = /beef|hovezi|goveđ/.test(name);
  if ((name.includes("hydro") || name.includes("hidro")) && ["", "whey_concentrate", "whey_isolate", "blend"].includes(src) && !beefy) {
    return "hydrolysate";
  }
  return src || null;
}

export interface CategoryToday {
  key: string;
  label: string;
  offers: number;
  /** Median price per gram of protein, RSD. */
  medianGp: number;
  q1: number;
  q3: number;
}

function quantile(sorted: number[], q: number): number {
  const i = q * (sorted.length - 1);
  const lo = Math.floor(i);
  const hi = Math.min(lo + 1, sorted.length - 1);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}

/** Price per gram of protein by category over the whole live catalog, cheapest median first. */
export function categoriesToday(products: Product[]): CategoryToday[] {
  const buckets = new Map<string, number[]>();
  for (const p of products) {
    const key = effectiveCategory(p);
    const protein = p.proteinPer100g;
    if (!key || GAINER_RE.test(p.name) || p.numericPrice <= 0 || !p.primaryWeightGrams || protein == null) continue;
    if (protein < 40 || protein > 95) continue;
    const gp = p.numericPrice / (p.primaryWeightGrams * (protein / 100));
    buckets.set(key, [...(buckets.get(key) ?? []), gp]);
  }
  const out: CategoryToday[] = [];
  for (const [key, values] of buckets) {
    if (values.length < 8) continue; // a median of a handful of listings is not a market price
    const s = [...values].sort((a, b) => a - b);
    out.push({ key, label: CATEGORY_LABELS[key] ?? key, offers: s.length, medianGp: quantile(s, 0.5), q1: quantile(s, 0.25), q3: quantile(s, 0.75) });
  }
  return out.sort((a, b) => a.medianGp - b.medianGp);
}
