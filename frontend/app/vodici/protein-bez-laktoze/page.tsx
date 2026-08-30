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

const TITLE = "Protein bez laktoze — šta izabrati | Proteinoteka";
const DESCRIPTION =
  "Whey izolat, belance ili biljni — koji protein je zaista bez laktoze i kako da izbegneš nadutost i gasove. Praktičan vodič sa cenama iz Srbije.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: {
    canonical: `https://${MARKET_CONFIG[CURRENT_MARKET].domain}/vodici/protein-bez-laktoze`,
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `https://${MARKET_CONFIG[CURRENT_MARKET].domain}/vodici/protein-bez-laktoze`,
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
  { id: "zasto", title: "Zašto whey pravi problem" },
  { id: "opcije", title: "Tri opcije bez laktoze" },
  { id: "izolat", title: "Whey izolat — prvi izbor" },
  { id: "simptomi", title: "Ako i dalje imaš tegobe" },
  { id: "top-proizvodi", title: "Najbolji izolati" },
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
    q: "Koji whey protein je bez laktoze?",
    a: "Whey izolat (WPI). Dodatnom filtracijom iz njega je uklonjena gotovo sva laktoza, pa ga većina ljudi sa blagom do umerenom netolerancijom podnosi bez tegoba. Whey concentrate, nasuprot tome, zadržava značajnu količinu laktoze i najčešći je krivac za nadutost.",
  },
  {
    q: "Da li je whey izolat 100% bez laktoze?",
    a: "Nije baš 100%, ali je vrlo blizu — obično ispod 1g laktoze po porciji, što je dovoljno malo da ga i osetljivi ljudi podnose. Ako imaš tešku netoleranciju ili alergiju na mleko, sigurnije rešenje je belance u prahu ili biljni protein, koji laktozu uopšte ne sadrže.",
  },
  {
    q: "Šta ako ni izolat ne podnosim?",
    a: "Onda problem verovatno nije samo laktoza, nego proteini kravljeg mleka u celini (alergija) ili nešto drugo. Tada pređi na potpuno bezmlečne izvore: belance u prahu (životinjski protein bez mleka) ili biljne proteine (grašak, pirinač, soja). Nijedan od njih nema ni laktoze ni mlečnih proteina.",
  },
  {
    q: "Zašto me protein nadima?",
    a: "Najčešći razlog je laktoza u whey concentrate-u koju tvoje telo ne razgrađuje dobro, pa je fermentišu bakterije u crevima i stvaraju gasove. Prelazak na izolat rešava problem u većini slučajeva. Drugi mogući uzroci su prevelika porcija odjednom i pojedini zaslađivači (npr. šećerni alkoholi) u aromatizovanim proteinima.",
  },
  {
    q: "Da li je protein bez laktoze skuplji?",
    a: "Whey izolat je skuplji po gramu proteina od koncentrata, jer prolazi dodatnu filtraciju. Belance i biljni proteini su otprilike u rangu izolata. Za osetljiv stomak ta razlika u ceni obično se isplati kroz izostanak tegoba.",
  },
];

const BASE = `https://${MARKET_CONFIG[CURRENT_MARKET].domain}`;
const SLUG = "/vodici/protein-bez-laktoze";

