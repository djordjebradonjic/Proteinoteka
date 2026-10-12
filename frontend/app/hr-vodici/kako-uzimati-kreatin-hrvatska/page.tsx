import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { CURRENT_MARKET, MARKET_CONFIG, CREATINE_ENABLED } from "@/lib/marketConfig";
import Header from "@/components/Header";
import GuideToc, { TocSection } from "@/components/GuideToc";
import GuideDisclaimer from "@/components/GuideDisclaimer";
import CreatinePriceSnapshot from "@/components/seo/CreatinePriceSnapshot";
import { safeJsonLd } from "@/lib/jsonLd";
import { fitTitle, fitDescription } from "@/lib/seo-meta";

export const revalidate = 21600;

const RS_URL = "https://proteinoteka.rs/vodici/kako-uzimati-kreatin";
const HR_URL = "https://proteinoteka.com.hr/hr-vodici/kako-uzimati-kreatin-hrvatska";
const BASE = `https://${MARKET_CONFIG[CURRENT_MARKET].domain}`;
const SLUG = "/hr-vodici/kako-uzimati-kreatin-hrvatska";
const PUBLISHED = "2026-10-12";

const TITLE = "Kreatin: kako uzimati, doza i koji kupiti";
const DESCRIPTION =
  "Kreatin monohidrat: 3–5 g dnevno, bez obvezne faze punjenja. Doza, tajming, nuspojave, koji oblik odabrati i stvarne cijene u Hrvatskoj.";

export const metadata: Metadata = {
  title: { absolute: fitTitle(TITLE) },
  description: fitDescription(DESCRIPTION),
  // The Serbian edition is a separate article with its own slug, so hreflang points at it explicitly.
  alternates: { canonical: HR_URL, languages: { sr: RS_URL, hr: HR_URL, "x-default": RS_URL } },
  openGraph: {
    title: fitTitle(TITLE),
    description: fitDescription(DESCRIPTION),
    url: HR_URL,
    siteName: "Proteinoteka",
    locale: MARKET_CONFIG[CURRENT_MARKET].ogLocale,
    type: "article",
    images: [{ url: `${BASE}/opengraph-image`, width: 1200, height: 630, alt: "Proteinoteka" }],
  },
  twitter: { card: "summary_large_image", images: [`${BASE}/opengraph-image`] },
};

// Prices only exist where the creatine section is live; without it the product links would 404.
const TOC: TocSection[] = [
  { id: "kratak-odgovor", title: "Kratak odgovor" },
  { id: "sto-je", title: "Što je kreatin i što radi u mišiću" },
  { id: "znanost", title: "Što znanost zaista pokazuje" },
  { id: "realna-ocekivanja", title: "Što možeš realno očekivati", level: 3 },
  { id: "doza", title: "Koliko kreatina dnevno" },
  { id: "faza-punjenja", title: "Faza punjenja: treba li ti", level: 3 },
  { id: "kada", title: "Kada piti kreatin: prije ili poslije treninga" },
  { id: "kako-piti", title: "Kako ga piti da se stvarno otopi" },
  { id: "sigurnost", title: "Nuspojave i mitovi" },
  { id: "bubrezi", title: "Bubrezi i krvne pretrage", level: 3 },
  { id: "voda-grcevi", title: "Voda, grčevi i dehidracija", level: 3 },
  { id: "kosa", title: "Opadanje kose", level: 3 },
  { id: "zeludac", title: "Želudac", level: 3 },
  { id: "oprez", title: "Tko prvo treba pitati liječnika" },
  { id: "vrste", title: "Koji oblik kreatina odabrati" },
  { id: "creapure", title: "Vrijedi li platiti Creapure®", level: 3 },
  { id: "oblici", title: "Prah, kapsule ili gumeni bomboni" },
  ...(CREATINE_ENABLED ? [{ id: "cijene", title: "Koliko košta: stvarne cijene" }] : []),
  { id: "kupnja", title: "Na što gledati pri kupnji" },
  { id: "faq", title: "Često postavljana pitanja" },
];

