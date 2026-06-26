"use client";

import { useState } from "react";
import { Send, CheckCircle, AlertCircle, Mail, Clock } from "lucide-react";
import { CURRENT_MARKET } from "@/lib/marketConfig";

const IS_HR = CURRENT_MARKET === "hr";

function KontaktForma() {
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
      setErrorMsg("Greška pri slanju poruke. Pokušaj ponovo.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <CheckCircle className="w-10 h-10 text-green-500 mb-3" />
        <h3 className="text-base font-bold text-slate-800 mb-1">
          Poruka poslata!
        </h3>
        <p className="text-slate-500 text-xs mb-4">{IS_HR ? "Odgovorit ćemo vam što prije." : "Odgovorićemo ti što pre."}</p>
        <button
          onClick={() => setStatus("idle")}
          className="px-4 py-1.5 bg-[#FF9900] hover:bg-[#e68a00] text-[#131921] font-semibold rounded-lg text-xs transition-colors"
        >
          {IS_HR ? "Pošaljite novu poruku" : "Pošalji novu poruku"}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Ime i prezime
          </label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            placeholder="Marko Marković"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-[#FF9900] focus:border-transparent transition-all placeholder:text-slate-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Email adresa
          </label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            placeholder="marko@email.com"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-[#FF9900] focus:border-transparent transition-all placeholder:text-slate-400"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">
          Poruka
        </label>
        <textarea
          name="message"
          value={form.message}
          onChange={handleChange}
          required
          rows={4}
          placeholder={IS_HR ? "Napišite svoju poruku ovdje..." : "Napiši svoju poruku ovde..."}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-[#FF9900] focus:border-transparent transition-all placeholder:text-slate-400 resize-none"
        />
      </div>
      {status === "error" && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg text-xs">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {errorMsg}
        </div>
      )}
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full py-2.5 bg-[#FF9900] hover:bg-[#e68a00] disabled:opacity-60 disabled:cursor-not-allowed text-[#131921] font-bold rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
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
            Slanje...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            {IS_HR ? "Pošaljite poruku" : "Pošalji poruku"}
          </>
        )}
      </button>
    </form>
  );
}

export default function KontaktSekcija() {
  return (
    <section id="kontakt" className="bg-[#f8f9fa] py-10 px-4 mt-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black text-[#131921] mb-1">Kontakt</h2>
          <p className="text-slate-500 text-xs">
            {IS_HR ? "Pitanje, prijedlog ili prijava greške? Pišite nam." : "Pitanje, sugestija ili prijava greške? Piši nam."}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Info traka */}
          <div className="grid grid-cols-2 sm:grid-cols-2 border-b border-slate-100">
            <div className="flex items-center gap-2 px-4 py-3 border-r border-slate-100">
              <Mail className="w-4 h-4 text-[#FF9900] shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400 leading-none mb-0.5">
                  Email
                </p>
                <p className="text-xs font-medium text-slate-700">
                  kontakt@proteinoteka.rs
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-3">
              <Clock className="w-4 h-4 text-[#FF9900] shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400 leading-none mb-0.5">
                  Vreme odgovora
                </p>
                <p className="text-xs font-medium text-slate-700">Unutar 24h</p>
              </div>
            </div>
          </div>

          {/* Forma */}
          <div className="p-5">
            <KontaktForma />
          </div>
        </div>
      </div>
    </section>
  );
}
