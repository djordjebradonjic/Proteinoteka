"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { productUrl } from "@/lib/productUrl";
import { Product } from "@/types/product";

const API = process.env.NEXT_PUBLIC_API_URL ?? "";
const MARKET = process.env.NEXT_PUBLIC_MARKET ?? "rs";
const IS_HR = MARKET === "hr";

type ActivityLevel = "sedentarni" | "umjeren" | "aktivan" | "veoma_aktivan";
type Goal = "mrsavljenje" | "odrzavanje" | "masa";

const PROTEIN_TABLE: Record<ActivityLevel, Record<Goal, number>> = {
  sedentarni:    { mrsavljenje: 1.8, odrzavanje: 1.2, masa: 1.6 },
  umjeren:       { mrsavljenje: 2.0, odrzavanje: 1.4, masa: 1.8 },
  aktivan:       { mrsavljenje: 2.2, odrzavanje: 1.6, masa: 2.0 },
  veoma_aktivan: { mrsavljenje: 2.4, odrzavanje: 1.8, masa: 2.2 },
};

const ACTIVITY_LABELS: Record<ActivityLevel, string> = IS_HR
  ? {
      sedentarni:    "Sjedilački (desk posao, bez treninga)",
      umjeren:       "Umjeren (trening 2–3×/tjedno)",
      aktivan:       "Aktivan (trening 4–5×/tjedno)",
      veoma_aktivan: "Veoma aktivan (sport 6×+ ili fizički posao)",
    }
  : {
      sedentarni:    "Sedentarni (desk posao, bez treninga)",
      umjeren:       "Umjeren (trening 2–3×/nedeljno)",
      aktivan:       "Aktivan (trening 4–5×/nedeljno)",
      veoma_aktivan: "Veoma aktivan (sport 6×+ ili fizički posao)",
    };

const GOAL_LABELS: Record<Goal, string> = {
  mrsavljenje: IS_HR ? "Mršavljenje / definicija" : "Mršavljenje / definicija",
  odrzavanje:  "Održavanje forme",
  masa:        "Povećanje mišićne mase",
};

interface CalcResult {
  dailyG: number;
  servingsPerDay: number;
  products: Product[];
}

function ppg(p: Product): number {
  if (!p.proteinPer100g || !p.primaryWeightGrams || p.numericPrice <= 0) return Infinity;
  return p.numericPrice / ((p.proteinPer100g / 100) * p.primaryWeightGrams);
}

function monthlyCost(p: Product, dailyG: number): number {
  if (!p.proteinPer100g || !p.primaryWeightGrams || p.numericPrice <= 0) return Infinity;
  const proteinPerPack = (p.proteinPer100g / 100) * p.primaryWeightGrams;
  const packsPerMonth = (dailyG * 30) / proteinPerPack;
  return p.numericPrice * packsPerMonth;
}

