"use client";

import { useEffect, useState } from "react";
import { Product } from "@/types/product";
import { getScoreColor, getScoreBg, getScoreLabel } from "@/lib/scoreColor";
import { CURRENT_MARKET } from "@/lib/marketConfig";

const IS_HR = CURRENT_MARKET === "hr";

// ── Donut chart ───────────────────────────────────────────────────────────────

const R = 38;
const CIRC = 2 * Math.PI * R;

function DonutChart({ score }: { score: number }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 80); return () => clearTimeout(t); }, []);

  const color  = getScoreColor(score);
  const offset = CIRC * (1 - (animated ? score / 10 : 0));

  return (
    <svg width="120" height="120" viewBox="0 0 100 100" className="block">
      {/* Track */}
      <circle cx="50" cy="50" r={R} fill="none" stroke="#e2e8f0" strokeWidth="9" />
      {/* Arc */}
      <circle
        cx="50" cy="50" r={R} fill="none"
        stroke={color} strokeWidth="9" strokeLinecap="round"
        strokeDasharray={CIRC}
        strokeDashoffset={offset}
        transform="rotate(-90 50 50)"
        style={{ transition: "stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)" }}
      />
      {/* Score */}
      <text x="50" y="47" textAnchor="middle" fontSize="22" fontWeight="900"
        fill={color} fontFamily="inherit">{score.toFixed(1)}</text>
      <text x="50" y="61" textAnchor="middle" fontSize="9" fill="#94a3b8"
        fontFamily="inherit">/ 10</text>
    </svg>
  );
}

// ── Dimension bar ─────────────────────────────────────────────────────────────

function DimBar({ icon, label, score }: { icon: string; label: string; score: number }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 200); return () => clearTimeout(t); }, []);

  const color = getScoreColor(score);
  const pct   = animated ? score * 10 : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-1 gap-2">
        <span className="flex items-center gap-1.5 text-sm text-slate-600">
          <span>{icon}</span>
          <span className="font-medium">{label}</span>
        </span>
        <span className="text-sm font-bold tabular-nums" style={{ color }}>{score.toFixed(1)}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            backgroundColor: color,
            transition: "width 0.9s cubic-bezier(.4,0,.2,1)",
          }}
        />
      </div>
    </div>
  );
}

// ── Conclusion generator ──────────────────────────────────────────────────────

const SOURCE_LABELS: Record<string, string> = {
  whey_concentrate: "whey koncentrat",
  whey_isolate:     "whey izolat",
  hydrolysate:      "hidrolizat",
  casein:           "kazein",
  vegan:            "biljni protein",
  blend:            "blend",
};

