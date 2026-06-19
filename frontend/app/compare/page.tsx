"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { analytics } from "@/lib/analytics";
import { useAppDispatch } from "@/store/hooks";
import { clearCompare } from "@/store/compareSlice";
import { ArrowLeft, Package, ShoppingCart, X } from "lucide-react";
import { productUrl } from "@/lib/productUrl";
import { getScoreColor } from "@/lib/scoreColor";
import Image from "next/image";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CompareProduct {
  id: number;
  name: string;
  brand: string | null;
  price: string;
  imageUrl: string | null;
  storeName: string;
  productUrl: string | null;
  numericPrice: number | null;
  valueScore: number | null;
  proteinPer100g: number | null;
  sugarPer100g: number | null;
  fatPer100g: number | null;
  caloriePer100g: number | null;
  proteinSource: string | null;
  primaryWeightGrams: number | null;
  pricePerKg: number | null;
  pricePerProtein: number | null;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function bestIdx(values: (number | null)[], higherIsBetter: boolean): number {
  let best = -1;
  for (let i = 0; i < values.length; i++) {
    if (values[i] == null) continue;
    if (best === -1 || (higherIsBetter ? values[i]! > values[best]! : values[i]! < values[best]!)) {
      best = i;
    }
  }
  return best;
}

function worstIdx(values: (number | null)[], higherIsBetter: boolean): number {
  let worst = -1;
  for (let i = 0; i < values.length; i++) {
    if (values[i] == null) continue;
    if (worst === -1 || (higherIsBetter ? values[i]! < values[worst]! : values[i]! > values[worst]!)) {
      worst = i;
    }
  }
  return worst;
}

function fmt(n: number | null, decimals = 0): string {
  if (n == null) return "N/A";
  return n.toLocaleString("sr-RS", { maximumFractionDigits: decimals, minimumFractionDigits: decimals });
}

function short(name: string, max = 28): string {
  return name.length > max ? name.slice(0, max - 1) + "…" : name;
}


function cellCls(i: number, best: number, worst: number): string {
  if (best === worst) return "";
  if (i === best) return "bg-green-50 text-green-800 font-bold";
  if (i === worst) return "text-slate-400";
  return "";
}

// ─── Smart Insights ───────────────────────────────────────────────────────────

function generateInsights(products: CompareProduct[]): string[] {
  if (products.length < 2) return [];
  const insights: string[] = [];

  const proteins = products.map(p => p.proteinPer100g);
  const prices   = products.map(p => p.numericPrice);
  const ppps     = products.map(p => p.pricePerProtein);
  const sugars   = products.map(p => p.sugarPer100g);

  const bestPppIdx = bestIdx(ppps, false);
  if (bestPppIdx >= 0 && ppps[bestPppIdx] != null) {
    insights.push(`🥇 ${short(products[bestPppIdx].name)} nudi najjeftiniji protein — ${fmt(ppps[bestPppIdx], 2)} RSD/g proteina.`);
  }

  const bestProtIdx  = bestIdx(proteins, true);
  const worstProtIdx = worstIdx(proteins, true);
  if (bestProtIdx >= 0 && worstProtIdx >= 0 && bestProtIdx !== worstProtIdx
      && proteins[bestProtIdx] != null && proteins[worstProtIdx] != null) {
    const diff = Math.round(((proteins[bestProtIdx]! - proteins[worstProtIdx]!) / proteins[worstProtIdx]!) * 100);
    if (diff > 2) {
      insights.push(`💪 ${short(products[bestProtIdx].name)} ima ${diff}% više proteina od ${short(products[worstProtIdx].name)}.`);
    }
  }

  const cheapIdx  = bestIdx(prices, false);
  const expIdx    = worstIdx(prices, false);
  if (cheapIdx >= 0 && expIdx >= 0 && cheapIdx !== expIdx
      && prices[cheapIdx] != null && prices[expIdx] != null) {
    const diff = Math.round(prices[expIdx]! - prices[cheapIdx]!);
    if (diff > 0) {
      insights.push(`💰 ${short(products[cheapIdx].name)} je jeftiniji za ${fmt(diff)} RSD od ${short(products[expIdx].name)}.`);
    }
  }

  const lowestSugarIdx = bestIdx(sugars, false);
  if (lowestSugarIdx >= 0 && sugars[lowestSugarIdx] != null) {
    insights.push(`🍬 ${short(products[lowestSugarIdx].name)} ima najmanji sadržaj šećera (${fmt(sugars[lowestSugarIdx], 1)}g/100g).`);
  }

  return insights;
}

// ─── Winner Card ──────────────────────────────────────────────────────────────

function WinnerCard({ emoji, title, name, detail, accent }: {
  emoji: string; title: string; name: string; detail: string; accent: string;
}) {
  return (
    <div className="flex-1 min-w-[160px] bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-lg leading-none">{emoji}</span>
        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: accent }}>{title}</span>
      </div>
      <p className="text-sm font-bold text-slate-900 leading-snug line-clamp-2 mb-1">{name}</p>
      <p className="text-xs text-slate-400">{detail}</p>
    </div>
  );
}

