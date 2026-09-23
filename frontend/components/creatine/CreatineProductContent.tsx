"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { Bell, BellOff, Package, ShoppingCart, Store } from "lucide-react";
import Header from "@/components/Header";
import ScrollableRow from "@/components/ScrollableRow";
import PriceTag from "@/components/PriceTag";
import { PriceTrendIndicator } from "@/components/PriceTrendIndicator";
import PriceAlertModal from "@/components/PriceAlertModal";
import CreatineExtras from "@/components/creatine/CreatineExtras";
import CreatinePriceMeta from "@/components/creatine/CreatinePriceMeta";
import { analytics } from "@/lib/analytics";
import { AlertEntry, deleteAlert, getAlert } from "@/lib/alerts";
import { getWishlistEmail } from "@/lib/wishlistSync";
import { CURRENT_MARKET, MARKET_CONFIG } from "@/lib/marketConfig";
import { formatPrice } from "@/lib/formatPrice";
import { displayName } from "@/lib/productDisplayName";
import { productUrl } from "@/lib/productUrl";
import {
  CREATINE_COPY,
  CREATINE_PATH,
  FORM_LABELS,
  TYPE_LABELS,
  isCountedForm,
  packLabel,
  pricePer100g,
  pricePerServing,
} from "@/lib/creatine";
import type { CreatineStorePrice } from "@/lib/creatine-data";
import type { Product } from "@/types/product";

const PriceHistoryChart = dynamic(() => import("@/components/PriceHistoryChart"), { ssr: false });

const IS_HR = CURRENT_MARKET === "hr";
const MARKET = MARKET_CONFIG[CURRENT_MARKET];
const C = CREATINE_COPY;
const P = C.product;

const API = process.env.NEXT_PUBLIC_API_URL ?? "";
const buyUrl = (id: number) => `${API}/api/v1/products/${id}/buy`;

function gramsLabel(g: number): string {
  return `${String(Math.round(g * 100) / 100).replace(".", ",")} g`;
}

// ── Price alert ──────────────────────────────────────────────────────────────────

