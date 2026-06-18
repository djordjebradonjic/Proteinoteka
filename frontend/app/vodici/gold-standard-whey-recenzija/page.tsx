import { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import VodiciNav from "@/components/VodiciNav";
import GuideToc, { TocSection } from "@/components/GuideToc";
import GuideDisclaimer from "@/components/GuideDisclaimer";
import { fetchProductsByQuery, fetchTopProducts } from "@/lib/seo-data";
import { Product } from "@/types/product";
import { productUrl } from "@/lib/productUrl";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: { absolute: "Gold Standard 100% Whey — recenzija i cena u Srbiji 2026 | Proteinoteka" },
  description:
    "Nutritivni sastav, poređenje sa alternativama i aktuelne cene Gold Standard 100% Whey iz svih srpskih prodavnica na jednom mestu — ažurirano automatski.",
  alternates: { canonical: "https://proteinoteka.rs/vodici/gold-standard-whey-recenzija" },
  openGraph: {
    title: "Gold Standard 100% Whey — recenzija i cena u Srbiji 2026 | Proteinoteka",
    description:
      "Nutritivni sastav, poređenje sa alternativama i aktuelne cene Gold Standard 100% Whey iz svih srpskih prodavnica na jednom mestu — ažurirano automatski.",
    url: "https://proteinoteka.rs/vodici/gold-standard-whey-recenzija",
    siteName: "Proteinoteka",
    locale: "sr_RS",
    type: "article",
  },
};

const TOC: TocSection[] = [
  { id: "sta-je", title: "Šta je Gold Standard 100% Whey?" },
  { id: "sastav", title: "Nutritivni sastav — šta piše na etiketi" },
  { id: "isolate-blend", title: "Isolate, concentrate ili blend?" },
  { id: "pakovanja", title: "Koje pakovanje birati?" },
  { id: "alternative", title: "Top whey koncentrati u Srbiji po value score" },
  { id: "live-cene", title: "Aktuelne cene Gold Standard u Srbiji" },
  { id: "faq", title: "Česta pitanja" },
];

const faqItems = [
  {
    q: "Da li je Gold Standard 100% Whey pravi isolate ili concentrate?",
    a: "Gold Standard je blend: whey isolate je navedena prva sirovina, ali sadrži i whey concentrate i whey peptide. Nije čisti isolate — za osobe sa laktoznom intolerancijom koji traže čisti izolat, postoje namenski proizvodi. Za većinu korisnika, blend radi odlično.",
  },
  {
    q: "Koliko proteina ima Gold Standard whey po porciji?",
    a: "Standardna porcija od ~30g sadrži oko 24g proteina, što daje ~80g proteina na 100g praška. Vrednost je konzistentna bez obzira na ukus.",
  },
  {
    q: "Gde je Gold Standard whey najjeftiniji u Srbiji?",
    a: "Cena se razlikuje između prodavnica i po pakovanju. U tabeli ispod poredimo aktuelne cene iz svih srpskih prodavnica koje pratimo, sortirane po value score koji uzima u obzir i cenu i sadržaj proteina.",
  },
  {
    q: "Koje pakovanje Gold Standard whey-a se najviše isplati?",
    a: "Veća pakovanja (2.27kg i 4.5kg) po pravilu imaju nižu cenu po gramu proteina, ali razlika zavisi od prodavnice i trenutnih akcija. Uvek proveri value score u tabeli — ponekad manje pakovanje jedne prodavnice bude isplativije od velikog pakovanja u drugoj.",
  },
  {
    q: "Da li je Gold Standard originalan u srpskim prodavnicama?",
    a: "Prodavnice koje pratimo nabavljaju Optimum Nutrition proizvode od ovlašćenih distributera. Za proveru autentičnosti, ON stavlja scratch/QR kod na svako pakovanje koji možeš verifikovati na sajtu brenda.",
  },
  {
    q: "Kako da pratim cenu Gold Standard whey-a i dobijem obaveštenje kad padne?",
    a: "Na Proteinoteci možeš aktivirati besplatan price alert za bilo koju Gold Standard varijantu — bez registracije, samo uneseš email i ciljnu cenu. Kad cena padne ispod te vrednosti u nekoj od prodavnica, dobijaš email obaveštenje.",
  },
];

