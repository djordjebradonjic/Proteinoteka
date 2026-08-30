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

const TITLE = "Belance u prahu — kalorije, cena i upotreba | Proteinoteka";
const DESCRIPTION =
  "Koliko kalorija ima belance, koliko proteina daje kašika praha i za koga ima smisla umesto whey-a. Nutritivna vrednost i aktuelne cene iz Srbije.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: {
    canonical: `https://${MARKET_CONFIG[CURRENT_MARKET].domain}/vodici/belance-u-prahu`,
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `https://${MARKET_CONFIG[CURRENT_MARKET].domain}/vodici/belance-u-prahu`,
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
  { id: "sta-je", title: "Šta je belance u prahu" },
  { id: "kalorije", title: "Kalorije i nutritivna vrednost" },
  { id: "vs-whey", title: "Belance ili whey?" },
  { id: "cena", title: "Cena u Srbiji" },
  { id: "kako-koristiti", title: "Kako ga koristiti" },
  { id: "kome", title: "Kome zaista ima smisla" },
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
    q: "Koliko kalorija ima belance?",
    a: "Jedno sveže belance srednje veličine (oko 33g) ima svega 16–17 kcal i oko 3,6g proteina — praktično bez masti i bez ugljenih hidrata. Belance u prahu je koncentrovanije: 100g praha nosi oko 370–380 kcal i 80g proteina, jer je iz njega izvučena sva voda. Jedna porcija praha od 30g (dovoljna za šejk) daje otprilike 110 kcal i 24g proteina.",
  },
  {
    q: "Koliko proteina ima belance u prahu?",
    a: "Kvalitetno belance u prahu (albumin) sadrži oko 80g proteina na 100g praha. To je proteinski profil na nivou whey izolata, sa jednom bitnom razlikom — potpuno je bez laktoze i bez ijednog mlečnog sastojka, jer dolazi iz jajeta, a ne iz mleka.",
  },
  {
    q: "Da li belance u prahu ima laktozu?",
    a: "Ne. Belance nije mlečni proizvod, pa u njemu nema ni traga laktoze. Zbog toga je jedan od retkih životinjskih izvora proteina koji mogu bez problema da koriste ljudi sa intolerancijom na laktozu ili alergijom na proteine kravljeg mleka — pod uslovom da nisu alergični na samo jaje.",
  },
  {
    q: "Da li se belance u prahu može koristiti za pečenje?",
    a: "Da, i to je jedna od njegovih glavnih prednosti. Rehidrirano belance u prahu se ponaša kao sveže — može da se umuti u čvrst sneg za palačinke, proteinske kolače, beze ili omlet. Odnos je otprilike jedna ravna kašika praha plus dve kašike vode za jedno belance. Praktično je jer nemaš višak žumanaca i prah traje mesecima na sobnoj temperaturi.",
  },
  {
    q: "Da li je belance zdravije od whey proteina?",
    a: "Nijedan nije 'zdraviji' po sebi — oba su kompletni proteini visoke biološke vrednosti. Belance ima smisla ako ne podnosiš laktozu, izbegavaš mlečne proizvode ili ti prija njegov neutralniji ukus u kuvanju. Whey je jeftiniji po gramu proteina i brže se apsorbuje posle treninga. Izbor zavisi od varenja i budžeta, ne od nekog mitskog 'zdravlja'.",
  },
  {
    q: "Može li belance u prahu da se pije sirovo, samo sa vodom?",
    a: "Belance u prahu je pasterizovano tokom proizvodnje, pa je bezbedno za direktno mešanje sa vodom ili mlekom bez kuvanja — za razliku od sirovog belanceta iz jajeta, koje nosi rizik od salmonele. Ukus je neutralan do blago slan, pa ga mnogi mešaju sa aromatizovanim izvorom ili dodaju u smoothie.",
  },
];

const BASE = `https://${MARKET_CONFIG[CURRENT_MARKET].domain}`;
const SLUG = "/vodici/belance-u-prahu";

