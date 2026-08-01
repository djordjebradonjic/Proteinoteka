import { notFound } from "next/navigation";
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
  title: { absolute: "Protein za žene u Hrvatskoj — mitovi i činjenice | Proteinoteka" },
  description:
    "Postoji li stvarno 'ženski' protein? Hoćete li se namišićiti? Konkretni odgovori bez marketinga, s aktualnim cijenama iz hrvatskih trgovina.",
  alternates: { canonical: `https://${MARKET_CONFIG[CURRENT_MARKET].domain}/hr-vodici/protein-za-zene-hrvatska` },
  openGraph: {
    title: "Protein za žene u Hrvatskoj — mitovi i činjenice | Proteinoteka",
    description:
      "Postoji li stvarno 'ženski' protein? Hoćete li se namišićiti? Konkretni odgovori bez marketinga, s aktualnim cijenama iz hrvatskih trgovina.",
    url: `https://${MARKET_CONFIG[CURRENT_MARKET].domain}/hr-vodici/protein-za-zene-hrvatska`,
    siteName: "Proteinoteka",
    locale: MARKET_CONFIG[CURRENT_MARKET].ogLocale,
    type: "article",
    images: [{ url: `https://${MARKET_CONFIG[CURRENT_MARKET].domain}/opengraph-image`, width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", images: [`https://${MARKET_CONFIG[CURRENT_MARKET].domain}/opengraph-image`] },
};

const TOC: TocSection[] = [
  { id: "zenski-protein", title: "'Ženski protein' — pakiranje, ne formula" },
  { id: "namisicenje", title: "Hoću li se namišićiti?" },
  { id: "testosteron", title: "Zašto je to biološki gotovo nemoguće", level: 3 },
  { id: "koliko-dnevno", title: "Koliko proteina dnevno vam zapravo treba" },
  { id: "koji-tip", title: "Koji tip proteina odabrati" },
  { id: "kolagen", title: "Kolagen naspram whey proteina" },
  { id: "mrsavljenje", title: "Protein kod mršavljenja — zašto je bitniji nego što misle" },
  { id: "live-cijene", title: "Aktualne cijene u Hrvatskoj" },
  { id: "faq", title: "Često postavljana pitanja" },
];

const faqItems = [
  {
    q: "Trebaju li žene manje proteina od muškaraca?",
    a: "Ne po kilogramu tjelesne mase — preporuka je identična, 1.6-2.2g/kg za aktivne osobe. Žene su u prosjeku lakše, pa je ukupna količina u gramima manja, ali to je posljedica tjelesne mase, ne drugačije fiziologije.",
  },
  {
    q: "Utječe li whey protein na hormone ili menstrualni ciklus?",
    a: "Standardni whey nema dokazan utjecaj na estrogen ni na ciklus. Iznimka su proizvodi s dodanim sojinim izoflavonima (fitoestrogeni) — ako vas to brine, birajte whey bez soje u sastavu. Većina whey proteina na hrvatskom tržištu soju uopće ne sadrži.",
  },
  {
    q: "Koji protein je dobar izbor za mršavljenje?",
    a: "Whey izolat je praktičan izbor zbog visokog postotka proteina i niskog udjela kalorija, ali nije nužan — whey koncentrat odrađuje posao za većinu žena. Ukupna kalorijska bilanca ostaje važnija od tipa proteina.",
  },
  {
    q: "Ima li biljni protein prednosti za žene konkretno?",
    a: "Ne po spolu, ali ako ste veganka ili ne podnosite laktozu, biljni protein (grašak + riža) je solidan izbor. Za sve ostale, whey koncentrat je jeftiniji i ima nešto bolji aminokiselinski profil.",
  },
  {
    q: "Je li kolagen bolji izbor od whey proteina?",
    a: "Ne za istu svrhu. Kolagenu nedostaje triptofan, esencijalna aminokiselina potrebna za izgradnju mišića, pa ne može zamijeniti whey. Za mišiće i sitost — whey. Za zglobove i kožu — kolagen kao dodatak, ne kao zamjena.",
  },
];

function ppg(p: Product): number | null {
  if (!p.numericPrice || !p.primaryWeightGrams || !p.proteinPer100g) return null;
  const totalProt = p.primaryWeightGrams * (p.proteinPer100g / 100);
  if (totalProt <= 0) return null;
  return p.numericPrice / totalProt;
}

const BASE = `https://${MARKET_CONFIG[CURRENT_MARKET].domain}`;
const SLUG = "/hr-vodici/protein-za-zene-hrvatska";

export default async function Page() {
  if (CURRENT_MARKET !== "hr") notFound();
  const [wpcProducts, wpiProducts] = await Promise.all([
    fetchTopProducts({ category: "whey_concentrate", sortBy: "valueScore", limit: 3 }),
    fetchTopProducts({ category: "whey_isolate", sortBy: "valueScore", limit: 3 }),
  ]);
  const dateModified = new Date().toISOString().split("T")[0];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Protein za žene u Hrvatskoj — mitovi i činjenice",
      datePublished: "2026-08-01",
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
        { "@type": "ListItem", position: 3, name: "Protein za žene", item: `${BASE}${SLUG}` },
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
            <span className="text-slate-600">Protein za žene</span>
          </nav>

          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-4">
              Protein za žene u Hrvatskoj — mitovi i činjenice
            </h1>
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <span>7 min čitanja</span>
              <span>·</span>
              <time dateTime={dateModified}>Ažurirano: kolovoz 2026.</time>
            </div>
          </div>

          <div className="mb-8 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[13px] font-bold text-slate-400 uppercase tracking-wider mb-3">Ukratko</p>
            <div className="space-y-2">
              {[
                "'Ženski protein' u pravilu nije drugačija formula — isti whey, drugačija ambalaža, viša cijena.",
                "Namišićivanje kao kod muškaraca biološki nije realno — testosteron je 10-15× niži.",
                "Preporuka unosa je ista kao za muškarce: 1.6-2.2g proteina po kilogramu tjelesne mase.",
                "Najisplativiji izbor ostaje standardni whey koncentrat — isti protein, znatno niža cijena.",
                "Kolagen ne zamjenjuje whey — nemaju isti aminokiselinski sastav.",
              ].map((fact) => (
                <div key={fact} className="flex gap-2.5 text-[15px] text-slate-700 leading-snug">
                  <span className="text-[#FF9900] font-bold shrink-0 mt-0.5">→</span>
                  <span>{fact}</span>
                </div>
              ))}
            </div>
          </div>

          <GuideToc sections={TOC} />

          <section className="mb-10" id="zenski-protein">
            <h2 className="text-xl font-bold text-slate-900 mb-4">&quot;Ženski protein&quot; — pakiranje, ne formula</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Na policama se nalaze proizvodi s natpisom &quot;for women&quot;, &quot;slim&quot; ili &quot;lady&quot;, po cijeni koja je znatno viša od standardnog whey proteina. U velikoj većini slučajeva razlika u sastavu ili ne postoji, ili je zanemariva — malo drugačija aroma, ponekad vitamin dodan u tragovima.
              </p>
              <p>
                Probava i iskorištavanje proteina kod žena funkcionira identično kao kod muškaraca. Enzimi koji razgrađuju protein, transport aminokiselina do tkiva, izgradnja mišićnih vlakana — sve radi po istim biokemijskim principima. Ne postoji fiziološki razlog da žena plaća premiju za posebnu formulu.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-[14px] text-slate-700">
                  <strong className="text-slate-900">Konkretno:</strong> standardni whey koncentrat dostupan u Hrvatskoj obično ima viši postotak proteina po porciji i nižu cijenu od tipičnog &quot;ženskog&quot; proteina. Razlika nije u formuli — razlika je u marketingu i ambalaži.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-10" id="namisicenje">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Hoću li se namišićiti?</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Ovo je najčešća briga i ujedno najlakše objašnjiva. Izgradnja velike mišićne mase kod žena ograničena je biološki — konkretno, jednim hormonom kojeg žensko tijelo jednostavno nema u dovoljnoj količini.
              </p>
            </div>

            <h3 id="testosteron" className="text-[17px] font-bold text-slate-800 mt-6 mb-3">Zašto je to biološki gotovo nemoguće</h3>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Muškarci imaju 10 do 15 puta više testosterona od žena. Testosteron izravno pokreće rast mišićnog tkiva — bez njega, tijelo naprosto nema signal za izgradnju velikog mišićnog volumena. Profesionalne natjecateljice u bodybuildingu koje izgledaju izrazito mišićavo koriste sintetske hormone; to nije rezultat proteina i treninga s utezima.
              </p>
              <p>
                Žena koja redovno trenira s utezima i unosi dovoljno proteina dobit će čvršće, definiranije tijelo i jače kosti. Neće dobiti mišićni volumen kakav se vidi na fotografijama muških bodybuildera — to fizički nije moguće bez hormonalne intervencije.
              </p>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">Parametar</th>
                        <th className="px-4 py-2.5 text-center text-xs font-semibold text-slate-500">Žene</th>
                        <th className="px-4 py-2.5 text-center text-xs font-semibold text-slate-500">Muškarci</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        { p: "Razina testosterona", z: "Niska", m: "10-15× viša" },
                        { p: "Potencijal rasta mišića", z: "Ograničen", m: "Visok" },
                        { p: "Preporuka proteina (aktivni)", z: "1.6-2.2g/kg", m: "1.6-2.2g/kg" },
                        { p: "Koji tip proteina", z: "Standardni WPC ili WPI", m: "Isti" },
                      ].map(({ p, z, m }) => (
                        <tr key={p}>
                          <td className="px-4 py-3 font-medium text-slate-800">{p}</td>
                          <td className="px-4 py-3 text-center text-slate-600">{z}</td>
                          <td className="px-4 py-3 text-center text-slate-600">{m}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-10" id="koliko-dnevno">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Koliko proteina dnevno vam zapravo treba</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Preporuka je ista kao za muškarce jednake tjelesne mase: <strong className="text-slate-900">1.6-2.2g proteina po kilogramu</strong> za osobe koje redovno treniraju. Za ženu od 60kg to znači 96-132g proteina dnevno, iz hrane i suplemenata zajedno.
              </p>
              <div className="space-y-2">
                {[
                  { kg: "50 kg", range: "80-110g proteina dnevno" },
                  { kg: "60 kg", range: "96-132g proteina dnevno" },
                  { kg: "70 kg", range: "112-154g proteina dnevno" },
                  { kg: "80 kg", range: "128-176g proteina dnevno" },
                ].map(({ kg, range }) => (
                  <div key={kg} className="flex items-center justify-between bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-sm text-[14px]">
                    <span className="font-semibold text-slate-800">{kg}</span>
                    <span className="text-slate-600">{range}</span>
                  </div>
                ))}
              </div>
              <p>
                Prosječna žena kroz uobičajenu prehranu unosi 50-70g proteina dnevno. Jedan shake od 25g pomaže popuniti tu razliku — pogotovo ako meso, ribu ili jaja ne jedete svaki dan.
              </p>
            </div>
          </section>

          <section className="mb-10" id="koji-tip">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Koji tip proteina odabrati</h2>
            <div className="space-y-3">
              {[
                {
                  title: "Whey koncentrat (WPC) — za većinu",
                  desc: "70-80g proteina na 100g, niska cijena, dobar okus. Pokriva potrebe gotovo svake žene koja želi povećati dnevni unos proteina. Sadrži nešto laktoze — ako vam to smeta, prijeđite na izolat.",
                  good: true,
                },
                {
                  title: "Whey izolat (WPI) — za mršavljenje ili intoleranciju na laktozu",
                  desc: "85-94g proteina na 100g, gotovo bez laktoze i masti. Skuplji od koncentrata 20-40%, ali bolji omjer kalorija i proteina. Dobar izbor u kalorijskom deficitu.",
                  good: true,
                },
                {
                  title: "Biljni protein — za veganke ili osobe s alergijama",
                  desc: "Kombinacija graška i riže pokriva sve esencijalne aminokiseline. Birajte mješavinu, ne samo jednu biljku — sam grašak ili sama riža nemaju kompletan aminokiselinski profil.",
                  good: true,
                },
                {
                  title: "'Ženski protein' — nema razloga za premiju",
                  desc: "Isti ili slabiji sastav od standardnog whey koncentrata, uz višu cijenu. Ne postoji znanstvena osnova za ovu kategoriju kao posebnu formulu.",
                  good: false,
                },
                {
                  title: "Kolagen kao jedini izvor proteina — ne",
                  desc: "Kolagenu nedostaju gradivne tvari koje tijelo koristi za izgradnju mišića. Nije zamjena za whey ili biljni protein — može biti koristan dodatak, ali ne osnova prehrane.",
                  good: false,
                },
              ].map(({ title, desc, good }) => (
                <div key={title} className="flex gap-3 bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <span className={`font-bold text-lg shrink-0 mt-0.5 ${good ? "text-green-500" : "text-red-400"}`}>
                    {good ? "✓" : "✕"}
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900 text-[15px]">{title}</p>
                    <p className="text-[14px] text-slate-600 leading-relaxed mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-10" id="kolagen">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Kolagen naspram whey proteina — što je zapravo bolje?</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Marketing kolagena cilja žene obećanjima o koži, noktima i zglobovima — i tu doista postoji znanstvena podloga. Kolagen može doprinijeti elastičnosti kože i zdravlju zglobova, a vitamin C poboljšava njegovu sintezu u organizmu.
              </p>
              <p>
                No kolagen <em>nije</em> zamjena za kompletan protein. Nedostaje mu triptofan, jedna od esencijalnih aminokiselina koje tijelo koristi za izgradnju mišića. Ako kolagenom zamijenite whey, ne pokrivate stvarne potrebe za oporavak i mišićnu masu.
              </p>
              <div className="bg-[#FFF8EC] border border-[#FF9900]/30 rounded-xl p-4">
                <p className="text-[14px] text-slate-700">
                  <strong className="text-slate-900">Praktičan zaključak:</strong> whey za mišiće, sitost i oporavak. Kolagen kao dodatak za zglobove i kožu. Jedno ne isključuje drugo — ali kolagen ne može odraditi posao whey proteina.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-10" id="mrsavljenje">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Protein kod mršavljenja — zašto je bitniji nego što misle</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Žene tijekom dijete gube mišićnu masu nešto brže nego muškarci, dijelom zbog niže razine testosterona. To adekvatan unos proteina čini <em>još važnijim</em> pri mršavljenju, ne manje bitnim.
              </p>
              <p>
                Viši unos proteina u deficitu (1.8-2.4g/kg) pomaže sačuvati mišićnu masu dok gubite mast, pojačava osjećaj sitosti i smanjuje želju za grickanjem između obroka. Žena na dijeti koja ne unosi dovoljno proteina na kraju ostane mršavija, ali mlohavija i s usporenijim metabolizmom.
              </p>
              <p>
                Za detalje o odabiru tipa proteina pri mršavljenju pogledajte{" "}
                <Link href="/hr-vodici/protein-za-mrsavljenje-hrvatska" className="text-[#FF9900] hover:underline font-medium">
                  vodič za protein pri mršavljenju →
                </Link>
              </p>
            </div>
          </section>

          <section className="mb-10" id="live-cijene">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Aktualne cijene u Hrvatskoj</h2>
            <p className="text-[14px] text-slate-500 mb-6">
              Umjesto da platite više za &quot;ženski&quot; protein, evo što trenutno nude standardni whey koncentrat i izolat — rangirano po Value Score-u.
            </p>

            {wpcProducts.length > 0 && (
              <div className="mb-6">
                <h3 className="text-[15px] font-bold text-slate-700 mb-3">
                  Whey koncentrat (WPC) — najisplativiji za većinu
                </h3>
                <div className="space-y-2">
                  {wpcProducts.map((p) => {
                    const rate = ppg(p);
                    return (
                      <Link
                        key={p.id}
                        href={productUrl(p)}
                        className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-[#FF9900] transition-colors"
                      >
                        {p.imageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.imageUrl} alt={p.name} className="w-12 h-12 object-contain rounded shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-[14px] font-semibold text-slate-900 truncate">{p.name}</p>
                          <p className="text-[12px] text-slate-500">{p.brand} · {p.storeName}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[15px] font-bold text-slate-900">{p.price}</p>
                          {rate && <p className="text-[11px] text-slate-400">{rate.toFixed(2)} EUR/g prot.</p>}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {wpiProducts.length > 0 && (
              <div className="mb-4">
                <h3 className="text-[15px] font-bold text-slate-700 mb-3">
                  Whey izolat (WPI) — za dijetu ili intoleranciju na laktozu
                </h3>
                <div className="space-y-2">
                  {wpiProducts.map((p) => {
                    const rate = ppg(p);
                    return (
                      <Link
                        key={p.id}
                        href={productUrl(p)}
                        className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-[#FF9900] transition-colors"
                      >
                        {p.imageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.imageUrl} alt={p.name} className="w-12 h-12 object-contain rounded shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-[14px] font-semibold text-slate-900 truncate">{p.name}</p>
                          <p className="text-[12px] text-slate-500">{p.brand} · {p.storeName}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[15px] font-bold text-slate-900">{p.price}</p>
                          {rate && <p className="text-[11px] text-slate-400">{rate.toFixed(2)} EUR/g prot.</p>}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            <Link
              href="/?sort=valueScore%2Cdesc"
              className="inline-block mt-2 text-[14px] text-[#FF9900] hover:underline font-medium"
            >
              Pogledajte sve proteine rangirane po Value Score-u →
            </Link>
          </section>

          <section className="mb-10" id="faq">
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

          <section className="mb-8">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Znanstvene reference</h2>
            <ol className="space-y-1.5 text-[13px] text-slate-500 list-decimal pl-4">
              <li>Stokes T et al. (2018). Recent perspectives regarding the role of dietary protein for the promotion of muscle hypertrophy with resistance exercise training. <em>Nutrients</em>, 10(2), 180.</li>
              <li>Witard OC et al. (2016). Protein considerations for optimising skeletal muscle mass in healthy young and older adults. <em>Nutrients</em>, 8(4), 181.</li>
              <li>Tipton KD (2001). Testosterone and sex differences in protein metabolism. <em>Journal of Applied Physiology</em>, 91(3), 1055-1060.</li>
              <li>Westerterp-Plantenga MS et al. (2012). Dietary protein — its role in satiety, energetics, weight loss and health. <em>British Journal of Nutrition</em>, 108(S2), S105-S112.</li>
            </ol>
          </section>

          <GuideDisclaimer />

          <section className="mt-10 mb-10">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Korisni vodiči</h2>
            <div className="flex flex-wrap gap-3">
              <Link href="/hr-vodici/protein-za-mrsavljenje-hrvatska" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Protein za mršavljenje
              </Link>
              <Link href="/hr-vodici/koliko-proteina-dnevno-hrvatska" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Koliko proteina dnevno?
              </Link>
              <Link href="/hr-vodici/whey-isolate-vs-concentrate-hrvatska" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Whey Isolate vs Concentrate
              </Link>
              <Link href="/hr-vodici/da-li-protein-goji-hrvatska" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Goji li protein?
              </Link>
            </div>
          </section>

          <div className="bg-[#1B2B4B] rounded-2xl p-6 text-white text-center">
            <p className="text-base leading-relaxed mb-4">
              Pronađite protein koji nudi najviše po gramu i kaloriji — iz svih trgovina u Hrvatskoj, bez marketinga.
            </p>
            <Link
              href="/?sort=valueScore%2Cdesc"
              className="inline-block px-6 py-3 bg-[#FF9900] hover:bg-[#e68a00] text-[#131921] font-bold rounded-xl text-sm transition-colors"
            >
              Usporedite proteine po Value Score-u →
            </Link>
          </div>
        </main>
      </div>
    </>
  );
}
