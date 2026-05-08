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

const ARTICLES = [
  {
    href: "/vodici/koliko-proteina-dnevno",
    title: "Koliko proteina dnevno treba uzimati?",
    excerpt: "Konkretna preporuka: 1.6–2.2g/kg za aktivne ljude. Saznaj kako da dostigneš taj unos kroz hranu i suplemente.",
    readMin: 4,
  },
  {
    href: "/vodici/whey-isolate-vs-concentrate",
    title: "Whey Isolate vs Concentrate — koja je razlika?",
    excerpt: "Isolate ima 85–95% proteina i gotovo bez laktoze. Concentrate košta manje i za većinu je sasvim dovoljan.",
    readMin: 4,
  },
  {
    href: "/vodici/da-li-protein-goji",
    title: "Da li protein goji?",
    excerpt: "Direktan odgovor: ne goji protein, goji kalorijski suficit. Saznaj kako protein zapravo utiče na telesnu masu.",
    readMin: 4,
  },
  {
    href: "/vodici/kada-piti-protein",
    title: "Kada piti protein — pre, posle treninga ili ujutru?",
    excerpt: "Mit o 30-minutnom anaboličkom prozoru je preuveličan. Evo šta zapravo kaže nauka o tajmingu proteina.",
    readMin: 4,
  },
];

const SEO_PAGES = [
  {
    href: "/najbolji-whey-protein-srbija",
    title: "Najbolji whey protein u Srbiji",
    excerpt: "Rang lista proteina po value score — koji nudi najviše za tvoj novac.",
  },
  {
    href: "/najjeftiniji-whey-protein",
    title: "Najjeftiniji whey protein u Srbiji",
    excerpt: "Aktuelne cene sortirane od najjeftinije — sve prodavnice na jednom mestu.",
  },
  {
    href: "/whey-protein-cena",
    title: "Whey protein cena u Srbiji",
    excerpt: "Pregled aktuelnih cena concentrate, izolata i hidrolizata iz svih prodavnica.",
  },
  {
    href: "/whey-isolate-srbija",
    title: "Whey izolat u Srbiji",
    excerpt: "Sve dostupne opcije whey izolata — čistiji protein, manje laktoze.",
  },
  {
    href: "/protein-za-masu",
    title: "Protein za masu",
    excerpt: "Pregled proteina i blendova pogodnih za fazu izgradnje mišićne mase.",
  },
  {
    href: "/whey-protein-do-3000-dinara",
    title: "Whey protein do 3000 dinara",
    excerpt: "Kvalitetni proteini u budžetu do 3000 RSD — sortirani po value score.",
  },
  {
    href: "/whey-protein-do-5000-dinara",
    title: "Whey protein do 5000 dinara",
    excerpt: "Pregled whey proteina do 5000 RSD — uključujući i kvalitetne izolate.",
  },
];

const INFO_PAGES = [
  {
    href: "/kako-racunamo-value-score",
    title: "Kako računamo Value Score",
    excerpt: "Transparentno objašnjenje metodologije — šta ulazi u skor i zašto.",
  },
  {
    href: "/o-nama",
    title: "O Proteinoteci",
    excerpt: "Zašto je napravljen ovaj sajt i kako funkcioniše poređenje cena.",
  },
];

function GuideCard({ href, title, excerpt, readMin }: { href: string; title: string; excerpt: string; readMin?: number }) {
  return (
    <Link
      href={href}
      className="block bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-[#FF9900] hover:shadow-md transition-all duration-150 group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-slate-900 group-hover:text-[#FF9900] transition-colors mb-1.5 leading-snug">
            {title}
          </h2>
          <p className="text-[13px] text-slate-500 leading-relaxed">{excerpt}</p>
        </div>
        {readMin && (
          <span className="shrink-0 text-xs text-slate-400 mt-0.5">{readMin} min</span>
        )}
      </div>
    </Link>
  );
}

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

        {/* Articles */}
        <section className="mb-10">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Članci</h2>
          <div className="space-y-3">
            {ARTICLES.map((g) => (
              <GuideCard key={g.href} {...g} />
            ))}
          </div>
        </section>

        {/* SEO pages */}
        <section className="mb-10">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Pregled cena</h2>
          <div className="space-y-3">
            {SEO_PAGES.map((g) => (
              <GuideCard key={g.href} {...g} />
            ))}
          </div>
        </section>

        {/* Info pages */}
        <section className="mb-10">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">O sajtu</h2>
          <div className="space-y-3">
            {INFO_PAGES.map((g) => (
              <GuideCard key={g.href} {...g} />
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}
