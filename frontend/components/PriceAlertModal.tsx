"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { X, Bell, Check, Loader2, BellOff } from "lucide-react";
import { createAlert, deleteAlert, getAlert, AlertEntry } from "@/lib/alerts";
import {
  getWishlistEmail,
  setWishlistEmail,
  pushWishlistToBackend,
} from "@/lib/wishlistSync";
import { addToWishlist, removeFromWishlist } from "@/store/wishlistSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { analytics } from "@/lib/analytics";
import { CURRENT_MARKET, MARKET_CONFIG } from "@/lib/marketConfig";

const { locale: MARKET_LOCALE, currency: MARKET_CURRENCY } = MARKET_CONFIG[CURRENT_MARKET];
const IS_HR = CURRENT_MARKET === "hr";

export interface AlertableProduct {
  id: number;
  name: string;
  price: string;
  numericPrice?: number | null;
  imageUrl?: string | null;
}

interface Props {
  product: AlertableProduct;
  /** Existing alert entry — if provided, modal opens in edit mode */
  initialAlert?: AlertEntry;
  onClose: (changed: boolean) => void;
}

type Phase = "form" | "loading" | "success" | "error";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function formatPrice(n: number) {
  return new Intl.NumberFormat(MARKET_LOCALE).format(Math.round(n));
}

function parseInputPrice(raw: string): number | null {
  const cleaned = raw.replace(/\./g, "").replace(",", ".").replace(/[^\d.]/g, "");
  const n = parseFloat(cleaned);
  return !isNaN(n) && n > 0 ? n : null;
}

