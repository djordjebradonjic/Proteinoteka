import { notFound } from "next/navigation";
import { CURRENT_MARKET, MARKET_CONFIG } from '@/lib/marketConfig';
import { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import VodiciNav from "@/components/VodiciNav";
import GuideToc, { TocSection } from "@/components/GuideToc";
import GuideDisclaimer from "@/components/GuideDisclaimer";
import { fetchTopProducts } from "@/lib/seo-data";
import { productUrl } from "@/lib/productUrl";
import { Product } from "@/types/product";

export const revalidate = 86400;

const TITLE = "Kazein protein — šta je i kada se pije | Proteinoteka";
const DESCRIPTION =
  "Sporo-varljivi mlečni protein koji hrani mišiće satima. Šta je micelarni kazein, kada ga piti, po čemu se razlikuje od whey-a i cena u Srbiji.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: {
    canonical: `https://${MARKET_CONFIG[CURRENT_MARKET].domain}/vodici/kazein-protein`,
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `https://${MARKET_CONFIG[CURRENT_MARKET].domain}/vodici/kazein-protein`,
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
  { id: "kratak-odgovor", title: "Kratak odgovor" },
  { id: "sta-je", title: "Šta je kazein" },
  { id: "micelarni", title: "Micelarni vs kalcijum kazeinat" },
  { id: "kada", title: "Kada ga piti" },
  { id: "vs-whey", title: "Kazein ili whey?" },
  { id: "cena", title: "Cena u Srbiji" },
  { id: "greske", title: "Najčešće zablude" },
  { id: "top-proizvodi", title: "Dostupno u Srbiji" },
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
    q: "Zašto se kazein pije baš pred spavanje?",
    a: "Kazein se u želucu zgruša i vari sporo — aminokiseline iz njega ulaze u krv postepeno tokom pet do sedam sati. Uzet pred spavanje, drži oporavak mišića 'nahranjenim' kroz celu noć, dok spavaš i ne jedeš. Whey bi se za to vreme već davno razgradio.",
  },
  {
    q: "Koja je razlika između micelarnog kazeina i kalcijum kazeinata?",
    a: "Micelarni kazein je nativni oblik — zadržava prirodnu strukturu koja usporava varenje, pa je najbolji izbor za pred spavanje. Kalcijum kazeinat je obrađenija forma koja se vari nešto brže i češće se koristi u proteinskim blendovima i za pečenje. Za noćni oporavak biraj micelarni.",
  },
  {
    q: "Da li je kazein bolji od whey proteina?",
    a: "Nije bolji, nego drugačiji. Whey je brz i idealan oko treninga; kazein je spor i idealan za duže periode bez hrane, poput noći. Mnogi ih koriste zajedno — whey posle treninga, kazein pred spavanje. Ako biraš samo jedan protein, whey je univerzalniji i jeftiniji izbor.",
  },
  {
    q: "Koliko kazeina treba popiti pred spavanje?",
    a: "Uobičajena porcija je 30–40g, što daje oko 25–35g proteina. To je dovoljno da pokrije noćne potrebe za oporavak. Bitno je da ti ukupan dnevni unos proteina bude 1,6–2,2g po kilogramu telesne mase — kazein je samo jedan od obroka u toj računici.",
  },
  {
    q: "Može li kazein da se koristi tokom dijete?",
    a: "Da, i tu je jedna od njegovih prednosti. Sporo varenje daje dugotrajan osećaj sitosti, pa lakše izdržiš kalorijski deficit bez gladi, a stalan dotok aminokiselina štiti mišićnu masu dok gubiš mast. Sam po sebi ne topi mast — za to je i dalje presudan kalorijski bilans.",
  },
  {
    q: "Da li kazein sadrži laktozu?",
    a: "Da, kazein je mlečni protein i sadrži nešto laktoze, mada micelarni kazein visoke čistoće ima je vrlo malo. Ako ne podnosiš laktozu, bolji izbor su whey izolat, belance u prahu ili biljni proteini.",
  },
];

