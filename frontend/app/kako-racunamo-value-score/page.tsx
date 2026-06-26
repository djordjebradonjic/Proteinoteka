import { CURRENT_MARKET, MARKET_CONFIG } from '@/lib/marketConfig';
import { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: "Kako računamo Value Score | Proteinoteka" },
  description:
    "Saznaj kako Proteinoteka računa Value Score i kako upoređujemo odnos cene i kvaliteta whey proteina u Srbiji.",
  alternates: { canonical: `https://${MARKET_CONFIG[CURRENT_MARKET].domain}/kako-racunamo-value-score` },
  openGraph: {
    title: "Kako računamo Value Score | Proteinoteka",
    description:
      "Saznaj kako Proteinoteka računa Value Score i kako upoređujemo odnos cene i kvaliteta whey proteina u Srbiji.",
    url: `https://${MARKET_CONFIG[CURRENT_MARKET].domain}/kako-racunamo-value-score`,
    siteName: "Proteinoteka",
    locale: MARKET_CONFIG[CURRENT_MARKET].ogLocale,
    type: "article",
  },
};

const BASE = `https://${MARKET_CONFIG[CURRENT_MARKET].domain}`;
const SLUG = "/kako-racunamo-value-score";

const factors = [
  { icon: "⚖️", label: "Cena po gramu proteina", desc: "Koliko RSD plaćaš za svaki gram čistog proteina u pakovanju." },
  { icon: "📊", label: "Procenat proteina", desc: "Koliki je udio proteina u ukupnoj masi proizvoda (npr. 80% vs 70%)." },
  { icon: "📦", label: "Ukupna količina proteina", desc: "Koliko grama proteina dobijaš u celom pakovanju." },
  { icon: "🍬", label: "Sadržaj šećera", desc: "Manje šećera znači čistiji protein i bolji skor." },
  { icon: "💰", label: "Odnos cene i količine", desc: "Da li veće pakovanje znači proporcionalno nižu cenu?" },
];

const improvers = [
  "Više proteina na 100g (npr. 85g vs 70g na 100g)",
  "Niža cena po gramu proteina",
  "Veće pakovanje pri sličnoj ceni po gramu",
  "Manji sadržaj šećera i jeftinijih punjeva",
  "Čistiji nutritivni profil bez nepotrebnih aditiva",
];

const INTERNAL_LINKS = [
  { label: "Najbolji whey protein u Srbiji",   href: "/najbolji-whey-protein-srbija" },
  { label: "Najjeftiniji whey protein",        href: "/najjeftiniji-whey-protein"    },
  { label: "Whey protein cena",               href: "/whey-protein-cena"            },
  { label: "Protein za masu",                  href: "/protein-za-masu"              },
  { label: "Vodiči",                           href: "/vodici"                       },
];

