"use client";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  removeFromWishlist,
  clearWishlist,
  closeWishlist,
  hydrateWishlist,
} from "@/store/wishlistSlice";
import { addToCompare, removeFromCompare } from "@/store/compareSlice";
import {
  X, Heart, ExternalLink, ShoppingCart, Trash2,
  Cloud, CloudOff, CheckCircle2, Loader2, Bell, BellOff,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { productUrl } from "@/lib/productUrl";
import { useEffect, useRef, useState } from "react";
import { analytics } from "@/lib/analytics";
import {
  getWishlistEmail,
  setWishlistEmail,
  clearWishlistEmail,
  fetchWishlistIds,
  pushWishlistToBackend,
  fetchProductById,
} from "@/lib/wishlistSync";
import {
  loadAlerts,
  deleteAlert,
  AlertsMap,
  getAlert,
} from "@/lib/alerts";
import PriceAlertModal from "@/components/PriceAlertModal";

function ValueBadge({ score }: { score: number }) {
  const color =
    score >= 9.0 ? "#22c55e"
      : score >= 7.0 ? "#16a34a"
      : score >= 5.5 ? "#FF9900"
      : score >= 4.0 ? "#f97316"
      : "#ef4444";
  const label =
    score >= 9.0 ? "Best in class"
      : score >= 7.0 ? "Odlična kupovina"
      : score >= 5.5 ? "Dobar izbor"
      : score >= 4.0 ? "Prosečno"
      : "Ne preporučuje se";
  return (
    <span
      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap"
      style={{ backgroundColor: color + "22", color }}
    >
      {score.toFixed(1)} · {label}
    </span>
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function WishlistDrawer() {
  const dispatch  = useAppDispatch();
  const items     = useAppSelector((s: any) => s.wishlist.items) as any[];
  const isOpen    = useAppSelector((s: any) => s.wishlist.isOpen) as boolean;
  const compareIds   = useAppSelector((s: any) => s.compare.ids) as number[];
  const compareCount = compareIds.length;

  const [mounted, setMounted]         = useState(false);
  const [syncEmail, setSyncEmail]     = useState<string | null>(null);
  const [inputOpen, setInputOpen]     = useState(false);
  const [inputValue, setInputValue]   = useState("");
  const [isSaving, setIsSaving]       = useState(false);
  const [saveError, setSaveError]     = useState("");
  const [justSaved, setJustSaved]     = useState(false);
  const [alerts, setAlerts]           = useState<AlertsMap>({});
  const [alertModalProduct, setAlertModalProduct] = useState<any | null>(null);
  const [removingAlertId, setRemovingAlertId]     = useState<number | null>(null);

  const refreshAlerts = () => setAlerts(loadAlerts());

  // Auto-push to backend whenever items change (if email is saved)
  const syncEmailRef = useRef(syncEmail);
  useEffect(() => { syncEmailRef.current = syncEmail; }, [syncEmail]);

  useEffect(() => {
    if (!syncEmailRef.current) return;
    pushWishlistToBackend(
      syncEmailRef.current,
      items.map((p: any) => p.id),
    );
  }, [items]);

  // On mount: check cookie → restore from backend
  useEffect(() => {
    setMounted(true);
    setAlerts(loadAlerts());
    const email = getWishlistEmail();
    if (!email) return;
    setSyncEmail(email);

    fetchWishlistIds(email).then(async (ids) => {
      if (!ids.length) return;
      const localIds = new Set(
        (JSON.parse(localStorage.getItem("wishlist") ?? "[]") as any[]).map(
          (p: any) => p.id,
        ),
      );
      const missing = ids.filter((id) => !localIds.has(id));
      if (!missing.length) return;

      const fetched = await Promise.all(missing.map(fetchProductById));
      const products = fetched.filter(Boolean) as any[];
      if (products.length) dispatch(hydrateWishlist(products));
    });
  }, [dispatch]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") dispatch(closeWishlist());
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [dispatch]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const toggleCompare = (productId: number, productName: string) => {
    if (compareIds.includes(productId)) dispatch(removeFromCompare(productId));
    else if (compareCount < 4) dispatch(addToCompare({ id: productId, name: productName }));
  };

  const handleClearAll = () => {
    dispatch(clearWishlist());
    if (syncEmailRef.current) {
      pushWishlistToBackend(syncEmailRef.current, []);
    }
  };

  const handleSave = async () => {
    if (!EMAIL_RE.test(inputValue)) { setSaveError("Unesi ispravan email."); return; }
    setSaveError("");
    setIsSaving(true);
    await pushWishlistToBackend(inputValue.toLowerCase().trim(), items.map((p: any) => p.id));
    setWishlistEmail(inputValue.toLowerCase().trim());
    setSyncEmail(inputValue.toLowerCase().trim());
    setInputOpen(false);
    setInputValue("");
    setIsSaving(false);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 3000);
  };

  const handleDisconnect = () => {
    clearWishlistEmail();
    setSyncEmail(null);
    setInputOpen(false);
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-[100] transition-opacity"
          onClick={() => dispatch(closeWishlist())}
        />
      )}

      <div
        className={`fixed top-4 right-0 max-h-[90vh] w-[85vw] sm:w-[400px] bg-white z-[101] shadow-2xl flex flex-col transition-transform duration-300 ease-in-out rounded-l-2xl ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-[#FF9900]" fill="#FF9900" />
            <h2 className="font-bold text-slate-800 text-base">Lista željenih</h2>
            {mounted && items.length > 0 && (
              <span className="text-xs font-bold bg-[#FF9900] text-white px-2 py-0.5 rounded-full">
                {items.length}
              </span>
            )}
          </div>
          <button
            onClick={() => dispatch(closeWishlist())}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {!mounted || items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
              <Heart className="w-12 h-12 text-slate-200 mb-3" />
              <p className="font-semibold text-slate-400 text-sm">Lista je prazna</p>
              <p className="text-slate-400 text-xs mt-1">
                Klikni srce na proizvodu da ga dodaš ovde
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {items.filter((p: any) => p?.id != null).map((product: any) => {
                const isComparing = compareIds.includes(product.id);
                const isDisabled  = compareCount >= 4 && !isComparing;
                return (
                  <li
                    key={product.id}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                      isComparing
                        ? "bg-[#FFF3DC] shadow-[inset_0_0_0_2px_rgba(255,180,0,0.4)]"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="w-14 h-14 shrink-0 bg-slate-50 rounded-lg flex items-center justify-center overflow-hidden border border-slate-100">
                      {product.imageUrl ? (
                        <Image src={product.imageUrl} alt={product.name} width={56} height={56} className="w-full h-full object-contain" />
                      ) : (
                        <Heart className="w-5 h-5 text-slate-300" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate leading-tight">{product.name}</p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                        {product.brand && <span>{product.brand}</span>}
                        {product.brand && product.storeName && <span className="mx-1">·</span>}
                        {product.storeName && <span>{product.storeName}</span>}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs font-bold text-slate-800">{product.price}</span>
                        {product.valueScore != null && <ValueBadge score={product.valueScore} />}
                      </div>
                      <button
                        onClick={() => toggleCompare(product.id, product.name)}
                        disabled={isDisabled}
                        className={`mt-1.5 flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-all border ${
                          isComparing
                            ? "bg-white text-[#FF9900] border-[#FF9900]"
                            : isDisabled
                              ? "bg-slate-100 text-slate-300 border-transparent cursor-not-allowed"
                              : "bg-white text-slate-500 border-slate-200 hover:text-[#FF9900] hover:border-[#FF9900]"
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 border rounded-sm flex items-center justify-center shrink-0 ${
                          isComparing ? "bg-[#FF9900] border-[#FF9900]" : "border-slate-400"
                        }`}>
                          {isComparing && <span className="text-white text-[8px] font-black">✓</span>}
                        </span>
                        {isComparing ? "U poređenju" : isDisabled ? "Maksimum 4" : "Uporedi"}
                      </button>

                      {/* Alert status row */}
                      {(() => {
                        const alert = alerts[String(product.id)];
                        const hasEmailSet = !!syncEmail;
                        if (alert !== undefined) {
                          return (
                            <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                              <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                                <Bell className="w-3 h-3" fill="#16a34a" />
                                {alert.targetPrice
                                  ? `Ispod ${new Intl.NumberFormat("sr-RS").format(Math.round(alert.targetPrice))} RSD`
                                  : "Alert aktivan"}
                              </span>
                              <button
                                onClick={() => { analytics.alertCtaClicked(product.id, product.name, "wishlist"); setAlertModalProduct(product); }}
                                className="text-[10px] text-slate-400 hover:text-[#FF9900] transition-colors underline"
                              >
                                Izmeni
                              </button>
                              <button
                                disabled={removingAlertId === product.id}
                                onClick={async () => {
                                  if (!syncEmail) return;
                                  setRemovingAlertId(product.id);
                                  try {
                                    await deleteAlert(syncEmail, product.id);
                                    analytics.alertDeleted(product.id);
                                    refreshAlerts();
                                  } finally {
                                    setRemovingAlertId(null);
                                  }
                                }}
                                className="text-[10px] text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
                              >
                                {removingAlertId === product.id ? "..." : "Ukloni"}
                              </button>
                            </div>
                          );
                        }
                        if (hasEmailSet) {
                          return (
                            <button
                              onClick={() => { analytics.alertCtaClicked(product.id, product.name, "wishlist"); setAlertModalProduct(product); }}
                              className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-slate-400 hover:text-[#FF9900] transition-colors"
                            >
                              <Bell className="w-3 h-3" />
                              Aktiviraj alert
                            </button>
                          );
                        }
                        return null;
                      })()}
                    </div>

                    <div className="flex flex-col items-center gap-1.5 shrink-0">
                      <Link
                        href={product.id ? productUrl(product) : "/"}
                        onClick={() => dispatch(closeWishlist())}
                        className="p-1.5 rounded-lg bg-[#131921] hover:bg-[#243860] text-white transition-colors"
                        aria-label="Pogledaj detalje"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                      <a
                        href={product.id ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/${product.id}/buy` : "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => analytics.outboundClick(product.id, product.name, product.storeName ?? "")}
                        className="p-1.5 rounded-lg bg-[#FF9900] hover:bg-[#e68a00] text-white transition-colors"
                        aria-label="Kupi"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => dispatch(removeFromWishlist(product.id))}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                        aria-label="Ukloni"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        {mounted && items.length > 0 && (
          <div className="shrink-0 border-t border-slate-100">
            {/* Row 1: clear + count */}
            <div className="px-4 py-2.5 flex items-center justify-between gap-3">
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 font-medium transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Obriši sve
              </button>
              <span className="text-xs text-slate-400">
                {items.length} {items.length === 1 ? "proizvod" : "proizvoda"}
                {compareIds.length > 0 && (
                  <span className="ml-2 text-[#FF9900] font-semibold">
                    · {compareIds.length} u poređenju
                  </span>
                )}
              </span>
            </div>

            {/* Row 2: cloud sync */}
            <div className="px-4 pb-4">
              {/* Email input — open state */}
              {inputOpen ? (
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                    {syncEmail ? "Promeni email" : "Sačuvaj listu na email"}
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={inputValue}
                      onChange={(e) => { setInputValue(e.target.value); setSaveError(""); }}
                      onKeyDown={(e) => e.key === "Enter" && handleSave()}
                      placeholder={syncEmail ?? "tvoj@email.com"}
                      autoFocus
                      className={`flex-1 min-w-0 px-3 py-2 rounded-lg text-sm border-2 outline-none bg-white text-slate-800 placeholder:text-slate-400 transition-colors ${
                        saveError ? "border-red-400" : "border-slate-200 focus:border-[#FF9900]"
                      }`}
                    />
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="shrink-0 px-3 py-2 bg-[#1B2B4B] hover:bg-[#243860] disabled:opacity-50 text-white text-xs font-black rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Sačuvaj"}
                    </button>
                    <button
                      onClick={() => { setInputOpen(false); setSaveError(""); setInputValue(""); }}
                      className="p-2 rounded-lg hover:bg-slate-200 text-slate-400 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {saveError && <p className="text-xs text-red-500 mt-1.5 font-medium">{saveError}</p>}
                  {syncEmail && (
                    <button
                      onClick={handleDisconnect}
                      className="mt-2 text-[10px] text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                    >
                      <CloudOff className="w-3 h-3" />
                      Ukloni sinhronizaciju
                    </button>
                  )}
                </div>
              ) : syncEmail ? (
                /* Saved state */
                <div className="flex items-center justify-between gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    {justSaved
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      : <Cloud className="w-4 h-4 text-emerald-500 shrink-0" />
                    }
                    <div className="min-w-0">
                      <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest leading-none">
                        {justSaved ? "Sačuvano!" : "Sinhronizovano"}
                      </p>
                      <p className="text-xs text-emerald-600 truncate mt-0.5">{syncEmail}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setInputValue(syncEmail); setInputOpen(true); }}
                    className="shrink-0 text-[10px] text-emerald-600 hover:text-emerald-800 font-semibold transition-colors"
                  >
                    Promeni
                  </button>
                </div>
              ) : (
                /* Not saved — CTA */
                <button
                  onClick={() => setInputOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-slate-200 hover:border-[#FF9900] hover:bg-[#FFF8EC] text-slate-400 hover:text-[#b36b00] text-xs font-semibold transition-all"
                >
                  <Cloud className="w-4 h-4" />
                  Sačuvaj listu na email
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      {alertModalProduct && (
        <PriceAlertModal
          product={alertModalProduct}
          initialAlert={getAlert(alertModalProduct.id)}
          onClose={(changed) => {
            setAlertModalProduct(null);
            if (changed) refreshAlerts();
          }}
        />
      )}
    </>
  );
}
