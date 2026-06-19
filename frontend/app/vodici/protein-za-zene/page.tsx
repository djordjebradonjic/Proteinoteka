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
  title: { absolute: "Protein za žene u Srbiji — mitovi i istine (bez marketinga) | Proteinoteka" },
  description:
    "Da li protein pravi mišiće kao muškarcima? Šta je takozvani ženski protein i da li vredi? Konkretni odgovori bez marketinga — sa aktuelnim cenama iz srpskih prodavnica.",
  alternates: { canonical: "https://proteinoteka.rs/vodici/protein-za-zene" },
  openGraph: {
    title: "Protein za žene u Srbiji — mitovi i istine (bez marketinga) | Proteinoteka",
    description:
      "Da li protein pravi mišiće kao muškarcima? Šta je takozvani ženski protein i da li vredi? Konkretni odgovori bez marketinga — sa aktuelnim cenama iz srpskih prodavnica.",
    url: "https://proteinoteka.rs/vodici/protein-za-zene",
    siteName: "Proteinoteka",
    locale: "sr_RS",
    type: "article",
  },
};

const TOC: TocSection[] = [
  { id: "zenski-protein", title: "Takozvani ženski protein — marketing, ne nauka" },
  { id: "misicava", title: "Hoću li postati mišićava?" },
  { id: "testosteron", title: "Zašto žene ne mogu da budu mišićave kao muškarci", level: 3 },
  { id: "koliko-dnevno", title: "Koliko proteina dnevno za žene?" },
  { id: "koji-tip", title: "Koji tip proteina birati?" },
  { id: "kollagen-vs-whey", title: "Kolagen vs. whey" },
  { id: "mrsavljenje", title: "Protein i mršavljenje kod žena" },
  { id: "live-cene", title: "Aktuelne cene u Srbiji" },
  { id: "faq", title: "Česta pitanja" },
];

const faqItems = [
  {
    q: "Da li žene treba da uzimaju manji broj grama proteina od muškaraca?",
    a: "Ne po kilogramu tela — preporuka je ista: 1.6–2.2g/kg za aktivne ljude. Žene su prosečno lakše, pa je ukupna količina u gramima manja, ali se ne radi o drugačijoj fiziologiji.",
  },
  {
    q: "Da li proteinski šejk utiče na hormone kod žena?",
    a: "Standardni whey protein nema dokazanog uticaja na estrogen ni na ciklus. Izuzetak su suplementi sa dodanim fitoestrogeni (sojini izoflavoni) — ako te to brine, biraj whey koncentrat ili izolat bez soje. Većina whey proteina na srpskom tržištu ne sadrži soju.",
  },
  {
    q: "Koji protein je dobar za žene koje žele da smršaju?",
    a: "Whey izolat je dobar izbor: visok procenat proteina, malo kalorija, gotovo bez laktoze. Nije neophodan — whey koncentrat radi posao za većinu žena. Važnija od tipa proteina je ukupna kalorijska bilansa.",
  },
  {
    q: "Da li biljni protein ima neke prednosti za žene?",
    a: "Ako imaš intoleranciju na laktozu ili si veganka, biljni protein je solidan izbor. Za sve ostale, whey koncentrat je isplativiji i ima bolji aminokiselinski profil po nižoj ceni.",
  },
  {
    q: "Šta je sa kolagenom — da li je bolji od whey proteina za žene?",
    a: "Kolagen i whey su za različite svrhe. Kolagen ne sadrži sve esencijalne gradivne materije koje telo treba za mišiće, pa ne može da zameni whey. Za mišiće i sitost — whey. Za zglobove i kožu — kolagen može biti dobar dodatak, ali ne zamena.",
  },
];

function ppg(p: Product): number | null {
  if (!p.numericPrice || !p.primaryWeightGrams || !p.proteinPer100g) return null;
  const totalProt = p.primaryWeightGrams * (p.proteinPer100g / 100);
  if (totalProt <= 0) return null;
  return p.numericPrice / totalProt;
}

const BASE = "https://proteinoteka.rs";
const SLUG = "/vodici/protein-za-zene";

