"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Product } from "@/types/product";
import Header from "@/components/Header";
import Link from "next/link";
import { ShoppingCart, ArrowLeft, Package, Zap, Droplets, Flame, Store } from "lucide-react";
import Image from "next/image";
import { trackEvent } from "@/lib/trackEvent";

const PriceHistoryChart = dynamic(() => import("@/components/PriceHistoryChart"), { ssr: false });

const CATEGORY_LABELS: Record<string, string> = {
  whey_concentrate: "Whey Concentrate",
  whey_isolate:     "Whey Isolate",
  hydrolysate:      "Hidrolizat",
  casein:           "Kazein",
  vegan:            "Biljni protein",
  blend:            "Blend",
};

const CATEGORY_SLUGS: Record<string, string> = {
  whey_concentrate: "whey-concentrate",
  whey_isolate:     "whey-isolate",
  hydrolysate:      "hidrolizat",
  casein:           "kazein",
  vegan:            "biljni-protein",
  blend:            "blend",
};

function scoreColor(score: number) {
  if (score >= 8.5) return "#22c55e";
  if (score >= 7)   return "#84cc16";
  if (score >= 5.5) return "#FF9900";
  return "#ef4444";
}

function scoreLabel(score: number) {
  if (score >= 9)   return "Izvanredan";
  if (score >= 8)   return "Odličan";
  if (score >= 7)   return "Dobar";
  if (score >= 5.5) return "Prosečan";
  return "Slab";
}

function NutritionRow({ label, value, unit, icon }: {
  label: string; value: number | null | undefined; unit: string; icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <span className="text-[#FF9900]">{icon}</span>
        {label}
      </div>
      <span className="text-sm font-bold text-slate-900">
        {value != null ? `${value}${unit}` : "N/A"}
      </span>
    </div>
  );
}

function ScoreBar({ label, pct, score }: { label: string; pct: number; score: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-500 mb-1 gap-2">
        <span className="min-w-0 truncate">{label}</span>
        <span className="font-semibold text-slate-700 shrink-0">{score}</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: "#FF9900" }}
        />
      </div>
    </div>
  );
}

const STRIP_MARKERS = /PODACI O NUTRITIVNOJ VREDNOSTI|PAKOVANJE:|UPOTREBA:/i;

function cutRawDescription(html: string): string {
  const cut = html.search(STRIP_MARKERS);
  return cut > 0 ? html.slice(0, cut) : html;
}

interface StorePrice { id: number; storeName: string; price: string; numericPrice: number | null; }

interface Props {
  product: Product;
  similar: Product[];
  storePrices: StorePrice[];
}

