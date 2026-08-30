import { notFound } from "next/navigation";
import { CURRENT_MARKET, MARKET_CONFIG } from '@/lib/marketConfig';
import { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import VodiciNav from "@/components/VodiciNav";
import GuideToc, { TocSection } from "@/components/GuideToc";
import GuideDisclaimer from "@/components/GuideDisclaimer";
import { fetchTopValueProducts } from "@/lib/seo-data";
import { productUrl } from "@/lib/productUrl";
import { Product } from "@/types/product";

export const revalidate = 86400;

const TITLE = "Koji whey protein kupiti — kako da odlučiš za 5 minuta | Proteinoteka";
const DESCRIPTION =
  "Concentrate, izolat ili blend? Kako da izabereš whey protein prema cilju, budžetu i varenju — jednostavan okvir za odluku plus aktuelno najbolji izbori iz Srbije.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: {
    canonical: `https://${MARKET_CONFIG[CURRENT_MARKET].domain}/vodici/koji-whey-protein-kupiti`,
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `https://${MARKET_CONFIG[CURRENT_MARKET].domain}/vodici/koji-whey-protein-kupiti`,
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
  { id: "tri-pitanja", title: "Tri pitanja pre kupovine" },
  { id: "tip", title: "Koji tip whey-a" },
  { id: "kolicina", title: "Koliko i koje pakovanje" },
  { id: "cena-po-gramu", title: "Kako uporediti cene pošteno" },
  { id: "greske", title: "Greške pri kupovini" },
  { id: "top-proizvodi", title: "Trenutno najbolji izbori" },
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
    q: "Koji whey protein da kupim kao početnik?",
    a: "Whey concentrate (WPC). To je standardni, najisplativiji izbor koji pokriva potrebe 90% ljudi — dovoljno proteina po gramu, dobar ukus i najniža cena. Izolat ti treba tek ako te muči laktoza ili ciljaš maksimalnu čistoću. Ne komplikuj prvu kupovinu.",
  },
  {
    q: "Da li je skuplji whey protein automatski bolji?",
    a: "Ne. Viša cena često ide na brend, pakovanje i marketing, a ne na kvalitet proteina. Jedini pošten pokazatelj je cena po gramu proteina i sadržaj proteina na 100g. Mnogi srednje rangirani proteini nadmašuju skuplje po realnoj vrednosti za novac.",
  },
  {
    q: "Koje pakovanje da uzmem?",
    a: "Ako si siguran u ukus i brend, veće pakovanje (2kg+) gotovo uvek daje nižu cenu po gramu proteina. Ako prvi put probaš neki proizvod, uzmi manje pakovanje da ne rizikuješ da ostaneš sa 2,5kg ukusa koji ti ne prija.",
  },
  {
    q: "Koliko proteina po porciji treba da ima?",
    a: "Cilj je 20g+ proteina po porciji i visok udeo proteina na 100g praha. Kod concentrate-a to je obično 70–80g/100g, kod izolata 85–90g. Ako je udeo znatno niži, plaćaš vodu i punila umesto proteina.",
  },
  {
    q: "Gde je najjeftinije kupiti whey protein u Srbiji?",
    a: "Cene istog proizvoda umeju da se razlikuju i po nekoliko stotina dinara od prodavnice do prodavnice. Zato ne kupuj iz prve — uporedi cenu istog artikla u svim prodavnicama. Proteinoteka to radi umesto tebe i pokazuje ko trenutno ima najnižu cenu.",
  },
];

const BASE = `https://${MARKET_CONFIG[CURRENT_MARKET].domain}`;
const SLUG = "/vodici/koji-whey-protein-kupiti";