function ppg(p: Product): number | null {
  if (!p.numericPrice || !p.primaryWeightGrams || !p.proteinPer100g) return null;
  const totalProt = p.primaryWeightGrams * (p.proteinPer100g / 100);
  if (totalProt <= 0) return null;
  return p.numericPrice / totalProt;
}

const BASE = "https://proteinoteka.rs";
const SLUG = "/vodici/gold-standard-whey-recenzija";

export default async function Page() {
  const [gsProducts, wpcTop] = await Promise.all([
    fetchProductsByQuery({ name: "gold standard", brand: "Optimum Nutrition", limit: 20 }),
    fetchTopProducts({ category: "whey_concentrate", sortBy: "valueScore", limit: 3 }),
  ]);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Gold Standard 100% Whey — recenzija i aktuelne cene u Srbiji",
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
        { "@type": "ListItem", position: 3, name: "Gold Standard 100% Whey — recenzija", item: `${BASE}${SLUG}` },
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
            <span className="text-slate-600">Gold Standard 100% Whey — recenzija</span>
          </nav>

          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-4">
              Gold Standard 100% Whey — sastav, pakovanja i aktuelne cene u Srbiji
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
                "Gold Standard nije čisti isolate — blend je whey isolate + concentrate + peptide, ~80g proteina/100g.",
                "Kvalitet je provereno dobar: konzistentan sadržaj, lako se rastvara, širok izbor ukusa.",
                "Dostupan je u svim većim srpskim prodavnicama suplemenata — cene variraju između prodavnica.",
                "Value score ti pokazuje koje pakovanje daje najviše proteina za novac u datom trenutku.",
                "Veće pakovanje ne znači uvek nižu cenu po gramu — tabela ispod prikazuje aktuelno stanje.",
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
          <section className="mb-10" id="sta-je">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Šta je Gold Standard 100% Whey?</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Optimum Nutrition Gold Standard 100% Whey je whey protein koji se prodaje od 1986. i koji drži poziciju jednog od najprodavanijih whey proteina na svetu. U Srbiji je dostupan u većini prodavnica suplemenata i spada u najtraženije proteine na domaćem tržištu.
              </p>
              <p>
                Razlog popularnosti je jasan: konzistentan kvalitet kroz godine, lako rastvaranje, dobar ukus u većini varijanti i prepoznatljiv brend koji mnogi fitnes entuzijasti poznaju. Na Proteinoteci pratimo sve dostupne Gold Standard varijante i pakovanja iz srpskih prodavnica — da uvek znaš gde je najisplativija ponuda.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section className="mb-10" id="sastav">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Nutritivni sastav — šta piše na etiketi</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Standardna porcija Gold Standard whey-a od ~30g sadrži:
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
                    <tr><td className="px-4 py-3 text-slate-700">Proteini</td><td className="px-4 py-3 text-right font-medium text-slate-900">~24g</td><td className="px-4 py-3 text-right text-slate-600">~80g</td></tr>
                    <tr><td className="px-4 py-3 text-slate-700">Ugljeni hidrati</td><td className="px-4 py-3 text-right font-medium text-slate-900">~3g</td><td className="px-4 py-3 text-right text-slate-600">~10g</td></tr>
                    <tr><td className="px-4 py-3 text-slate-700">Masti</td><td className="px-4 py-3 text-right font-medium text-slate-900">~1–1.5g</td><td className="px-4 py-3 text-right text-slate-600">~3–5g</td></tr>
                    <tr><td className="px-4 py-3 text-slate-700">Kalorije</td><td className="px-4 py-3 text-right font-medium text-slate-900">~120 kcal</td><td className="px-4 py-3 text-right text-slate-600">~400 kcal</td></tr>
                  </tbody>
                </table>
              </div>
              <p>
                ~80g proteina na 100g praška je solidan sadržaj. Za poređenje: standardni whey koncentrat (WPC) tipično ima 70–80g/100g, dok čisti whey izolat (WPI) ide do 85–94g/100g. Detaljnu razliku između tipova proteina objašnjavamo u vodiču{" "}
                <Link href="/vodici/whey-isolate-vs-concentrate" className="text-[#FF9900] hover:underline font-medium">Whey Isolate vs Concentrate</Link>.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section className="mb-10" id="isolate-blend">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Isolate, concentrate ili blend?</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Gold Standard 100% Whey je blend koji kombinuje tri vrste whey proteina:
              </p>
              <ul className="space-y-3">
                <li className="flex gap-2.5">
                  <span className="text-[#FF9900] font-bold shrink-0">→</span>
                  <span><strong>Whey isolate</strong> — primarna sirovina (naveden prvi na listi sastojaka), visok sadržaj proteina, manje laktoze</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="text-[#FF9900] font-bold shrink-0">→</span>
                  <span><strong>Whey concentrate</strong> — dodatna komponenta uz isolate</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="text-[#FF9900] font-bold shrink-0">→</span>
                  <span><strong>Whey peptide</strong> — hidrolizovani protein za brzu apsorpciju, zastupljen u manjim količinama</span>
                </li>
              </ul>
              <p>
                Za osobe sa laktoznom intolerancijom koje traže čisti isolate, postoje namenski WPI proizvodi. Za većinu sportista i rekreativaca, Gold Standard blend funkcioniše odlično.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section className="mb-10" id="pakovanja">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Koje pakovanje birati?</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Gold Standard dolazi u više pakovanja: 450g, 900g, 2.27kg i 4.5kg. Veće pakovanje po pravilu daje nižu cenu po gramu proteina — ali to uvek zavisi od konkretne prodavnice i trenutnih akcija.
              </p>
              <ul className="space-y-3">
                <li className="flex gap-2.5">
                  <span className="text-[#FF9900] font-bold shrink-0">→</span>
                  <span><strong>450g</strong> — idealno za prvi put ili za probanje novog ukusa uz minimalan rizik</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="text-[#FF9900] font-bold shrink-0">→</span>
                  <span><strong>900g</strong> — balans između cene i fleksibilnosti, dobar izbor za ukus koji ti se čini zanimljivim</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="text-[#FF9900] font-bold shrink-0">→</span>
                  <span><strong>2.27kg / 4.5kg</strong> — kupuj samo ukus koji si već probao; veće pakovanje nema smisla ako na kraju ne potrošiš sve</span>
                </li>
              </ul>
              <p>
                Konkretne cene za svako pakovanje iz svih srpskih prodavnica vidiš na posebnoj strani{" "}
                <Link href="/gold-standard-whey-cena" className="text-[#FF9900] hover:underline font-medium">Gold Standard Whey cena u Srbiji</Link>.
              </p>
            </div>
          </section>

          {/* Section 5 — WPC alternatives */}
          <section className="mb-10" id="alternative">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Top whey koncentrati u Srbiji po value score</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Ako tražiš whey protein sa visokim sadržajem proteina i pratišs cenu po gramu, ovo su trenutno najisplativiji whey koncentrati dostupni u Srbiji prema value score-u koji Proteinoteka automatski računa:
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
              <p className="text-sm text-slate-500">
                Ovo je živa lista — ažurira se automatski kako se menjaju cene u prodavnicama.
              </p>
            </div>
          </section>

          {/* Section 6 — Live Gold Standard */}
          <section className="mb-10" id="live-cene">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Aktuelne cene Gold Standard u Srbiji</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Sve Gold Standard varijante i pakovanja koja trenutno pratimo u srpskim prodavnicama, sortirane po value score. Cene se ažuriraju redovno.
              </p>
              {gsProducts.length > 0 ? (
                <div className="space-y-3">
                  {gsProducts.map((p) => {
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
                    <Link href="/gold-standard-whey-cena" className="text-[#FF9900] hover:underline font-medium">
                      Pogledaj sve Gold Standard ponude →
                    </Link>
                  </p>
                </div>
              ) : (
                <p className="text-slate-500 text-sm">
                  Podaci se privremeno ne učitavaju. Sve ponude vidiš na strani{" "}
                  <Link href="/gold-standard-whey-cena" className="text-[#FF9900] hover:underline">Gold Standard Whey cena</Link>.
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
        <VodiciNav currentSlug="gold-standard-whey-recenzija" />
      </div>
    </>
  );
}
