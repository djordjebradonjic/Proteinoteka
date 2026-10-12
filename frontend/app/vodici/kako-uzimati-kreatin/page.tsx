import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { CURRENT_MARKET, MARKET_CONFIG, CREATINE_ENABLED } from "@/lib/marketConfig";
import Header from "@/components/Header";
import VodiciNav from "@/components/VodiciNav";
import GuideToc, { TocSection } from "@/components/GuideToc";
import GuideDisclaimer from "@/components/GuideDisclaimer";
import CreatinePriceSnapshot from "@/components/seo/CreatinePriceSnapshot";
import { safeJsonLd } from "@/lib/jsonLd";
import { fitTitle, fitDescription } from "@/lib/seo-meta";

export const revalidate = 21600;

const RS_URL = "https://proteinoteka.rs/vodici/kako-uzimati-kreatin";
const HR_URL = "https://proteinoteka.com.hr/hr-vodici/kako-uzimati-kreatin-hrvatska";
const BASE = `https://${MARKET_CONFIG[CURRENT_MARKET].domain}`;
const SLUG = "/vodici/kako-uzimati-kreatin";
const PUBLISHED = "2026-10-12";

const TITLE = "Kreatin: kako uzimati, doza i koji kupiti";
const DESCRIPTION =
  "Kreatin monohidrat: 3–5 g dnevno, bez obavezne faze punjenja. Doza, tajming, nuspojave, koji oblik izabrati i stvarne cene u Srbiji.";

export const metadata: Metadata = {
  title: { absolute: fitTitle(TITLE) },
  description: fitDescription(DESCRIPTION),
  // The Croatian edition is a separate article with its own slug, so hreflang points at it explicitly.
  alternates: { canonical: RS_URL, languages: { sr: RS_URL, hr: HR_URL, "x-default": RS_URL } },
  openGraph: {
    title: fitTitle(TITLE),
    description: fitDescription(DESCRIPTION),
    url: RS_URL,
    siteName: "Proteinoteka",
    locale: MARKET_CONFIG[CURRENT_MARKET].ogLocale,
    type: "article",
    images: [{ url: `${BASE}/opengraph-image`, width: 1200, height: 630, alt: "Proteinoteka" }],
  },
  twitter: { card: "summary_large_image", images: [`${BASE}/opengraph-image`] },
};

const TOC: TocSection[] = [
  { id: "kratak-odgovor", title: "Kratak odgovor" },
  { id: "sta-je", title: "Šta je kreatin i šta radi u mišiću" },
  { id: "nauka", title: "Šta nauka zaista pokazuje" },
  { id: "realna-ocekivanja", title: "Šta možeš realno da očekuješ", level: 3 },
  { id: "doza", title: "Koliko kreatina dnevno" },
  { id: "faza-punjenja", title: "Faza punjenja: treba li ti", level: 3 },
  { id: "kada", title: "Kada piti kreatin: pre ili posle treninga" },
  { id: "kako-piti", title: "Kako ga piti da se zaista rastvori" },
  { id: "bezbednost", title: "Nuspojave i mitovi" },
  { id: "bubrezi", title: "Bubrezi i analize krvi", level: 3 },
  { id: "voda-grcevi", title: "Voda, grčevi i dehidratacija", level: 3 },
  { id: "kosa", title: "Opadanje kose", level: 3 },
  { id: "stomak", title: "Stomak", level: 3 },
  { id: "oprez", title: "Ko treba prvo da pita lekara" },
  { id: "vrste", title: "Koji oblik kreatina izabrati" },
  { id: "creapure", title: "Da li vredi platiti Creapure®", level: 3 },
  { id: "oblici", title: "Prah, kapsule ili gumene bombone" },
  { id: "cene", title: "Koliko košta: stvarne cene" },
  { id: "kupovina", title: "Šta gledati pri kupovini" },
  { id: "faq", title: "Česta pitanja" },
];