export default function Page() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Kako računamo Value Score",
      datePublished: "2025-05-08",
      author:    { "@type": "Organization", name: "Proteinoteka", url: BASE },
      publisher: { "@type": "Organization", name: "Proteinoteka", url: BASE },
      url: `${BASE}${SLUG}`,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Početna", item: BASE },
        { "@type": "ListItem", position: 2, name: "Vodiči",  item: `${BASE}/vodici` },
        { "@type": "ListItem", position: 3, name: "Kako računamo Value Score", item: `${BASE}${SLUG}` },
      ],
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="max-w-3xl mx-auto px-4 py-10">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-8 flex-wrap">
            <Link href="/" className="hover:text-[#FF9900] transition-colors">Početna</Link>
            <span>/</span>
            <Link href="/vodici" className="hover:text-[#FF9900] transition-colors">Vodiči</Link>
            <span>/</span>
            <span className="text-slate-600">Kako računamo Value Score</span>
          </nav>

          {/* H1 */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-3">
              Kako računamo Value Score
            </h1>
            <p className="text-lg text-slate-500">
              Objašnjenje načina poređenja proteina na Proteinoteci
            </p>
          </div>

          {/* Section 1 — Intro */}
          <p className="text-[15px] sm:text-base text-slate-700 leading-relaxed mb-10 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
            Value Score je Proteinotekina metrika koja ti pomaže da brže pronađeš protein koji nudi
            najviše za tvoj novac — bez potrebe da ručno računaš tabele nutritivnih vrednosti po
            prodavnicama. <strong className="text-slate-900">Skor nije sponzorisan niti plaćen.</strong>{" "}
            Nijedna prodavnica ne može da utiče na rezultate. Računamo ga isključivo na osnovu javno
            dostupnih podataka: cene, deklarisanog sadržaja proteina i veličine pakovanja. Cilj je
            da poređenje bude objektivno i korisno, a ne još jedan marketinški alat.
          </p>

          {/* Section 2 — Formula */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Šta ulazi u Value Score</h2>
            <p className="text-[15px] text-slate-500 mb-5">
              Ne postoji jedna magična formula. Value Score kombinuje nekoliko faktora koji zajedno
              oslikavaju koliko vredi svaki dinar koji uložiš u protein.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {factors.map(({ icon, label, desc }) => (
                <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex gap-3 items-start">
                  <span className="text-2xl mt-0.5 shrink-0">{icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 mb-0.5">{label}</p>
                    <p className="text-[13px] text-slate-500 leading-snug">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Core metric callout */}
            <div className="bg-[#FFF8EC] border border-[#FFD980] rounded-xl p-5 mb-6">
              <p className="text-sm font-bold text-[#b36b00] uppercase tracking-wide mb-2">
                ⚡ Ključna metrika
              </p>
              <p className="text-[15px] text-slate-800 leading-relaxed">
                Osnova skora je <strong>cena po gramu proteina</strong> — koliko RSD plaćaš za svaki gram
                čistog proteina koji dobijaš u pakovanju. Što je niži ovaj broj, to je viši Value Score.
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Viši score = bolji odnos cene i kvaliteta. Score je relativan unutar kategorije.
              </p>
            </div>

            {/* Example comparison */}
            <h3 className="text-base font-bold text-slate-900 mb-3">Primer poređenja</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-white rounded-xl border border-red-100 p-4 shadow-sm">
                <p className="text-xs font-bold text-red-500 uppercase tracking-wide mb-2">Niži Value Score</p>
                <p className="text-sm font-semibold text-slate-900 mb-2">Protein A — 1.800 RSD</p>
                <ul className="text-[13px] text-slate-600 space-y-1">
                  <li>Pakovanje: 500g</li>
                  <li>Proteina na 100g: 75g</li>
                  <li>Ukupno proteina: 375g</li>
                  <li className="font-semibold text-red-600">Cena/g proteina: 4,80 RSD</li>
                </ul>
              </div>
              <div className="bg-white rounded-xl border border-green-100 p-4 shadow-sm">
                <p className="text-xs font-bold text-green-600 uppercase tracking-wide mb-2">Viši Value Score</p>
                <p className="text-sm font-semibold text-slate-900 mb-2">Protein B — 2.500 RSD</p>
                <ul className="text-[13px] text-slate-600 space-y-1">
                  <li>Pakovanje: 1.000g</li>
                  <li>Proteina na 100g: 80g</li>
                  <li>Ukupno proteina: 800g</li>
                  <li className="font-semibold text-green-600">Cena/g proteina: 3,13 RSD</li>
                </ul>
              </div>
            </div>
            <p className="text-[13px] text-slate-500 mt-3">
              Protein B je skuplji u apsolutnom iznosu, ali nudi značajno više proteina po dinaru.
              Zbog toga ima viši Value Score — i realno je isplativiji izbor.
            </p>
          </section>

          {/* Section 3 — What improves score */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Šta povećava Value Score</h2>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {improvers.map((item, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 px-5 py-3.5 text-[15px] text-slate-700 ${
                    i < improvers.length - 1 ? "border-b border-slate-100" : ""
                  }`}
                >
                  <span className="text-green-500 font-bold mt-0.5 shrink-0">✓</span>
                  {item}
                </div>
              ))}
            </div>
          </section>

          {/* Section 4 — Disclaimer */}
          <section className="mb-10">
            <div className="bg-slate-100 border border-slate-200 rounded-xl p-5 flex gap-4 items-start">
              <span className="text-2xl shrink-0">ℹ️</span>
              <div>
                <p className="text-sm font-bold text-slate-700 mb-1">Napomena</p>
                <p className="text-[14px] text-slate-600 leading-relaxed">
                  Value Score je informativan i služi kao pomoć pri poređenju proizvoda.
                  Proteinoteka ne garantuje kvalitet proizvoda niti tačnost informacija
                  sa sajtova prodavnica. Uvek proverite aktuelne cene i deklaracije
                  direktno na sajtu prodavnice pre kupovine.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5 — Internal links */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Povezane stranice</h2>
            <div className="flex flex-wrap gap-3">
              {INTERNAL_LINKS.map(({ label, href }) => (
                <Link
                  key={href}
                  href={href}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm"
                >
                  {label}
                </Link>
              ))}
            </div>
          </section>

          {/* CTA */}
          <div className="bg-[#1B2B4B] rounded-2xl p-6 text-white text-center">
            <p className="text-base leading-relaxed mb-4">
              Sada kad znaš kako funkcioniše Value Score — pronađi protein koji ga ima najvišeg.
            </p>
            <Link
              href="/?sort=valueScore,desc"
              className="inline-block px-6 py-3 bg-[#FF9900] hover:bg-[#e68a00] text-[#131921] font-bold rounded-xl text-sm transition-colors"
            >
              Sortiraj po Value Score →
            </Link>
          </div>

        </main>
      </div>
    </>
  );
}