function buildJsonLd(products: Product[]) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Protein bez laktoze — najbolji izbor za osetljiv stomak",
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
        { "@type": "ListItem", position: 3, name: "Protein bez laktoze", item: `${BASE}${SLUG}` },
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
    category: "whey_isolate",
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
            <span className="text-slate-600">Protein bez laktoze</span>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-4">
              Protein bez laktoze — šta izabrati za osetljiv stomak
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
              <strong className="text-slate-900">Kratki odgovor:</strong> ako te whey nadima, prvo pređi na <strong className="text-slate-900">whey izolat</strong> — iz njega je uklonjena gotovo sva laktoza i većina ljudi ga podnosi bez tegoba. Ako ni to ne pomogne, problem nije samo laktoza, pa idi na potpuno bezmlečne izvore: <strong className="text-slate-900">belance u prahu</strong> ili <strong className="text-slate-900">biljni protein</strong>. Whey concentrate je jedini koji sadrži dovoljno laktoze da pravi problem — njega izbegavaš.
            </p>
          </div>

          <GuideToc sections={tocSections} />

          {/* Why */}
          <section className="mb-10">
            <h2 id="zasto" className="text-xl font-bold text-slate-900 mb-4">Zašto whey pravi problem</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Laktoza je mlečni šećer. Da bi je telo svarilo, treba mu enzim laktaza — a kod velikog dela odraslih ljudi taj enzim se s godinama prirodno smanjuje. Kada nesvarena laktoza stigne do debelog creva, bakterije je fermentišu i nastaju gasovi, nadutost i grčevi. To je sve što se zapravo dešava iza reči „ne podnosim protein".
              </p>
              <p>
                Ključno je da <strong className="text-slate-900">nije problem u proteinu, nego u laktozi koja ga prati</strong>. Zato rešenje nije da prestaneš da piješ protein, nego da izabereš onaj u kome laktoze skoro da nema.
              </p>
            </div>
          </section>

          {/* Three options */}
          <section className="mb-10">
            <h2 id="opcije" className="text-xl font-bold text-slate-900 mb-4">Tri opcije bez laktoze</h2>
            <div className="space-y-3">
              {[
                {
                  title: "Whey izolat (WPI)",
                  desc: "Prvi izbor za većinu. Dodatna filtracija uklanja gotovo svu laktozu (obično ispod 1g po porciji), a zadržava sve prednosti whey-a — brzu apsorpciju, kremast ukus i najbolji odnos aminokiselina. Ako imaš blagu do umerenu netoleranciju, ovde staje priča.",
                },
                {
                  title: "Belance u prahu",
                  desc: "Životinjski protein visoke vrednosti koji uopšte nije mlečni proizvod, pa laktoze nema ni u tragovima. Odličan ako te ni izolat ne sluša ili ako izbegavaš mleko u celini. Neutralnog je ukusa i sjajan za pečenje.",
                },
                {
                  title: "Biljni protein",
                  desc: "Grašak, pirinač, soja — bez mleka i bez laktoze, uz bonus vlakana. Prvi izbor za vegane i za one sa alergijom na proteine kravljeg mleka, a ne samo netolerancijom na laktozu.",
                },
              ].map(({ title, desc }) => (
                <div key={title} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <p className="font-semibold text-slate-900 text-[15px] mb-1">{title}</p>
                  <p className="text-[14px] text-slate-600 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
            <p className="text-[14px] text-slate-500 leading-relaxed mt-4">
              Detaljnije o svakoj alternativi:{" "}
              <Link href="/vodici/belance-u-prahu" className="text-[#FF9900] hover:underline font-medium">belance u prahu</Link>,{" "}
              <Link href="/vodici/najbolji-biljni-protein" className="text-[#FF9900] hover:underline font-medium">biljni protein</Link>.
            </p>
          </section>

          {/* Isolate first choice */}
          <section className="mb-10">
            <h2 id="izolat" className="text-xl font-bold text-slate-900 mb-4">Zašto je izolat prvi izbor</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Za većinu ljudi sa netolerancijom, whey izolat je najlakši prelaz — dobiješ isti onaj protein koji poznaješ, samo bez laktoze koja ti smeta. Ne moraš da menjaš ukus, teksturu ni naviku, samo tip whey-a. Zato pre nego što skočiš na belance ili biljni, prvo probaj izolat.
              </p>
              <p>
                Ako želiš da razumeš tačnu razliku u filtraciji, sadržaju proteina i ceni, pročitaj vodič{" "}
                <Link href="/vodici/whey-isolate-vs-concentrate" className="text-[#FF9900] hover:underline font-medium">
                  whey izolat vs concentrate →
                </Link>
              </p>
            </div>
          </section>

          {/* If still symptoms */}
          <section className="mb-10">
            <h2 id="simptomi" className="text-xl font-bold text-slate-900 mb-4">Ako i dalje imaš tegobe</h2>
            <div className="space-y-3">
              {[
                { title: "Smanji porciju", desc: "Prevelika doza odjednom opterećuje varenje. Spusti na 20–25g i postepeno povećavaj tokom nedelju-dve." },
                { title: "Proveri zaslađivače", desc: "Šećerni alkoholi (sorbitol, maltitol) u nekim aromatizovanim proteinima izazivaju nadutost nezavisno od laktoze. Probaj neutralnu varijantu." },
                { title: "Pređi na bezmlečni izvor", desc: "Ako ni izolat ni manja porcija ne pomažu, verovatno reaguješ na mlečne proteine, ne samo laktozu — belance ili biljni su rešenje." },
                { title: "Posavetuj se sa lekarom", desc: "Uporne tegobe nisu nešto što treba trpeti niti nagađati. Ako simptomi ne prolaze promenom proteina, proveri kod lekara pravi uzrok." },
              ].map(({ title, desc }) => (
                <div key={title} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <p className="font-semibold text-slate-900 text-[15px] mb-1">{title}</p>
                  <p className="text-[14px] text-slate-600 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Top products */}
          {topProductsWithPPG.length > 0 && (
            <section className="mb-10">
              <h2 id="top-proizvodi" className="text-xl font-bold text-slate-900 mb-4">Whey izolati — najbolji izbori u Srbiji</h2>
              <p className="text-[15px] text-slate-700 leading-relaxed mb-5">
                Izolati sa gotovo nula laktoze, poređani po Value Score-u. Cene se osvežavaju sedmično:
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
              <Link href="/vodici/whey-isolate-vs-concentrate" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Izolat vs Concentrate
              </Link>
              <Link href="/vodici/belance-u-prahu" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Belance u prahu
              </Link>
              <Link href="/vodici/najbolji-biljni-protein" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Biljni protein
              </Link>
              <Link href="/whey-isolate-srbija" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Whey izolat — cene
              </Link>
            </div>
          </section>

          {/* CTA */}
          <div className="bg-[#1B2B4B] rounded-2xl p-6 text-white text-center mb-10">
            <p className="text-base leading-relaxed mb-4">
              Pronađi whey izolat sa najboljim odnosom cene i kvaliteta — bez laktoze, iz svih prodavnica.
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
            <p>
              Suchy et al.,{" "}
              <a href="https://pubmed.ncbi.nlm.nih.gov/20186234/" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600">
                NIH Consensus, Ann Intern Med 2010
              </a>{" "}
              — netolerancija na laktozu i praktične preporuke.
            </p>
          </div>

          <GuideDisclaimer />

          <VodiciNav currentSlug="protein-bez-laktoze" />
        </main>
      </div>
    </>
  );
}
