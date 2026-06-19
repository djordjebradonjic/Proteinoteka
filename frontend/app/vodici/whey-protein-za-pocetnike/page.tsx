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
  title: { absolute: "Whey protein za početnike: šta, koliko i odakle? | Proteinoteka" },
  description:
    "Kao početnik, WPC (whey concentrate) je sve što trebaš — jeftin i efikasan. Koliko uzimati, kada piti i koliko košta mesec dana u Srbiji — sa aktuelnim cenama.",
  alternates: { canonical: "https://proteinoteka.rs/vodici/whey-protein-za-pocetnike" },
  openGraph: {
    title: "Whey protein za početnike: šta, koliko i odakle? | Proteinoteka",
    description:
      "Kao početnik, WPC (whey concentrate) je sve što trebaš — jeftin i efikasan. Koliko uzimati, kada piti i koliko košta mesec dana u Srbiji — sa aktuelnim cenama.",
    url: "https://proteinoteka.rs/vodici/whey-protein-za-pocetnike",
    siteName: "Proteinoteka",
    locale: "sr_RS",
    type: "article",
  },
};

function pricePerGramProtein(p: Product): number | null {
  if (!p.numericPrice || !p.primaryWeightGrams || !p.proteinPer100g) return null;
  const totalProteinG = p.primaryWeightGrams * (p.proteinPer100g / 100);
  if (totalProteinG <= 0) return null;
  return p.numericPrice / totalProteinG;
}

const tocSections: TocSection[] = [
  { id: "da-li-treba", title: "Da li ti uopšte treba proteinski šejk?" },
  { id: "koji-tip", title: "Koji tip proteina uzeti kao početnik?" },
  { id: "wpc-prednosti", title: "Zašto WPC za početnike", level: 3 },
  { id: "koliko-dnevno", title: "Koliko proteina trebaš dnevno?" },
  { id: "kada-uzimati", title: "Kako i kada uzimati protein?" },
  { id: "tajming-mit", title: "Mit o 30-minutnom anaboličkom prozoru", level: 3 },
  { id: "cena", title: "Koliko košta mesec dana?" },
  { id: "izbegavati", title: "Šta izbegavati kao početnik" },
  { id: "faq", title: "Česta pitanja" },
];

const faqItems = [
  {
    q: "Da li početnik uopšte treba proteinski šejk?",
    a: "Ne nužno — protein u prahu je hrana, ne lek. Ako iz normalnih obroka (jaja, piletina, riba, jogurt) dostigneš 1.6g proteina po kilogramu telesne mase, šejk ti ne treba. Koristan je kad nemaš vremena za obrok, kad ti je teško da dostigneš dnevnu normu iz hrane, ili kao jeftin post-workout obrok.",
  },
  {
    q: "Koliko brzo ću videti rezultate od proteinskog šejka?",
    a: "Protein ubrzava oporavak i podržava rast mišića, ali nije sam po sebi uzrok rezultata. Uz redovan trening i dovoljno sna, prvih primetnih promena možeš očekivati za 4–8 nedelja. Bez treninga, šejk nema poseban efekat.",
  },
  {
    q: "Mogu li uzimati protein na prazan stomak ujutru?",
    a: "Da — whey protein ujutru je odlična ideja. Posle noćnog posta mišići su u blagom kataboličkom stanju, a whey se brzo apsorbuje i pokreće sintezu mišićnih proteina. Možeš ga kombinovati sa ovsenim pahuljicama ili voćem.",
  },
  {
    q: "Koji je najjeftiniji dobar whey protein za početnike u Srbiji?",
    a: "Gledaj Value Score na Proteinoteka.rs — rangiramo sve dostupne WPC proteine po gramu proteina za novac. Skitec 100% Whey, MyProtein Impact Whey i Biotech 100% Whey Protein su stalno pri vrhu liste po isplativosti.",
  },
];

const BASE = "https://proteinoteka.rs";
const SLUG = "/vodici/whey-protein-za-pocetnike";
const MONTHLY_PROTEIN_G = 900; // 30g/day × 30 days