export function ProteinCalculator() {
  const [weight, setWeight] = useState<number | "">(75);
  const [activity, setActivity] = useState<ActivityLevel>("umjeren");
  const [goal, setGoal] = useState<Goal>("masa");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CalcResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function calculate() {
    if (!weight || weight < 30 || weight > 250) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const dailyG = Math.round(weight * PROTEIN_TABLE[activity][goal]);

    try {
      const url = new URL(`${API}/api/v1/products`);
      url.searchParams.set("size", "30");
      url.searchParams.set("sort", "valueScore,desc");
      url.searchParams.set("page", "0");
      url.searchParams.set("market", MARKET);

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      const all: Product[] = data.content ?? [];

      const ranked = all
        .filter(p => ppg(p) < Infinity)
        .sort((a, b) => ppg(a) - ppg(b))
        .slice(0, 5);

      setResult({
        dailyG,
        servingsPerDay: +(dailyG / 25).toFixed(1),
        products: ranked,
      });
    } catch {
      setError(IS_HR
        ? "Nije moguće dohvatiti trenutnu ponudu. Pokušaj ponovo za koji trenutak."
        : "Nije moguće dohvatiti trenutnu ponudu. Pokušaj ponovo za koji trenutak."
      );
    } finally {
      setLoading(false);
    }
  }

  const cur = IS_HR ? "€" : "RSD";

  return (
    <div className="space-y-6">
      {/* Form */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
        {/* Weight */}
        <div>
          <label className="block text-sm font-semibold text-slate-800 mb-2">
            {IS_HR ? "Tjelesna masa (kg)" : "Telesna masa (kg)"}
          </label>
          <input
            type="number"
            min={30}
            max={250}
            value={weight}
            onChange={e => setWeight(e.target.value === "" ? "" : Number(e.target.value))}
            className="w-full sm:w-40 border border-slate-300 rounded-lg px-3 py-2 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF9900] focus:border-transparent"
            placeholder="75"
          />
        </div>

        {/* Activity */}
        <div>
          <label className="block text-sm font-semibold text-slate-800 mb-2">Nivo aktivnosti</label>
          <div className="space-y-2">
            {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map(a => (
              <label key={a} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="activity"
                  value={a}
                  checked={activity === a}
                  onChange={() => setActivity(a)}
                  className="w-4 h-4 accent-[#FF9900]"
                />
                <span className={`text-sm ${activity === a ? "text-slate-900 font-semibold" : "text-slate-600 group-hover:text-slate-800"}`}>
                  {ACTIVITY_LABELS[a]}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Goal */}
        <div>
          <label className="block text-sm font-semibold text-slate-800 mb-2">Cilj</label>
          <div className="space-y-2">
            {(Object.keys(GOAL_LABELS) as Goal[]).map(g => (
              <label key={g} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="goal"
                  value={g}
                  checked={goal === g}
                  onChange={() => setGoal(g)}
                  className="w-4 h-4 accent-[#FF9900]"
                />
                <span className={`text-sm ${goal === g ? "text-slate-900 font-semibold" : "text-slate-600 group-hover:text-slate-800"}`}>
                  {GOAL_LABELS[g]}
                </span>
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={calculate}
          disabled={loading || !weight || Number(weight) < 30}
          className="w-full sm:w-auto px-6 py-3 bg-[#FF9900] hover:bg-[#e68a00] disabled:bg-slate-200 disabled:text-slate-400 text-[#131921] font-bold rounded-xl transition-colors text-sm"
        >
          {loading ? "Računam..." : IS_HR ? "Izračunaj" : "Izračunaj"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-5">
          {/* Summary box */}
          <div className="bg-[#131921] text-white rounded-xl p-6">
            <p className="text-slate-400 text-xs uppercase tracking-wide font-semibold mb-3">
              {IS_HR ? "Tvoja dnevna ciljana količina" : "Tvoja dnevna ciljna količina"}
            </p>
            <p className="text-4xl font-extrabold text-[#FF9900] mb-1">{result.dailyG}g</p>
            <p className="text-slate-300 text-sm">
              {IS_HR
                ? `proteina dnevno — otprilike ${result.servingsPerDay} × 25g mjerna šalica`
                : `proteina dnevno — otprilike ${result.servingsPerDay} × 25g merna šalica`
              }
            </p>
            <p className="text-slate-500 text-xs mt-3">
              {IS_HR
                ? `Za ${weight}kg i ${ACTIVITY_LABELS[activity].toLowerCase()} nivo aktivnosti, cilj mišićne sinteze zahtijeva ${PROTEIN_TABLE[activity][goal]}g/kg.`
                : `Za ${weight}kg i ${ACTIVITY_LABELS[activity].toLowerCase()} nivo aktivnosti, cilj mišićne sinteze zahteva ${PROTEIN_TABLE[activity][goal]}g/kg.`
              }
            </p>
          </div>

          {/* Product recommendations */}
          {result.products.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900">
                  {IS_HR
                    ? "Najjeftiniji način da pokriješ cilj — trenutna ponuda"
                    : "Najjeftiniji način da pokriješ cilj — trenutna ponuda"
                  }
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {IS_HR
                    ? "Sortirano po cijeni po gramu proteina — manje je bolje"
                    : "Sortirano po ceni po gramu proteina — manje je bolje"
                  }
                </p>
              </div>
              <div className="divide-y divide-slate-100">
                {result.products.map((p, i) => {
                  const monthly = monthlyCost(p, result.dailyG);
                  const perGram = ppg(p);
                  return (
                    <div key={p.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
                      <span className="text-slate-400 text-xs font-bold w-5 text-center shrink-0">
                        {i + 1}
                      </span>
                      {p.imageUrl && (
                        <div className="w-10 h-10 shrink-0 bg-white rounded border border-slate-100 flex items-center justify-center overflow-hidden">
                          <Image
                            src={p.imageUrl}
                            alt={p.name}
                            width={40}
                            height={40}
                            className="object-contain w-full h-full"
                            referrerPolicy="no-referrer"
                            unoptimized
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <Link
                          href={productUrl(p)}
                          className="text-sm font-semibold text-slate-900 hover:text-[#FF9900] line-clamp-1"
                        >
                          {p.name}
                        </Link>
                        <p className="text-xs text-slate-500">{p.storeName} · {p.price}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-slate-900">
                          ~{Math.round(monthly).toLocaleString("sr-RS")} {cur}
                          <span className="text-xs font-normal text-slate-500">/mes.</span>
                        </p>
                        <p className="text-xs text-slate-400">
                          {perGram.toFixed(IS_HR ? 3 : 2)} {cur}/g prot.
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-400">
                {IS_HR
                  ? "Mesečni trošak je procjena temeljena na tome da jedino ovaj protein pokriva dnevni cilj. Tečaj za prikaz."
                  : "Mesečni trošak je procena zasnovana na tome da jedino ovaj protein pokriva dnevni cilj."
                }
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
