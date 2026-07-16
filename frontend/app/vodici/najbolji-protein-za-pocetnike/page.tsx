import { notFound } from "next/navigation";
import { CURRENT_MARKET, MARKET_CONFIG } from '@/lib/marketConfig';
import { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import VodiciNav from "@/components/VodiciNav";
import GuideToc, { TocSection } from "@/components/GuideToc";
import GuideDisclaimer from "@/components/GuideDisclaimer";
import { fetchTopProducts } from "@/lib/seo-data";
import { Product } from "@/types/product";
import { productUrl } from "@/lib/productUrl";

export const revalidate = 86400;

const PAGE_TITLE = "Najbolji protein za početnike 2026 | Proteinoteka";
const PAGE_DESCRIPTION =
  "Koji protein da kupiš prvi put? Najbolji ukupno, budžet, vrednost za novac, svarljivost i biljni izbor — sa aktuelnim cenama i top 10 rang listom iz Srbije.";

export const metadata: Metadata = {
  title: { absolute: PAGE_TITLE },
  description: PAGE_DESCRIPTION,
  alternates: { canonical: `https://${MARKET_CONFIG[CURRENT_MARKET].domain}/vodici/najbolji-protein-za-pocetnike` },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: `https://${MARKET_CONFIG[CURRENT_MARKET].domain}/vodici/najbolji-protein-za-pocetnike`,
    siteName: "Proteinoteka",
    locale: MARKET_CONFIG[CURRENT_MARKET].ogLocale,
    type: "article",
    images: [{ url: `https://${MARKET_CONFIG[CURRENT_MARKET].domain}/opengraph-image`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: [`https://${MARKET_CONFIG[CURRENT_MARKET].domain}/opengraph-image`],
  },
};

function pricePerGramProtein(p: Product): number | null {
  if (!p.numericPrice || !p.primaryWeightGrams || !p.proteinPer100g) return null;
  const totalProteinG = p.primaryWeightGrams * (p.proteinPer100g / 100);
  if (totalProteinG <= 0) return null;
  return p.numericPrice / totalProteinG;
}

const tocSections: TocSection[] = [
  { id: "kratak-odgovor", title: "Kratak odgovor" },
  { id: "top-izbori", title: "Top izbori po kategoriji" },
  { id: "top-10", title: "Top 10 rang lista" },
  { id: "kako-biramo", title: "Kako biramo ove proizvode" },
  { id: "faq", title: "Česta pitanja" },
];

const faqItems = [
  {
    q: "Koji protein da kupim prvi put?",
    a: "Whey concentrate (WPC) — najjeftiniji tip whey proteina sa 70–80g proteina na 100g, dostupan u svakoj prodavnici. Za 90% ljudi koji tek počinju sa treningom, WPC je sve što treba. Detaljnije objašnjenje zašto pronađi u vodiču o whey proteinu za početnike.",
  },
  {
    q: "Da li mi treba isolate ili concentrate kao početniku?",
    a: "Concentrate je bolji izbor za skoro sve početnike, osim ako nemaš dijagnostikovanu intoleranciju na laktozu ili si u fazi strogog sušenja. Isolate je 20–40% skuplji, a razlika u efikasnosti za rekreativce je zanemarljiva.",
  },
  {
    q: "Koliko košta prvi protein mesečno?",
    a: "Za 30g proteina dnevno (900g mesečno) sa dobrim WPC-om, računaj otprilike 2.500–5.500 RSD mesečno u zavisnosti od brenda i akcija. Pogledaj tačnu računicu u vodiču koliko novca mesečno treba za proteine.",
  },
  {
    q: "Da li je jeftiniji protein lošiji?",
    a: "Ne nužno. Cena često zavisi od marketinškog budžeta brenda, ne samo od sastava. Gledaj procenat proteina na 100g i cenu po gramu proteina — ne samo cenu pakovanja. Neki od najjeftinijih proteina u Srbiji imaju odličan sastav.",
  },
  {
    q: "Da li mi treba biljni protein ako nisam vegan?",
    a: "Ne mora, ali je dobra opcija ako imaš problem sa varenjem mlečnih proteina ili želiš da smanjiš unos mlečnih proizvoda. Biljni proteini danas kombinuju grašak i pirinač za kompletan aminokiselinski profil. Imaju blago niži biološki skor od whey-a, ali je to sasvim dovoljno za rekreativni trening.",
  },
];

const BASE = `https://${MARKET_CONFIG[CURRENT_MARKET].domain}`;
const SLUG = "/vodici/najbolji-protein-za-pocetnike";
const MONTHLY_PROTEIN_G = 900; // 30g/day × 30 days

export default async function Page() {
  if (CURRENT_MARKET !== 'rs') notFound();

  const [concentrates, isolates, vegans, caseins] = await Promise.all([
    fetchTopProducts({ category: "whey_concentrate", sortBy: "valueScore", limit: 5 }),
    fetchTopProducts({ category: "whey_isolate", sortBy: "valueScore", limit: 3 }),
    fetchTopProducts({ category: "vegan", sortBy: "valueScore", limit: 3 }),
    fetchTopProducts({ category: "casein", sortBy: "valueScore", limit: 2 }),
  ]);

  const withPPG = (list: Product[]) => list.map((p) => ({ ...p, ppg: pricePerGramProtein(p) }));

  const concentratesPPG = withPPG(concentrates);
  const isolatesPPG = withPPG(isolates);
  const vegansPPG = withPPG(vegans);
  const caseinsPPG = withPPG(caseins);

  const top10 = [...concentratesPPG, ...isolatesPPG, ...vegansPPG, ...caseinsPPG]
    .filter((p) => p.valueScore !== null)
    .sort((a, b) => (b.valueScore ?? 0) - (a.valueScore ?? 0))
    .slice(0, 10);

  // Persona picks — each drawn from a distinct category/metric so they don't overlap
  const bestOverall = concentratesPPG[0] ?? null; // highest valueScore WPC — the default first-protein recommendation

  const bestBudget = [...concentratesPPG]
    .filter((p) => p.numericPrice > 0)
    .sort((a, b) => a.numericPrice - b.numericPrice)[0] ?? null; // cheapest absolute price

  const bestValueForMoney = [...concentratesPPG, ...isolatesPPG]
    .filter((p) => p.ppg !== null)
    .sort((a, b) => (a.ppg ?? Infinity) - (b.ppg ?? Infinity))[0] ?? null; // lowest RSD per gram of protein

  const easiestToDigest = isolatesPPG[0] ?? null; // highest valueScore isolate — lowest lactose/sugar profile

  const bestVegan = vegansPPG[0] ?? null; // highest valueScore plant-based

  const picks = [
    { label: "Najbolji ukupno", emoji: "🥇", product: bestOverall, why: "Najviši Value Score među whey concentrate proteinima — podrazumevani prvi izbor za skoro svakog početnika." },
    { label: "Najbolji budžet", emoji: "💰", product: bestBudget, why: "Apsolutno najjeftiniji whey concentrate trenutno dostupan, uz i dalje solidan sastav." },
    { label: "Najbolja vrednost za novac", emoji: "⚖️", product: bestValueForMoney, why: "Najniža cena po gramu čistog proteina — nije nužno najjeftinije pakovanje, ali daje najviše proteina za tvoj novac." },
    { label: "Najlakši za varenje", emoji: "🌿", product: easiestToDigest, why: "Whey isolate sa gotovo uklonjenom laktozom — dobar izbor ako ti concentrate izaziva nadutost." },
    { label: "Najbolji biljni izbor", emoji: "🌱", product: bestVegan, why: "Najviši Value Score među biljnim proteinima — bez mlečnih sastojaka, kompletan aminokiselinski profil." },
  ].filter((p) => p.product !== null);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Najbolji protein za početnike — top izbori i cene",
      datePublished: "2026-07-16",
      dateModified: new Date().toISOString().split("T")[0],
      author: { "@type": "Organization", name: "Proteinoteka", url: BASE },
      publisher: { "@type": "Organization", name: "Proteinoteka", url: BASE },
      url: `${BASE}${SLUG}`,
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: top10.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${BASE}${productUrl(p)}`,
        name: p.name,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqItems.map(({ q, a }) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: a },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Početna", item: BASE },
        { "@type": "ListItem", position: 2, name: "Vodiči", item: `${BASE}/vodici` },
        { "@type": "ListItem", position: 3, name: "Najbolji protein za početnike", item: `${BASE}${SLUG}` },
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
            <span className="text-slate-600">Najbolji protein za početnike</span>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-4">
              Najbolji protein za početnike — top izbori i cene
            </h1>
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <span>6 min čitanja</span>
              <span>·</span>
              <span>Ažurirano: jul 2026.</span>
            </div>
          </div>

          {/* Quick answer */}
          <div id="kratak-odgovor" className="mb-8 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-lg text-slate-700 leading-relaxed">
              <strong className="text-slate-900">Kratki odgovor:</strong> za veliku većinu početnika najbolji prvi protein je <strong className="text-slate-900">whey concentrate (WPC)</strong> — jeftin, lako dostupan i sasvim dovoljan dok ne savladaš osnove treninga. Ispod su konkretni proizvodi po kategoriji (budžet, vrednost za novac, svarljivost, biljni izbor) sa aktuelnim cenama, plus šira top 10 rang lista.
            </p>
          </div>

          <GuideToc sections={tocSections} />

          {/* Persona picks */}
          <section id="top-izbori" className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Top izbori po kategoriji</h2>
            <p className="text-[14px] text-slate-500 mb-5 leading-relaxed">
              Nema jednog &ldquo;najboljeg&rdquo; proteina za svakoga — zato biramo po pet različitih kriterijuma umesto jedne liste.
            </p>
            <div className="space-y-3">
              {picks.map(({ label, emoji, product, why }) => {
                if (!product) return null;
                return (
                  <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-lg leading-none">{emoji}</span>
                      <span className="text-[11px] font-bold text-[#b36b00] bg-[#FF9900]/10 px-2 py-0.5 rounded-full border border-[#FF9900]/30 uppercase tracking-wide">
                        {label}
                      </span>
                    </div>
                    <Link
                      href={productUrl(product)}
                      className="font-bold text-slate-900 hover:text-[#FF9900] transition-colors leading-snug block mb-1"
                    >
                      {product.name}
                    </Link>
                    <p className="text-xs text-slate-400 mb-2">{product.storeName} · {product.price}</p>
                    <p className="text-[14px] text-slate-600 leading-relaxed">{why}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Top 10 table */}
          {top10.length > 0 && (
            <section id="top-10" className="mb-10">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Top 10 rang lista — svi tipovi proteina</h2>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-4">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Rangirano po Value Score-u
                  </span>
                  <span className="text-[11px] text-slate-400">cene ažurirane sedmično</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-left">
                        <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 min-w-[180px]">Proizvod</th>
                        <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 text-right whitespace-nowrap">Prot/100g</th>
                        <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 text-right whitespace-nowrap hidden sm:table-cell">RSD/g prot.</th>
                        <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 text-right whitespace-nowrap">Value Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {top10.map((p, i) => (
                        <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3">
                            <Link
                              href={productUrl(p)}
                              className="font-medium text-slate-800 hover:text-[#FF9900] transition-colors leading-snug block"
                            >
                              {i === 0 && (
                                <span className="inline-block mr-1.5 px-1.5 py-0.5 bg-[#FF9900]/10 text-[#b36b00] text-[10px] font-bold rounded">
                                  #1
                                </span>
                              )}
                              {p.name}
                            </Link>
                            <span className="text-xs text-slate-400">{p.storeName} · {p.price}</span>
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-slate-700 whitespace-nowrap">
                            {p.proteinPer100g?.toFixed(0) ?? "—"}g
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-slate-700 whitespace-nowrap hidden sm:table-cell">
                            {p.ppg ? `${p.ppg.toFixed(1)}` : "—"}
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            {p.valueScore ? (
                              <span className="font-bold text-[#FF9900]">{p.valueScore.toFixed(1)}</span>
                            ) : "—"}
                            <span className="text-slate-400">/10</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {bestValueForMoney?.ppg && (
                <div className="bg-[#FFF8EC] border border-[#FF9900]/30 rounded-xl p-4">
                  <p className="text-[14px] text-slate-700 leading-relaxed">
                    <strong className="text-slate-900">Za 30g proteina dnevno (900g mesečno):</strong>{" "}
                    sa {bestValueForMoney.name} po {bestValueForMoney.ppg.toFixed(1)} RSD/g proteina, mesec dana suplementacije košta oko{" "}
                    <strong className="text-slate-900">
                      ~{Math.round(bestValueForMoney.ppg * MONTHLY_PROTEIN_G).toLocaleString("sr-RS")} RSD
                    </strong>.
                  </p>
                </div>
              )}
            </section>
          )}

          {/* How we choose */}
          <section id="kako-biramo" className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Kako biramo ove proizvode</h2>
            <div className="space-y-3 text-[15px] leading-relaxed text-slate-700">
              <p>
                Izbori iznad nisu prosto automatski najskuplji ili najjeftiniji proizvodi — za svaku kategoriju koristimo drugačiji kriterijum:
              </p>
              <ul className="space-y-2 list-disc pl-5 text-[14px] text-slate-600">
                <li><strong className="text-slate-800">Najbolji ukupno</strong> i <strong className="text-slate-800">najlakši za varenje</strong> — najviši Value Score unutar svoje kategorije proteina (concentrate, odnosno isolate).</li>
                <li><strong className="text-slate-800">Najbolji budžet</strong> — najniža apsolutna cena pakovanja, bez obzira na veličinu.</li>
                <li><strong className="text-slate-800">Najbolja vrednost za novac</strong> — najniža cena po gramu čistog proteina (RSD/g), što je drugačije od najjeftinijeg pakovanja jer uzima u obzir i procenat proteina.</li>
                <li><strong className="text-slate-800">Najbolji biljni izbor</strong> — najviši Value Score unutar biljnih proteina.</li>
              </ul>
              <p>
                Value Score kombinuje cenu po gramu proteina, čistoću, tip proteina i reputaciju brenda — detalji u{" "}
                <Link href="/kako-racunamo-value-score" className="text-[#FF9900] hover:underline font-medium">
                  metodologiji
                </Link>. Cene i rang lista se ažuriraju sedmično kako scraperi prolaze kroz prodavnice.
              </p>
            </div>
          </section>

          {/* FAQ */}
          <section id="faq" className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Česta pitanja</h2>
            <div className="space-y-4">
              {faqItems.map(({ q, a }, i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                  <h3 className="font-semibold text-slate-900 mb-2">{q}</h3>
                  <p className="text-[15px] leading-relaxed text-slate-700">{a}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Internal links */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Korisni linkovi</h2>
            <div className="flex flex-wrap gap-3">
              <Link href="/vodici/whey-protein-za-pocetnike" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Whey protein za početnike — detaljan vodič
              </Link>
              <Link href="/najbolji-whey-protein-srbija" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Najbolji whey protein u Srbiji — šira lista
              </Link>
              <Link href="/vodici/koliko-proteina-dnevno" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Koliko proteina dnevno?
              </Link>
              <Link href="/vodici/koliko-novca-mesecno-za-proteine" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Koliko novca mesečno za proteine?
              </Link>
              <Link href="/vodici/whey-isolate-vs-concentrate" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Isolate vs Concentrate
              </Link>
            </div>
          </section>

          {/* CTA */}
          <div className="bg-[#1B2B4B] rounded-2xl p-6 text-white text-center mb-10">
            <p className="text-base leading-relaxed mb-4">
              Uporedi sve proteine za početnike po ceni, sastavu i Value Score-u na jednom mestu.
            </p>
            <Link
              href="/kategorija/whey-concentrate?sort=valueScore,desc"
              className="inline-block px-6 py-3 bg-[#FF9900] hover:bg-[#e68a00] text-[#131921] font-bold rounded-xl text-sm transition-colors"
            >
              Uporedi whey concentrate proteine →
            </Link>
          </div>

          <GuideDisclaimer />

          <VodiciNav currentSlug="najbolji-protein-za-pocetnike" />
        </main>
      </div>
    </>
  );
}
