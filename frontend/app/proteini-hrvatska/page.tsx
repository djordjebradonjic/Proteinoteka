import { notFound } from "next/navigation";
import { CURRENT_MARKET } from "@/lib/marketConfig";
import { Metadata } from "next";
import { fetchTopProducts } from "@/lib/seo-data";
import { Product } from "@/types/product";
import { productUrl } from "@/lib/productUrl";
import Header from "@/components/Header";
import Link from "next/link";
import { safeJsonLd } from "@/lib/jsonLd";

export const revalidate = 86400;

function ppg(p: Product): number {
  if (!p.proteinPer100g || !p.primaryWeightGrams || p.numericPrice <= 0) return Infinity;
  return p.numericPrice / ((p.proteinPer100g / 100) * p.primaryWeightGrams);
}

export const metadata: Metadata = {
  title: { absolute: "Svi Proteini u Hrvatskoj — Rang po Vrijednosti 2026 | Proteinoteka" },
  description:
    "Usporedba svih tipova proteina u Hrvatskoj: whey koncentrat, izolat, hidrolizat, kazein, biljni i blend — sortirani po value score-u i cijeni po gramu proteina.",
  alternates: {
    canonical: "https://proteinoteka.com.hr/proteini-hrvatska",
    languages: {
      hr: "https://proteinoteka.com.hr/proteini-hrvatska",
      sr: "https://proteinoteka.rs/proteini-srbija",
      "x-default": "https://proteinoteka.rs/proteini-srbija",
    },
  },
  openGraph: {
    title: "Svi Proteini u Hrvatskoj — Rang Lista po Vrijednosti 2026 | Proteinoteka",
    description: "Cross-type usporedba svih proteina u Hrvatskoj. Jedina stranica koja sortira koncentrat, izolat, kazein i biljni po istom mjerilu: cijeni po gramu proteina.",
    url: "https://proteinoteka.com.hr/proteini-hrvatska",
    siteName: "Proteinoteka",
    locale: "hr_HR",
    type: "website",
    images: [{ url: "https://proteinoteka.com.hr/opengraph-image", width: 1200, height: 630, alt: "Proteinoteka" }],
  },
  twitter: { card: "summary_large_image", images: ["https://proteinoteka.com.hr/opengraph-image"] },
};

const CATEGORIES = [
  { key: "whey_concentrate", label: "Whey Koncentrat",      slug: "kategorija/whey-concentrate",  desc: "Osnova tržišta. 70–80g proteina/100g, nešto laktoze i masti. Najisplativiji za većinu ciljeva." },
  { key: "whey_isolate",    label: "Whey Izolat",          slug: "kategorija/whey-isolate",      desc: "85–93g proteina/100g, minimalna laktoza. Idealan za intoleranciju na laktozu i definiciju." },
  { key: "hydrolysate",     label: "Hidrolizat",           slug: "kategorija/hidrolizat",        desc: "Presvardeni proteini za maksimalnu brzinu apsorpcije. Koristan odmah poslije treninga." },
  { key: "casein",          label: "Kazein",               slug: "kategorija/kazein",            desc: "Sporiji izvor proteina. Idealan prije spavanja jer osigurava aminokiseline 6–8h." },
  { key: "vegan",           label: "Biljni protein",        slug: "kategorija/biljni-protein",    desc: "Grašak, soja, riža. Bez mliječnih derivata. Uz malo veći obrok, djelotvornost je gotovo ista kao whey." },
  { key: "blend",           label: "Blend",                slug: "kategorija/blend",             desc: "Mješavina whey-a i kazeina. Sporije oslobađanje aminokiselina. Dobro za dulja razdoblja između obroka." },
] as const;

function getScoreClass(score: number | null) {
  if (score === null) return "bg-slate-100 text-slate-500";
  if (score >= 8) return "bg-green-100 text-green-700";
  if (score >= 6) return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-600";
}

