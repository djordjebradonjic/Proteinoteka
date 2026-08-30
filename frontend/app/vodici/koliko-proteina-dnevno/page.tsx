import { notFound } from "next/navigation";
import { CURRENT_MARKET, MARKET_CONFIG } from '@/lib/marketConfig';
import { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import VodiciNav from "@/components/VodiciNav";
import GuideToc, { TocSection } from "@/components/GuideToc";
import GuideDisclaimer from "@/components/GuideDisclaimer";
import ProteinCalculator from "@/components/ProteinCalculator";

export const metadata: Metadata = {
  title: { absolute: "Koliko Proteina Dnevno? Kalkulator + Tabela | Proteinoteka" },
  description:
    "Unesi težinu — kalkulator odmah izračuna tačan dnevni unos proteina. Tabela za svaki cilj: rekreacija, masa, mršavljenje, 50+. Zasnovano na ISSN preporukama.",
  alternates: { canonical: `https://${MARKET_CONFIG[CURRENT_MARKET].domain}/vodici/koliko-proteina-dnevno` },
  openGraph: {
    title: "Koliko Proteina Dnevno? Kalkulator + Tabela | Proteinoteka",
    description:
      "Unesi težinu — kalkulator odmah izračuna tačan dnevni unos proteina. Tabela za svaki cilj: rekreacija, masa, mršavljenje, 50+. Zasnovano na ISSN preporukama.",
    url: `https://${MARKET_CONFIG[CURRENT_MARKET].domain}/vodici/koliko-proteina-dnevno`,
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
  { id: "osnovna-formula", title: "Osnovna formula: g/kg telesne mase" },
  { id: "izracunaj", title: "Izračunaj svoju ciljanu vrednost", level: 3 },
  { id: "zene-muskarci", title: "Žene vs. muškarci — postoji li razlika?", level: 3 },
  { id: "stariji", title: "50+ godina — zašto treba više", level: 3 },
  { id: "hrana-racunica", title: "Kako doći do tog unosa kroz hranu" },
  { id: "biljni-proteini", title: "Biljni proteini — kako kombinovati", level: 3 },
  { id: "sejk", title: "Kad ima smisla uzimati proteinski šejk" },
  { id: "previše-premalo", title: "Previše ili premalo — šta se dešava" },
  { id: "mit-bubrezi", title: "Mit o bubrezima i previše proteina", level: 3 },
  { id: "faq", title: "Česta pitanja" },
];

const faqItems = [
  {
    q: "Da li 2g proteina po kg telesne mase može da naškodi bubrezima?",
    a: "Kod zdravih ljudi sa normalnom funkcijom bubrega, istraživanja nisu pronašla negativne efekte ni pri unosima do 3g/kg. Ako imaš prethodno oštećenje bubrega, konsultuj lekara pre nego što povećaš unos proteina.",
  },
  {
    q: "Koliko proteina može telo da iskoristi iz jednog obroka?",
    a: "Tvoje telo može da iskoristi veće količine proteina u jednom obroku nego što se ranije mislilo — istraživanja pokazuju da se i 100g odjednom apsorbuje, samo sporije. Ipak, raspoređivanje na 3–4 obroka od po 30–40g daje optimalniji odgovor mišića.",
  },
  {
    q: "Da li biljni proteini računaju jednako kao životinjski?",
    a: "Biljni proteini uglavnom imaju nešto lošiji aminokiselinski profil i niži DIAAS skor, pa treba unositi 10–20% više da bi dobio isti efekat. Kombinovanje izvora (pirinač + grašak, pasulj + kukuruz) rešava ovaj problem.",
  },
  {
    q: "Da li treba povećati proteine u fazi mršavljenja?",
    a: "Da — u kalorijskom deficitu preporučuje se 2.0–2.4g/kg jer visok unos proteina štiti mišićnu masu dok gubiš mast. Više proteina znači i veći osećaj sitosti, što olakšava pridržavanje dijete.",
  },
];

const BASE = `https://${MARKET_CONFIG[CURRENT_MARKET].domain}`;
const SLUG = "/vodici/koliko-proteina-dnevno";
const WORDS = 1300;
const READ_MIN = Math.ceil(WORDS / 200);

export default function Page() {
  if (CURRENT_MARKET !== 'rs') notFound();
  const dateModified = new Date().toISOString().split("T")[0];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Koliko proteina dnevno treba uzimati?",
      datePublished: "2026-06-05",
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
        { "@type": "ListItem", position: 2, name: "Vodiči", item: `${BASE}/vodici` },
        { "@type": "ListItem", position: 3, name: "Koliko proteina dnevno", item: `${BASE}${SLUG}` },
      ],
    },
  ];

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
            <span className="text-slate-600">Koliko proteina dnevno</span>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-4">
              Koliko proteina dnevno treba uzimati?
            </h1>
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <span>{READ_MIN} min čitanja</span>
              <span>·</span>
              <time dateTime={dateModified}>Ažurirano: jun 2026.</time>
            </div>
          </div>

          {/* Intro */}
          <p className="text-lg text-slate-700 leading-relaxed mb-8 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
            Za osobu koja redovno trenira, optimalni dnevni unos proteina je <strong className="text-slate-900">1.6–2.2g po kilogramu telesne mase</strong>. Ako vaziš 80kg, to znači 128–176g proteina dnevno. Rekreativcima koji se ne bave ozbiljnim treninzima dosta je i 1.2–1.6g/kg.
          </p>

          <GuideToc sections={tocSections} />

          <ProteinCalculator />

          {/* Section 1 */}
          <section className="mb-10">
            <h2 id="osnovna-formula" className="text-xl font-bold text-slate-900 mb-4">Osnovna formula: g/kg telesne mase</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700 mb-6">
              <p>
                Nauka o proteinima nije komplikovana — ključna promenljiva je tvoja <strong className="text-slate-800">telesna masa i nivo aktivnosti</strong>. Meta-analiza Mortona i sar. (2018) obuhvatila je 49 studija sa 1.800 ispitanika i zaključila da gornja granica korisnog unosa iznosi oko 1.62g/kg/dan za izgradnju mišića. Iznad te granice, svaki dodatan gram daje zanemarljiv efekat na sintezu mišićnih proteina.
              </p>
              <p>
                ISSN (International Society of Sports Nutrition) u svom Position Standu iz 2017. preporučuje 1.4–2.0g/kg za sportiste koji treniraju snagu, sa napomenom da vrednosti do 3.0g/kg ostaju bezbedne kod zdravih osoba.
              </p>
            </div>

            {/* Goal + weight table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
              <div className="px-4 py-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Preporučen dnevni unos proteina</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 min-w-[160px]">Profil / Cilj</th>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold text-slate-500 whitespace-nowrap">g/kg</th>
                      <th className="hidden sm:table-cell px-4 py-2.5 text-center text-xs font-semibold text-slate-500 whitespace-nowrap">70 kg</th>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold text-slate-500 whitespace-nowrap">80 kg</th>
                      <th className="hidden sm:table-cell px-4 py-2.5 text-center text-xs font-semibold text-slate-500 whitespace-nowrap">90 kg</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      { profile: "Neaktivan / sedentaran", range: "0.8", v70: "56g", v80: "64g", v90: "72g" },
                      { profile: "Rekreativac (3× nedeljno)", range: "1.2–1.6", v70: "84–112g", v80: "96–128g", v90: "108–144g" },
                      { profile: "Aktivan (5× nedeljno)", range: "1.6–2.0", v70: "112–140g", v80: "128–160g", v90: "144–180g" },
                      { profile: "Izgradnja mišića", range: "1.8–2.2", v70: "126–154g", v80: "144–176g", v90: "162–198g", highlight: true },
                      { profile: "Mršavljenje + trening", range: "2.0–2.4", v70: "140–168g", v80: "160–192g", v90: "180–216g", highlight: true },
                      { profile: "50+ godina", range: "1.8–2.0", v70: "126–140g", v80: "144–160g", v90: "162–180g" },
                    ].map(({ profile, range, v70, v80, v90, highlight }) => (
                      <tr key={profile} className={highlight ? "bg-[#FFF8EC]" : ""}>
                        <td className="px-4 py-3 text-slate-800 font-medium">{profile}</td>
                        <td className="px-4 py-3 text-center text-slate-600 whitespace-nowrap">{range}</td>
                        <td className="hidden sm:table-cell px-4 py-3 text-center text-slate-600 whitespace-nowrap">{v70}</td>
                        <td className="px-4 py-3 text-center font-semibold text-slate-800 whitespace-nowrap">{v80}</td>
                        <td className="hidden sm:table-cell px-4 py-3 text-center text-slate-600 whitespace-nowrap">{v90}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <h3 id="izracunaj" className="text-lg font-bold text-slate-900 mb-3">Izračunaj svoju ciljanu vrednost</h3>
            <div className="space-y-3 text-[15px] leading-relaxed text-slate-700 mb-6">
              <p>
                Formula je prosta: <strong className="text-slate-800">telesna masa (kg) × faktor iz tabele = gram proteina dnevno</strong>. Uzmi svoju masu i pomnoži je sa 1.6 za minimalni unos ili sa 2.2 za gornju granicu. Ako si u fazi izgradnje mišića, ciljaj gornju trećinu tog raspona.
              </p>
              <p>
                Primer za 75kg osobu koja trenira 4 puta nedeljno i želi da gradi mišiće: 75 × 2.0 = <strong className="text-slate-800">150g proteina dnevno</strong>. Rasporedi to na 4–5 obroka od po 30–40g — mišićna sinteza se maksimizuje kada svaki obrok sadrži bar 0.4g/kg, pokazuje istraživanje Stokesa i sar. (2018).
              </p>
            </div>

            <h3 id="zene-muskarci" className="text-lg font-bold text-slate-900 mb-3">Žene vs. muškarci — postoji li razlika?</h3>
            <div className="space-y-3 text-[15px] leading-relaxed text-slate-700 mb-6">
              <p>
                Kratki odgovor: <strong className="text-slate-800">isti opseg, isti principi</strong>. Žene imaju nešto manje mišićne mase u apsolutnim ciframa, ali formula g/kg funkcioniše identično. Razlika se javlja u hormonalnom ciklusu — u lutealnoj fazi (druga polovina ciklusa) oksidacija proteina blago raste, pa neke sportistkinje povećavaju unos za ~10% tih dana.
              </p>
              <p>
                Važno je napomenuti: visok unos proteina ne znači automatski i glomazne mišiće. Kod žena je hormonalno okruženje (niži testosteron) prirodna kočnica hipertrofije, bez obzira na prehranu.
              </p>
            </div>

            <h3 id="stariji" className="text-lg font-bold text-slate-900 mb-3">50+ godina — zašto treba više</h3>
            <div className="space-y-3 text-[15px] leading-relaxed text-slate-700">
              <p>
                Sa godinama dolazi do <strong className="text-slate-800">anaboličke rezistencije</strong> — mišići postaju manje osetljivi na isti stimulus proteina. Da bi postigla isti efekat sinteze mišićnih proteina kao mlađa osoba sa 30g whey-a u obroku, osobi od 60+ godina može biti potrebno i 40–50g.
              </p>
              <p>
                Preporuka za starije od 50 godina je stoga 1.8–2.0g/kg, uz posebnu pažnju na leucin — aminokiselinu koja "pokreće" mišićnu sintezu. Whey protein i svježi sir su prirodno bogati leucinom.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section className="mb-10">
            <h2 id="hrana-racunica" className="text-xl font-bold text-slate-900 mb-4">Kako doći do tog unosa kroz hranu</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700 mb-6">
              <p>
                Evo realne računice za 80kg osobu koja cilja 160g proteina:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>3 jaja za doručak → ~19g proteina</li>
                <li>200g piletine za ručak → ~44g proteina</li>
                <li>200g svinjskog mesa za večeru → ~38g proteina</li>
                <li>200g grčkog jogurta + 100g svježeg sira → ~30g proteina</li>
              </ul>
              <p>
                To je oko 131g proteina iz hrane. Ostatak od ~30g lako pokriješ jednom porcijom whey proteina. Ako ne jedeš meso, treba ti značajno više planiranja — kombinacija mahunarki, tofua i biljnih proteinskih šejkova.
              </p>
            </div>

            <h3 id="biljni-proteini" className="text-lg font-bold text-slate-900 mb-3">Biljni proteini — kako kombinovati</h3>
            <div className="space-y-3 text-[15px] leading-relaxed text-slate-700 mb-6">
              <p>
                Biljni proteini imaju niži skor biološke vrednosti od životinjskih jer su siromašni u jednoj ili više esencijalnih aminokiselina koje telo ne može samo da napravi. Soja je izuzetak — njen DIAAS je sličan whey-u.
              </p>
              <p>
                Praktično rešenje: kombinuj izvore koji se dopunjuju. <strong className="text-slate-800">Pirinač + grašak</strong> zajedno daju kompletan aminokiselinski profil — upravo zato je kombinovani pirinač+grašak protein toliko popularan u biljnim formulama. Leguminoze (pasulj, leća, sočivo) su siromašne metioninom, ali bogate lizinom; žitarice su suprotno — savršena kombinacija.
              </p>
              <p>
                Vegani i vegetarijanci treba da ciljaju <strong className="text-slate-800">10–15% više</strong> od g/kg vrednosti iz tabele kako bi kompenzovali nižu biološku dostupnost.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section className="mb-10">
            <h2 id="sejk" className="text-xl font-bold text-slate-900 mb-4">Kad ima smisla uzimati proteinski šejk</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Šejk nije obavezan — ali je praktičan. Ako radiš dug posao, kasno jedeš ili ti je teško da uneseš dovoljno proteina kroz obroke, 30g whey proteina u šejku lako popunjava taj jaz. Nije magija, samo zgodna računica: za cenu od oko 150–200 RSD po obroku dobijaš 24–28g čistog proteina.
              </p>
              <p>
                <strong className="text-slate-800">Whey concentrate</strong> je sasvim dovoljan za većinu ljudi — ~80% proteina, pristupačna cena (oko 4–5 din/g proteina na srpskom tržištu). <strong className="text-slate-800">Whey isolate</strong> je bolji izbor ako si netolerantan na laktozu ili ako skidaš kilograme i biraš svaki gram masti i ugljenih hidrata.
              </p>
              <p>
                Ako si na biljnoj ishrani, biljni proteinski prašak (pirinač+grašak) je jednako efikasan kao whey za izgradnju mišića, pokazuje sve više istraživanja — uz uslov da ga uzimeš u dovoljnoj količini.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section className="mb-10">
            <h2 id="previše-premalo" className="text-xl font-bold text-slate-900 mb-4">Previše ili premalo — šta se dešava</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700 mb-6">
              <p>
                <strong className="text-slate-800">Premalo (ispod 1.2g/kg):</strong> Sporiji napredak u teretani, teži oporavak posle treninga, gubitak mišićne mase ako si u kalorijskom deficitu. Dugoročno, hronično nizak unos proteina povećava rizik od sarkopenije (gubitka mišića sa godinama).
              </p>
              <p>
                <strong className="text-slate-800">Previše (iznad 3g/kg):</strong> Kod zdravih osoba nema dokazanih štetnih efekata — višak proteina se oksiduje za energiju ili, u manjoj meri, konvertuje u glukozu. Nema dokaza da se direktno skladišti kao mast, ali nosi kalorije (4 kcal/g) koje se moraju uzeti u obzir u ukupnom energetskom bilansu.
              </p>
            </div>

            <h3 id="mit-bubrezi" className="text-lg font-bold text-slate-900 mb-3">Mit o bubrezima i previše proteina</h3>
            <div className="space-y-3 text-[15px] leading-relaxed text-slate-700">
              <p>
                Ovo je možda najrasprostranjeniji mit u fitnesu. Visok unos proteina <strong className="text-slate-800">ne oštećuje bubrege kod zdravih osoba</strong>. Mit potiče iz kliničke prakse gde se pacijentima sa već postojećim oštećenjem bubrega ograničava protein — jer oboleli bubrezi ne mogu efikasno da filtriraju produkte razgradnje proteina.
              </p>
              <p>
                Višegodišnje studije na zdravim sportistima koji unose 2–3g/kg nisu pokazale nikakvo pogoršanje bubrežne funkcije. Ako nemaš dijagnostikovanu bubrežnu bolest, nema razloga za brigu.
              </p>
              <p className="text-xs text-slate-500 pt-2 border-t border-slate-100">
                Izvori: Morton et al., <em>Br J Sports Med</em> 2018; Jäger et al., <em>J Int Soc Sports Nutr</em> 2017 (ISSN Position Stand); Stokes et al., <em>Physiol Rep</em> 2018.
              </p>
            </div>
          </section>

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
              <Link href="/kategorija/whey-concentrate?sort=valueScore,desc" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Whey Concentrate proteini
              </Link>
              <Link href="/kategorija/whey-isolate?sort=valueScore,desc" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Whey Isolate proteini
              </Link>
              <Link href="/vodici/kada-piti-protein" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Kada piti protein?
              </Link>
              <Link href="/vodici/koji-whey-protein-kupiti" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Koji whey protein kupiti?
              </Link>
              <Link href="/vodici/najbolji-biljni-protein" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Najbolji biljni protein
              </Link>
              <Link href="/vodici/da-li-protein-goji" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Da li protein goji?
              </Link>
              <Link href="/vodici/koliko-novca-mesecno-za-proteine" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Koliko košta mesec proteina?
              </Link>
              <Link href="/whey-protein-cena" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Whey protein cena u Srbiji
              </Link>
              <Link href="/najjeftiniji-whey-protein" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Najjeftiniji whey protein
              </Link>
            </div>
          </section>

          {/* CTA */}
          <div className="bg-[#1B2B4B] rounded-2xl p-6 text-white text-center mb-10">
            <p className="text-base leading-relaxed mb-4">
              Znaš koliko proteina treba — sad pronađi koji whey protein nudi najviše proteina za tvoj novac.
            </p>
            <Link
              href="/?sort=valueScore,desc"
              className="inline-block px-6 py-3 bg-[#FF9900] hover:bg-[#e68a00] text-[#131921] font-bold rounded-xl text-sm transition-colors"
            >
              Uporedi cene proteina na Proteinoteka.rs
            </Link>
          </div>

          <GuideDisclaimer />

          <VodiciNav currentSlug="koliko-proteina-dnevno" />
        </main>
      </div>
    </>
  );
}