const faqItems = [
  {
    q: "Koliko kreatina dnevno treba uzimati?",
    a: "3 do 5 g kreatin monohidrata dnevno, svaki dan. Manje osobe i žene obično dobro prolaze sa 3 g, a veće i mišićavije sa 5 g. Veće doze od toga ne daju dodatnu korist, samo troše prah.",
  },
  {
    q: "Da li je faza punjenja obavezna?",
    a: "Nije. Faza punjenja (oko 20 g dnevno tokom 5 do 7 dana) samo ubrzava proces: mišić se napuni za nedelju dana umesto za oko mesec. Isti nivo kreatina u mišiću postiže se i sa 3 do 5 g dnevno, uz malo strpljenja.",
  },
  {
    q: "Da li je bolje piti kreatin pre ili posle treninga?",
    a: "Razlika je mala i nedovoljno potvrđena. Jedna manja studija ide u prilog unosu posle treninga, ali kreatin deluje preko zalihe koju gradiš nedeljama, pa je važnije da ga uzimaš svaki dan nego u koje doba. Izaberi vreme kog ćeš se držati.",
  },
  {
    q: "Treba li piti kreatin i na dane bez treninga?",
    a: "Da. Cilj je da zaliha u mišiću ostane puna, a ona se prazni sporo i bez obzira na to da li si tog dana trenirao. Preskočen dan ništa ne kvari, ali pravilo je jednostavno: svaki dan, ista doza.",
  },
  {
    q: "Da li kreatin šteti bubrezima?",
    a: "Kod zdravih ljudi nema dokaza o oštećenju bubrega pri uobičajenim dozama, ni u studijama koje su trajale godinama. Kreatin ipak podiže kreatinin u krvi (koji lekar prati kao pokazatelj rada bubrega), pa pre analiza obavesti lekara da ga piješ. Ko ima bolest bubrega, ne uzima ga bez saveta lekara.",
  },
  {
    q: "Da li kreatin izaziva opadanje kose?",
    a: "Nije dokazano. Mit potiče iz jedne male studije na ragbistima u kojoj je porastao DHT, hormon povezan sa genetski uslovljenim ćelavljenjem, ali opadanje kose nije merilo niti je ta studija ponovljena. Ko već ima nasledno ćelavljenje, ima razlog za oprez, ali ne i za paniku.",
  },
  {
    q: "Koji je kreatin najbolji?",
    a: "Kreatin monohidrat. Najbolje je istražen, a HCl, puferovani (Kre-Alkalyn), etil-estar i drugi skuplji oblici nemaju dokaz da rade bolje. Creapure® je monohidrat nemačke proizvodnje sa proverenom čistoćom, što je pristojan razlog za doplatu samo ako je doplata mala.",
  },
  {
    q: "Mogu li žene da piju kreatin?",
    a: "Mogu, i deluje na isti način. Žene imaju u proseku manje mišićne mase, pa je 3 g dnevno razumna polazna doza. Težina na vagi može da skoči za kilogram, najviše dva, zbog vode u mišiću, što nije masno tkivo.",
  },
  {
    q: "Treba li praviti pauze, odnosno cikluse?",
    a: "Ne. Nema dokaza da pauze nešto popravljaju, a studije koje su pratile kontinuirano uzimanje nisu našle štetne efekte. Ako ga prestaneš piti, zaliha u mišiću se vraća na početni nivo za nekoliko nedelja.",
  },
  {
    q: "Koliko traje pakovanje od 500 g?",
    a: "Pri dozi od 5 g dnevno tačno 100 dana, nešto više od tri meseca. Zato ima smisla gledati cenu po 100 g, a ne po pakovanju: veća pakovanja su skoro uvek jeftinija po gramu.",
  },
];

const PROSE = "space-y-4 text-[15px] leading-relaxed text-slate-700";
const H3 = "text-[17px] font-bold text-slate-800 mt-6 mb-3";
const STRONG = "text-slate-900";
const CHIP =
  "px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm";