function MiniProductRow({ p, rank }: { p: Product; rank: number }) {
  const perGram = ppg(p);
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0">
      <span className="text-slate-400 text-xs font-bold w-5 shrink-0 text-center">{rank}</span>
      <div className="flex-1 min-w-0">
        <Link href={productUrl(p)} className="text-sm font-semibold text-slate-900 hover:text-[#FF9900] line-clamp-1">
          {p.name}
        </Link>
        <p className="text-xs text-slate-500">{p.storeName}</p>
      </div>
      <div className="text-right shrink-0 space-y-0.5">
        <p className="text-sm font-bold text-slate-900">{p.price}</p>
        {perGram < Infinity && (
          <p className="text-xs text-slate-400">{perGram.toFixed(3).replace(".", ",")} €/g</p>
        )}
      </div>
      {p.valueScore !== null && p.valueScore !== undefined && (
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${getScoreClass(p.valueScore)}`}>
          {p.valueScore.toFixed(1)}
        </span>
      )}
    </div>
  );
}

export default async function Page() {
  if (CURRENT_MARKET !== "hr") notFound();

  const allFetches = await Promise.all(
    CATEGORIES.map(c => fetchTopProducts({ category: c.key, sortBy: "valueScore", limit: 8 }))
  );

  const categoryData = CATEGORIES.map((c, i) => ({ ...c, products: allFetches[i] }));

  const allProducts = allFetches.flat();
  const bestOverall = allProducts
    .filter(p => p.valueScore !== null)
    .sort((a, b) => (b.valueScore ?? 0) - (a.valueScore ?? 0))[0] ?? null;

  const bestByGram = allProducts
    .filter(p => ppg(p) < Infinity)
    .sort((a, b) => ppg(a) - ppg(b))[0] ?? null;

  const avgByCategory = categoryData.map(c => {
    const withData = c.products.filter(p => ppg(p) < Infinity);
    const avg = withData.length > 0
      ? withData.reduce((s, p) => s + ppg(p), 0) / withData.length
      : null;
    return { ...c, avgPpg: avg };
  });

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Početna", item: "https://proteinoteka.com.hr" },
      { "@type": "ListItem", position: 2, name: "Svi proteini u Hrvatskoj", item: "https://proteinoteka.com.hr/proteini-hrvatska" },
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Koji tip proteina je najjeftiniji po gramu u Hrvatskoj?",
        acceptedAnswer: { "@type": "Answer", text: "Whey koncentrat generalno nudi najnižu cijenu po gramu proteina u usporedbi s ostalim tipovima. Točan rang lista ovisi o aktualnim cijenama — pogledaj tablicu iznad." },
      },
      {
        "@type": "Question",
        name: "Koja je razlika između koncentrata, izolata i hidrolizata?",
        acceptedAnswer: { "@type": "Answer", text: "Koncentrat: 70–80g proteina/100g, nešto laktoze i masti. Izolat: 85–93g proteina/100g, minimalna laktoza. Hidrolizat: presvardeni proteini za brzu apsorpciju. Svi su iz sirutke, razlikuju se u stupnju pročišćavanja." },
      },
      {
        "@type": "Question",
        name: "Što je value score na Proteinoteci?",
        acceptedAnswer: { "@type": "Answer", text: "Value score je složeni indeks koji uzima u obzir cijenu po gramu proteina, apsolutni sadržaj proteina, čistoću sastava i reputaciju brenda. Skala je 0–10." },
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(faqJsonLd) }} />
      <Header />

      {/* Hero */}
      <div className="bg-[#131921] text-white">
        <div className="max-w-4xl mx-auto px-4 py-10 sm:py-14">
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-5" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-[#FF9900] transition-colors">Početna</Link>
            <span>/</span>
            <span className="text-slate-300">Svi proteini u Hrvatskoj</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-4 leading-tight">
            Svi Proteini u Hrvatskoj — Rang Lista po Vrijednosti
          </h1>
          <p className="text-slate-300 text-base sm:text-lg max-w-2xl leading-relaxed">
            Svaka trgovina ima &ldquo;best value&rdquo; protein. Ovdje su svi — koncentrat, izolat, hidrolizat, kazein,
            biljni i blend — sortirani po istom mjerilu: value score i cijena po gramu proteina, iz svih hrvatskih trgovina.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-10">

        {/* Quick Answer */}
        {(bestOverall || bestByGram) && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-2">Kratki odgovor</p>
            <p className="text-sm text-slate-800 leading-relaxed">
              {bestOverall && `Trenutno najviši value score u cijeloj bazi: ${bestOverall.name} (${bestOverall.valueScore?.toFixed(1)}/10) za ${bestOverall.price}. `}
              {bestByGram && `Najjeftiniji po gramu proteina: ${bestByGram.name} — ${ppg(bestByGram).toFixed(3).replace(".", ",")} €/g.`}
            </p>
          </div>
        )}

        {/* Summary table */}
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4">Prosječna cijena po gramu proteina po tipu</h2>
          <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
            <table className="w-full text-sm bg-white">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tip</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Proteini/100g</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Prosjek €/g</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Idealno za</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Whey Koncentrat",  prot: "70–80g",  avg: avgByCategory[0].avgPpg, for: "Svakodnevnu upotrebu, fazu mase" },
                  { label: "Whey Izolat",      prot: "85–93g",  avg: avgByCategory[1].avgPpg, for: "Definiciju, intolerancija na laktozu" },
                  { label: "Hidrolizat",       prot: "75–90g",  avg: avgByCategory[2].avgPpg, for: "Brzu apsorpciju poslije treninga" },
                  { label: "Kazein",           prot: "75–85g",  avg: avgByCategory[3].avgPpg, for: "Prije spavanja (6–8h oslobađanje)" },
                  { label: "Biljni protein",   prot: "50–90g",  avg: avgByCategory[4].avgPpg, for: "Vegane i intoleranciju na mlijeko" },
                  { label: "Blend",            prot: "60–80g",  avg: avgByCategory[5].avgPpg, for: "Dulja razdoblja između obroka" },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 font-semibold text-slate-800">{row.label}</td>
                    <td className="py-3 px-4 text-slate-600 hidden sm:table-cell">{row.prot}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-900">
                      {row.avg !== null ? `${row.avg.toFixed(3).replace(".", ",")} €` : "–"}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[13px] hidden sm:table-cell">{row.for}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-400 mt-2">Prosjeci su izračunati iz aktualne ponude u bazi. Ažuriraju se redovito.</p>
        </section>

        {/* Category sections */}
        {categoryData.map((cat) => (
          <section key={cat.key}>
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="text-xl font-bold text-slate-900">{cat.label}</h2>
              <Link href={`/${cat.slug}`} className="text-sm text-[#FF9900] hover:underline font-medium">
                Sve →
              </Link>
            </div>
            <p className="text-[14px] text-slate-600 mb-3">{cat.desc}</p>
            {cat.products.length > 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-1">
                {cat.products.slice(0, 5).map((p, i) => (
                  <MiniProductRow key={p.id} p={p} rank={i + 1} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic">Trenutno nema dovoljno podataka za ovu kategoriju.</p>
            )}
          </section>
        ))}

        {/* FAQ */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Česta pitanja</h2>
          {[
            {
              q: "Koji tip proteina bi trebao kupiti kao početnik?",
              a: "Whey koncentrat. Isti mišićni učinak kao izolat, za manje novca. Ako nemaš intoleranciju na laktozu, nema racionalnog razloga da platiš premiju za izolat. Uzmi ono što odgovara budžetu i što ćeš redovito piti.",
            },
            {
              q: "Znači li skuplji protein automatski bolji protein?",
              a: "Ne. Cijena po kilogramu može biti visoka zbog ambalaže, brenda ili distribucije, a ne proteina. Uvijek gledaj cijenu po gramu proteina — neki koncentrati imaju bolji odnos od premium izolata.",
            },
            {
              q: "Što je value score i zašto nije samo cijena/gram?",
              a: "Cijena po gramu proteina govori o financijskoj učinkovitosti, ali ne i o kvaliteti. Value score kombinira i apsolutni sadržaj proteina, čistoću sastava, reputaciju brenda i apsorpcijsku brzinu. Proizvod može biti jeftin po gramu ali pun kolagena koji vještački podiže proteinski postotak.",
            },
            {
              q: "Može li vegan imati dovoljno proteina bez whey-a?",
              a: "Da. Biljni proteini s kompletnim aminokiselinskim profilom (soja izolat, grašak+riža blend) pokrivaju sve potrebe. Jedina korekcija: uzmi 5–10g veći obrok nego kod whey-a da kompenziraš manji sadržaj leucina.",
            },
            {
              q: "Je li kazein skuplji od whey-a — isplati li se?",
              a: "Za specifičan cilj — da. Kazein formira gel u želucu i oslobađa aminokiseline 6–8 sati. To ga čini idealnim prije spavanja. Nije zamjena za whey u toku dana, ali je korisna dopuna za one koji ozbiljno pristupaju oporavku.",
            },
            {
              q: "Koliko grama proteina dnevno treba?",
              a: "Rekreativci s 2–3 treninga tjedno: 1,4–1,6g po kilogramu tjelesne mase. Aktivni koji žele izgradnju mišića: 1,8–2,2g/kg. Mršavljenje: 2,0–2,4g/kg (visoki unos proteina čuva mišiće u deficitu). Koristi naš kalkulator proteina za personaliziranu procjenu.",
            },
          ].map((faq, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-bold text-slate-900 text-[15px] mb-2">{faq.q}</h3>
              <p className="text-[14px] text-slate-600 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </section>

        {/* Cross links */}
        <section className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { href: "/protein-kalkulator-hrvatska",                   label: "Kalkulator proteina" },
            { href: "/whey-protein-izolat-hrvatska",                  label: "Izolat — rang lista" },
            { href: "/whey-protein-cijena",                           label: "Whey protein cijena" },
            { href: "/kazein-protein-hrvatska",                       label: "Kazein proteini" },
            { href: "/biljni-protein-hrvatska",                       label: "Biljni proteini" },
            { href: "/hr-vodici/najbolji-protein-za-pocetnike-hrvatska", label: "Koji protein kupiti?" },
          ].map(l => (
            <Link
              key={l.href}
              href={l.href}
              className="text-center text-sm font-medium bg-white border border-slate-200 rounded-xl py-3 px-4 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors text-slate-700"
            >
              {l.label}
            </Link>
          ))}
        </section>

        <p className="text-xs text-slate-400 text-center leading-relaxed">
          Cijene se ažuriraju redovito iz hrvatskih trgovina. Value score je izračunat algoritamski — metodologiju pogledaj na{" "}
          <Link href="/kako-racunamo-value-score" className="hover:underline">proteinoteka.com.hr/kako-racunamo-value-score</Link>.
        </p>
      </div>
    </>
  );
}
