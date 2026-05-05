import { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Vodiči o proteinima i suplementaciji | Proteinoteka",
  description:
    "Praktični vodiči o proteinima na srpskom jeziku — koliko proteina dnevno, razlika između whey isolate i concentrate, da li protein goji, i kada piti protein.",
  alternates: { canonical: "https://proteinoteka.rs/vodici" },
  openGraph: {
    title: "Vodiči o proteinima i suplementaciji | Proteinoteka",
    description:
      "Praktični vodiči o proteinima na srpskom jeziku — koliko proteina dnevno, razlika između whey isolate i concentrate, da li protein goji, i kada piti protein.",
    url: "https://proteinoteka.rs/vodici",
    siteName: "Proteinoteka",
    locale: "sr_RS",
    type: "website",
  },
};

const guides = [
  {
    slug: "koliko-proteina-dnevno",
    title: "Koliko proteina dnevno treba uzimati?",
    excerpt: "Konkretna preporuka: 1.6–2.2g/kg za aktivne ljude. Saznaj kako da dostigneš taj unos kroz hranu i suplemente.",
    readMin: 4,
  },
  {
    slug: "whey-isolate-vs-concentrate",
    title: "Whey Isolate vs Concentrate — koja je razlika?",
    excerpt: "Isolate ima 85–95% proteina i gotovo bez laktoze. Concentrate košta manje i za većinu je sasvim dovoljan.",
    readMin: 4,
  },
  {
    slug: "da-li-protein-goji",
    title: "Da li protein goji?",
    excerpt: "Direktan odgovor: ne goji protein, goji kalorijski suficit. Saznaj kako protein zapravo utiče na telesnu masu.",
    readMin: 4,
  },
  {
    slug: "kada-piti-protein",
    title: "Kada piti protein — pre, posle treninga ili ujutru?",
    excerpt: "Mit o 30-minutnom anaboličkom prozoru je preuveličan. Evo šta zapravo kaže nauka o tajmingu proteina.",
    readMin: 4,
  },
];

export default function VodiciPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-10">

        <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-8">
          <Link href="/" className="hover:text-[#FF9900] transition-colors">Početna</Link>
          <span>/</span>
          <span className="text-slate-600">Vodiči</span>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-3">
          Vodiči o proteinima
        </h1>
        <p className="text-[15px] text-slate-500 mb-10">
          Praktični odgovori na najčešća pitanja o proteinima i suplementaciji — bez uvoda, bez reklamiranja.
        </p>

        <div className="space-y-4">
          {guides.map((g) => (
            <Link
              key={g.slug}
              href={`/vodici/${g.slug}`}
              className="block bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-[#FF9900] hover:shadow-md transition-all duration-150 group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-slate-900 group-hover:text-[#FF9900] transition-colors mb-2 leading-snug">
                    {g.title}
                  </h2>
                  <p className="text-sm text-slate-500 leading-relaxed">{g.excerpt}</p>
                </div>
                <span className="shrink-0 text-xs text-slate-400 mt-0.5">{g.readMin} min</span>
              </div>
            </Link>
          ))}
        </div>

      </main>
    </div>
  );
}