const faqItems = [
  {
    q: "Koliko kreatina dnevno treba uzimati?",
    a: "3 do 5 g kreatin monohidrata dnevno, svaki dan. Manje osobe i žene obično dobro prolaze s 3 g, a krupniji i mišićaviji s 5 g. Veće doze ne donose dodatnu korist, samo troše prah.",
  },
  {
    q: "Je li faza punjenja obavezna?",
    a: "Nije. Faza punjenja (oko 20 g dnevno tijekom 5 do 7 dana) samo ubrzava proces: mišić se napuni za tjedan dana umjesto za otprilike mjesec. Ista razina kreatina u mišiću postiže se i s 3 do 5 g dnevno, uz malo strpljenja.",
  },
  {
    q: "Je li bolje piti kreatin prije ili poslije treninga?",
    a: "Razlika je mala i nedovoljno potvrđena. Jedna manja studija ide u prilog unosu poslije treninga, ali kreatin djeluje preko zalihe koju gradiš tjednima, pa je važnije da ga uzimaš svaki dan nego u koje doba. Odaberi vrijeme kojeg ćeš se držati.",
  },
  {
    q: "Treba li piti kreatin i na dane bez treninga?",
    a: "Da. Cilj je da zaliha u mišiću ostane puna, a ona se prazni sporo i bez obzira na to jesi li taj dan trenirao. Propušten dan ništa ne kvari, ali pravilo je jednostavno: svaki dan, ista doza.",
  },
  {
    q: "Šteti li kreatin bubrezima?",
    a: "Kod zdravih ljudi nema dokaza o oštećenju bubrega pri uobičajenim dozama, ni u studijama koje su trajale godinama. Kreatin ipak podiže kreatinin u krvi (koji liječnik prati kao pokazatelj rada bubrega), pa prije pretraga obavijesti liječnika da ga piješ. Tko ima bolest bubrega, ne uzima ga bez savjeta liječnika.",
  },
  {
    q: "Uzrokuje li kreatin opadanje kose?",
    a: "Nije dokazano. Mit potječe iz jedne male studije na ragbašima u kojoj je porastao DHT, hormon povezan s nasljednim ćelavljenjem, ali opadanje kose nije mjereno niti je ta studija ponovljena. Tko već ima nasljedno ćelavljenje, ima razlog za oprez, ali ne i za paniku.",
  },
  {
    q: "Koji je kreatin najbolji?",
    a: "Kreatin monohidrat. Najbolje je istražen, a HCl, puferirani (Kre-Alkalyn), etil-ester i drugi skuplji oblici nemaju dokaz da djeluju bolje. Creapure® je monohidrat njemačke proizvodnje s provjerenom čistoćom, što je pristojan razlog za doplatu samo ako je doplata mala.",
  },
  {
    q: "Mogu li žene piti kreatin?",
    a: "Mogu, i djeluje na isti način. Žene u prosjeku imaju manje mišićne mase, pa je 3 g dnevno razumna početna doza. Težina na vagi može skočiti za kilogram, najviše dva, zbog vode u mišiću, a to nije masno tkivo.",
  },
  {
    q: "Treba li praviti pauze, odnosno cikluse?",
    a: "Ne. Nema dokaza da pauze išta poboljšavaju, a studije koje su pratile kontinuirano uzimanje nisu našle štetne učinke. Ako ga prestaneš piti, zaliha u mišiću vraća se na početnu razinu za nekoliko tjedana.",
  },
  {
    q: "Koliko traje pakiranje od 500 g?",
    a: "Pri dozi od 5 g dnevno točno 100 dana, nešto više od tri mjeseca. Zato ima smisla gledati cijenu po 100 g, a ne po pakiranju: veća pakiranja su gotovo uvijek jeftinija po gramu.",
  },
];

const PROSE = "space-y-4 text-[15px] leading-relaxed text-slate-700";
const H3 = "text-[17px] font-bold text-slate-800 mt-6 mb-3";
const STRONG = "text-slate-900";
const CHIP =
  "px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm";