function AlertBox({ product }: { product: Product }) {
  const [mounted, setMounted] = useState(false);
  const [entry, setEntry] = useState<AlertEntry | undefined>(undefined);
  const [modalOpen, setModalOpen] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState(false);

  const refresh = () => setEntry(getAlert(product.id));

  useEffect(() => {
    setMounted(true);
    setEntry(getAlert(product.id));
  }, [product.id]);

  const remove = async () => {
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

  const open = () => {
    analytics.alertCtaClicked(product.id, product.name, "product_page");
    setModalOpen(true);
  };

  const active = mounted && entry !== undefined;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-6 px-5 py-4">
      {active ? (
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Bell className="w-4 h-4 text-emerald-600" fill="#16a34a" />
              <span className="text-sm font-bold text-emerald-700">{P.tracking}</span>
            </div>
            <p className="text-xs text-slate-500">
              {entry?.targetPrice
                ? IS_HR
                  ? `Dobit ćeš email kada cijena padne ispod ${new Intl.NumberFormat(MARKET.locale).format(Math.round(entry.targetPrice))} ${MARKET.currency}`
                  : `Dobićeš email kada cena padne ispod ${new Intl.NumberFormat(MARKET.locale).format(Math.round(entry.targetPrice))} ${MARKET.currency}`
                : IS_HR ? "Dobit ćeš email kada cijena značajno padne" : "Dobićeš email kada cena značajno padne"}
            </p>
            {removeError && <p className="text-xs text-red-500 mt-1">{IS_HR ? "Greška. Pokušaj ponovno." : "Greška. Pokušaj ponovo."}</p>}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button onClick={open} className="text-xs font-semibold text-[#FF9900] hover:text-[#e68a00] transition-colors">
              {IS_HR ? "Izmijeni" : "Izmeni"}
            </button>
            <button
              onClick={remove}
              disabled={removing}
              className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
            >
              <BellOff className="w-3.5 h-3.5" />
              {removing ? "..." : "Ukloni"}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-semibold text-slate-800 mb-0.5">{P.track}</p>
            <p className="text-xs text-slate-500">
              {IS_HR ? "Email kada cijena značajno padne. Bez registracije." : "Email kada cena značajno padne. Bez registracije."}
            </p>
          </div>
          <button
            onClick={open}
            className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-[#1B2B4B] text-white font-bold text-sm rounded-xl hover:bg-[#243860] transition-colors"
          >
            <Bell className="w-4 h-4" />
            {IS_HR ? "Obavijesti me" : "Obavesti me"}
          </button>
        </div>
      )}

      {modalOpen && (
        <PriceAlertModal
          product={product}
          initialAlert={mounted ? entry : undefined}
          onClose={(changed) => { setModalOpen(false); if (changed) refresh(); }}
        />
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────────

interface Props {
  product: Product;
  storePrices: CreatineStorePrice[];
  similar: Product[];
}

export default function CreatineProductContent({ product, storePrices, similar }: Props) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    analytics.viewItemDetails(product.id, product.name, product.storeName ?? "");
  }, [product.id, product.name, product.storeName]);

  const counted = isCountedForm(product.productForm);
  const pack = packLabel(product);
  const formLabel = FORM_LABELS[product.productForm ?? ""] ?? null;
  const typeLabel = product.creatineType ? TYPE_LABELS[product.creatineType] ?? null : null;
  const perServing = pricePerServing(product);
  const per100 = pricePer100g(product);

  const cheapestElsewhere = storePrices.find(
    (sp) => sp.id !== product.id && sp.numericPrice != null && sp.numericPrice > 0 && sp.numericPrice < product.numericPrice,
  );

  const history = [...(product.priceHistory ?? [])]
    .filter((h) => h.numericPrice != null && h.numericPrice > 0)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map((h) => ({
      datum: new Date(h.timestamp).toLocaleDateString(MARKET.locale, { day: "2-digit", month: "short" }),
      cena: h.numericPrice as number,
    }));
  // The chart always ends at today's price: it is still valid "as of now" even if the last scrape was days ago.
  const chartData = product.numericPrice > 0
    ? [...history, { datum: new Date().toLocaleDateString(MARKET.locale, { day: "2-digit", month: "short" }), cena: product.numericPrice }]
    : history;
  const chartPrices = chartData.map((d) => d.cena);
  const chartMin = chartPrices.length ? Math.min(...chartPrices) : 0;
  const chartMax = chartPrices.length ? Math.max(...chartPrices) : 0;
  const chartFirst = chartData[0]?.cena ?? 0;
  const chartCurrent = chartData[chartData.length - 1]?.cena ?? 0;
  const chartChangePct = chartFirst > 0 ? ((chartCurrent - chartFirst) / chartFirst) * 100 : 0;

  const specs: { label: string; value: string }[] = [
    ...(formLabel ? [{ label: P.form, value: formLabel }] : []),
    ...(typeLabel ? [{ label: P.type, value: typeLabel }] : []),
    ...(pack ? [{ label: P.pack, value: pack }] : []),
    ...(product.servingsPerContainer && product.servingsPerContainer >= 5 && product.servingsPerContainer <= 1000
      ? [{ label: P.servings, value: String(product.servingsPerContainer) }] : []),
    ...(product.creatineGramsPerServing ? [{ label: P.dose, value: gramsLabel(product.creatineGramsPerServing) }] : []),
    ...(perServing != null ? [{ label: P.perServing, value: formatPrice(perServing) }] : []),
    ...(per100 != null ? [{ label: P.per100, value: formatPrice(per100) }] : []),
  ];

  const allSamePrice = storePrices.length > 0 && storePrices.every((sp) => sp.numericPrice === storePrices[0].numericPrice);
  const orderedPrices = allSamePrice
    ? [...storePrices].sort((a, b) => (b.id === product.id ? 1 : 0) - (a.id === product.id ? 1 : 0))
    : storePrices;
  const cheapestPrice = storePrices[0]?.numericPrice ?? null;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <div className="max-w-5xl mx-auto px-4 py-6">
        <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-6 flex-wrap" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-[#FF9900] transition-colors">{C.breadcrumbHome}</Link>
          <span>/</span>
          <Link href={CREATINE_PATH} className="hover:text-[#FF9900] transition-colors">{C.navLabel}</Link>
          <span>/</span>
          <span className="text-slate-600 truncate max-w-[200px] sm:max-w-xs">{product.name}</span>
        </nav>

        {/* ── Hero ── */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
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
            ) : (
              <Package className="w-24 h-24 text-slate-200" />
            )}
          </div>

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
              {formLabel && (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-100">
                  {formLabel}
                </span>
              )}
              {typeLabel && (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                  {typeLabel}
                </span>
              )}
              {pack && (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#1B2B4B] text-white flex items-center gap-1.5">
                  <Package className="w-3 h-3" />
                  {pack}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">{displayName(product)}</h1>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
              <p className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1.5">{IS_HR ? "Trenutna cijena" : "Trenutna cena"}</p>
              {product.previousPrice != null && product.previousPrice > 0 && product.previousPrice !== product.numericPrice && (
                <p className="text-base text-[#9CA3AF] line-through leading-none mb-1.5">
                  <PriceTag price={product.previousPrice} className="text-base text-[#9CA3AF] line-through" currencyClassName="text-[0.85em] ml-0.5 text-[#9CA3AF]" />
                </p>
              )}
              {/* The price is the main comparison point for creatine (no value score on the frontend), so it
                  carries the visual weight this card would otherwise give a score. */}
              <div className="flex items-center flex-wrap gap-2.5 mb-3">
                <PriceTag price={product.numericPrice} className="text-5xl sm:text-6xl font-black text-[#1B2B4B] leading-none tracking-tight" />
                <PriceTrendIndicator currentPrice={product.numericPrice} previousPrice={product.previousPrice} />
              </div>
              <CreatinePriceMeta product={product} size="md" />

              {cheapestElsewhere && cheapestElsewhere.numericPrice != null && (
                <button
                  type="button"
                  onClick={() => document.getElementById("store-prices")?.scrollIntoView({ behavior: "smooth" })}
                  className="w-full text-left mt-3 flex items-center gap-2.5 p-3 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 active:bg-emerald-100 transition-colors"
                >
                  <span className="text-base shrink-0">💡</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-emerald-800">{cheapestElsewhere.storeName}: {formatPrice(cheapestElsewhere.numericPrice)}</span>
                    <span className="text-xs text-emerald-700"> — {IS_HR ? "ušteda" : "uštedi"} {formatPrice(Math.round(product.numericPrice - cheapestElsewhere.numericPrice))}</span>
                  </div>
                  <span className="text-xs font-semibold text-emerald-500 shrink-0">vidi sve ↓</span>
                </button>
              )}
              <p className="text-[11px] text-slate-400 mt-3 leading-snug">{P.disclaimer}</p>
            </div>

            <a
              href={buyUrl(product.id)}
              target="_blank"
              rel="noopener noreferrer sponsored"
              onClick={() => analytics.clickBuyDetails(product.id, product.name, product.storeName ?? "")}
              className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-bold text-base text-[#131921] transition-all duration-150 active:scale-[0.98] shadow-lg"
              style={{ background: "linear-gradient(135deg, #FF9900, #e68a00)", boxShadow: "0 4px 24px rgba(255,153,0,0.35)" }}
            >
              <ShoppingCart className="w-5 h-5" />
              {P.buy(product.storeName)}
            </a>
          </div>
        </div>

        {/* ── Cross-store prices ── */}
        {storePrices.length > 1 && (
          <div id="store-prices" className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-6 overflow-hidden">
            <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100">
              <Store className="w-4 h-4 text-[#FF9900]" />
              <h2 className="text-base font-bold text-slate-900">{P.whereCheapest}</h2>
            </div>
            <ul>
              {orderedPrices.map((sp, i) => {
                const isCheapest = !allSamePrice && i === 0;
                const isCurrent = sp.id === product.id;
                const diff = !allSamePrice && !isCheapest && cheapestPrice != null && sp.numericPrice != null
                  ? Math.round(sp.numericPrice - cheapestPrice) : null;
                const spUrl = productUrl({ id: sp.id, name: sp.name ?? product.name, canonicalSlug: sp.canonicalSlug, productType: "creatine" });
                const rowPack = counted
                  ? pack
                  : sp.primaryWeightGrams ? packLabel({ primaryWeightGrams: sp.primaryWeightGrams, numericPrice: 0 }) : null;
                const rowPer100 = pricePer100g({ productForm: product.productForm, primaryWeightGrams: sp.primaryWeightGrams, numericPrice: sp.numericPrice ?? 0 });
                return (
                  <li key={sp.id} className={`border-b border-slate-100 last:border-0 ${isCheapest ? "bg-green-50" : ""}`}>
                    <div className="flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {isCurrent ? (
                            <span className="text-sm font-semibold text-[#FF9900]">{sp.storeName}</span>
                          ) : (
                            <Link href={spUrl} className="text-sm font-semibold text-slate-800 hover:text-[#FF9900] transition-colors">{sp.storeName}</Link>
                          )}
                          {isCheapest && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">{P.cheapest}</span>}
                          {isCurrent && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-100">Trenutno gledaš</span>}
                        </div>
                        {sp.name && <p className="text-xs text-slate-500 mt-0.5 truncate">{sp.name}</p>}
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {rowPack && <span className="text-[10px] text-slate-400 font-medium">{rowPack}</span>}
                          {rowPer100 != null && <span className="text-[10px] text-slate-400 font-medium">{formatPrice(rowPer100)} / 100 g</span>}
                          {diff != null && diff > 0 && (
                            <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full">
                              +{formatPrice(diff)} skuplje
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`text-base sm:text-lg font-black shrink-0 ${isCheapest ? "text-green-700" : "text-slate-900"}`}>
                        {formatPrice(sp.numericPrice)}
                      </span>
                      <a
                        href={buyUrl(sp.id)}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        onClick={() => analytics.clickBuyDetails(sp.id, sp.name ?? product.name, sp.storeName ?? "")}
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
        )}

        <AlertBox product={product} />

        {/* ── Specs ── */}
        {specs.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6">
            <h2 className="text-base font-bold text-slate-900 mb-2">{P.specs}</h2>
            <dl>
              {specs.map((s) => (
                <div key={s.label} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                  <dt className="text-sm text-slate-600">{s.label}</dt>
                  <dd className="text-sm font-bold text-slate-900">{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {/* ── Price history ── */}
        {chartData.length >= 2 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">{P.history}</h2>
                <p className="text-xs text-slate-400 mt-0.5">od {chartData[0]?.datum}</p>
              </div>
              {Math.abs(chartChangePct) >= 1 && (
                <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                  chartChangePct < 0 ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-600 border border-red-100"
                }`}>
                  {chartChangePct < 0 ? "▼" : "▲"} {Math.abs(chartChangePct).toFixed(0)}%
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: "Najniža", val: chartMin, cls: "text-green-600" },
                { label: "Trenutna", val: chartCurrent, cls: "text-slate-900" },
                { label: "Najviša", val: chartMax, cls: "text-slate-700" },
              ].map(({ label, val, cls }) => (
                <div key={label} className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">{label}</p>
                  <p className={`text-sm font-black ${cls} leading-tight`}>{formatPrice(val)}</p>
                </div>
              ))}
            </div>
            <div className="h-48">
              <PriceHistoryChart data={chartData} />
            </div>
          </div>
        )}

        {/* ── Description (only the generated one: store descriptions are raw HTML we do not inject) ── */}
        {product.aiDescription && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Opis proizvoda</h2>
            <div className="max-w-prose">
              {product.aiDescription.split("\n").filter(Boolean).map((para, i) => (
                <p key={i} className="text-[15px] leading-[1.75] text-slate-700 mb-4 last:mb-0">{para.replace(/^#+\s*/, "")}</p>
              ))}
            </div>
          </div>
        )}

        {/* ── Similar ── */}
        {similar.length > 0 && (
          <div className="mb-6">
            <h2 className="text-base font-bold text-slate-900 mb-4">{P.similar}</h2>
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
                  <p className="text-sm font-black text-slate-900">{formatPrice(p.numericPrice)}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {[p.storeName, packLabel(p)].filter(Boolean).join(" · ")}
                  </p>
                </Link>
              ))}
            </ScrollableRow>
          </div>
        )}

        <Link
          href={CREATINE_PATH}
          className="group flex items-center gap-3 bg-orange-50 border border-orange-100 rounded-2xl px-5 py-4 mb-6 hover:border-[#FF9900] hover:bg-[#FFF8EC] transition-all duration-150"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 group-hover:text-[#FF9900] transition-colors leading-snug">
              {C.page.h1} →
            </p>
          </div>
        </Link>
      </div>

      <CreatineExtras contact={false} />
    </div>
  );
}