export default async function Page() {
  const concentrates = await fetchTopProducts({
    category: "whey_concentrate",
    sortBy: "valueScore",
    limit: 5,
  });

  const concentratesWithPPG = concentrates.map((p) => ({
    ...p,
    ppg: pricePerGramProtein(p),
  }));

  const bestValue = [...concentratesWithPPG]
    .filter((p) => p.ppg !== null)
    .sort((a, b) => (a.ppg ?? Infinity) - (b.ppg ?? Infinity))[0] ?? concentratesWithPPG[0];

  const bestMonthlyCost = bestValue?.ppg
    ? Math.round(bestValue.ppg * MONTHLY_PROTEIN_G)
    : null;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Whey protein za početnike — šta, koliko i odakle?",
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
        { "@type": "ListItem", position: 3, name: "Whey protein za početnike", item: `${BASE}${SLUG}` },
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
            <span className="text-slate-600">Whey protein za početnike</span>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-4">
              Whey protein za početnike — šta, koliko i odakle?
            </h1>
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <span>7 min čitanja</span>
              <span>·</span>
              <span>Ažurirano: jun 2026.</span>
            </div>
          </div>

          {/* Quick answer */}
          <div className="mb-8 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-lg text-slate-700 leading-relaxed">
              <strong className="text-slate-900">Kratki odgovor:</strong> uzmi <strong className="text-slate-900">whey concentrate (WPC)</strong> — najjeftiniji tip whey proteina sa 70–80g proteina na 100g. Efikasan, dostupan u svim prodavnicama, i za 90% početnika je sve što treba. Nema razloga za skuplje opcije dok ne savladaš osnove treninga i ishrane.
            </p>
          </div>

          <GuideToc sections={tocSections} />

          {/* Section 1 */}
          <section className="mb-10">
            <h2 id="da-li-treba" className="text-xl font-bold text-slate-900 mb-4">Da li ti uopšte treba proteinski šejk?</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Protein u prahu nije lek niti čarobni suplement — to je hrana u drugačijem obliku. Ako svakodnevno jedeš 3–4 obroka sa kvalitetnim proteinima (jaja, piletina, riba, mlečni proizvodi), moguće je da šejk uopšte ne trebaš.
              </p>
              <p>
                Šejk ima smisla kad: nemaš vremena za normalan obrok posle treninga, kad ti je teško da dostigneš <strong className="text-slate-900">1.6g proteina po kilogramu telesne mase</strong> iz hrane, ili kad tražiš jeftin i brz izvor proteina između obroka. 30g whey proteina u vodi = oko 120 kcal i 24–26g proteina. Malo šta drugo nudi toliko proteina za tu cenu i brzinu.
              </p>
              <p>
                Ono što šejk ne može: zameniti trening, spavanje ni celovitu ishranu. Bez ta tri, protein je skupo piće.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section className="mb-10">
            <h2 id="koji-tip" className="text-xl font-bold text-slate-900 mb-4">Koji tip proteina uzeti kao početnik?</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700 mb-6">
              <p>
                Postoje tri tipa koja ćeš sresti u prodavnicama — evo razlike i jasne preporuke:
              </p>
            </div>

            <div className="space-y-3 mb-6">
              {[
                {
                  label: "Whey Concentrate (WPC)",
                  badge: "Preporučujemo za početnike",
                  badgeColor: "bg-green-50 text-green-700 border-green-200",
                  desc: "70–80g proteina na 100g. Sadrži malu količinu masti i laktoze. Najjeftinija opcija i sasvim dovoljna za sve koji nemaju intoleranciju na laktozu. Razlika u mišićnom rastu između WPC i skupljeg WPI statistički je zanemarljiva za rekreativce.",
                },
                {
                  label: "Whey Isolate (WPI)",
                  badge: "Za laktozu ili sušenje",
                  badgeColor: "bg-slate-50 text-slate-600 border-slate-200",
                  desc: "85–94g proteina na 100g, skoro bez laktoze i masti. Skuplje 20–40% od WPC. Ima smisla ako imaš intoleranciju na laktozu ili si u rigoroznoj fazi sušenja gde broji svaki gram masti.",
                },
                {
                  label: "Biljni protein",
                  badge: "Za vegane i vegetarijance",
                  badgeColor: "bg-slate-50 text-slate-600 border-slate-200",
                  desc: "Kombinacija graška i pirinča pokriva sve esencijalne aminokiseline. Nešto niži biološki skor od whey-a, ali odlična opcija za vegane, vegeterijanace i ljude osetljive na mlečne proteine.",
                },
              ].map(({ label, badge, badgeColor, desc }) => (
                <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="font-bold text-slate-900 text-[15px]">{label}</span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                      {badge}
                    </span>
                  </div>
                  <p className="text-[14px] text-slate-600 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>

            <h3 id="wpc-prednosti" className="text-lg font-bold text-slate-900 mb-3">Zašto WPC za početnike</h3>
            <div className="space-y-3 text-[15px] leading-relaxed text-slate-700 mb-4">
              <p>
                Studija Tanga i sar. (2009) poredila je WPC, WPI i sojinog izolata — sve tri forme su izazvale sličan rast mišićne mase uz isti trening protokol. Razlika između WPC i skupljeg WPI nije statistički značajna za rekreativce i početnike. Plati manje, troši duže, treniraj više.
              </p>
              <p>
                Jedini opravdan razlog za WPI od prvog dana je dijagnostikovana intolerancija na laktozu (ne samo "neprijatnost" — pravi pozitivan test).
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section className="mb-10">
            <h2 id="koliko-dnevno" className="text-xl font-bold text-slate-900 mb-4">Koliko proteina trebaš dnevno?</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Formula je prosta: pomnoži svoju telesnu masu sa <strong className="text-slate-900">1.6 do 2.2</strong>. Rezultat je ciljani dnevni unos u gramima. Za početnika koji je tek počeo da trenira, donja granica (1.6g/kg) je sasvim dovoljna.
              </p>
              <div className="bg-[#FFF8EC] border border-[#FF9900]/30 rounded-xl p-4">
                <p className="text-[14px] text-slate-700 leading-relaxed">
                  <strong className="text-slate-900">Primer za osobu od 75kg:</strong> cilj je 120–165g proteina dnevno. Iz hrane (3 obroka sa mesom ili jajima) realno dobijaš 90–120g. Jedan šejk od 30g popunjava ostatak.
                </p>
              </div>
              <p>
                Tačne vrednosti po težini i cilju (masa, mršavljenje, sedentaran životni stil) naći ćeš u{" "}
                <Link href="/vodici/koliko-proteina-dnevno" className="text-[#FF9900] hover:underline font-medium">
                  detaljnom vodiču sa tabelom →
                </Link>
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section className="mb-10">
            <h2 id="kada-uzimati" className="text-xl font-bold text-slate-900 mb-4">Kako i kada uzimati protein?</h2>
            <div className="space-y-3">
              {[
                {
                  time: "Posle treninga",
                  desc: "Klasičan i dobar trenutak — mišići su receptivni za aminokiseline. Ali mit o 30-minutnom anaboličkom prozoru je preuveličan: imaš 2–4 sata, ne 30 minuta.",
                },
                {
                  time: "Ujutru",
                  desc: "Posle noćnog posta, whey brzo 'budi' sintezu proteina. Dobra opcija za doručak uz ovsene pahuljice ili voće.",
                },
                {
                  time: "Kao međuobrok",
                  desc: "30g proteina u vodi = ~120 kcal i visoka sitost. Bolja opcija od keksa ili čipsa ako si gladan između obroka.",
                },
              ].map(({ time, desc }) => (
                <div key={time} className="flex gap-4 bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <span className="shrink-0 w-28 text-[13px] font-bold text-[#FF9900] mt-0.5">{time}</span>
                  <p className="text-[14px] text-slate-700 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
            <p className="text-[14px] text-slate-500 mt-4 leading-relaxed">
              <strong className="text-slate-700">Sa vodom ili mlekom?</strong> Sa vodom je brža apsorpcija i manje kalorija. Sa mlekom je ukusnije, ali dodaješ 150 kcal i usporavaš apsorpciju. Za post-workout — voda. Za doručak ili između obroka — mleko je sasvim ok.
            </p>

            <h3 id="tajming-mit" className="text-lg font-bold text-slate-900 mb-3 mt-6">Mit o 30-minutnom anaboličkom prozoru</h3>
            <div className="space-y-3 text-[15px] leading-relaxed text-slate-700">
              <p>
                Dugo se verovalo da protein mora biti popijen tačno 30 minuta posle treninga jer se inače "prozor zatvori". Meta-analiza Schoenfelda i Aragona (2013) pokazala je da je ovaj prozor zapravo <strong className="text-slate-800">nekoliko sati</strong>, ne 30 minuta. Ono što je važno: ukupan dnevni unos proteina, a ne minut posle treninga.
              </p>
              <p>
                Dakle, ako si jeo normalan obrok 2 sata pre treninga, post-workout šejk možeš popiti i sat vremena posle — nema razlike. Samo ne zaboravi da jedeš.
              </p>
            </div>
          </section>

          {/* Section 5 — live data */}
          <section className="mb-10">
            <h2 id="cena" className="text-xl font-bold text-slate-900 mb-4">Koliko košta mesec dana?</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700 mb-5">
              <p>
                Računamo sa 30g proteina dnevno × 30 dana = 900g proteina iz šejka mesečno. Evo top whey concentrate opcija trenutno dostupnih u Srbiji, sortirano po Value Score-u:
              </p>
            </div>

            {concentratesWithPPG.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-4">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Whey Concentrate — rang lista po Value Score
                  </span>
                  <span className="text-[11px] text-slate-400">cene ažurirane sedmično</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-left">
                        <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 min-w-[180px]">Proizvod</th>
                        <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 text-right whitespace-nowrap">Prot/100g</th>
                        <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 text-right whitespace-nowrap hidden sm:table-cell">RSD/g prot.</th>
                        <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 text-right whitespace-nowrap">Value Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {concentratesWithPPG.map((p, i) => (
                        <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3">
                            <Link
                              href={productUrl(p)}
                              className="font-medium text-slate-800 hover:text-[#FF9900] transition-colors leading-snug block"
                            >
                              {i === 0 && (
                                <span className="inline-block mr-1.5 px-1.5 py-0.5 bg-[#FF9900]/10 text-[#b36b00] text-[10px] font-bold rounded">
                                  #1
                                </span>
                              )}
                              {p.name}
                            </Link>
                            <span className="text-xs text-slate-400">{p.storeName} · {p.price}</span>
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-slate-700 whitespace-nowrap">
                            {p.proteinPer100g?.toFixed(0) ?? "—"}g
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-slate-700 whitespace-nowrap hidden sm:table-cell">
                            {p.ppg ? `${p.ppg.toFixed(1)}` : "—"}
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            {p.valueScore ? (
                              <span className="font-bold text-[#FF9900]">{p.valueScore.toFixed(1)}</span>
                            ) : "—"}
                            <span className="text-slate-400">/10</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {bestValue && bestValue.ppg && (
              <div className="bg-[#FFF8EC] border border-[#FF9900]/30 rounded-xl p-4">
                <p className="text-[14px] text-slate-700 leading-relaxed">
                  <strong className="text-slate-900">Najisplativija opcija trenutno:</strong>{" "}
                  {bestValue.name} po {bestValue.ppg.toFixed(1)} RSD/g proteina —
                  mesec dana suplementacije (900g proteina) košta oko{" "}
                  <strong className="text-slate-900">~{bestMonthlyCost?.toLocaleString("sr-RS")} RSD</strong>.
                </p>
              </div>
            )}
          </section>

          {/* Section 6 */}
          <section className="mb-10">
            <h2 id="izbegavati" className="text-xl font-bold text-slate-900 mb-4">Šta izbegavati kao početnik</h2>
            <div className="space-y-3">
              {[
                {
                  title: "Mass gaineri",
                  desc: "Sadrže 400–600 kcal po porciji (uglavnom šećeri i maltodekstrin). Namenjeni su naprednim vežbačima koji imaju problem da unesu dovoljno kalorija. Kao početnik, verovatno ti ne treba.",
                },
                {
                  title: "\"Weight loss\" i \"toning\" proteini",
                  desc: "Marketing koji nagovara na posebne proteine za žene ili mršavljenje. Isti protein, skuplja etiketa. Gledaj sastav, ne pakovanje.",
                },
                {
                  title: "Proteini sa puno šećera",
                  desc: "Neki flavorizovani proteini imaju 8–12g šećera po porciji. Čitaj deklaraciju — ciljaj ispod 3g šećera na 100g.",
                },
                {
                  title: "Kupovina samo po brendu",
                  desc: "Premium brend ne znači više proteina. Uvek gledaj %proteina na 100g i cenu po gramu proteina — to je jedino što je bitno.",
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
                Svi whey concentrate proteini
              </Link>
              <Link href="/najjeftiniji-whey-protein" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Najjeftiniji whey protein u Srbiji
              </Link>
              <Link href="/whey-protein-do-3000-dinara" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Whey proteini do 3.000 RSD
              </Link>
              <Link href="/vodici/koliko-proteina-dnevno" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Koliko proteina dnevno?
              </Link>
              <Link href="/vodici/whey-isolate-vs-concentrate" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Isolate vs Concentrate
              </Link>
            </div>
          </section>

          {/* CTA */}
          <div className="bg-[#1B2B4B] rounded-2xl p-6 text-white text-center mb-10">
            <p className="text-base leading-relaxed mb-4">
              Pronađi koji whey concentrate trenutno nudi najviše proteina za najmanji novac — sortirano po Value Score-u.
            </p>
            <Link
              href="/kategorija/whey-concentrate?sort=valueScore,desc"
              className="inline-block px-6 py-3 bg-[#FF9900] hover:bg-[#e68a00] text-[#131921] font-bold rounded-xl text-sm transition-colors"
            >
              Uporedi whey concentrate proteine →
            </Link>
          </div>

          {/* Citations */}
          <div className="mb-6 text-xs text-slate-400 leading-relaxed border-t border-slate-200 pt-4">
            <p className="font-semibold text-slate-500 mb-1">Izvori</p>
            <p>Tang et al., <em>J Appl Physiol</em> 2009 — poređenje WPC, WPI i sojinog izolata.</p>
            <p>Schoenfeld & Aragon, <em>J Int Soc Sports Nutr</em> 2013 — "anabolički prozor" meta-analiza.</p>
            <p>Morton et al., <em>Br J Sports Med</em> 2018 — gornja granica efikasnog unosa proteina.</p>
          </div>

          <GuideDisclaimer />

          <VodiciNav currentSlug="whey-protein-za-pocetnike" />
        </main>
      </div>
    </>
  );
}