function buildConclusion(
  score: number,
  product: Product,
  purity: number,
  digest: number,
  ingredients: number,
): string {
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  const pricePerGramProt =
    product.numericPrice && product.primaryWeightGrams && product.proteinPer100g
      ? product.numericPrice / ((product.primaryWeightGrams * product.proteinPer100g) / 100)
      : null;

  if (pricePerGramProt !== null) {
    if (IS_HR) {
      // EUR/g thresholds (HR market medians: concentrate ~0.065, isolate ~0.074)
      if (pricePerGramProt < 0.050)      strengths.push("odlična cijena po gramu proteina");
      else if (pricePerGramProt < 0.068) strengths.push("dobra cijena po gramu proteina");
      else if (pricePerGramProt > 0.090) weaknesses.push("visoka cijena po gramu proteina");
      else if (pricePerGramProt > 0.075) weaknesses.push("iznadprosječna cijena");
    } else {
      // RSD/g thresholds (RS market medians: concentrate ~5.4, isolate ~7.25)
      if (pricePerGramProt < 4)      strengths.push("odlična cena po gramu proteina");
      else if (pricePerGramProt < 6) strengths.push("dobra cena po gramu proteina");
      else if (pricePerGramProt > 9) weaknesses.push("visoka cena po gramu proteina");
      else if (pricePerGramProt > 7) weaknesses.push("iznadprosečna cena");
    }
  }

  // Čistoća
  if (purity >= 8)      strengths.push(`visok sadržaj proteina (${product.proteinPer100g}g/100g)`);
  else if (purity <= 4) weaknesses.push(`nizak sadržaj proteina (${product.proteinPer100g}g/100g)`);

  // Apsorpcija
  if (digest >= 9)      strengths.push(`vrhunska apsorpcija (${SOURCE_LABELS[product.proteinSource ?? ""] ?? product.proteinSource})`);
  else if (digest <= 6) weaknesses.push(`niža apsorpcija (${SOURCE_LABELS[product.proteinSource ?? ""] ?? product.proteinSource})`);

  // Sastojci
  if (ingredients >= 9.5)     strengths.push("minimalan šećer i čist sastav");
  else if (ingredients <= 6)  weaknesses.push(`visok šećer (${product.sugarPer100g}g/100g)`);

  if (score >= 8.0) {
    const reason = strengths.length ? strengths.join(", ") : "ukupno dobar profil";
    const caveat = weaknesses.length ? ` Jedina zamerka: ${weaknesses.join(", ")}.` : "";
    return `Jedan od najboljih na tržištu. ${reason}.${caveat}`;
  }
  if (score >= 7.0) {
    const parts: string[] = [];
    if (strengths.length)  parts.push(`prednosti — ${strengths.join(", ")}`);
    if (weaknesses.length) parts.push(`slabosti — ${weaknesses.join(", ")}`);
    return `Odličan proizvod. ${parts.join("; ")}.`;
  }
  if (score >= 6.0) {
    const w = weaknesses.length ? ` Slabosti: ${weaknesses.join(", ")}.` : "";
    const s = strengths.length  ? ` Prednosti: ${strengths.join(", ")}.` : "";
    return `Dobar izbor za svakodnevnu upotrebu.${s}${w}`;
  }
  if (score >= 5.0) {
    const w = weaknesses.length ? ` zbog: ${weaknesses.join(", ")}` : "";
    const s = strengths.length  ? ` Pozitivno: ${strengths.join(", ")}.` : "";
    return `Prosečan proizvod${w}.${s}`;
  }
  const w = weaknesses.length ? weaknesses.join(", ") : (IS_HR ? "nepovoljnog odnosa cijene i kvaliteta" : "nepovoljnog odnosa cene i kvaliteta");
  return IS_HR ? `Niska ocjena zbog: ${w}.` : `Niska ocena zbog: ${w}.`;
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  score: number;
  product: Product;
  proteinPurityScore: number;
  digestScore: number;
  ingredientsScore: number;
}

export default function ValueScoreCard({
  score,
  product,
  proteinPurityScore,
  digestScore,
  ingredientsScore,
}: Props) {
  const color      = getScoreColor(score);
  const bg         = getScoreBg(score);
  const label      = getScoreLabel(score);
  const conclusion = buildConclusion(score, product, proteinPurityScore, digestScore, ingredientsScore);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6">
      <h2 className="text-base font-bold text-slate-900 mb-5">Value Score — detalji</h2>

      {/* Donut + dimenzije */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-5">

        {/* Donut */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <DonutChart score={score} />
          <span className="text-xs font-semibold mt-1" style={{ color }}>{label}</span>
        </div>

        {/* Dimenzije */}
        <div className="flex-1 w-full space-y-3">
          <DimBar icon="💰" label={IS_HR ? "Vrijednost za novac" : "Vrednost za novac"} score={score} />
          <DimBar icon="🧬" label="Čistoća proteina"  score={proteinPurityScore} />
          <DimBar icon="⚡" label="Apsorpcija"         score={digestScore} />
          <DimBar icon="🌿" label="Sastojci"           score={ingredientsScore} />
        </div>
      </div>

      {/* Zaključak */}
      <div
        className="rounded-xl px-4 py-3 text-sm leading-relaxed"
        style={{ backgroundColor: bg, color: "#374151" }}
      >
        <span className="font-semibold" style={{ color }}>{IS_HR ? "Zašto ova ocjena? " : "Zašto ova ocena? "}</span>
        {conclusion}
      </div>
    </div>
  );
}