export default function ProductPageContent({ product, similar, storePrices }: Props) {
  const router = useRouter();
  const [descExpanded, setDescExpanded] = useState(false);
  const [descOverflows, setDescOverflows] = useState(false);
  const descRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    trackEvent({ eventType: "PRODUCT_VIEW", productId: product.id, store: product.storeName });
  }, [product.id, product.storeName]);

  useEffect(() => {
    if (descRef.current) {
      setDescOverflows(descRef.current.scrollHeight > descRef.current.clientHeight + 4);
    }
  }, [product.aiDescription, product.description]);

  const score    = product.valueScore;
  const color    = score ? scoreColor(score) : "#94a3b8";
  const catLabel = product.proteinSource ? CATEGORY_LABELS[product.proteinSource] ?? product.proteinSource : null;
  const catSlug  = product.proteinSource ? CATEGORY_SLUGS[product.proteinSource] : null;

  const chartData = [...(product.priceHistory ?? [])]
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map((h) => ({
      datum: new Date(h.timestamp).toLocaleDateString("sr-RS", { day: "2-digit", month: "short" }),
      cena: parseFloat(String(h.price).replace(/[^0-9.,]/g, "").replace(",", ".")),
    }));

  const proteinPct = product.proteinPer100g ?? 0;
  const proteinPurityScore = Math.round(Math.min(10, Math.max(0, 10 * Math.pow(Math.max(0, (proteinPct - 60) / 40), 0.7))));

  const digestMap: Record<string, number> = {
    hydrolysate: 10, whey_isolate: 9, casein: 8, whey_concentrate: 7, blend: 7, vegan: 6,
  };
  const digestScore     = product.proteinSource ? (digestMap[product.proteinSource] ?? 7) : 7;
  const sugarScore      = Math.round(Math.max(0, 10 - (product.sugarPer100g ?? 0) > 10 ? 0 : (product.sugarPer100g ?? 0) * 0.5));
  const ingredientsScore = Math.max(0, 10 - (product.sugarPer100g != null && product.sugarPer100g > 10 ? 3 : product.sugarPer100g != null && product.sugarPer100g > 5 ? 1.5 : 0));
  const buyUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/${product.id}/buy`;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-6 flex-wrap">
          <Link href="/" className="hover:text-[#FF9900] transition-colors">Početna</Link>
          {catLabel && catSlug && (
            <>
              <span>/</span>
              <Link href={`/kategorija/${catSlug}`} className="hover:text-[#FF9900] transition-colors">
                {catLabel}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-slate-600 truncate max-w-[200px] sm:max-w-xs">{product.name}</span>
        </nav>

        {/* Back */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#FF9900] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Nazad
        </button>

        {/* ── Hero ──────────────────────────────────────────────────── */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">

          {/* Image */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-8 flex items-center justify-center h-64 sm:h-80 md:aspect-square md:h-auto shadow-sm">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                width={400}
                height={400}
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 624px"
                className="max-h-full max-w-full object-contain hover:scale-105 transition-transform duration-300"
                priority
              />
            ) : (
              <Package className="w-24 h-24 text-slate-200" />
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              {product.brand && (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                  {product.brand}
                </span>
              )}
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                {product.storeName}
              </span>
              {catLabel && (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-100">
                  {catLabel}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
              {product.name}
            </h1>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <p className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">Trenutna cena</p>
              <p className="text-4xl font-black text-slate-900 mb-1">{product.price}</p>
              {product.primaryWeightGrams && product.proteinPer100g && (
                <p className="text-xs text-slate-400">
                  ≈{" "}
                  <span className="font-semibold text-slate-600">
                    {(product.numericPrice / ((product.proteinPer100g / 100) * product.primaryWeightGrams)).toFixed(0)} RSD
                  </span>{" "}
                  po gramu proteina
                </p>
              )}
            </div>

            {score != null && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center shrink-0 text-white font-black text-xl"
                  style={{ background: color }}
                >
                  {score.toFixed(1)}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">Value Score</p>
                  <p className="text-base font-bold" style={{ color }}>{scoreLabel(score)}</p>
                  <p className="text-xs text-slate-400">na skali 1–10</p>
                </div>
              </div>
            )}

            <a
              href={buyUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent({ eventType: "CLICK_OUT", productId: product.id, store: product.storeName })}
              className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-bold text-base text-[#131921] transition-all duration-150 active:scale-[0.98] shadow-lg"
              style={{ background: "linear-gradient(135deg, #FF9900, #e68a00)", boxShadow: "0 4px 24px rgba(255,153,0,0.35)" }}
            >
              <ShoppingCart className="w-5 h-5" />
              Kupi u {product.storeName}
            </a>
          </div>
        </div>

        {/* ── Cross-store prices ────────────────────────────────────── */}
        {storePrices.length > 1 && (() => {
          const cheapest = storePrices[0]?.numericPrice;
          return (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-6 overflow-hidden">
              <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100">
                <Store className="w-4 h-4 text-[#FF9900]" />
                <h2 className="text-base font-bold text-slate-900">Cena po prodavnicama</h2>
              </div>
              <ul>
                {storePrices.map((sp, i) => {
                  const isCheapest = i === 0;
                  const diff = (cheapest != null && sp.numericPrice != null && !isCheapest)
                    ? Math.round(sp.numericPrice - cheapest) : null;
                  const isCurrent = sp.id === product.id;
                  return (
                    <li
                      key={sp.id}
                      className={`flex items-center gap-3 px-6 py-4 border-b border-slate-100 last:border-0 ${isCheapest ? "bg-green-50" : "hover:bg-slate-50"} transition-colors`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-sm font-semibold ${isCurrent ? "text-[#FF9900]" : "text-slate-800"}`}>{sp.storeName}</span>
                          {isCheapest && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">Najjeftinije</span>}
                          {isCurrent && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-100">Trenutno gledaš</span>}
                        </div>
                        {diff != null && <p className="text-xs text-slate-400 mt-0.5">+{diff.toLocaleString("sr-RS")} RSD skuplje</p>}
                      </div>
                      <span className={`text-base font-black shrink-0 ${isCheapest ? "text-green-700" : "text-slate-900"}`}>{sp.price}</span>
                      <a
                        href={`${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/${sp.id}/buy`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackEvent({ eventType: "CLICK_OUT", productId: sp.id, store: sp.storeName })}
                        className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${isCheapest ? "bg-green-600 hover:bg-green-700 text-white" : "bg-slate-900 hover:bg-[#243860] text-white"}`}
                      >
                        <ShoppingCart className="w-3.5 h-3.5" /> Kupi
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })()}

        {/* ── Score breakdown ────────────────────────────────────────── */}
        {score != null && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6">
            <h2 className="text-base font-bold text-slate-900 mb-5">Proteinoteka Score — detalji</h2>
            <div className="space-y-4">
              <ScoreBar label="Vrednost za novac (40%)"  pct={(score / 10) * 100}      score={`${score.toFixed(1)}/10`} />
              <ScoreBar label="Čistoća proteina (20%)"   pct={proteinPurityScore * 10} score={`${proteinPurityScore}/10`} />
              <ScoreBar label="Apsorpcija (15%)"         pct={digestScore * 10}         score={`${digestScore}/10`} />
              <ScoreBar label="Sastojci/šećer (15%)"     pct={ingredientsScore * 10}    score={`${ingredientsScore.toFixed(1)}/10`} />
            </div>
          </div>
        )}

        {/* ── Nutrition ──────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6">
          <h2 className="text-base font-bold text-slate-900 mb-2">Nutritivne vrednosti</h2>
          <p className="text-xs text-slate-400 mb-4">Na 100g proizvoda</p>
          <NutritionRow label="Proteini" value={product.proteinPer100g}  unit="g"     icon={<Zap className="w-4 h-4" />} />
          <NutritionRow label="Masti"    value={product.fatPer100g}      unit="g"     icon={<Droplets className="w-4 h-4" />} />
          <NutritionRow label="Šećeri"   value={product.sugarPer100g}    unit="g"     icon={<Droplets className="w-4 h-4" />} />
          <NutritionRow label="Kalorije" value={product.caloriePer100g}  unit=" kcal" icon={<Flame className="w-4 h-4" />} />
          {catLabel && (
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <span className="text-sm text-slate-600 flex items-center gap-2"><Package className="w-4 h-4 text-[#FF9900]" /> Tip proteina</span>
              <span className="text-sm font-bold text-slate-900">{catLabel}</span>
            </div>
          )}
          {product.primaryWeightGrams && (
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-slate-600 flex items-center gap-2"><Package className="w-4 h-4 text-[#FF9900]" /> Pakovanje</span>
              <span className="text-sm font-bold text-slate-900">
                {product.primaryWeightGrams >= 1000 ? `${(product.primaryWeightGrams / 1000).toFixed(1)} kg` : `${product.primaryWeightGrams} g`}
              </span>
            </div>
          )}
        </div>

        {/* ── Price history ──────────────────────────────────────────── */}
        {chartData.length > 1 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6">
            <h2 className="text-base font-bold text-slate-900 mb-6">Istorija cene</h2>
            <div className="h-52">
              <PriceHistoryChart data={chartData} />
            </div>
          </div>
        )}

        {/* ── Description ───────────────────────────────────────────── */}
        {(product.aiDescription || product.description) && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Opis proizvoda</h2>
            <div className="relative border-t border-gray-100 pt-5">
              <div
                ref={descRef}
                className="overflow-hidden transition-[max-height] duration-500 ease-in-out"
                style={{ maxHeight: descExpanded ? descRef.current?.scrollHeight ?? 9999 : "9rem" }}
              >
                {product.aiDescription ? (
                  <div className="max-w-prose">
                    {product.aiDescription.split("\n").filter(Boolean).map((para, i) => (
                      <p key={i} className="text-[15px] leading-[1.75] text-slate-700 mb-4 last:mb-0">{para}</p>
                    ))}
                  </div>
                ) : (
                  <div
                    className="max-w-prose text-[15px] leading-[1.75] text-slate-700
                      [&_p]:mb-4 [&_p:last-child]:mb-0
                      [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4
                      [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-4
                      [&_li]:mb-1
                      [&_strong]:font-semibold [&_strong]:text-slate-800
                      [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-slate-800 [&_h2]:mt-5 [&_h2]:mb-2
                      [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-slate-700 [&_h3]:mt-4 [&_h3]:mb-1"
                    dangerouslySetInnerHTML={{ __html: cutRawDescription(product.description!) }}
                  />
                )}
              </div>
              {!descExpanded && descOverflows && (
                <div className="absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-white to-transparent pointer-events-none" />
              )}
            </div>
            {descOverflows && (
              <button
                onClick={() => setDescExpanded((v) => !v)}
                className="mt-3 text-sm font-semibold text-[#FF9900] hover:text-[#e68a00] transition-colors flex items-center gap-1"
              >
                {descExpanded ? "Prikaži manje ↑" : "Prikaži više ↓"}
              </button>
            )}
          </div>
        )}

        {/* ── Similar products ──────────────────────────────────────── */}
        {similar.length > 0 && (
          <div className="mb-6">
            <h2 className="text-base font-bold text-slate-900 mb-4">Slični proizvodi</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              {similar.map((p) => (
                <Link
                  key={p.id}
                  href={`/product/${p.id}`}
                  className="shrink-0 w-44 bg-white rounded-xl border border-slate-200 p-3 hover:border-[#FF9900] hover:shadow-md transition-all duration-150"
                >
                  {p.imageUrl && (
                    <div className="aspect-square bg-slate-50 rounded-lg mb-2 overflow-hidden relative">
                      <Image src={p.imageUrl} alt={p.name} fill sizes="176px" className="object-contain p-2" />
                    </div>
                  )}
                  <p className="text-xs font-semibold text-slate-800 leading-tight line-clamp-2 mb-1">{p.name}</p>
                  <p className="text-sm font-black text-slate-900">{p.price}</p>
                  {p.storeName && <p className="text-[10px] text-slate-400 mt-0.5">{p.storeName}</p>}
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
