import { notFound } from "next/navigation";
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
  title: { absolute: "Whey Isolate ili Concentrate — što odabrati? | Proteinoteka" },
  description:
    "Isolate: 85-94g proteina/100g, gotovo bez laktoze, skuplji 20-40%. Concentrate: 70-80g proteina, niža cijena, isti rezultati za većinu ljudi. Tablica razlika i aktualne cijene iz Hrvatske.",
  alternates: { canonical: `https://${MARKET_CONFIG[CURRENT_MARKET].domain}/hr-vodici/whey-isolate-vs-concentrate-hrvatska` },
  openGraph: {
    title: "Whey Isolate ili Concentrate — što odabrati? | Proteinoteka",
    description:
      "Isolate: 85-94g proteina/100g, gotovo bez laktoze, skuplji 20-40%. Concentrate: 70-80g proteina, niža cijena, isti rezultati za većinu ljudi.",
    url: `https://${MARKET_CONFIG[CURRENT_MARKET].domain}/hr-vodici/whey-isolate-vs-concentrate-hrvatska`,
    siteName: "Proteinoteka",
    locale: MARKET_CONFIG[CURRENT_MARKET].ogLocale,
    type: "article",
    images: [{ url: `https://${MARKET_CONFIG[CURRENT_MARKET].domain}/opengraph-image`, width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", images: [`https://${MARKET_CONFIG[CURRENT_MARKET].domain}/opengraph-image`] },
};

const TOC: TocSection[] = [
  { id: "razlika-u-sastavu", title: "Gdje je razlika zapravo nastala" },
  { id: "wpc-prednost", title: "Zašto WPC nije 'lošija' verzija", level: 3 },
  { id: "wpi-prednost", title: "Kada čistoća stvarno igra ulogu", level: 3 },
  { id: "hidrolizat", title: "Hidrolizat — treća, skuplja opcija", level: 3 },
  { id: "za-koga-sto", title: "Tko treba isolate, a tko concentrate" },
  { id: "godisnji-trosak", title: "Razlika u cijeni na godišnjoj razini" },
  { id: "live-cijene", title: "Aktualne cijene u Hrvatskoj" },
  { id: "faq", title: "Često postavljana pitanja" },
];

function ppg(p: Product): number | null {
  if (!p.numericPrice || !p.primaryWeightGrams || !p.proteinPer100g) return null;
  const t = p.primaryWeightGrams * (p.proteinPer100g / 100);
  return t > 0 ? p.numericPrice / t : null;
}

const faqItems = [
  {
    q: "Je li whey isolate uvijek bolji izbor od concentrate?",
    a: "Nije nužno. Isolate je čistiji i sadrži manje laktoze i masti, ali za rekreativca koji trenira 3-4 puta tjedno ta razlika se u praksi ne osjeti. Concentrate uz istu prehranu i trening daje praktički identičan rezultat, samo po nižoj cijeni.",
  },
  {
    q: "Koliko je isolate skuplji od concentrate u Hrvatskoj?",
    a: "Na hrvatskom tržištu isolate iste marke obično košta 20-40% više po kilogramu od concentrate. Ta razlika ima smisla ako imate konkretan razlog za nju — intoleranciju na laktozu ili strogu dijetu — a manje smisla ako je razlog samo 'čini se boljim'.",
  },
  {
    q: "Izaziva li concentrate probleme s probavom?",
    a: "Kod osoba s intolerancijom na laktozu može — concentrate sadrži 3-5g laktoze na 100g praška, dok isolate ima ispod 0.5g. Ako primijetite nadutost ili plinove poslije shakea s concentrate, isolate je jednostavno rješenje.",
  },
  {
    q: "Postoji li razlika u okusu između isolate i concentrate?",
    a: "Da, concentrate je obično kremastiji i punijeg okusa zbog zaostalih masti i laktoze. Isolate zna biti vodenastiji i 'čišćeg' okusa. Za mnoge je to razlog da ipak ostanu na concentrate ako im nutricionistička razlika nije bitna.",
  },
];

const BASE = `https://${MARKET_CONFIG[CURRENT_MARKET].domain}`;
const SLUG = "/hr-vodici/whey-isolate-vs-concentrate-hrvatska";

export default async function Page() {
  if (CURRENT_MARKET !== "hr") notFound();
  const [concentrates, isolates] = await Promise.all([
    fetchTopProducts({ category: "whey_concentrate", sortBy: "valueScore", limit: 3 }),
    fetchTopProducts({ category: "whey_isolate", sortBy: "valueScore", limit: 3 }),
  ]);

  const bestWpc = [...concentrates].filter((p) => ppg(p) !== null).sort((a, b) => (ppg(a) ?? 99) - (ppg(b) ?? 99))[0];
  const bestWpi = [...isolates].filter((p) => ppg(p) !== null).sort((a, b) => (ppg(a) ?? 99) - (ppg(b) ?? 99))[0];
  const dateModified = new Date().toISOString().split("T")[0];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Whey Isolate ili Concentrate — koja je razlika i što odabrati?",
      datePublished: "2026-08-01",
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
            <Link href="/hr-vodici" className="hover:text-[#FF9900] transition-colors">Vodiči</Link>
            <span>/</span>
            <span className="text-slate-600">Whey Isolate vs Concentrate</span>
          </nav>

          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-4">
              Whey Isolate ili Concentrate — što odabrati?
            </h1>
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <span>7 min čitanja</span>
              <span>·</span>
              <time dateTime={dateModified}>Ažurirano: kolovoz 2026.</time>
            </div>
          </div>

          <p className="text-lg text-slate-700 leading-relaxed mb-8 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
            Concentrate (WPC) sadrži <strong className="text-slate-900">70-80% proteina</strong> i jeftiniji je; isolate (WPI) sadrži <strong className="text-slate-900">85-95% proteina</strong>, gotovo je bez laktoze i ima minimalno masti. Za većinu rekreativaca concentrate je posve dovoljan izbor. Isolate ima smisla ako ne podnosite laktozu ili ste u strogoj fazi mršavljenja.
          </p>

          <GuideToc sections={TOC} />

          <section className="mb-10" id="razlika-u-sastavu">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Gdje je razlika zapravo nastala</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700 mb-5">
              <p>
                Oba proizvoda potječu iz surutke — tekućeg nusproizvoda koji ostaje pri proizvodnji sira. Razlika nastaje u koraku filtracije. Concentrate prolazi kroz blažu filtraciju pa zadržava dio masti, ugljikohidrata i laktoze, ali i bioaktivne sastojke surutke. Isolate se filtrira dodatnim koracima (mikrofiltracija ili ionska izmjena) koji uklanjaju gotovo sve osim čistog proteina.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 min-w-[140px]">Na 100g praška</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 whitespace-nowrap">Whey Concentrate</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-[#FF9900] whitespace-nowrap">Whey Isolate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      { p: "Proteini", c: "70-80g", i: "85-94g", hl: true },
                      { p: "Masti", c: "3-5g", i: "<1g", hl: false },
                      { p: "Ugljikohidrati", c: "4-8g", i: "<2g", hl: false },
                      { p: "Laktoza", c: "3-5g", i: "<0.5g", hl: true },
                      { p: "Kalorije", c: "~380 kcal", i: "~360 kcal", hl: false },
                      { p: "Bioaktivne frakcije", c: "Zadržane (laktoferin, IgG)", i: "Djelomično uklonjene", hl: false },
                      { p: "Cijena 2kg pakiranja", c: "35-55 EUR", i: "55-85 EUR", hl: true },
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

            <h3 id="wpc-prednost" className="text-[17px] font-bold text-slate-800 mt-4 mb-3">Zašto WPC nije &quot;lošija&quot; verzija</h3>
            <div className="space-y-3 text-[15px] leading-relaxed text-slate-700">
              <p>
                Concentrate u sebi nosi <strong className="text-slate-900">laktoferin, alfa-laktalbumin i imunoglobuline</strong> — spojeve koji imaju antioksidativna i imunomodulatorna svojstva, a isolate ih velikim dijelom gubi tijekom intenzivnije filtracije. Za rast mišića ili sportske performanse ta razlika je zanemariva, ali marketing rijetko spominje da &quot;manje pročišćeno&quot; ne znači i &quot;lošije&quot;.
              </p>
            </div>

            <h3 id="wpi-prednost" className="text-[17px] font-bold text-slate-800 mt-6 mb-3">Kada čistoća stvarno igra ulogu</h3>
            <div className="space-y-3 text-[15px] leading-relaxed text-slate-700">
              <p>
                Isolate opravdava svoju cijenu u tri konkretne situacije: intolerancija na laktozu (nadutost, plinovi poslije WPC-a), faza mršavljenja gdje se broji svaki gram masti i ugljikohidrata, ili priprema za natjecanje. Izvan tih slučajeva, razlika u rezultatima naspram concentrate u istraživanjima je minimalna ili je nema.
              </p>
            </div>

            <h3 id="hidrolizat" className="text-[17px] font-bold text-slate-800 mt-6 mb-3">Hidrolizat — treća, skuplja opcija</h3>
            <div className="space-y-3 text-[15px] leading-relaxed text-slate-700">
              <p>
                Hidrolizat (whey hydrolysate) je protein koji je enzimima djelomično već razgrađen, pa se aminokiseline oslobađaju brže nego kod isolate. Ujedno je i najskuplji od sva tri tipa. Istraživanja pokazuju brži porast razine leucina u krvi nakon konzumacije, ali dugoročna prednost u izgradnji mišića naspram isolate za rekreativce nije klinički značajna — plaćate brzinu koja rijetko donosi razliku u praksi.
              </p>
            </div>
          </section>

          <section className="mb-10" id="za-koga-sto">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Tko treba isolate, a tko concentrate</h2>
            <div className="space-y-3">
              {[
                {
                  who: "Rekreativac bez intolerancije na laktozu",
                  rec: "Whey Concentrate",
                  color: "bg-green-50 border-green-200 text-green-700",
                  why: "Praktički isti rezultat za manje novca. Razlika od par grama proteina po porciji ne opravdava 20-40% veću cijenu.",
                },
                {
                  who: "Osoba s intolerancijom na laktozu",
                  rec: "Whey Isolate",
                  color: "bg-blue-50 border-blue-200 text-blue-700",
                  why: "Ispod 0.5g laktoze na 100g — najčešće bez problema i kod osjetljivijeg probavnog sustava. WPC ovdje realno može smetati.",
                },
                {
                  who: "Faza mršavljenja / stroga dijeta",
                  rec: "Whey Isolate",
                  color: "bg-blue-50 border-blue-200 text-blue-700",
                  why: "Minimalno masti i ugljikohidrata po porciji. Kad se broji svaki gram, ta razlika postaje mjerljiva.",
                },
                {
                  who: "Vegan ili netolerancija na mliječne proteine",
                  rec: "Biljni protein",
                  color: "bg-violet-50 border-violet-200 text-violet-700",
                  why: "Ni WPC ni WPI nisu opcija. Kombinacija graška i riže pokriva sve esencijalne aminokiseline.",
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

          <section className="mb-10" id="godisnji-trosak">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Razlika u cijeni na godišnjoj razini</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700 mb-5">
              <p>
                Ako trošite jedno pakiranje od 2kg mjesečno i prijeđete s concentrate na isolate bez konkretnog razloga, razlika u trošku brzo poraste:
              </p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm overflow-x-auto mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Tip</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500">Mjesečno</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500">Godišnje</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="px-3 py-2.5 text-slate-700">Whey Concentrate (prosjek)</td>
                    <td className="px-3 py-2.5 text-right text-slate-600">~42 EUR</td>
                    <td className="px-3 py-2.5 text-right text-slate-600">~500 EUR</td>
                  </tr>
                  <tr className="bg-slate-50/60">
                    <td className="px-3 py-2.5 text-slate-700">Whey Isolate (prosjek)</td>
                    <td className="px-3 py-2.5 text-right text-slate-700">~62 EUR</td>
                    <td className="px-3 py-2.5 text-right font-semibold text-slate-800">~740 EUR</td>
                  </tr>
                  <tr className="bg-[#FFF8EC]">
                    <td className="px-3 py-2.5 font-bold text-slate-800">Razlika</td>
                    <td className="px-3 py-2.5 text-right font-bold text-[#FF9900]">~20 EUR</td>
                    <td className="px-3 py-2.5 text-right font-bold text-[#FF9900]">~240 EUR</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-[14px] text-slate-500">
              240 EUR godišnje za razliku koju prosječan rekreativac vjerojatno neće osjetiti u rezultatima treninga — osim ako imate konkretan medicinski ili dijetetski razlog za isolate.
            </p>
          </section>

          {(concentrates.length > 0 || isolates.length > 0) && (
            <section className="mb-10" id="live-cijene">
              <h2 className="text-xl font-bold text-slate-900 mb-2">Aktualne cijene u Hrvatskoj</h2>
              <p className="text-[14px] text-slate-500 mb-5">
                Top opcije po Value Score-u iz svih praćenih trgovina. Cijene se ažuriraju svaki tjedan.
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
                            <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 whitespace-nowrap hidden sm:table-cell">EUR/g prot.</th>
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
                                  {pg ? pg.toFixed(2) : "—"}
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

          <section className="mb-10" id="faq">
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

          <section className="mb-8">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Znanstvene reference</h2>
            <ol className="space-y-1.5 text-[13px] text-slate-500 list-decimal pl-4">
              <li>Tang JE et al. (2009). Ingestion of whey hydrolysate, casein, or soy protein isolate: effects on mixed muscle protein synthesis. <em>Journal of Applied Physiology</em>, 107(3), 987-992.</li>
              <li>Churchward-Venne TA et al. (2012). Supplementation of a suboptimal protein dose with leucine or essential amino acids. <em>Journal of Physiology</em>, 590(11), 2751-2765.</li>
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
              <Link href="/hr-vodici/koliko-proteina-dnevno-hrvatska" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Koliko proteina dnevno?
              </Link>
              <Link href="/hr-vodici/koliko-kosta-protein-hrvatska" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Koliko košta protein u HR?
              </Link>
            </div>
          </section>

          <div className="bg-[#1B2B4B] rounded-2xl p-6 text-white text-center">
            <p className="text-base leading-relaxed mb-4">
              Usporedite sve isolate i concentrate proteine dostupne u Hrvatskoj — sortirano po Value Score-u.
            </p>
            <Link href="/kategorija/whey-isolate?sort=valueScore,desc"
              className="inline-block px-6 py-3 bg-[#FF9900] hover:bg-[#e68a00] text-[#131921] font-bold rounded-xl text-sm transition-colors">
              Pogledajte whey isolate proteine →
            </Link>
          </div>
        </main>
      </div>
    </>
  );
}
