import { notFound } from "next/navigation";
import { CURRENT_MARKET, MARKET_CONFIG } from '@/lib/marketConfig';
import { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import VodiciNav from "@/components/VodiciNav";
import GuideToc, { TocSection } from "@/components/GuideToc";
import GuideDisclaimer from "@/components/GuideDisclaimer";
import { fetchTopProducts } from "@/lib/seo-data";
import { productUrl } from "@/lib/productUrl";
import { Product } from "@/types/product";

export const revalidate = 86400;

const TITLE = "Kako uzimati whey protein — doza, tajming, mešanje i greške koje ga čine beskorisnim | Proteinoteka";
const DESCRIPTION =
  "Tačna dnevna doza po cilju, kad ga piti tokom dana, kako ga pravilno mešati da ne pravi grudvice, sa čim ga kombinovati i koje su najčešće greške zbog kojih šejk ne daje rezultate.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: {
    canonical: `https://${MARKET_CONFIG[CURRENT_MARKET].domain}/vodici/kako-uzimati-whey-protein`,
    languages: {
      sr: "https://proteinoteka.rs/vodici/kako-uzimati-whey-protein",
      hr: "https://proteinoteka.com.hr/hr-vodici/kako-uzimati-whey-protein-hrvatska",
      "x-default": "https://proteinoteka.rs/vodici/kako-uzimati-whey-protein",
    },
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `https://${MARKET_CONFIG[CURRENT_MARKET].domain}/vodici/kako-uzimati-whey-protein`,
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
  { id: "doza-po-cilju", title: "Tačna doza po cilju" },
  { id: "kad-tokom-dana", title: "Kad ga piti tokom dana" },
  { id: "kako-mesati", title: "Kako pravilno mešati" },
  { id: "kombinovanje", title: "Sa čim kombinovati (i šta ne)" },
  { id: "gornja-granica", title: "Gornja granica i bezbednost" },
  { id: "greske", title: "Najčešće greške pri uzimanju" },
  { id: "top-proizvodi", title: "Top 3 whey proteina trenutno" },
  { id: "faq", title: "Česta pitanja" },
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
    a: "Ne postoji potreba za 'pauzama' od proteina u prahu — to je hrana, ne stimulans na koji telo razvija toleranciju. Uzimaš ga onim danima kad ti pomaže da dostigneš dnevni cilj unosa proteina, uključujući i dane bez treninga, jer se mišići ne oporavljaju samo u teretani nego 24 časa dnevno.",
  },
  {
    q: "Ima li smisla piti protein ako tog dana nisam trenirao?",
    a: "Da. Dnevni unos proteina je ono što gradi i održava mišićnu masu, ne pojedinačni trening. Ako ti je cilj 150g proteina dnevno, taj cilj važi i u dane odmora — telo tada aktivno obnavlja tkivo oštećeno prethodnim treninzima.",
  },
  {
    q: "Sme li se whey protein mešati sa toplim napicima poput kafe ili čaja?",
    a: "Blago topao napitak (do ~50°C) neće uništiti protein niti mu bitno promeniti nutritivnu vrednost, ali izaziva grudvice jer se whey proteini denaturišu i slepljuju na višoj temperaturi. Ako želiš protein kafu, sačekaj da se kafa ohladi na mlaku temperaturu pre nego što dodaš prah, ili prvo umešaj malo hladne vode da napraviš glatku bazu.",
  },
  {
    q: "Da li je bolje piti jedan veliki šejk ili više manjih doza tokom dana?",
    a: "Za većinu ljudi razlika je zanemarljiva ako je ukupan dnevni unos proteina isti. Raspodela na 3-4 obroka od 25-40g ima blagu prednost u istraživanjima o sintezi mišićnih proteina u odnosu na jedan ogroman obrok, ali to je efekat drugog reda — ukupan dnevni unos je i dalje najvažniji faktor.",
  },
  {
    q: "Može li whey protein da izazove gasove i nadutost?",
    a: "Da, najčešće zbog laktoze u whey concentrate-u. Ako primetiš nadutost 30-60 minuta posle šejka, probaj whey isolate (gotovo bez laktoze) ili smanji porciju na 20-25g i postepeno je povećavaj. Kod trajnih simptoma proveri intoleranciju na laktozu kod lekara pre nego što menjaš suplemente.",
  },
  {
    q: "Da li protein u prahu ističe i da li je opasno piti istekli?",
    a: "Da, ističe — obično 12-24 meseca od proizvodnje. Istekao protein retko je opasan, ali gubi na kvalitetu (oksidacija masti, promena ukusa, mogući rast bakterija ako je vlaga ušla u pakovanje). Najbolje pravilo: ako miriše užeglo ili je nakupine, baci ga.",
  },
];

