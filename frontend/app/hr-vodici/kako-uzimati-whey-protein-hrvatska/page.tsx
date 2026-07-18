import { notFound } from "next/navigation";
import { CURRENT_MARKET, MARKET_CONFIG } from "@/lib/marketConfig";
import { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import GuideToc, { TocSection } from "@/components/GuideToc";
import GuideDisclaimer from "@/components/GuideDisclaimer";
import { fetchTopProducts } from "@/lib/seo-data";
import { productUrl } from "@/lib/productUrl";
import { Product } from "@/types/product";

export const revalidate = 86400;

const TITLE = "Kako uzimati whey protein — doza, tajming, miješanje i pogreške koje ga čine beskorisnim | Proteinoteka";
const DESCRIPTION =
  "Točna dnevna doza po cilju, kad ga piti tijekom dana, kako ga pravilno miješati da ne pravi grudice, s čime ga kombinirati i koje su najčešće pogreške zbog kojih shake ne daje rezultate.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: {
    canonical: `https://${MARKET_CONFIG[CURRENT_MARKET].domain}/hr-vodici/kako-uzimati-whey-protein-hrvatska`,
    languages: {
      sr: "https://proteinoteka.rs/vodici/kako-uzimati-whey-protein",
      hr: "https://proteinoteka.com.hr/hr-vodici/kako-uzimati-whey-protein-hrvatska",
      "x-default": "https://proteinoteka.rs/vodici/kako-uzimati-whey-protein",
    },
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `https://${MARKET_CONFIG[CURRENT_MARKET].domain}/hr-vodici/kako-uzimati-whey-protein-hrvatska`,
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

const tocSections: TocSection[] = [
  { id: "kratak-odgovor", title: "Kratak odgovor" },
  { id: "doza-po-cilju", title: "Točna doza po cilju" },
  { id: "kad-tijekom-dana", title: "Kad ga piti tijekom dana" },
  { id: "kako-mijesati", title: "Kako pravilno miješati" },
  { id: "kombiniranje", title: "S čime kombinirati (i što ne)" },
  { id: "gornja-granica", title: "Gornja granica i sigurnost" },
  { id: "pogreske", title: "Najčešće pogreške pri uzimanju" },
  { id: "top-proizvodi", title: "Top 3 whey proteina trenutno" },
  { id: "faq", title: "Često postavljana pitanja" },
];

function pricePerGramProtein(p: Product): number | null {
  if (!p.numericPrice || !p.primaryWeightGrams || !p.proteinPer100g) return null;
  const totalProteinG = p.primaryWeightGrams * (p.proteinPer100g / 100);
  if (totalProteinG <= 0) return null;
  return p.numericPrice / totalProteinG;
}

const faqItems = [
  {
    q: "Mora li se whey protein piti svaki dan bez pauze?",
    a: "Ne postoji potreba za 'pauzama' od proteina u prahu — to je hrana, ne stimulans na koji tijelo razvija toleranciju. Uzimate ga onim danima kad vam pomaže dostići dnevni cilj unosa proteina, uključujući i dane bez treninga, jer se mišići ne oporavljaju samo u teretani nego 24 sata dnevno.",
  },
  {
    q: "Ima li smisla piti protein ako tog dana niste trenirali?",
    a: "Da. Dnevni unos proteina je ono što gradi i održava mišićnu masu, ne pojedinačni trening. Ako vam je cilj 150g proteina dnevno, taj cilj vrijedi i u dane odmora — tijelo tada aktivno obnavlja tkivo oštećeno prethodnim treninzima.",
  },
  {
    q: "Smije li se whey protein miješati s toplim napitcima poput kave ili čaja?",
    a: "Blago topao napitak (do ~50°C) neće uništiti protein niti mu bitno promijeniti nutritivnu vrijednost, ali izaziva grudice jer se whey proteini denaturiraju i sljepljuju na višoj temperaturi. Ako želite protein kavu, pričekajte da se kava ohladi na mlaku temperaturu prije nego dodate prah, ili prvo umiješajte malo hladne vode za glatku bazu.",
  },
  {
    q: "Je li bolje piti jedan veliki shake ili više manjih doza tijekom dana?",
    a: "Za većinu ljudi razlika je zanemariva ako je ukupan dnevni unos proteina isti. Raspodjela na 3-4 obroka od 25-40g ima blagu prednost u istraživanjima o sintezi mišićnih proteina u odnosu na jedan ogroman obrok, ali to je efekt drugog reda — ukupan dnevni unos i dalje je najvažniji faktor.",
  },
  {
    q: "Može li whey protein izazvati plinove i nadutost?",
    a: "Da, najčešće zbog laktoze u whey koncentratu. Ako primijetite nadutost 30-60 minuta nakon shakea, probajte whey izolat (gotovo bez laktoze) ili smanjite porciju na 20-25g i postupno je povećavajte. Kod trajnih simptoma provjerite intoleranciju na laktozu kod liječnika prije nego mijenjate suplemente.",
  },
  {
    q: "Ističe li protein u prahu i je li opasno piti istekli?",
    a: "Da, ističe — obično 12-24 mjeseca od proizvodnje. Istekao protein rijetko je opasan, ali gubi na kvaliteti (oksidacija masti, promjena okusa, mogući rast bakterija ako je vlaga ušla u pakiranje). Najbolje pravilo: ako miriše užeglo ili je zgrudan, bacite ga.",
  },
];

const BASE = `https://${MARKET_CONFIG[CURRENT_MARKET].domain}`;
const SLUG = "/hr-vodici/kako-uzimati-whey-protein-hrvatska";

function buildJsonLd(products: Product[]) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Kako uzimati whey protein — doza, tajming, miješanje i pogreške koje ga čine beskorisnim",
      datePublished: "2026-07-18",
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
        { "@type": "ListItem", position: 2, name: "Vodiči", item: `${BASE}/hr-vodici` },
        { "@type": "ListItem", position: 3, name: "Kako uzimati whey protein", item: `${BASE}${SLUG}` },
      ],
    },
    ...(products.length > 0
      ? [
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            itemListElement: products.map((p, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: `${BASE}${productUrl(p)}`,
              name: p.name,
            })),
          },
        ]
      : []),
  ];
}

