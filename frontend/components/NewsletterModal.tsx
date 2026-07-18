"use client";

import { useEffect, useRef, useState } from "react";
import { X, Mail, Check, Loader2 } from "lucide-react";
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
        className={`fixed inset-0 bg-black/50 z-[200] transition-opacity motion-reduce:transition-none ${
          visible ? "opacity-100 duration-200" : "opacity-0 duration-150"
        }`}
        onClick={requestClose}
      />

      <div className="fixed inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center z-[201] pointer-events-none">
        <div
          className={`w-full sm:max-w-sm bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden pointer-events-auto transition-all motion-reduce:transition-none motion-reduce:transform-none ${
            visible
              ? "translate-y-0 sm:scale-100 opacity-100 duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
              : "translate-y-full sm:translate-y-0 sm:scale-95 opacity-0 duration-150 ease-in"
          }`}
        >

          {phase === "success" && (
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-emerald-600" strokeWidth={2.5} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Prijavljen si!</h3>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                Poslaćemo email na <span className="font-semibold text-slate-700">{email}</span> dva puta mesečno sa proizvodima čija je cena pala i do 20%.
              </p>
              <button
                onClick={requestClose}
                className="w-full py-3 bg-[#1B2B4B] text-white font-bold rounded-xl hover:bg-[#243860] transition-colors"
              >
                Odlično!
              </button>
            </div>
          )}

          {phase !== "success" && (
            <>
              <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#FFF3DC] flex items-center justify-center">
                    <Mail className="w-4 h-4 text-[#FF9900]" />
                  </div>
                  <span className="font-bold text-slate-900 text-sm">Uštedi do 20%</span>
                </div>
                <button
                  onClick={requestClose}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="px-5 py-4 space-y-4">
                <p className="text-sm text-slate-600 leading-relaxed">
                  {IS_HR
                    ? "Dva puta mjesečno šaljemo ti popis proizvoda čija je cijena pala i do 20%. Bez pretraživanja po stranicama — mi pratimo, ti samo klikneš i uštediš."
                    : "Dva puta mesečno šaljemo ti listu proizvoda čija je cena pala i do 20%. Bez pretrage po sajtovima — mi pratimo, ti samo klikneš i uštediš."}
                </p>

                <div>
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

                <div>
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(e) => { setConsent(e.target.checked); setConsentError(""); }}
                      className="mt-0.5 shrink-0"
                    />
                    <span className="text-xs text-slate-500 leading-snug">
                      {IS_HR
                        ? "Slažem se da primam newsletter s najvećim uštedama. Odjava u jednom kliku."
                        : "Slažem se da primam newsletter sa najvećim uštedama. Odjava u jednom kliku."}
                    </span>
                  </label>
                  {consentError && (
                    <p className="text-xs text-red-500 mt-1 font-medium">{consentError}</p>
                  )}
                </div>

                {phase === "error" && errorMsg && (
                  <p className="text-sm text-red-500 font-medium">{errorMsg}</p>
                )}
              </div>

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
                      <Mail className="w-4 h-4" />
                      Prijavi se
                    </>
                  )}
                </button>
                <p className="text-center text-[11px] text-slate-400 pt-1">
                  Bez spama · Jedan klik za odjavu
                </p>
              </div>
            </>
          )}

        </div>
      </div>
    </>
  );
}
