"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, ChevronRight, ChevronLeft, Loader2, Check, Calculator } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Gender       = "male" | "female";
type Goal         = "mass" | "muscle" | "maintain" | "fat_loss";
type Activity     = "sedentary" | "light" | "moderate" | "high";
type TrainingFreq = "none" | "1-2" | "3-4" | "5+";
type Diet         = "omnivore" | "vegetarian" | "vegan" | "flexitarian";

interface WizardData {
  name: string;
  gender: Gender | "";
  age: string;
  height: string;
  weight: string;
  goal: Goal | "";
  activity: Activity | "";
  trainingFreq: TrainingFreq | "";
  trainingTypes: string[];
  benefits: string[];
  diet: Diet | "";
}

interface MacroResult {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meals: number;
  proteinPerMeal: number;
}

const INITIAL: WizardData = {
  name: "", gender: "", age: "", height: "", weight: "",
  goal: "", activity: "", trainingFreq: "",
  trainingTypes: [], benefits: [], diet: "",
};

const TOTAL_STEPS = 7;

// ─── Calculation ──────────────────────────────────────────────────────────────

function calculate(d: WizardData): MacroResult {
  const age = +d.age, height = +d.height, weight = +d.weight;
  const bmr = d.gender === "male"
    ? 88.36 + 13.4 * weight + 4.8 * height - 5.7 * age
    : 447.6 + 9.2 * weight + 3.1 * height - 4.3 * age;

  const actMult: Record<string, number> = {
    sedentary: 1.2, light: 1.375, moderate: 1.55, high: 1.725,
  };
  const tdee = bmr * (actMult[d.activity] ?? 1.375);
  const calAdj: Record<string, number> = {
    mass: 350, muscle: 200, maintain: 0, fat_loss: -400,
  };
  const calories = Math.round(tdee + (calAdj[d.goal] ?? 0));
  const protRatio: Record<string, number> = {
    mass: 2.0, muscle: 1.8, maintain: 1.5, fat_loss: 2.2,
  };
  const protein = Math.round(weight * (protRatio[d.goal] ?? 1.8));
  const fat = Math.round((calories * 0.28) / 9);
  const carbs = Math.round(Math.max(calories - protein * 4 - fat * 9, 150) / 4);
  const mealsMap: Record<string, number> = {
    none: 3, "1-2": 3, "3-4": 4, "5+": 5,
  };
  const meals = mealsMap[d.trainingFreq] ?? 4;
  return { calories, protein, carbs, fat, meals, proteinPerMeal: Math.round(protein / meals) };
}

