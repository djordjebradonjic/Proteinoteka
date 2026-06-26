// Centralizovana skala boja za value score (0–10).
// Sve komponente koje prikazuju score MORAJU koristiti ove funkcije.

import { CURRENT_MARKET } from './marketConfig';

export interface ScoreConfig {
  color:  string;  // hex boja
  bg:     string;  // Tailwind bg klasa
  border: string;  // Tailwind border klasa
  text:   string;  // Tailwind text klasa
  dot:    string;  // emoji za badge
  label:  string;  // kratki label (RS)
  labelHr: string; // kratki label (HR)
}

// Pragovi kalibrisani na osnovu stvarne distribucije 507 proizvoda:
// ≥8.0 = top 12% | ≥7.0 = sledeći 43% | ≥6.0 = 31% | ≥5.0 = 11% | <5.0 = 4%
const TIERS: Array<{ min: number } & ScoreConfig> = [
  { min: 8.0, color: "#10b981", bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-600", dot: "🏆", label: "Top vrednost", labelHr: "Top vrijednost" },
  { min: 7.0, color: "#22c55e", bg: "bg-green-50",   border: "border-green-200",   text: "text-green-600",   dot: "✅", label: "Odličan",     labelHr: "Odličan"        },
  { min: 6.0, color: "#84cc16", bg: "bg-lime-50",    border: "border-lime-200",    text: "text-lime-600",    dot: "👍", label: "Dobar",       labelHr: "Dobar"          },
  { min: 5.0, color: "#f59e0b", bg: "bg-amber-50",   border: "border-amber-100",   text: "text-amber-500",   dot: "➡️", label: "Prosek",     labelHr: "Prosjek"        },
  { min: 0,   color: "#ef4444", bg: "bg-red-50",     border: "border-red-100",     text: "text-red-500",     dot: "⚠️", label: "Nizak",      labelHr: "Nizak"          },
];

function getTier(score: number): ScoreConfig {
  return TIERS.find((t) => score >= t.min) ?? TIERS[TIERS.length - 1];
}

/** Hex boja teksta/stroka za dati score. */
export function getScoreColor(score: number): string {
  return getTier(score).color;
}

/** Hex boja sa 13% opacity — za pozadinu badge-a. */
export function getScoreBg(score: number): string {
  return getTier(score).color + "22";
}

/** Kratki label prilagođen tržištu. */
export function getScoreLabel(score: number): string {
  const tier = getTier(score);
  return CURRENT_MARKET === 'hr' ? tier.labelHr : tier.label;
}

/** Pun config objekat sa Tailwind klasama — za kartice koje koriste Tailwind dinamički. */
export function getScoreConfig(score: number): ScoreConfig {
  return getTier(score);
}
