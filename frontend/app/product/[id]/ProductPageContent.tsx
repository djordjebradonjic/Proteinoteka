"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Product } from "@/types/product";
import Header from "@/components/Header";
import Link from "next/link";
import { ShoppingCart, ArrowLeft, Package, Zap, Droplets, Flame, Store, Bell, BellOff, BookOpen, ArrowRight } from "lucide-react";
import { GUIDES, CATEGORY_GUIDES } from "@/lib/guides";

const BRAND_PAGE_SLUGS: Record<string, string> = {
  "Optimum Nutrition": "/optimum-nutrition-proteini",
  "Scitec Nutrition":  "/scitec-nutrition-proteini",
  "Dymatize Nutrition": "/dymatize-proteini",
  "BioTech USA":       "/biotech-usa-proteini",
  "Biotech":           "/biotech-usa-proteini",
};
import ScrollableRow from "@/components/ScrollableRow";
import Image from "next/image";
import { analytics } from "@/lib/analytics";
import PricePerGramBadge from "@/components/PricePerGramBadge";
import { PriceTrendIndicator } from "@/components/PriceTrendIndicator";
import { productUrl } from "@/lib/productUrl";
import { getAlert, hasAlert, loadAlerts, deleteAlert, AlertEntry } from "@/lib/alerts";
import { getWishlistEmail } from "@/lib/wishlistSync";
import PriceAlertModal from "@/components/PriceAlertModal";
import PriceTag from "@/components/PriceTag";
import ValueScoreCard from "@/components/ValueScoreCard";
import { formatPrice } from "@/lib/formatPrice";
import { getScoreColor, getScoreLabel } from "@/lib/scoreColor";

const PriceHistoryChart = dynamic(() => import("@/components/PriceHistoryChart"), { ssr: false });

// ── Flavours section ──────────────────────────────────────────────────────────

