import { notFound } from "next/navigation";
import { CURRENT_MARKET, MARKET_CONFIG } from "@/lib/marketConfig";
import { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import GuideToc, { TocSection } from "@/components/GuideToc";
import GuideDisclaimer from "@/components/GuideDisclaimer";
import ProteinCalculator from "@/components/ProteinCalculator";

export const metadata: Metadata = {
  title: { absolute: "Koliko proteina dnevno? Točan broj za vašu težinu | Proteinoteka" },
  description:
    "Za osobu od 80kg koja trenira: 128–176g proteina dnevno (1.6–2.2g/kg). Tablica preporuka po cilju i težini — masa, mršavljenje, rekreacija. Konkretna računica.",
  alternates: { canonical: `https://${MARKET_CONFIG[CURRENT_MARKET].domain}/hr-vodici/koliko-proteina-dnevno-hrvatska` },
  openGraph: {
    title: "Koliko proteina dnevno? Točan broj za vašu težinu | Proteinoteka",
    description:
      "Za osobu od 80kg koja trenira: 128–176g proteina dnevno (1.6–2.2g/kg). Tablica preporuka po cilju i težini — masa, mršavljenje, rekreacija.",
    url: `https://${MARKET_CONFIG[CURRENT_MARKET].domain}/hr-vodici/koliko-proteina-dnevno-hrvatska`,
    siteName: "Proteinoteka",
    locale: MARKET_CONFIG[CURRENT_MARKET].ogLocale,
    type: "article",
    images: [{ url: `https://${MARKET_CONFIG[CURRENT_MARKET].domain}/opengraph-image`, width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", images: [`https://${MARKET_CONFIG[CURRENT_MARKET].domain}/opengraph-image`] },
};

const tocSections: TocSection[] = [
  { id: "osnovna-formula", title: "Osnovna formula: g/kg tjelesne mase" },
  { id: "izracunaj", title: "Izračunajte svoju ciljanu vrijednost", level: 3 },
  { id: "zene-muskarci", title: "Žene vs. muškarci — postoji li razlika?", level: 3 },
  { id: "stariji", title: "50+ godina — zašto treba više", level: 3 },
  { id: "hrana-racunica", title: "Kako doći do tog unosa kroz hranu" },
  { id: "biljni-proteini", title: "Biljni proteini — kako kombinirati", level: 3 },
  { id: "sejk", title: "Kada ima smisla uzimati proteinski shake" },
  { id: "previse-premalo", title: "Previše ili premalo — što se događa" },
  { id: "mit-bubrezi", title: "Mit o bubrezima i previše proteina", level: 3 },
  { id: "faq", title: "Često postavljana pitanja" },
];

const faqItems = [
  {
    q: "Može li 2g proteina po kg tjelesne mase naškoditi bubrezima?",
    a: "Kod zdravih ljudi s normalnom funkcijom bubrega, istraživanja nisu pronašla negativne učinke ni pri unosima do 3g/kg. Ako imate prethodno oštećenje bubrega, savjetujte se s liječnikom prije nego što povećate unos proteina.",
  },
  {
    q: "Koliko proteina može tijelo iskoristiti iz jednog obroka?",
    a: "Vaše tijelo može iskoristiti veće količine proteina u jednom obroku nego što se ranije mislilo — istraživanja pokazuju da se i 100g odjednom apsorbira, samo sporije. Ipak, raspoređivanje na 3–4 obroka od po 30–40g daje optimalniji odgovor mišića.",
  },
  {
    q: "Računaju li biljni proteini jednako kao životinjski?",
    a: "Biljni proteini uglavnom imaju nešto lošiji aminokiselinski profil i niži DIAAS skor, pa treba unositi 10–20% više da biste dobili isti učinak. Kombiniranje izvora (riža + grašak, grah + kukuruz) rješava ovaj problem.",
  },
  {
    q: "Treba li povećati proteine u fazi mršavljenja?",
    a: "Da — u kalorijskom deficitu preporučuje se 2.0–2.4g/kg jer visok unos proteina štiti mišićnu masu dok gubite mast. Više proteina znači i veći osjećaj sitosti, što olakšava pridržavanje dijete.",
  },
];

const BASE = `https://${MARKET_CONFIG[CURRENT_MARKET].domain}`;
const SLUG = "/hr-vodici/koliko-proteina-dnevno-hrvatska";

export default function Page() {
  if (CURRENT_MARKET !== 'hr') notFound();
  const dateModified = new Date().toISOString().split("T")[0];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Koliko proteina dnevno treba uzimati?",
      datePublished: "2026-06-27",
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

          <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-8 flex-wrap">
            <Link href="/" className="hover:text-[#FF9900] transition-colors">Početna</Link>
            <span>/</span>
            <Link href="/hr-vodici" className="hover:text-[#FF9900] transition-colors">Vodiči</Link>
            <span>/</span>
            <span className="text-slate-600">Koliko proteina dnevno</span>
          </nav>

          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-4">
              Koliko proteina dnevno treba uzimati?
            </h1>
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <span>7 min čitanja</span>
              <span>·</span>
              <time dateTime={dateModified}>Ažurirano: lipanj 2026.</time>
            </div>
          </div>

          <p className="text-lg text-slate-700 leading-relaxed mb-8 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
            Za osobu koja redovito trenira, optimalni dnevni unos proteina je{" "}
            <strong className="text-slate-900">1.6–2.2g po kilogramu tjelesne mase</strong>. Ako važete 80kg,
            to znači 128–176g proteina dnevno. Rekreativcima koji se ne bave ozbiljnim treningom dovoljna je i
            1.2–1.6g/kg.
          </p>

          <GuideToc sections={tocSections} />

          <ProteinCalculator />

          <section className="mb-10">
            <h2 id="osnovna-formula" className="text-xl font-bold text-slate-900 mb-4">Osnovna formula: g/kg tjelesne mase</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700 mb-6">
              <p>
                Znanost o proteinima nije komplicirana — ključna varijabla je vaša{" "}
                <strong className="text-slate-800">tjelesna masa i razina aktivnosti</strong>. Meta-analiza
                Mortona i sur. (2018) obuhvatila je 49 studija s 1.800 ispitanika i zaključila da gornja granica
                korisnog unosa iznosi oko 1.62g/kg/dan za izgradnju mišića. Iznad te granice, svaki dodatni gram
                daje zanemarljiv učinak na sintezu mišićnih proteina.
              </p>
              <p>
                ISSN (International Society of Sports Nutrition) u svom Position Standu iz 2017. preporučuje
                1.4–2.0g/kg za sportaše koji treniraju snagu, s napomenom da vrijednosti do 3.0g/kg ostaju
                sigurne kod zdravih osoba.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
              <div className="px-4 py-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Preporučeni dnevni unos proteina</span>
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
                      { profile: "Rekreativac (3× tjedno)", range: "1.2–1.6", v70: "84–112g", v80: "96–128g", v90: "108–144g" },
                      { profile: "Aktivan (5× tjedno)", range: "1.6–2.0", v70: "112–140g", v80: "128–160g", v90: "144–180g" },
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

            <h3 id="izracunaj" className="text-lg font-bold text-slate-900 mb-3">Izračunajte svoju ciljanu vrijednost</h3>
            <div className="space-y-3 text-[15px] leading-relaxed text-slate-700 mb-6">
              <p>
                Formula je jednostavna:{" "}
                <strong className="text-slate-800">tjelesna masa (kg) × faktor iz tablice = gram proteina dnevno</strong>.
                Uzmite svoju masu i pomnožite je s 1.6 za minimalni unos ili s 2.2 za gornju granicu. Ako ste
                u fazi izgradnje mišića, ciljajte gornju trećinu tog raspona.
              </p>
              <p>
                Primjer za osobu od 75kg koja trenira 4 puta tjedno i želi graditi mišiće: 75 × 2.0 ={" "}
                <strong className="text-slate-800">150g proteina dnevno</strong>. Rasporedite to na 4–5 obroka
                od po 30–40g — mišićna sinteza se maksimizira kada svaki obrok sadrži barem 0.4g/kg, pokazuje
                istraživanje Stokesa i sur. (2018).
              </p>
            </div>

            <h3 id="zene-muskarci" className="text-lg font-bold text-slate-900 mb-3">Žene vs. muškarci — postoji li razlika?</h3>
            <div className="space-y-3 text-[15px] leading-relaxed text-slate-700 mb-6">
              <p>
                Kratki odgovor: <strong className="text-slate-800">isti raspon, isti principi</strong>. Žene imaju
                nešto manje mišićne mase u apsolutnim brojevima, ali formula g/kg funkcionira identično. Razlika
                se javlja u hormonalnom ciklusu — u lutealnoj fazi (druga polovina ciklusa) oksidacija proteina
                blago raste, pa neke sportašice povećavaju unos za ~10% tih dana.
              </p>
              <p>
                Važno napomenuti: visok unos proteina ne znači automatski i glomazne mišiće. Kod žena je
                hormonalno okruženje (niži testosteron) prirodna kočnica hipertrofije, bez obzira na prehranu.
              </p>
            </div>

            <h3 id="stariji" className="text-lg font-bold text-slate-900 mb-3">50+ godina — zašto treba više</h3>
            <div className="space-y-3 text-[15px] leading-relaxed text-slate-700">
              <p>
                S godinama dolazi do <strong className="text-slate-800">anaboličke rezistencije</strong> — mišići
                postaju manje osjetljivi na isti podražaj proteina. Da bi postigla isti učinak sinteze mišićnih
                proteina kao mlađa osoba s 30g whey-a u obroku, osobi od 60+ godina može biti potrebno i 40–50g.
              </p>
              <p>
                Preporuka za starije od 50 godina je stoga 1.8–2.0g/kg, uz posebnu pažnju na leucin — aminokiselinu
                koja "pokreće" mišićnu sintezu. Whey protein i svježi sir prirodno su bogati leucinom.
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 id="hrana-racunica" className="text-xl font-bold text-slate-900 mb-4">Kako doći do tog unosa kroz hranu</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700 mb-6">
              <p>Evo realne računice za osobu od 80kg koja cilja 160g proteina:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>3 jaja za doručak → ~19g proteina</li>
                <li>200g piletine za ručak → ~44g proteina</li>
                <li>200g svinjetine za večeru → ~38g proteina</li>
                <li>200g grčkog jogurta + 100g svježeg sira → ~30g proteina</li>
              </ul>
              <p>
                To je oko 131g proteina iz hrane. Ostatak od ~30g lako pokrijete jednom porcijom whey proteina.
                Ako ne jedete meso, potrebno je značajno više planiranja — kombinacija mahunarki, tofua i biljnih
                proteinskih shakeova.
              </p>
            </div>

            <h3 id="biljni-proteini" className="text-lg font-bold text-slate-900 mb-3">Biljni proteini — kako kombinirati</h3>
            <div className="space-y-3 text-[15px] leading-relaxed text-slate-700">
              <p>
                Biljni proteini imaju niži skor biološke vrijednosti od životinjskih jer su siromašni u jednoj
                ili više esencijalnih aminokiselina. Soja je iznimka — njen DIAAS je sličan whey-u.
              </p>
              <p>
                Praktično rješenje: kombinirajte izvore koji se nadopunjuju.{" "}
                <strong className="text-slate-800">Riža + grašak</strong> zajedno daju kompletan aminokiselinski
                profil — upravo zato je kombinirani protein riže i graška toliko popularan u biljnim formulama.
                Mahunarke (grah, leća, sočivo) su siromašne metioninom, ali bogate lizinom; žitarice su suprotno
                — savršena kombinacija.
              </p>
              <p>
                Vegani i vegetarijanci trebaju ciljati{" "}
                <strong className="text-slate-800">10–15% više</strong> od g/kg vrijednosti iz tablice kako bi
                kompenzirali nižu biološku raspoloživost.
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 id="sejk" className="text-xl font-bold text-slate-900 mb-4">Kada ima smisla uzimati proteinski shake</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Shake nije obavezan — ali je praktičan. Ako radite dugo, kasno jedete ili vam je teško unijeti
                dovoljno proteina kroz obroke, 30g whey proteina u shakeu lako popunjava taj jaz. Za cijenu od
                oko 1.5–2.5 EUR po obroku dobivate 24–28g čistog proteina.
              </p>
              <p>
                <strong className="text-slate-800">Whey koncentrat</strong> je sasvim dovoljan za većinu ljudi
                — ~80% proteina, pristupačna cijena. <strong className="text-slate-800">Whey izolat</strong> je
                bolji izbor ako imate intoleranciju na laktozu ili ako smanjujete tjelesnu masu i birate svaki
                gram masti i ugljikohidrata.
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 id="previse-premalo" className="text-xl font-bold text-slate-900 mb-4">Previše ili premalo — što se događa</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700 mb-6">
              <p>
                <strong className="text-slate-800">Premalo (ispod 1.2g/kg):</strong> Sporiji napredak u teretani,
                teži oporavak nakon treninga, gubitak mišićne mase ako ste u kalorijskom deficitu. Dugoročno,
                kronično nizak unos proteina povećava rizik od sarkopenije (gubitka mišića s godinama).
              </p>
              <p>
                <strong className="text-slate-800">Previše (iznad 3g/kg):</strong> Kod zdravih osoba nema
                dokazanih štetnih učinaka — višak proteina se oksidira za energiju ili, u manjoj mjeri,
                pretvara u glukozu. Nema dokaza da se izravno skladišti kao mast, ali nosi kalorije (4 kcal/g)
                koje treba uzeti u obzir u ukupnom energetskom balansu.
              </p>
            </div>

            <h3 id="mit-bubrezi" className="text-lg font-bold text-slate-900 mb-3">Mit o bubrezima i previše proteina</h3>
            <div className="space-y-3 text-[15px] leading-relaxed text-slate-700">
              <p>
                Ovo je možda najrašireniji mit u fitnesu. Visok unos proteina{" "}
                <strong className="text-slate-800">ne oštećuje bubrege kod zdravih osoba</strong>. Mit potječe
                iz kliničke prakse gdje se pacijentima s već postojećim oštećenjem bubrega ograničava protein
                — jer bolesni bubrezi ne mogu učinkovito filtrirati produkte razgradnje proteina.
              </p>
              <p>
                Višegodišnje studije na zdravim sportašima koji unose 2–3g/kg nisu pokazale nikakvo pogoršanje
                bubrežne funkcije. Ako nemate dijagnosticiranu bubrežnu bolest, nema razloga za brigu.
              </p>
              <p className="text-xs text-slate-500 pt-2 border-t border-slate-100">
                Izvori: Morton et al., <em>Br J Sports Med</em> 2018; Jäger et al.,{" "}
                <em>J Int Soc Sports Nutr</em> 2017 (ISSN Position Stand); Stokes et al.,{" "}
                <em>Physiol Rep</em> 2018.
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
              <Link href="/hr-vodici/protein-za-mrsavljenje-hrvatska" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Protein za mršavljenje
              </Link>
              <Link href="/hr-vodici/da-li-protein-goji-hrvatska" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Goji li protein?
              </Link>
              <Link href="/hr-vodici/koliko-kosta-protein-hrvatska" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Koliko košta protein u HR?
              </Link>
            </div>
          </section>

          <div className="bg-[#1B2B4B] rounded-2xl p-6 text-white text-center mb-10">
            <p className="text-base leading-relaxed mb-4">
              Znate koliko proteina trebate — sada pronađite koji whey protein nudi najviše proteina za vaš novac u Hrvatskoj.
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