function buildJsonLd(products: Product[]) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Koji whey protein kupiti — kako da odlučiš za 5 minuta",
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
        { "@type": "ListItem", position: 3, name: "Koji whey protein kupiti", item: `${BASE}${SLUG}` },
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

  const topProducts = await fetchTopValueProducts(5);
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
            <span className="text-slate-600">Koji whey protein kupiti</span>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-4">
              Koji whey protein kupiti — kako da odlučiš za 5 minuta
            </h1>
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <span>5 min čitanja</span>
              <span>·</span>
              <span>Ažurirano: avgust 2026.</span>
            </div>
          </div>

          {/* Quick answer */}
          <div id="kratak-odgovor" className="mb-8 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-lg text-slate-700 leading-relaxed">
              <strong className="text-slate-900">Kratki odgovor:</strong> za većinu ljudi pravi izbor je <strong className="text-slate-900">whey concentrate</strong> sa 70–80g proteina na 100g, u pakovanju od 2kg ili više, po najnižoj ceni po gramu proteina. Izolat biraš samo ako te muči laktoza ili hoćeš maksimalnu čistoću. Sve ostalo — brend, ukus, ambalaža — je sekundarno. Ispod je okvir za odluku i lista trenutno najisplativijih proteina.
            </p>
          </div>

          <GuideToc sections={tocSections} />

          {/* Three questions */}
          <section className="mb-10">
            <h2 id="tri-pitanja" className="text-xl font-bold text-slate-900 mb-4">Tri pitanja pre kupovine</h2>
            <div className="space-y-3">
              {[
                { q: "1. Podnosiš li mleko?", a: "Ako da — concentrate je tvoj default. Ako te mlečni proizvodi nadimaju, idi na izolat ili bezmlečni izvor." },
                { q: "2. Koji ti je budžet?", a: "Concentrate je najisplativiji. Ako budžet dozvoljava i hoćeš čistiji protein, izolat. Ne plaćaj premium ako ti ne rešava konkretan problem." },
                { q: "3. Koliko ćeš ga trošiti?", a: "Ako piješ redovno, veće pakovanje spušta cenu po gramu. Ako tek probaš, uzmi manje da ne rizikuješ ukus koji ti ne odgovara." },
              ].map(({ q, a }) => (
                <div key={q} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <p className="font-semibold text-slate-900 text-[15px] mb-1">{q}</p>
                  <p className="text-[14px] text-slate-600 leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Which type */}
          <section className="mb-10">
            <h2 id="tip" className="text-xl font-bold text-slate-900 mb-4">Koji tip whey-a</h2>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-left">
                      <th className="px-4 py-2.5 text-xs font-semibold text-slate-500">Tip</th>
                      <th className="px-4 py-2.5 text-xs font-semibold text-slate-500">Za koga</th>
                      <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 text-right">Cena</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      { t: "Concentrate (WPC)", z: "Default za većinu, najbolja vrednost", c: "€" },
                      { t: "Izolat (WPI)", z: "Osetljivi na laktozu, čistiji protein", c: "€€" },
                      { t: "Hidrolizat", z: "Najbrža apsorpcija, premium niša", c: "€€€" },
                      { t: "Blend", z: "Mešavina brzog i sporog proteina", c: "€–€€" },
                    ].map((row) => (
                      <tr key={row.t} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-800">{row.t}</td>
                        <td className="px-4 py-3 text-slate-700">{row.z}</td>
                        <td className="px-4 py-3 text-right text-slate-700">{row.c}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="text-[14px] text-slate-500 leading-relaxed">
              Ceo pregled razlika imaš u vodiču{" "}
              <Link href="/vodici/whey-isolate-vs-concentrate" className="text-[#FF9900] hover:underline font-medium">
                izolat vs concentrate →
              </Link>{" "}
              a ako te baš muči laktoza, pogledaj{" "}
              <Link href="/vodici/protein-bez-laktoze" className="text-[#FF9900] hover:underline font-medium">
                protein bez laktoze →
              </Link>
            </p>
          </section>

          {/* Amount */}
          <section className="mb-10">
            <h2 id="kolicina" className="text-xl font-bold text-slate-900 mb-4">Koliko i koje pakovanje</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Pakovanje je najlakši način da uštediš, a da ništa ne izgubiš na kvalitetu. Ista formula u kesi od 2kg gotovo uvek ima nižu cenu po gramu proteina nego ona od 900g. Jedini razlog da uzmeš manje pakovanje je ako prvi put probaš neki ukus ili brend.
              </p>
              <p>
                Koliko ćeš ga trošiti zavisi od tvog dnevnog cilja — ako ti treba 150g proteina dnevno, a iz hrane realno pokriješ dve trećine, ostatak od jedne do dve porcije dnevno znači da ti pakovanje od 2kg traje otprilike mesec i po. Detaljna računica je u vodiču{" "}
                <Link href="/vodici/koliko-novca-mesecno-za-proteine" className="text-[#FF9900] hover:underline font-medium">
                  koliko novca mesečno za proteine →
                </Link>
              </p>
            </div>
          </section>

          {/* Price per gram */}
          <section className="mb-10">
            <h2 id="cena-po-gramu" className="text-xl font-bold text-slate-900 mb-4">Kako uporediti cene pošteno</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Cena na etiketi vara. Pakovanje od 3.000 dinara može biti skuplje od onog od 4.000 ako ima manje proteina po gramu. Zato postoji samo jedan pošten broj: <strong className="text-slate-900">cena po gramu proteina</strong>. Izračunaš ga tako što ceniš podeliš ukupnim gramima proteina u pakovanju (masa pakovanja × udeo proteina).
              </p>
              <p>
                Ovo je tačno ono što Value Score radi automatski — uzima u obzir cenu, sadržaj proteina i sastav, pa ti daje jedan uporediv broj. Kako se računa, objašnjeno je{" "}
                <Link href="/kako-racunamo-value-score" className="text-[#FF9900] hover:underline font-medium">
                  ovde →
                </Link>
              </p>
            </div>
          </section>

          {/* Mistakes */}
          <section className="mb-10">
            <h2 id="greske" className="text-xl font-bold text-slate-900 mb-4">Greške pri kupovini</h2>
            <div className="space-y-3">
              {[
                { title: "Kupovina iz prve prodavnice", desc: "Ista roba ume da se razlikuje i po nekoliko stotina dinara. Uporedi cenu istog artikla svuda pre nego što platiš." },
                { title: "Nasedanje na 'premium' etiketu", desc: "Skuplje ne znači bolje. Gledaj sadržaj proteina i cenu po gramu, ne dizajn kese." },
                { title: "Ignorisanje šećera i punila", desc: "Neki aromatizovani proteini kriju 8–12g šećera po porciji i nizak udeo proteina. Pročitaj deklaraciju." },
                { title: "Preveliko pakovanje nepoznatog ukusa", desc: "Ne kupuj 2,5kg ukusa koji nikad nisi probao — lako završi neotvoreno u ostavi." },
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
              <h2 id="top-proizvodi" className="text-xl font-bold text-slate-900 mb-4">Trenutno najbolji izbori</h2>
              <p className="text-[15px] text-slate-700 leading-relaxed mb-5">
                Proteini sa najboljim odnosom cene i kvaliteta u ovom trenutku, po Value Score-u. Za punu rang-listu pogledaj{" "}
                <Link href="/najbolji-whey-protein-srbija" className="text-[#FF9900] hover:underline font-medium">najbolji whey protein u Srbiji</Link>.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {topProductsWithPPG.slice(0, 3).map((p, i) => (
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
              <Link href="/najbolji-whey-protein-srbija" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Najbolji whey protein u Srbiji
              </Link>
              <Link href="/najjeftiniji-whey-protein" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Najjeftiniji whey protein
              </Link>
              <Link href="/vodici/whey-protein-za-pocetnike" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Whey za početnike
              </Link>
              <Link href="/vodici/whey-isolate-vs-concentrate" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Izolat vs Concentrate
              </Link>
            </div>
          </section>

          {/* CTA */}
          <div className="bg-[#1B2B4B] rounded-2xl p-6 text-white text-center mb-10">
            <p className="text-base leading-relaxed mb-4">
              Uporedi sve whey proteine iz srpskih prodavnica i vidi ko trenutno ima najbolju ponudu.
            </p>
            <Link
              href="/najbolji-whey-protein-srbija"
              className="inline-block px-6 py-3 bg-[#FF9900] hover:bg-[#e68a00] text-[#131921] font-bold rounded-xl text-sm transition-colors"
            >
              Pogledaj rang-listu →
            </Link>
          </div>

          <GuideDisclaimer />

          <VodiciNav currentSlug="koji-whey-protein-kupiti" />
        </main>
      </div>
    </>
  );
}
