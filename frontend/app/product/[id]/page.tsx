"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import { Product } from "@/types/product";
import Header from "@/components/Header";
import Link from "next/link";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { ShoppingCart, ArrowLeft, Package, Zap, Droplets, Flame } from "lucide-react";

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
      <div className="flex justify-between text-xs text-slate-500 mb-1">
        <span>{label}</span>
        <span className="font-semibold text-slate-700">{score}</span>
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

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [similar, setSimilar] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/products/${id}`)
      .then((res) => {
        setProduct(res.data);
        const src = res.data.proteinSource;
        if (src) {
          api.get(`/products?category=${src}&size=7`)
            .then((r) => setSimilar(
              (r.data.content as Product[]).filter((p) => p.id !== res.data.id).slice(0, 6)
            ))
            .catch(() => {});
        }
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Skeleton />;

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-500">
          <p className="text-lg font-medium">Proizvod nije pronađen</p>
          <Link href="/" className="text-sm text-[#FF9900] hover:underline">← Početna</Link>
        </div>
      </div>
    );
  }

  const score = product.valueScore;
  const color = score ? scoreColor(score) : "#94a3b8";

  const chartData = [...(product.priceHistory ?? [])]
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map((h) => ({
      datum: new Date(h.timestamp).toLocaleDateString("sr-RS", { day: "2-digit", month: "short" }),
      cena: parseFloat(String(h.price).replace(/[^0-9.,]/g, "").replace(",", ".")),
    }));

  const catLabel = product.proteinSource ? CATEGORY_LABELS[product.proteinSource] ?? product.proteinSource : null;
  const catSlug  = product.proteinSource ? CATEGORY_SLUGS[product.proteinSource] : null;

  // Approximate score breakdown from available data
  const proteinPct = product.proteinPer100g ?? 0;
  const proteinPurityScore = Math.round(Math.min(10, Math.max(0, 10 * Math.pow(Math.max(0, (proteinPct - 60) / 40), 0.7))));

  const digestMap: Record<string, number> = {
    hydrolysate: 10, whey_isolate: 9, casein: 8, whey_concentrate: 7, blend: 7, vegan: 6,
  };
  const digestScore = product.proteinSource ? (digestMap[product.proteinSource] ?? 7) : 7;

  const sugarScore = Math.round(Math.max(0, 10 - (product.sugarPer100g ?? 0) > 10 ? 0 : (product.sugarPer100g ?? 0) * 0.5));
  const ingredientsScore = Math.max(0, 10 - (product.sugarPer100g != null && product.sugarPer100g > 10 ? 3 : product.sugarPer100g != null && product.sugarPer100g > 5 ? 1.5 : 0));

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
          <div className="bg-white rounded-2xl border border-slate-200 p-8 flex items-center justify-center aspect-square shadow-sm">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="max-h-full max-w-full object-contain hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <Package className="w-24 h-24 text-slate-200" />
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col gap-4">
            {/* Badges */}
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

            {/* Price card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <p className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">
                Trenutna cena
              </p>
              <p className="text-4xl font-black text-slate-900 mb-1">
                {product.price}
              </p>
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

            {/* Score badge */}
            {score != null && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center shrink-0 text-white font-black text-xl"
                  style={{ background: color }}
                >
                  {score.toFixed(1)}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">
                    Value Score
                  </p>
                  <p className="text-base font-bold" style={{ color }}>
                    {scoreLabel(score)}
                  </p>
                  <p className="text-xs text-slate-400">na skali 1–10</p>
                </div>
              </div>
            )}

            {/* Kupi */}
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/${id}/buy`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-bold text-base text-[#131921] transition-all duration-150 active:scale-[0.98] shadow-lg"
              style={{
                background: "linear-gradient(135deg, #FF9900, #e68a00)",
                boxShadow: "0 4px 24px rgba(255,153,0,0.35)",
              }}
            >
              <ShoppingCart className="w-5 h-5" />
              Kupi u {product.storeName}
            </a>
          </div>
        </div>

        {/* ── Score breakdown ────────────────────────────────────────── */}
        {score != null && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6">
            <h2 className="text-base font-bold text-slate-900 mb-5">
              Proteinoteka Score — detalji
            </h2>
            <div className="space-y-4">
              <ScoreBar label="Vrednost za novac (40%)"  pct={(score / 10) * 100} score={`${score.toFixed(1)}/10`} />
              <ScoreBar label="Čistoća proteina (20%)"   pct={proteinPurityScore * 10} score={`${proteinPurityScore}/10`} />
              <ScoreBar label="Apsorpcija (15%)"         pct={digestScore * 10}       score={`${digestScore}/10`} />
              <ScoreBar label="Sastojci/šećer (15%)"     pct={ingredientsScore * 10}  score={`${ingredientsScore.toFixed(1)}/10`} />
            </div>
          </div>
        )}

        {/* ── Nutrition ──────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6">
          <h2 className="text-base font-bold text-slate-900 mb-2">Nutritivne vrednosti</h2>
          <p className="text-xs text-slate-400 mb-4">Na 100g proizvoda</p>
          <NutritionRow label="Proteini"    value={product.proteinPer100g}  unit="g"    icon={<Zap className="w-4 h-4" />} />
          <NutritionRow label="Masti"       value={product.fatPer100g}      unit="g"    icon={<Droplets className="w-4 h-4" />} />
          <NutritionRow label="Šećeri"      value={product.sugarPer100g}    unit="g"    icon={<Droplets className="w-4 h-4" />} />
          <NutritionRow label="Kalorije"    value={product.caloriePer100g}  unit=" kcal" icon={<Flame className="w-4 h-4" />} />
          {catLabel && (
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <span className="text-sm text-slate-600 flex items-center gap-2">
                <Package className="w-4 h-4 text-[#FF9900]" /> Tip proteina
              </span>
              <span className="text-sm font-bold text-slate-900">{catLabel}</span>
            </div>
          )}
          {product.primaryWeightGrams && (
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-slate-600 flex items-center gap-2">
                <Package className="w-4 h-4 text-[#FF9900]" /> Pakovanje
              </span>
              <span className="text-sm font-bold text-slate-900">
                {product.primaryWeightGrams >= 1000
                  ? `${(product.primaryWeightGrams / 1000).toFixed(1)} kg`
                  : `${product.primaryWeightGrams} g`}
              </span>
            </div>
          )}
        </div>

        {/* ── Price history ──────────────────────────────────────────── */}
        {chartData.length > 1 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6">
            <h2 className="text-base font-bold text-slate-900 mb-6">Istorija cene</h2>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="datum" axisLine={false} tickLine={false}
                         tick={{ fill: "#94a3b8", fontSize: 11 }} dy={8} />
                  <YAxis hide domain={["dataMin - 200", "dataMax + 200"]} />
                  <Tooltip
                    cursor={{ stroke: "#e2e8f0", strokeWidth: 2 }}
                    content={({ active, payload }) =>
                      active && payload?.length ? (
                        <div className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-xl text-xs">
                          <p className="font-bold mb-0.5">{payload[0].payload.datum}</p>
                          <p className="text-[#FF9900]">{payload[0].value?.toLocaleString("sr-RS")} RSD</p>
                        </div>
                      ) : null
                    }
                  />
                  <Line type="stepAfter" dataKey="cena" stroke="#FF9900" strokeWidth={3}
                        dot={{ r: 0 }} activeDot={{ r: 5, fill: "#FF9900" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── Description ───────────────────────────────────────────── */}
        {product.description && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6">
            <h2 className="text-base font-bold text-slate-900 mb-4">Opis proizvoda</h2>
            <div
              className="text-sm text-slate-600 leading-relaxed prose max-w-none"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
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
                    <div className="aspect-square bg-slate-50 rounded-lg mb-2 overflow-hidden">
                      <img src={p.imageUrl} alt={p.name}
                           className="w-full h-full object-contain p-2" />
                    </div>
                  )}
                  <p className="text-xs font-semibold text-slate-800 leading-tight line-clamp-2 mb-1">
                    {p.name}
                  </p>
                  <p className="text-sm font-black text-slate-900">{p.price}</p>
                  {p.storeName && (
                    <p className="text-[10px] text-slate-400 mt-0.5">{p.storeName}</p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-8 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-48 mb-8" />
        <div className="grid md:grid-cols-2 gap-6">
          <div className="aspect-square bg-slate-200 rounded-2xl" />
          <div className="space-y-4">
            <div className="h-4 bg-slate-200 rounded w-32" />
            <div className="h-8 bg-slate-200 rounded w-3/4" />
            <div className="h-28 bg-slate-200 rounded-2xl" />
            <div className="h-16 bg-slate-200 rounded-2xl" />
            <div className="h-14 bg-slate-200 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
