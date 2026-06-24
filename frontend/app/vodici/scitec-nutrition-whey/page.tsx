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
  title: { absolute: "Scitec Nutrition 100% Whey Protein — recenzija i cene u Srbiji 2026 | Proteinoteka" },
  description:
    "Scitec Nutrition 100% Whey Protein Professional — nutritivni sastav, razlika između ukusa i pakovanja, i aktuelne cene iz svih srpskih prodavnica. Ažurirano automatski.",
  alternates: { canonical: "https://proteinoteka.rs/vodici/scitec-nutrition-whey" },
  openGraph: {
    title: "Scitec Nutrition 100% Whey Protein — recenzija i cene u Srbiji 2026 | Proteinoteka",
    description:
      "Nutritivni sastav Scitec Nutrition 100% Whey Protein Professional, aktuelne cene iz srpskih prodavnica i poređenje sa ostalim whey proteinima po value score.",
    url: "https://proteinoteka.rs/vodici/scitec-nutrition-whey",
    siteName: "Proteinoteka",
    locale: "sr_RS",
    type: "article",
    images: [{ url: "https://proteinoteka.rs/opengraph-image", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["https://proteinoteka.rs/opengraph-image"],
  },
};

const TOC: TocSection[] = [
  { id: "o-brendu", title: "Scitec Nutrition — odakle dolazi i zašto je popularan?" },
  { id: "whey-professional-sastav", title: "100% Whey Protein Professional — nutritivni sastav" },
  { id: "whey-vs-professional", title: "Whey Protein vs Whey Professional — koja je razlika?" },
  { id: "pakovanja-ukusi", title: "Pakovanja i ukusi dostupni u Srbiji" },
  { id: "alternative", title: "Poređenje sa ostalim whey proteinima u Srbiji" },
  { id: "live-cene", title: "Aktuelne cene Scitec Nutrition u Srbiji" },
  { id: "faq", title: "Česta pitanja" },
];

const faqItems = [
  {
    q: "Da li je Scitec Nutrition 100% Whey Protein concentrate ili isolate?",
    a: "Scitec Nutrition 100% Whey Protein Professional je concentrate/isolate blend. Whey protein concentrate je primarna sirovina, uz dodatak whey protein izolata. Sadrži oko 74–77g proteina na 100g praška, što je solidan rezultat za concentrate/blend segment.",
  },
  {
    q: "Koliko proteina ima Scitec Nutrition Whey po porciji?",
    a: "Standardna porcija od ~30g sadrži oko 22–23g proteina, u zavisnosti od ukusa. Ukusi sa čokoladom ili karamelom mogu imati blago drugačiji nutritivni profil od neutralnih ukusa — uvek proveri etiketu konkretnog pakovanja.",
  },
  {
    q: "Koja je razlika između Scitec 100% Whey Protein i 100% Whey Protein Professional?",
    a: "Professional verzija sadrži probavne enzyme (Digezyme®) koji mogu pomoći apsorpciji proteina, kao i dodatak vitamina. Nutritivni profil proteina je sličan, ali Professional ima kompletniju formulu. U Srbiji je Professional verzija zastupljenija u prodavnicama.",
  },
  {
    q: "Gde je Scitec Nutrition whey najjeftiniji u Srbiji?",
    a: "Cena varira između prodavnica i može se razlikovati i 10–20% za isto pakovanje. Tabela ispod prikazuje aktuelne cene iz svih srpskih prodavnica koje pratimo, sortirane po value score — metrika koja pokazuje koji artikal daje najviše proteina za novac.",
  },
  {
    q: "Koje pakovanje Scitec Nutrition Whey se najviše isplati kupiti?",
    a: "Veća pakovanja (2.35kg, 5kg) po pravilu imaju nižu cenu po kilogramu proteina. Value score u tabeli uzima u obzir i cenu i gramažu proteina, pa brzo možeš videti koje pakovanje daje najviše za novac u datom trenutku.",
  },
  {
    q: "Da li Scitec Nutrition Whey sadrži laktozu?",
    a: "Da — 100% Whey Protein Professional sadrži laktozu jer je baziran na whey concentrate-u. Nije pogodan za osobe sa ozbiljnom intolerancijom na laktozu. Za bezlaktoznu alternativu u Scitec asortimanu postoji Iso Whey Zero.",
  },
];

function ppg(p: Product): number | null {
  if (!p.numericPrice || !p.primaryWeightGrams || !p.proteinPer100g) return null;
  const totalProt = p.primaryWeightGrams * (p.proteinPer100g / 100);
  if (totalProt <= 0) return null;
  return p.numericPrice / totalProt;
}

const BASE = "https://proteinoteka.rs";
const SLUG = "/vodici/scitec-nutrition-whey";

export default async function Page() {
  const [scitecProducts, wpcTop] = await Promise.all([
    fetchBrandProducts({ brand: "Scitec Nutrition", limit: 50 }),
    fetchTopProducts({ category: "whey_concentrate", sortBy: "valueScore", limit: 3 }),
  ]);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Scitec Nutrition 100% Whey Protein — recenzija i aktuelne cene u Srbiji",
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
        { "@type": "ListItem", position: 3, name: "Scitec Nutrition 100% Whey — recenzija", item: `${BASE}${SLUG}` },
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
            <span className="text-slate-600">Scitec Nutrition 100% Whey — recenzija</span>
          </nav>

          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-4">
              Scitec Nutrition 100% Whey Protein — sastav, pakovanja i aktuelne cene u Srbiji
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
                "Scitec Nutrition je mađarski brend sa 30+ godina iskustva — jedan od najpopularnijih u Srbiji.",
                "100% Whey Protein Professional je concentrate/isolate blend sa ~74–77g proteina/100g i probavnim enzimima (Digezyme®).",
                "Dostupan u pakovanjima od 500g do 5kg i velikom broju ukusa — što ga čini fleksibilnim izborom.",
                "Value score pokazuje koje pakovanje trenutno daje najviše proteina za novac u srpskim prodavnicama.",
                "Cene se razlikuju između prodavnica — tabela ispod prikazuje aktuelno stanje iz svih prodavnica koje pratimo.",
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
            <h2 className="text-xl font-bold text-slate-900 mb-4">Scitec Nutrition — odakle dolazi i zašto je popularan?</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Scitec Nutrition je mađarski brend osnovan 1996. godine u Budimpešti. Sa više od 30 godina prisustva na tržištu suplementacije, Scitec je jedan od najprodavanijih brendova u Srbiji i široj jugoistočnoj Evropi.
              </p>
              <p>
                Popularan je zbog kombinacije pristupačnih cena, dobre distribucije kroz domaće prodavnice i izuzetno velikog asortimana ukusa — <strong>100% Whey Protein Professional</strong> dolazi u desecima varijeteta, od klasičnih čokolada i vanila do egzotičnijih kombinacija. To ga čini atraktivnim za korisnike kojima je ukus bitan faktor pri odabiru.
              </p>
              <p>
                Flagship protein je <strong>100% Whey Protein Professional</strong> — concentrate/isolate blend sa probavnim enzimima. Pored njega, Scitec nudi i <strong>Iso Whey Zero</strong> (čisti whey izolat, bez laktoze) kao premium opciju.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section className="mb-10" id="whey-professional-sastav">
            <h2 className="text-xl font-bold text-slate-900 mb-4">100% Whey Protein Professional — nutritivni sastav</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Standardna porcija od ~30g sadrži:
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
                    <tr><td className="px-4 py-3 text-slate-700">Proteini</td><td className="px-4 py-3 text-right font-medium text-slate-900">~22–23g</td><td className="px-4 py-3 text-right text-slate-600">~74–77g</td></tr>
                    <tr><td className="px-4 py-3 text-slate-700">Ugljeni hidrati</td><td className="px-4 py-3 text-right font-medium text-slate-900">~4–5g</td><td className="px-4 py-3 text-right text-slate-600">~13–17g</td></tr>
                    <tr><td className="px-4 py-3 text-slate-700">Masti</td><td className="px-4 py-3 text-right font-medium text-slate-900">~1.5–2g</td><td className="px-4 py-3 text-right text-slate-600">~5–7g</td></tr>
                    <tr><td className="px-4 py-3 text-slate-700">Kalorije</td><td className="px-4 py-3 text-right font-medium text-slate-900">~120–130 kcal</td><td className="px-4 py-3 text-right text-slate-600">~395–430 kcal</td></tr>
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-slate-500 italic">
                Vrednosti su okvirne i mogu blago varirati između ukusa — uvek proveri etiketu konkretnog pakovanja.
              </p>
              <p>
                Professional verzija sadrži i <strong>Digezyme®</strong> — mešavinu probavnih enzima (amilaza, proteaza, laktaza, lipaza, celulaza) koja pomaže boljoj apsorpciji proteina, posebno korisna osobama sa osetljivim varenjem. Dodatak vitamina B6 i C dopunjava formulu.
              </p>
              <p>
                ~74–77g proteina na 100g praška spada u solidan, ali ne i vrhunski rezultat za concentrate/blend segment — za poređenje, Gold Standard ide do ~80g/100g, a BioTech USA Pure Whey do ~78–80g/100g. Razlika je mala, a Scitec kompenzuje širinom asortimana ukusa i pristupačnom cenom. Više o tome šta znači ta razlika pročitaj u vodiču{" "}
                <Link href="/vodici/whey-isolate-vs-concentrate" className="text-[#FF9900] hover:underline font-medium">Whey Isolate vs Concentrate</Link>.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section className="mb-10" id="whey-vs-professional">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Whey Protein vs Whey Professional — koja je razlika?</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Scitec nudi dve varijante whey proteina koje su često prisutne u prodavnicama:
              </p>
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-[14px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-4 py-3 font-semibold text-slate-700"></th>
                      <th className="text-center px-4 py-3 font-semibold text-slate-700">100% Whey Protein</th>
                      <th className="text-center px-4 py-3 font-semibold text-slate-700">100% Whey Professional</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[13px]">
                    <tr>
                      <td className="px-4 py-3 text-slate-600">Tip</td>
                      <td className="px-4 py-3 text-center text-slate-700">WPC blend</td>
                      <td className="px-4 py-3 text-center text-slate-700">WPC + WPI blend</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-slate-600">Proteini/100g</td>
                      <td className="px-4 py-3 text-center text-slate-700">~72–75g</td>
                      <td className="px-4 py-3 text-center text-slate-700">~74–77g</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-slate-600">Probavni enzimi</td>
                      <td className="px-4 py-3 text-center text-slate-700">Ne</td>
                      <td className="px-4 py-3 text-center text-slate-700">Da (Digezyme®)</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-slate-600">Vitamini</td>
                      <td className="px-4 py-3 text-center text-slate-700">Ne</td>
                      <td className="px-4 py-3 text-center text-slate-700">B6, C</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-slate-600">Cena</td>
                      <td className="px-4 py-3 text-center text-slate-700">Niža</td>
                      <td className="px-4 py-3 text-center text-slate-700">Blago viša</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                Za većinu korisnika, razlika između ove dve varijante nije presudna — proteinski profil je sličan. Professional verzija ima smisla ako cenjiš dodatak probavnih enzima ili vitamina. Obe su dostupne u srpskim prodavnicama, a cena u datom trenutku često odlučuje koji je isplativiji izbor.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section className="mb-10" id="pakovanja-ukusi">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Pakovanja i ukusi dostupni u Srbiji</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Scitec Nutrition 100% Whey Protein Professional dostupan je u sledećim pakovanjima:
              </p>
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-[14px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-4 py-3 font-semibold text-slate-700">Pakovanje</th>
                      <th className="text-right px-4 py-3 font-semibold text-slate-700">Broj porcija (~30g)</th>
                      <th className="text-right px-4 py-3 font-semibold text-slate-700">Okvirna cena</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr><td className="px-4 py-3 text-slate-700">500g</td><td className="px-4 py-3 text-right text-slate-600">~16</td><td className="px-4 py-3 text-right text-slate-600">~2.500–3.500 RSD</td></tr>
                    <tr><td className="px-4 py-3 text-slate-700">920g / 1kg</td><td className="px-4 py-3 text-right text-slate-600">~30–33</td><td className="px-4 py-3 text-right text-slate-600">~3.800–5.500 RSD</td></tr>
                    <tr><td className="px-4 py-3 text-slate-700">2.35kg</td><td className="px-4 py-3 text-right text-slate-600">~78</td><td className="px-4 py-3 text-right text-slate-600">~8.000–12.000 RSD</td></tr>
                    <tr><td className="px-4 py-3 text-slate-700">5kg</td><td className="px-4 py-3 text-right text-slate-600">~166</td><td className="px-4 py-3 text-right text-slate-600">~14.000–20.000 RSD</td></tr>
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-slate-500 italic">
                Okvirne cene na osnovu praćenih prodavnica — za tačne i aktuelne cene pogledaj tabelu ispod.
              </p>
              <p>
                Scitec nudi jedan od najvećih izbora ukusa na tržištu: čokolada, vanila, jagoda, lešnik, karamel, cookies &amp; cream i još mnogo varijeteta. Dostupnost konkretnog ukusa zavisi od prodavnice i trenutnih zaliha.
              </p>
            </div>
          </section>

          {/* Section 5 — WPC comparison */}
          <section className="mb-10" id="alternative">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Poređenje sa ostalim whey proteinima u Srbiji</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Ovo su trenutno najisplativiji whey koncentrati dostupni na srpskom tržištu po value score-u — za referencu pri poređenju sa Scitec Nutrition:
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

          {/* Section 6 — Live Scitec */}
          <section className="mb-10" id="live-cene">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Aktuelne cene Scitec Nutrition u Srbiji</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Sve Scitec Nutrition varijante koje trenutno pratimo u srpskim prodavnicama, sortirane po value score. Cene se ažuriraju redovno.
              </p>
              {scitecProducts.length > 0 ? (
                <div className="space-y-3">
                  {scitecProducts.slice(0, 10).map((p) => {
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
                    <Link href="/scitec-nutrition-proteini" className="text-[#FF9900] hover:underline font-medium">
                      Pogledaj sve Scitec Nutrition ponude →
                    </Link>
                  </p>
                </div>
              ) : (
                <p className="text-slate-500 text-sm">
                  Podaci se privremeno ne učitavaju. Sve ponude vidiš na strani{" "}
                  <Link href="/scitec-nutrition-proteini" className="text-[#FF9900] hover:underline">Scitec Nutrition proteini u Srbiji</Link>.
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

          <GuideDisclaimer />
        </main>
        <VodiciNav currentSlug="scitec-nutrition-whey" />
      </div>
    </>
  );
}
