import { CURRENT_MARKET, MARKET_CONFIG } from "@/lib/marketConfig";
import { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import GuideToc, { TocSection } from "@/components/GuideToc";
import GuideDisclaimer from "@/components/GuideDisclaimer";
import { fetchTopProducts } from "@/lib/seo-data";
import { Product } from "@/types/product";
import { productUrl } from "@/lib/productUrl";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: "Koliko košta whey protein u Hrvatskoj? Usporedba cijena 2026. | Proteinoteka" },
  description:
    "Aktualna usporedba cijena whey proteina u Hrvatskoj u EUR/100g proteina. Koji proteini nude najbolji omjer kvalitete i cijene u GymBeam HR, MyProtein HR i Polleo Sport.",
  alternates: {
    canonical: `https://${MARKET_CONFIG[CURRENT_MARKET].domain}/hr-vodici/koliko-kosta-protein-hrvatska`,
  },
  openGraph: {
    title: "Koliko košta whey protein u Hrvatskoj? Usporedba cijena 2026.",
    description:
      "Aktualna usporedba cijena whey proteina u Hrvatskoj — EUR/100g proteina, s tjednim ažuriranjem.",
    url: `https://${MARKET_CONFIG[CURRENT_MARKET].domain}/hr-vodici/koliko-kosta-protein-hrvatska`,
    siteName: "Proteinoteka",
    locale: MARKET_CONFIG[CURRENT_MARKET].ogLocale,
    type: "article",
    images: [{ url: `https://${MARKET_CONFIG[CURRENT_MARKET].domain}/opengraph-image`, width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", images: [`https://${MARKET_CONFIG[CURRENT_MARKET].domain}/opengraph-image`] },
};

function pricePerGramProtein(p: Product): number | null {
  if (!p.numericPrice || !p.primaryWeightGrams || !p.proteinPer100g) return null;
  const totalProteinG = p.primaryWeightGrams * (p.proteinPer100g / 100);
  if (totalProteinG <= 0) return null;
  return p.numericPrice / totalProteinG;
}

const tocSections: TocSection[] = [
  { id: "prosjecna-cijena", title: "Prosječna cijena whey proteina u Hrvatskoj" },
  { id: "rang-lista", title: "Rang lista po cijeni po gramu proteina" },
  { id: "gdje-kupiti", title: "Gdje kupiti whey protein u Hrvatskoj?" },
  { id: "kako-usporediti", title: "Kako pravilno uspoređivati cijene?" },
  { id: "mjesecni-trosak", title: "Koliko košta mjesec dana suplementacije?" },
  { id: "faq", title: "Često postavljana pitanja" },
];

const faqItems = [
  {
    q: "Zašto se cijene whey proteina toliko razlikuju?",
    a: "Cijena ovisi o tipu proteina (WPC je jeftiniji od WPI), veličini pakiranja (veća pakiranja su jeftinija po gramu), brendu (premium brendovi naplaćuju više bez nužno boljeg sastava) i trenutnim akcijama. Uvijek uspoređujte cijenu po gramu proteina, ne ukupnu cijenu paketa.",
  },
  {
    q: "Je li skuplji protein automatski bolji?",
    a: "Ne. Skupi proteini često plaćate brend i marketing. Ključni pokazatelji su: % proteina na 100g (ciljajte 70%+), aminokiselinski profil i cijena po gramu proteina. Naš Value Score automatski uzima u obzir sve te faktore.",
  },
  {
    q: "Gdje je najjeftinije kupiti protein u Hrvatskoj?",
    a: "Cijene se mijenjaju tjedno, pa je teško dati statičan odgovor. Proteinoteka.com.hr prati sve HR webshopove (GymBeam, MyProtein, Polleo Sport, Proteka, Nutrition Shop HR) i uvijek prikazuje aktualne cijene. Koristite sortiranje po Value Score za najbolji omjer.",
  },
  {
    q: "Koliko košta prosječan mjesec whey proteina u Hrvatskoj?",
    a: "Uz 30g proteina dnevno (900g proteina iz shakea mjesečno) i prosječnu cijenu od 4–6 EUR/100g proteina, mjesečni trošak iznosi 36–54 EUR. Uz najpovoljnije opcije može biti i 30–35 EUR.",
  },
];

const BASE = `https://${MARKET_CONFIG[CURRENT_MARKET].domain}`;
const SLUG = "/hr-vodici/koliko-kosta-protein-hrvatska";
const MONTHLY_PROTEIN_G = 900;

export default async function Page() {
  const [concentrates, isolates] = await Promise.all([
    fetchTopProducts({ category: "whey_concentrate", sortBy: "valueScore", limit: 5 }),
    fetchTopProducts({ category: "whey_isolate", sortBy: "valueScore", limit: 3 }),
  ]);

  const withPPG = (products: Product[]) =>
    products.map((p) => ({ ...p, ppg: pricePerGramProtein(p) }));

  const concentratesWithPPG = withPPG(concentrates);
  const isolatesWithPPG = withPPG(isolates);

  const bestConcentrate = [...concentratesWithPPG]
    .filter((p) => p.ppg !== null)
    .sort((a, b) => (a.ppg ?? Infinity) - (b.ppg ?? Infinity))[0];

  const dateModified = new Date().toISOString().split("T")[0];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Koliko košta whey protein u Hrvatskoj? Usporedba cijena 2026.",
      datePublished: "2026-06-26",
      dateModified,
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
        { "@type": "ListItem", position: 2, name: "Vodiči", item: `${BASE}/hr-vodici` },
        { "@type": "ListItem", position: 3, name: "Koliko košta protein u Hrvatskoj", item: `${BASE}${SLUG}` },
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
            <Link href="/hr-vodici" className="hover:text-[#FF9900] transition-colors">Vodiči</Link>
            <span>/</span>
            <span className="text-slate-600">Koliko košta protein u Hrvatskoj</span>
          </nav>

          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-4">
              Koliko košta whey protein u Hrvatskoj?
            </h1>
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <span>5 min čitanja</span>
              <span>·</span>
              <time dateTime={dateModified}>Ažurirano: lipanj 2026.</time>
            </div>
          </div>

          <div className="mb-8 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-lg text-slate-700 leading-relaxed">
              <strong className="text-slate-900">Kratki odgovor:</strong> whey koncentrat u Hrvatskoj košta
              između <strong className="text-slate-900">3.5 i 6.5 EUR/100g proteina</strong>.
              Uz 30g proteina dnevno, to znači{" "}
              <strong className="text-slate-900">30–58 EUR mjesečno</strong>. Razlika između najjeftinijeg i
              najskupljeg identičnog proteina može biti i 40% — jedino što ima smisla uspoređivati je{" "}
              <strong className="text-slate-900">cijena po gramu proteina</strong>.
            </p>
          </div>

          <GuideToc sections={tocSections} />

          <section className="mb-10">
            <h2 id="prosjecna-cijena" className="text-xl font-bold text-slate-900 mb-4">
              Prosječna cijena whey proteina u Hrvatskoj
            </h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700 mb-6">
              <p>
                Hrvatska je od 2023. u eurozone, pa su sve cijene u EUR. Uspoređivanje je jednostavno — ključan
                je parametar <strong className="text-slate-800">EUR/100g proteina</strong>, koji izravno
                odražava vrijednost za novac bez obzira na veličinu pakiranja.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
              <div className="px-4 py-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Orijentacijske cijene po tipu proteina
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-left">
                      <th className="px-4 py-2.5 text-xs font-semibold text-slate-500">Tip proteina</th>
                      <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 text-right whitespace-nowrap">EUR/100g prot.</th>
                      <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 text-right whitespace-nowrap">Mj. trošak*</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      { tip: "Whey koncentrat (WPC)", range: "3.5–5.5", monthly: "31–50 EUR", highlight: true },
                      { tip: "Whey izolat (WPI)", range: "5.5–8.0", monthly: "50–72 EUR", highlight: false },
                      { tip: "Biljni protein (grašak/riža)", range: "5.0–8.0", monthly: "45–72 EUR", highlight: false },
                    ].map(({ tip, range, monthly, highlight }) => (
                      <tr key={tip} className={highlight ? "bg-[#FFF8EC]" : ""}>
                        <td className="px-4 py-3 font-medium text-slate-800">{tip}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{range}</td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-800">{monthly}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="px-4 py-2 text-[11px] text-slate-400 border-t border-slate-100">
                * Pri 30g proteina dnevno × 30 dana = 900g proteina iz shakea
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 id="rang-lista" className="text-xl font-bold text-slate-900 mb-4">
              Rang lista po cijeni po gramu proteina
            </h2>

            {concentratesWithPPG.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Whey Koncentrat — top po Value Score
                  </span>
                  <span className="text-[11px] text-slate-400">ažurirano tjedno</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-left">
                        <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 min-w-[180px]">Proizvod</th>
                        <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 text-right whitespace-nowrap">Cijena</th>
                        <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 text-right whitespace-nowrap hidden sm:table-cell">EUR/100g prot.</th>
                        <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 text-right whitespace-nowrap">Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {concentratesWithPPG.map((p, i) => (
                        <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3">
                            <Link href={productUrl(p)} className="font-medium text-slate-800 hover:text-[#FF9900] transition-colors leading-snug block">
                              {i === 0 && (
                                <span className="inline-block mr-1.5 px-1.5 py-0.5 bg-[#FF9900]/10 text-[#b36b00] text-[10px] font-bold rounded">#1</span>
                              )}
                              {p.name}
                            </Link>
                            <span className="text-xs text-slate-400">{p.storeName}</span>
                          </td>
                          <td className="px-4 py-3 text-right text-slate-700 whitespace-nowrap">{p.price}</td>
                          <td className="px-4 py-3 text-right font-medium text-slate-700 whitespace-nowrap hidden sm:table-cell">
                            {p.ppg ? `${(p.ppg * 100).toFixed(2)}` : "—"}
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
            )}

            {isolatesWithPPG.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Whey Izolat — top po Value Score
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-left">
                        <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 min-w-[180px]">Proizvod</th>
                        <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 text-right whitespace-nowrap">Cijena</th>
                        <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 text-right whitespace-nowrap hidden sm:table-cell">EUR/100g prot.</th>
                        <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 text-right whitespace-nowrap">Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {isolatesWithPPG.map((p, i) => (
                        <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3">
                            <Link href={productUrl(p)} className="font-medium text-slate-800 hover:text-[#FF9900] transition-colors leading-snug block">
                              {i === 0 && (
                                <span className="inline-block mr-1.5 px-1.5 py-0.5 bg-[#FF9900]/10 text-[#b36b00] text-[10px] font-bold rounded">#1</span>
                              )}
                              {p.name}
                            </Link>
                            <span className="text-xs text-slate-400">{p.storeName}</span>
                          </td>
                          <td className="px-4 py-3 text-right text-slate-700 whitespace-nowrap">{p.price}</td>
                          <td className="px-4 py-3 text-right font-medium text-slate-700 whitespace-nowrap hidden sm:table-cell">
                            {p.ppg ? `${(p.ppg * 100).toFixed(2)}` : "—"}
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
            )}
          </section>

          <section className="mb-10">
            <h2 id="gdje-kupiti" className="text-xl font-bold text-slate-900 mb-4">
              Gdje kupiti whey protein u Hrvatskoj?
            </h2>
            <div className="space-y-3">
              {[
                { store: "GymBeam HR", desc: "Jedan od najvećih europskih online webshopova sa sjedištem u regiji. Širok asortiman, redovite akcije, brza dostava u HR." },
                { store: "MyProtein HR", desc: "Britanski brend s globalnom distribucijom. Poznati po Impact Whey proteinu i čestim popustima do 50%." },
                { store: "Polleo Sport", desc: "Hrvatski webshop i maloprodajne lokacije. Dobre cijene, lokalna podrška i brza dostava." },
                { store: "Proteka", desc: "Specijaliziran webshop za proteine i suplemente s konkurentnim cijenama." },
                { store: "Nutrition Shop HR", desc: "Dobar izbor brendova i redovite promotivne cijene." },
              ].map(({ store, desc }) => (
                <div key={store} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <p className="font-semibold text-slate-900 text-[15px] mb-1">{store}</p>
                  <p className="text-[14px] text-slate-600 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[14px] text-slate-500">
              Proteinoteka automatski prati sve navedene webshopove i ažurira cijene tjedno — bez potrebe za ručnom usporedbom.
            </p>
          </section>

          <section className="mb-10">
            <h2 id="kako-usporediti" className="text-xl font-bold text-slate-900 mb-4">
              Kako pravilno uspoređivati cijene?
            </h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Greška koju svaki početnik napravi: uspoređuje ukupnu cijenu paketa umjesto cijene po gramu
                proteina. Pakiranje od 1kg ne znači isto što i pakiranje od 2kg — i proteinski udio po 100g
                varira od 65% do 94%.
              </p>
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <p className="font-semibold text-slate-900 mb-2 text-[15px]">Formula za usporedbu</p>
                <p className="text-[14px] text-slate-700 font-mono bg-slate-50 rounded-lg p-3">
                  EUR/100g proteina = cijena paketa (EUR) ÷ (težina (g) × % proteina / 100) × 100
                </p>
                <p className="text-[13px] text-slate-500 mt-2">
                  Primjer: 2kg paket od 45 EUR s 78g proteina/100g → 45 ÷ (2000 × 0.78) × 100 = <strong>2.88 EUR/100g proteina</strong>
                </p>
              </div>
              <p>
                Proteinoteka ovu računicu radi automatski za sve proizvode i prikazuje je u stupcu &quot;EUR/100g
                prot.&quot; Naš Value Score dodatno uzima u obzir i kvalitetu aminokiselinskog profila.
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 id="mjesecni-trosak" className="text-xl font-bold text-slate-900 mb-4">
              Koliko košta mjesec dana suplementacije?
            </h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Standardna računica: <strong className="text-slate-800">30g proteina iz shakea dnevno × 30 dana = 900g proteina</strong>.
              </p>

              {bestConcentrate && bestConcentrate.ppg && (
                <div className="bg-[#FFF8EC] border border-[#FF9900]/30 rounded-xl p-4">
                  <p className="text-[14px] text-slate-700 leading-relaxed">
                    <strong className="text-slate-900">Trenutno najisplativija opcija u HR:</strong>{" "}
                    {bestConcentrate.name} ({bestConcentrate.storeName}) po{" "}
                    {(bestConcentrate.ppg * 100).toFixed(2)} EUR/100g proteina.{" "}
                    Mjesec dana suplementacije košta oko{" "}
                    <strong className="text-slate-900">
                      ~{(bestConcentrate.ppg * MONTHLY_PROTEIN_G).toFixed(2)} EUR
                    </strong>.
                  </p>
                </div>
              )}

              <p>
                Za usporedbu: kava u kafiću u Hrvatskoj košta 1.20–2.00 EUR — što znači da je suplementacija
                whey proteinom jeftinija od navike jedne kave tjedno ako birate pametno.
              </p>
            </div>
          </section>

          <section id="faq" className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Često postavljana pitanja</h2>
            <div className="space-y-4">
              {faqItems.map(({ q, a }, i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                  <h3 className="font-semibold text-slate-900 mb-2">{q}</h3>
                  <p className="text-[15px] leading-relaxed text-slate-700">{a}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Korisni linkovi</h2>
            <div className="flex flex-wrap gap-3">
              <Link href="/?sort=valueScore%2Cdesc" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Top lista po Value Score
              </Link>
              <Link href="/hr-vodici/whey-protein-za-pocetnike-hrvatska" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Whey protein za početnike
              </Link>
            </div>
          </section>

          <div className="bg-[#1B2B4B] rounded-2xl p-6 text-white text-center mb-10">
            <p className="text-base leading-relaxed mb-4">
              Pronađite koji whey protein u Hrvatskoj trenutno nudi najbolji omjer proteina i cijene.
            </p>
            <Link
              href="/?sort=valueScore%2Cdesc"
              className="inline-block px-6 py-3 bg-[#FF9900] hover:bg-[#e68a00] text-[#131921] font-bold rounded-xl text-sm transition-colors"
            >
              Usporedi cijene proteina u Hrvatskoj →
            </Link>
          </div>

          <GuideDisclaimer />
        </main>
      </div>
    </>
  );
}