export default async function Page() {
  const [wpcProducts, wpiProducts] = await Promise.all([
    fetchTopProducts({ category: "whey_concentrate", sortBy: "valueScore", limit: 3 }),
    fetchTopProducts({ category: "whey_isolate", sortBy: "valueScore", limit: 3 }),
  ]);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Protein za žene u Srbiji — mitovi i istine (bez marketinga)",
      datePublished: "2026-06-19",
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
        { "@type": "ListItem", position: 3, name: "Protein za žene — mitovi i istine", item: `${BASE}${SLUG}` },
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
            <Link href="/vodici" className="hover:text-[#FF9900] transition-colors">Vodiči</Link>
            <span>/</span>
            <span className="text-slate-600">Protein za žene — mitovi i istine</span>
          </nav>

          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-4">
              Protein za žene u Srbiji — mitovi i istine
            </h1>
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <span>7 min čitanja</span>
              <span>·</span>
              <span>Ažurirano: {new Date().toLocaleDateString("sr-RS", { month: "long", year: "numeric" })}</span>
            </div>
          </div>

          {/* TL;DR */}
          <div className="mb-8 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[13px] font-bold text-slate-400 uppercase tracking-wider mb-3">Ukratko</p>
            <div className="space-y-2">
              {[
                "Takozvani ženski protein ne postoji — isti whey u drugoj ambalaži, viša cena, manje proteina po porciji.",
                "Nećeš postati mišićava: žene imaju 10–15× manje hormona rasta mišića od muškaraca.",
                "Preporuka proteina za žene: 1.6–2.2g/kg — identično kao za muškarce.",
                "Najisplativiji izbor: standardni whey koncentrat (WPC) — isti protein, znatno niža cena.",
                "Kolagen ne zamenjuje whey — nemaju isti sastav gradivnih materija.",
              ].map((fact) => (
                <div key={fact} className="flex gap-2.5 text-[15px] text-slate-700 leading-snug">
                  <span className="text-[#FF9900] font-bold shrink-0 mt-0.5">→</span>
                  <span>{fact}</span>
                </div>
              ))}
            </div>
          </div>

          <GuideToc sections={TOC} />

          {/* Section 1 */}
          <section className="mb-10" id="zenski-protein">
            <h2 className="text-xl font-bold text-slate-900 mb-4">„Ženski protein" — marketing, ne nauka</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Prodavnice suplemenata prodaju proteine sa oznakom „for women", „slim" ili „lady" — po ceni koja je znatno viša od standardnog whey proteina. Razlika u sastavu gotovo uvek ne postoji, ili je zanemarljiva: možda nešto drugačija aroma, ponekad dodani vitamini u tragovima.
              </p>
              <p>
                Žensko telo varenje i korišćenje proteina funkcioniše identično kao muško. Gradivne materije koje grade mišiće, enzimi koji ih razlažu, transport do tkiva — sve radi po istim principima. Ne postoji razlog da žena plaća više za posebnu formulu.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-[14px] text-slate-700">
                  <strong className="text-slate-900">Konkretno:</strong> Standardni whey koncentrat u Srbiji ima manji kalorijski sadržaj, veći procenat proteina po porciji i nižu cenu od tipičnih „ženskih" proteina. Razlika nije u sastavu — razlika je u ambalaži.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section className="mb-10" id="misicava">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Hoću li postati mišićava?</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Ovo je najčešća briga i najlakše oboriva. Izgradnja velikih mišića kod žena je biološki znatno sporija i ograničenija nego kod muškaraca — zbog jednog hormona.
              </p>
            </div>

            <h3 id="testosteron" className="text-[17px] font-bold text-slate-800 mt-6 mb-3">
              Zašto žene ne mogu da budu mišićave kao muškarci
            </h3>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Muškarci imaju 10 do 15 puta više testosterona od žena. Testosteron je hormon koji direktno pokreće rast mišića — bez njega, telo jednostavno nema signal da gradi veliki mišićni volumen. Profesionalne bodybuilderke koje viđaš na takmičenjima koriste sintetičke hormone — to nije rezultat proteina i redovnog treninga.
              </p>
              <p>
                Žena koja trenira sa tegovima i unosi dovoljno proteina dobiće čvršće, toniranije telo i jače kosti. Neće dobiti mišiće koji izgledaju kao na fotografijama muških bodybuildera — to fizički nije moguće bez hormonalne intervencije.
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
                        { p: "Nivo testosterona", z: "Nizak", m: "10–15× viši" },
                        { p: "Potencijal rasta mišića", z: "Ograničen", m: "Visok" },
                        { p: "Preporuka proteina (aktivni)", z: "1.6–2.2g/kg", m: "1.6–2.2g/kg" },
                        { p: "Koji protein treba", z: "Standardni WPC ili WPI", m: "Isti" },
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

          {/* Section 3 */}
          <section className="mb-10" id="koliko-dnevno">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Koliko proteina dnevno za žene?</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Preporuka je ista kao za muškarce iste telesne mase: <strong className="text-slate-900">1.6–2.2g proteina po kilogramu</strong> za ljude koji redovno treniraju. Za osobu od 60kg to znači 96–132g proteina dnevno iz svih izvora hrane i suplemenata zajedno.
              </p>
              <div className="space-y-2">
                {[
                  { kg: "50 kg", range: "80–110g proteina dnevno" },
                  { kg: "60 kg", range: "96–132g proteina dnevno" },
                  { kg: "70 kg", range: "112–154g proteina dnevno" },
                  { kg: "80 kg", range: "128–176g proteina dnevno" },
                ].map(({ kg, range }) => (
                  <div key={kg} className="flex items-center justify-between bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-sm text-[14px]">
                    <span className="font-semibold text-slate-800">{kg}</span>
                    <span className="text-slate-600">{range}</span>
                  </div>
                ))}
              </div>
              <p>
                Prosečna žena kroz normalnu ishranu unosi 50–70g proteina dnevno. Jedan proteinski šejk od 25g pomaže da popuniš taj jaz — posebno ako ne jedeš redovno meso, ribu ili jaja.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section className="mb-10" id="koji-tip">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Koji tip proteina birati?</h2>
            <div className="space-y-3">
              {[
                {
                  title: "Whey koncentrat (WPC) — za većinu",
                  desc: "70–80g proteina na 100g, niska cena, dobar ukus. Dovoljan za skoro sve žene koje žele da povećaju dnevni unos proteina. Sadrži malu količinu laktoze — ako te loše probavlja, pređi na izolat.",
                  good: true,
                },
                {
                  title: "Whey izolat (WPI) — za mršavljenje ili intoleranciju na laktozu",
                  desc: "85–94g proteina na 100g, gotovo bez laktoze i masti. Skuplje od koncentrata za 20–40%, ali bolji odnos kalorija i proteina. Dobar izbor kada si u kalorijskom deficitu.",
                  good: true,
                },
                {
                  title: "Biljni protein — za vegankinje ili alergičare",
                  desc: "Kombinacija graška i pirinča daje sve neophodne gradivne materije. Biraj mešavinu, ne samo jednu biljku — sam grašak ili sam pirinač nemaju kompletan sastav.",
                  good: true,
                },
                {
                  title: "Takozvani ženski protein — izbegavati",
                  desc: "Isti ili lošiji sastav od standardnog whey koncentrata, viša cena. Ne postoji naučna osnova za ovu kategoriju — kupuješ marketing.",
                  good: false,
                },
                {
                  title: "Kolagen kao jedini izvor proteina — ne",
                  desc: "Kolagen ne sadrži sve gradivne materije koje telo treba za mišiće i oporavak. Nije zamena za whey ili biljni protein — može biti koristan dodatak, ali ne i osnova.",
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

          {/* Section 5 */}
          <section className="mb-10" id="kollagen-vs-whey">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Kolagen vs. whey — šta je zaista bolje?</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Marketing kolagena targetira žene obećanjima o koži, noktima i zglobovima — i tu ima naučne osnove. Kolagen zaista može doprineti elastičnosti kože i zdravlju zglobova, a vitamin C poboljšava njegovu sintezu u telu.
              </p>
              <p>
                Ali kolagen <em>nije</em> zamena za kompletan protein. Ne sadrži sve gradivne materije koje telo koristi za izgradnju mišića — konkretno, nedostaje mu triptofan, jedna od ključnih esencijalnih aminokiselina. Ako uzemaš kolagen umesto wheya, nisi pokrila potrebe za oporavak i mišiće.
              </p>
              <div className="bg-[#FFF8EC] border border-[#FF9900]/30 rounded-xl p-4">
                <p className="text-[14px] text-slate-700">
                  <strong className="text-slate-900">Praktičan zaključak:</strong> Whey za mišiće, sitost i regeneraciju. Kolagen kao dodatak za zglobove i kožu. Jedno ne isključuje drugo — ali kolagen ne može da zameni whey.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6 */}
          <section className="mb-10" id="mrsavljenje">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Protein i mršavljenje kod žena</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Žene tokom dijete gube mišićnu masu nešto brže nego muškarci — delimično zbog nižeg nivoa testosterona. To čini adekvatni unos proteina <em>još važnijim</em> pri mršavljenju, ne manje.
              </p>
              <p>
                Viši unos proteina pri deficitu (1.8–2.4g/kg) pomaže da sačuvaš mišiće dok gubiš mast, pojačava osećaj sitosti i smanjuje želju za grickanjem. Žena na dijeti koja ne unosi dovoljno proteina na kraju ostane mršavija, ali mlitava i sa sporijim metabolizmom.
              </p>
              <p>
                Za detalje o tome koji tip proteina birati pri mršavljenju pogledaj{" "}
                <Link href="/vodici/protein-za-mrsavljenje" className="text-[#FF9900] hover:underline font-medium">
                  vodič za protein pri mršavljenju →
                </Link>
              </p>
            </div>
          </section>

          {/* Section 7 — live cene */}
          <section className="mb-10" id="live-cene">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Aktuelne cene u Srbiji</h2>
            <p className="text-[14px] text-slate-500 mb-6">
              Umesto da platiš više za „ženski" protein, evo šta trenutno nude standardni whey koncentrat i izolat — rangirani po value scoreu iz {new Date().toLocaleDateString("sr-RS", { month: "long", year: "numeric" })}.
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
                      <a
                        key={p.id}
                        href={productUrl(p)}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-[#FF9900] transition-colors"
                      >
                        {p.imageUrl && (
                          <img src={p.imageUrl} alt={p.name} className="w-12 h-12 object-contain rounded shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-[14px] font-semibold text-slate-900 truncate">{p.name}</p>
                          <p className="text-[12px] text-slate-500">{p.brand} · {p.storeName}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[15px] font-bold text-slate-900">{p.price}</p>
                          {rate && (
                            <p className="text-[11px] text-slate-400">{rate.toFixed(1)} din/g prot.</p>
                          )}
                        </div>
                      </a>
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
                      <a
                        key={p.id}
                        href={productUrl(p)}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-[#FF9900] transition-colors"
                      >
                        {p.imageUrl && (
                          <img src={p.imageUrl} alt={p.name} className="w-12 h-12 object-contain rounded shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-[14px] font-semibold text-slate-900 truncate">{p.name}</p>
                          <p className="text-[12px] text-slate-500">{p.brand} · {p.storeName}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[15px] font-bold text-slate-900">{p.price}</p>
                          {rate && (
                            <p className="text-[11px] text-slate-400">{rate.toFixed(1)} din/g prot.</p>
                          )}
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            <Link
              href="/?sort=valueScore,desc"
              className="inline-block mt-2 text-[14px] text-[#FF9900] hover:underline font-medium"
            >
              Pogledaj sve proteine rangirane po value scoreu →
            </Link>
          </section>

          {/* FAQ */}
          <section className="mb-10" id="faq">
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

          {/* References */}
          <section className="mb-8">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Naučne reference</h2>
            <ol className="space-y-1.5 text-[13px] text-slate-500 list-decimal pl-4">
              <li>Stokes T et al. (2018). Recent perspectives regarding the role of dietary protein for the promotion of muscle hypertrophy with resistance exercise training. <em>Nutrients</em>, 10(2), 180.</li>
              <li>Witard OC et al. (2016). Protein considerations for optimising skeletal muscle mass in healthy young and older adults. <em>Nutrients</em>, 8(4), 181.</li>
              <li>Tipton KD (2001). Testosterone and sex differences in protein metabolism. <em>Journal of Applied Physiology</em>, 91(3), 1055–1060.</li>
              <li>Westerterp-Plantenga MS et al. (2012). Dietary protein — its role in satiety, energetics, weight loss and health. <em>British Journal of Nutrition</em>, 108(S2), S105–S112.</li>
            </ol>
          </section>

          <GuideDisclaimer />

          <section className="mt-10 mb-10">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Korisni vodiči</h2>
            <div className="flex flex-wrap gap-3">
              <Link href="/vodici/protein-za-mrsavljenje" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Protein za mršavljenje
              </Link>
              <Link href="/vodici/koliko-proteina-dnevno" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Koliko proteina dnevno?
              </Link>
              <Link href="/vodici/whey-isolate-vs-concentrate" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Whey Isolate vs Concentrate
              </Link>
              <Link href="/vodici/da-li-protein-goji" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Da li protein goji?
              </Link>
            </div>
          </section>

          <div className="bg-[#1B2B4B] rounded-2xl p-6 text-white text-center">
            <p className="text-base leading-relaxed mb-4">
              Pronađi protein koji nudi najviše po gramu i kaloriji — iz svih prodavnica u Srbiji, bez marketinga.
            </p>
            <Link
              href="/?sort=valueScore,desc"
              className="inline-block px-6 py-3 bg-[#FF9900] hover:bg-[#e68a00] text-[#131921] font-bold rounded-xl text-sm transition-colors"
            >
              Uporedi proteine po Value Score-u →
            </Link>
          </div>

          <VodiciNav currentSlug="protein-za-zene" />
        </main>
      </div>
    </>
  );
}
