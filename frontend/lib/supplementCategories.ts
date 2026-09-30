import { CREATINE_PATH } from "@/lib/creatine";

// Top-level product families shown in the hero switcher. Adding the next supplement = one more row here.
export interface SupplementCategory {
  key: string;
  label: string;
  hint: string;
  href: string;
}

export const SUPPLEMENT_CATEGORIES: SupplementCategory[] = [
  { key: "protein",  label: "Proteini", hint: "Whey, izolat, kazein, vegan", href: "/" },
  { key: "creatine", label: "Kreatin",  hint: "Prah, kapsule, tablete",      href: CREATINE_PATH },
];