function getCTAUrl(d: WizardData): string {
  if (d.diet === "vegan") return "/?category=vegan&sort=valueScore,desc";
  const catMap: Record<string, string> = {
    mass: "blend", muscle: "whey_concentrate",
    maintain: "whey_concentrate", fat_loss: "whey_isolate",
  };
  return `/?category=${catMap[d.goal] ?? "whey_concentrate"}&sort=valueScore,desc`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function OptionCard({ selected, onClick, emoji, title, desc }: {
  selected: boolean; onClick: () => void; emoji: string; title: string; desc?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-xl border-2 px-4 py-3 transition-all duration-150 ${
        selected
          ? "border-[#FF9900] bg-[#FFF8EC]"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-xl shrink-0">{emoji}</span>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${selected ? "text-[#b36b00]" : "text-slate-800"}`}>{title}</p>
          {desc && <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{desc}</p>}
        </div>
        <span className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
          selected ? "border-[#FF9900] bg-[#FF9900]" : "border-slate-300"
        }`}>
          {selected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
        </span>
      </div>
    </button>
  );
}

function MultiCard({ selected, onClick, emoji, title, disabled }: {
  selected: boolean; onClick: () => void; emoji: string; title: string; disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled && !selected}
      className={`rounded-xl border-2 p-3 text-left transition-all duration-150 ${
        selected
          ? "border-[#FF9900] bg-[#FFF8EC]"
          : disabled
          ? "border-slate-100 bg-slate-50 opacity-40 cursor-not-allowed"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      <span className="text-xl block mb-1.5">{emoji}</span>
      <p className={`text-xs font-semibold leading-tight ${selected ? "text-[#b36b00]" : "text-slate-700"}`}>{title}</p>
    </button>
  );
}

function NumInput({ label, value, onChange, min, max, unit }: {
  label: string; value: string; onChange: (v: string) => void;
  min?: number; max?: number; unit: string;
}) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-widest">{label}</label>
      <div className="flex items-stretch border-2 border-slate-200 rounded-xl overflow-hidden focus-within:border-[#FF9900] transition-colors bg-white">
        <input
          type="number"
          value={value}
          onChange={e => onChange(e.target.value)}
          min={min}
          max={max}
          className="flex-1 px-3 py-3 text-sm font-bold text-slate-800 bg-white outline-none w-0"
          placeholder="—"
        />
        <span className="px-2.5 flex items-center bg-slate-50 text-[10px] font-semibold text-slate-400 border-l border-slate-200 shrink-0">
          {unit}
        </span>
      </div>
    </div>
  );
}

// ─── Macro Card (result) ──────────────────────────────────────────────────────

function MacroCard({ icon, label, value, unit, color }: {
  icon: string; label: string; value: number; unit: string; color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-base">{icon}</span>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-2xl font-extrabold" style={{ color }}>
        {value.toLocaleString()}
        <span className="text-xs font-medium text-slate-400 ml-1">{unit}</span>
      </p>
    </div>
  );
}

// ─── Wizard Content ───────────────────────────────────────────────────────────

function WizardContent({ onClose }: { onClose: () => void }) {
  const [step, setStep]       = useState(1);
  const [animKey, setAnimKey] = useState(0);
  const [data, setData]       = useState<WizardData>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState<MacroResult | null>(null);

  const API = process.env.NEXT_PUBLIC_API_URL ?? "";

  useEffect(() => {
    fetch(`${API}/api/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType: "CALCULATOR_START" }),
      keepalive: true,
    }).catch(() => {});
  }, [API]);

  const goStep = (n: number) => {
    setAnimKey(k => k + 1);
    setStep(n);
  };

  const next = () => {
    fetch(`${API}/api/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType: "STEP_COMPLETE", step }),
      keepalive: true,
    }).catch(() => {});

    if (step === TOTAL_STEPS) {
      setLoading(true);
      setTimeout(() => {
        setResult(calculate(data));
        setLoading(false);
        setAnimKey(k => k + 1);
        setStep(8);
        fetch(`${API}/api/track`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventType: "CALCULATOR_FINISH" }),
          keepalive: true,
        }).catch(() => {});
      }, 1600);
    } else {
      goStep(step + 1);
    }
  };

  const back = () => { if (step > 1 && step < 8) goStep(step - 1); };

  const canNext = (): boolean => {
    if (step === 1) return !!data.gender && +data.age > 0 && +data.height > 0 && +data.weight > 0;
    if (step === 2) return !!data.goal;
    if (step === 3) return !!data.activity;
    if (step === 4) return !!data.trainingFreq;
    if (step === 5) return data.trainingTypes.length > 0;
    if (step === 6) return data.benefits.length > 0;
    if (step === 7) return !!data.diet;
    return false;
  };

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 py-20">
        <div className="w-16 h-16 rounded-full bg-[#FFF8EC] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#FF9900] animate-spin" />
        </div>
        <div className="text-center">
          <p className="text-base font-extrabold text-slate-800">Računamo tvoj plan...</p>
          <p className="text-sm text-slate-400 mt-1">Analiziramo unete podatke</p>
        </div>
        <div className="flex gap-1.5 mt-2">
          {[0, 1, 2].map(i => (
            <span key={i} className="w-2 h-2 rounded-full bg-[#FF9900] opacity-50 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    );
  }

  // ── Result ──────────────────────────────────────────────────────────────────
  if (step === 8 && result) {
    const goalLabel: Record<string, string> = {
      mass: "dobijanje mase", muscle: "izgradnju mišića",
      maintain: "održavanje", fat_loss: "gubitak masti",
    };
    const tips: Record<string, string> = {
      mass:     "📈 Kalorijski suficit mora biti umeran — 300–400 kcal iznad održavanja.",
      muscle:   "💪 Protein posle treninga (30–60 min) maksimizuje sintezu mišića.",
      maintain: "⚖️ Prati napredak nedeljno i prilagodi kalorije po potrebi.",
      fat_loss: "⚡ Visok unos proteina tokom deficita čuva mišićnu masu.",
    };
    return (
      <div className="flex flex-col h-full" key={animKey} style={{ animation: "wzFadeIn 0.3s ease-out" }}>
        <div className="bg-[#131921] text-white px-6 py-5 shrink-0 rounded-t-2xl">
          <span className="text-[10px] font-bold text-[#FF9900] uppercase tracking-widest">Tvoj plan</span>
          <h2 className="text-xl font-extrabold mt-0.5">
            {data.name ? `${data.name}, evo tvog plana` : "Evo tvog plana"}
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Optimizovano za {goalLabel[data.goal] ?? "tvoj cilj"}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3 bg-slate-50">
          <div className="grid grid-cols-2 gap-3">
            <MacroCard icon="🥩" label="Protein"  value={result.protein}  unit="g"    color="#FF9900" />
            <MacroCard icon="🌾" label="Ugljeni h." value={result.carbs}  unit="g"    color="#3B82F6" />
            <MacroCard icon="🫒" label="Masti"     value={result.fat}     unit="g"    color="#22C55E" />
            <MacroCard icon="🔥" label="Kalorije"  value={result.calories} unit="kcal" color="#EF4444" />
          </div>

          <div className="bg-[#FFF8EC] border border-[#FFD980] rounded-xl p-4">
            <p className="text-[10px] font-bold text-[#b36b00] uppercase tracking-widest mb-1">Po obroku</p>
            <p className="text-sm text-slate-700">
              Rasporedi unos u <strong>{result.meals} obroka</strong> — ciljaj{" "}
              <strong className="text-[#FF9900]">{result.proteinPerMeal}g proteina</strong> po obroku.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Saveti</p>
            {data.goal && <p className="text-xs text-slate-600">{tips[data.goal]}</p>}
            <p className="text-xs text-slate-600">💧 Pij 35–40ml vode po kg telesne mase dnevno.</p>
            <p className="text-xs text-slate-600">😴 San 7–9h direktno utiče na oporavak i telesnu kompoziciju.</p>
          </div>
        </div>

        <div className="shrink-0 px-5 py-4 border-t border-slate-100 bg-white rounded-b-2xl">
          <Link
            href={getCTAUrl(data)}
            onClick={onClose}
            className="block w-full text-center bg-[#FF9900] text-[#131921] font-extrabold text-sm py-3.5 rounded-xl hover:bg-[#e68a00] transition-colors shadow-md"
          >
            Pogledaj proteine za tvoj cilj →
          </Link>
          <button
            onClick={onClose}
            className="block w-full text-center text-xs text-slate-400 hover:text-slate-600 mt-3 transition-colors py-1"
          >
            Zatvori
          </button>
        </div>
      </div>
    );
  }

  // ── Steps ────────────────────────────────────────────────────────────────────
  const stepTitles = [
    "", "Osnovne informacije", "Koji je tvoj cilj?",
    "Nivo aktivnosti", "Koliko često treniraš?",
    "Vrsta treninga", "Šta ti je prioritet?", "Tip ishrane",
  ];

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-widest">Ime (opciono)</label>
              <input
                type="text"
                value={data.name}
                onChange={e => setData(d => ({ ...d, name: e.target.value }))}
                placeholder="Npr. Marko"
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-[#FF9900] transition-colors bg-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">Pol</label>
              <div className="grid grid-cols-2 gap-3">
                <OptionCard selected={data.gender === "male"}   onClick={() => setData(d => ({ ...d, gender: "male"   }))} emoji="♂️" title="Muško" />
                <OptionCard selected={data.gender === "female"} onClick={() => setData(d => ({ ...d, gender: "female" }))} emoji="♀️" title="Žensko" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <NumInput label="Godine"  value={data.age}    onChange={v => setData(d => ({ ...d, age: v }))}    min={15} max={80}  unit="god" />
              <NumInput label="Visina"  value={data.height} onChange={v => setData(d => ({ ...d, height: v }))} min={140} max={220} unit="cm" />
              <NumInput label="Težina"  value={data.weight} onChange={v => setData(d => ({ ...d, weight: v }))} min={40} max={200}  unit="kg" />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-2.5">
            {([
              ["mass",     "⬆️",  "Dobijanje mase",                     "Kalorijsko ubrzanje i suvišak"],
              ["muscle",   "💪",  "Izgradnja mišića",                   "Rekomp i snaga uz kontrolu"],
              ["maintain", "⚖️",  "Održavanje težine",                  "Stabilnost i forma"],
              ["fat_loss", "🔥",  "Gubitak masti uz očuvanje mišića",   "Deficit uz visok protein"],
            ] as const).map(([v, e, t, d]) => (
              <OptionCard key={v} selected={data.goal === v} onClick={() => setData(s => ({ ...s, goal: v }))} emoji={e} title={t} desc={d} />
            ))}
          </div>
        );

      case 3:
        return (
          <div className="space-y-2.5">
            {([
              ["sedentary", "🪑", "Sedentarno",        "Kancelarijski posao, minimalno kretanje"],
              ["light",     "🚶", "Laka aktivnost",    "Šetnje, stajanje, povremene aktivnosti"],
              ["moderate",  "🏃", "Umerena aktivnost", "Sport 3–4x nedeljno, aktivan životni stil"],
              ["high",      "🏋️", "Visoka aktivnost",  "Intenzivan trening 5+ puta, fizički posao"],
            ] as const).map(([v, e, t, d]) => (
              <OptionCard key={v} selected={data.activity === v} onClick={() => setData(s => ({ ...s, activity: v }))} emoji={e} title={t} desc={d} />
            ))}
          </div>
        );

      case 4:
        return (
          <div className="space-y-2.5">
            {([
              ["none", "😴", "Bez treninga",      "Trenutno ne treniram"],
              ["1-2",  "🌱", "1–2x nedeljno",     "Rekreativno"],
              ["3-4",  "🔥", "3–4x nedeljno",     "Redovni trening"],
              ["5+",   "⚡", "5+ puta nedeljno",  "Ozbiljan atletičar"],
            ] as const).map(([v, e, t, d]) => (
              <OptionCard key={v} selected={data.trainingFreq === v} onClick={() => setData(s => ({ ...s, trainingFreq: v }))} emoji={e} title={t} desc={d} />
            ))}
          </div>
        );

      case 5: {
        const opts = [
          ["weights", "🏋️", "Teretana (tegovi)"],
          ["cardio",  "🏃", "Kardio"],
          ["hiit",    "⚡", "HIIT / funkcionalni"],
          ["sports",  "⚽", "Sportovi"],
          ["yoga",    "🧘", "Yoga / pilates"],
          ["other",   "🤸", "Ostalo"],
        ] as const;
        const maxed = data.trainingTypes.length >= 3;
        const toggle = (v: string) => setData(d => ({
          ...d,
          trainingTypes: d.trainingTypes.includes(v)
            ? d.trainingTypes.filter(x => x !== v)
            : maxed ? d.trainingTypes : [...d.trainingTypes, v],
        }));
        return (
          <>
            <p className="text-xs text-slate-400 mb-3">Odaberi do 3 vrste treninga</p>
            <div className="grid grid-cols-2 gap-2.5">
              {opts.map(([v, e, t]) => (
                <MultiCard key={v} selected={data.trainingTypes.includes(v)} onClick={() => toggle(v)} emoji={e} title={t} disabled={maxed} />
              ))}
            </div>
          </>
        );
      }

      case 6: {
        const opts = [
          ["recovery",  "🔄", "Oporavak"],
          ["energy",    "⚡", "Više energije"],
          ["strength",  "💪", "Snaga"],
          ["endurance", "🏅", "Izdržljivost"],
          ["satiety",   "🥗", "Sitost tokom dana"],
        ] as const;
        const maxed = data.benefits.length >= 2;
        const toggle = (v: string) => setData(d => ({
          ...d,
          benefits: d.benefits.includes(v)
            ? d.benefits.filter(x => x !== v)
            : maxed ? d.benefits : [...d.benefits, v],
        }));
        return (
          <>
            <p className="text-xs text-slate-400 mb-3">Odaberi do 2 benefita</p>
            <div className="grid grid-cols-2 gap-2.5">
              {opts.map(([v, e, t]) => (
                <MultiCard key={v} selected={data.benefits.includes(v)} onClick={() => toggle(v)} emoji={e} title={t} disabled={maxed} />
              ))}
            </div>
          </>
        );
      }

      case 7:
        return (
          <div className="space-y-2.5">
            {([
              ["omnivore",     "🍖", "Sve jedem",       "Bez ograničenja"],
              ["vegetarian",   "🥚", "Vegetarijanac",   "Bez mesa, ali jedem jaja i mlečne"],
              ["vegan",        "🌱", "Vegan",           "Isključivo biljni protein"],
              ["flexitarian",  "🥗", "Flexitarian",     "Pretežno biljno, povremeno meso"],
            ] as const).map(([v, e, t, d]) => (
              <OptionCard key={v} selected={data.diet === v} onClick={() => setData(s => ({ ...s, diet: v }))} emoji={e} title={t} desc={d} />
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Modal header */}
      <div className="shrink-0 flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100">
        <div>
          <p className="text-[10px] font-bold text-[#FF9900] uppercase tracking-widest mb-0.5">
            Korak {step} od {TOTAL_STEPS}
          </p>
          <h3 className="text-base font-extrabold text-slate-800">{stepTitles[step]}</h3>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
          aria-label="Zatvori"
        >
          <X className="w-4 h-4 text-slate-600" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="shrink-0 px-5 pt-3 pb-1">
        <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#FF9900] rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>
      </div>

      {/* Step content */}
      <div
        key={animKey}
        className="flex-1 overflow-y-auto px-5 py-4"
        style={{ animation: "wzFadeIn 0.22s ease-out" }}
      >
        {renderStep()}
      </div>

      {/* Navigation */}
      <div className="shrink-0 px-5 py-4 border-t border-slate-100 bg-white flex items-center gap-2.5">
        {step > 1 && (
          <button
            onClick={back}
            className="flex items-center gap-1 px-4 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-semibold text-slate-600 hover:border-slate-300 transition-colors shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
            Nazad
          </button>
        )}
        <button
          onClick={next}
          disabled={!canNext()}
          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#FF9900] text-[#131921] text-sm font-extrabold hover:bg-[#e68a00] transition-colors disabled:opacity-35 disabled:cursor-not-allowed shadow-sm"
        >
          {step === TOTAL_STEPS ? "Izračunaj →" : <>Dalje <ChevronRight className="w-4 h-4" /></>}
        </button>
      </div>
    </div>
  );
}

// ─── Modal + Floating Button ──────────────────────────────────────────────────

export default function ProteinCalculatorWizard() {
  const [open, setOpen] = useState(false);
  const [footerVisible, setFooterVisible] = useState(false);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    const footer = document.getElementById("site-footer");
    if (!footer) return;
    const observer = new IntersectionObserver(
      ([entry]) => setFooterVisible(entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style>{`
        @keyframes wzFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        @keyframes wzSlideUp {
          from { opacity: 0; transform: translateY(100%); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes wzScaleIn {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);   }
        }
      `}</style>

      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className={`fixed bottom-6 left-5 z-40 flex items-center gap-2 px-4 py-3 bg-[#1B2B4B] text-white text-sm font-bold rounded-2xl shadow-lg hover:bg-[#243860] hover:shadow-xl transition-all duration-200 cursor-pointer ${footerVisible ? "opacity-0 pointer-events-none" : "opacity-100"}`}
        aria-label="Otvori protein kalkulator"
      >
        <Calculator className="w-4 h-4 text-[#FF9900]" />
        Protein kalkulator
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          style={{ animation: "wzFadeIn 0.2s ease-out" }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          {/* Mobile: bottom sheet */}
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[92dvh] flex flex-col sm:hidden overflow-hidden"
            style={{ animation: "wzSlideUp 0.3s ease-out" }}
          >
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mt-3 mb-1 shrink-0" />
            <WizardContent onClose={() => setOpen(false)} />
          </div>

          {/* Desktop: centered modal */}
          <div
            className="hidden sm:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl max-h-[88vh] flex-col overflow-hidden shadow-2xl"
            style={{ animation: "wzScaleIn 0.25s ease-out" }}
          >
            <WizardContent onClose={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
