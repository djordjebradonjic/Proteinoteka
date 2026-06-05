import { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import VodiciNav from "@/components/VodiciNav";

export const metadata: Metadata = {
  title: { absolute: "Koliko proteina dnevno? Tačan broj za tvoju težinu | Proteinoteka" },
  description:
    "Za 80kg osobu koja trenira: 128–176g proteina dnevno (1.6–2.2g/kg). Tabela preporuka po cilju i težini — masa, mršavljenje, rekreacija. Konkretna računica.",
  alternates: { canonical: "https://proteinoteka.rs/vodici/koliko-proteina-dnevno" },
  openGraph: {
    title: "Koliko proteina dnevno? Tačan broj za tvoju težinu | Proteinoteka",
    description:
      "Za 80kg osobu koja trenira: 128–176g proteina dnevno (1.6–2.2g/kg). Tabela preporuka po cilju i težini — masa, mršavljenje, rekreacija. Konkretna računica.",
    url: "https://proteinoteka.rs/vodici/koliko-proteina-dnevno",
    siteName: "Proteinoteka",
    locale: "sr_RS",
    type: "article",
  },
};

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
];

const BASE = "https://proteinoteka.rs";
const SLUG = "/vodici/koliko-proteina-dnevno";
const WORDS = 620;
const READ_MIN = Math.ceil(WORDS / 200);

export default function Page() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Koliko proteina dnevno treba uzimati?",
      datePublished: "2026-06-05",
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
              <span>Ažurirano: jun 2026.</span>
            </div>
          </div>

          {/* Intro */}
          <p className="text-lg text-slate-700 leading-relaxed mb-10 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
            Za osobu koja redovno trenira, optimalni dnevni unos proteina je <strong className="text-slate-900">1.6–2.2g po kilogramu telesne mase</strong>. Ako vaziš 80kg, to znači 128–176g proteina dnevno. Rekreativcima koji se ne bave ozbiljnim treninzima dosta je i 1.2–1.6g/kg.
          </p>

          {/* Section 1 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Kako se računa tvoj konkretni unos</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700 mb-6">
              <p>
                Uzmi svoju telesnu masu u kilogramima i pomnoži je sa 1.6 za minimalni unos, ili sa 2.2 za gornju granicu. Ako si u fazi izgradnje mišića, ciljaj gornju trećinu tog raspona. Ako skijaš kilograme, 1.8–2g/kg ti pomaže da sačuvaš mišiće dok si u kalorijskom deficitu.
              </p>
              <p>
                Za starije od 50 godina istraživanja preporučuju blago viši unos — oko 1.8–2g/kg — jer mišići sa godinama postaju manje efikasni u iskorišćavanju proteina (anabolička rezistencija).
              </p>
            </div>

            {/* Goal + weight table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
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
          </section>

          {/* Section 2 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Kako doći do tog unosa kroz hranu</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
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
                To je oko 131g proteina iz hrane. Ostatak od 30g lako pokriješ jednom porcijom whey proteina. Ako ne jedeš meso, treba ti značajno više planiranja — kombinacija mahunarki, tofua i biljnih proteinskih šejkova.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Kad ima smisla uzimati proteinski šejk</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Šejk nije obavezan — ali je praktičan. Ako radiš dug posao, kasno jedeš ili ti je teško da uneseš dovoljno proteina kroz obroke, 30g whey proteina u šejku lako popunjava taj jaz. Nije magija, samo zgodna računica: za cenu od oko 150–200 RSD po obroku dobijaš 24–28g čistog proteina.
              </p>
              <p>
                Whey concentrate je sasvim dovoljan za većinu ljudi. Whey isolate je bolji izbor ako si netolerlantan na laktozu ili ako skidaš kilograme i zaista biraš svaki gram masti i ugljenih hidrata.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Šta se dešava ako unosiš premalo ili previše</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                <strong className="text-slate-800">Premalo (ispod 1.2g/kg):</strong> Sporiji napredak u teretani, teže oporavak posle treninga, gubitak mišićne mase ako si u kalorijskom deficitu. Osetiš se umorno.
              </p>
              <p>
                <strong className="text-slate-800">Previše (iznad 3g/kg):</strong> Kod zdravih osoba nema dokazanih štetnih efekata, ali višak proteina se samo pretvara u energiju ili skladišti kao mast — nema dodatnu korist. Skupo je bez razloga.
              </p>
            </div>
          </section>

          {/* FAQ */}
          <section className="mb-10">
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
              <Link href="/vodici/da-li-protein-goji" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Da li protein goji?
              </Link>
            </div>
          </section>

          {/* CTA */}
          <div className="bg-[#1B2B4B] rounded-2xl p-6 text-white text-center">
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

          <VodiciNav currentSlug="koliko-proteina-dnevno" />
        </main>
      </div>
    </>
  );
}