const BASE = `https://${MARKET_CONFIG[CURRENT_MARKET].domain}`;
const SLUG = "/vodici/kazein-protein";

function buildJsonLd(products: Product[]) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Kazein protein — šta je, kada se pije i zašto pred spavanje",
      datePublished: "2026-08-30",
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
        { "@type": "ListItem", position: 3, name: "Kazein protein", item: `${BASE}${SLUG}` },
      ],
    },
    ...(products.length > 0
      ? [
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            itemListElement: products.map((p, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: `${BASE}${productUrl(p)}`,
              name: p.name,
            })),
          },
        ]
      : []),
  ];
}

export default async function Page() {
  if (CURRENT_MARKET !== 'rs') notFound();

  const topProducts = await fetchTopProducts({
    category: "casein",
    sortBy: "valueScore",
    limit: 3,
  });
  const topProductsWithPPG = topProducts.map((p) => ({ ...p, ppg: pricePerGramProtein(p) }));
  const jsonLd = buildJsonLd(topProducts);

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
            <span className="text-slate-600">Kazein protein</span>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-4">
              Kazein protein — šta je, kada se pije i zašto pred spavanje
            </h1>
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <span>6 min čitanja</span>
              <span>·</span>
              <span>Ažurirano: avgust 2026.</span>
            </div>
          </div>

          {/* Quick answer */}
          <div id="kratak-odgovor" className="mb-8 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-lg text-slate-700 leading-relaxed">
              <strong className="text-slate-900">Kratki odgovor:</strong> kazein je mlečni protein koji se vari sporo — pet do sedam sati — pa mišićima obezbeđuje stabilan dotok aminokiselina kroz duži period. Zato mu je prirodno mesto pred spavanje, kada telu predstoji dugo bez hrane. Nije zamena za whey, nego dopuna: whey oko treninga, kazein za noć. Porcija je 30–40g, a u Srbiji ga računaj otprilike po ceni izolata.
            </p>
          </div>

          <GuideToc sections={tocSections} />

          {/* What it is */}
          <section className="mb-10">
            <h2 id="sta-je" className="text-xl font-bold text-slate-900 mb-4">Šta je kazein</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Kravlje mleko ima dve glavne grupe proteina: whey (surutku) i kazein. Whey je onaj brzi deo koji se odvaja pri pravljenju sira; kazein je onih ~80% proteina koji ostaje. Ista sirovina, dva potpuno različita ponašanja u organizmu.
              </p>
              <p>
                Kazein je poseban po tome što se u kiseloj sredini želuca <strong className="text-slate-900">zgruša</strong> — pravi gel koji se sporo razgrađuje. Zbog toga aminokiseline iz njega ulaze u krv postepeno, umesto u jednom naglom talasu kao kod whey-a. Taj usporeni profil je cela poenta kazeina i jedini razlog zbog kog bi ga uopšte birao umesto jeftinijeg whey-a.
              </p>
            </div>
          </section>

          {/* Micellar vs caseinate */}
          <section className="mb-10">
            <h2 id="micelarni" className="text-xl font-bold text-slate-900 mb-4">Micelarni kazein vs kalcijum kazeinat</h2>
            <div className="space-y-3">
              {[
                {
                  title: "Micelarni kazein",
                  desc: "Nativni oblik koji zadržava prirodnu strukturu micela — najsporije se vari i najbolji je izbor za pred spavanje. Ovo je ono što tražiš ako ti je cilj noćni oporavak. Na deklaraciji piše 'micellar casein'.",
                },
                {
                  title: "Kalcijum kazeinat",
                  desc: "Obrađenija forma dobijena hemijskim tretmanom — vari se nešto brže i jeftinija je. Češće se sreće u proteinskim blendovima (mešavina whey + kazein) i kao sastojak za pečenje nego kao samostalan noćni protein.",
                },
              ].map(({ title, desc }) => (
                <div key={title} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <p className="font-semibold text-slate-900 text-[15px] mb-1">{title}</p>
                  <p className="text-[14px] text-slate-600 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* When */}
          <section className="mb-10">
            <h2 id="kada" className="text-xl font-bold text-slate-900 mb-4">Kada ga piti</h2>
            <div className="space-y-3 mb-4">
              {[
                {
                  time: "Pred spavanje",
                  desc: "Klasična i najsmislenija upotreba. 30–40g kazeina 30-ak minuta pre kreveta hrani mišiće tokom noći. Istraživanja pokazuju da noćni unos kazeina povećava sintezu mišićnih proteina preko noći.",
                },
                {
                  time: "Kao obrok koji zasiti",
                  desc: "Kad te čeka dug period bez hrane — dugo predavanje, put, naporan radni dan — kazein duže drži sitost od whey-a. Praktičan međuobrok kad ne stižeš da jedeš.",
                },
                {
                  time: "NE odmah posle treninga",
                  desc: "Posle treninga želiš brzu dozu aminokiselina, a kazein je za to prespor. Tu je whey pravi izbor. Kazein i trening jednostavno ne idu zajedno u tom trenutku.",
                },
              ].map(({ time, desc }) => (
                <div key={time} className="flex flex-col sm:flex-row gap-2 sm:gap-4 bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <span className="shrink-0 sm:w-40 text-[13px] font-bold text-[#FF9900] mt-0.5">{time}</span>
                  <p className="text-[14px] text-slate-700 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* vs whey */}
          <section className="mb-10">
            <h2 id="vs-whey" className="text-xl font-bold text-slate-900 mb-4">Kazein ili whey?</h2>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-left">
                      <th className="px-4 py-2.5 text-xs font-semibold text-slate-500"> </th>
                      <th className="px-4 py-2.5 text-xs font-semibold text-slate-500">Kazein</th>
                      <th className="px-4 py-2.5 text-xs font-semibold text-slate-500">Whey</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      { k: "Brzina varenja", c: "Sporo (5–7h)", w: "Brzo (1–2h)" },
                      { k: "Najbolje vreme", c: "Pred spavanje", w: "Oko treninga" },
                      { k: "Osećaj sitosti", c: "Dugotrajan", w: "Kratkotrajan" },
                      { k: "Cena po gramu proteina", c: "Viša", w: "Niža" },
                      { k: "Univerzalnost", c: "Specijalizovan", w: "Za sve prilike" },
                    ].map((row) => (
                      <tr key={row.k} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-800">{row.k}</td>
                        <td className="px-4 py-3 text-slate-700">{row.c}</td>
                        <td className="px-4 py-3 text-slate-700">{row.w}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="text-[14px] text-slate-500 leading-relaxed">
              Zaključak: ako biraš samo jedan protein, neka to bude{" "}
              <Link href="/vodici/whey-protein-za-pocetnike" className="text-[#FF9900] hover:underline font-medium">
                whey
              </Link>. Kazein dodaješ tek kad želiš da pokriješ i noćni oporavak, ili ti treba protein koji duže drži sitost.
            </p>
          </section>

          {/* Price */}
          <section className="mb-10">
            <h2 id="cena" className="text-xl font-bold text-slate-900 mb-4">Cena u Srbiji</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Kazein je u srpskim prodavnicama uža ponuda od whey-a i po pravilu skuplji po gramu proteina — otprilike u rangu izolata. Micelarni kazein premium brendova je na gornjem kraju, dok su kazeinati i domaći brendovi povoljniji.
              </p>
              <p>
                Kao i uvek, ne gledaj cenu pakovanja nego <strong className="text-slate-900">cenu po gramu proteina</strong> — to je jedini broj koji pošteno poredi različita pakovanja i brendove. Aktuelne opcije i cene iz svih prodavnica imaš na strani{" "}
                <Link href="/kazein-protein-srbija" className="text-[#FF9900] hover:underline font-medium">
                  kazein protein — cene u Srbiji →
                </Link>
              </p>
            </div>
          </section>

          {/* Myths */}
          <section className="mb-10">
            <h2 id="greske" className="text-xl font-bold text-slate-900 mb-4">Najčešće zablude</h2>
            <div className="space-y-3">
              {[
                {
                  title: "Mit: kazein je obavezan za mišiće",
                  desc: "Nije. Ukupan dnevni unos proteina je ono što gradi mišiće. Kazein je korisna nadogradnja za noćni oporavak, ali niko nije ostao bez rezultata jer ga nije pio.",
                },
                {
                  title: "Mit: propuštena porcija upropasti ceo dan",
                  desc: "Efekat noćnog kazeina je stvaran, ali skroman i drugog reda u odnosu na ukupan unos i trening. Jedna preskočena porcija ne poništava ništa.",
                },
                {
                  title: "Mit: kazein i whey se ne smeju mešati",
                  desc: "Smeju, i to je čest sastav gotovih blend proteina. Mešavina daje i brzu i sporu komponentu u jednom šejku.",
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

          {/* Top products */}
          {topProductsWithPPG.length > 0 && (
            <section className="mb-10">
              <h2 id="top-proizvodi" className="text-xl font-bold text-slate-900 mb-4">Kazein protein — dostupno u Srbiji</h2>
              <p className="text-[15px] text-slate-700 leading-relaxed mb-5">
                Aktuelne opcije iz baze, poređane po Value Score-u. Cene se osvežavaju sedmično:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {topProductsWithPPG.map((p, i) => (
                  <Link
                    key={p.id}
                    href={productUrl(p)}
                    className="block bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-[#FF9900] hover:shadow-md transition-all"
                  >
                    <span className="inline-block mb-2 px-1.5 py-0.5 bg-[#FF9900]/10 text-[#b36b00] text-[10px] font-bold rounded">
                      #{i + 1}
                    </span>
                    <p className="font-semibold text-slate-900 text-[14px] leading-snug mb-1">{p.name}</p>
                    <p className="text-xs text-slate-400 mb-2">{p.storeName} · {p.price}</p>
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="text-slate-600">{p.ppg ? `${p.ppg.toFixed(1)} RSD/g prot.` : "—"}</span>
                      <span className="font-bold text-[#FF9900]">
                        {p.valueScore ? p.valueScore.toFixed(1) : "—"}<span className="text-slate-400 font-normal">/10</span>
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

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
              <Link href="/kazein-protein-srbija" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Kazein — cene u Srbiji
              </Link>
              <Link href="/vodici/kada-piti-protein" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Kada piti protein?
              </Link>
              <Link href="/vodici/whey-protein-za-pocetnike" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Whey za početnike
              </Link>
              <Link href="/vodici/koliko-proteina-dnevno" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Koliko proteina dnevno?
              </Link>
            </div>
          </section>

          {/* CTA */}
          <div className="bg-[#1B2B4B] rounded-2xl p-6 text-white text-center mb-10">
            <p className="text-base leading-relaxed mb-4">
              Pronađi kazein sa najboljim odnosom cene i kvaliteta — iz svih srpskih prodavnica na jednom mestu.
            </p>
            <Link
              href="/kazein-protein-srbija"
              className="inline-block px-6 py-3 bg-[#FF9900] hover:bg-[#e68a00] text-[#131921] font-bold rounded-xl text-sm transition-colors"
            >
              Uporedi kazein proteine →
            </Link>
          </div>

          {/* Citations */}
          <div className="mb-6 text-xs text-slate-400 leading-relaxed border-t border-slate-200 pt-4">
            <p className="font-semibold text-slate-500 mb-1">Izvori</p>
            <p>
              Res et al.,{" "}
              <a href="https://pubmed.ncbi.nlm.nih.gov/22330017/" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600">
                Med Sci Sports Exerc 2012
              </a>{" "}
              — unos kazeina pred spavanje i noćna sinteza mišićnih proteina.
            </p>
            <p>
              Boirie et al.,{" "}
              <a href="https://www.pnas.org/doi/10.1073/pnas.94.26.14930" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600">
                PNAS 1997
              </a>{" "}
              — „spori" i „brzi" proteini i njihov efekat na proteinski metabolizam.
            </p>
          </div>

          <GuideDisclaimer />

          <VodiciNav currentSlug="kazein-protein" />
        </main>
      </div>
    </>
  );
}
