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

export const metadata: Metadata = {
  title: { absolute: "Whey Isolate vs Concentrate: šta da odabereš? | Proteinoteka" },
  description:
    "Isolate: 85–94g proteina/100g, skoro bez laktoze, skuplje 20–40%. Concentrate: 70–80g proteina, niža cena, isti rezultati za većinu. Tabela razlika + live cene iz Srbije.",
  alternates: { canonical: "https://proteinoteka.rs/vodici/whey-isolate-vs-concentrate" },
  openGraph: {
    title: "Whey Isolate vs Concentrate: šta da odabereš? | Proteinoteka",
    description:
      "Isolate: 85–94g proteina/100g, skoro bez laktoze, skuplje 20–40%. Concentrate: 70–80g proteina, niža cena, isti rezultati za većinu. Tabela razlika + live cene iz Srbije.",
    url: "https://proteinoteka.rs/vodici/whey-isolate-vs-concentrate",
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
  { id: "razlika-u-sastavu", title: "Konkretna razlika u sastavu" },
  { id: "wpc-prednosti", title: "WPC — bioaktivne frakcije koje isolate nema", level: 3 },
  { id: "wpi-prednosti", title: "WPI — kada čistoća ima smisla", level: 3 },
  { id: "hidrolizat", title: "Hidrolizat — treći tip", level: 3 },
  { id: "ko-treba-sta", title: "Ko treba isolate, a ko concentrate" },
  { id: "cena-razlika", title: "Razlika u ceni i godišnji trošak" },
  { id: "godisnji-trosak", title: "Koliko to iznosi godišnje?", level: 3 },
  { id: "live-cene", title: "Trenutne cene u Srbiji — live podaci" },
  { id: "preporuka", title: "Praktična preporuka za različite profile" },
  { id: "faq", title: "Česta pitanja" },
];

function ppg(p: Product): number | null {
  if (!p.numericPrice || !p.primaryWeightGrams || !p.proteinPer100g) return null;
  const t = p.primaryWeightGrams * (p.proteinPer100g / 100);
  return t > 0 ? p.numericPrice / t : null;
}

const faqItems = [
  {
    q: "Da li je whey isolate uvek bolji od concentrate?",
    a: "Nije. Isolate je čistiji i sadrži manje laktoze i masti, ali ta razlika je zanemarljiva za većinu rekreativaca. Ako zdravo jedeš i treniraš, concentrate daje iste rezultate po nižoj ceni.",
  },
  {
    q: "Koliko veća je razlika u ceni između isolate i concentrate u Srbiji?",
    a: "Na srpskom tržištu isolate uglavnom košta 20–40% više po kilogramu od concentrate iste marke. Ako treniraš rekreativno, ta razlika retko opravdava sebe — osim ako imaš intoleranciju na laktozu ili si u rigoroznoj dijeti.",
  },
  {
    q: "Može li isolate da zameni obrok bolje od concentrate?",
    a: "Ni jedan ni drugi nije dizajniran da zameni obrok. Oba su suplementi koji dopunjuju ishranu. Za zamenu obroka bolje su proteinske mešavine (blendovi) sa sporim i brzim proteinima, vlaknima i mastima.",
  },
  {
    q: "Da li concentrate uzrokuje probleme sa varenjem?",
    a: "Kod osoba sa intolerancijom na laktozu, concentrate može uzrokovati nadimanje, gasove i nelagodu jer sadrži 3–5g laktoze na 100g. Isolate ima ispod 0.5g laktoze i uglavnom ne pravi probleme ni kod osetljivih osoba.",
  },
];

const BASE = "https://proteinoteka.rs";
const SLUG = "/vodici/whey-isolate-vs-concentrate";

export default async function Page() {
  const [concentrates, isolates] = await Promise.all([
    fetchTopProducts({ category: "whey_concentrate", sortBy: "valueScore", limit: 3 }),
    fetchTopProducts({ category: "whey_isolate", sortBy: "valueScore", limit: 3 }),
  ]);

  const bestWpc = [...concentrates].filter(p => ppg(p) !== null).sort((a, b) => (ppg(a) ?? 99) - (ppg(b) ?? 99))[0];
  const bestWpi = [...isolates].filter(p => ppg(p) !== null).sort((a, b) => (ppg(a) ?? 99) - (ppg(b) ?? 99))[0];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Whey Isolate vs Concentrate — koja je razlika i šta da odabereš?",
      datePublished: "2026-06-05",
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
        { "@type": "ListItem", position: 3, name: "Whey Isolate vs Concentrate", item: `${BASE}${SLUG}` },
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
            <span className="text-slate-600">Whey Isolate vs Concentrate</span>
          </nav>

          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-4">
              Whey Isolate vs Concentrate — koja je razlika i šta da odabereš?
            </h1>
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <span>7 min čitanja</span>
              <span>·</span>
              <span>Ažurirano: {new Date().toLocaleDateString("sr-RS", { month: "long", year: "numeric" })}</span>
            </div>
          </div>

          <p className="text-lg text-slate-700 leading-relaxed mb-8 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
            Whey concentrate ima <strong className="text-slate-900">70–80% proteina</strong> i košta manje; whey isolate ima <strong className="text-slate-900">85–95% proteina</strong>, gotovo nema laktoze i sadrži minimalno masti. Za većinu rekreativaca concentrate je sasvim dovoljan. Isolate ima smisla ako si netolerantan na laktozu ili u rigoroznoj dijeti.
          </p>

          <GuideToc sections={TOC} />

          <section className="mb-10" id="razlika-u-sastavu">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Konkretna razlika u sastavu</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700 mb-5">
              <p>
                Oba tipa potiču iz surutke (whey) — nusproizvoda pravljenja sira. Razlika je u stepenu filtracije. Concentrate prolazi kroz manje koraka, pa zadržava masti, ugljene hidrate, laktozu, ali i bioaktivne frakcije. Isolate prolazi kroz intenzivniji proces filtracije i daje čistiji protein — manje masti, manje laktoze, više proteina na 100g.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 min-w-[140px]">Parametar (100g)</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 whitespace-nowrap">Whey Concentrate</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-[#FF9900] whitespace-nowrap">Whey Isolate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      { p: "Proteini", c: "70–80g", i: "85–94g", hl: true },
                      { p: "Masti", c: "3–5g", i: "<1g", hl: false },
                      { p: "Ugljeni hidrati", c: "4–8g", i: "<2g", hl: false },
                      { p: "Laktoza", c: "3–5g", i: "<0.5g", hl: true },
                      { p: "Kalorije", c: "~380 kcal", i: "~360 kcal", hl: false },
                      { p: "Bioaktivne frakcije", c: "Da (laktoferin, IgG)", i: "Delimično", hl: false },
                      { p: "Brzina apsorpcije", c: "Brza", i: "Brža", hl: false },
                      { p: "Cena 2kg pakovanje", c: "4.000–7.000 RSD", i: "6.000–11.000 RSD", hl: true },
                    ].map(({ p, c, i, hl }) => (
                      <tr key={p} className={hl ? "bg-slate-50/60" : ""}>
                        <td className="px-4 py-3 text-slate-700 font-medium">{p}</td>
                        <td className="px-4 py-3 text-center text-slate-600">{c}</td>
                        <td className="px-4 py-3 text-center font-semibold text-slate-800">{i}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <h3 id="wpc-prednosti" className="text-[17px] font-bold text-slate-800 mt-4 mb-3">WPC — bioaktivne frakcije koje isolate nema</h3>
            <div className="space-y-3 text-[15px] leading-relaxed text-slate-700">
              <p>
                Whey concentrate zadržava <strong className="text-slate-900">laktoferin, alfa-laktalbumin i imunoglobuline</strong> — bioaktivne proteine koji imaju antioksidativno i imunomodulatorno dejstvo. Isolate, zbog intenzivnijeg procesa prečišćavanja, gubi znatan deo ovih frakcija. Za atletske performanse i hipertrofiju ova razlika je zanemarljiva, ali za opšte zdravlje može biti relevantna.
              </p>
            </div>

            <h3 id="wpi-prednosti" className="text-[17px] font-bold text-slate-800 mt-6 mb-3">WPI — kada čistoća ima smisla</h3>
            <div className="space-y-3 text-[15px] leading-relaxed text-slate-700">
              <p>
                Whey isolate ima smisla u tri konkretna slučaja: intolerancija na laktozu (nadimanje, gasovi posle WPC), rigorozna dijeta gde se broji svaki gram masti i ugljenih hidrata, ili takmičarska priprema. Van tih scenarija, prednost u rezultatima nad WPC u studijama je minimalna ili nema je.
              </p>
            </div>

            <h3 id="hidrolizat" className="text-[17px] font-bold text-slate-800 mt-6 mb-3">Hidrolizat — treći tip koji se retko pominje</h3>
            <div className="space-y-3 text-[15px] leading-relaxed text-slate-700">
              <p>
                Hidrolizat (whey hydrolysate) je protein koji je već parcijalno razgrađen enzimima — aminokiseline su dostupne brže nego kod isolate. Najskuplji je od tri tipa. Studije pokazuju brži porast leucina u krvi posle konzumiranja, ali dugoročna razlika u hipertrofiji u poređenju sa isolate nije klinički značajna za rekreativce.
              </p>
            </div>
          </section>

          <section className="mb-10" id="ko-treba-sta">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Ko treba isolate, a ko concentrate</h2>
            <div className="space-y-3">
              {[
                {
                  who: "Rekreativni vežbač bez laktozne intolerancije",
                  rec: "Whey Concentrate",
                  color: "bg-green-50 border-green-200 text-green-700",
                  why: "Iste rezultate za manje novca. Razlika u gramu proteina po porciji je ~5g — ne dovoljno da opravda 20–40% veću cenu.",
                },
                {
                  who: "Osoba sa laktoznom intolerancijom",
                  rec: "Whey Isolate",
                  color: "bg-blue-50 border-blue-200 text-blue-700",
                  why: "Manje od 0.5g laktoze na 100g — uglavnom bezbedan i za osetljive. WPC može uzrokovati digestivne tegobe.",
                },
                {
                  who: "Aktivna dijeta / sušenje",
                  rec: "Whey Isolate",
                  color: "bg-blue-50 border-blue-200 text-blue-700",
                  why: "Minimalno masti i ugljenih hidrata po porciji. Kad broji svaki gram, razlika postaje relevantna.",
                },
                {
                  who: "Vegan / osoba koja ne podnosi mlečne proteine",
                  rec: "Biljni protein",
                  color: "bg-violet-50 border-violet-200 text-violet-700",
                  why: "Ni WPC ni WPI nije opcija. Grašak + pirinač kombinacija pokriva sve esencijalne aminokiseline.",
                },
              ].map(({ who, rec, color, why }) => (
                <div key={who} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-1.5">
                    <span className="font-semibold text-slate-900 text-[15px]">{who}</span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${color} whitespace-nowrap`}>{rec}</span>
                  </div>
                  <p className="text-[14px] text-slate-600 leading-relaxed">{why}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-10" id="cena-razlika">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Razlika u ceni i godišnji trošak</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Prosečan whey concentrate 2 kg košta 4.000–7.000 RSD, dok isolate iste veličine košta 6.000–11.000 RSD. Po gramu proteina, isolate je skuplje 20–40%.
              </p>
            </div>

            <h3 id="godisnji-trosak" className="text-[17px] font-bold text-slate-800 mt-5 mb-3">Koliko to iznosi godišnje?</h3>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Ako trošiš jedno 2 kg pakovanje mesečno i pređeš sa concentrate na isolate bez konkretnog razloga:
              </p>
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Tip</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500">Mesečno</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500">Godišnje</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="px-3 py-2.5 text-slate-700">Whey Concentrate (prosek)</td>
                      <td className="px-3 py-2.5 text-right text-slate-600">~5.500 RSD</td>
                      <td className="px-3 py-2.5 text-right text-slate-600">~66.000 RSD</td>
                    </tr>
                    <tr className="bg-slate-50/60">
                      <td className="px-3 py-2.5 text-slate-700">Whey Isolate (prosek)</td>
                      <td className="px-3 py-2.5 text-right text-slate-700">~8.000 RSD</td>
                      <td className="px-3 py-2.5 text-right font-semibold text-slate-800">~96.000 RSD</td>
                    </tr>
                    <tr className="bg-[#FFF8EC]">
                      <td className="px-3 py-2.5 font-bold text-slate-800">Razlika</td>
                      <td className="px-3 py-2.5 text-right font-bold text-[#FF9900]">~2.500 RSD</td>
                      <td className="px-3 py-2.5 text-right font-bold text-[#FF9900]">~30.000 RSD</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-[14px] text-slate-500">
                30.000 RSD godišnje za razliku koju prosečan rekreativac neće osetiti u treningu — osim ako ima konkretne medicinske ili dijetetske razloge za isolate.
              </p>
            </div>
          </section>

          {(concentrates.length > 0 || isolates.length > 0) && (
            <section className="mb-10" id="live-cene">
              <h2 className="text-xl font-bold text-slate-900 mb-2">Trenutne cene u Srbiji — live podaci</h2>
              <p className="text-[14px] text-slate-500 mb-5">
                Top opcije po Value Score-u. Cene se ažuriraju svake nedelje automatski.
              </p>
              <div className="space-y-4">
                {[
                  { label: "Whey Concentrate", products: concentrates, best: bestWpc, href: "/kategorija/whey-concentrate?sort=valueScore,desc" },
                  { label: "Whey Isolate", products: isolates, best: bestWpi, href: "/kategorija/whey-isolate?sort=valueScore,desc" },
                ].map(({ label, products, best, href }) => (
                  <div key={label} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</span>
                      <Link href={href} className="text-[12px] text-[#FF9900] hover:underline">Prikaži sve →</Link>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50">
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 min-w-[160px]">Proizvod</th>
                            <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 whitespace-nowrap">Prot/100g</th>
                            <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 whitespace-nowrap hidden sm:table-cell">RSD/g prot.</th>
                            <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 whitespace-nowrap">Score</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {products.map((p, i) => {
                            const pg = ppg(p);
                            return (
                              <tr key={p.id} className={best?.id === p.id ? "bg-[#FFF8EC]" : "hover:bg-slate-50 transition-colors"}>
                                <td className="px-4 py-3">
                                  <Link href={productUrl(p)}
                                    className="font-medium text-slate-800 hover:text-[#FF9900] transition-colors leading-snug block text-[13px]">
                                    {i === 0 && <span className="inline-block mr-1.5 px-1.5 py-0.5 bg-[#FF9900]/10 text-[#b36b00] text-[10px] font-bold rounded">#1</span>}
                                    {p.name}
                                  </Link>
                                  <span className="text-xs text-slate-400">{p.storeName} · {p.price}</span>
                                </td>
                                <td className="px-4 py-3 text-right font-medium text-slate-700 whitespace-nowrap text-[13px]">
                                  {p.proteinPer100g?.toFixed(0) ?? "—"}g
                                </td>
                                <td className="px-4 py-3 text-right text-slate-600 whitespace-nowrap text-[13px] hidden sm:table-cell">
                                  {pg ? `${pg.toFixed(1)}` : "—"}
                                </td>
                                <td className="px-4 py-3 text-right whitespace-nowrap">
                                  {p.valueScore ? <span className="font-bold text-[#FF9900]">{p.valueScore.toFixed(1)}</span> : "—"}
                                  <span className="text-slate-400 text-[12px]">/10</span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="mb-10" id="preporuka">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Praktična preporuka za različite profile</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                <strong className="text-slate-800">Ograničen budžet:</strong> Dobar WPC (Scitec 100% Whey, MyProtein Impact Whey, BioTech USA 100% Pure Whey) daje 70–78g proteina na 100g i odlična je vrednost. Na srpskom tržištu ima opcija ispod 4 RSD po gramu proteina.
              </p>
              <p>
                <strong className="text-slate-800">Laktoza ili sušenje:</strong> WPI od proverenog brenda (Optimum Nutrition Gold Standard Isolate, Dymatize ISO100). Očekuj 5–8 RSD po gramu proteina, ali dobijaš 85–94g proteina na 100g bez laktoze.
              </p>
              <p>
                <strong className="text-slate-800">Vegani i biljojedi:</strong> Kombinacija grašak + pirinač proteina pokriva profil aminokiselina. Na srpskom tržištu dostupne su opcije od 3.5–6 RSD po gramu proteina.
              </p>
              <p className="text-[14px] text-slate-500">
                Aktuelne cene i rangove po Value Score-u za svaku kategoriju naći ćeš na Proteinoteka.rs — podaci se ažuriraju svake nedelje iz 8 prodavnica.
              </p>
            </div>
          </section>

          <section className="mb-10" id="faq">
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

          <section className="mb-8">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Naučne reference</h2>
            <ol className="space-y-1.5 text-[13px] text-slate-500 list-decimal pl-4">
              <li>Tang JE et al. (2009). Ingestion of whey hydrolysate, casein, or soy protein isolate: effects on mixed muscle protein synthesis. <em>Journal of Applied Physiology</em>, 107(3), 987–992.</li>
              <li>Churchward-Venne TA et al. (2012). Supplementation of a suboptimal protein dose with leucine or essential amino acids. <em>Journal of Physiology</em>, 590(11), 2751–2765.</li>
              <li>Jäger R et al. (2017). International Society of Sports Nutrition Position Stand: protein and exercise. <em>Journal of the International Society of Sports Nutrition</em>, 14(1), 20.</li>
            </ol>
          </section>

          <GuideDisclaimer />

          <section className="mt-10 mb-10">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Korisni vodiči</h2>
            <div className="flex flex-wrap gap-3">
              <Link href="/kategorija/whey-isolate?sort=valueScore,desc" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Svi Whey Isolate proteini
              </Link>
              <Link href="/kategorija/whey-concentrate?sort=valueScore,desc" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Svi Whey Concentrate proteini
              </Link>
              <Link href="/vodici/koliko-proteina-dnevno" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Koliko proteina dnevno?
              </Link>
              <Link href="/vodici/koliko-novca-mesecno-za-proteine" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Koliko novca mesečno?
              </Link>
              <Link href="/whey-protein-cena" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Whey protein cena u Srbiji
              </Link>
              <Link href="/najjeftiniji-whey-protein" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Najjeftiniji whey protein
              </Link>
            </div>
          </section>

          <div className="bg-[#1B2B4B] rounded-2xl p-6 text-white text-center">
            <p className="text-base leading-relaxed mb-4">
              Uporedi sve isolate i concentrate proteine iz 8 prodavnica u Srbiji — sortirano po Value Score-u.
            </p>
            <Link href="/kategorija/whey-isolate?sort=valueScore,desc"
              className="inline-block px-6 py-3 bg-[#FF9900] hover:bg-[#e68a00] text-[#131921] font-bold rounded-xl text-sm transition-colors">
              Pogledaj whey isolate proteine →
            </Link>
          </div>

          <VodiciNav currentSlug="whey-isolate-vs-concentrate" />
        </main>
      </div>
    </>
  );
}
