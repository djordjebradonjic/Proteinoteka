// Centralizovana skala boja za value score (0–10).
// Sve komponente koje prikazuju score MORAJU koristiti ove funkcije.

export interface ScoreConfig {
  color:  string;  // hex boja
  bg:     string;  // Tailwind bg klasa
  border: string;  // Tailwind border klasa
  text:   string;  // Tailwind text klasa
  dot:    string;  // emoji za badge
  label:  string;  // kratki srpski label
}

const TIERS: Array<{ min: number } & ScoreConfig> = [
  { min: 8.5, color: "#10b981", bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-600", dot: "🏆", label: "Odlično"    },
  { min: 7.0, color: "#22c55e", bg: "bg-green-50",   border: "border-green-200",   text: "text-green-600",   dot: "✅", label: "Vrlo dobro" },
  { min: 5.5, color: "#84cc16", bg: "bg-lime-50",    border: "border-lime-200",    text: "text-lime-600",    dot: "👍", label: "Dobro"      },
  { min: 4.0, color: "#f59e0b", bg: "bg-amber-50",   border: "border-amber-100",   text: "text-amber-500",   dot: "➡️", label: "Prosečno"  },
  { min: 0,   color: "#ef4444", bg: "bg-red-50",     border: "border-red-100",     text: "text-red-500",     dot: "⚠️", label: "Slabo"     },
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

/** Kratki srpski label (Odlično, Vrlo dobro, Dobro, Prosečno, Slabo). */
export function getScoreLabel(score: number): string {
  return getTier(score).label;
}

/** Pun config objekat sa Tailwind klasama — za kartice koje koriste Tailwind dinamički. */
export function getScoreConfig(score: number): ScoreConfig {
  return getTier(score);
}
