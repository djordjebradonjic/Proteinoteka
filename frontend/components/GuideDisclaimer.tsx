import { CURRENT_MARKET } from "@/lib/marketConfig";

const DISCLAIMER_TEXT = {
  rs: "Ovaj vodič je isključivo informativnog karaktera i ne predstavlja medicinski savet, dijagnozu niti terapeutsku preporuku. Proteinski suplementi nisu lek i ne zamenjuju uravnoteženu ishranu. Pre uvođenja suplementa u ishranu — posebno u slučaju zdravstvenih tegoba, trudnoće ili uzimanja lekova — konsultujte se sa lekarom ili registrovanim nutricionistom. Informacije se baziraju na javno dostupnim naučnim istraživanjima i ne podrazumevaju garanciju ishoda.",
  hr: "Ovaj vodič je isključivo informativnog karaktera i ne predstavlja medicinski savjet, dijagnozu niti terapeutsku preporuku. Proteinski suplementi nisu lijek i ne zamjenjuju uravnoteženu prehranu. Prije uvođenja suplementa u prehranu — posebno u slučaju zdravstvenih tegoba, trudnoće ili uzimanja lijekova — savjetujte se s liječnikom ili registriranim nutricionistom. Informacije se temelje na javno dostupnim znanstvenim istraživanjima i ne podrazumijevaju garanciju ishoda.",
};

export default function GuideDisclaimer() {
  return (
    <aside className="mt-10 p-4 bg-slate-100 rounded-xl border border-slate-200">
      <p className="text-[12px] text-slate-500 leading-relaxed">
        <strong className="text-slate-600">Napomena:</strong>{" "}
        {DISCLAIMER_TEXT[CURRENT_MARKET]}
      </p>
    </aside>
  );
}