const BASE = `https://${MARKET_CONFIG[CURRENT_MARKET].domain}`;
const SLUG = "/vodici/kako-uzimati-whey-protein";

function buildJsonLd(products: Product[]) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Kako uzimati whey protein — doza, tajming, mešanje i greške koje ga čine beskorisnim",
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
        { "@type": "ListItem", position: 2, name: "Vodiči", item: `${BASE}/vodici` },
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
  if (CURRENT_MARKET !== 'rs') notFound();

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
            <Link href="/vodici" className="hover:text-[#FF9900] transition-colors">Vodiči</Link>
            <span>/</span>
            <span className="text-slate-600">Kako uzimati whey protein</span>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-4">
              Kako uzimati whey protein — doza, tajming, mešanje i greške koje ga čine beskorisnim
            </h1>
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <span>9 min čitanja</span>
              <span>·</span>
              <span>Ažurirano: jul 2026.</span>
            </div>
          </div>

          {/* Quick answer */}
          <div id="kratak-odgovor" className="mb-8 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-lg text-slate-700 leading-relaxed">
              <strong className="text-slate-900">Kratki odgovor:</strong> pomnoži telesnu masu sa 1.6–2.2 da dobiješ dnevni cilj u gramima proteina, pa taj cilj rasporedi na 3–4 porcije od 25–40g tokom dana — svejedno da li si trenirao ili ne. Mešaj sa hladnom ili mlakom tečnošću (nikad vrelom), pij ga kad ti odgovara u rasponu od nekoliko sati oko treninga, i drži se jednog tipa dok ti telo ne pokaže da mu nešto ne odgovara (nadutost, gasovi).
            </p>
          </div>

          <GuideToc sections={tocSections} />

          {/* Section 1 */}
          <section className="mb-10">
            <h2 id="doza-po-cilju" className="text-xl font-bold text-slate-900 mb-4">Tačna doza po cilju</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700 mb-5">
              <p>
                Formula <strong className="text-slate-900">1.6–2.2g proteina po kilogramu telesne mase</strong> je naučni konsenzus (ISSN Position Stand, videti izvore ispod), ali ta dva broja nisu proizvoljna — biraš poziciju u opsegu prema cilju:
              </p>
            </div>

            <div className="space-y-3 mb-6">
              {[
                {
                  label: "Održavanje / rekreativni trening",
                  range: "1.6g/kg",
                  desc: "Dovoljno da pokriješ oporavak uz 2-3 treninga nedeljno. Iznad ove granice retko vidiš dodatnu korist ako ti nije cilj čist rast mišićne mase.",
                },
                {
                  label: "Izgradnja mišićne mase (bulking)",
                  range: "1.8–2.0g/kg",
                  desc: "Uz kalorijski suficit i progresivno opterećenje, ovaj opseg maksimizuje sintezu mišićnih proteina bez nepotrebnog viška.",
                },
                {
                  label: "Mršavljenje / rezanje (cutting)",
                  range: "2.0–2.4g/kg",
                  desc: "U kalorijskom deficitu telo lakše koristi mišić kao gorivo — viši unos proteina štiti mišićnu masu dok gubiš mast. Ovde protein u prahu često ima najviše smisla jer je nizak u kalorijama za gram proteina.",
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
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Konkretni primeri</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-left">
                      <th className="px-4 py-2.5 text-xs font-semibold text-slate-500">Telesna masa</th>
                      <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 text-right whitespace-nowrap">Održavanje</th>
                      <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 text-right whitespace-nowrap">Masa</th>
                      <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 text-right whitespace-nowrap">Rezanje</th>
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
              Iz hrane (meso, jaja, mlečni proizvodi, mahunarke) realno dobijaš 60-70% ovog cilja kroz normalne obroke. Šejk ili dva popunjavaju ostatak — ne treba ti čitav dnevni unos iz praška. Detaljnu tabelu po cilju i nivou aktivnosti nađeš u{" "}
              <Link href="/vodici/koliko-proteina-dnevno" className="text-[#FF9900] hover:underline font-medium">
                vodiču &quot;Koliko proteina dnevno&quot; →
              </Link>
            </p>
          </section>

          {/* Section 2 */}
          <section className="mb-10">
            <h2 id="kad-tokom-dana" className="text-xl font-bold text-slate-900 mb-4">Kad ga piti tokom dana</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700 mb-5">
              <p>
                Ključna promena u razmišljanju: pitanje nije &quot;koji je idealan trenutak za protein&quot; nego &quot;kako da rasporedim ukupan dnevni unos&quot;. Telo sintetiše mišićne proteine u talasima tokom celog dana, ne samo posle treninga.
              </p>
            </div>

            <div className="space-y-3 mb-5">
              {[
                {
                  time: "3-4 porcije dnevno",
                  desc: "Podeli dnevni cilj na obroke od 25-40g, raspoređene svakih 3-5 sati. Ovo drži nivo aminokiselina u krvi stabilnim tokom celog dana, umesto jednog naglog skoka.",
                },
                {
                  time: "Oko treninga (bilo pre ili posle)",
                  desc: "I dalje ima smisla imati jednu porciju u radijusu od par sati oko treninga — samo ne moraš da žuriš. Ako si jeo obrok 2h pre treninga, post-workout šejk možeš popiti i sat vremena kasnije.",
                },
                {
                  time: "Pred spavanje",
                  desc: "Whey nije idealan izbor za noć jer se brzo apsorbuje. Ako ti je cilj noćni oporavak, kazein (sporo-apsorbujući protein) ili obrok sa mlečnim proizvodima ima više smisla. Whey pred spavanje nije loš, samo nije optimalan.",
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
            <h2 id="kako-mesati" className="text-xl font-bold text-slate-900 mb-4">Kako pravilno mešati</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                <strong className="text-slate-900">Voda ili mleko?</strong> Voda daje bržu apsorpciju i manje kalorija (30g proteina = ~120 kcal). Mleko je ukusnije i dodaje 100-150 kcal i dodatnih 8-10g proteina, ali usporava apsorpciju zbog masti i laktoze — za post-workout je voda praktičniji izbor, za doručak ili međuobrok mleko je sasvim u redu.
              </p>
              <p>
                <strong className="text-slate-900">Zašto se prave grudvice.</strong> Whey proteini su osetljivi na toplotu — na temperaturi iznad ~60°C počinju da se denaturišu i slepljuju u grudvice umesto da se rastvore. Zato nikad ne sipaj protein u vruće mleko ili čaj. Koristi sobnu temperaturu ili hladnu tečnost.
              </p>
              <p>
                <strong className="text-slate-900">Redosled je bitan.</strong> Prvo sipaj tečnost u šejker, pa tek onda prah — obrnuti redosled (prah pa tečnost) mnogo lakše pravi grudvice na dnu jer se prah slepi pre nego što dođe do kontakta sa dovoljno tečnosti.
              </p>
              <p>
                <strong className="text-slate-900">Šejker vs. blender.</strong> Šejker sa mrežicom (blender ball) je brži i dovoljan za samu tečnost. Ako mešaš u smoothie sa voćem, ovsenim pahuljicama ili puterom od kikirikija, blender daje glatkiju teksturu — dodaj prah poslednji, posle tečnih sastojaka, iz istog razloga kao gore.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section className="mb-10">
            <h2 id="kombinovanje" className="text-xl font-bold text-slate-900 mb-4">Sa čim kombinovati (i šta ne)</h2>
            <div className="space-y-3">
              {[
                {
                  title: "Kreatin monohidrat",
                  ok: true,
                  desc: "Odlična kombinacija — nema interakcije, možeš ih pomešati u istom šejkeru. Kreatin ne mora da se pije baš uz protein, ali je praktično kad već mešaš.",
                },
                {
                  title: "Ugljeni hidrati posle treninga",
                  ok: true,
                  desc: "Banana, ovsene pahuljice ili med u šejku posle treninga pomažu punjenju glikogena i nisu neophodni, ali nisu ni štetni — dobra opcija ako ti trening bude iscrpljujući.",
                },
                {
                  title: "Kafa / kofein",
                  ok: true,
                  desc: "Bez problema se kombinuju, samo pazi na temperaturu kafe (videti sekciju o mešanju) da izbegneš grudvice.",
                },
                {
                  title: "\"Digestivni enzimi\" i BCAA dodati na protein",
                  ok: false,
                  desc: "Marketing preko potrebe — whey protein sam po sebi već sadrži sve esencijalne aminokiseline uključujući BCAA, i zdrav digestivni sistem ne treba dodatne enzime da bi ga svario. Plaćaš premiju za nešto što ti telo već radi.",
                },
                {
                  title: "Alkohol u istom obroku",
                  ok: false,
                  desc: "Ne postoji direktna opasna interakcija, ali alkohol privremeno smanjuje sintezu mišićnih proteina — ako ti je cilj rast mišića, nemoj očekivati da će šejk 'neutralisati' veče izlaska.",
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
            <h2 id="gornja-granica" className="text-xl font-bold text-slate-900 mb-4">Gornja granica i bezbednost</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                <strong className="text-slate-900">Mit o oštećenju bubrega.</strong> Ne postoji dokaz da visok unos proteina oštećuje zdrave bubrege. Godišnja studija (Antonio i sar., 2016) pratila je trenirane muškarce na unosu preko 3g/kg telesne mase — bez negativnih promena u markerima bubrežne funkcije. Mit potiče iz istraživanja na pacijentima koji već imaju bubrežnu bolest, gde je ograničenje proteina zaista deo terapije. Ako nemaš dijagnostikovan problem sa bubrezima, standardni sportski unos proteina nije rizik.
              </p>
              <p>
                <strong className="text-slate-900">Gde je stvarna gornja granica?</strong> Meta-regresija (Morton i sar., 2018) pokazala je da dobit od proteinske suplementacije za rast mišića plato-uje otprilike na <strong className="text-slate-800">1.6g/kg dnevno</strong> — iznad toga dodatni protein više ne ubrzava rast mišića, iako ostaje bezbedan. Drugim rečima: 2.2g/kg nije opasno, samo je iznad te tačke višak uglavnom samo dodatni trošak, ne dodatni mišić.
              </p>
              <p>
                <strong className="text-slate-900">Digestivna tolerancija.</strong> Ako ti nadutost ili gasovi prave problem, najčešći krivac je laktoza u whey concentrate-u. Rešenje: pređi na whey isolate (gotovo bez laktoze), smanji porciju na 20g i postepeno je povećavaj tokom 1-2 nedelje, ili prebaci deo unosa na biljni protein.
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section className="mb-10">
            <h2 id="greske" className="text-xl font-bold text-slate-900 mb-4">Najčešće greške pri uzimanju</h2>
            <div className="space-y-3">
              {[
                {
                  title: "Sve odjednom, jednom dnevno",
                  desc: "Jedan ogroman šejk od 60g proteina ujutru ne pokriva potrebe organizma tokom celog dana jednako dobro kao raspodela na 3-4 manje porcije.",
                },
                {
                  title: "Mešanje u vrelom mleku ili čaju",
                  desc: "Direktan put do grudvica koje niko ne voli da pije. Sačekaj da tečnost bude mlaka ili hladna.",
                },
                {
                  title: "Ignorisanje deklaracije šećera",
                  desc: "Neki aromatizovani proteini imaju 8-12g šećera po porciji — to je skoro kao da piješ sok uz protein. Ciljaj ispod 3g šećera na 100g praha.",
                },
                {
                  title: "Čuvanje otvorene kese na vlazi ili toploti",
                  desc: "Protein u prahu upija vlagu iz vazduha, što ubrzava kvarenje i stvara grudve u samoj kesi. Drži je zatvorenu, na sobnoj temperaturi, dalje od kuhinjske pare.",
                },
                {
                  title: "Preskakanje hrane jer 'imam šejk'",
                  desc: "Protein u prahu je dodatak ishrani, ne zamena za obrok sa vlaknima, mikronutrijentima i drugim makronutrijentima koje ceo obrok pruža.",
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
                Kad odlučiš da je vreme za novo pakovanje, evo trenutno tri najisplativija whey concentrate proteina po Value Score-u:
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
                      <span className="text-slate-600">{p.ppg ? `${p.ppg.toFixed(1)} RSD/g prot.` : "—"}</span>
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
                Whey protein za početnike
              </Link>
              <Link href="/vodici/koliko-proteina-dnevno" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Koliko proteina dnevno?
              </Link>
              <Link href="/vodici/kada-piti-protein" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Kada piti protein?
              </Link>
              <Link href="/vodici/whey-isolate-vs-concentrate" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Isolate vs Concentrate
              </Link>
            </div>
          </section>

          {/* CTA */}
          <div className="bg-[#1B2B4B] rounded-2xl p-6 text-white text-center mb-10">
            <p className="text-base leading-relaxed mb-4">
              Pronađi koji whey protein trenutno nudi najviše za tvoj novac — sortirano po Value Score-u.
            </p>
            <Link
              href="/?sort=valueScore%2Cdesc"
              className="inline-block px-6 py-3 bg-[#FF9900] hover:bg-[#e68a00] text-[#131921] font-bold rounded-xl text-sm transition-colors"
            >
              Uporedi whey proteine →
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
              — &quot;anabolički prozor&quot; meta-analiza.
            </p>
            <p>
              Antonio et al.,{" "}
              <a href="https://onlinelibrary.wiley.com/doi/10.1155/2016/9104792" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600">
                J Nutr Metab 2016
              </a>{" "}
              — jednogodišnja studija, visok unos proteina bez štetnih efekata na trenirane osobe.
            </p>
          </div>

          <GuideDisclaimer />

          <VodiciNav currentSlug="kako-uzimati-whey-protein" />
        </main>
      </div>
    </>
  );
}
