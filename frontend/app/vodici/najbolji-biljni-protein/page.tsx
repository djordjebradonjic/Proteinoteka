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

const TITLE = "Najbolji biljni (veganski) protein — grašak, soja, pirinač i kako izabrati | Proteinoteka";
const DESCRIPTION =
  "Koji biljni protein je najbolji, da li mu fali aminokiselina i kako da izabereš kvalitetan veganski protein. Poređenje graška, soje i pirinča sa aktuelnim cenama iz Srbije.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: {
    canonical: `https://${MARKET_CONFIG[CURRENT_MARKET].domain}/vodici/najbolji-biljni-protein`,
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `https://${MARKET_CONFIG[CURRENT_MARKET].domain}/vodici/najbolji-biljni-protein`,
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
  { id: "vrste", title: "Vrste biljnog proteina" },
  { id: "aminokiseline", title: "Pitanje aminokiselina" },
  { id: "kako-izabrati", title: "Kako izabrati kvalitetan" },
  { id: "vs-whey", title: "Biljni ili whey?" },
  { id: "cena", title: "Cena u Srbiji" },
  { id: "top-proizvodi", title: "Najbolji izbori" },
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
    q: "Koji je najbolji biljni protein?",
    a: "Za većinu ljudi najbolji izbor je mešavina graška i pirinča. Grašku prirodno nedostaje metionin, a pirinču lizin — kombinovani, popunjavaju rupe jedan drugom i daju kompletan aminokiselinski profil blizak whey-u. Ako biraš jednu jedinu sirovinu, izolat graška ima najbolji odnos proteina, cene i svarljivosti.",
  },
  {
    q: "Da li je biljni protein slabiji od whey-a za rast mišića?",
    a: "Uz dovoljan ukupni dnevni unos, razlika je mala. Whey ima nešto viši sadržaj leucina i bolju svarljivost, pa gram za gram ima blagu prednost. Biljni protein to nadoknađuješ tako što uzmeš malo veću porciju ili biraš pametne mešavine (grašak + pirinač). Za rekreativce razlika u praksi je zanemarljiva.",
  },
  {
    q: "Da li biljnom proteinu fali neka aminokiselina?",
    a: "Pojedinačnim izvorima da — grašku fali metionin, žitaricama i pirinču lizin, soji je profil skoro kompletan. Zato su najbolji proizvodi mešavine više biljnih izvora, koje zajedno pokrivaju sve esencijalne aminokiseline. Na deklaraciji traži kombinaciju (npr. grašak + pirinač) umesto jednog jedinog izvora.",
  },
  {
    q: "Da li je soja protein bezbedan za muškarce?",
    a: "Da. Strah od 'feminizacije' zbog fitoestrogena u soji nije potvrđen u istraživanjima na uobičajenim količinama iz suplemenata. Soja je jedan od retkih biljnih izvora sa gotovo kompletnim aminokiselinskim profilom i sasvim je legitiman izbor za oba pola.",
  },
  {
    q: "Zašto je biljni protein često zrnastiji od whey-a?",
    a: "Biljne sirovine imaju grublju teksturu i izraženiji ukus, pa su šejkovi gušći i zemljanijeg ukusa. Rešava se mešanjem sa biljnim mlekom, voćem ili kakaom, i biranjem izolata umesto koncentrata. Kvalitetni brendovi su danas znatno bliži whey-u po ukusu nego pre par godina.",
  },
  {
    q: "Koliko košta biljni protein u Srbiji?",
    a: "Biljni proteini su u proseku uporedivi sa whey concentrate-om, s tim da premium mešavine i izolati graška idu naviše. Kao i kod svakog proteina, najpošteniji način poređenja je cena po gramu proteina, a ne cena pakovanja.",
  },
];

const BASE = `https://${MARKET_CONFIG[CURRENT_MARKET].domain}`;
const SLUG = "/vodici/najbolji-biljni-protein";

