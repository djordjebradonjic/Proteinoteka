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
  title: { absolute: "Koji protein za mršavljenje? + Cene u Srbiji | Proteinoteka" },
  description:
    "Whey izolat je optimalan — 85–94g proteina/100g, minimum masti i laktoze. Evo poređenja tipova i koliko košta mesec dana suplementacije u srpskim prodavnicama.",
  alternates: { canonical: "https://proteinoteka.rs/vodici/protein-za-mrsavljenje" },
  keywords: [
    "protein za mršavljenje srbija",
    "whey izolat za mršavljenje",
    "koji protein za mršavljenje",
    "protein za skidanje kilograma",
    "izolat proteina srbija cena",
  ],
  openGraph: {
    title: "Koji protein za mršavljenje? + Cene u Srbiji | Proteinoteka",
    description:
      "Whey izolat je optimalan — 85–94g proteina/100g, minimum masti i laktoze. Evo poređenja tipova i koliko košta mesec dana suplementacije u srpskim prodavnicama.",
    url: "https://proteinoteka.rs/vodici/protein-za-mrsavljenje",
    siteName: "Proteinoteka",
    locale: "sr_RS",
    type: "article",
    images: [{ url: "https://proteinoteka.rs/opengraph-image", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["https://proteinoteka.rs/opengraph-image"],
  },
};

const BASE = "https://proteinoteka.rs";
const SLUG = "/vodici/protein-za-mrsavljenje";

const tocSections: TocSection[] = [
  { id: "da-li-pomaze", title: "Da li protein zaista pomaže pri mršavljenju?" },
  { id: "termicki-efekat", title: "Termički efekat i sitost", level: 3 },
  { id: "koji-tip", title: "Koji tip proteina birati?" },
  { id: "izolat", title: "Whey izolat — optimalni izbor za deficit", level: 3 },
  { id: "concentrate-mrsavljenje", title: "Whey concentrate uz manji budžet", level: 3 },
  { id: "izbegavati", title: "Šta izbegavati pri mršavljenju" },
  { id: "koliko-proteina", title: "Koliko proteina unositi pri mršavljenju" },
  { id: "koliko-kosta", title: "Koliko košta mesec dana upotrebe" },
  { id: "kada-piti", title: "Kada piti protein pri mršavljenju" },
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
    q: "Da li ću se ugojiti od proteinskog šejka?",
    a: "Ne, ako ga uključiš u ukupni kalorijski unos. Šejk od 30g whey proteina ima oko 120–130 kalorija. Problem nastaje ako ga piješ pored normalnog kalorijskog unosa, umesto kao deo njega.",
  },
  {
    q: "Koji protein ima najmanje kalorija?",
    a: "Whey izolat generalno ima najmanje kalorija po gramu proteina jer je najčistiji — minimalno masti i ugljenih hidrata. Tražite izolate sa 85g+ proteina na 100g i ispod 2g masti.",
  },
  {
    q: "Da li žene treba da uzimaju isti protein kao muškarci?",
    a: "Da. Ne postoji biološki razlog da žene uzimaju 'ženski protein'. Marketing koji nagovara na posebne proizvode za žene uglavnom prodaje isti protein u ružičastoj ambalaži po višoj ceni. Gledajte sastav, ne pakovanje.",
  },
  {
    q: "Koliko dugo treba uzimati protein pri mršavljenju?",
    a: "Koliko traje faza mršavljenja. Protein nije lek koji se 'uzima kuru' — to je hrana. Možete ga koristiti neograničeno kao praktičan način da dostignete dnevni unos proteina.",
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
    .sort((a, b) => (a.ppg ?? Infinity) - (b.ppg ?? Infinity))[0] ?? isolatesWithPPG[0];

  const topVegan = veganProducts[0] ?? null;

  // Monthly cost: 30g/day * 30 days = 900g protein from supplement
  const MONTHLY_PROTEIN_G = 900;
  const bestMonthlyCost = bestIsolate?.ppg
    ? Math.round(bestIsolate.ppg * MONTHLY_PROTEIN_G)
    : null;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Protein za mršavljenje u Srbiji — koji tip pomaže i koliko košta",
      datePublished: "2026-05-28",
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

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-8 flex-wrap">
            <Link href="/" className="hover:text-[#FF9900] transition-colors">Početna</Link>
            <span>/</span>
            <Link href="/vodici" className="hover:text-[#FF9900] transition-colors">Vodiči</Link>
            <span>/</span>
            <span className="text-slate-600">Protein za mršavljenje</span>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-4">
              Protein za mršavljenje u Srbiji — koji tip stvarno pomaže i koliko košta
            </h1>
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <span>8 min čitanja</span>
              <span>·</span>
              <span>Ažurirano: jun 2026.</span>
            </div>
          </div>

          {/* Intro */}
          <p className="text-lg text-slate-700 leading-relaxed mb-8 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
            Protein ne sagoreva mast direktno. Ali pomaže ti da <strong className="text-slate-900">sačuvaš mišićnu masu</strong> dok si u kalorijskom deficitu, smanji glad, i olakša ti da uneseš dovoljno proteina bez viška kalorija. Ovaj vodič je baziran na stvarnim cenama iz srpskih prodavnica — ne na marketinškim tvrdnjama.
          </p>

          <GuideToc sections={tocSections} />

          {/* Section 1 */}
          <section className="mb-10">
            <h2 id="da-li-pomaze" className="text-xl font-bold text-slate-900 mb-4">Da li protein zaista pomaže pri mršavljenju?</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700 mb-6">
              <p>
                Da — ali ne na način koji se često reklamira. Protein nema "fat burning" efekat. Ono što ima je <strong className="text-slate-900">termički efekat ishrane</strong> — telo troši 20–30% kalorija iz proteina samo na njegovu preradu, što je znatno više nego za ugljene hidrate (5–10%) ili masti (0–3%).
              </p>
              <p>
                Važniji efekat je <strong className="text-slate-900">sitost</strong>. Proteini su najefikasniji makronutrijent za smanjenje gladi. Istraživanja pokazuju da povećanje unosa proteina na 25–30% ukupnih kalorija spontano smanjuje ukupan unos hrane za 400–500 kcal dnevno, bez svesnog ograničavanja.
              </p>
              <p>
                I na kraju — <strong className="text-slate-900">očuvanje mišića</strong>. Kada si u kalorijskom deficitu, telo može da razgrađuje i mišiće za energiju. Dovoljan unos proteina (1.8–2.2g/kg telesne mase) štiti mišiće dok gubiš masnoću.
              </p>
            </div>

            <h3 id="termicki-efekat" className="text-lg font-bold text-slate-900 mb-3">Termički efekat i sitost — brojevi iza tvrdnji</h3>
            <div className="space-y-3 text-[15px] leading-relaxed text-slate-700">
              <p>
                Westerterp-Plantenga i sar. (2012) u pregledu 87 studija utvrdili su da visoko-proteinska dijeta (<strong className="text-slate-800">25–30% kalorija iz proteina</strong>) povećava termogenezu za 75–100 kcal dnevno u poređenju sa standardnom ishranom. Za nekoga ko jede 2.000 kcal dnevno, to je razlika od ~4–5% ukupnih kalorija — bez ikakve promene u aktivnosti.
              </p>
              <p>
                Kombinacija termičkog efekta i hormona sitosti (GLP-1, PYY) objašnjava zašto visoko-proteinska dijeta smanjuje ad libitum unos hrane. Ukratko: jedeš protein, manje si gladan, prirodno unosiš manje kalorija.
              </p>
            </div>
          </section>

          {/* Section 2 — Koji tip */}
          <section className="mb-10">
            <h2 id="koji-tip" className="text-xl font-bold text-slate-900 mb-4">Koji tip proteina birati za mršavljenje?</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700 mb-6">
              <p>Nisu svi proteini jednaki kada je cilj mršavljenje. Evo jasnog rangiranja:</p>
            </div>

            {/* Isolate subsection */}
            <div className="mb-8">
              <h3 id="izolat" className="text-lg font-bold text-slate-900 mb-2">
                Whey izolat — optimalni izbor za deficit
              </h3>
              <div className="space-y-4 text-[15px] leading-relaxed text-slate-700 mb-5">
                <p>
                  Whey izolat prolazi kroz dodatnu filtraciju koja uklanja većinu masti i laktoze. Rezultat: 85–94g proteina na 100g praška, uz minimalne ugljene hidrate i masti. Za nekoga ko broji kalorije, ovo je važno.
                </p>
              </div>

              {/* Live product table */}
              {isolatesWithPPG.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-3">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                      Whey izolati — rang lista po value score
                    </span>
                    <span className="text-[11px] text-slate-400">cene ažurirane sedmično</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 text-left">
                          <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 min-w-[180px]">Proizvod</th>
                          <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 text-right whitespace-nowrap">Prot/100g</th>
                          <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 text-right whitespace-nowrap hidden sm:table-cell">Cena/g prot.</th>
                          <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 text-right whitespace-nowrap">Value Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {isolatesWithPPG.map((p, i) => (
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
                              {p.ppg ? `${p.ppg.toFixed(1)} RSD` : "—"}
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
                  {bestIsolate.name} trenutno nudi jednu od najboljih vrednosti u kategoriji — {bestIsolate.ppg.toFixed(1)} RSD po gramu proteina uz Value Score {bestIsolate.valueScore?.toFixed(1)}/10.
                </p>
              )}
            </div>

            {/* Concentrate subsection */}
            <div className="mb-8">
              <h3 id="concentrate-mrsavljenje" className="text-lg font-bold text-slate-900 mb-2">Whey concentrate — solidna opcija uz manji budžet</h3>
              <div className="space-y-3 text-[15px] leading-relaxed text-slate-700">
                <p>
                  Concentrate ima nešto više masti i laktoze od izolata, ali je generalno jeftiniji. Za mršavljenje nije idealan ali je daleko od lošeg — ako ti je kalorijski deficit velik i unos proteina na mestu, razlika u mastima po porciji neće srušiti tvoje rezultate.
                </p>
                <p>
                  Ako biraš concentrate za mršavljenje, biraj one sa višim procentom proteina (75g+ na 100g) i manjim udelom šećera.
                </p>
              </div>
            </div>

            {/* Vegan subsection */}
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Biljni protein — dobra opcija za određene profile</h3>
              <div className="space-y-3 text-[15px] leading-relaxed text-slate-700 mb-4">
                <p>
                  Biljni proteini (pea protein, rice protein, kombinacije) imaju nešto niži biološki skor od whey-a, ali su odlična opcija za osobe netolerante na laktozu, vegane i vegetarijance, i ljude koji žele raznovrsniju ishranu.
                </p>
              </div>
              {topVegan && (
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm text-[14px] text-slate-700">
                  <span className="font-semibold text-slate-900">{topVegan.name}</span>
                  {" "}trenutno ima Value Score{" "}
                  <span className="font-bold text-[#FF9900]">{topVegan.valueScore?.toFixed(1)}/10</span>
                  {" "}po ceni{" "}
                  <span className="font-semibold">{topVegan.price}</span>
                  {" "}— jedna od boljih vrednosti u kategoriji biljnih proteina na srpskom tržištu.
                </div>
              )}
            </div>
          </section>

          {/* Section 3 — Šta izbegavati */}
          <section className="mb-10">
            <h2 id="izbegavati" className="text-xl font-bold text-slate-900 mb-4">Šta izbegavati pri mršavljenju</h2>
            <div className="space-y-3">
              {[
                {
                  title: "Mass gaineri",
                  desc: "Namenjeni su povećanju mase i sadrže veliku količinu ugljenih hidrata (ponekad 50–70g po porciji). Suprotno od onoga što trebaš.",
                },
                {
                  title: "Proteinski barovi sa puno šećera",
                  desc: "Mnogi barovi imaju 20–25g šećera po komadu. Čitaj deklaraciju pre kupovine.",
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

          {/* Section 4 — Koliko proteina */}
          <section className="mb-10">
            <h2 id="koliko-proteina" className="text-xl font-bold text-slate-900 mb-4">Koliko proteina unositi pri mršavljenju</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Ne pita se "koliko šejkova", nego "koliko grama proteina ukupno dnevno". Za osobu koja skida kilograme uz trening: <strong className="text-slate-900">1.8–2.2g proteina po kilogramu telesne mase</strong> je optimalni raspon.
              </p>
              <div className="bg-[#FFF8EC] border border-[#FF9900]/30 rounded-xl p-4">
                <p className="text-[14px] text-slate-700 leading-relaxed">
                  <strong className="text-slate-900">Primer za osobu od 80kg:</strong> cilj je 144–176g proteina dnevno. Iz hrane možeš realno dobiti 100–130g (3 obroka sa mesom/jajima). Ostatak od 30–50g lako pokrivaš jednim do dva šejka.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5 — Koliko košta */}
          <section className="mb-10">
            <h2 id="koliko-kosta" className="text-xl font-bold text-slate-900 mb-4">Koliko košta mesec dana upotrebe</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700 mb-5">
              <p>
                Uzimamo 30g proteina dnevno kao standardnu porciju, 30 dana — ukupno 900g proteina iz praška mesečno.
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Opcija</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">Okvirna cena/g prot.</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">~Mesečno</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bestIsolate && bestIsolate.ppg && (
                    <tr className="bg-[#FFF8EC]">
                      <td className="px-4 py-3 font-medium text-slate-800">
                        Najisplativiji izolat{" "}
                        <span className="text-xs text-[#b36b00] font-normal">({bestIsolate.name.split(" ").slice(0, 3).join(" ")}...)</span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-700">{bestIsolate.ppg.toFixed(1)} RSD/g</td>
                      <td className="px-4 py-3 text-right font-bold text-[#FF9900]">~{bestMonthlyCost?.toLocaleString("sr-RS")} RSD</td>
                    </tr>
                  )}
                  <tr>
                    <td className="px-4 py-3 text-slate-700">Prosečan izolat</td>
                    <td className="px-4 py-3 text-right text-slate-700">5.5 RSD/g</td>
                    <td className="px-4 py-3 text-right text-slate-700">~4.950 RSD</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-slate-700">Premium brend</td>
                    <td className="px-4 py-3 text-right text-slate-700">8+ RSD/g</td>
                    <td className="px-4 py-3 text-right text-slate-700">~7.200 RSD</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-[13px] text-slate-500 mt-3 italic">
              Razlika između najisplativijeg i premium opcije je gotovo duplo. Oba sadrže protein — pitanje je da li plaćaš za suplementaciju ili za brend.
            </p>
          </section>

          {/* Section 6 — Kada piti */}
          <section className="mb-10">
            <h2 id="kada-piti" className="text-xl font-bold text-slate-900 mb-4">Kada piti protein pri mršavljenju</h2>
            <div className="space-y-3">
              {[
                {
                  time: "Ujutru",
                  desc: "Protein za doručak pomaže da počneš dan sa visokim unosom i smanjuje verovatnoću da ćeš posegnuti za brzim ugljenim hidratima do podne.",
                },
                {
                  time: "Pre ili posle treninga",
                  desc: "Klasičan timing. Posle treninga telo je receptivno za aminokiseline, ali istraživanja pokazuju da je ukupni dnevni unos važniji od preciznog timinga.",
                },
                {
                  time: "Kao zamena za grickalice",
                  desc: "Šejk od 30g proteina ima 120–140 kalorija i drži glad sat-dva. Keks ili čips sa istim kalorijama neće imati ni blizu isti efekat na sitost.",
                },
              ].map(({ time, desc }) => (
                <div key={time} className="flex gap-4 bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <span className="shrink-0 w-20 text-[13px] font-bold text-[#FF9900] mt-0.5">{time}</span>
                  <p className="text-[14px] text-slate-700 leading-relaxed">{desc}</p>
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

          {/* Zaključak */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Zaključak</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Za mršavljenje, whey izolat je optimalan izbor — visok procenat proteina, minimalno masti i ugljenih hidrata, lako se uklapa u kalorijski deficit.
                {bestIsolate && bestIsolate.ppg && (
                  <> Na srpskom tržištu trenutno postoje opcije od <strong className="text-slate-900">{bestIsolate.ppg.toFixed(1)} RSD/g proteina</strong>, što čini mesec dana suplementacije pristupačnim.</>
                )}
              </p>
              <p>
                Važnije od tipa proteina je ukupan dnevni unos. Ciljaj 1.8–2.2g/kg telesne mase, biraj opciju koja ti odgovara po ceni i ukusu, i drži se kalorijskog deficita.
              </p>
            </div>
          </section>

          {/* Internal links */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Korisni linkovi</h2>
            <div className="flex flex-wrap gap-3">
              <Link href="/whey-isolate-srbija" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Uporedi sve whey izolate →
              </Link>
              <Link href="/vodici/da-li-protein-goji" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Da li protein goji?
              </Link>
              <Link href="/vodici/koliko-proteina-dnevno" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Koliko proteina dnevno?
              </Link>
              <Link href="/kako-racunamo-value-score" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Kako računamo Value Score
              </Link>
            </div>
          </section>

          {/* CTA */}
          <div className="bg-[#1B2B4B] rounded-2xl p-6 text-white text-center mb-10">
            <p className="text-base leading-relaxed mb-4">
              Pronađi koji whey izolat trenutno nudi najviše proteina za najmanji novac.
            </p>
            <Link
              href="/whey-isolate-srbija"
              className="inline-block px-6 py-3 bg-[#FF9900] hover:bg-[#e68a00] text-[#131921] font-bold rounded-xl text-sm transition-colors"
            >
              Uporedi whey izolate →
            </Link>
          </div>

          {/* Citations */}
          <div className="mb-6 text-xs text-slate-400 leading-relaxed border-t border-slate-200 pt-4">
            <p className="font-semibold text-slate-500 mb-1">Izvori</p>
            <p>Westerterp-Plantenga et al., <em>Nutr Metab (Lond)</em> 2012 — termički efekat proteina i sitost.</p>
            <p>Paddon-Jones et al., <em>Am J Clin Nutr</em> 2008 — očuvanje mišićne mase u kalorijskom deficitu.</p>
            <p>Halton & Hu, <em>J Am Coll Nutr</em> 2004 — sitost i spontano smanjenje kalorijskog unosa pri visokom unosu proteina.</p>
          </div>

          <GuideDisclaimer />

          <VodiciNav currentSlug="protein-za-mrsavljenje" />
        </main>
      </div>
    </>
  );
}