const FORMS = [
  { o: "Monohidrat", t: "Standard: oko 100% bioraspoloživosti, desetci tisuća ispitanika kroz desetljeća.", v: "Izbor" },
  { o: "Mikronizirani monohidrat", t: "Ista molekula, samo sitnije čestice koje se brže otapaju.", v: "Dobar, nije „novi oblik“" },
  { o: "Creapure®", t: "Zaštićen naziv za monohidrat njemačkog proizvođača AlzChem, s kontroliranom čistoćom.", v: "Dobar, ako je doplata mala" },
  { o: "HCl (hidroklorid)", t: "Bolja topljivost, pa „manja doza“. Nema studije koja pokazuje bolji ishod od monohidrata.", v: "Plaćaš obećanje" },
  { o: "Puferirani (Kre-Alkalyn)", t: "Tvrdi se da je stabilniji u želucu. U usporedbi s monohidratom (Jagim, 2012) nije dao veći porast kreatina u mišiću ni bolje rezultate.", v: "Nema prednosti" },
  { o: "Etil-ester", t: "U usporedbi s monohidratom (Spillane, 2009) nije bio bolji, a u toj studiji ni jednako dobar.", v: "Izbjegavaj" },
  { o: "Nitrat i „matrice“", t: "Mješavine kreatina s dodacima. Za nitrat ima malo studija, a matrice su uglavnom monohidrat s marketingom.", v: "Nedokazano" },
];

const REFERENCES = [
  "Kreider RB et al. (2017). International Society of Sports Nutrition position stand: safety and efficacy of creatine supplementation in exercise, sport, and medicine. Journal of the International Society of Sports Nutrition, 14, 18.",
  "Hultman E et al. (1996). Muscle creatine loading in men. Journal of Applied Physiology, 81(1), 232–237.",
  "Lanhers C et al. (2017). Creatine supplementation and upper limb strength performance: a systematic review and meta-analysis. Sports Medicine, 47(1), 163–173.",
  "Chilibeck PD, Kaviani M, Candow DG, Zello GA (2017). Effect of creatine supplementation during resistance training on lean tissue mass and muscle strength in older adults: a meta-analysis. Open Access Journal of Sports Medicine, 8, 213–226.",
  "Burke DG et al. (2003). Effect of creatine and weight training on muscle creatine and performance in vegetarians. Medicine & Science in Sports & Exercise, 35(11), 1946–1955.",
  "Avgerinos KI et al. (2018). Effects of creatine supplementation on cognitive function of healthy individuals: a systematic review of randomized controlled trials. Experimental Gerontology, 108, 166–173.",
  "Antonio J, Ciccone V (2013). The effects of pre versus post workout supplementation of creatine monohydrate on body composition and strength. Journal of the International Society of Sports Nutrition, 10, 36.",
  "Kim HJ, Kim CK, Carpentier A, Poortmans JR (2011). Studies on the safety of creatine supplementation. Amino Acids, 40(5), 1409–1418.",
  "Dalbo VJ et al. (2008). Putting to rest the myth of creatine supplementation leading to muscle cramps and dehydration. British Journal of Sports Medicine, 42(7), 567–573.",
  "van der Merwe J, Brooks NE, Myburgh KH (2009). Three weeks of creatine monohydrate supplementation affects dihydrotestosterone to testosterone ratio in college-aged rugby players. Clinical Journal of Sport Medicine, 19(5), 399–404.",
  "Jagim AR et al. (2012). A buffered form of creatine does not promote greater changes in muscle creatine content, body composition, or training adaptations than creatine monohydrate. Journal of the International Society of Sports Nutrition, 9, 43.",
  "Spillane M et al. (2009). The effects of creatine ethyl ester supplementation combined with heavy resistance training on body composition, muscle performance, and serum and muscle creatine levels. Journal of the International Society of Sports Nutrition, 6, 6.",
];

