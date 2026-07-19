"use client";

import { useEffect, useRef, useState } from "react";
import { X, Mail, Check, Loader2, TrendingDown } from "lucide-react";
import { CURRENT_MARKET } from "@/lib/marketConfig";
import type { NewsletterSource } from "@/components/NewsletterInlineForm";

const IS_HR = CURRENT_MARKET === "hr";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Phase = "form" | "loading" | "success" | "error";

const EXIT_MS = 150;

interface Props {
  source: Extract<NewsletterSource, "modal_scroll" | "modal_exit_intent">;
  onClose: () => void;
  onSubscribed: () => void;
}

export default function NewsletterModal({ source, onClose, onSubscribed }: Props) {
  const [phase, setPhase] = useState<Phase>("form");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [entered, setEntered] = useState(false);
  const [closing, setClosing] = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);
  const closingRef = useRef(false);

  const requestClose = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    setTimeout(onClose, EXIT_MS);
  };

  useEffect(() => {
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Auto-focus only on desktop — on mobile this pops the keyboard open
  // immediately on an unprompted popup, which feels jarring.
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const timer = setTimeout(() => emailRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") requestClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    if (phase !== "success") return;
    const t = setTimeout(() => requestClose(), 3000);
    return () => clearTimeout(t);
  }, [phase]);

  const validate = (): boolean => {
    let ok = true;
    if (!EMAIL_RE.test(email)) {
      setEmailError("Unesi ispravan email.");
      ok = false;
    } else {
      setEmailError("");
    }
    if (!consent) {
      setConsentError("Potrebna je saglasnost.");
      ok = false;
    } else {
      setConsentError("");
    }
    return ok;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setPhase("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim(), source }),
      });
      if (!res.ok) throw new Error("failed");
      setPhase("success");
      onSubscribed();
    } catch {
      setErrorMsg(IS_HR ? "Trenutno ne možemo da te prijavimo. Pokušaj ponovo." : "Trenutno ne možemo da te prijavimo. Pokušaj ponovo.");
      setPhase("error");
    }
  };

  const visible = entered && !closing;

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/60 z-[200] transition-opacity motion-reduce:transition-none ${
          visible ? "opacity-100 duration-200" : "opacity-0 duration-150"
        }`}
        onClick={requestClose}
      />

      <div className="fixed inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center z-[201] pointer-events-none">
        <div
          className={`relative w-full sm:max-w-sm bg-gradient-to-br from-[#131921] to-[#1B2B4B] rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-black/50 overflow-hidden pointer-events-auto transition-all motion-reduce:transition-none motion-reduce:transform-none ${
            visible
              ? "translate-y-0 sm:scale-100 opacity-100 duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
              : "translate-y-full sm:translate-y-0 sm:scale-95 opacity-0 duration-150 ease-in"
          }`}
        >
          {/* Ambient glow — subtle depth, matches the newsletter section's dark card language */}
          <div className="absolute -top-16 -right-16 w-56 h-56 bg-[#FF9900]/20 rounded-full blur-3xl pointer-events-none" />

          <button
            onClick={requestClose}
            className="absolute top-4 right-4 z-10 p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {phase === "success" ? (
            <div className="relative p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-emerald-400" strokeWidth={2.5} />
              </div>
              <h3 className="text-lg font-black text-white mb-2">Prijavljen si!</h3>
              <p className="text-sm text-white/60 mb-6 leading-relaxed">
                Poslaćemo email na <span className="font-semibold text-white/90">{email}</span> dva puta mesečno sa proizvodima čija je cena pala i do 20%.
              </p>
              <button
                onClick={requestClose}
                className="w-full py-3 bg-[#FF9900] hover:bg-[#e68a00] text-[#131921] font-bold rounded-xl transition-colors"
              >
                Odlično!
              </button>
            </div>
          ) : (
            <div className="relative px-6 pt-8 pb-6 sm:px-7">
              <div className="inline-flex items-center gap-1.5 bg-[#FF9900]/15 border border-[#FF9900]/30 rounded-full px-3 py-1 mb-4">
                <TrendingDown className="w-3.5 h-3.5 text-[#FF9900]" />
                <span className="text-[#FF9900] text-[11px] font-bold uppercase tracking-wide">Ušteda do 20%</span>
              </div>

              <h3 className="text-2xl font-black text-white mb-2 leading-tight">
                {IS_HR
                  ? "Mi pratimo cijene, ti samo štediš"
                  : "Mi pratimo cene, ti samo štediš"}
              </h3>
              <p className="text-sm text-white/60 mb-6 leading-relaxed">
                {IS_HR
                  ? "Dva puta mjesečno šaljemo ti popis proizvoda čija je cijena pala i do 20%. Bez pretraživanja po stranicama."
                  : "Dva puta mesečno šaljemo ti listu proizvoda čija je cena pala i do 20%. Bez pretrage po sajtovima."}
              </p>

              <div className="space-y-4">
                <div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      ref={emailRef}
                      type="email"
                      inputMode="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                      onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                      placeholder="tvoj@email.com"
                      autoComplete="email"
                      className={`w-full pl-9 pr-3 py-2.5 rounded-xl text-sm border-2 outline-none transition-colors bg-white/5 text-white placeholder:text-white/30 ${
                        emailError ? "border-red-400/60" : "border-white/10 focus:border-[#FF9900]"
                      }`}
                    />
                  </div>
                  {emailError && (
                    <p className="text-xs text-red-400 mt-1.5 font-medium">{emailError}</p>
                  )}
                </div>

                <div>
                  <label className="flex items-start gap-2.5 cursor-pointer group select-none">
                    <div className="relative mt-0.5 shrink-0">
                      <input
                        type="checkbox"
                        checked={consent}
                        onChange={(e) => { setConsent(e.target.checked); setConsentError(""); }}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded border-2 transition-colors flex items-center justify-center ${
                        consent ? "bg-[#FF9900] border-[#FF9900]" : "border-white/25 group-hover:border-[#FF9900]/60"
                      }`}>
                        {consent && <Check className="w-2.5 h-2.5 text-[#131921]" strokeWidth={3} />}
                      </div>
                    </div>
                    <span className="text-xs text-white/50 leading-snug">
                      {IS_HR
                        ? "Slažem se da primam newsletter s najvećim uštedama. Odjava u jednom kliku."
                        : "Slažem se da primam newsletter sa najvećim uštedama. Odjava u jednom kliku."}
                    </span>
                  </label>
                  {consentError && (
                    <p className="text-xs text-red-400 mt-1.5 font-medium">{consentError}</p>
                  )}
                </div>

                {phase === "error" && errorMsg && (
                  <p className="text-sm text-red-400 font-medium">{errorMsg}</p>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={phase === "loading"}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#FF9900] hover:bg-[#e68a00] disabled:opacity-60 text-[#131921] font-bold text-sm rounded-xl transition-colors shadow-lg shadow-[#FF9900]/20"
                >
                  {phase === "loading" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      Prijavi se
                    </>
                  )}
                </button>
                <p className="text-center text-[11px] text-white/30">
                  Bez spama · Jedan klik za odjavu
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
