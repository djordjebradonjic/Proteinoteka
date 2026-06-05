import { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import VodiciNav from "@/components/VodiciNav";

export const metadata: Metadata = {
  title: { absolute: "Da li protein goji? Šta kaže nauka o whey proteinu i gojenju | Proteinoteka" },
  description:
    "Whey protein sam po sebi ne goji — goji kalorijski suficit. Saznaj kako protein utiče na sitost, metabolizam i mršavljenje, i kada šejk može da ti pomogne.",
  alternates: { canonical: "https://proteinoteka.rs/vodici/da-li-protein-goji" },
  openGraph: {
    title: "Da li protein goji? Šta kaže nauka o whey proteinu i gojenju | Proteinoteka",
    description:
      "Whey protein sam po sebi ne goji — goji kalorijski suficit. Saznaj kako protein utiče na sitost, metabolizam i mršavljenje, i kada šejk može da ti pomogne.",
    url: "https://proteinoteka.rs/vodici/da-li-protein-goji",
    siteName: "Proteinoteka",
    locale: "sr_RS",
    type: "article",
  },
};

const faqItems = [
  {
    q: "Može li proteinski šejk da zameni obrok i da li ću smršati?",
    a: "Šejk može da bude deo obroka, ali retko ga u potpunosti zamenjuje po sitosti i mikronutrijentima. Ako šejkom zameniš obrok sa manje kalorija i ostaneš u deficitu, gubiš kilograme — ali to važi za svaku hranu, ne samo za protein.",
  },
  {
    q: "Da li protein posle treninga goji ako ne treniram dovoljno?",
    a: "Ako uzmeš protein posle treninga i uneseš više kalorija nego što trošiš tokom dana, višak se skladišti kao mast — bez obzira na to šta si pojeo/la. Protein nije izuzetak od prvog zakona termodinamike.",
  },
  {
    q: "Koliko kalorija ima tipičan proteinski šejk?",
    a: "Jedna porcija whey proteina (30g) rastvorena u vodi daje uglavnom 100–130 kcal i 22–27g proteina. Ako šejk praviš sa punomasnim mlekom (250ml), dodaj još 150 kcal. To je ukupno 250–280 kcal — manje od prosečnog ručka.",
  },
];

const BASE = "https://proteinoteka.rs";
const SLUG = "/vodici/da-li-protein-goji";
const WORDS = 610;
const READ_MIN = Math.ceil(WORDS / 200);

export default function Page() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Da li protein goji? Šta kaže nauka o whey proteinu i gojenju",
      datePublished: "2025-05-01",
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
        { "@type": "ListItem", position: 3, name: "Da li protein goji?", item: `${BASE}${SLUG}` },
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
            <span className="text-slate-600">Da li protein goji?</span>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-4">
              Da li protein goji?
            </h1>
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <span>{READ_MIN} min čitanja</span>
              <span>·</span>
              <span>Ažurirano: maj 2025.</span>
            </div>
          </div>

          {/* Intro */}
          <p className="text-lg text-slate-700 leading-relaxed mb-10 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
            Proteinski šejk te ne goji — goji te <strong className="text-slate-900">kalorijski suficit</strong>. Ako unosiš više kalorija nego što trošiš, gojiš se bez obzira na izvor. Protein je od sva tri makronutrijenta onaj koji <em>najmanje</em> vodi gojenju — zasićuje, pomaže očuvanju mišića i ima viši termički efekat od masti i ugljenih hidrata.
          </p>

          {/* Section 1 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Kalorijski suficit = gojenje, ne protein</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Whey protein ima oko 4 kcal po gramu — isto kao ugljeni hidrati. Masti imaju 9 kcal/g. Ako popiješ šejk sa 30g proteina u vodi, uneseš oko 120 kcal. Toliko ima i jedno malo banana. Sama ta kalorija nije problem — problem nastaje ako dodaješ šejk na već punačku ishranu bez ikakve aktivnosti.
              </p>
              <p>
                Termički efekat proteina (energija koju telo troši na varenje) je 20–35%, nasuprot 5–10% za ugljene hidrate i svega 0–3% za masti. To znači da od 100 kcal iz proteina telo efektivno apsorbuje oko 70–80 kcal — malo povoljnije od ostalih makronutrijenata.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Kako protein utiče na sitost i apetit</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Protein je najefikasniji makronutrijent za sitost. Stimuliše lučenje hormona koji smanjuju apetit (GLP-1, PYY) i smanjuje nivo grelina — hormona gladi. U praksi to znači da posle proteinskog obroka duže nisi gladan/gladna nego posle obroka bogatog ugljenim hidratima iste kalorijske vrednosti.
              </p>
              <p>
                Istraživanja su pokazala da povećanje unosa proteina na 25–30% ukupnih kalorija spontano smanjuje ukupan unos hrane za 400–500 kcal dnevno, bez svesnog ograničavanja — samo zato što se osetiš sito.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Uobičajene greške koje vode gojenju</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Najčešći scenario: osoba počne da uzima proteinski šejk, ali ga doda na postojeću ishranu bez ikakve aktivnosti. Šejk nije kriv — kriv je suficit koji je napravila. Isti problem nastaje sa puno mleka u šejku, gustim masama proteina sa šećerom, ili dve-tri porcije dnevno bez razloga.
              </p>
              <p>
                Drugi problem je mišljenje da "treniram, pa mogu jesti šta hoću". Sat vremena teretane sagori 300–500 kcal. Jedna burek+jogurt kombinacija nakon toga lako vraća 600+ kcal. Trening nije dozvola za jelo bez granice.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Kada protein zapravo pomaže mršavljenju</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Ako si u kalorijskom deficitu, viši unos proteina (1.8–2.2g/kg) pomaže da sačuvaš mišićnu masu dok gubiš mast. Bez dovoljno proteina, telo u deficitu "jede" i mišiće — završiš mršavije, ali mlitavije.
              </p>
              <p>
                Proteinski šejk tu može biti praktičan alat — zamena za visokokalorični međuobrok koji te drži sitim sa manje kalorija. 30g whey proteina u vodi = ~120 kcal i ~25g proteina. Malo koji drugi snack nudi takav odnos.
              </p>
            </div>
          </section>

          {/* FAQ */}
          <section className="mb-10">
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
              <Link href="/vodici/koliko-proteina-dnevno" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Koliko proteina dnevno?
              </Link>
              <Link href="/vodici/kada-piti-protein" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Kada piti protein?
              </Link>
              <Link href="/kategorija/whey-concentrate?sort=valueScore,desc" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Whey proteini za mrsavljenje
              </Link>
            </div>
          </section>

          {/* CTA */}
          <div className="bg-[#1B2B4B] rounded-2xl p-6 text-white text-center">
            <p className="text-base leading-relaxed mb-4">
              Ako tražiš protein koji nudi najviše proteina po gramu i kaloriji, Proteinoteka.rs poredi sve dostupne opcije na srpskom tržištu.
            </p>
            <Link
              href="/?sort=valueScore,desc"
              className="inline-block px-6 py-3 bg-[#FF9900] hover:bg-[#e68a00] text-[#131921] font-bold rounded-xl text-sm transition-colors"
            >
              Pronađi protein sa najboljim odnosom proteina i kalorija
            </Link>
          </div>

          <VodiciNav currentSlug="da-li-protein-goji" />
        </main>
      </div>
    </>
  );
}
