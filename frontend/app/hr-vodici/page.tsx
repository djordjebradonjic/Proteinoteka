import { CURRENT_MARKET, MARKET_CONFIG } from "@/lib/marketConfig";
import { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: { absolute: "Vodiči o proteinima za Hrvatsku | Proteinoteka" },
  description:
    "Stručni vodiči o whey proteinu, cijenama u Hrvatskoj i savjeti za početnike. Sve što trebate znati o proteinskim dodacima prehrani.",
  alternates: { canonical: `https://${MARKET_CONFIG[CURRENT_MARKET].domain}/hr-vodici` },
  openGraph: {
    title: "Vodiči o proteinima za Hrvatsku | Proteinoteka",
    description:
      "Stručni vodiči o whey proteinu, cijenama u Hrvatskoj i savjeti za početnike.",
    url: `https://${MARKET_CONFIG[CURRENT_MARKET].domain}/hr-vodici`,
    siteName: "Proteinoteka",
    locale: "hr_HR",
    type: "website",
  },
};

const HR_GUIDES = [
  {
    href: "/hr-vodici/whey-protein-za-pocetnike-hrvatska",
    title: "Whey protein za početnike — što, koliko i odakle?",
    desc: "WPC, WPI ili biljni? Koliko uzimati i koliko košta mjesec dana u Hrvatskoj.",
    readMin: 7,
  },
  {
    href: "/hr-vodici/koliko-kosta-protein-hrvatska",
    title: "Koliko košta whey protein u Hrvatskoj?",
    desc: "Usporedba cijena whey proteina u EUR po gramu proteina — s aktualnim podacima.",
    readMin: 5,
  },
];

export default function Page() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-8 flex-wrap">
          <Link href="/" className="hover:text-[#FF9900] transition-colors">Početna</Link>
          <span>/</span>
          <span className="text-slate-600">Vodiči</span>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-3">
          Vodiči o proteinima
        </h1>
        <p className="text-slate-500 mb-10 text-[15px]">
          Stručni članci o odabiru, doziranju i cijenama proteinskih dodataka prehrani u Hrvatskoj.
        </p>

        <div className="space-y-4">
          {HR_GUIDES.map((g) => (
            <Link
              key={g.href}
              href={g.href}
              className="block bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:border-[#FF9900] hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-slate-900 group-hover:text-[#FF9900] transition-colors mb-1 leading-snug">
                    {g.title}
                  </h2>
                  <p className="text-[14px] text-slate-500 leading-relaxed">{g.desc}</p>
                </div>
                <span className="text-xs text-slate-400 shrink-0 mt-1">{g.readMin} min</span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