function FlavoursSection({ flavours }: { flavours: string[] }) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = flavours.length > 4;
  const visible = expanded ? flavours : flavours.slice(0, 4);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <p className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-2">Dostupni ukusi</p>
      <div className="flex flex-wrap gap-1.5">
        {visible.map((f) => (
          <span
            key={f}
            className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap"
          >
            {f}
          </span>
        ))}
        {hasMore && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-[#FF9900] border border-orange-200 hover:bg-orange-100 transition-colors whitespace-nowrap"
          >
            {expanded ? "Prikaži manje ↑" : `+${flavours.length - 4} više ↓`}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Price insight computation ─────────────────────────────────────────────────

type PriceInsight =
  | { type: "low" }
  | { type: "drop"; pct: number }
  | { type: "none" };

function computePriceInsight(product: Product): PriceInsight {
  const history = product.priceHistory;
  if (!history || history.length < 2 || !product.numericPrice) return { type: "none" };

  const parseP = (raw: string) =>
    parseFloat(String(raw).replace(/[^0-9.,]/g, "").replace(",", "."));

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const last30 = history
    .filter((h) => new Date(h.timestamp).getTime() >= thirtyDaysAgo)
    .map((h) => parseP(h.price))
    .filter((p) => p > 0);

  if (last30.length > 0 && product.numericPrice <= Math.min(...last30)) {
    return { type: "low" };
  }

  const sorted = [...history].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
  const oldest = sorted[0];
  if (oldest) {
    const oldPrice = parseP(oldest.price);
    if (oldPrice > 0 && product.numericPrice < oldPrice) {
      const pct = Math.round(((oldPrice - product.numericPrice) / oldPrice) * 100);
      if (pct >= 3) return { type: "drop", pct };
    }
  }

  return { type: "none" };
}

// ── Price alert section ───────────────────────────────────────────────────────

function PriceAlertSection({ product }: { product: Product }) {
  const insight = computePriceInsight(product);
  const [mounted, setMounted] = useState(false);
  const [alertActive, setAlertActive] = useState(false);
  const [alertData, setAlertData] = useState<AlertEntry | undefined>(undefined);
  const [modalOpen, setModalOpen] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState(false);

  useEffect(() => {
    setMounted(true);
    const a = getAlert(product.id);
    setAlertActive(a !== undefined);
    setAlertData(a);
  }, [product.id]);

  const refresh = () => {
    const a = getAlert(product.id);
    setAlertActive(a !== undefined);
    setAlertData(a);
  };

  const handleRemove = async () => {
    const email = getWishlistEmail();
    if (!email) return;
    setRemoving(true);
    setRemoveError(false);
    try {
      await deleteAlert(email, product.id);
      refresh();
    } catch {
      setRemoveError(true);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-6 overflow-hidden">
      {/* Price insight banner */}
      {insight.type !== "none" && (
        <div className={`px-5 py-3 text-sm font-semibold flex items-center gap-2 ${
          insight.type === "low"
            ? "bg-amber-50 text-amber-700 border-b border-amber-100"
            : "bg-emerald-50 text-emerald-700 border-b border-emerald-100"
        }`}>
          {insight.type === "low" ? (
            <><span>🔥</span> Najniža cena u poslednjih 30 dana</>
          ) : (
            <><span>📉</span> Cena je pala {insight.pct}% u poslednjih 30 dana</>
          )}
        </div>
      )}

      <div className="px-5 py-4">
        {mounted && alertActive ? (
          /* Alert is active */
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Bell className="w-4 h-4 text-emerald-600" fill="#16a34a" />
                <span className="text-sm font-bold text-emerald-700">Obaveštenje aktivno</span>
              </div>
              <p className="text-xs text-slate-500">
                {alertData?.targetPrice
                  ? `Dobićeš email kada cena padne ispod ${new Intl.NumberFormat("sr-RS").format(Math.round(alertData.targetPrice))} RSD`
                  : "Dobićeš email kada cena značajno padne"}
              </p>
              {removeError && (
                <p className="text-xs text-red-500 mt-1">Greška. Pokušaj ponovo.</p>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => { analytics.alertCtaClicked(product.id, product.name, "product_page"); setModalOpen(true); }}
                className="text-xs font-semibold text-[#FF9900] hover:text-[#e68a00] transition-colors"
              >
                Izmeni
              </button>
              <button
                onClick={handleRemove}
                disabled={removing}
                className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
              >
                <BellOff className="w-3.5 h-3.5" />
                {removing ? "..." : "Ukloni"}
              </button>
            </div>
          </div>
        ) : (
          /* Alert not active */
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-semibold text-slate-800 mb-0.5">Prati promenu cene</p>
              <p className="text-xs text-slate-500">Email kada cena značajno padne. Bez registracije.</p>
            </div>
            <button
              onClick={() => {
                analytics.alertCtaClicked(product.id, product.name, "product_page");
                setModalOpen(true);
              }}
              className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-[#1B2B4B] text-white font-bold text-sm rounded-xl hover:bg-[#243860] transition-colors"
            >
              <Bell className="w-4 h-4" />
              Obavesti me
            </button>
          </div>
        )}
      </div>

      {modalOpen && (
        <PriceAlertModal
          product={product}
          initialAlert={mounted ? alertData : undefined}
          onClose={(changed) => { setModalOpen(false); if (changed) refresh(); }}
        />
      )}
    </div>
  );
}

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
  const trimmed = cut > 0 ? html.slice(0, cut) : html;
  if (typeof window === "undefined") return trimmed;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const DOMPurify = require("dompurify");
  return DOMPurify.sanitize(trimmed, { USE_PROFILES: { html: true } });
}

// ── Star helpers ──────────────────────────────────────────────────────────────

function Stars({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const px = size === "lg" ? "w-5 h-5" : "w-3.5 h-3.5";
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} className={`${px} shrink-0`} viewBox="0 0 20 20" fill={s <= rating ? "#FF9900" : "#e2e8f0"}>
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

function InteractiveStars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <span className="inline-flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(s)}
          className="p-0.5"
          aria-label={`${s} zvezda`}
        >
          <svg className="w-7 h-7 transition-colors" viewBox="0 0 20 20" fill={(hovered || value) >= s ? "#FF9900" : "#e2e8f0"}>
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </span>
  );
}

// ── Review section ────────────────────────────────────────────────────────────

function ReviewSection({ productId, reviews, aggregateRating }: {
  productId: number;
  reviews: ReviewDTO[];
  aggregateRating: AggregateRatingDTO | null;
}) {
  const [formOpen, setFormOpen]     = useState(false);
  const [name, setName]             = useState("");
  const [rating, setRating]         = useState(0);
  const [comment, setComment]       = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [error, setError]           = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { setError("Izaberi ocenu."); return; }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/${productId}/reviews`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayName: name.trim() || null, rating, comment: comment.trim() || null }),
        }
      );
      if (!res.ok) throw new Error();
      setSubmitted(true);
      setFormOpen(false);
    } catch {
      setError("Greška. Pokušaj ponovo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-bold text-slate-900">Recenzije</h2>
          {aggregateRating && aggregateRating.reviewCount > 0 && (
            <div className="flex items-center gap-1.5">
              <Stars rating={Math.round(aggregateRating.averageRating)} />
              <span className="text-sm font-bold text-slate-700">{aggregateRating.averageRating.toFixed(1)}</span>
              <span className="text-xs text-slate-400">({aggregateRating.reviewCount})</span>
            </div>
          )}
        </div>
        {!submitted && (
          <button
            onClick={() => setFormOpen(v => !v)}
            className="text-xs font-bold px-3 py-2 rounded-xl bg-[#1B2B4B] text-white hover:bg-[#243860] transition-colors"
          >
            {formOpen ? "Otkaži" : "+ Ostavi recenziju"}
          </button>
        )}
      </div>

      {/* Submission confirmation */}
      {submitted && (
        <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-100 text-sm text-emerald-700 font-semibold">
          Hvala! Recenzija je primljena i biće objavljena nakon pregleda.
        </div>
      )}

      {/* Form */}
      {formOpen && !submitted && (
        <form onSubmit={handleSubmit} className="px-6 py-5 border-b border-slate-100 space-y-4 bg-slate-50">
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">Ocena *</p>
            <InteractiveStars value={rating} onChange={setRating} />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-1">Ime (opciono)</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={100}
              placeholder="Npr. Marko"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF9900]/30 focus:border-[#FF9900]"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-1">Komentar (opciono)</label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              maxLength={2000}
              rows={3}
              placeholder="Ukratko napiši iskustvo..."
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF9900]/30 focus:border-[#FF9900] resize-none"
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 bg-[#FF9900] hover:bg-[#e68a00] disabled:opacity-50 text-[#131921] font-bold text-sm rounded-xl transition-colors"
          >
            {submitting ? "Slanje..." : "Pošalji recenziju"}
          </button>
        </form>
      )}

      {/* Review list */}
      {reviews.length > 0 ? (
        <ul className="divide-y divide-slate-100">
          {reviews.map(r => (
            <li key={r.id} className="px-6 py-4">
              <div className="flex items-center gap-2 mb-1">
                <Stars rating={r.rating} />
                <span className="text-xs font-semibold text-slate-700">{r.displayName ?? "Anonimno"}</span>
                <span className="text-[10px] text-slate-400 ml-auto">
                  {new Date(r.createdAt).toLocaleDateString("sr-Latn", { day: "2-digit", month: "2-digit", year: "numeric" })}
                </span>
              </div>
              {r.comment && <p className="text-sm text-slate-600 leading-relaxed">{r.comment}</p>}
            </li>
          ))}
        </ul>
      ) : (
        <div className="px-6 py-8 text-center">
          <p className="text-sm text-slate-400">Još nema recenzija. Budi prvi!</p>
        </div>
      )}
    </div>
  );
}

interface StorePrice { id: number; storeName: string; price: string; numericPrice: number | null; name: string | null; primaryWeightGrams: number | null; proteinSource: string | null; canonicalSlug: string | null; }
interface ReviewDTO { id: number; displayName: string | null; rating: number; comment: string | null; createdAt: string; }
interface AggregateRatingDTO { averageRating: number; reviewCount: number; }

interface Props {
  product: Product;
  similar: Product[];
  storePrices: StorePrice[];
  reviews: ReviewDTO[];
  aggregateRating: AggregateRatingDTO | null;
}

export default function ProductPageContent({ product, similar, storePrices, reviews, aggregateRating }: Props) {
  const router = useRouter();
  const [descExpanded, setDescExpanded] = useState(false);
  const [descOverflows, setDescOverflows] = useState(false);
  const [imgError, setImgError] = useState(false);
  const descRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    analytics.viewItemDetails(product.id, product.name, product.storeName ?? "");
  }, [product.id, product.name, product.storeName]);

  useEffect(() => {
    if (descRef.current) {
      setDescOverflows(descRef.current.scrollHeight > descRef.current.clientHeight + 4);
    }
  }, [product.aiDescription, product.description]);

  const score    = product.valueScore;
  const color    = score ? getScoreColor(score) : "#94a3b8";
  const catLabel = product.proteinSource ? CATEGORY_LABELS[product.proteinSource] ?? product.proteinSource : null;
  const catSlug  = product.proteinSource ? CATEGORY_SLUGS[product.proteinSource] : null;

  const historyPoints = [...(product.priceHistory ?? [])]
    .filter((h) => h.numericPrice != null && h.numericPrice > 0)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map((h) => ({
      datum: new Date(h.timestamp).toLocaleDateString("sr-RS", { day: "2-digit", month: "short" }),
      cena: h.numericPrice as number,
    }));

  // Add current price as the final point so the chart always ends at today's price
  const currentPoint = product.numericPrice > 0 ? {
    datum: new Date(product.lastUpdated ?? Date.now()).toLocaleDateString("sr-RS", { day: "2-digit", month: "short" }),
    cena: product.numericPrice,
  } : null;

  const chartData = currentPoint ? [...historyPoints, currentPoint] : historyPoints;

  const chartPrices    = chartData.map(d => d.cena);
  const chartMin       = chartPrices.length ? Math.min(...chartPrices) : 0;
  const chartMax       = chartPrices.length ? Math.max(...chartPrices) : 0;
  const chartFirst     = chartData[0]?.cena ?? 0;
  const chartCurrent   = chartData[chartData.length - 1]?.cena ?? 0;
  const chartChangePct = chartFirst > 0 ? ((chartCurrent - chartFirst) / chartFirst) * 100 : 0;

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
            {product.imageUrl && !imgError ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                width={400}
                height={400}
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 624px"
                className="max-h-full max-w-full object-contain hover:scale-105 transition-transform duration-300"
                priority
                onError={() => setImgError(true)}
                unoptimized
              />
            ) : product.storeName?.toLowerCase().includes("pansport") ? (
              <Image
                src="/protein-gym.jpg"
                alt={product.name}
                width={400}
                height={400}
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 624px"
                className="max-h-full max-w-full object-cover hover:scale-105 transition-transform duration-300"
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
                BRAND_PAGE_SLUGS[product.brand] ? (
                  <Link
                    href={BRAND_PAGE_SLUGS[product.brand]}
                    className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 hover:border-blue-200 active:bg-blue-100 active:border-blue-200 transition-colors"
                  >
                    {product.brand} ↗
                  </Link>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                    {product.brand}
                  </span>
                )
              )}
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                {product.storeName}
              </span>
              {catLabel && (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-100">
                  {catLabel}
                </span>
              )}
              {product.primaryWeightGrams && (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#1B2B4B] text-white flex items-center gap-1.5">
                  <Package className="w-3 h-3" />
                  {product.primaryWeightGrams >= 1000
                    ? `${product.primaryWeightGrams % 1000 === 0 ? product.primaryWeightGrams / 1000 : (product.primaryWeightGrams / 1000).toFixed(1)} kg`
                    : `${Math.round(product.primaryWeightGrams)} g`}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
              {product.name}
            </h1>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <p className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">Trenutna cena</p>
              {product.previousPrice != null &&
               product.previousPrice > 0 &&
               product.previousPrice !== product.numericPrice && (
                <p className="text-sm text-[#9CA3AF] line-through leading-none mb-1">
                  <PriceTag price={product.previousPrice} className="text-sm text-[#9CA3AF] line-through" currencyClassName="text-[0.85em] ml-0.5 text-[#9CA3AF]" />
                </p>
              )}
              <div className="flex items-center flex-wrap gap-2 mb-2">
                <PriceTag price={product.numericPrice} className="text-3xl sm:text-4xl font-black text-slate-900 leading-none" />
                <PriceTrendIndicator
                  currentPrice={product.numericPrice}
                  previousPrice={product.previousPrice}
                />
              </div>
              <PricePerGramBadge
                numericPrice={product.numericPrice}
                proteinPer100g={product.proteinPer100g}
                primaryWeightGrams={product.primaryWeightGrams}
                size="md"
              />
              {(() => {
                const cheapest = storePrices.find(sp => sp.numericPrice != null && sp.numericPrice > 0);
                if (!cheapest || cheapest.id === product.id || cheapest.numericPrice == null || product.numericPrice == null) return null;
                const saving = Math.round(product.numericPrice - cheapest.numericPrice);
                if (saving <= 0) return null;
                return (
                  <button
                    type="button"
                    onClick={() => document.getElementById("store-prices")?.scrollIntoView({ behavior: "smooth" })}
                    className="w-full text-left mt-3 flex items-center gap-2.5 p-3 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 active:bg-emerald-100 transition-colors"
                  >
                    <span className="text-base shrink-0">💡</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-emerald-800">{cheapest.storeName}: {cheapest.price}</span>
                      <span className="text-xs text-emerald-700"> — uštedi {saving.toLocaleString("sr-RS")} RSD</span>
                    </div>
                    <span className="text-xs font-semibold text-emerald-500 shrink-0">vidi sve ↓</span>
                  </button>
                );
              })()}
              <p className="text-[11px] text-slate-400 mt-2 leading-snug">
                Cene se ažuriraju nedeljno. Finalna cena na sajtu prodavca može se razlikovati.
              </p>
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
                  <p className="text-base font-bold" style={{ color }}>{getScoreLabel(score)}</p>
                  {product.percentileRank != null && product.percentileRank >= 10
                    ? <p className="text-xs text-slate-400">Bolje od {product.percentileRank}% proteina</p>
                    : <p className="text-xs text-slate-400">na skali 1–10</p>
                  }
                </div>
              </div>
            )}

            {product.flavours && product.flavours.length > 0 && (
              <FlavoursSection flavours={product.flavours} />
            )}

            <a
              href={buyUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => analytics.clickBuyDetails(product.id, product.name, product.storeName ?? "")}
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
          const allSamePrice = storePrices.every(sp => sp.numericPrice === cheapest);
          const orderedPrices = allSamePrice
            ? [...storePrices].sort((a, b) => (b.id === product.id ? 1 : 0) - (a.id === product.id ? 1 : 0))
            : storePrices;
          return (
            <div id="store-prices" className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-6 overflow-hidden">
              <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100">
                <Store className="w-4 h-4 text-[#FF9900]" />
                <h2 className="text-base font-bold text-slate-900">Cena po prodavnicama</h2>
              </div>
              <ul>
                {orderedPrices.map((sp, i) => {
                  const isCheapest = !allSamePrice && i === 0;
                  const diff = (!allSamePrice && cheapest != null && sp.numericPrice != null && !isCheapest)
                    ? Math.round(sp.numericPrice - cheapest) : null;
                  const isCurrent = sp.id === product.id;
                  const spUrl = productUrl({ id: sp.id, name: sp.name ?? "", proteinSource: sp.proteinSource, canonicalSlug: sp.canonicalSlug });
                  const weightLabel = sp.primaryWeightGrams
                    ? sp.primaryWeightGrams >= 1000
                      ? `${sp.primaryWeightGrams % 1000 === 0 ? sp.primaryWeightGrams / 1000 : (sp.primaryWeightGrams / 1000).toFixed(1)} kg`
                      : `${Math.round(sp.primaryWeightGrams)} g`
                    : null;
                  return (
                    <li key={sp.id} className={`border-b border-slate-100 last:border-0 ${isCheapest ? "bg-green-50" : ""}`}>
                      <div
                        role="button"
                        tabIndex={isCurrent ? -1 : 0}
                        className={`flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 transition-colors ${isCurrent ? "cursor-default" : "hover:bg-slate-50 cursor-pointer"}`}
                        onClick={() => { if (!isCurrent) router.push(spUrl); }}
                        onKeyDown={(e) => { if (!isCurrent && (e.key === "Enter" || e.key === " ")) router.push(spUrl); }}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-sm font-semibold ${isCurrent ? "text-[#FF9900]" : "text-slate-800"}`}>{sp.storeName}</span>
                            {isCheapest && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">Najjeftinije</span>}
                            {isCurrent && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-100">Trenutno gledaš</span>}
                          </div>
                          {sp.name && (
                            <p className="text-xs text-slate-500 mt-0.5 truncate">{sp.name}</p>
                          )}
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {weightLabel && (
                              <span className="text-[10px] text-slate-400 font-medium">{weightLabel}</span>
                            )}
                            {diff != null && (
                              <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full">
                                +{diff.toLocaleString("sr-RS")} RSD skuplje
                              </span>
                            )}
                          </div>
                        </div>
                        <span className={`text-sm sm:text-base font-black shrink-0 ${isCheapest ? "text-green-700" : "text-slate-900"}`}>{sp.price}</span>
                        <a
                          href={`${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/${sp.id}/buy`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => { e.stopPropagation(); analytics.clickBuyDetails(sp.id, sp.name ?? product.name, sp.storeName ?? ""); }}
                          className={`shrink-0 flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-bold transition-all ${isCheapest ? "bg-green-600 hover:bg-green-700 text-white" : "bg-slate-900 hover:bg-[#243860] text-white"}`}
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Kupi</span>
                        </a>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })()}

        {/* ── Price alert ───────────────────────────────────────────── */}
        <PriceAlertSection product={product} />

        {/* ── Score breakdown ────────────────────────────────────────── */}
        {score != null && (
          <ValueScoreCard
            score={score}
            product={product}
            proteinPurityScore={proteinPurityScore}
            digestScore={digestScore}
            ingredientsScore={ingredientsScore}
          />
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
        {chartData.length >= 2 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6">

            {/* Header */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">Istorija cene</h2>
                <p className="text-xs text-slate-400 mt-0.5">od {chartData[0]?.datum}</p>
              </div>
              {Math.abs(chartChangePct) >= 1 && (
                <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                  chartChangePct < 0
                    ? "bg-green-50 text-green-700 border border-green-100"
                    : "bg-red-50 text-red-600 border border-red-100"
                }`}>
                  {chartChangePct < 0 ? "▼" : "▲"} {Math.abs(chartChangePct).toFixed(0)}%
                </span>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: "Najniža",  val: chartMin,     cls: "text-green-600" },
                { label: "Trenutna", val: chartCurrent, cls: "text-slate-900" },
                { label: "Najviša",  val: chartMax,     cls: "text-slate-700" },
              ].map(({ label, val, cls }) => (
                <div key={label} className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">{label}</p>
                  <p className={`text-sm font-black ${cls} leading-tight`}>{formatPrice(val)}</p>
                </div>
              ))}
            </div>

            {/* Chart */}
            <div className="h-48">
              <PriceHistoryChart data={chartData} />
            </div>
          </div>
        )}

        {/* ── Reviews ───────────────────────────────────────────────── */}
        <ReviewSection productId={product.id} reviews={reviews} aggregateRating={aggregateRating} />

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
                      <p key={i} className="text-[15px] leading-[1.75] text-slate-700 mb-4 last:mb-0">{para.replace(/^#+\s*/, "")}</p>
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

        {/* ── Related guide ─────────────────────────────────────────── */}
        {product.proteinSource && CATEGORY_GUIDES[product.proteinSource] && (() => {
          const slug = CATEGORY_GUIDES[product.proteinSource!][0];
          const guide = GUIDES[slug];
          return (
            <Link
              href={guide.path}
              className="group flex items-center gap-3 bg-orange-50 border border-orange-100 rounded-2xl px-5 py-4 mb-6 hover:border-[#FF9900] hover:bg-[#FFF8EC] active:border-[#FF9900] active:bg-[#FFF8EC] transition-all duration-150"
            >
              <div className="shrink-0 w-8 h-8 rounded-full bg-white border border-orange-100 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-[#FF9900]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Vodič</p>
                <p className="text-sm font-bold text-slate-900 group-hover:text-[#FF9900] transition-colors leading-snug">
                  {guide.title} — {guide.description}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-[#FF9900] shrink-0" />
            </Link>
          );
        })()}

        {/* ── Similar products ──────────────────────────────────────── */}
        {similar.length > 0 && (
          <div className="mb-6">
            <h2 className="text-base font-bold text-slate-900 mb-4">Slični proizvodi</h2>
            <ScrollableRow fadeFrom="from-slate-50" gap="gap-3">
              {similar.map((p) => (
                <Link
                  key={p.id}
                  href={productUrl(p)}
                  className="shrink-0 w-44 bg-white rounded-xl border border-slate-200 p-3 hover:border-[#FF9900] hover:shadow-md transition-all duration-150"
                >
                  {p.imageUrl && (
                    <div className="aspect-square bg-slate-50 rounded-lg mb-2 overflow-hidden relative">
                      <Image src={p.imageUrl} alt={p.name} fill sizes="176px" className="object-contain p-2" unoptimized />
                    </div>
                  )}
                  <p className="text-xs font-semibold text-slate-800 leading-tight line-clamp-2 mb-1">{p.name}</p>
                  <p className="text-sm font-black text-slate-900">{p.price}</p>
                  {p.storeName && <p className="text-[10px] text-slate-400 mt-0.5">{p.storeName}</p>}
                </Link>
              ))}
            </ScrollableRow>
          </div>
        )}

        {/* ── Brand page CTA ────────────────────────────────────────── */}
        {product.brand && BRAND_PAGE_SLUGS[product.brand] && (
          <Link
            href={BRAND_PAGE_SLUGS[product.brand]}
            className="group flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4 mb-6 hover:border-blue-300 hover:bg-blue-100 active:border-blue-300 active:bg-blue-100 transition-all duration-150"
          >
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Brend</p>
              <p className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors leading-snug">
                Svi {product.brand} proizvodi u Srbiji — poređenje cena
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-blue-400 shrink-0" />
          </Link>
        )}

      </div>
    </div>
  );
}