// ─── Table ────────────────────────────────────────────────────────────────────

const LABEL_W = "w-32 min-w-[128px]";
const COL_W   = "min-w-[172px]";

interface RowDef {
  label: string;
  values: (number | null)[];
  higher: boolean;
  unit: string;
  decimals: number;
  isScore?: boolean;
}

function TableRow({ row, n }: { row: RowDef; n: number }) {
  const best  = bestIdx(row.values, row.higher);
  const worst = worstIdx(row.values, row.higher);
  return (
    <div className="flex border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
      <div className={`${LABEL_W} shrink-0 sticky left-0 bg-white border-r border-slate-100 px-3 py-3 flex items-center z-10`}>
        <span className="text-xs text-slate-500">{row.label}</span>
      </div>
      {Array.from({ length: n }).map((_, i) => {
        const val = row.values[i] ?? null;
        const cls = cellCls(i, best, worst);
        return (
          <div key={i} className={`flex-1 ${COL_W} px-3 py-3 flex items-center justify-center ${cls}`}>
            {row.isScore && val != null ? (
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm" style={{ color: getScoreColor(val) }}>{val.toFixed(1)}</span>
                <div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${val * 10}%`, background: getScoreColor(val) }} />
                </div>
              </div>
            ) : (
              <span className="text-sm">{val != null ? `${fmt(val, row.decimals)}${row.unit}` : <span className="text-slate-300">—</span>}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function ComparePage() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const dispatch     = useAppDispatch();

  const [products, setProducts] = useState<CompareProduct[]>([]);
  const [loading, setLoading]   = useState(true);

  const idsParam = searchParams.get("ids") ?? "";

  useEffect(() => {
    if (!idsParam) { setLoading(false); return; }

    const ids = idsParam
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s && s !== "undefined" && s !== "null" && /^\d+$/.test(s));

    async function load() {
      // Try dedicated compare endpoint first
      try {
        const res = await fetch(`${API_BASE}/api/v1/products/compare?ids=${idsParam}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setProducts(data);
            return;
          }
        }
      } catch {}

      // Fallback: fetch each product individually using existing endpoint
      try {
        const results = await Promise.all(
          ids.map(id =>
            fetch(`${API_BASE}/api/v1/products/${id}`)
              .then(r => r.ok ? r.json() : null)
              .catch(() => null)
          )
        );
        const valid = results.filter(Boolean).map((p: any) => ({
          ...p,
          pricePerKg: p.primaryWeightGrams > 0
            ? (p.numericPrice / p.primaryWeightGrams) * 1000
            : null,
          pricePerProtein: p.proteinPer100g > 0 && p.primaryWeightGrams > 0
            ? p.numericPrice / ((p.proteinPer100g / 100) * p.primaryWeightGrams)
            : null,
        }));
        setProducts(valid);
      } catch {
        setProducts([]);
      }
    }

    load().finally(() => setLoading(false));
  }, [idsParam]);

  function removeProduct(id: number) {
    const newIds = products.filter(p => p.id !== id).map(p => p.id);
    if (newIds.length === 0) { router.push("/"); return; }
    router.replace(`/compare?ids=${newIds.join(",")}`);
  }

  function handleClear() {
    dispatch(clearCompare());
    router.push("/");
  }

  const prices   = useMemo(() => products.map(p => p.numericPrice),    [products]);
  const scores   = useMemo(() => products.map(p => p.valueScore),      [products]);
  const proteins = useMemo(() => products.map(p => p.proteinPer100g),  [products]);
  const fats     = useMemo(() => products.map(p => p.fatPer100g),      [products]);
  const sugars   = useMemo(() => products.map(p => p.sugarPer100g),    [products]);
  const cals     = useMemo(() => products.map(p => p.caloriePer100g),  [products]);
  const ppks     = useMemo(() => products.map(p => p.pricePerKg),      [products]);
  const ppps     = useMemo(() => products.map(p => p.pricePerProtein), [products]);

  const bestOverallIdx = useMemo(() => bestIdx(scores,  true),  [scores]);
  const cheapestIdx    = useMemo(() => bestIdx(prices,  false), [prices]);
  const bestValueIdx   = useMemo(() => bestIdx(ppps,    false), [ppps]);

  const insights = useMemo(() => generateInsights(products), [products]);

  const rows: RowDef[] = useMemo(() => [
    { label: "Cena",            values: prices,   higher: false, unit: " RSD", decimals: 0 },
    { label: "Value Score",     values: scores,   higher: true,  unit: "",     decimals: 1, isScore: true },
    { label: "Proteini/100g",   values: proteins, higher: true,  unit: "g",    decimals: 1 },
    { label: "Masti/100g",      values: fats,     higher: false, unit: "g",    decimals: 1 },
    { label: "Šećeri/100g",     values: sugars,   higher: false, unit: "g",    decimals: 1 },
    { label: "Kalorije/100g",   values: cals,     higher: false, unit: " kcal",decimals: 0 },
    { label: "Cena/kg",         values: ppks,     higher: false, unit: " RSD", decimals: 0 },
    { label: "Cena/g proteina", values: ppps,     higher: false, unit: " RSD", decimals: 2 },
  ], [prices, scores, proteins, fats, sugars, cals, ppks, ppps]);

  if (loading) return <Skeleton />;

  if (products.length < 2) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
          <p className="text-slate-500 text-sm">Dodaj najmanje 2 proizvoda za poređenje.</p>
          <Link href="/" className="text-sm font-semibold text-[#FF9900] hover:underline">
            ← Povratak na listu
          </Link>
        </div>
      </div>
    );
  }

  const n = products.length;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#FF9900] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Nazad
          </button>
          <h1 className="text-base font-black text-slate-900">
            Poređenje <span className="text-[#FF9900]">{n}</span> {n === 2 ? "proizvoda" : n === 3 ? "proizvoda" : "proizvoda"}
          </h1>
          <button
            onClick={handleClear}
            className="text-xs text-slate-400 hover:text-red-500 transition-colors"
          >
            Obriši sve
          </button>
        </div>

        {/* Winner cards */}
        <div className="flex gap-3 mb-6 overflow-x-auto pb-1 scrollbar-none">
          {bestOverallIdx >= 0 && (
            <WinnerCard emoji="🏆" title="Ukupno najbolji" accent="#FF9900"
              name={products[bestOverallIdx].name}
              detail={`Value Score: ${products[bestOverallIdx].valueScore?.toFixed(1) ?? "N/A"}`}
            />
          )}
          {cheapestIdx >= 0 && (
            <WinnerCard emoji="💰" title="Najjeftiniji" accent="#22c55e"
              name={products[cheapestIdx].name}
              detail={products[cheapestIdx].price}
            />
          )}
          {bestValueIdx >= 0 && ppps[bestValueIdx] != null && (
            <WinnerCard emoji="⭐" title="Najbolja vrednost" accent="#3b82f6"
              name={products[bestValueIdx].name}
              detail={`${fmt(ppps[bestValueIdx], 2)} RSD/g proteina`}
            />
          )}
        </div>

        {/* Comparison table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6 overflow-hidden">
          <div className="overflow-x-auto">
            <div style={{ minWidth: `${n * 172 + 128}px` }}>

              {/* Product header */}
              <div className="flex border-b border-slate-200 bg-slate-50">
                <div className={`${LABEL_W} shrink-0 sticky left-0 bg-slate-50 z-10 border-r border-slate-100 p-3`} />
                {products.map((p) => (
                  <div key={p.id} className={`flex-1 ${COL_W} p-4 flex flex-col items-center gap-2 relative`}>
                    {/* Remove button */}
                    <button
                      onClick={() => removeProduct(p.id)}
                      className="absolute top-2 right-2 p-0.5 rounded-full text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                      aria-label="Ukloni iz poređenja"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>

                    {p.imageUrl ? (
                      <Image src={p.imageUrl} alt={p.name}
                        width={80} height={80} className="w-20 h-20 object-contain" unoptimized />
                    ) : (
                      <div className="w-20 h-20 bg-slate-100 rounded flex items-center justify-center">
                        <Package className="w-8 h-8 text-slate-300" />
                      </div>
                    )}
                    <p className="text-xs font-bold text-slate-800 text-center leading-snug line-clamp-3">{p.name}</p>
                    {p.brand && <p className="text-[10px] text-slate-400">{p.brand}</p>}
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{p.storeName}</span>
                  </div>
                ))}
              </div>

              {/* Data rows */}
              {rows.map(row => <TableRow key={row.label} row={row} n={n} />)}

              {/* CTA row */}
              <div className="flex border-t border-slate-200 bg-slate-50/80">
                <div className={`${LABEL_W} shrink-0 sticky left-0 bg-slate-50 z-10 border-r border-slate-100 px-3 py-4 flex items-center`}>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Kupi</span>
                </div>
                {products.map((p) => (
                  <div key={p.id} className={`flex-1 ${COL_W} px-3 py-4 flex flex-col gap-2`}>
                    <a
                      href={`${API_BASE}/api/v1/products/${p.id}/buy`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => { if (p.id && typeof p.id === "number") analytics.outboundClick(p.id, p.name, p.storeName); }}
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg font-bold text-xs text-[#131921] transition-all active:scale-[0.98]"
                      style={{ background: "linear-gradient(135deg,#FF9900,#e68a00)", boxShadow: "0 2px 12px rgba(255,153,0,0.3)" }}
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      Kupi u {p.storeName}
                    </a>
                    <Link
                      href={productUrl(p)}
                      className="text-center py-2 rounded-lg text-xs font-semibold text-slate-600 border border-slate-200 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors"
                    >
                      Pogledaj detalje
                    </Link>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>

        {/* Smart insights */}
        {insights.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-sm font-bold text-slate-900 mb-3">Ključne razlike</h2>
            <ul className="space-y-2.5">
              {insights.map((ins, i) => (
                <li key={i} className="text-sm text-slate-700 leading-relaxed">{ins}</li>
              ))}
            </ul>
          </div>
        )}

      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-6 animate-pulse">
        <div className="h-5 bg-slate-200 rounded w-40 mb-6" />
        <div className="flex gap-3 mb-6">
          {[1, 2, 3].map(i => <div key={i} className="flex-1 h-24 bg-slate-200 rounded-xl" />)}
        </div>
        <div className="h-[480px] bg-slate-200 rounded-xl" />
      </div>
    </div>
  );
}

export default function ComparePageWrapper() {
  return (
    <Suspense fallback={<Skeleton />}>
      <ComparePage />
    </Suspense>
  );
}