export default async function Page() {
  if (CURRENT_MARKET !== 'hr') notFound();

  const topProducts = await fetchTopProducts({
    category: "whey_concentrate",
    sortBy: "valueScore",
    limit: 3,
  });
  const topProductsWithPPG = topProducts.map((p) => ({ ...p, ppg: pricePerGramProtein(p) }));
  const jsonLd = buildJsonLd(topProducts);

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
            <Link href="/hr-vodici" className="hover:text-[#FF9900] transition-colors">Vodiči</Link>
            <span>/</span>
            <span className="text-slate-600">Kako uzimati whey protein</span>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-4">
              Kako uzimati whey protein — doza, tajming, miješanje i pogreške koje ga čine beskorisnim
            </h1>
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <span>9 min čitanja</span>
              <span>·</span>
              <span>Ažurirano: srpanj 2026.</span>
            </div>
          </div>

          {/* Quick answer */}
          <div id="kratak-odgovor" className="mb-8 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-lg text-slate-700 leading-relaxed">
              <strong className="text-slate-900">Kratki odgovor:</strong> pomnožite tjelesnu masu s 1.6–2.2 da dobijete dnevni cilj u gramima proteina, pa taj cilj rasporedite na 3–4 porcije od 25–40g tijekom dana — bez obzira jeste li trenirali ili ne. Miješajte s hladnom ili mlakom tekućinom (nikad vrelom), pijte ga kad vam odgovara u rasponu od nekoliko sati oko treninga, i držite se jednog tipa dok vam tijelo ne pokaže da mu nešto ne odgovara (nadutost, plinovi).
            </p>
          </div>

          <GuideToc sections={tocSections} />

          {/* Section 1 */}
          <section className="mb-10">
            <h2 id="doza-po-cilju" className="text-xl font-bold text-slate-900 mb-4">Točna doza po cilju</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700 mb-5">
              <p>
                Formula <strong className="text-slate-900">1.6–2.2g proteina po kilogramu tjelesne mase</strong> znanstveni je konsenzus (ISSN Position Stand, vidi izvore ispod), ali ta dva broja nisu proizvoljna — poziciju u rasponu birate prema cilju:
              </p>
            </div>

            <div className="space-y-3 mb-6">
              {[
                {
                  label: "Održavanje / rekreativni trening",
                  range: "1.6g/kg",
                  desc: "Dovoljno da pokrijete oporavak uz 2-3 treninga tjedno. Iznad ove granice rijetko vidite dodatnu korist ako vam nije cilj čist rast mišićne mase.",
                },
                {
                  label: "Izgradnja mišićne mase (bulking)",
                  range: "1.8–2.0g/kg",
                  desc: "Uz kalorijski suficit i progresivno opterećenje, ovaj raspon maksimizira sintezu mišićnih proteina bez nepotrebnog viška.",
                },
                {
                  label: "Mršavljenje / definicija (cutting)",
                  range: "2.0–2.4g/kg",
                  desc: "U kalorijskom deficitu tijelo lakše koristi mišić kao gorivo — viši unos proteina štiti mišićnu masu dok gubite mast. Ovdje protein u prahu često ima najviše smisla jer je nizak u kalorijama po gramu proteina.",
                },
              ].map(({ label, range, desc }) => (
                <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="font-bold text-slate-900 text-[15px]">{label}</span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-[#FFF8EC] text-[#b36b00] border-[#FF9900]/30">
                      {range}
                    </span>
                  </div>
                  <p className="text-[14px] text-slate-600 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-4">
              <div className="px-4 py-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Konkretni primjeri</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-left">
                      <th className="px-4 py-2.5 text-xs font-semibold text-slate-500">Tjelesna masa</th>
                      <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 text-right whitespace-nowrap">Održavanje</th>
                      <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 text-right whitespace-nowrap">Masa</th>
                      <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 text-right whitespace-nowrap">Definicija</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      { w: 60, m: 96, b: "108–120", c: "120–144" },
                      { w: 75, m: 120, b: "135–150", c: "150–180" },
                      { w: 90, m: 144, b: "162–180", c: "180–216" },
                    ].map((row) => (
                      <tr key={row.w} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-800">{row.w} kg</td>
                        <td className="px-4 py-3 text-right text-slate-700">{row.m}g</td>
                        <td className="px-4 py-3 text-right text-slate-700">{row.b}g</td>
                        <td className="px-4 py-3 text-right text-slate-700">{row.c}g</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="text-[14px] text-slate-500 leading-relaxed">
              Iz hrane (meso, jaja, mliječni proizvodi, mahunarke) realno dobivate 60-70% ovog cilja kroz normalne obroke. Shake ili dva popunjavaju ostatak — ne treba vam cijeli dnevni unos iz praška. Detaljnu tablicu po cilju i razini aktivnosti pronađite u{" "}
              <Link href="/hr-vodici/koliko-proteina-dnevno-hrvatska" className="text-[#FF9900] hover:underline font-medium">
                vodiču &quot;Koliko proteina dnevno&quot; →
              </Link>
            </p>
          </section>

          {/* Section 2 */}
          <section className="mb-10">
            <h2 id="kad-tijekom-dana" className="text-xl font-bold text-slate-900 mb-4">Kad ga piti tijekom dana</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700 mb-5">
              <p>
                Ključna promjena u razmišljanju: pitanje nije &quot;koji je idealan trenutak za protein&quot; nego &quot;kako rasporediti ukupan dnevni unos&quot;. Tijelo sintetizira mišićne proteine u valovima tijekom cijelog dana, ne samo nakon treninga.
              </p>
            </div>

            <div className="space-y-3 mb-5">
              {[
                {
                  time: "3-4 porcije dnevno",
                  desc: "Podijelite dnevni cilj na obroke od 25-40g, raspoređene svakih 3-5 sati. Ovo drži razinu aminokiselina u krvi stabilnom tijekom cijelog dana, umjesto jednog naglog skoka.",
                },
                {
                  time: "Oko treninga (prije ili poslije)",
                  desc: "I dalje ima smisla imati jednu porciju u radijusu od par sati oko treninga — samo ne morate žuriti. Ako ste jeli obrok 2h prije treninga, post-workout shake možete popiti i sat vremena kasnije.",
                },
                {
                  time: "Prije spavanja",
                  desc: "Whey nije idealan izbor za noć jer se brzo apsorbira. Ako vam je cilj noćni oporavak, kazein (sporo-apsorbirajući protein) ili obrok s mliječnim proizvodima ima više smisla. Whey prije spavanja nije loš, samo nije optimalan.",
                },
              ].map(({ time, desc }) => (
                <div key={time} className="flex flex-col sm:flex-row gap-2 sm:gap-4 bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <span className="shrink-0 sm:w-40 text-[13px] font-bold text-[#FF9900] mt-0.5">{time}</span>
                  <p className="text-[14px] text-slate-700 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Section 3 */}
          <section className="mb-10">
            <h2 id="kako-mijesati" className="text-xl font-bold text-slate-900 mb-4">Kako pravilno miješati</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                <strong className="text-slate-900">Voda ili mlijeko?</strong> Voda daje bržu apsorpciju i manje kalorija (30g proteina = ~120 kcal). Mlijeko je ukusnije i dodaje 100-150 kcal i dodatnih 8-10g proteina, ali usporava apsorpciju zbog masti i laktoze — za post-workout je voda praktičniji izbor, za doručak ili međuobrok mlijeko je sasvim u redu.
              </p>
              <p>
                <strong className="text-slate-900">Zašto nastaju grudice.</strong> Whey proteini osjetljivi su na toplinu — na temperaturi iznad ~60°C počinju se denaturirati i sljepljivati u grudice umjesto da se otope. Zato nikad ne sipajte protein u vruće mlijeko ili čaj. Koristite sobnu temperaturu ili hladnu tekućinu.
              </p>
              <p>
                <strong className="text-slate-900">Redoslijed je bitan.</strong> Prvo sipajte tekućinu u shaker, pa tek onda prah — obrnuti redoslijed (prah pa tekućina) puno lakše pravi grudice na dnu jer se prah sljepi prije nego dođe u kontakt s dovoljno tekućine.
              </p>
              <p>
                <strong className="text-slate-900">Shaker vs. blender.</strong> Shaker s mrežicom (blender ball) brži je i dovoljan za samu tekućinu. Ako miješate u smoothie s voćem, zobenim pahuljicama ili maslacem od kikirikija, blender daje glatkiju teksturu — dodajte prah zadnji, nakon tekućih sastojaka, iz istog razloga kao gore.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section className="mb-10">
            <h2 id="kombiniranje" className="text-xl font-bold text-slate-900 mb-4">S čime kombinirati (i što ne)</h2>
            <div className="space-y-3">
              {[
                {
                  title: "Kreatin monohidrat",
                  ok: true,
                  desc: "Odlična kombinacija — nema interakcije, možete ih pomiješati u istom shakeru. Kreatin ne mora se piti baš uz protein, ali je praktično kad već miješate.",
                },
                {
                  title: "Ugljikohidrati nakon treninga",
                  ok: true,
                  desc: "Banana, zobene pahuljice ili med u shakeu nakon treninga pomažu punjenju glikogena i nisu neophodni, ali nisu ni štetni — dobra opcija ako vam trening bude iscrpljujući.",
                },
                {
                  title: "Kava / kofein",
                  ok: true,
                  desc: "Bez problema se kombiniraju, samo pazite na temperaturu kave (vidi odjeljak o miješanju) da izbjegnete grudice.",
                },
                {
                  title: "\"Probavni enzimi\" i BCAA dodani na protein",
                  ok: false,
                  desc: "Marketing preko potrebe — whey protein sam po sebi već sadrži sve esencijalne aminokiseline uključujući BCAA, a zdrav probavni sustav ne treba dodatne enzime da bi ga svario. Plaćate premiju za nešto što vaše tijelo već radi.",
                },
                {
                  title: "Alkohol u istom obroku",
                  ok: false,
                  desc: "Ne postoji direktna opasna interakcija, ali alkohol privremeno smanjuje sintezu mišićnih proteina — ako vam je cilj rast mišića, nemojte očekivati da će shake 'neutralizirati' večer izlaska.",
                },
              ].map(({ title, ok, desc }) => (
                <div key={title} className="flex gap-3 bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <span className={`font-bold text-lg shrink-0 mt-0.5 ${ok ? "text-green-500" : "text-red-400"}`}>
                    {ok ? "✓" : "✕"}
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900 text-[15px]">{title}</p>
                    <p className="text-[14px] text-slate-600 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 5 */}
          <section className="mb-10">
            <h2 id="gornja-granica" className="text-xl font-bold text-slate-900 mb-4">Gornja granica i sigurnost</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                <strong className="text-slate-900">Mit o oštećenju bubrega.</strong> Ne postoji dokaz da visok unos proteina oštećuje zdrave bubrege. Jednogodišnja studija (Antonio i sur., 2016) pratila je trenirane muškarce na unosu preko 3g/kg tjelesne mase — bez negativnih promjena u markerima bubrežne funkcije. Mit potječe iz istraživanja na pacijentima koji već imaju bubrežnu bolest, gdje je ograničenje proteina doista dio terapije. Ako nemate dijagnosticiran problem s bubrezima, standardni sportski unos proteina nije rizik.
              </p>
              <p>
                <strong className="text-slate-900">Gdje je stvarna gornja granica?</strong> Meta-regresija (Morton i sur., 2018) pokazala je da korist od proteinske suplementacije za rast mišića plato-ira otprilike na <strong className="text-slate-800">1.6g/kg dnevno</strong> — iznad toga dodatni protein više ne ubrzava rast mišića, iako ostaje siguran. Drugim riječima: 2.2g/kg nije opasno, samo je iznad te točke višak uglavnom dodatni trošak, ne dodatni mišić.
              </p>
              <p>
                <strong className="text-slate-900">Probavna podnošljivost.</strong> Ako vam nadutost ili plinovi prave problem, najčešći krivac je laktoza u whey koncentratu. Rješenje: prijeđite na whey izolat (gotovo bez laktoze), smanjite porciju na 20g i postupno je povećavajte tijekom 1-2 tjedna, ili prebacite dio unosa na biljni protein.
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section className="mb-10">
            <h2 id="pogreske" className="text-xl font-bold text-slate-900 mb-4">Najčešće pogreške pri uzimanju</h2>
            <div className="space-y-3">
              {[
                {
                  title: "Sve odjednom, jednom dnevno",
                  desc: "Jedan ogroman shake od 60g proteina ujutro ne pokriva potrebe organizma tijekom cijelog dana jednako dobro kao raspodjela na 3-4 manje porcije.",
                },
                {
                  title: "Miješanje u vrelom mlijeku ili čaju",
                  desc: "Direktan put do grudica koje nitko ne voli piti. Pričekajte da tekućina bude mlaka ili hladna.",
                },
                {
                  title: "Ignoriranje deklaracije šećera",
                  desc: "Neki aromatizirani proteini imaju 8-12g šećera po porciji — to je gotovo kao da pijete sok uz protein. Ciljajte ispod 3g šećera na 100g praha.",
                },
                {
                  title: "Čuvanje otvorenog pakiranja na vlazi ili toplini",
                  desc: "Protein u prahu upija vlagu iz zraka, što ubrzava kvarenje i stvara grudice u samom pakiranju. Držite ga zatvorenog, na sobnoj temperaturi, dalje od kuhinjske pare.",
                },
                {
                  title: "Preskakanje obroka jer 'imam shake'",
                  desc: "Protein u prahu dodatak je prehrani, ne zamjena za obrok s vlaknima, mikronutrijentima i drugim makronutrijentima koje cijeli obrok pruža.",
                },
              ].map(({ title, desc }) => (
                <div key={title} className="flex gap-3 bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <span className="text-red-400 font-bold text-lg shrink-0 mt-0.5">✕</span>
                  <div>
                    <p className="font-semibold text-slate-900 text-[15px]">{title}</p>
                    <p className="text-[14px] text-slate-600 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Top 3 products */}
          {topProductsWithPPG.length > 0 && (
            <section className="mb-10">
              <h2 id="top-proizvodi" className="text-xl font-bold text-slate-900 mb-4">Top 3 whey proteina trenutno</h2>
              <p className="text-[15px] text-slate-700 leading-relaxed mb-5">
                Kad odlučite da je vrijeme za novo pakiranje, evo trenutno tri najisplativija whey koncentrat proteina po Value Score-u:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {topProductsWithPPG.map((p, i) => (
                  <Link
                    key={p.id}
                    href={productUrl(p)}
                    className="block bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-[#FF9900] hover:shadow-md transition-all"
                  >
                    <span className="inline-block mb-2 px-1.5 py-0.5 bg-[#FF9900]/10 text-[#b36b00] text-[10px] font-bold rounded">
                      #{i + 1}
                    </span>
                    <p className="font-semibold text-slate-900 text-[14px] leading-snug mb-1">{p.name}</p>
                    <p className="text-xs text-slate-400 mb-2">{p.storeName} · {p.price}</p>
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="text-slate-600">{p.ppg ? `${(p.ppg * 100).toFixed(2)} EUR/100g prot.` : "—"}</span>
                      <span className="font-bold text-[#FF9900]">
                        {p.valueScore ? p.valueScore.toFixed(1) : "—"}<span className="text-slate-400 font-normal">/10</span>
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* FAQ */}
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

          {/* Internal links */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Korisni linkovi</h2>
            <div className="flex flex-wrap gap-3">
              <Link href="/hr-vodici/whey-protein-za-pocetnike-hrvatska" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Whey protein za početnike
              </Link>
              <Link href="/hr-vodici/koliko-proteina-dnevno-hrvatska" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Koliko proteina dnevno?
              </Link>
              <Link href="/hr-vodici/koliko-kosta-protein-hrvatska" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Koliko košta protein u Hrvatskoj?
              </Link>
            </div>
          </section>

          {/* CTA */}
          <div className="bg-[#1B2B4B] rounded-2xl p-6 text-white text-center mb-10">
            <p className="text-base leading-relaxed mb-4">
              Pronađite koji whey protein trenutno nudi najviše za vaš novac u Hrvatskoj — sortirano po Value Score-u.
            </p>
            <Link
              href="/?sort=valueScore%2Cdesc"
              className="inline-block px-6 py-3 bg-[#FF9900] hover:bg-[#e68a00] text-[#131921] font-bold rounded-xl text-sm transition-colors"
            >
              Usporedite whey proteine →
            </Link>
          </div>

          {/* Citations */}
          <div className="mb-6 text-xs text-slate-400 leading-relaxed border-t border-slate-200 pt-4">
            <p className="font-semibold text-slate-500 mb-1">Izvori</p>
            <p>
              Jäger et al.,{" "}
              <a href="https://jissn.biomedcentral.com/articles/10.1186/s12970-017-0177-8" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600">
                J Int Soc Sports Nutr 2017
              </a>{" "}
              — ISSN Position Stand: Protein and Exercise.
            </p>
            <p>
              Morton et al.,{" "}
              <a href="https://bjsm.bmj.com/content/52/6/376" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600">
                Br J Sports Med 2018
              </a>{" "}
              — meta-regresija doza-odgovor za proteinsku suplementaciju i mišićnu masu.
            </p>
            <p>
              Schoenfeld &amp; Aragon,{" "}
              <a href="https://jissn.biomedcentral.com/articles/10.1186/1550-2783-10-53" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600">
                J Int Soc Sports Nutr 2013
              </a>{" "}
              — meta-analiza &quot;anaboličkog prozora&quot;.
            </p>
            <p>
              Antonio et al.,{" "}
              <a href="https://onlinelibrary.wiley.com/doi/10.1155/2016/9104792" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600">
                J Nutr Metab 2016
              </a>{" "}
              — jednogodišnja studija, visok unos proteina bez štetnih učinaka na trenirane osobe.
            </p>
          </div>

          <GuideDisclaimer />
        </main>
      </div>
    </>
  );
}
