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
  title: { absolute: "Dymatize ISO100 — recenzija, sastav i cene u Srbiji 2026 | Proteinoteka" },
  description:
    "Šta ISO100 zapravo nudi za tu cenu: hidrolizovani izolat, 25g proteina po porciji, NSF Certified for Sport. Poređenje sa jeftinijim Elite Whey i aktuelne cene iz svih srpskih prodavnica.",
  alternates: { canonical: `https://${MARKET_CONFIG[CURRENT_MARKET].domain}/vodici/dymatize-iso-100-recenzija` },
  openGraph: {
    title: "Dymatize ISO100 — recenzija, sastav i cene u Srbiji 2026 | Proteinoteka",
    description:
      "Šta ISO100 zapravo nudi za tu cenu: hidrolizovani izolat, 25g proteina po porciji, NSF Certified for Sport. Poređenje sa jeftinijim Elite Whey i aktuelne cene iz svih srpskih prodavnica.",
    url: `https://${MARKET_CONFIG[CURRENT_MARKET].domain}/vodici/dymatize-iso-100-recenzija`,
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
  { id: "o-brendu", title: "Dymatize i ISO100 — zašto je toliko traženo ime" },
  { id: "sastav", title: "ISO100 — nutritivni sastav" },
  { id: "hidroliza", title: "Šta hidroliza znači u praksi", level: 3 },
  { id: "elite-whey", title: "Elite Whey — jeftinija linija istog brenda" },
  { id: "razlika", title: "ISO100 ili Elite Whey — koji odabrati" },
  { id: "sertifikat", title: "NSF Certified for Sport — šta taj sertifikat znači" },
  { id: "alternative", title: "Poređenje sa ostalim whey izolatima u Srbiji" },
  { id: "live-cene", title: "Aktuelne cene Dymatize u Srbiji" },
  { id: "faq", title: "Česta pitanja" },
];

const faqItems = [
  {
    q: "Da li Dymatize ISO100 vredi svoju cenu?",
    a: "Za rekreativca bez posebnih ograničenja — delimično. Plaćaš premiju za hidrolizu i čistoću koje daju marginalno bržu apsorpciju, ali ne i merljivo bolji rast mišića u odnosu na standardni whey izolat iste čistoće. Ima jasnog smisla ako ti je bitna brzina apsorpcije, minimalni ugljeni hidrati i masti, ili nezavisno testiran proizvod (NSF Certified for Sport).",
  },
  {
    q: "Koja je razlika između ISO100 i Elite Whey?",
    a: "ISO100 je hidrolizovani whey izolat — čistiji, brže se apsorbuje, skuplji. Elite Whey je whey concentrate/isolate blend — nešto viši sadržaj ugljenih hidrata i masti po porciji, ali znatno niža cena po gramu proteina. Za većinu korisnika Elite Whey odrađuje isti posao.",
  },
  {
    q: "Da li je ISO100 dobar izbor za laktoznu intoleranciju?",
    a: "Da. Kao whey izolat, ISO100 sadrži ispod 1g ugljenih hidrata po porciji i praktično zanemarljivu količinu laktoze — najčistija opcija u Dymatize asortimanu za osobe koje standardni whey concentrate loše podnose.",
  },
  {
    q: "Šta znači NSF Certified for Sport sertifikat?",
    a: "To je nezavisno testiranje koje potvrđuje da proizvod ne sadrži supstance zabranjene u profesionalnom sportu (doping liste WADA, NFL, MLB i drugih liga). Za rekreativca to prvenstveno znači dodatnu garanciju da sadržaj na deklaraciji odgovara stvarnom sastavu — relevantno je i van takmičarskog sporta kao znak kvaliteta proizvodnje.",
  },
  {
    q: "Gde je Dymatize ISO100 najjeftiniji u Srbiji?",
    a: "Cena varira po prodavnici i pakovanju, često i 15-20% za identičan proizvod. Tabela ispod poredi aktuelne cene iz svih srpskih prodavnica koje pratimo, sortirane po value score-u.",
  },
  {
    q: "Koliko traje jedno pakovanje ISO100?",
    a: "Standardno pakovanje od ~2.2kg (oko 74 porcije od 30g) traje otprilike mesec i po dana pri dve porcije dnevno, ili i preko dva meseca uz jednu porciju dnevno. Manja pakovanja (~900g) su dobra za probavanje ukusa pre kupovine većeg pakovanja.",
  },
];

