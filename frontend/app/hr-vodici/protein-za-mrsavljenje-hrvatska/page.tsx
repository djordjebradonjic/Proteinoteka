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
  title: { absolute: "Koji protein za mršavljenje? + Cijene u Hrvatskoj | Proteinoteka" },
  description:
    "Whey izolat je optimalan — 85–94g proteina/100g, minimum masti i laktoze. Usporedba tipova i koliko košta mjesec dana suplementacije u hrvatskim webshopovima.",
  alternates: { canonical: `https://${MARKET_CONFIG[CURRENT_MARKET].domain}/hr-vodici/protein-za-mrsavljenje-hrvatska` },
  openGraph: {
    title: "Koji protein za mršavljenje? + Cijene u Hrvatskoj | Proteinoteka",
    description:
      "Whey izolat je optimalan — 85–94g proteina/100g, minimum masti i laktoze. Cijene u EUR iz GymBeam HR, MyProtein HR i Polleo Sport.",
    url: `https://${MARKET_CONFIG[CURRENT_MARKET].domain}/hr-vodici/protein-za-mrsavljenje-hrvatska`,
    siteName: "Proteinoteka",
    locale: MARKET_CONFIG[CURRENT_MARKET].ogLocale,
    type: "article",
    images: [{ url: `https://${MARKET_CONFIG[CURRENT_MARKET].domain}/opengraph-image`, width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", images: [`https://${MARKET_CONFIG[CURRENT_MARKET].domain}/opengraph-image`] },
};

const BASE = `https://${MARKET_CONFIG[CURRENT_MARKET].domain}`;
const SLUG = "/hr-vodici/protein-za-mrsavljenje-hrvatska";
const MONTHLY_PROTEIN_G = 900;

const tocSections: TocSection[] = [
  { id: "da-li-pomaze", title: "Pomaže li protein zaista pri mršavljenju?" },
  { id: "termicki-ucinak", title: "Termički učinak i sitost", level: 3 },
  { id: "koji-tip", title: "Koji tip proteina odabrati?" },
  { id: "izolat", title: "Whey izolat — optimalni izbor za deficit", level: 3 },
  { id: "concentrate-mrsavljenje", title: "Whey koncentrat uz manji budžet", level: 3 },
  { id: "izbjegavati", title: "Što izbjegavati pri mršavljenju" },
  { id: "koliko-proteina", title: "Koliko proteina unositi pri mršavljenju" },
  { id: "koliko-kosta", title: "Koliko košta mjesec dana u Hrvatskoj" },
  { id: "kada-piti", title: "Kada piti protein pri mršavljenju" },
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
    q: "Hoću li se udebljati od proteinskog shakea?",
    a: "Ne, ako ga uključite u ukupni kalorijski unos. Shake od 30g whey proteina ima oko 120–130 kalorija. Problem nastaje ako ga pijete pored normalnog kalorijskog unosa, umjesto kao dio njega.",
  },
  {
    q: "Koji protein ima najmanje kalorija?",
    a: "Whey izolat generalno ima najmanje kalorija po gramu proteina jer je najčišći — minimalno masti i ugljikohidrata. Tražite izolate s 85g+ proteina na 100g i ispod 2g masti.",
  },
  {
    q: "Trebaju li žene uzimati isti protein kao muškarci?",
    a: "Da. Ne postoji biološki razlog da žene uzimaju 'ženski protein'. Marketing koji nagovara na posebne proizvode za žene uglavnom prodaje isti protein u ružičastoj ambalaži po višoj cijeni. Gledajte sastav, ne pakiranje.",
  },
  {
    q: "Koliko dugo treba uzimati protein pri mršavljenju?",
    a: "Koliko traje faza mršavljenja. Protein nije lijek koji se 'uzima u kuri' — to je hrana. Možete ga koristiti neograničeno kao praktičan način da dostignete dnevni unos proteina.",
  },
];

export default async function Page() {
  const [isolates, veganProducts] = await Promise.all([
    fetchTopProducts({ category: "whey_isolate", sortBy: "valueScore", limit: 5 }),
    fetchTopProducts({ category: "vegan", sortBy: "valueScore", limit: 1 }),
  ]);

  const isolatesWithPPG = isolates.map((p) => ({
    ...p,
    ppg: pricePerGramProtein(p),
  }));

  const bestIsolate = [...isolatesWithPPG]
    .filter((p) => p.ppg !== null)
    .sort((a, b) => (a.ppg ?? Infinity) - (b.ppg ?? Infinity))[0];

  const topVegan = veganProducts[0] ?? null;

  const bestMonthlyCost = bestIsolate?.ppg
    ? (bestIsolate.ppg * MONTHLY_PROTEIN_G).toFixed(2)
    : null;

  const dateModified = new Date().toISOString().split("T")[0];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Protein za mršavljenje u Hrvatskoj — koji tip pomaže i koliko košta",
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
        { "@type": "ListItem", position: 3, name: "Protein za mršavljenje", item: `${BASE}${SLUG}` },
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
            <span className="text-slate-600">Protein za mršavljenje</span>
          </nav>

          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-4">
              Protein za mršavljenje u Hrvatskoj — koji tip stvarno pomaže i koliko košta
            </h1>
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <span>8 min čitanja</span>
              <span>·</span>
              <time dateTime={dateModified}>Ažurirano: lipanj 2026.</time>
            </div>
          </div>

          <p className="text-lg text-slate-700 leading-relaxed mb-8 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
            Protein ne sagorjeva mast izravno. Ali pomaže vam da{" "}
            <strong className="text-slate-900">sačuvate mišićnu masu</strong> dok ste u kalorijskom deficitu,
            smanjite glad i lakše unesete dovoljno proteina bez viška kalorija. Ovaj vodič temelji se na
            aktualnim cijenama iz hrvatskih webshopova — ne na marketinškim tvrdnjama.
          </p>

          <GuideToc sections={tocSections} />

          <section className="mb-10">
            <h2 id="da-li-pomaze" className="text-xl font-bold text-slate-900 mb-4">Pomaže li protein zaista pri mršavljenju?</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700 mb-6">
              <p>
                Da — ali ne na način koji se često reklamira. Protein nema "fat burning" učinak. Ono što ima
                je <strong className="text-slate-900">termički učinak prehrane</strong> — tijelo troši 20–30%
                kalorija iz proteina samo na njegovu preradu, što je znatno više nego za ugljikohidrate (5–10%)
                ili masti (0–3%).
              </p>
              <p>
                Važniji učinak je <strong className="text-slate-900">sitost</strong>. Proteini su najučinkovitiji
                makronutrijent za smanjenje gladi. Istraživanja pokazuju da povećanje unosa proteina na 25–30%
                ukupnih kalorija spontano smanjuje ukupan unos hrane za 400–500 kcal dnevno, bez svjesnog
                ograničavanja.
              </p>
              <p>
                I na kraju —{" "}
                <strong className="text-slate-900">očuvanje mišića</strong>. Kada ste u kalorijskom deficitu,
                tijelo može razgrađivati i mišiće za energiju. Dovoljan unos proteina (1.8–2.2g/kg tjelesne
                mase) štiti mišiće dok gubite masnoću.
              </p>
            </div>

            <h3 id="termicki-ucinak" className="text-lg font-bold text-slate-900 mb-3">Termički učinak i sitost — brojevi iza tvrdnji</h3>
            <div className="space-y-3 text-[15px] leading-relaxed text-slate-700">
              <p>
                Westerterp-Plantenga i sur. (2012) u pregledu 87 studija utvrdili su da visoko-proteinska
                dijeta (<strong className="text-slate-800">25–30% kalorija iz proteina</strong>) povećava
                termogenezu za 75–100 kcal dnevno u usporedbi sa standardnom prehranom. Kombinacija termičkog
                učinka i hormona sitosti (GLP-1, PYY) objašnjava zašto visoko-proteinska dijeta smanjuje unos
                hrane: jedete protein, manje ste gladni, prirodno unosite manje kalorija.
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 id="koji-tip" className="text-xl font-bold text-slate-900 mb-4">Koji tip proteina odabrati za mršavljenje?</h2>
            <p className="text-[15px] leading-relaxed text-slate-700 mb-6">
              Nisu svi proteini jednaki kada je cilj mršavljenje. Evo jasnog rangiranja:
            </p>

            <div className="mb-8">
              <h3 id="izolat" className="text-lg font-bold text-slate-900 mb-2">Whey izolat — optimalni izbor za deficit</h3>
              <div className="space-y-4 text-[15px] leading-relaxed text-slate-700 mb-5">
                <p>
                  Whey izolat prolazi kroz dodatnu filtraciju koja uklanja većinu masti i laktoze. Rezultat:
                  85–94g proteina na 100g praška, uz minimalne ugljikohidrate i masti. Za nekoga tko broji
                  kalorije, ovo je važno.
                </p>
              </div>

              {isolatesWithPPG.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-3">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                      Whey izolati — rang lista po Value Score
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
                        {isolatesWithPPG.map((p, i) => (
                          <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3">
                              <Link href={productUrl(p)} className="font-medium text-slate-800 hover:text-[#FF9900] transition-colors leading-snug block">
                                {i === 0 && (
                                  <span className="inline-block mr-1.5 px-1.5 py-0.5 bg-[#FF9900]/10 text-[#b36b00] text-[10px] font-bold rounded">#1</span>
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
              {bestIsolate && bestIsolate.ppg && (
                <p className="text-[13px] text-slate-500 italic">
                  {bestIsolate.name} trenutno nudi jednu od najboljih vrijednosti u kategoriji —{" "}
                  {(bestIsolate.ppg * 100).toFixed(2)} EUR/100g proteina uz Value Score{" "}
                  {bestIsolate.valueScore?.toFixed(1)}/10.
                </p>
              )}
            </div>

            <div className="mb-8">
              <h3 id="concentrate-mrsavljenje" className="text-lg font-bold text-slate-900 mb-2">Whey koncentrat — solidna opcija uz manji budžet</h3>
              <div className="space-y-3 text-[15px] leading-relaxed text-slate-700">
                <p>
                  Koncentrat ima nešto više masti i laktoze od izolata, ali je generalno jeftiniji. Za
                  mršavljenje nije idealan, ali je daleko od lošeg — ako je kalorijski deficit velik i unos
                  proteina na mjestu, razlika u mastima po porciji neće srušiti vaše rezultate.
                </p>
                <p>
                  Ako birate koncentrat za mršavljenje, birajte one s višim postotkom proteina (75g+ na 100g)
                  i manjim udjelom šećera.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Biljni protein — dobra opcija za određene profile</h3>
              <div className="space-y-3 text-[15px] leading-relaxed text-slate-700 mb-4">
                <p>
                  Biljni proteini (protein graška, riže, kombinacije) imaju nešto niži biološki skor od whey-a,
                  ali su odlična opcija za osobe netolerante na laktozu, vegane i vegetarijance.
                </p>
              </div>
              {topVegan && (
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm text-[14px] text-slate-700">
                  <span className="font-semibold text-slate-900">{topVegan.name}</span>
                  {" "}trenutno ima Value Score{" "}
                  <span className="font-bold text-[#FF9900]">{topVegan.valueScore?.toFixed(1)}/10</span>
                  {" "}po cijeni{" "}
                  <span className="font-semibold">{topVegan.price}</span>
                  {" "}— jedna od boljih vrijednosti u kategoriji biljnih proteina na hrvatskom tržištu.
                </div>
              )}
            </div>
          </section>

          <section className="mb-10">
            <h2 id="izbjegavati" className="text-xl font-bold text-slate-900 mb-4">Što izbjegavati pri mršavljenju</h2>
            <div className="space-y-3">
              {[
                {
                  title: "Mass gaineri",
                  desc: "Namijenjeni su povećanju mase i sadrže veliku količinu ugljikohidrata (ponekad 50–70g po porciji). Suprotno od onoga što trebate.",
                },
                {
                  title: "Proteinske pločice s puno šećera",
                  desc: "Mnoge pločice imaju 20–25g šećera po komadu. Čitajte deklaraciju prije kupnje.",
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

          <section className="mb-10">
            <h2 id="koliko-proteina" className="text-xl font-bold text-slate-900 mb-4">Koliko proteina unositi pri mršavljenju</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Ne pita se "koliko shakeova", nego "koliko grama proteina ukupno dnevno". Za osobu koja
                smanjuje kilograme uz trening:{" "}
                <strong className="text-slate-900">1.8–2.2g proteina po kilogramu tjelesne mase</strong> je
                optimalni raspon.
              </p>
              <div className="bg-[#FFF8EC] border border-[#FF9900]/30 rounded-xl p-4">
                <p className="text-[14px] text-slate-700 leading-relaxed">
                  <strong className="text-slate-900">Primjer za osobu od 80kg:</strong> cilj je 144–176g
                  proteina dnevno. Iz hrane možete realno dobiti 100–130g (3 obroka s mesom/jajima). Ostatak
                  od 30–50g lako pokrivate jednim do dva shakea.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-10">
            <h2 id="koliko-kosta" className="text-xl font-bold text-slate-900 mb-4">Koliko košta mjesec dana u Hrvatskoj</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700 mb-5">
              <p>
                Uzimamo 30g proteina dnevno kao standardnu porciju, 30 dana — ukupno 900g proteina iz
                praška mjesečno.
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Opcija</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">Okvirna cijena/100g prot.</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">~Mjesečno</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bestIsolate && bestIsolate.ppg && (
                    <tr className="bg-[#FFF8EC]">
                      <td className="px-4 py-3 font-medium text-slate-800">
                        Najisplativiji izolat{" "}
                        <span className="text-xs text-[#b36b00] font-normal">
                          ({bestIsolate.name.split(" ").slice(0, 3).join(" ")}...)
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-700">{(bestIsolate.ppg * 100).toFixed(2)} EUR/100g</td>
                      <td className="px-4 py-3 text-right font-bold text-[#FF9900]">~{bestMonthlyCost} EUR</td>
                    </tr>
                  )}
                  <tr>
                    <td className="px-4 py-3 text-slate-700">Prosječan izolat</td>
                    <td className="px-4 py-3 text-right text-slate-700">6.0 EUR/100g</td>
                    <td className="px-4 py-3 text-right text-slate-700">~54 EUR</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-slate-700">Premium brend</td>
                    <td className="px-4 py-3 text-right text-slate-700">8.5+ EUR/100g</td>
                    <td className="px-4 py-3 text-right text-slate-700">~77 EUR</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-[13px] text-slate-500 mt-3 italic">
              Razlika između najisplativije i premium opcije može biti i 40%. Oba sadrže protein — pitanje je
              plaćate li suplementaciju ili brend.
            </p>
          </section>

          <section className="mb-10">
            <h2 id="kada-piti" className="text-xl font-bold text-slate-900 mb-4">Kada piti protein pri mršavljenju</h2>
            <div className="space-y-3">
              {[
                {
                  time: "Ujutro",
                  desc: "Protein za doručak pomaže da počnete dan s visokim unosom i smanjuje vjerojatnost posezanja za brzim ugljikohidratima do podneva.",
                },
                {
                  time: "Prije ili nakon treninga",
                  desc: "Klasičan timing. Nakon treninga tijelo je receptivno za aminokiseline, ali istraživanja pokazuju da je ukupni dnevni unos važniji od preciznog timinga.",
                },
                {
                  time: "Kao zamjena za grickalice",
                  desc: "Shake od 30g proteina ima 120–140 kalorija i drži glad sat-dva. Keks ili čips s istim kalorijama neće imati ni blizu isti učinak na sitost.",
                },
              ].map(({ time, desc }) => (
                <div key={time} className="flex gap-4 bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <span className="shrink-0 w-20 text-[13px] font-bold text-[#FF9900] mt-0.5">{time}</span>
                  <p className="text-[14px] text-slate-700 leading-relaxed">{desc}</p>
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
            <h2 className="text-xl font-bold text-slate-900 mb-4">Zaključak</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Za mršavljenje, whey izolat je optimalni izbor — visok postotak proteina, minimalno masti i
                ugljikohidrata, lako se uklapa u kalorijski deficit.
                {bestIsolate && bestIsolate.ppg && (
                  <> Na hrvatskom tržištu trenutno postoje opcije od{" "}
                    <strong className="text-slate-900">{(bestIsolate.ppg * 100).toFixed(2)} EUR/100g proteina</strong>, što
                    čini mjesec dana suplementacije pristupačnim.
                  </>
                )}
              </p>
              <p>
                Važnije od tipa proteina je ukupan dnevni unos. Ciljajte 1.8–2.2g/kg tjelesne mase, birajte
                opciju koja vam odgovara po cijeni i okusu, i držite se kalorijskog deficita.
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Korisni linkovi</h2>
            <div className="flex flex-wrap gap-3">
              <Link href="/?sort=valueScore%2Cdesc" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Top lista po Value Score
              </Link>
              <Link href="/hr-vodici/da-li-protein-goji-hrvatska" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Goji li protein?
              </Link>
              <Link href="/hr-vodici/koliko-proteina-dnevno-hrvatska" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Koliko proteina dnevno?
              </Link>
              <Link href="/hr-vodici/koliko-kosta-protein-hrvatska" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Koliko košta protein u HR?
              </Link>
            </div>
          </section>

          <div className="bg-[#1B2B4B] rounded-2xl p-6 text-white text-center mb-10">
            <p className="text-base leading-relaxed mb-4">
              Pronađite koji whey izolat trenutno nudi najviše proteina za najmanji novac u Hrvatskoj.
            </p>
            <Link
              href="/?sort=valueScore%2Cdesc"
              className="inline-block px-6 py-3 bg-[#FF9900] hover:bg-[#e68a00] text-[#131921] font-bold rounded-xl text-sm transition-colors"
            >
              Usporedi whey izolate →
            </Link>
          </div>

          <div className="mb-6 text-xs text-slate-400 leading-relaxed border-t border-slate-200 pt-4">
            <p className="font-semibold text-slate-500 mb-1">Izvori</p>
            <p>Westerterp-Plantenga et al., <em>Nutr Metab (Lond)</em> 2012 — termički učinak proteina i sitost.</p>
            <p>Paddon-Jones et al., <em>Am J Clin Nutr</em> 2008 — očuvanje mišićne mase u kalorijskom deficitu.</p>
            <p>Halton &amp; Hu, <em>J Am Coll Nutr</em> 2004 — sitost i spontano smanjenje kalorijskog unosa pri visokom unosu proteina.</p>
          </div>

          <GuideDisclaimer />
        </main>
      </div>
    </>
  );
}
