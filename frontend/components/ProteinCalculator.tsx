"use client";

import { useState } from "react";
import { CURRENT_MARKET } from "@/lib/marketConfig";

const IS_HR = CURRENT_MARKET === "hr";

const GOALS = [
  { id: "recreational", label: "Rekreativac (3×/ned.)", lo: 1.2, hi: 1.6 },
  { id: "active",       label: "Aktivan (5×/ned.)",    lo: 1.6, hi: 2.0 },
  { id: "muscle",       label: "Izgradnja mišića",      lo: 1.8, hi: 2.2 },
  { id: "cut",          label: "Mršavljenje + trening", lo: 2.0, hi: 2.4 },
  { id: "senior",       label: "50+ godina",            lo: 1.8, hi: 2.0 },
  { id: "sedentary",    label: "Sedentaran",            lo: 0.8, hi: 0.8 },
];

const FOOD_ESTIMATE = 100; // grams of protein from 3 average meals

export default function ProteinCalculator() {
  const [weight, setWeight] = useState(80);
  const [goalId, setGoalId] = useState("muscle");

  const goal = GOALS.find(g => g.id === goalId)!;
  const low  = Math.round(weight * goal.lo);
  const high = goalId === "sedentary" ? low : Math.round(weight * goal.hi);
  const target = Math.round((low + high) / 2);

  const fromFood   = Math.min(target, FOOD_ESTIMATE);
  const fromShakes = Math.max(0, target - fromFood);
  const shakes     = Math.ceil(fromShakes / 30);

  return (
    <div className="bg-white rounded-2xl border-2 border-[#FF9900]/30 shadow-sm p-5 mb-2">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-xl" aria-hidden>🧮</span>
        <h3 className="font-bold text-slate-900 text-[17px]">Kalkulator dnevnog unosa proteina</h3>
      </div>

      {/* Weight slider */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-slate-700">Telesna masa</label>
          <span className="text-xl font-extrabold text-[#FF9900]">{weight} kg</span>
        </div>
        <input
          type="range"
          min={40}
          max={140}
          step={1}
          value={weight}
          onChange={e => setWeight(Number(e.target.value))}
          className="w-full accent-[#FF9900] h-2 cursor-pointer"
          aria-label="Telesna masa u kilogramima"
        />
        <div className="flex justify-between text-xs text-slate-400 mt-1 select-none">
          <span>40 kg</span>
          <span>140 kg</span>
        </div>
      </div>

      {/* Goal selection */}
      <div className="mb-5">
        <label className="text-sm font-semibold text-slate-700 block mb-2">Tvoj cilj</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {GOALS.map(g => (
            <button
              key={g.id}
              type="button"
              onClick={() => setGoalId(g.id)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors text-left leading-tight ${
                goalId === g.id
                  ? "bg-[#FF9900] border-[#FF9900] text-[#131921]"
                  : "bg-slate-50 border-slate-200 text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900]"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* Result */}
      <div className="bg-slate-50 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-slate-600">Preporučen dnevni unos</span>
          <span className="text-2xl font-extrabold text-slate-900">
            {goalId === "sedentary" ? low : `${low}–${high}`}
            <span className="text-base font-normal text-slate-400"> g</span>
          </span>
        </div>

        <div className="border-t border-slate-200 pt-3 space-y-2.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">{IS_HR ? "Iz hrane (procjena 3 obroka)" : "Iz hrane (procena 3 obroka)"}</span>
            <span className="font-semibold text-slate-700">~{fromFood} g</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Potrebno iz suplementa</span>
            <span className="font-semibold text-slate-700">~{fromShakes} g</span>
          </div>

          {shakes > 0 ? (
            <div className="flex items-center justify-between bg-[#FFF8EC] rounded-lg px-3 py-2.5">
              <span className="text-sm font-medium text-slate-800">Šejkova dnevno (30g/porcija)</span>
              <span className="text-xl font-extrabold text-[#FF9900]">{shakes}</span>
            </div>
          ) : (
            <div className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2.5 font-medium">
              Iz hrane pokrivaš ciljani unos ✓
            </div>
          )}
        </div>
      </div>

      <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
        {IS_HR
          ? `Procjena polazi od ~${FOOD_ESTIMATE}g proteina iz hrane (npr. jaja + piletina + mliječni proizvodi). Ako jedeš manje mesa, povećaj broj shakeva za 1.`
          : `Procena polazi od ~${FOOD_ESTIMATE}g proteina iz hrane (npr. jaja + piletina + mlečni proizvodi). Ako jedeš manje mesa, povećaj broj šejkova za 1.`}
      </p>
    </div>
  );
}
