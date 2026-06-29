"use client";

import { useState } from "react";
import {
  Send,
  CheckCircle,
  AlertCircle,
  Mail,
  MapPin,
  Clock,
} from "lucide-react";
import { CURRENT_MARKET } from "@/lib/marketConfig";

const isHR = CURRENT_MARKET === "hr";
const contactEmail = isHR ? "kontakt@proteinoteka.com.hr" : "kontakt@proteinoteka.rs";

export default function KontaktPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Greška pri slanju");
        setStatus("error");
        return;
      }

      setStatus("success");
      setForm({ name: "", email: "", message: "" });
    } catch {
      setErrorMsg(isHR ? "Greška pri slanju poruke. Pokušaj ponovo." : "Greška pri slanju poruke. Pokušaj ponovo.");
      setStatus("error");
    }
  }

  return (
    <main className="min-h-screen bg-[#f8f9fa] py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-[#131921] mb-2">Kontakt</h1>
          <p className="text-slate-500 text-sm">
            {isHR
              ? "Imaš pitanje, prijedlog ili prijavu greške? Piši nam."
              : "Imaš pitanje, sugestiju ili prijavu greške? Piši nam."}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Info kartice */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg bg-[#FF9900]/10 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-[#FF9900]" />
                </div>
                <span className="font-semibold text-sm text-slate-700">
                  Email
                </span>
              </div>
              <p className="text-sm text-slate-500">{contactEmail}</p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg bg-[#FF9900]/10 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-[#FF9900]" />
                </div>
                <span className="font-semibold text-sm text-slate-700">
                  {isHR ? "Vrijeme odgovora" : "Vreme odgovora"}
                </span>
              </div>
              <p className="text-sm text-slate-500">{isHR ? "Obično unutar 24h" : "Obično unutar 24h"}</p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg bg-[#FF9900]/10 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-[#FF9900]" />
                </div>
                <span className="font-semibold text-sm text-slate-700">
                  Lokacija
                </span>
              </div>
              <p className="text-sm text-slate-500">{isHR ? "Hrvatska" : "Srbija"}</p>
            </div>
          </div>

          {/* Forma */}
          <div className="md:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm p-6">
            {isHR ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                <Mail className="w-12 h-12 text-[#FF9900] mb-4" />
                <h2 className="text-xl font-bold text-slate-800 mb-2">Pišite nam direktno</h2>
                <p className="text-slate-500 text-sm mb-6">
                  Za sva pitanja, prijedloge ili prijave grešaka — pišite nam na email. Odgovaramo obično unutar 24 sata.
                </p>
                <a
                  href={`mailto:${contactEmail}`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF9900] hover:bg-[#e68a00] text-[#131921] font-bold rounded-xl text-sm transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  {contactEmail}
                </a>
              </div>
            ) : status === "success" ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                <CheckCircle className="w-14 h-14 text-green-500 mb-4" />
                <h2 className="text-xl font-bold text-slate-800 mb-2">Poruka poslata!</h2>
                <p className="text-slate-500 text-sm mb-6">Hvala na poruci. Odgovorićemo ti što pre.</p>
                <button
                  onClick={() => setStatus("idle")}
                  className="px-5 py-2 bg-[#FF9900] hover:bg-[#e68a00] text-[#131921] font-semibold rounded-lg text-sm transition-colors"
                >
                  Pošalji novu poruku
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {isHR ? "Ime i prezime" : "Ime i prezime"}
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="Marko Marković"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-[#FF9900] focus:border-transparent transition-all placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Email adresa
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="marko@email.com"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-[#FF9900] focus:border-transparent transition-all placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Poruka
                  </label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    placeholder={isHR ? "Napiši svoju poruku ovdje..." : "Napiši svoju poruku ovde..."}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-[#FF9900] focus:border-transparent transition-all placeholder:text-slate-400 resize-none"
                  />
                </div>

                {status === "error" && (
                  <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-lg text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full py-3 bg-[#FF9900] hover:bg-[#e68a00] disabled:opacity-60 disabled:cursor-not-allowed text-[#131921] font-bold rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {status === "loading" ? (
                    <>
                      <svg
                        className="w-4 h-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8H4z"
                        />
                      </svg>
                      {isHR ? "Slanje..." : "Slanje..."}
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      {isHR ? "Pošalji poruku" : "Pošalji poruku"}
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