function ppg(p: Product): number | null {
  if (!p.numericPrice || !p.primaryWeightGrams || !p.proteinPer100g) return null;
  const totalProt = p.primaryWeightGrams * (p.proteinPer100g / 100);
  if (totalProt <= 0) return null;
  return p.numericPrice / totalProt;
}

const BASE = `https://${MARKET_CONFIG[CURRENT_MARKET].domain}`;
const SLUG = "/vodici/dymatize-iso-100-recenzija";

export default async function Page() {
  if (CURRENT_MARKET !== 'rs') notFound();
  const [dymatizeProducts, wpiTop] = await Promise.all([
    fetchBrandProducts({ brand: "Dymatize Nutrition", limit: 50 }),
    fetchTopProducts({ category: "whey_isolate", sortBy: "valueScore", limit: 3 }),
  ]);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Dymatize ISO100 — recenzija, sastav i aktuelne cene u Srbiji",
      datePublished: "2026-08-01",
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
        { "@type": "ListItem", position: 3, name: "Dymatize ISO100 — recenzija", item: `${BASE}${SLUG}` },
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
            <span className="text-slate-600">Dymatize ISO100 — recenzija</span>
          </nav>

          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-4">
              Dymatize ISO100 — sastav, sertifikat i aktuelne cene u Srbiji
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
                "ISO100 je hidrolizovani whey izolat — 25g proteina po porciji od ~30g, ispod 1g ugljenih hidrata, ispod 0.5g masti.",
                "NSF Certified for Sport — nezavisno testiran na zabranjene supstance, dodatna garancija kvaliteta.",
                "Elite Whey je jeftinija linija istog brenda — WPC/WPI blend, dovoljan za većinu korisnika bez posebnih ograničenja.",
                "Viša cena ISO100 ima najviše smisla kod laktozne intolerancije ili strogog praćenja makronutrijenata.",
                "Cene variraju i do 15-20% između srpskih prodavnica — tabela ispod poredi aktuelno stanje.",
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
            <h2 className="text-xl font-bold text-slate-900 mb-4">Dymatize i ISO100 — zašto je toliko traženo ime</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Dymatize je američki proizvođač suplemenata, a ISO100 je njegov flagship proizvod — jedan od najprepoznatljivijih hidrolizovanih whey izolata na globalnom tržištu. Kod nas se traži gotovo isključivo po imenu proizvoda, ne po brendu, što je znak koliko je linija samostalno izgradila reputaciju.
              </p>
              <p>
                U Dymatize asortimanu koji je dostupan u srpskim prodavnicama, dva proizvoda dominiraju: <strong>ISO100</strong> (hidrolizovani izolat, premium segment) i <strong>Elite Whey</strong> (concentrate/isolate blend, pristupačnija cena). Razlika između njih nije marketinška — menja se i sastav i cena po gramu proteina.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section className="mb-10" id="sastav">
            <h2 className="text-xl font-bold text-slate-900 mb-4">ISO100 — nutritivni sastav</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>Standardna porcija od ~30g (jedna kašika) sadrži:</p>
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
                    <tr><td className="px-4 py-3 text-slate-700">Proteini</td><td className="px-4 py-3 text-right font-medium text-slate-900">~25g</td><td className="px-4 py-3 text-right text-slate-600">~79-88g</td></tr>
                    <tr><td className="px-4 py-3 text-slate-700">Ugljeni hidrati</td><td className="px-4 py-3 text-right font-medium text-slate-900">&lt;1g</td><td className="px-4 py-3 text-right text-slate-600">&lt;3g</td></tr>
                    <tr><td className="px-4 py-3 text-slate-700">Masti</td><td className="px-4 py-3 text-right font-medium text-slate-900">&lt;0.5g</td><td className="px-4 py-3 text-right text-slate-600">&lt;2g</td></tr>
                    <tr><td className="px-4 py-3 text-slate-700">Kalorije</td><td className="px-4 py-3 text-right font-medium text-slate-900">~100-110 kcal</td><td className="px-4 py-3 text-right text-slate-600">~360-380 kcal</td></tr>
                  </tbody>
                </table>
              </div>
              <p className="text-[13px] text-slate-500">
                Tačan sadržaj proteina zavisi od ukusa i serije proizvodnje — u tabeli &quot;Aktuelne cene&quot; ispod vidiš stvarne vrednosti za konkretna pakovanja koja trenutno prate srpske prodavnice.
              </p>
              <p>
                Ovo je gornji kraj whey izolat segmenta — za poređenje šta razlikuje izolat od standardnog koncentrata, pogledaj vodič{" "}
                <Link href="/vodici/whey-isolate-vs-concentrate" className="text-[#FF9900] hover:underline font-medium">Whey Isolate vs Concentrate</Link>.
              </p>
            </div>

            <h3 id="hidroliza" className="text-[17px] font-bold text-slate-800 mt-6 mb-3">Šta hidroliza znači u praksi</h3>
            <div className="space-y-3 text-[15px] leading-relaxed text-slate-700">
              <p>
                Hidroliza je dodatni korak obrade u kom su proteinski lanci enzimima već delimično razloženi na manje peptide, pre nego što ih uopšte popiješ. Rezultat je nešto brža apsorpcija u odnosu na standardni izolat — u praksi razlika koju rekreativac oseti je minimalna, ali je merljiva u laboratorijskim uslovima. To je i glavni razlog zašto je ISO100 skuplji od Elite Whey po gramu proteina.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section className="mb-10" id="elite-whey">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Elite Whey — jeftinija linija istog brenda</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Elite Whey je whey concentrate/isolate blend — nema hidrolizu, ima nešto viši sadržaj ugljenih hidrata i masti po porciji, ali je po gramu proteina znatno jeftiniji od ISO100. Za nekog ko trenira rekreativno i nema intoleranciju na laktozu, Elite Whey daje praktično isti rezultat za manji trošak mesečno.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section className="mb-10" id="razlika">
            <h2 className="text-xl font-bold text-slate-900 mb-4">ISO100 ili Elite Whey — koji odabrati</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-[14px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-4 py-3 font-semibold text-slate-700"></th>
                      <th className="text-center px-4 py-3 font-semibold text-slate-700">ISO100</th>
                      <th className="text-center px-4 py-3 font-semibold text-slate-700">Elite Whey</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[13px]">
                    <tr>
                      <td className="px-4 py-3 text-slate-600">Tip</td>
                      <td className="px-4 py-3 text-center text-slate-700">Hidrolizovani WPI</td>
                      <td className="px-4 py-3 text-center text-slate-700">WPC + WPI blend</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-slate-600">Proteini/100g</td>
                      <td className="px-4 py-3 text-center text-slate-700">~79-88g*</td>
                      <td className="px-4 py-3 text-center text-slate-700">~72-85g*</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-slate-600">Laktoza</td>
                      <td className="px-4 py-3 text-center text-slate-700">Minimalna</td>
                      <td className="px-4 py-3 text-center text-slate-700">Prisutna</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-slate-600">Cena po gramu proteina</td>
                      <td className="px-4 py-3 text-center text-slate-700">Viša</td>
                      <td className="px-4 py-3 text-center text-slate-700">Niža</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-slate-600">Za koga</td>
                      <td className="px-4 py-3 text-center text-slate-700">Intolerancija, strogi makroi, testiran proizvod</td>
                      <td className="px-4 py-3 text-center text-slate-700">Većina korisnika</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-[13px] text-slate-500">
                * Raspon zavisi od ukusa i serije proizvodnje — pojedina pakovanja Elite Whey znaju imati sličan ili čak nešto viši procenat proteina po 100g od pojedinih ISO100 pakovanja. Formula (hidroliza, minimalna laktoza) je razlika koja se ne vidi u jednoj brojci, već u brzini apsorpcije i čistoći sastava.
              </p>
              <p>
                Za rekreativca bez posebnih ograničenja u ishrani, <strong>Elite Whey</strong> daje isti praktičan rezultat po nižoj ceni. <strong>ISO100</strong> ima smisla kad postoji konkretan razlog — laktozna intolerancija, praćenje makronutrijenata do grama, ili potreba za nezavisno testiranim proizvodom.
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section className="mb-10" id="sertifikat">
            <h2 className="text-xl font-bold text-slate-900 mb-4">NSF Certified for Sport — šta taj sertifikat znači</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                ISO100 ističe NSF Certified for Sport sertifikat — nezavisno testiranje koje potvrđuje da proizvod ne sadrži supstance sa liste zabranjenih supstanci (WADA i profesionalne lige poput NFL i MLB). Za takmičarske sportiste to je praktično neophodno. Za rekreativca je manje kritično, ali i dalje relevantno kao znak da proizvodnja ima dodatnu spoljnu kontrolu kvaliteta — sadržaj na deklaraciji je nezavisno proveren, ne samo tvrdnja proizvođača.
              </p>
              <p className="text-[14px] text-slate-500">
                Proteinoteka prati isključivo cene i dostupnost proizvoda u srpskim prodavnicama — za proveru autentičnosti sertifikata i porekla konkretnog pakovanja, kupuj isključivo iz ovlašćenih prodavnica.
              </p>
            </div>
          </section>

          {/* Section 6 — WPI comparison */}
          <section className="mb-10" id="alternative">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Poređenje sa ostalim whey izolatima u Srbiji</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                ISO100 nije jedini whey izolat na srpskom tržištu. Ovo su trenutno najisplativiji izolati po value score-u — dobra referenca pri poređenju:
              </p>
              {wpiTop.length > 0 ? (
                <div className="space-y-3">
                  {wpiTop.map((p) => {
                    const din = ppg(p);
                    return (
                      <Link
                        key={p.id}
                        href={productUrl(p)}
                        className="flex items-start gap-4 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:border-[#FF9900] hover:shadow-md transition-all group"
                      >
                        {p.imageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
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
                  <Link href="/kategorija/whey-isolate?sort=valueScore,desc" className="text-[#FF9900] hover:underline">sve whey izolate sortirane po value score</Link>.
                </p>
              )}
              <p className="text-sm text-slate-500">Živa lista — ažurira se automatski kako se menjaju cene u prodavnicama.</p>
            </div>
          </section>

          {/* Section 7 — Live Dymatize */}
          <section className="mb-10" id="live-cene">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Aktuelne cene Dymatize u Srbiji</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Svi Dymatize proizvodi koje trenutno pratimo u srpskim prodavnicama, sortirani po value score. Cene se ažuriraju redovno.
              </p>
              {dymatizeProducts.length > 0 ? (
                <div className="space-y-3">
                  {dymatizeProducts.slice(0, 10).map((p) => {
                    const din = ppg(p);
                    return (
                      <Link
                        key={p.id}
                        href={productUrl(p)}
                        className="flex items-start gap-4 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:border-[#FF9900] hover:shadow-md transition-all group"
                      >
                        {p.imageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
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
                    <Link href="/dymatize-proteini" className="text-[#FF9900] hover:underline font-medium">
                      Pogledaj sve Dymatize ponude →
                    </Link>
                  </p>
                </div>
              ) : (
                <p className="text-slate-500 text-sm">
                  Podaci se privremeno ne učitavaju. Sve ponude vidiš na strani{" "}
                  <Link href="/dymatize-proteini" className="text-[#FF9900] hover:underline">Dymatize proteini u Srbiji</Link>.
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
              <Link href="/dymatize-proteini" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Sve Dymatize ponude
              </Link>
              <Link href="/whey-protein-cena" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Whey protein cena u Srbiji
              </Link>
              <Link href="/vodici/whey-isolate-vs-concentrate" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Isolate vs Concentrate
              </Link>
              <Link href="/najbolji-whey-protein-srbija" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Najbolji whey protein 2026
              </Link>
            </div>
          </section>

          <GuideDisclaimer />
        </main>
        <VodiciNav currentSlug="dymatize-iso-100-recenzija" />
      </div>
    </>
  );
}