export default function PriceAlertModal({ product, initialAlert, onClose }: Props) {
  const dispatch = useAppDispatch();
  const wishlistItems = useAppSelector((s: any) => s.wishlist.items) as any[];

  const isEditMode = initialAlert !== undefined;

  // Time-to-create measurement: records when the modal first renders
  const openedAt = useRef(Date.now());

  const [phase, setPhase] = useState<Phase>("form");
  const [email, setEmail] = useState(() => getWishlistEmail() ?? "");
  const [emailError, setEmailError] = useState("");
  const [useTargetPrice, setUseTargetPrice] = useState(
    isEditMode && initialAlert?.targetPrice !== undefined,
  );
  const [targetInput, setTargetInput] = useState(
    isEditMode && initialAlert?.targetPrice
      ? String(Math.round(initialAlert.targetPrice))
      : "",
  );
  const [targetError, setTargetError] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);
  const targetRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    analytics.alertModalOpened(product.id, product.name);
    const timer = setTimeout(() => emailRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, [product.id, product.name]);

  useEffect(() => {
    if (useTargetPrice) setTimeout(() => targetRef.current?.focus(), 50);
  }, [useTargetPrice]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Lock scroll on mount
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Auto-close success state after 3 s
  useEffect(() => {
    if (phase !== "success") return;
    const t = setTimeout(() => onClose(true), 3000);
    return () => clearTimeout(t);
  }, [phase, onClose]);

  const validate = (): boolean => {
    let ok = true;
    if (!EMAIL_RE.test(email)) {
      setEmailError("Unesi ispravan email.");
      ok = false;
    } else {
      setEmailError("");
    }
    if (useTargetPrice) {
      const p = parseInputPrice(targetInput);
      if (!p) {
        setTargetError("Unesi ispravnu cenu (npr. 2500).");
        ok = false;
      } else {
        setTargetError("");
      }
    }
    return ok;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setPhase("loading");
    setErrorMsg("");

    const normalizedEmail = email.toLowerCase().trim();
    const targetPrice = useTargetPrice ? parseInputPrice(targetInput) ?? undefined : undefined;

    try {
      await createAlert(normalizedEmail, product.id, targetPrice);

      // Persist email for future sessions
      setWishlistEmail(normalizedEmail);

      // Add to Redux wishlist so the item appears in the drawer
      dispatch(addToWishlist(product as any));

      // Sync the full wishlist to backend under this email
      const allIds = new Set([...wishlistItems.map((p: any) => p.id), product.id]);
      await pushWishlistToBackend(normalizedEmail, Array.from(allIds));

      if (!isEditMode && newsletterOptIn) {
        fetch("/api/newsletter/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: normalizedEmail, source: "alert_crosssell" }),
        }).then(() => {
          try { localStorage.setItem("newsletter_subscribed", "1"); } catch { /* ignore */ }
        }).catch(() => {});
      }

      const elapsed = Date.now() - openedAt.current;

      if (isEditMode) {
        analytics.alertUpdated(product.id);
      } else {
        analytics.alertCreated(product.id, product.name, !!targetPrice, elapsed);
      }

      setPhase("success");
    } catch (err) {
      const reason = err instanceof Error ? err.message : "unknown";
      analytics.alertFailed(product.id, product.name, reason);
      setErrorMsg("Trenutno ne možemo aktivirati alert. Pokušaj ponovo.");
      setPhase("error");
    }
  };

  const handleDelete = async () => {
    const savedEmail = getWishlistEmail();
    if (!savedEmail) return;
    setPhase("loading");
    try {
      await deleteAlert(savedEmail, product.id);
      dispatch(removeFromWishlist(product.id));
      analytics.alertDeleted(product.id);
      onClose(true);
    } catch {
      setErrorMsg("Greška pri brisanju. Pokušaj ponovo.");
      setPhase("error");
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[200] transition-opacity"
        onClick={() => onClose(false)}
      />

      {/* Panel: bottom-sheet on mobile, centered on sm+ */}
      <div className="fixed inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center z-[201]">
        <div className="w-full sm:max-w-sm bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden">

          {/* ── Success ─────────────────────────────────────────────── */}
          {phase === "success" && (
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-emerald-600" strokeWidth={2.5} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Alert aktiviran!</h3>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                Poslaćemo email na <span className="font-semibold text-slate-700">{email}</span> čim
                {IS_HR ? "cijena" : "cena"} {useTargetPrice ? `padne ispod ${formatPrice(parseInputPrice(targetInput) ?? 0)} ${MARKET_CURRENCY}` : "značajno padne"}.
              </p>
              <button
                onClick={() => onClose(true)}
                className="w-full py-3 bg-[#1B2B4B] text-white font-bold rounded-xl hover:bg-[#243860] transition-colors"
              >
                Odlično!
              </button>
            </div>
          )}

          {/* ── Form ────────────────────────────────────────────────── */}
          {phase !== "success" && (
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#FFF3DC] flex items-center justify-center">
                    <Bell className="w-4 h-4 text-[#FF9900]" />
                  </div>
                  <span className="font-bold text-slate-900 text-sm">
                    {isEditMode ? "Izmeni alert" : "Prati cenu"}
                  </span>
                </div>
                <button
                  onClick={() => onClose(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="px-5 py-4 space-y-4">
                {/* Product preview */}
                <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                  {product.imageUrl && (
                    <div className="w-12 h-12 rounded-lg bg-white border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        width={48}
                        height={48}
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate leading-tight">{product.name}</p>
                    <p className="text-base font-black text-slate-900 mt-0.5">{formatPrice(product.numericPrice ?? 0)} {MARKET_CURRENCY}</p>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Email za obaveštenje
                  </label>
                  <input
                    ref={emailRef}
                    type="email"
                    inputMode="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    placeholder="tvoj@email.com"
                    autoComplete="email"
                    className={`w-full px-3 py-2.5 rounded-xl text-sm border-2 outline-none transition-colors bg-white text-slate-900 placeholder:text-slate-400 ${
                      emailError ? "border-red-400" : "border-slate-200 focus:border-[#FF9900]"
                    }`}
                  />
                  {emailError && (
                    <p className="text-xs text-red-500 mt-1 font-medium">{emailError}</p>
                  )}
                </div>

                {/* Optional target price */}
                <div>
                  <label className="flex items-start gap-2.5 cursor-pointer group select-none">
                    <div className="relative mt-0.5 shrink-0">
                      <input
                        type="checkbox"
                        checked={useTargetPrice}
                        onChange={(e) => { setUseTargetPrice(e.target.checked); setTargetError(""); }}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded border-2 transition-colors flex items-center justify-center ${
                        useTargetPrice ? "bg-[#FF9900] border-[#FF9900]" : "border-slate-300 group-hover:border-[#FF9900]"
                      }`}>
                        {useTargetPrice && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                      </div>
                    </div>
                    <span className="text-sm text-slate-600 leading-snug">
                      {IS_HR
                        ? "Obavijesti me samo kada cijena padne ispod određene vrijednosti"
                        : "Obavesti me samo kada cena padne ispod određene vrednosti"}
                    </span>
                  </label>

                  {useTargetPrice && (
                    <div className="mt-2.5 ml-6">
                      <div className="flex items-center gap-2">
                        <input
                          ref={targetRef}
                          type="text"
                          inputMode="numeric"
                          value={targetInput}
                          onChange={(e) => { setTargetInput(e.target.value); setTargetError(""); }}
                          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                          placeholder="npr. 2500"
                          className={`w-32 px-3 py-2 rounded-lg text-sm border-2 outline-none transition-colors bg-white text-slate-900 placeholder:text-slate-400 ${
                            targetError ? "border-red-400" : "border-slate-200 focus:border-[#FF9900]"
                          }`}
                        />
                        <span className="text-sm font-semibold text-slate-500">{MARKET_CURRENCY}</span>
                      </div>
                      {targetError && (
                        <p className="text-xs text-red-500 mt-1 font-medium">{targetError}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Newsletter cross-sell */}
                {!isEditMode && (
                  <label className="flex items-start gap-2.5 cursor-pointer group select-none">
                    <div className="relative mt-0.5 shrink-0">
                      <input
                        type="checkbox"
                        checked={newsletterOptIn}
                        onChange={(e) => setNewsletterOptIn(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded border-2 transition-colors flex items-center justify-center ${
                        newsletterOptIn ? "bg-[#FF9900] border-[#FF9900]" : "border-slate-300 group-hover:border-[#FF9900]"
                      }`}>
                        {newsletterOptIn && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                      </div>
                    </div>
                    <span className="text-sm text-slate-600 leading-snug">
                      {IS_HR
                        ? "Želim i dvotjedni pregled najvećih ušteda na email"
                        : "Želim i dvonedeljni pregled najvećih ušteda na email"}
                    </span>
                  </label>
                )}

                {/* API error */}
                {phase === "error" && errorMsg && (
                  <p className="text-sm text-red-500 font-medium">{errorMsg}</p>
                )}
              </div>

              {/* Footer */}
              <div className="px-5 pb-6 space-y-2">
                <button
                  onClick={handleSubmit}
                  disabled={phase === "loading"}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#FF9900] hover:bg-[#e68a00] disabled:opacity-60 text-[#131921] font-bold text-sm rounded-xl transition-colors shadow-lg shadow-orange-200"
                >
                  {phase === "loading" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Bell className="w-4 h-4" />
                      {isEditMode
                        ? (IS_HR ? "Spremi izmjene" : "Sačuvaj izmene")
                        : (IS_HR ? "Obavijesti me" : "Obavesti me")}
                    </>
                  )}
                </button>

                {isEditMode && phase !== "loading" && (
                  <button
                    onClick={handleDelete}
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <BellOff className="w-3.5 h-3.5" />
                    Ukloni alert
                  </button>
                )}

                <p className="text-center text-[11px] text-slate-400 pt-1">
                  Bez registracije · Jedan klik za odjavu
                </p>
              </div>
            </>
          )}

        </div>
      </div>
    </>
  );
}