function buildJsonLd(products: Product[]) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Najbolji biljni (veganski) protein — grašak, soja, pirinač i kako izabrati",
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
        { "@type": "ListItem", position: 3, name: "Najbolji biljni protein", item: `${BASE}${SLUG}` },
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
    category: "vegan",
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
            <span className="text-slate-600">Najbolji biljni protein</span>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-4">
              Najbolji biljni (veganski) protein — kako izabrati
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
              <strong className="text-slate-900">Kratki odgovor:</strong> najbolji biljni protein za većinu ljudi je <strong className="text-slate-900">mešavina graška i pirinča</strong> — zajedno daju kompletan aminokiselinski profil koji nijedan od njih pojedinačno nema. Ako tražiš jednu sirovinu, izolat graška je najsigurniji izbor. Uz dovoljan dnevni unos proteina, biljni je gotovo ravnopravan whey-u za rast mišića; jedini realni ustupci su tekstura i to što ti treba malo veća porcija.
            </p>
          </div>

          <GuideToc sections={tocSections} />

          {/* Types */}
          <section className="mb-10">
            <h2 id="vrste" className="text-xl font-bold text-slate-900 mb-4">Vrste biljnog proteina</h2>
            <div className="space-y-3">
              {[
                {
                  title: "Protein graška",
                  desc: "Najpopularniji biljni izbor — visok sadržaj proteina, dobra svarljivost i bogat lizinom i BCAA. Fali mu metionin, zbog čega se najčešće kombinuje sa pirinčem. Neutralnijeg je ukusa od većine biljnih izvora.",
                },
                {
                  title: "Protein pirinča",
                  desc: "Blag ukus i lako varenje, bogat metioninom, ali mu fali lizin. Savršen partner grašku — otud tako česta kombinacija grašak + pirinač u kvalitetnim mešavinama.",
                },
                {
                  title: "Soja protein",
                  desc: "Jedan od retkih biljnih izvora sa gotovo kompletnim profilom aminokiselina, blizak whey-u. Jeftin i efikasan; jedina zamerka je izraženiji ukus i to što neki izbegavaju soju iz ličnih razloga.",
                },
                {
                  title: "Konoplja i ostali",
                  desc: "Protein konoplje nosi i vlakna i omega masti, ali ima niži sadržaj proteina po porciji. Zanimljiv kao dodatak, ali slabiji izbor ako ti je primarni cilj čist unos proteina.",
                },
              ].map(({ title, desc }) => (
                <div key={title} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <p className="font-semibold text-slate-900 text-[15px] mb-1">{title}</p>
                  <p className="text-[14px] text-slate-600 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Amino acids */}
          <section className="mb-10">
            <h2 id="aminokiseline" className="text-xl font-bold text-slate-900 mb-4">Pitanje aminokiselina</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Ovo je jedina prava razlika između biljnog i životinjskog proteina, i vredi je razumeti umesto da je se plašiš. Whey i druge životinjske izvore zovemo „kompletnim" jer sadrže svih devet esencijalnih aminokiselina u dobrom odnosu. Većina pojedinačnih biljnih izvora je „nekompletna" — nedostaje im jedna aminokiselina u dovoljnoj količini.
              </p>
              <p>
                Rešenje je jednostavno i staro koliko i ljudska ishrana: <strong className="text-slate-900">kombinovanje izvora</strong>. Grašku fali metionin, pirinču lizin — spoji ih i dobiješ kompletan profil. Zato najbolji biljni proteini nisu čista jedna sirovina, nego pametne mešavine. Kad na deklaraciji vidiš „grašak + pirinač", to nije marketing, nego upravo taj princip.
              </p>
              <p>
                Druga korisna činjenica: ako jedeš raznovrsno tokom dana (mahunarke, žitarice, povrće), rupe se popunjavaju same od sebe, čak i bez savršenog proteina u prahu.
              </p>
            </div>
          </section>

          {/* How to choose */}
          <section className="mb-10">
            <h2 id="kako-izabrati" className="text-xl font-bold text-slate-900 mb-4">Kako izabrati kvalitetan biljni protein</h2>
            <div className="space-y-3">
              {[
                { ok: true, title: "Mešavina izvora", desc: "Traži kombinaciju (grašak + pirinač je zlatni standard) umesto jedne sirovine — kompletniji profil bez razmišljanja." },
                { ok: true, title: "Visok sadržaj proteina po porciji", desc: "Cilj je 20g+ proteina po porciji. Izolati imaju viši sadržaj od koncentrata i manje ugljenih hidrata." },
                { ok: true, title: "Cena po gramu proteina", desc: "Jedini pošten način poređenja. Veće pakovanje gotovo uvek spušta cenu po gramu." },
                { ok: false, title: "Predugačka lista sastojaka", desc: "Gomila zaslađivača, zgušnjivača i 'super-hrana' u tragovima diže cenu, a ne dodaje ništa suštinski." },
                { ok: false, title: "Samo jedan izvor bez potrebe", desc: "Čist protein graška ili pirinča nije loš, ali za istu ili sličnu cenu mešavina daje bolji profil." },
              ].map(({ ok, title, desc }) => (
                <div key={title} className="flex gap-3 bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <span className={`font-bold text-lg shrink-0 mt-0.5 ${ok ? "text-green-500" : "text-red-400"}`}>
                    {ok ? "✓" : "✕"}
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900 text-[15px]">{title}</p>
                    <p className="text-[14px] text-slate-600 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* vs whey */}
          <section className="mb-10">
            <h2 id="vs-whey" className="text-xl font-bold text-slate-900 mb-4">Biljni ili whey?</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Ako nemaš razlog da izbegavaš mleko, whey je jednostavno praktičniji i obično jeftiniji po gramu proteina, sa boljim ukusom i teksturom. Biljni protein biraš kad je u pitanju veganstvo, izbegavanje mlečnih proizvoda, ili{" "}
                <Link href="/vodici/whey-isolate-vs-concentrate" className="text-[#FF9900] hover:underline font-medium">
                  netolerancija na laktozu
                </Link>{" "}
                koju ni izolat ne rešava dovoljno.
              </p>
              <p>
                Za rast mišića, uz dovoljan ukupni unos proteina, razlika je mala i lako se premosti nešto većom porcijom. Nauka je tu prilično jasna: presudan je dnevni unos, ne izvor.
              </p>
            </div>
          </section>

          {/* Price */}
          <section className="mb-10">
            <h2 id="cena" className="text-xl font-bold text-slate-900 mb-4">Cena u Srbiji</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Biljni proteini su u srpskim prodavnicama u proseku uporedivi sa whey concentrate-om, dok premium mešavine i izolati graška idu naviše. Ponuda je uža nego kod whey-a, ali dovoljno raznovrsna da nađeš i budžetske i premium opcije.
              </p>
              <p>
                Aktuelne cene svih biljnih proteina iz svih prodavnica, sortirane po vrednosti, imaš na strani{" "}
                <Link href="/biljni-protein-srbija" className="text-[#FF9900] hover:underline font-medium">
                  biljni protein — cene u Srbiji →
                </Link>
              </p>
            </div>
          </section>

          {/* Top products */}
          {topProductsWithPPG.length > 0 && (
            <section className="mb-10">
              <h2 id="top-proizvodi" className="text-xl font-bold text-slate-900 mb-4">Najbolji biljni proteini — trenutno u Srbiji</h2>
              <p className="text-[15px] text-slate-700 leading-relaxed mb-5">
                Aktuelni izbori iz baze, poređani po Value Score-u. Cene se osvežavaju sedmično:
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
              <Link href="/biljni-protein-srbija" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Biljni protein — cene u Srbiji
              </Link>
              <Link href="/vodici/protein-bez-laktoze" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Protein bez laktoze
              </Link>
              <Link href="/vodici/koliko-proteina-dnevno" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Koliko proteina dnevno?
              </Link>
              <Link href="/vodici/protein-za-mrsavljenje" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Protein za mršavljenje
              </Link>
            </div>
          </section>

          {/* CTA */}
          <div className="bg-[#1B2B4B] rounded-2xl p-6 text-white text-center mb-10">
            <p className="text-base leading-relaxed mb-4">
              Uporedi sve biljne proteine u Srbiji — sortirano po vrednosti za novac.
            </p>
            <Link
              href="/biljni-protein-srbija"
              className="inline-block px-6 py-3 bg-[#FF9900] hover:bg-[#e68a00] text-[#131921] font-bold rounded-xl text-sm transition-colors"
            >
              Uporedi biljne proteine →
            </Link>
          </div>

          {/* Citations */}
          <div className="mb-6 text-xs text-slate-400 leading-relaxed border-t border-slate-200 pt-4">
            <p className="font-semibold text-slate-500 mb-1">Izvori</p>
            <p>
              Messina et al.,{" "}
              <a href="https://pubmed.ncbi.nlm.nih.gov/29722584/" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600">
                Int J Sport Nutr Exerc Metab 2018
              </a>{" "}
              — soja protein i mišićni odgovor u odnosu na životinjske izvore.
            </p>
            <p>
              Banaszek et al.,{" "}
              <a href="https://www.mdpi.com/2075-4663/7/1/12" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600">
                Sports 2019
              </a>{" "}
              — poređenje proteina graška i whey-a na snagu i sastav tela.
            </p>
          </div>

          <GuideDisclaimer />

          <VodiciNav currentSlug="najbolji-biljni-protein" />
        </main>
      </div>
    </>
  );
}
