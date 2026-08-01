import { notFound } from "next/navigation";
import { CURRENT_MARKET, MARKET_CONFIG } from "@/lib/marketConfig";
import { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import GuideToc, { TocSection } from "@/components/GuideToc";
import GuideDisclaimer from "@/components/GuideDisclaimer";

export const metadata: Metadata = {
  title: { absolute: "Kada piti protein — prije, poslije treninga ili ujutro? | Proteinoteka" },
  description:
    "Poslije treninga nije jedini trenutak koji ima smisla — ujutro i prije spavanja imaju jednako dobru znanstvenu podlogu. Konkretan raspored za dan s treningom i dan bez njega.",
  alternates: { canonical: `https://${MARKET_CONFIG[CURRENT_MARKET].domain}/hr-vodici/kada-piti-protein-hrvatska` },
  openGraph: {
    title: "Kada piti protein — prije, poslije treninga ili ujutro? | Proteinoteka",
    description:
      "Poslije treninga nije jedini trenutak koji ima smisla — ujutro i prije spavanja imaju jednako dobru znanstvenu podlogu.",
    url: `https://${MARKET_CONFIG[CURRENT_MARKET].domain}/hr-vodici/kada-piti-protein-hrvatska`,
    siteName: "Proteinoteka",
    locale: MARKET_CONFIG[CURRENT_MARKET].ogLocale,
    type: "article",
    images: [{ url: `https://${MARKET_CONFIG[CURRENT_MARKET].domain}/opengraph-image`, width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", images: [`https://${MARKET_CONFIG[CURRENT_MARKET].domain}/opengraph-image`] },
};

const TOC: TocSection[] = [
  { id: "kratak-odgovor", title: "Kratak odgovor" },
  { id: "anabolicki-prozor", title: "Mit o 'anaboličkom prozoru' od pola sata" },
  { id: "tri-trenutka", title: "Tri trenutka koja znanost stvarno podržava" },
  { id: "ujutro", title: "Ujutro, na prazan želudac", level: 3 },
  { id: "oko-treninga", title: "U širem rasponu oko treninga", level: 3 },
  { id: "prije-spavanja", title: "Prije spavanja", level: 3 },
  { id: "trening-nataste", title: "Kad tajming ipak igra ulogu", level: 3 },
  { id: "raspored", title: "Praktičan raspored kroz dan" },
  { id: "dan-odmora", title: "A dan bez treninga?" },
  { id: "faq", title: "Često postavljana pitanja" },
];

const faqItems = [
  {
    q: "Moram li popiti shake unutar pola sata poslije treninga?",
    a: "Ne. Taj savjet je star i previše strog — tijelo ima na raspolaganju aminokiseline iz obroka pojedenog nekoliko sati ranije, pa 'prozor' traje puno duže nego pola sata. Ako popijete shake sat ili dva poslije treninga, ne gubite ništa mjerljivo.",
  },
  {
    q: "Je li loše piti protein na prazan želudac ujutro?",
    a: "Nije, dapače. Poslije noćnog posta tijelo je spremno iskoristiti aminokiseline iz obroka, pa je proteinski doručak — shake, jaja ili grčki jogurt — sasvim dobar način da započnete dan.",
  },
  {
    q: "Vrijedi li piti protein prije spavanja?",
    a: "Da. Kazein se probavlja sporo, pa 30-40g prije spavanja opskrbljuje tijelo aminokiselinama tijekom cijele noći. Whey nije pogrešan izbor za taj termin, samo se brže potroši pa je učinak nešto kraći.",
  },
  {
    q: "Što ako uopće ne stignem popiti shake taj dan?",
    a: "Onda se usredotočite na sljedeći obrok. Jedan izostavljen shake ne pravi razliku ako je ukupan dnevni unos proteina uredan — tijelo ne 'kažnjava' propušten trenutak, samo bilježi koliko je ukupno dobilo tijekom dana.",
  },
  {
    q: "Koliko puta dnevno je optimalno piti protein?",
    a: "Za većinu ljudi 3-4 obroka s 25-40g proteina po obroku pokriva potrebe bolje nego jedan ogroman unos. Svaki takav obrok zasebno potiče izgradnju mišića, pa razmak od otprilike 4 sata između njih ima smisla.",
  },
];

const BASE = `https://${MARKET_CONFIG[CURRENT_MARKET].domain}`;
const SLUG = "/hr-vodici/kada-piti-protein-hrvatska";

export default function Page() {
  if (CURRENT_MARKET !== "hr") notFound();
  const dateModified = new Date().toISOString().split("T")[0];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Kada piti protein — prije, poslije treninga ili ujutro?",
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
        { "@type": "ListItem", position: 3, name: "Kada piti protein", item: `${BASE}${SLUG}` },
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
            <span className="text-slate-600">Kada piti protein</span>
          </nav>

          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-4">
              Kada piti protein — prije, poslije treninga ili ujutro?
            </h1>
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <span>7 min čitanja</span>
              <span>·</span>
              <time dateTime={dateModified}>Ažurirano: kolovoz 2026.</time>
            </div>
          </div>

          <div id="kratak-odgovor" className="mb-8 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-lg text-slate-700 leading-relaxed">
              <strong className="text-slate-900">Kratak odgovor:</strong> nema jednog &quot;pravog&quot; trenutka — bitniji je <strong className="text-slate-900">ukupan dnevni unos proteina</strong> nego minuta u kojoj popijete shake. Tri termina imaju stvarnu prednost: ujutro nakon noćnog posta, negdje u rasponu od par sati oko treninga, i prije spavanja ako vam ostane praznina od 4-5 sati bez obroka. Van tih situacija, pijte ga kad vam odgovara u raspored.
            </p>
          </div>

          <GuideToc sections={TOC} />

          <section className="mb-10" id="anabolicki-prozor">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Mit o &quot;anaboličkom prozoru&quot; od pola sata</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Priča o tome da morate popiti shake u prvih 30 minuta poslije treninga, inače &quot;propuštate priliku&quot;, potječe iz istraživanja na profesionalnim sportašima koji su trenirali natašte, ujutro, bez ijednog obroka u sistemu. Za nekoga tko je jeo normalan obrok dva-tri sata prije nego što je ušao u teretanu, situacija je sasvim drugačija — tijelo već ima aminokiseline u krvotoku.
              </p>
              <p>
                Meta-analiza Schoenfelda i Aragona (2013) koja je objedinila dostupna istraživanja o tajmingu proteina zaključuje da taj prozor traje <strong className="text-slate-900">nekoliko sati, ne pola sata</strong>. Isti autori su kasnije, u odvojenim radovima, pokazali da je ukupna dnevna količina proteina daleko odlučujući faktor za rast mišića od preciznog trenutka unosa.
              </p>
              <div className="bg-[#FFF8EC] border border-[#FF9900]/30 rounded-xl p-4">
                <p className="text-[14px] text-slate-700">
                  <strong className="text-slate-900">Drugim riječima:</strong> shake odmah poslije treninga uz nedovoljan unos proteina tijekom cijelog tjedna daje slabije rezultate od propuštenog &quot;prozora&quot; uz uredan dnevni unos. Fokus ide na prvo, ne na drugo.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-10" id="tri-trenutka">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Tri trenutka koja znanost stvarno podržava</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700 mb-5">
              <p>
                Iako tajming nije glavni faktor, tri situacije u danu imaju konkretnu, mjerljivu prednost — ne zato što je sat na zidu poseban, nego zato što se tijelo u tim trenucima nalazi u drugačijem stanju.
              </p>
            </div>

            <h3 id="ujutro" className="text-[17px] font-bold text-slate-800 mt-6 mb-3">Ujutro, na prazan želudac</h3>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Poslije 7-9 sati sna tijelo nije primilo hranu satima, pa je razina aminokiselina u krvi na dnu — mišićno tkivo je u blago negativnoj ravnoteži. Whey protein je za taj trenutak dobar izbor jer se apsorbira brzo (u krvotoku je za 30-60 minuta) i zaustavlja to stanje najbrže od svih vrsta proteina.
              </p>
              <p>
                Shake s zobenim pahuljicama ili voćem za doručak kombinira brzi protein s laganijim ugljikohidratima i drži energiju stabilnom sve do ručka.
              </p>
            </div>

            <h3 id="oko-treninga" className="text-[17px] font-bold text-slate-800 mt-6 mb-3">U širem rasponu oko treninga</h3>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                I dalje ima smisla da negdje u rasponu od dva-tri sata prije do dva-tri sata poslije treninga unesete porciju proteina od 25-40g — samo bez žurbe. Ako ste jeli obrok prije treninga, taj &quot;poslije&quot; shake možete popiti i sat vremena kasnije nego što biste inače, bez ikakve razlike u rezultatu.
              </p>
            </div>

            <h3 id="prije-spavanja" className="text-[17px] font-bold text-slate-800 mt-6 mb-3">Prije spavanja</h3>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Kazein se probavlja sporo — 6-8 sati — što ga čini prirodno pogodnim za noć. Istraživanje Resa i suradnika (2012, <em>Medicine &amp; Science in Sports &amp; Exercise</em>) pokazalo je da <strong className="text-slate-900">30-40g kazeina prije spavanja</strong> povećava izgradnju mišićnih proteina tijekom noći, bez negativnog utjecaja na sagorijevanje masti.
              </p>
              <p>
                Nemate kazein u prahu? Svježi sir ili grčki jogurt daju sličan učinak jer su prirodno bogati kazeinom, a obično su i jeftiniji izbor za redovnu upotrebu.
              </p>
            </div>

            <h3 id="trening-nataste" className="text-[17px] font-bold text-slate-800 mt-6 mb-3">Kad tajming ipak igra ulogu</h3>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Postoji jedna situacija u kojoj vrijeme unosa stvarno nešto mijenja: trening natašte, npr. jutarnji kardio prije doručka. Tijelo tada satima nije primilo protein, pa unos u prvih sat vremena poslije takvog treninga pomaže zaustaviti razgradnju mišićnog tkiva brže nego da čekate uobičajenih par sati. Van ovog scenarija, razlika je zanemariva.
              </p>
            </div>
          </section>

          <section className="mb-10" id="raspored">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Praktičan raspored kroz dan</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700 mb-5">
              <p>Primjer za osobu od 78 kg, cilj oko 150g proteina dnevno, trening u kasno poslijepodne:</p>
            </div>
            <div className="space-y-3 mb-6">
              {[
                { time: "07:30 — Doručak", items: ["2-3 jaja (~18g)", "150g grčkog jogurta (~14g)", "Ukupno: ~32g"] },
                { time: "12:30 — Ručak", items: ["180g piletine ili ribe (~40g)", "Riža ili krumpir, povrće"] },
                { time: "17:00 — Prije treninga", items: ["Lagani obrok ili whey shake 25g (~20g)"] },
                { time: "19:00 — Poslije treninga", items: ["Ako niste jeli prije: whey shake 25-30g", "Ako jeste: ravno na večeru"] },
                { time: "20:30 — Večera", items: ["180g mesa ili leguminoza (~35g)", "Salata, prilog"] },
                { time: "22:30 — Prije spavanja", items: ["150g svježeg sira ili kazein shake (~22g)", "Ukupno dana: ~150g ✓"] },
              ].map(({ time, items }) => (
                <div key={time} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <p className="font-bold text-[#FF9900] text-[13px] mb-1">{time}</p>
                  <ul className="text-[14px] text-slate-600 space-y-0.5">
                    {items.map((item, i) => (
                      <li key={i} className={item.startsWith("Ukupno") ? "font-semibold text-slate-800 mt-1" : ""}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-10" id="dan-odmora">
            <h2 className="text-xl font-bold text-slate-900 mb-4">A dan bez treninga?</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Mišići se ne obnavljaju tijekom samog treninga, nego u satima i danima poslije njega — dan odmora je dio tog procesa jednako koliko i dan u teretani. Cilj u gramima proteina ostaje isti bez obzira jeste li trenirali, a tajming postaje potpuno sporedan: raspodijelite unos na uobičajenih 3-4 obroka i time je posao odrađen.
              </p>
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
              <li>Schoenfeld BJ &amp; Aragon AA (2013). The effect of protein timing on muscle strength and hypertrophy. <em>Journal of the International Society of Sports Nutrition</em>, 10(1), 53.</li>
              <li>Res PT et al. (2012). Protein ingestion before sleep improves postexercise overnight recovery. <em>Medicine &amp; Science in Sports &amp; Exercise</em>, 44(8), 1560-1569.</li>
              <li>Areta JL et al. (2013). Timing and distribution of protein ingestion during prolonged recovery. <em>Journal of Physiology</em>, 591(9), 2319-2331.</li>
            </ol>
          </section>

          <GuideDisclaimer />

          <section className="mt-10 mb-10">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Korisni vodiči</h2>
            <div className="flex flex-wrap gap-3">
              <Link href="/hr-vodici/koliko-proteina-dnevno-hrvatska" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Koliko proteina dnevno?
              </Link>
              <Link href="/hr-vodici/kako-uzimati-whey-protein-hrvatska" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Kako uzimati whey protein
              </Link>
              <Link href="/hr-vodici/da-li-protein-goji-hrvatska" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Goji li protein?
              </Link>
              <Link href="/hr-vodici/koliko-kosta-protein-hrvatska" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Koliko košta protein u HR?
              </Link>
            </div>
          </section>

          <div className="bg-[#1B2B4B] rounded-2xl p-6 text-white text-center">
            <p className="text-base leading-relaxed mb-4">
              Pronađite protein koji nudi najviše za vaš novac — sve trgovine u Hrvatskoj na jednom mjestu.
            </p>
            <Link
              href="/?sort=valueScore%2Cdesc"
              className="inline-block px-6 py-3 bg-[#FF9900] hover:bg-[#e68a00] text-[#131921] font-bold rounded-xl text-sm transition-colors"
            >
              Usporedite proteine po Value Score-u →
            </Link>
          </div>
        </main>
      </div>
    </>
  );
}
