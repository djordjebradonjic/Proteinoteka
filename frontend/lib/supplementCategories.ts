import { CREATINE_PATH } from "@/lib/creatine";
import { CREATINE_ENABLED } from "@/lib/marketConfig";

// Top-level product families shown in the hero switcher. Adding the next supplement = one more row here.
export interface SupplementCategory {
  key: string;
  label: string;
  hint: string;
  href: string;
}

const ALL_CATEGORIES: SupplementCategory[] = [
  { key: "protein",  label: "Proteini", hint: "Whey, izolat, kazein, vegan", href: "/" },
  { key: "creatine", label: "Kreatin",  hint: "Prah, kapsule, tablete",      href: CREATINE_PATH },
];

// Families the current market actually carries; a market with a single family gets no switcher at all.
export const SUPPLEMENT_CATEGORIES: SupplementCategory[] = ALL_CATEGORIES.filter(
  (c) => c.key !== "creatine" || CREATINE_ENABLED,
);