const FORMS = [
  { o: "Monohidrat", t: "Standard: oko 100% bioraspoloživosti, desetine hiljada ispitanika kroz decenije.", v: "Izbor" },
  { o: "Mikronizovani monohidrat", t: "Isti molekul, samo sitnije čestice koje se brže rastvaraju.", v: "Dobar, nije „novi oblik“" },
  { o: "Creapure®", t: "Zaštićen naziv za monohidrat nemačkog proizvođača AlzChem, sa kontrolisanom čistoćom.", v: "Dobar, ako je doplata mala" },
  { o: "HCl (hidrohlorid)", t: "Bolja rastvorljivost, pa „manja doza“. Nema studije koja pokazuje bolji ishod od monohidrata.", v: "Plaćaš obećanje" },
  { o: "Puferovani (Kre-Alkalyn)", t: "Tvrdi se da je stabilniji u stomaku. U poređenju sa monohidratom (Jagim, 2012) nije dao veći porast kreatina u mišiću ni bolje rezultate.", v: "Nema prednosti" },
  { o: "Etil-estar", t: "U poređenju sa monohidratom (Spillane, 2009) nije bio bolji, a u toj studiji ni jednako dobar.", v: "Izbegavaj" },
  { o: "Nitrat i „matriksi“", t: "Mešavine kreatina sa dodacima. Za nitrat ima malo studija, a matriksi su uglavnom monohidrat sa marketingom.", v: "Nedokazano" },
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
  if (CURRENT_MARKET !== "rs") notFound();

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Kreatin: kako se uzima, koliko i koji vredi kupiti",
      description: DESCRIPTION,
      datePublished: PUBLISHED,
      dateModified: PUBLISHED,
      inLanguage: "sr",
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
        { "@type": "ListItem", position: 2, name: "Vodiči", item: `${BASE}/vodici` },
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
            <Link href="/vodici" className="hover:text-[#FF9900] transition-colors">Vodiči</Link>
            <span>/</span>
            <span className="text-slate-600">Kreatin</span>
          </nav>

          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-4">
              Kreatin: kako se uzima, koliko i koji vredi kupiti
            </h1>
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <span>12 min čitanja</span>
              <span>·</span>
              <time dateTime={PUBLISHED}>Ažurirano: oktobar 2026.</time>
            </div>
          </div>

          <div className={`${PROSE} mb-8`}>
            <p className="text-lg text-slate-700 leading-relaxed">
              Većina suplemenata živi od obećanja. Kreatin je redak slučaj proizvoda kome obećanja ne trebaju. Francuski hemičar Michel Eugène Chevreul izdvojio ga je iz mesa još 1832. godine, a od tada se na njemu radilo više studija nego na gotovo svemu što se prodaje uz teretanu. Rezultat je dosadno dosledan: radi, jeftin je i za zdrave ljude bezbedan.
            </p>
            <p>
              Greške se zato prave drugde. U fazi punjenja koju niko ne mora da radi, u „naprednim“ oblicima koji koštaju duplo a rade isto, u kapsulama u kojima je gram kreatina nekoliko puta skuplji nego u prahu. Ovaj vodič prolazi kroz sve to, redom, i na kraju daje stvarne cene iz srpskih prodavnica.
            </p>
          </div>

          <div id="kratak-odgovor" className="mb-8 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-lg text-slate-700 leading-relaxed">
              <strong className={STRONG}>Kratak odgovor:</strong> 3 do 5 g kreatin monohidrata dnevno, svaki dan, u koje god doba ti odgovara. Faza punjenja nije obavezna, pauze nisu potrebne, a oblici skuplji od monohidrata nemaju dokaz da rade bolje. Kupuj prah, ne kapsule, i poredi cenu po 100 g, a ne po pakovanju.
            </p>
          </div>

          <GuideToc sections={TOC} />

          <section className="mb-10" id="sta-je">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Šta je kreatin i šta radi u mišiću</h2>
            <div className={PROSE}>
              <p>
                Kreatin nije stranac u telu. Jetra i bubrezi ga sami prave od tri aminokiseline (arginina, glicina i metionina), otprilike gram dnevno, a još toliko ulazi hranom ako jedeš meso i ribu. Telo odraslog muškarca od 70 kg nosi oko 120 g kreatina, od čega se oko 95% nalazi u skeletnim mišićima, uglavnom kao fosfokreatin.
              </p>
              <p>
                Zašto je to važno za trening: mišić radi na ATP-u, a ATP-a u ćeliji ima taman za nekoliko sekundi maksimalnog napora. Fosfokreatin je rezerva koja ga skoro trenutno obnavlja. Zato kreatin pomaže baš tamo gde je napor kratak i težak: poslednja ponavljanja u seriji čučnjeva, sprint, skok, još jedan set sa istom težinom. Za dugotrajne, lagane treninge je znatno manje bitan.
              </p>
              <p>
                Dodatak kreatina podiže zalihu u mišiću, obično za 20 do 40 posto, i to je ceo mehanizam. Nema ničeg tajanstvenog, i upravo zato radi pouzdano.
              </p>
            </div>
          </section>

          <section className="mb-10" id="nauka">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Šta nauka zaista pokazuje</h2>
            <div className={PROSE}>
              <p>
                Međunarodno društvo za sportsku ishranu (ISSN) u svom stavu iz 2017. godine, pisanom na osnovu stotina studija, navodi kreatin monohidrat kao najefikasniji suplement koji je trenutno dostupan za povećanje kapaciteta u visokointenzivnom vežbanju i mišićne mase tokom treninga. Malo koji suplement može da potpiše takvu rečenicu.
              </p>
            </div>

            <h3 id="realna-ocekivanja" className={H3}>Šta možeš realno da očekuješ</h3>
            <div className={PROSE}>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className={STRONG}>Snaga i ponavljanja.</strong> Uz trening sa tegovima snaga raste primetno brže nego uz placebo, a metaanalize to potvrđuju i za gornji deo tela (Lanhers, 2017). Prvo što se obično oseti je jedno ili dva ponavljanja više sa istom težinom.
                </li>
                <li>
                  <strong className={STRONG}>Mišićna masa.</strong> U studijama je razlika u proseku nekoliko stotina grama do oko dva kilograma nemasne mase posle nekoliko nedelja treninga. Deo tog priraštaja je voda u mišićnoj ćeliji; pravo mišićno tkivo dolazi tek sa treningom.
                </li>
                <li>
                  <strong className={STRONG}>Ne reaguje svako isto.</strong> Po nekim procenama, otprilike četvrtina do trećina ljudi slabije reaguje, najčešće oni čije su zalihe već visoke zbog ishrane bogate mesom. Najviše dobijaju vegetarijanci i vegani, jer kreću sa niskog nivoa (Burke, 2003).
                </li>
                <li>
                  <strong className={STRONG}>Stariji.</strong> Uz trening snage kreatin pomaže očuvanju mišića i snage u starijem dobu (Chilibeck, 2017).
                </li>
                <li>
                  <strong className={STRONG}>Mozak.</strong> Dokazi su slabiji i protivrečni. Najjasniju korist imaju vegetarijanci, stariji i neispavani (Avgerinos, 2018). Ne računaj da će ti kreatin podići koncentraciju na poslu.
                </li>
              </ul>
              <div className="bg-[#FFF8EC] border border-[#FF9900]/30 rounded-xl p-4">
                <p className="text-[14px] text-slate-700">
                  <strong className={STRONG}>Šta kreatin nije:</strong> nije steroid, ne topi masti i ne pravi mišiće bez treninga. On samo produžava vreme u kome možeš da radiš na punoj snazi. Ostalo i dalje radiš ti, sa tegovima, hranom i snom.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-10" id="doza">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Koliko kreatina dnevno</h2>
            <div className={PROSE}>
              <p>
                Standardna doza je <strong className={STRONG}>3 do 5 g kreatin monohidrata dnevno</strong>. Sitnija osoba ili žena sa 3 g neće ništa izgubiti, a krupniji i mišićaviji vežbač može da ide na punih 5 g. Više od toga ne daje ništa dodatno: kada je zaliha u mišiću puna, višak odlazi iz tela urinom.
              </p>
              <p>
                Doziraj vagom ili mericom iz pakovanja (obično 5 g). Kašičica je loša mera, jer se zapremina praha znatno razlikuje od kašičice do kašičice.
              </p>
            </div>

            <h3 id="faza-punjenja" className={H3}>Faza punjenja: treba li ti</h3>
            <div className={PROSE}>
              <p>
                Klasičan protokol kaže: 20 g dnevno (4 × 5 g) tokom pet do sedam dana, pa 3 do 5 g održavanja. Mišić se tako napuni za nedelju dana. Ali isti nivo se postiže i bez toga. Hultman sa saradnicima (1996) pokazao je da 3 g dnevno posle otprilike 28 dana vodi do približno iste zalihe. Faza punjenja je dakle prečica, ne uslov.
              </p>
              <p>
                Prečica ima cenu. Za nedelju dana potrošiš oko 140 g praha umesto 35 g, češće se javljaju stomačne tegobe, a vaga skoči za kilogram ili dva, što deluje zastrašujuće iako je to samo voda u mišiću. Punjenje ima smisla ako za dve nedelje imaš takmičenje. U svim ostalim slučajevima: 5 g svako jutro i zaboravi na to.
              </p>
              <p>
                Ako preskočiš dan, ništa se ne dešava. Zaliha se prazni sporo, tokom nedelja, pa se samo vrati na rutinu. Ne udvostručuj sutrašnju dozu.
              </p>
            </div>
          </section>

          <section className="mb-10" id="kada">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Kada piti kreatin: pre ili posle treninga</h2>
            <div className={PROSE}>
              <p>
                Odgovor koji niko ne voli da čuje: skoro svejedno. Kreatin nije kofein, ne deluje pola sata posle doze. On gradi zalihu, a ona se puni danima, pa je jedini zaista bitan faktor to da ga uzmeš svaki dan.
              </p>
              <p>
                Direktno je poređeno samo u maloj studiji sa 19 vežbača (Antonio i Ciccone, 2013): grupa koja ga je pila posle treninga imala je blagu prednost u nemasnoj masi, ali su razlike male, a uzorak mali da bi se na njima gradilo pravilo. Neki radovi pokazuju da zaliha u mišiću raste nešto bolje kad se kreatin uzme uz obrok sa ugljenim hidratima i proteinima.
              </p>
              <p>
                Praktično pravilo je zato jednostavno: zakači ga za naviku koja ti ionako postoji. Uz doručak, u šejk posle treninga, uz večeru. Na dane bez treninga isto, jer se zaliha puni i prazni bez obzira na to da li si tada bio u teretani. Ako već piješ protein, 5 g kreatina može u isti šejk (o tome kako se sve to rasporedi pišemo u vodiču <Link href="/vodici/kada-piti-protein" className="text-[#FF9900] hover:underline">Kada piti protein</Link>).
              </p>
            </div>
          </section>

          <section className="mb-10" id="kako-piti">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Kako ga piti da se zaista rastvori</h2>
            <div className={PROSE}>
              <p>
                Kreatin monohidrat se u hladnoj vodi rastvara slabo. Talog na dnu čaše nije kvar, nego fizika. Sipaj ga u 200 do 300 ml mlake vode i promućkaj, ili ga ubaci u šejk, jogurt, ovsenu kašu ili sok. Mikronizovani se rastvara nešto brže. Ukus je neutralan, malo kredast.
              </p>
              <p>
                Ne pripremaj ga unapred. U tečnosti se vremenom razgrađuje u kreatinin, pa ga pomešaj neposredno pre nego što ga popiješ.
              </p>
              <p>
                A kafa? Jedna starija studija (Vandenberghe, 1996) sugerisala je da velike doze kofeina poništavaju efekat kreatina. Kasniji radovi to nisu potvrdili, pa jutarnja kafa i kreatin mogu da se nađu na istom stolu.
              </p>
            </div>
          </section>

          <section className="mb-10" id="bezbednost">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Nuspojave i mitovi</h2>
            <div className={PROSE}>
              <p>
                Reputacija kreatina zaglavila je u devedesetim, kada su novine pisale o grčevima i bubrezima. Evo šta je od toga ostalo kada se pogledaju podaci.
              </p>
            </div>

            <h3 id="bubrezi" className={H3}>Bubrezi i analize krvi</h3>
            <div className={PROSE}>
              <p>
                Kod zdravih ljudi nema dokaza o oštećenju bubrega pri uobičajenim dozama, ni u studijama koje su trajale godinama (Kim, 2011; Kreider, 2017). Zabuna ima konkretan izvor: kreatin se u telu spontano razgrađuje u kreatinin, a kreatinin je upravo ono što lekar gleda u analizi krvi kao pokazatelj rada bubrega. Na kreatinu on može biti blago povišen, bez ikakvog oštećenja.
              </p>
              <p>
                Zato, ako radiš analize, reci lekaru da piješ kreatin. Pouzdaniji pokazatelj u takvoj situaciji je cistatin C, na koji kreatin ne utiče. Ko ima bolest bubrega, ne uzima kreatin bez saveta lekara.
              </p>
            </div>

            <h3 id="voda-grcevi" className={H3}>Voda, grčevi i dehidratacija</h3>
            <div className={PROSE}>
              <p>
                Kreatin povlači vodu u mišićnu ćeliju, pa se na vagi na početku može pojaviti plus od kilogram do dva. To je voda unutar mišića, ne podkožni otok i ne salo. Priča da izaziva grčeve i dehidraciju nije izdržala proveru: pregled Dalba i saradnika (2008) nije našao više grčeva ni dehidracije nego kod placeba, čak ni kod sportista koji treniraju po vrućini. Pij vodu kao i inače.
              </p>
            </div>

            <h3 id="kosa" className={H3}>Opadanje kose</h3>
            <div className={PROSE}>
              <p>
                Mit potiče iz jedne studije na 20 ragbista (van der Merwe, 2009) kod kojih je posle nedelje punjenja DHT, hormon vezan za genetsko ćelavljenje, porastao za oko 56%. Opadanje kose se u toj studiji nije merilo i niko ga nije ponovio. To nije dokaz štete, ali ko u porodici ima izraženo nasledno ćelavljenje ima razlog da bude oprezniji.
              </p>
            </div>

            <h3 id="stomak" className={H3}>Stomak</h3>
            <div className={PROSE}>
              <p>
                Jedina nuspojava koja se zaista često javlja. Nadutost i mučnina uglavnom dolaze od velikih pojedinačnih doza (10 g i više) ili od kreatina uzetog na prazan stomak. Rešenje je dosadno: 5 g uz hranu, a ako ipak puniš, podeli dozu na četiri unosa.
              </p>
            </div>
          </section>

          <section className="mb-10" id="oprez">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Ko treba prvo da pita lekara</h2>
            <div className={PROSE}>
              <ul className="list-disc pl-5 space-y-2">
                <li>Ko ima bolest bubrega ili ga je imao u porodici, ili uzima lekove koji opterećuju bubrege.</li>
                <li>Trudnice i dojilje: nema dovoljno podataka da bi se preporučio bez lekara.</li>
                <li>Mlađi od 18 godina: u tom uzrastu važniji su trening, san i hrana, a kreatin prvo treba dogovoriti sa lekarom.</li>
                <li>Takmičari na testiranjima: sam kreatin nije zabranjen, ali sadržaj pakovanja mora da bude proveren. Traži proizvod sa nezavisnom proverom serije (Informed Sport, NSF Certified for Sport).</li>
              </ul>
            </div>
          </section>

          <section className="mb-10" id="vrste">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Koji oblik kreatina izabrati</h2>
            <div className={PROSE}>
              <p>
                Na rafu ćeš naći desetak naziva, a svaki obećava da je bolji od prethodnog. Zgodno pravilo je da potražiš studiju koja to potvrđuje. Za većinu oblika takva studija ne postoji.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm mt-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Oblik</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Šta kažu studije</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Ocena</th>
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

            <h3 id="creapure" className={H3}>Da li vredi platiti Creapure®</h3>
            <div className={PROSE}>
              <p>
                Creapure® je dobar proizvod i nema razloga da ga se plašiš. Ali isti kreatin u običnoj čistoći od ozbiljnog brenda radi isto. Doplatu opravdava jedino to što je sirovina iz jednog, poznatog pogona sa kontrolisanom čistoćom, dok kvalitet jeftinog praha nepoznatog porekla zaista može da varira. Zato: ako je razlika u ceni mala, uzmi ga. Ako je velika, uzmi običan monohidrat poznatog brenda koji pokazuje rezultate laboratorijske analize.
              </p>
            </div>
          </section>

          <section className="mb-10" id="oblici">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Prah, kapsule ili gumene bombone</h2>
            <div className={PROSE}>
              <p>
                Prah je jeftiniji, ali to nije najvažniji razlog. Važnija je transparentnost. Na pakovanju praha piše da je porcija 5 g i znaš tačno šta kupuješ. Kapsula obično sadrži 500 do 1000 mg, pa za dozu od 5 g treba da progutaš pet do deset komada. Teglica od 120 kapsula zato nije 120 doza, već dvanaest do dvadeset četiri.
              </p>
              <p>
                Kod gumenih bombona doza je obično skromna, a uz nju dolaze šećer ili zaslađivači, pa na nalepnici proveri koliko kreatina zaista ima po komadu. Na Proteinoteci smo pokušali da izračunamo cenu po gramu kreatina i za kapsule i tablete, ali većina pakovanja ne navodi ni broj doza ni koliko kreatina je u dozi, pa takav račun ne bi bio ništa više od nagađanja. Zato ih ne rangiramo, a kao pravilo važi da su kapsule rešenje za putovanje, ne za svakodnevicu.
              </p>
            </div>
          </section>

          <CreatinePriceSnapshot linkToListing={CREATINE_ENABLED} />

          <section className="mb-10" id="kupovina">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Šta gledati pri kupovini</h2>
            <div className={PROSE}>
              <ol className="list-decimal pl-5 space-y-3">
                <li>
                  <strong className={STRONG}>Sastav.</strong> U idealnom slučaju jedna stavka: kreatin monohidrat (ili Creapure®). Sve ostalo je u redu samo ako ti nešto od toga treba.
                </li>
                <li>
                  <strong className={STRONG}>Cena po 100 g.</strong> Cenu pakovanja podeli sa težinom u gramima i pomnoži sa 100. Cenu doze dobiješ kada cenu po gramu pomnožiš sa 5. Mala tegla na akciji često ispadne skuplja po gramu od običnog kilograma.
                </li>
                <li>
                  <strong className={STRONG}>Veličina pakovanja.</strong> Ako već znaš da ćeš ga uzimati, uzmi 500 g ili kilogram. Kreatin u prahu se ne kvari brzo, a 500 g je sto doza, više od tri meseca.
                </li>
                <li>
                  <strong className={STRONG}>Bez ukusa.</strong> Aromatizovan kreatin je obično skuplji i zaslađen, a neutralan se u šejku ili soku ionako ne oseti.
                </li>
                <li>
                  <strong className={STRONG}>Zatvoren, sa rokom.</strong> Proveri datum i da je pakovanje nepoštećeno. Ako se takmičiš, traži oznaku nezavisne provere serije.
                </li>
                <li>
                  <strong className={STRONG}>Bez „matriksa“.</strong> Ako na pakovanju piše „proprietary blend“ ili „creatine matrix“, ne znaš koliko kreatina plaćaš.
                </li>
              </ol>
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
              {REFERENCES.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ol>
          </section>

          <GuideDisclaimer />

          <section className="mt-10 mb-10">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Korisni vodiči</h2>
            <div className="flex flex-wrap gap-3">
              {CREATINE_ENABLED && <Link href="/kreatin" className={CHIP}>Kreatin: uporedi cene</Link>}
              <Link href="/vodici/kada-piti-protein" className={CHIP}>Kada piti protein?</Link>
              <Link href="/vodici/kako-uzimati-whey-protein" className={CHIP}>Kako uzimati whey protein</Link>
              <Link href="/vodici/koliko-proteina-dnevno" className={CHIP}>Koliko proteina dnevno?</Link>
              <Link href="/protein-kalkulator" className={CHIP}>Protein kalkulator</Link>
            </div>
          </section>

          {CREATINE_ENABLED && (
            <div className="bg-[#1B2B4B] rounded-2xl p-6 text-white text-center">
              <p className="text-base leading-relaxed mb-4">
                Uporedi kreatin iz svih srpskih prodavnica: cena po 100 g i po dozi za svaki prah.
              </p>
              <Link
                href="/kreatin"
                className="inline-block px-6 py-3 bg-[#FF9900] hover:bg-[#e68a00] text-[#131921] font-bold rounded-xl text-sm transition-colors"
              >
                Uporedi kreatin →
              </Link>
            </div>
          )}

          <VodiciNav currentSlug="kako-uzimati-kreatin" />
        </main>
      </div>
    </>
  );
}
