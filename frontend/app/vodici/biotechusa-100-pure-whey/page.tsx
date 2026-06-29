import { notFound } from "next/navigation";
import { CURRENT_MARKET, MARKET_CONFIG } from '@/lib/marketConfig';
import { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import VodiciNav from "@/components/VodiciNav";
import GuideToc, { TocSection } from "@/components/GuideToc";
import GuideDisclaimer from "@/components/GuideDisclaimer";
import { fetchBrandProducts, fetchTopProducts } from "@/lib/seo-data";
import { Product } from "@/types/product";
import { productUrl } from "@/lib/productUrl";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: "BioTech USA 100% Pure Whey i ISO Whey Zero — recenzija i cene u Srbiji 2026 | Proteinoteka" },
  description:
    "Razlika između BioTech USA 100% Pure Whey i ISO Whey Zero, nutritivni sastav i aktuelne cene iz svih srpskih prodavnica na jednom mestu — ažurirano automatski.",
  alternates: { canonical: `https://${MARKET_CONFIG[CURRENT_MARKET].domain}/vodici/biotechusa-100-pure-whey` },
  openGraph: {
    title: "BioTech USA 100% Pure Whey i ISO Whey Zero — recenzija i cene u Srbiji 2026 | Proteinoteka",
    description:
      "Razlika između BioTech USA 100% Pure Whey i ISO Whey Zero, nutritivni sastav i aktuelne cene iz svih srpskih prodavnica na jednom mestu — ažurirano automatski.",
    url: `https://${MARKET_CONFIG[CURRENT_MARKET].domain}/vodici/biotechusa-100-pure-whey`,
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

const TOC: TocSection[] = [
  { id: "o-brendu", title: "BioTech USA — odakle dolazi i zašto je popularan?" },
  { id: "pure-whey-sastav", title: "100% Pure Whey — nutritivni sastav" },
  { id: "iso-whey-zero", title: "ISO Whey Zero — šta se dobija za višu cenu?" },
  { id: "razlika", title: "Pure Whey ili ISO Whey Zero — koji birati?" },
  { id: "alternative", title: "Poređenje sa ostalim whey proteinima u Srbiji" },
  { id: "live-cene", title: "Aktuelne cene BioTech USA u Srbiji" },
  { id: "faq", title: "Česta pitanja" },
];

const faqItems = [
  {
    q: "Da li je BioTech USA 100% Pure Whey concentrate ili isolate?",
    a: "100% Pure Whey je concentrate/isolate blend — whey concentrate je primarna sirovina, uz dodatak whey isolate-a. Sadrži oko 78–80g proteina na 100g praška. Dobar izbor za većinu korisnika koji nemaju posebne potrebe vezane za laktozu.",
  },
  {
    q: "Koliko proteina ima BioTech USA ISO Whey Zero po porciji?",
    a: "ISO Whey Zero sadrži oko 86g proteina na 100g praška, tj. ~23g po standardnoj porciji od 25g. Formulisan je kao protein bez laktoze i bez šećera, baziran na whey izolatu.",
  },
  {
    q: "Da li je BioTech USA ISO Whey Zero dobar za laktoznu intoleranciju?",
    a: "Da — ISO Whey Zero je baziran na whey protein izolatu koji prirodno sadrži minimalne količine laktoze. Pogodan za osobe sa umerenom intolerancijom. Za tešku intoleranciju preporučujemo konsultaciju sa lekarom.",
  },
  {
    q: "Gde je BioTech USA protein najjeftiniji u Srbiji?",
    a: "Cena varira između prodavnica i može se razlikovati i 15–25% za isto pakovanje. U tabeli ispod poredimo aktuelne cene iz svih srpskih prodavnica koje pratimo, sortirane po value score.",
  },
  {
    q: "Da li BioTech USA ima proteina za vegane?",
    a: "BioTech USA nudi i biljne proteine (soja, grašak) u svom asortimanu, ali su manje zastupljeni od whey linije. Za pregled dostupnih biljnih proteina u Srbiji pogledaj kategoriju biljnih proteina na Proteinoteci.",
  },
  {
    q: "Kako da pratim cenu BioTech USA proteina i dobijem obaveštenje kad padne?",
    a: "Na Proteinoteci možeš aktivirati besplatan price alert za bilo koji BioTech USA proizvod — bez registracije, samo uneseš email i ciljnu cenu. Kad cena padne ispod te vrednosti u nekoj od prodavnica, dobijaš email obaveštenje.",
  },
];

function ppg(p: Product): number | null {
  if (!p.numericPrice || !p.primaryWeightGrams || !p.proteinPer100g) return null;
  const totalProt = p.primaryWeightGrams * (p.proteinPer100g / 100);
  if (totalProt <= 0) return null;
  return p.numericPrice / totalProt;
}

const BASE = `https://${MARKET_CONFIG[CURRENT_MARKET].domain}`;
const SLUG = "/vodici/biotechusa-100-pure-whey";

export default async function Page() {
  if (CURRENT_MARKET !== 'rs') notFound();
  const [primary, alias, wpcTop] = await Promise.all([
    fetchBrandProducts({ brand: "BioTech USA", limit: 50 }),
    fetchBrandProducts({ brand: "Biotech", limit: 50 }),
    fetchTopProducts({ category: "whey_concentrate", sortBy: "valueScore", limit: 3 }),
  ]);

  const seen = new Set<number>();
  const btProducts = [...primary, ...alias].filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "BioTech USA 100% Pure Whey i ISO Whey Zero — recenzija i aktuelne cene u Srbiji",
      datePublished: "2026-06-19",
      dateModified: new Date().toISOString().split("T")[0],
      author: { "@type": "Organization", name: "Proteinoteka", url: BASE },
      publisher: { "@type": "Organization", name: "Proteinoteka", url: BASE },
      url: `${BASE}${SLUG}`,
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
        { "@type": "ListItem", position: 3, name: "BioTech USA 100% Pure Whey — recenzija", item: `${BASE}${SLUG}` },
      ],
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="max-w-3xl mx-auto px-4 py-10">

          <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-8 flex-wrap">
            <Link href="/" className="hover:text-[#FF9900] transition-colors">Početna</Link>
            <span>/</span>
            <Link href="/vodici" className="hover:text-[#FF9900] transition-colors">Vodiči</Link>
            <span>/</span>
            <span className="text-slate-600">BioTech USA 100% Pure Whey — recenzija</span>
          </nav>

          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-4">
              BioTech USA 100% Pure Whey i ISO Whey Zero — sastav i aktuelne cene u Srbiji
            </h1>
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <span>6 min čitanja</span>
              <span>·</span>
              <span>Ažurirano: {new Date().toLocaleDateString("sr-RS", { month: "long", year: "numeric" })}</span>
            </div>
          </div>

          {/* TL;DR */}
          <div className="mb-8 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[13px] font-bold text-slate-400 uppercase tracking-wider mb-3">Ukratko</p>
            <div className="space-y-2">
              {[
                "BioTech USA je mađarski brend osnovan 1990. — jedan od najpopularnijih u Srbiji zbog pristupačnih cena i široke distribucije.",
                "100% Pure Whey je concentrate/isolate blend sa ~78–80g proteina/100g — dobar izbor za većinu korisnika.",
                "ISO Whey Zero je čisti whey izolat sa ~86g proteina/100g, bez laktoze i šećera — skuplje, ali namenski za osobe sa intolerancijom.",
                "Value score pokazuje koje BioTech USA pakovanje trenutno daje najviše proteina za novac.",
                "Cene variraju između srpskih prodavnica — tabela ispod prikazuje aktuelno stanje iz svih prodavnica.",
              ].map((fact) => (
                <div key={fact} className="flex gap-2.5 text-[15px] text-slate-700 leading-snug">
                  <span className="text-[#FF9900] font-bold shrink-0 mt-0.5">→</span>
                  <span>{fact}</span>
                </div>
              ))}
            </div>
          </div>

          <GuideToc sections={TOC} />

          {/* Section 1 */}
          <section className="mb-10" id="o-brendu">
            <h2 className="text-xl font-bold text-slate-900 mb-4">BioTech USA — odakle dolazi i zašto je popularan?</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                BioTech USA je mađarski brend osnovan 1990. godine u Budimpešti. Jedan je od najvećih evropskih proizvođača prehrambenih suplemenata i posebno je popularan u Srbiji i širem regionu. Razlog je kombinacija pristupačne cene, dobre distribucije kroz domaće prodavnice i relativno velikog broja ukusa.
              </p>
              <p>
                Dva najtraženija BioTech USA proteina u Srbiji su <strong>100% Pure Whey</strong> (concentrate/isolate blend, niža cena) i <strong>ISO Whey Zero</strong> (čisti whey izolat, bez laktoze). Razlika između njih nije samo u ceni — razlikuje se i sastav, pa je važno znati koji odgovara tvom cilju.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section className="mb-10" id="pure-whey-sastav">
            <h2 className="text-xl font-bold text-slate-900 mb-4">100% Pure Whey — nutritivni sastav</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                BioTech USA 100% Pure Whey je concentrate/isolate blend. Standardna porcija od ~30g sadrži:
              </p>
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-[14px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-4 py-3 font-semibold text-slate-700">Nutrient</th>
                      <th className="text-right px-4 py-3 font-semibold text-slate-700">Na porciju (~30g)</th>
                      <th className="text-right px-4 py-3 font-semibold text-slate-700">Na 100g</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr><td className="px-4 py-3 text-slate-700">Proteini</td><td className="px-4 py-3 text-right font-medium text-slate-900">~23–24g</td><td className="px-4 py-3 text-right text-slate-600">~78–80g</td></tr>
                    <tr><td className="px-4 py-3 text-slate-700">Ugljeni hidrati</td><td className="px-4 py-3 text-right font-medium text-slate-900">~3–4g</td><td className="px-4 py-3 text-right text-slate-600">~10–13g</td></tr>
                    <tr><td className="px-4 py-3 text-slate-700">Masti</td><td className="px-4 py-3 text-right font-medium text-slate-900">~1.5–2g</td><td className="px-4 py-3 text-right text-slate-600">~5–7g</td></tr>
                    <tr><td className="px-4 py-3 text-slate-700">Kalorije</td><td className="px-4 py-3 text-right font-medium text-slate-900">~115–125 kcal</td><td className="px-4 py-3 text-right text-slate-600">~385–415 kcal</td></tr>
                  </tbody>
                </table>
              </div>
              <p>
                ~78–80g proteina na 100g praška spada u gornji kraj standardnog whey concentrate segmenta. Za poređenje: prosek WPC-a na tržištu je 70–80g/100g. Više o tome šta znači ta razlika u vodiču{" "}
                <Link href="/vodici/whey-isolate-vs-concentrate" className="text-[#FF9900] hover:underline font-medium">Whey Isolate vs Concentrate</Link>.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section className="mb-10" id="iso-whey-zero">
            <h2 className="text-xl font-bold text-slate-900 mb-4">ISO Whey Zero — šta se dobija za višu cenu?</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                ISO Whey Zero je whey protein izolat (WPI) — prečišćeniji oblik proteina sa višim sadržajem proteina i manjom količinom laktoze i masti u odnosu na standardni concentrate.
              </p>
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-[14px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-4 py-3 font-semibold text-slate-700">Nutrient</th>
                      <th className="text-right px-4 py-3 font-semibold text-slate-700">Na porciju (~25g)</th>
                      <th className="text-right px-4 py-3 font-semibold text-slate-700">Na 100g</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr><td className="px-4 py-3 text-slate-700">Proteini</td><td className="px-4 py-3 text-right font-medium text-slate-900">~21–23g</td><td className="px-4 py-3 text-right text-slate-600">~86g</td></tr>
                    <tr><td className="px-4 py-3 text-slate-700">Ugljeni hidrati</td><td className="px-4 py-3 text-right font-medium text-slate-900">&lt;1g</td><td className="px-4 py-3 text-right text-slate-600">&lt;3g</td></tr>
                    <tr><td className="px-4 py-3 text-slate-700">Masti</td><td className="px-4 py-3 text-right font-medium text-slate-900">&lt;0.5g</td><td className="px-4 py-3 text-right text-slate-600">&lt;2g</td></tr>
                    <tr><td className="px-4 py-3 text-slate-700">Kalorije</td><td className="px-4 py-3 text-right font-medium text-slate-900">~90–95 kcal</td><td className="px-4 py-3 text-right text-slate-600">~360–380 kcal</td></tr>
                  </tbody>
                </table>
              </div>
              <p>
                ~86g proteina na 100g i gotovo bez laktoze i šećera. Viša cena u poređenju sa Pure Whey je opravdana za osobe sa intolerancijom na laktozu ili one koji prate makroe i žele minimalan unos ugljenih hidrata i masti iz suplementa.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section className="mb-10" id="razlika">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Pure Whey ili ISO Whey Zero — koji birati?</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-[14px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-4 py-3 font-semibold text-slate-700"></th>
                      <th className="text-center px-4 py-3 font-semibold text-slate-700">100% Pure Whey</th>
                      <th className="text-center px-4 py-3 font-semibold text-slate-700">ISO Whey Zero</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[13px]">
                    <tr>
                      <td className="px-4 py-3 text-slate-600">Tip</td>
                      <td className="px-4 py-3 text-center text-slate-700">WPC + WPI blend</td>
                      <td className="px-4 py-3 text-center text-slate-700">Čisti WPI</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-slate-600">Proteini/100g</td>
                      <td className="px-4 py-3 text-center text-slate-700">~78–80g</td>
                      <td className="px-4 py-3 text-center text-slate-700">~86g</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-slate-600">Laktoza</td>
                      <td className="px-4 py-3 text-center text-slate-700">Da (mala količina)</td>
                      <td className="px-4 py-3 text-center text-slate-700">Minimalna</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-slate-600">Cena</td>
                      <td className="px-4 py-3 text-center text-slate-700">Niža</td>
                      <td className="px-4 py-3 text-center text-slate-700">Viša</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-slate-600">Za koga</td>
                      <td className="px-4 py-3 text-center text-slate-700">Većina korisnika</td>
                      <td className="px-4 py-3 text-center text-slate-700">Intolerancija, strogi makroi</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                Za rekreativce i sportiste bez posebnih ograničenja u ishrani, <strong>100% Pure Whey</strong> je isplativiji izbor. <strong>ISO Whey Zero</strong> je opravdan kada postoji specifičan razlog — intolerancija na laktozu ili precizno praćenje unosa makronutrijenata.
              </p>
            </div>
          </section>

          {/* Section 5 — WPC comparison */}
          <section className="mb-10" id="alternative">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Poređenje sa ostalim whey proteinima u Srbiji</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                BioTech USA redovno se nalazi u vrhu liste najpopularnijih proteina u Srbiji. Ovo su trenutno najisplativiji whey koncentrati dostupni na tržištu po value score-u — za referencu pri poređenju:
              </p>
              {wpcTop.length > 0 ? (
                <div className="space-y-3">
                  {wpcTop.map((p) => {
                    const din = ppg(p);
                    return (
                      <Link
                        key={p.id}
                        href={productUrl(p)}
                        className="flex items-start gap-4 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:border-[#FF9900] hover:shadow-md transition-all group"
                      >
                        {p.imageUrl && (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="w-16 h-16 object-contain rounded-lg shrink-0 bg-slate-50"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-900 group-hover:text-[#FF9900] transition-colors text-sm leading-snug mb-1">
                            {p.name}
                          </p>
                          <p className="text-xs text-slate-500 mb-2">{p.brand}</p>
                          <div className="flex items-center gap-3 flex-wrap">
                            {p.numericPrice && (
                              <span className="text-sm font-bold text-slate-900">
                                {p.numericPrice.toLocaleString("sr-RS")} RSD
                              </span>
                            )}
                            {din && (
                              <span className="text-xs text-slate-500">
                                {din.toFixed(1)} din/g proteina
                              </span>
                            )}
                            {p.valueScore != null && (
                              <span className="text-xs bg-[#FFF3D6] text-[#b36b00] font-semibold px-2 py-0.5 rounded-full">
                                VS {p.valueScore.toFixed(1)}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <p className="text-slate-500 text-sm">
                  Učitavanje aktuelnih podataka nije uspelo — pogledaj{" "}
                  <Link href="/?sort=valueScore,desc" className="text-[#FF9900] hover:underline">sve proteine sortirane po value score</Link>.
                </p>
              )}
              <p className="text-sm text-slate-500">Živa lista — ažurira se automatski kako se menjaju cene u prodavnicama.</p>
            </div>
          </section>

          {/* Section 6 — Live BioTech */}
          <section className="mb-10" id="live-cene">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Aktuelne cene BioTech USA u Srbiji</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Sve BioTech USA varijante koje trenutno pratimo u srpskim prodavnicama, sortirane po value score. Cene se ažuriraju redovno.
              </p>
              {btProducts.length > 0 ? (
                <div className="space-y-3">
                  {btProducts.slice(0, 10).map((p) => {
                    const din = ppg(p);
                    return (
                      <Link
                        key={p.id}
                        href={productUrl(p)}
                        className="flex items-start gap-4 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:border-[#FF9900] hover:shadow-md transition-all group"
                      >
                        {p.imageUrl && (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="w-16 h-16 object-contain rounded-lg shrink-0 bg-slate-50"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-900 group-hover:text-[#FF9900] transition-colors text-sm leading-snug mb-1">
                            {p.name}
                          </p>
                          <p className="text-xs text-slate-500 mb-2">
                            {p.storeName}
                            {p.primaryWeightGrams && ` · ${p.primaryWeightGrams}g`}
                          </p>
                          <div className="flex items-center gap-3 flex-wrap">
                            {p.numericPrice && (
                              <span className="text-sm font-bold text-slate-900">
                                {p.numericPrice.toLocaleString("sr-RS")} RSD
                              </span>
                            )}
                            {din && (
                              <span className="text-xs text-slate-500">
                                {din.toFixed(1)} din/g proteina
                              </span>
                            )}
                            {p.valueScore != null && (
                              <span className="text-xs bg-[#FFF3D6] text-[#b36b00] font-semibold px-2 py-0.5 rounded-full">
                                VS {p.valueScore.toFixed(1)}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                  <p className="text-sm text-slate-500 text-center pt-2">
                    <Link href="/biotech-usa-proteini" className="text-[#FF9900] hover:underline font-medium">
                      Pogledaj sve BioTech USA ponude →
                    </Link>
                  </p>
                </div>
              ) : (
                <p className="text-slate-500 text-sm">
                  Podaci se privremeno ne učitavaju. Sve ponude vidiš na strani{" "}
                  <Link href="/biotech-usa-proteini" className="text-[#FF9900] hover:underline">BioTech USA proteini u Srbiji</Link>.
                </p>
              )}
            </div>
          </section>

          {/* FAQ */}
          <section className="mb-10" id="faq">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Česta pitanja</h2>
            <div className="space-y-4">
              {faqItems.map(({ q, a }) => (
                <div key={q} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <p className="font-semibold text-slate-900 mb-2 text-[15px]">{q}</p>
                  <p className="text-[14px] text-slate-600 leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Korisni vodiči</h2>
            <div className="flex flex-wrap gap-3">
              <Link href="/whey-protein-cena" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Whey protein cena u Srbiji
              </Link>
              <Link href="/najjeftiniji-whey-protein" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Najjeftiniji whey protein
              </Link>
              <Link href="/najbolji-whey-protein-srbija" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Najbolji whey protein 2026
              </Link>
              <Link href="/vodici/whey-isolate-vs-concentrate" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Isolate vs Concentrate
              </Link>
            </div>
          </section>

          <GuideDisclaimer />
        </main>
        <VodiciNav currentSlug="biotechusa-100-pure-whey" />
      </div>
    </>
  );
}