export default function Page() {
  if (CURRENT_MARKET !== "hr") notFound();

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Kreatin: kako se uzima, koliko i koji se isplati kupiti",
      description: DESCRIPTION,
      datePublished: PUBLISHED,
      dateModified: PUBLISHED,
      inLanguage: "hr",
      mainEntityOfPage: `${BASE}${SLUG}`,
      image: `${BASE}/opengraph-image`,
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
        { "@type": "ListItem", position: 3, name: "Kreatin", item: `${BASE}${SLUG}` },
      ],
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="max-w-3xl mx-auto px-4 py-10">

          <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-8 flex-wrap">
            <Link href="/" className="hover:text-[#FF9900] transition-colors">Početna</Link>
            <span>/</span>
            <Link href="/hr-vodici" className="hover:text-[#FF9900] transition-colors">Vodiči</Link>
            <span>/</span>
            <span className="text-slate-600">Kreatin</span>
          </nav>

          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-4">
              Kreatin: kako se uzima, koliko i koji se isplati kupiti
            </h1>
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <span>12 min čitanja</span>
              <span>·</span>
              <time dateTime={PUBLISHED}>Ažurirano: listopad 2026.</time>
            </div>
          </div>

          <div className={`${PROSE} mb-8`}>
            <p className="text-lg text-slate-700 leading-relaxed">
              Većina dodataka prehrani živi od obećanja. Kreatin je rijedak slučaj proizvoda kojemu obećanja ne trebaju. Francuski kemičar Michel Eugène Chevreul izdvojio ga je iz mesa još 1832. godine, a otad se na njemu radilo više studija nego na gotovo svemu što se prodaje uz teretanu. Rezultat je dosadno dosljedan: djeluje, jeftin je i za zdrave ljude siguran.
            </p>
            <p>
              Pogreške se zato prave drugdje. U fazi punjenja koju nitko ne mora raditi, u „naprednim“ oblicima koji koštaju dvostruko a djeluju isto, u kapsulama u kojima je gram kreatina nekoliko puta skuplji nego u prahu. Ovaj vodič prolazi kroz sve to, redom{CREATINE_ENABLED ? ", a pri kraju donosi i stvarne cijene iz hrvatskih trgovina" : ""}.
            </p>
          </div>

          <div id="kratak-odgovor" className="mb-8 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-lg text-slate-700 leading-relaxed">
              <strong className={STRONG}>Kratak odgovor:</strong> 3 do 5 g kreatin monohidrata dnevno, svaki dan, u koje god doba ti odgovara. Faza punjenja nije obavezna, pauze nisu potrebne, a oblici skuplji od monohidrata nemaju dokaz da djeluju bolje. Kupuj prah, ne kapsule, i uspoređuj cijenu po 100 g, a ne po pakiranju.
            </p>
          </div>

          <GuideToc sections={TOC} />

          <section className="mb-10" id="sto-je">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Što je kreatin i što radi u mišiću</h2>
            <div className={PROSE}>
              <p>
                Kreatin nije stranac u tijelu. Jetra i bubrezi sami ga prave od tri aminokiseline (arginina, glicina i metionina), otprilike gram dnevno, a još toliko ulazi hranom ako jedeš meso i ribu. Tijelo odraslog muškarca od 70 kg nosi oko 120 g kreatina, od čega se oko 95% nalazi u skeletnim mišićima, uglavnom kao fosfokreatin.
              </p>
              <p>
                Zašto je to važno za trening: mišić radi na ATP-u, a ATP-a u stanici ima taman za nekoliko sekundi maksimalnog napora. Fosfokreatin je rezerva koja ga gotovo trenutno obnavlja. Zato kreatin pomaže upravo ondje gdje je napor kratak i težak: zadnja ponavljanja u seriji čučnjeva, sprint, skok, još jedan set s istom težinom. Za dugotrajne, lagane treninge znatno je manje bitan.
              </p>
              <p>
                Dodatak kreatina podiže zalihu u mišiću, obično za 20 do 40 posto, i to je cijeli mehanizam. Nema ničeg tajanstvenog, i upravo zato djeluje pouzdano.
              </p>
            </div>
          </section>

          <section className="mb-10" id="znanost">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Što znanost zaista pokazuje</h2>
            <div className={PROSE}>
              <p>
                Međunarodno društvo za sportsku prehranu (ISSN) u svojem stavu iz 2017. godine, pisanom na temelju stotina studija, navodi kreatin monohidrat kao najučinkovitiji dodatak koji je trenutačno dostupan za povećanje kapaciteta u visokointenzivnom vježbanju i mišićne mase tijekom treninga. Malo koji dodatak može potpisati takvu rečenicu.
              </p>
            </div>

            <h3 id="realna-ocekivanja" className={H3}>Što možeš realno očekivati</h3>
            <div className={PROSE}>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className={STRONG}>Snaga i ponavljanja.</strong> Uz trening s utezima snaga raste primjetno brže nego uz placebo, a metaanalize to potvrđuju i za gornji dio tijela (Lanhers, 2017). Prvo što se obično osjeti je jedno ili dva ponavljanja više s istom težinom.
                </li>
                <li>
                  <strong className={STRONG}>Mišićna masa.</strong> U studijama je razlika u prosjeku nekoliko stotina grama do oko dva kilograma nemasne mase nakon nekoliko tjedana treninga. Dio tog prirasta je voda u mišićnoj stanici; pravo mišićno tkivo dolazi tek s treningom.
                </li>
                <li>
                  <strong className={STRONG}>Ne reagira svatko jednako.</strong> Prema nekim procjenama, otprilike četvrtina do trećina ljudi slabije reagira, najčešće oni čije su zalihe već visoke zbog prehrane bogate mesom. Najviše dobivaju vegetarijanci i vegani, jer kreću s niske razine (Burke, 2003).
                </li>
                <li>
                  <strong className={STRONG}>Stariji.</strong> Uz trening snage kreatin pomaže očuvanju mišića i snage u starijoj dobi (Chilibeck, 2017).
                </li>
                <li>
                  <strong className={STRONG}>Mozak.</strong> Dokazi su slabiji i proturječni. Najjasniju korist imaju vegetarijanci, stariji i neispavani (Avgerinos, 2018). Ne računaj da će ti kreatin podići koncentraciju na poslu.
                </li>
              </ul>
              <div className="bg-[#FFF8EC] border border-[#FF9900]/30 rounded-xl p-4">
                <p className="text-[14px] text-slate-700">
                  <strong className={STRONG}>Što kreatin nije:</strong> nije steroid, ne topi masti i ne gradi mišiće bez treninga. On samo produljuje vrijeme u kojem možeš raditi punom snagom. Ostalo i dalje radiš ti, s utezima, hranom i snom.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-10" id="doza">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Koliko kreatina dnevno</h2>
            <div className={PROSE}>
              <p>
                Standardna doza je <strong className={STRONG}>3 do 5 g kreatin monohidrata dnevno</strong>. Sitnija osoba ili žena s 3 g neće ništa izgubiti, a krupniji i mišićaviji vježbač može ići na punih 5 g. Više od toga ne daje ništa dodatno: kad je zaliha u mišiću puna, višak odlazi iz tijela mokraćom.
              </p>
              <p>
                Dozira se vagom ili mjericom iz pakiranja (obično 5 g). Žlica je loša mjera, jer se volumen praha znatno razlikuje od žlice do žlice.
              </p>
            </div>

            <h3 id="faza-punjenja" className={H3}>Faza punjenja: treba li ti</h3>
            <div className={PROSE}>
              <p>
                Klasičan protokol kaže: 20 g dnevno (4 × 5 g) tijekom pet do sedam dana, pa 3 do 5 g održavanja. Mišić se tako napuni za tjedan dana. No ista se razina postiže i bez toga. Hultman sa suradnicima (1996) pokazao je da 3 g dnevno nakon otprilike 28 dana vodi do približno iste zalihe. Faza punjenja je dakle prečac, ne uvjet.
              </p>
              <p>
                Prečac ima cijenu. Za tjedan dana potrošiš oko 140 g praha umjesto 35 g, češće se javljaju tegobe sa želucem, a vaga skoči za kilogram ili dva, što djeluje zastrašujuće iako je to samo voda u mišiću. Punjenje ima smisla ako za dva tjedna imaš natjecanje. U svim ostalim slučajevima: 5 g svako jutro i zaboravi na to.
              </p>
              <p>
                Ako preskočiš dan, ništa se ne događa. Zaliha se prazni sporo, tijekom tjedana, pa se samo vrati na rutinu. Ne udvostručuj sutrašnju dozu.
              </p>
            </div>
          </section>

          <section className="mb-10" id="kada">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Kada piti kreatin: prije ili poslije treninga</h2>
            <div className={PROSE}>
              <p>
                Odgovor koji nitko ne voli čuti: gotovo svejedno. Kreatin nije kofein, ne djeluje pola sata nakon doze. On gradi zalihu, a ona se puni danima, pa je jedini zaista bitan čimbenik to da ga uzmeš svaki dan.
              </p>
              <p>
                Izravno je uspoređeno samo u maloj studiji s 19 vježbača (Antonio i Ciccone, 2013): skupina koja ga je pila poslije treninga imala je blagu prednost u nemasnoj masi, ali su razlike male, a uzorak premalen da bi se na njemu gradilo pravilo. Neki radovi pokazuju da zaliha u mišiću raste nešto bolje kad se kreatin uzme uz obrok s ugljikohidratima i proteinima.
              </p>
              <p>
                Praktično pravilo je zato jednostavno: zakači ga za naviku koja ti ionako postoji. Uz doručak, u shake poslije treninga, uz večeru. Na dane bez treninga isto, jer se zaliha puni i prazni bez obzira na to jesi li tada bio u teretani. Ako već piješ protein, 5 g kreatina može u isti shake (kako se sve to rasporedi, pišemo u vodiču{" "}
                <Link href="/hr-vodici/kada-piti-protein-hrvatska" className="text-[#FF9900] hover:underline">Kada piti protein</Link>).
              </p>
            </div>
          </section>

          <section className="mb-10" id="kako-piti">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Kako ga piti da se stvarno otopi</h2>
            <div className={PROSE}>
              <p>
                Kreatin monohidrat se u hladnoj vodi otapa slabo. Talog na dnu čaše nije kvar, nego fizika. Stavi ga u 200 do 300 ml mlake vode i protresi, ili ga ubaci u shake, jogurt, zobenu kašu ili sok. Mikronizirani se otapa nešto brže. Okus je neutralan, malo kredast.
              </p>
              <p>
                Ne priprema se unaprijed. U tekućini se s vremenom razgrađuje u kreatinin, pa ga pomiješaj neposredno prije nego što ga popiješ.
              </p>
              <p>
                A kava? Jedna starija studija (Vandenberghe, 1996) sugerirala je da velike doze kofeina poništavaju učinak kreatina. Kasniji radovi to nisu potvrdili, pa jutarnja kava i kreatin mogu bez problema ići zajedno.
              </p>
            </div>
          </section>

          <section className="mb-10" id="sigurnost">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Nuspojave i mitovi</h2>
            <div className={PROSE}>
              <p>
                Reputacija kreatina zaglavila je u devedesetima, kad su novine pisale o grčevima i bubrezima. Evo što je od toga ostalo kad se pogledaju podaci.
              </p>
            </div>

            <h3 id="bubrezi" className={H3}>Bubrezi i krvne pretrage</h3>
            <div className={PROSE}>
              <p>
                Kod zdravih ljudi nema dokaza o oštećenju bubrega pri uobičajenim dozama, ni u studijama koje su trajale godinama (Kim, 2011; Kreider, 2017). Zabuna ima konkretan izvor: kreatin se u tijelu spontano razgrađuje u kreatinin, a kreatinin je upravo ono što liječnik gleda u nalazu krvi kao pokazatelj rada bubrega. Na kreatinu on može biti blago povišen, bez ikakvog oštećenja.
              </p>
              <p>
                Zato, ako radiš pretrage, reci liječniku da piješ kreatin. Pouzdaniji pokazatelj u takvoj situaciji je cistatin C, na koji kreatin ne utječe. Tko ima bolest bubrega, ne uzima kreatin bez savjeta liječnika.
              </p>
            </div>

            <h3 id="voda-grcevi" className={H3}>Voda, grčevi i dehidracija</h3>
            <div className={PROSE}>
              <p>
                Kreatin povlači vodu u mišićnu stanicu, pa se na vagi na početku može pojaviti plus od kilogram do dva. To je voda unutar mišića, ne potkožni otok i ne salo. Priča da izaziva grčeve i dehidraciju nije izdržala provjeru: pregled Dalba i suradnika (2008) nije našao više grčeva ni dehidracije nego kod placeba, čak ni kod sportaša koji treniraju po vrućini. Pij vodu kao i inače.
              </p>
            </div>

            <h3 id="kosa" className={H3}>Opadanje kose</h3>
            <div className={PROSE}>
              <p>
                Mit potječe iz jedne studije na 20 ragbaša (van der Merwe, 2009) kod kojih je nakon tjedna punjenja DHT, hormon vezan uz nasljedno ćelavljenje, porastao za oko 56%. Opadanje kose u toj se studiji nije mjerilo i nitko je nije ponovio. To nije dokaz štete, ali tko u obitelji ima izraženo nasljedno ćelavljenje ima razlog biti oprezniji.
              </p>
            </div>

            <h3 id="zeludac" className={H3}>Želudac</h3>
            <div className={PROSE}>
              <p>
                Jedina nuspojava koja se zaista često javlja. Nadutost i mučnina uglavnom dolaze od velikih pojedinačnih doza (10 g i više) ili od kreatina uzetog na prazan želudac. Rješenje je dosadno: 5 g uz hranu, a ako ipak puniš, podijeli dozu na četiri unosa.
              </p>
            </div>
          </section>

          <section className="mb-10" id="oprez">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Tko prvo treba pitati liječnika</h2>
            <div className={PROSE}>
              <ul className="list-disc pl-5 space-y-2">
                <li>Tko ima bolest bubrega ili ju je imao u obitelji, ili uzima lijekove koji opterećuju bubrege.</li>
                <li>Trudnice i dojilje: nema dovoljno podataka da bi se preporučio bez liječnika.</li>
                <li>Mlađi od 18 godina: u toj su dobi važniji trening, san i hrana, a kreatin prvo treba dogovoriti s liječnikom.</li>
                <li>Natjecatelji na testiranjima: sam kreatin nije zabranjen, ali sadržaj pakiranja mora biti provjeren. Traži proizvod s neovisnom provjerom serije (Informed Sport, NSF Certified for Sport).</li>
              </ul>
            </div>
          </section>

          <section className="mb-10" id="vrste">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Koji oblik kreatina odabrati</h2>
            <div className={PROSE}>
              <p>
                Na polici ćeš naći desetak naziva, a svaki obećava da je bolji od prethodnog. Zgodno pravilo je potražiti studiju koja to potvrđuje. Za većinu oblika takva studija ne postoji.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm mt-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Oblik</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Što kažu studije</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Ocjena</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {FORMS.map(({ o, t, v }) => (
                      <tr key={o}>
                        <td className="px-3 py-2.5 text-[13px] font-medium text-slate-800 align-top">{o}</td>
                        <td className="px-3 py-2.5 text-[13px] text-slate-600">{t}</td>
                        <td className="px-3 py-2.5 text-[13px] font-semibold text-slate-800 align-top">{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <h3 id="creapure" className={H3}>Vrijedi li platiti Creapure®</h3>
            <div className={PROSE}>
              <p>
                Creapure® je dobar proizvod i nema razloga da ga se bojiš. No isti kreatin u običnoj čistoći od ozbiljnog brenda djeluje jednako. Doplatu opravdava jedino to što je sirovina iz jednog, poznatog pogona s kontroliranom čistoćom, dok kvaliteta jeftinog praha nepoznatog podrijetla doista može varirati. Zato: ako je razlika u cijeni mala, uzmi ga. Ako je velika, uzmi običan monohidrat poznatog brenda koji pokazuje rezultate laboratorijske analize.
              </p>
            </div>
          </section>

          <section className="mb-10" id="oblici">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Prah, kapsule ili gumeni bomboni</h2>
            <div className={PROSE}>
              <p>
                Prah je jeftiniji, ali to nije najvažniji razlog. Važnija je transparentnost. Na pakiranju praha piše da je porcija 5 g i znaš točno što kupuješ. Kapsula obično sadrži 500 do 1000 mg, pa za dozu od 5 g treba progutati pet do deset komada. Staklenka od 120 kapsula zato nije 120 doza, nego dvanaest do dvadeset četiri.
              </p>
              <p>
                Kod gumenih bombona doza je obično skromna, a uz nju dolaze šećer ili zaslađivači, pa na etiketi provjeri koliko kreatina doista ima po komadu. Na Proteinoteci smo pokušali izračunati cijenu po gramu kreatina i za kapsule i tablete, ali većina pakiranja ne navodi ni broj doza ni koliko je kreatina u dozi, pa takav račun ne bi bio ništa više od nagađanja. Zato ih ne rangiramo, a kao pravilo vrijedi da su kapsule rješenje za putovanje, ne za svakodnevicu.
              </p>
            </div>
          </section>

          {CREATINE_ENABLED && <CreatinePriceSnapshot linkToListing />}

          <section className="mb-10" id="kupnja">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Na što gledati pri kupnji</h2>
            <div className={PROSE}>
              <ol className="list-decimal pl-5 space-y-3">
                <li>
                  <strong className={STRONG}>Sastav.</strong> U idealnom slučaju jedna stavka: kreatin monohidrat (ili Creapure®). Sve ostalo je u redu samo ako ti nešto od toga treba.
                </li>
                <li>
                  <strong className={STRONG}>Cijena po 100 g.</strong> Cijenu pakiranja podijeli s težinom u gramima i pomnoži sa 100. Cijenu doze dobiješ kad cijenu po gramu pomnožiš s 5. Mala staklenka na akciji često ispadne skuplja po gramu od običnog kilograma.
                </li>
                <li>
                  <strong className={STRONG}>Veličina pakiranja.</strong> Ako već znaš da ćeš ga uzimati, uzmi 500 g ili kilogram. Kreatin u prahu ne kvari se brzo, a 500 g je sto doza, više od tri mjeseca.
                </li>
                <li>
                  <strong className={STRONG}>Bez okusa.</strong> Aromatizirani kreatin obično je skuplji i zaslađen, a neutralan se u shakeu ili soku ionako ne osjeti.
                </li>
                <li>
                  <strong className={STRONG}>Zatvoreno, s rokom.</strong> Provjeri datum i je li pakiranje neoštećeno. Ako se natječeš, traži oznaku neovisne provjere serije.
                </li>
                <li>
                  <strong className={STRONG}>Bez „matrica“.</strong> Ako na pakiranju piše „proprietary blend“ ili „creatine matrix“, ne znaš koliko kreatina plaćaš.
                </li>
              </ol>
            </div>
          </section>

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
              {REFERENCES.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ol>
          </section>

          <GuideDisclaimer />

          <section className="mt-10 mb-10">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Korisni vodiči</h2>
            <div className="flex flex-wrap gap-3">
              {CREATINE_ENABLED && <Link href="/kreatin" className={CHIP}>Kreatin: usporedi cijene</Link>}
              <Link href="/hr-vodici/kada-piti-protein-hrvatska" className={CHIP}>Kada piti protein?</Link>
              <Link href="/hr-vodici/kako-uzimati-whey-protein-hrvatska" className={CHIP}>Kako uzimati whey protein</Link>
              <Link href="/hr-vodici/koliko-proteina-dnevno-hrvatska" className={CHIP}>Koliko proteina dnevno?</Link>
              <Link href="/protein-kalkulator-hrvatska" className={CHIP}>Protein kalkulator</Link>
            </div>
          </section>

          {CREATINE_ENABLED && (
            <div className="bg-[#1B2B4B] rounded-2xl p-6 text-white text-center">
              <p className="text-base leading-relaxed mb-4">
                Usporedi kreatin iz hrvatskih trgovina: cijena po 100 g i po dozi za svaki prah.
              </p>
              <Link
                href="/kreatin"
                className="inline-block px-6 py-3 bg-[#FF9900] hover:bg-[#e68a00] text-[#131921] font-bold rounded-xl text-sm transition-colors"
              >
                Usporedi kreatin →
              </Link>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