function buildJsonLd(products: Product[]) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Belance u prahu — kalorije, cena i kako ga koristiti",
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
        { "@type": "ListItem", position: 3, name: "Belance u prahu", item: `${BASE}${SLUG}` },
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
    category: "egg",
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
            <span className="text-slate-600">Belance u prahu</span>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-4">
              Belance u prahu — kalorije, cena i kako ga koristiti
            </h1>
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <span>7 min čitanja</span>
              <span>·</span>
              <span>Ažurirano: avgust 2026.</span>
            </div>
          </div>

          {/* Quick answer */}
          <div id="kratak-odgovor" className="mb-8 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-lg text-slate-700 leading-relaxed">
              <strong className="text-slate-900">Kratki odgovor:</strong> belance u prahu je osušeni beli deo jajeta — oko 80g proteina na 100g praha, praktično bez masti i ugljenih hidrata, i potpuno bez laktoze. Porcija od 30g daje ti ~24g proteina za svega ~110 kcal. Ima najviše smisla ako ne podnosiš mleko ili whey ti pravi problem sa varenjem, ili ako mnogo pečeš i kuvaš i ne želiš da bacaš žumanca. Po gramu proteina je skuplje od whey concentrate-a, ali jeftinije od većine izolata.
            </p>
          </div>

          <GuideToc sections={tocSections} />

          {/* Section: What it is */}
          <section className="mb-10">
            <h2 id="sta-je" className="text-xl font-bold text-slate-900 mb-4">Šta je belance u prahu</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Belance u prahu (na deklaracijama često <em>albumin</em> ili <em>egg white powder</em>) nastaje tako što se sveži beli deo jajeta pasterizuje i osuši u fini prah. Uklanjanjem vode ostaje gotovo čist protein — isti onaj koji jedeš kad odvojiš belance od žumanca, samo u obliku koji stoji mesecima u ostavi i meri se kašikom.
              </p>
              <p>
                Ključna reč je <strong className="text-slate-900">pasterizacija</strong>. Sirovo belance iz jajeta nosi rizik od salmonele i sadrži avidin, jedinjenje koje ometa apsorpciju biotina. Toplotna obrada tokom sušenja rešava oba problema, pa se prah bezbedno meša direktno sa vodom — nešto što sa sirovim belancetom nikada ne bi trebalo da radiš.
              </p>
              <p>
                Po sastavu, ovo je kompletan protein: sadrži svih devet esencijalnih aminokiselina u dobrom odnosu i ima jednu od najviših bioloških vrednosti od svih izvora hrane. Drugim rečima, telo ga iskoristi gotovo u potpunosti.
              </p>
            </div>
          </section>

          {/* Section: Calories */}
          <section className="mb-10">
            <h2 id="kalorije" className="text-xl font-bold text-slate-900 mb-4">Kalorije i nutritivna vrednost</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700 mb-5">
              <p>
                Ovde ljudi najčešće mešaju dve stvari — kalorije <strong className="text-slate-900">svežeg belanceta</strong> i kalorije <strong className="text-slate-900">praha</strong>. Nisu isto, jer je iz praha izvučena sva voda, pa je on koncentrovaniji.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-4">
              <div className="px-4 py-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Poređenje</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-left">
                      <th className="px-4 py-2.5 text-xs font-semibold text-slate-500"> </th>
                      <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 text-right whitespace-nowrap">Kalorije</th>
                      <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 text-right whitespace-nowrap">Protein</th>
                      <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 text-right whitespace-nowrap">Masti / UH</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      { label: "1 sveže belance (~33g)", kcal: "16–17 kcal", prot: "3,6g", rest: "~0g" },
                      { label: "Porcija praha (30g)", kcal: "~110 kcal", prot: "~24g", rest: "~0g" },
                      { label: "Prah na 100g", kcal: "~375 kcal", prot: "~80g", rest: "~0–4g" },
                    ].map((row) => (
                      <tr key={row.label} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-800">{row.label}</td>
                        <td className="px-4 py-3 text-right text-slate-700 whitespace-nowrap">{row.kcal}</td>
                        <td className="px-4 py-3 text-right text-slate-700">{row.prot}</td>
                        <td className="px-4 py-3 text-right text-slate-700 whitespace-nowrap">{row.rest}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="text-[14px] text-slate-500 leading-relaxed">
              Ono što belance izdvaja jeste odnos proteina i kalorija. Na svaku kaloriju dobijaš izuzetno mnogo proteina, a gotovo nimalo masti i ugljenih hidrata — sav holesterol i mast iz jajeta ostaju u žumancu, koje ovde ne postoji. Zbog toga je omiljeno u fazi rezanja, kada svaka kalorija treba da nosi što više proteina. Tačne brojke variraju od brenda do brenda, pa uvek proveri deklaraciju konkretnog pakovanja.
            </p>
          </section>

          {/* Section: vs whey */}
          <section className="mb-10">
            <h2 id="vs-whey" className="text-xl font-bold text-slate-900 mb-4">Belance ili whey?</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700 mb-5">
              <p>
                Za većinu ljudi whey je i dalje prvi izbor — jeftiniji je po gramu proteina, ima kremastiju teksturu i brže se apsorbuje. Belance nije zamena koju treba da juri svako, nego rešenje za konkretne situacije. Evo gde svaki od njih pobeđuje:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <p className="font-bold text-slate-900 text-[15px] mb-2">Biraj belance kada…</p>
                <ul className="space-y-2 text-[14px] text-slate-600 leading-relaxed list-none">
                  <li>• ne podnosiš laktozu ili si alergičan na proteine kravljeg mleka</li>
                  <li>• whey ti pravi nadutost i gasove koji ne prolaze</li>
                  <li>• mnogo pečeš i kuvaš pa ti treba prah koji se umuti u sneg</li>
                  <li>• hoćeš maksimum proteina uz apsolutni minimum masti</li>
                </ul>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <p className="font-bold text-slate-900 text-[15px] mb-2">Ostani na whey-u kada…</p>
                <ul className="space-y-2 text-[14px] text-slate-600 leading-relaxed list-none">
                  <li>• gledaš najnižu cenu po gramu proteina</li>
                  <li>• dobro varite mlečne proizvode</li>
                  <li>• hoćeš klasičan kremast šejk sa puno ukusa</li>
                  <li>• trebaš najbržu apsorpciju odmah posle treninga</li>
                </ul>
              </div>
            </div>
            <p className="text-[14px] text-slate-500 leading-relaxed">
              Ako ti je problem baš laktoza, a ne mleko u celini, vredi uporediti belance i{" "}
              <Link href="/vodici/whey-isolate-vs-concentrate" className="text-[#FF9900] hover:underline font-medium">
                whey izolat
              </Link>{" "}
              — izolat je takođe gotovo bez laktoze i često jeftiniji od belanceta. Detaljnije o tome u vodiču{" "}
              <Link href="/vodici/protein-za-mrsavljenje" className="text-[#FF9900] hover:underline font-medium">
                protein za mršavljenje →
              </Link>
            </p>
          </section>

          {/* Section: Price */}
          <section className="mb-10">
            <h2 id="cena" className="text-xl font-bold text-slate-900 mb-4">Cena u Srbiji</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Belance u prahu je u srpskim prodavnicama uža ponuda nego whey — nema ga u svakoj radnji i biraš između svega nekoliko brendova. Cene se kreću otprilike u rangu izolata: računaj oko <strong className="text-slate-900">9–11 RSD po gramu proteina</strong>, što je osetno više od whey concentrate-a (~5–6 RSD/g), a slično ili malo iznad izolata.
              </p>
              <p>
                Zato je jedini pošten način poređenja <strong className="text-slate-900">cena po gramu proteina</strong>, a ne cena po pakovanju. Veće kese (2–2,5kg) gotovo uvek spuštaju cenu po gramu, isto kao kod whey-a. U tabeli ispod vidiš aktuelne opcije iz baze, poređane po vrednosti za novac.
              </p>
            </div>
          </section>

          {/* Section: How to use */}
          <section className="mb-10">
            <h2 id="kako-koristiti" className="text-xl font-bold text-slate-900 mb-4">Kako ga koristiti</h2>
            <div className="space-y-3">
              {[
                {
                  title: "Kao šejk",
                  desc: "Sipaj prvo hladnu ili mlaku vodu (ili mleko), pa dodaj prah — nikad obrnuto, jer se lakše sleže u grudvice. Ukus je neutralan do blago slan, pa mnogi belance mešaju u smoothie sa voćem, kakaom ili malo aromatizovanog proteina za bolji ukus.",
                },
                {
                  title: "Za palačinke i proteinske kolače",
                  desc: "Rehidrirano belance se muti u čvrst sneg baš kao sveže. Okvirni odnos: jedna ravna kašika praha + dve kašike vode = jedno belance. Idealno kad recept traži samo belanca, a ne želiš gomilu viška žumanaca.",
                },
                {
                  title: "Za beze i omlet",
                  desc: "Prah daje stabilan sneg za beze, a uz malo povrća pravi lagan omlet bez masti. Prednost u odnosu na sveža jaja je što tačno odmeriš koliko ti treba i nemaš bacanja.",
                },
                {
                  title: "Doziranje",
                  desc: "Jedna porcija je otprilike 30g praha (~24g proteina). Kao i kod svakog proteina u prahu, ovo je dopuna dnevnom unosu, a ne zamena za obrok — cilj ostaje 1,6–2,2g proteina po kilogramu telesne mase iz svih izvora zajedno.",
                },
              ].map(({ title, desc }) => (
                <div key={title} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <p className="font-semibold text-slate-900 text-[15px] mb-1">{title}</p>
                  <p className="text-[14px] text-slate-600 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
            <p className="text-[14px] text-slate-500 leading-relaxed mt-4">
              Više o dozi i rasporedu unosa kroz dan imaš u vodiču{" "}
              <Link href="/vodici/koliko-proteina-dnevno" className="text-[#FF9900] hover:underline font-medium">
                koliko proteina dnevno →
              </Link>
            </p>
          </section>

          {/* Section: Who is it for */}
          <section className="mb-10">
            <h2 id="kome" className="text-xl font-bold text-slate-900 mb-4">Kome zaista ima smisla</h2>
            <div className="space-y-3">
              {[
                {
                  ok: true,
                  title: "Netolerancija na laktozu ili alergija na mleko",
                  desc: "Ovo je glavni razlog za belance. Daje ti životinjski protein visoke vrednosti bez ijednog mlečnog sastojka — pod uslovom da nisi alergičan na samo jaje.",
                },
                {
                  ok: true,
                  title: "Ljubitelji fitnes kuvanja i pečenja",
                  desc: "Ako redovno praviš proteinske palačinke, kolače i beze, prah je praktičniji i jeftiniji od kupovanja i razbijanja tuceta jaja radi samih belanaca.",
                },
                {
                  ok: true,
                  title: "Faza rezanja",
                  desc: "Najviši mogući odnos proteina prema kalorijama, uz gotovo nula masti — korisno kad ti je svaka kalorija na računu.",
                },
                {
                  ok: false,
                  title: "Alergija na jaja",
                  desc: "Očigledno, ali vredi reći: ako si alergičan na jaja, belance nije opcija. Tada su biljni proteini (grašak, soja, pirinač) prirodan izbor bez mleka i bez jaja.",
                },
                {
                  ok: false,
                  title: "Traženje najniže cene po gramu proteina",
                  desc: "Ako dobro varite mleko i cilj ti je najjeftiniji protein, whey concentrate će skoro uvek biti povoljniji izbor.",
                },
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
            <p className="text-[14px] text-slate-500 leading-relaxed mt-4">
              Ako si baš tu zbog izbegavanja mleka, pogledaj i{" "}
              <Link href="/biljni-protein-srbija" className="text-[#FF9900] hover:underline font-medium">
                biljne proteine u Srbiji →
              </Link>
            </p>
          </section>

          {/* Top products */}
          {topProductsWithPPG.length > 0 && (
            <section className="mb-10">
              <h2 id="top-proizvodi" className="text-xl font-bold text-slate-900 mb-4">Belance u prahu — dostupno u Srbiji</h2>
              <p className="text-[15px] text-slate-700 leading-relaxed mb-5">
                Aktuelne opcije iz baze, poređane po Value Score-u (odnos cene i kvaliteta). Cene se osvežavaju sedmično:
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
                Isolate vs Concentrate
              </Link>
              <Link href="/vodici/koliko-proteina-dnevno" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Koliko proteina dnevno?
              </Link>
              <Link href="/biljni-protein-srbija" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Biljni protein u Srbiji
              </Link>
              <Link href="/vodici/protein-za-mrsavljenje" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Protein za mršavljenje
              </Link>
            </div>
          </section>

          {/* CTA */}
          <div className="bg-[#1B2B4B] rounded-2xl p-6 text-white text-center mb-10">
            <p className="text-base leading-relaxed mb-4">
              Uporedi belance i sve ostale proteine bez laktoze — sortirano po vrednosti za novac.
            </p>
            <Link
              href="/?sort=valueScore%2Cdesc"
              className="inline-block px-6 py-3 bg-[#FF9900] hover:bg-[#e68a00] text-[#131921] font-bold rounded-xl text-sm transition-colors"
            >
              Uporedi proteine →
            </Link>
          </div>

          {/* Citations */}
          <div className="mb-6 text-xs text-slate-400 leading-relaxed border-t border-slate-200 pt-4">
            <p className="font-semibold text-slate-500 mb-1">Izvori</p>
            <p>
              USDA FoodData Central —{" "}
              <a href="https://fdc.nal.usda.gov/" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600">
                nutritivne vrednosti belanceta i sušenog albumina jajeta
              </a>.
            </p>
            <p>
              Hoffman &amp; Falvo,{" "}
              <a href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3905294/" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600">
                J Sports Sci Med 2004
              </a>{" "}
              — poređenje izvora proteina i njihove biološke vrednosti.
            </p>
          </div>

          <GuideDisclaimer />

          <VodiciNav currentSlug="belance-u-prahu" />
        </main>
      </div>
    </>
  );
}
