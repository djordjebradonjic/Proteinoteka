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
  title: { absolute: "Whey protein za početnike: što, koliko i odakle? | Proteinoteka" },
  description:
    "Kao početnik, WPC (whey koncentrat) je sve što trebate — jeftin i učinkovit. Koliko uzimati, kada piti i koliko košta mjesec dana u Hrvatskoj — s aktualnim cijenama.",
  alternates: {
    canonical: `https://${MARKET_CONFIG[CURRENT_MARKET].domain}/hr-vodici/whey-protein-za-pocetnike-hrvatska`,
  },
  openGraph: {
    title: "Whey protein za početnike: što, koliko i odakle? | Proteinoteka",
    description:
      "Kao početnik, WPC (whey koncentrat) je sve što trebate — jeftin i učinkovit. Koliko uzimati, kada piti i koliko košta u Hrvatskoj.",
    url: `https://${MARKET_CONFIG[CURRENT_MARKET].domain}/hr-vodici/whey-protein-za-pocetnike-hrvatska`,
    siteName: "Proteinoteka",
    locale: MARKET_CONFIG[CURRENT_MARKET].ogLocale,
    type: "article",
    images: [{ url: `https://${MARKET_CONFIG[CURRENT_MARKET].domain}/opengraph-image`, width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", images: [`https://${MARKET_CONFIG[CURRENT_MARKET].domain}/opengraph-image`] },
};

function pricePerGramProtein(p: Product): number | null {
  if (!p.numericPrice || !p.primaryWeightGrams || !p.proteinPer100g) return null;
  const totalProteinG = p.primaryWeightGrams * (p.proteinPer100g / 100);
  if (totalProteinG <= 0) return null;
  return p.numericPrice / totalProteinG;
}

const tocSections: TocSection[] = [
  { id: "da-li-treba", title: "Trebate li uopće proteinski shake?" },
  { id: "koji-tip", title: "Koji tip proteina odabrati kao početnik?" },
  { id: "koliko-dnevno", title: "Koliko proteina trebate dnevno?" },
  { id: "kada-uzimati", title: "Kada uzimati protein?" },
  { id: "cijena", title: "Koliko košta mjesec dana u Hrvatskoj?" },
  { id: "izbjegavati", title: "Što izbjegavati kao početnik" },
  { id: "faq", title: "Često postavljana pitanja" },
];

const faqItems = [
  {
    q: "Treba li početniku uopće proteinski shake?",
    a: "Ne nužno — protein u prahu je hrana, ne lijek. Ako iz normalnih obroka (jaja, piletina, riba, mliječni proizvodi) dostignete 1.6g proteina po kilogramu tjelesne mase, shake vam ne treba. Koristan je kad nemate vremena za normalan obrok ili vam je teško dostići dnevnu normu iz hrane.",
  },
  {
    q: "Koji je najjeftiniji dobar whey protein za početnike u Hrvatskoj?",
    a: "Pogledajte Value Score na Proteinoteka.com.hr — rangiramo sve dostupne WPC proteine po gramu proteina za novac. GymBeam Whey Protein, MyProtein Impact Whey i Scitec 100% Whey stalno su pri vrhu liste po isplativosti.",
  },
  {
    q: "Mogu li uzimati protein na prazan želudac ujutro?",
    a: "Da — whey protein ujutro je odlična ideja. Nakon noćnog posta mišići su u blagom kataboličkom stanju, a whey se brzo apsorbira i pokreće sintezu mišićnih proteina. Možete ga kombinirati s ovsenim pahuljicama ili voćem.",
  },
  {
    q: "Koliko brzo ću vidjeti rezultate od proteinskog shakea?",
    a: "Protein ubrzava oporavak i podržava rast mišića, ali nije sam po sebi uzrok rezultata. Uz redovit trening i dovoljno sna, prvih primjetnih promjena možete očekivati za 4–8 tjedana. Bez treninga, shake nema poseban učinak.",
  },
];

const BASE = `https://${MARKET_CONFIG[CURRENT_MARKET].domain}`;
const SLUG = "/hr-vodici/whey-protein-za-pocetnike-hrvatska";
const MONTHLY_PROTEIN_G = 900;

export default async function Page() {
  const concentrates = await fetchTopProducts({ category: "whey_concentrate", sortBy: "valueScore", limit: 5 });

  const concentratesWithPPG = concentrates.map((p) => ({
    ...p,
    ppg: pricePerGramProtein(p),
  }));

  const bestValue = [...concentratesWithPPG]
    .filter((p) => p.ppg !== null)
    .sort((a, b) => (a.ppg ?? Infinity) - (b.ppg ?? Infinity))[0];

  const bestMonthlyCost = bestValue?.ppg
    ? (bestValue.ppg * MONTHLY_PROTEIN_G).toFixed(2)
    : null;

  const dateModified = new Date().toISOString().split("T")[0];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Whey protein za početnike — što, koliko i odakle?",
      datePublished: "2026-06-26",
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

          <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-8 flex-wrap">
            <Link href="/" className="hover:text-[#FF9900] transition-colors">Početna</Link>
            <span>/</span>
            <Link href="/hr-vodici" className="hover:text-[#FF9900] transition-colors">Vodiči</Link>
            <span>/</span>
            <span className="text-slate-600">Whey protein za početnike</span>
          </nav>

          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-4">
              Whey protein za početnike — što, koliko i odakle?
            </h1>
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <span>7 min čitanja</span>
              <span>·</span>
              <time dateTime={dateModified}>Ažurirano: lipanj 2026.</time>
            </div>
          </div>

          <div className="mb-8 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-lg text-slate-700 leading-relaxed">
              <strong className="text-slate-900">Kratki odgovor:</strong> uzmite{" "}
              <strong className="text-slate-900">whey koncentrat (WPC)</strong> — najjeftiniji tip whey proteina s
              70–80g proteina na 100g. Učinkovit, dostupan u svim trgovinama, i za 90% početnika je sve što treba.
              Nema razloga za skuplje opcije dok ne savladate osnove treninga i prehrane.
            </p>
          </div>

          <GuideToc sections={tocSections} />

          <section className="mb-10">
            <h2 id="da-li-treba" className="text-xl font-bold text-slate-900 mb-4">Trebate li uopće proteinski shake?</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Protein u prahu nije lijek ni čarobni suplement — to je hrana u drugačijem obliku. Ako svakodnevno
                jedete 3–4 obroka s kvalitetnim proteinima (jaja, piletina, riba, mliječni proizvodi), moguće je da
                shake uopće ne trebate.
              </p>
              <p>
                Shake ima smisla kad: nemate vremena za normalan obrok nakon treninga, kad vam je teško dostići{" "}
                <strong className="text-slate-900">1.6g proteina po kilogramu tjelesne mase</strong> iz hrane, ili
                kad tražite jeftin i brz izvor proteina između obroka. 30g whey proteina u vodi = oko 120 kcal i
                24–26g proteina.
              </p>
              <p>
                Ono što shake ne može: zamijeniti trening, spavanje ni cjelovitu prehranu. Bez ta tri, protein je
                skupo piće.
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 id="koji-tip" className="text-xl font-bold text-slate-900 mb-4">Koji tip proteina odabrati kao početnik?</h2>
            <div className="space-y-3 mb-6">
              {[
                {
                  label: "Whey Koncentrat (WPC)",
                  badge: "Preporučujemo za početnike",
                  badgeColor: "bg-green-50 text-green-700 border-green-200",
                  desc: "70–80g proteina na 100g. Sadrži malu količinu masti i laktoze. Najjeftinija opcija i sasvim dovoljna za sve koji nemaju intoleranciju na laktozu. Razlika u mišićnom rastu između WPC i skupljeg WPI statistički je zanemariva za rekreativce.",
                },
                {
                  label: "Whey Izolat (WPI)",
                  badge: "Za laktozu ili definiciju",
                  badgeColor: "bg-slate-50 text-slate-600 border-slate-200",
                  desc: "85–94g proteina na 100g, gotovo bez laktoze i masti. Skuplje 20–40% od WPC. Ima smisla ako imate intoleranciju na laktozu ili ste u rigoroznoj fazi definicije gdje računate svaki gram masti.",
                },
                {
                  label: "Biljni protein",
                  badge: "Za vegane i vegetarijance",
                  badgeColor: "bg-slate-50 text-slate-600 border-slate-200",
                  desc: "Kombinacija graška i riže pokriva sve esencijalne aminokiseline. Nešto niži biološki skor od whey-a, ali odlična opcija za vegane, vegetarijance i ljude osjetljive na mliječne proteine.",
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
          </section>

          <section className="mb-10">
            <h2 id="koliko-dnevno" className="text-xl font-bold text-slate-900 mb-4">Koliko proteina trebate dnevno?</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Formula je jednostavna: pomnožite svoju tjelesnu masu s{" "}
                <strong className="text-slate-900">1.6 do 2.2</strong>. Rezultat je ciljani dnevni unos u gramima.
                Za početnika koji je tek počeo trenirati, donja granica (1.6g/kg) je sasvim dovoljna.
              </p>
              <div className="bg-[#FFF8EC] border border-[#FF9900]/30 rounded-xl p-4">
                <p className="text-[14px] text-slate-700 leading-relaxed">
                  <strong className="text-slate-900">Primjer za osobu od 75kg:</strong> cilj je 120–165g proteina
                  dnevno. Iz hrane (3 obroka s mesom ili jajima) realno dobivate 90–120g. Jedan shake od 30g popunjava ostatak.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-10">
            <h2 id="kada-uzimati" className="text-xl font-bold text-slate-900 mb-4">Kada uzimati protein?</h2>
            <div className="space-y-3">
              {[
                {
                  time: "Nakon treninga",
                  desc: "Klasičan i dobar trenutak — mišići su receptivni za aminokiseline. Mit o 30-minutnom anaboličkom prozoru je preuveličan: imate 2–4 sata, ne 30 minuta.",
                },
                {
                  time: "Ujutro",
                  desc: "Nakon noćnog posta, whey brzo 'budi' sintezu proteina. Dobra opcija za doručak uz zobene pahuljice ili voće.",
                },
                {
                  time: "Kao međuobrok",
                  desc: "30g proteina u vodi = ~120 kcal i visoka sitost. Bolja opcija od keksa ili čipsa ako ste gladni između obroka.",
                },
              ].map(({ time, desc }) => (
                <div key={time} className="flex gap-4 bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <span className="shrink-0 w-28 text-[13px] font-bold text-[#FF9900] mt-0.5">{time}</span>
                  <p className="text-[14px] text-slate-700 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-10">
            <h2 id="cijena" className="text-xl font-bold text-slate-900 mb-4">Koliko košta mjesec dana u Hrvatskoj?</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700 mb-5">
              <p>
                Računamo s 30g proteina dnevno × 30 dana = 900g proteina iz shakea mjesečno. Evo top whey
                koncentrat opcija trenutno dostupnih u Hrvatskoj, sortirano po Value Score-u:
              </p>
            </div>

            {concentratesWithPPG.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-4">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Whey Koncentrat — rang lista po Value Score
                  </span>
                  <span className="text-[11px] text-slate-400">cijene ažurirane tjedno</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-left">
                        <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 min-w-[180px]">Proizvod</th>
                        <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 text-right whitespace-nowrap">Prot/100g</th>
                        <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 text-right whitespace-nowrap hidden sm:table-cell">EUR/100g prot.</th>
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
                            {p.ppg ? `${(p.ppg * 100).toFixed(2)}` : "—"}
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
                  {bestValue.name} po {(bestValue.ppg * 100).toFixed(2)} EUR/100g proteina —
                  mjesec dana suplementacije (900g proteina) košta oko{" "}
                  <strong className="text-slate-900">~{bestMonthlyCost} EUR</strong>.
                </p>
              </div>
            )}
          </section>

          <section className="mb-10">
            <h2 id="izbjegavati" className="text-xl font-bold text-slate-900 mb-4">Što izbjegavati kao početnik</h2>
            <div className="space-y-3">
              {[
                {
                  title: "Mass gaineri",
                  desc: "Sadrže 400–600 kcal po porciji (uglavnom šećeri i maltodekstrin). Namijenjeni su naprednim vježbačima koji imaju problem s unosom dovoljno kalorija. Kao početnik, vjerojatno vam ne treba.",
                },
                {
                  title: "\"Weight loss\" i \"toning\" proteini",
                  desc: "Marketing koji nagovara na posebne proteine za žene ili mršavljenje. Isti protein, skuplja etiketa. Gledajte sastav, ne pakiranje.",
                },
                {
                  title: "Proteini s puno šećera",
                  desc: "Neki aromatizirani proteini imaju 8–12g šećera po porciji. Čitajte deklaraciju — ciljajte ispod 3g šećera na 100g.",
                },
                {
                  title: "Kupnja samo prema brendu",
                  desc: "Premium brend ne znači više proteina. Uvijek gledajte % proteina na 100g i cijenu po gramu proteina — to je jedino što je bitno.",
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
              <Link href="/hr-vodici/koliko-kosta-protein-hrvatska" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Koliko košta protein u Hrvatskoj?
              </Link>
            </div>
          </section>

          <div className="bg-[#1B2B4B] rounded-2xl p-6 text-white text-center mb-10">
            <p className="text-base leading-relaxed mb-4">
              Pronađite koji whey koncentrat trenutno nudi najviše proteina za najmanji novac u Hrvatskoj.
            </p>
            <Link
              href="/?sort=valueScore%2Cdesc"
              className="inline-block px-6 py-3 bg-[#FF9900] hover:bg-[#e68a00] text-[#131921] font-bold rounded-xl text-sm transition-colors"
            >
              Usporedite whey koncentrat proteine →
            </Link>
          </div>

          <div className="mb-6 text-xs text-slate-400 leading-relaxed border-t border-slate-200 pt-4">
            <p className="font-semibold text-slate-500 mb-1">Izvori</p>
            <p>Tang et al., <em>J Appl Physiol</em> 2009 — usporedba WPC, WPI i sojinog izolata.</p>
            <p>Schoenfeld &amp; Aragon, <em>J Int Soc Sports Nutr</em> 2013 — meta-analiza &quot;anaboličkog prozora&quot;.</p>
            <p>Morton et al., <em>Br J Sports Med</em> 2018 — gornja granica učinkovitog unosa proteina.</p>
          </div>

          <GuideDisclaimer />
        </main>
      </div>
    </>
  );
}
