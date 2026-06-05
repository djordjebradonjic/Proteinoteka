import { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: "B2B Baza Podataka Proteina | Proteinoteka" },
  description:
    "Strukturisana baza podataka proteina i suplemenata u Srbiji. API pristup i CSV/SQL dump za developere i e-commerce prodavnice. Aktuelne cene, nutritivne vrednosti i istorija cena.",
  keywords: [
    "baza proteina u srbiji",
    "baza podataka suplemenata",
    "api za cene proteina srbija",
    "supplement database serbia",
    "protein api srbija",
    "baza podataka whey protein srbija",
    "cene suplemenata api",
  ],
  alternates: { canonical: "https://proteinoteka.rs/baza-podataka" },
  openGraph: {
    title: "B2B Baza Podataka Proteina i Suplemenata | Proteinoteka",
    description:
      "Pristup strukturisanoj bazi podataka proteina i suplemenata u Srbiji. REST API ili jednokratni dump za developere i e-commerce sajove.",
    url: "https://proteinoteka.rs/baza-podataka",
    siteName: "Proteinoteka",
    locale: "sr_RS",
    type: "website",
  },
};

const BASE = "https://proteinoteka.rs";

const FEATURES = [
  {
    icon: "🛒",
    title: "Katalog proizvoda",
    desc: "Više od 1.000 suplemenata iz srpskih i regionalnih prodavnica, sa imenima, brendovima i slikama.",
  },
  {
    icon: "💰",
    title: "Aktuelne cene u RSD",
    desc: "Cene se automatski ažuriraju svake sedmice. Pored tekuće cene dostupna je i istorija promena.",
  },
  {
    icon: "🧬",
    title: "Nutritivne vrednosti",
    desc: "Proteini, masti, šećeri i kalorije na 100g, tip proteina (whey, izolat, vegan, kazein) i veličina pakovanja.",
  },
  {
    icon: "📊",
    title: "Value Score i percentil",
    desc: "Naš izračunati indeks isplativosti i percentilni rank koji pokazuje gde se proizvod kotira u odnosu na celokupnu ponudu.",
  },
  {
    icon: "🔗",
    title: "Direktni linkovi",
    desc: "Svaki proizvod ima link ka originalnoj stranici u prodavnici — bez posrednika.",
  },
  {
    icon: "🏪",
    title: "Više prodavnica",
    desc: "Pansport, Supplementshop, Proteini.si, Proteinbox, Ogistrashop, FitLab i još.",
  },
];

const SAMPLE_JSON = `{
  "id": 142,
  "name": "Optimum Nutrition Gold Standard 100% Whey",
  "brand": "Optimum Nutrition",
  "storeName": "Pansport",
  "productUrl": "https://pansport.rs/...",
  "imageUrl": "https://pansport.rs/images/...",
  "numericPrice": 7490.00,
  "proteinPer100g": 79.5,
  "fatPer100g": 3.7,
  "sugarPer100g": 3.4,
  "caloriePer100g": 383.0,
  "proteinSource": "whey_concentrate",
  "primaryWeightGrams": 908.0,
  "valueScore": 8.42,
  "percentileRank": 91,
  "flavours": ["Čokolada", "Vanila", "Jagoda"],
  "weights": ["908g", "2270g"],
  "canonicalSlug": "optimum-nutrition-gold-standard-100-whey",
  "lastUpdated": "2026-05-26T03:00:00"
}`;

export default function Page() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "B2B Baza Podataka Proteina i Suplemenata",
      url: `${BASE}/baza-podataka`,
      description:
        "REST API i CSV/SQL dump strukturisane baze podataka proteina i suplemenata u Srbiji za developere i e-commerce prodavnice.",
      publisher: { "@type": "Organization", name: "Proteinoteka", url: BASE },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Početna", item: BASE },
        { "@type": "ListItem", position: 2, name: "Baza podataka", item: `${BASE}/baza-podataka` },
      ],
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-slate-50">
        <Header />

        {/* Hero */}
        <section className="bg-[#1B2B4B] text-white">
          <div className="max-w-5xl mx-auto px-4 py-16 sm:py-24">
            <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-8">
              <Link href="/" className="hover:text-[#FF9900] transition-colors">Početna</Link>
              <span>/</span>
              <span className="text-slate-300">Baza podataka</span>
            </nav>

            <div className="max-w-3xl">
              <span className="inline-block px-3 py-1 bg-[#FF9900]/20 text-[#FF9900] text-xs font-semibold rounded-full mb-4 tracking-wide uppercase">
                Za developere i e-commerce
              </span>
              <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight mb-5">
                Strukturisana baza podataka proteina i suplemenata u Srbiji
              </h1>
              <p className="text-lg text-slate-300 leading-relaxed mb-8 max-w-2xl">
                Gradite fitnes aplikaciju ili otvarate online prodavnicu? Pristupite
                čistoj, ažurnoj bazi sa više od 1.000 suplemenata — cenama, nutritivnim
                vrednostima i istorijom promena — putem REST API-ja ili jednokratnog CSV/SQL
                dumpa.
              </p>

              {/* Stats */}
              <div className="flex flex-wrap gap-6">
                {[
                  { value: "1.000+", label: "proizvoda" },
                  { value: "6+", label: "prodavnica" },
                  { value: "Sedmično", label: "ažuriranje" },
                  { value: "REST API", label: "ili CSV/SQL dump" },
                ].map(({ value, label }) => (
                  <div key={label}>
                    <p className="text-2xl font-bold text-[#FF9900]">{value}</p>
                    <p className="text-sm text-slate-400">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <main className="max-w-5xl mx-auto px-4 py-14">

          {/* Šta sadrži baza */}
          <section className="mb-16">
            <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Šta sve sadrži baza</h2>
            <p className="text-slate-500 mb-8 text-[15px]">
              Svaki zapis je prošao kroz parser i AI enrichment pipeline — podaci su čisti i konzistentni.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {FEATURES.map(({ icon, title, desc }) => (
                <div
                  key={title}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"
                >
                  <span className="text-2xl mb-3 block">{icon}</span>
                  <h3 className="font-bold text-slate-900 mb-1">{title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Načini pristupa */}
          <section className="mb-16">
            <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Načini preuzimanja podataka</h2>
            <p className="text-slate-500 mb-8 text-[15px]">
              Birajte format koji odgovara vašem projektu.
            </p>
            <div className="grid sm:grid-cols-2 gap-6">
              {/* REST API */}
              <div className="bg-white border-2 border-[#FF9900] rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">⚡</span>
                  <h3 className="text-lg font-bold text-slate-900">Live REST API</h3>
                  <span className="ml-auto px-2 py-0.5 bg-[#FF9900]/10 text-[#FF9900] text-xs font-semibold rounded-full">
                    Preporučeno
                  </span>
                </div>
                <ul className="space-y-2 text-sm text-slate-600 mb-6">
                  <li className="flex items-start gap-2"><span className="text-green-500 font-bold mt-0.5">✓</span> Uvek aktuelni podaci</li>
                  <li className="flex items-start gap-2"><span className="text-green-500 font-bold mt-0.5">✓</span> Paginacija — do 200 proizvoda po zahtevu</li>
                  <li className="flex items-start gap-2"><span className="text-green-500 font-bold mt-0.5">✓</span> JSON format, standardni REST</li>
                  <li className="flex items-start gap-2"><span className="text-green-500 font-bold mt-0.5">✓</span> Pristup putem API ključa</li>
                </ul>
                <code className="block bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 font-mono break-all">
                  GET /api/v1/b2b/products?api_key=VAŠ_KLJUČ&page=0&size=50
                </code>
              </div>

              {/* CSV/SQL dump */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">📦</span>
                  <h3 className="text-lg font-bold text-slate-900">Jednokratni dump</h3>
                </div>
                <ul className="space-y-2 text-sm text-slate-600 mb-6">
                  <li className="flex items-start gap-2"><span className="text-green-500 font-bold mt-0.5">✓</span> CSV ili SQL format</li>
                  <li className="flex items-start gap-2"><span className="text-green-500 font-bold mt-0.5">✓</span> Kompletan snapshot baze</li>
                  <li className="flex items-start gap-2"><span className="text-green-500 font-bold mt-0.5">✓</span> Idealno za jednokratni uvoz</li>
                  <li className="flex items-start gap-2"><span className="text-slate-400 font-bold mt-0.5">–</span> Podaci se ne ažuriraju automatski</li>
                </ul>
                <p className="text-sm text-slate-500">
                  Kontaktirajte nas i pošaljite zahtev — isporučujemo dump u roku od 24h.
                </p>
              </div>
            </div>
          </section>

          {/* Uzorak podataka */}
          <section className="mb-16">
            <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Uzorak podataka</h2>
            <p className="text-slate-500 mb-6 text-[15px]">
              Ovako izgleda jedan zapis iz API odgovora:
            </p>
            <div className="bg-[#1B2B4B] rounded-2xl overflow-hidden shadow-lg">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-white/10">
                <span className="w-3 h-3 rounded-full bg-red-400" />
                <span className="w-3 h-3 rounded-full bg-yellow-400" />
                <span className="w-3 h-3 rounded-full bg-green-400" />
                <span className="ml-3 text-xs text-slate-400 font-mono">
                  GET /api/v1/b2b/products?api_key=...
                </span>
              </div>
              <pre className="px-5 py-5 text-xs text-green-300 font-mono overflow-x-auto leading-relaxed whitespace-pre">
                {SAMPLE_JSON}
              </pre>
            </div>
          </section>

          {/* Za koga je ovo */}
          <section className="mb-16">
            <h2 className="text-2xl font-extrabold text-slate-900 mb-6">Za koga je ovo</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                {
                  title: "Fitnes aplikacije",
                  desc: "Integriši aktuelne cene i nutritivne profile u svoju app bez sopstvenog scrapera.",
                },
                {
                  title: "E-commerce prodavnice",
                  desc: "Koristiš katalog kao osnovu za sopstveni sortiment ili sistem za poređenje konkurencije.",
                },
                {
                  title: "Istraživači i analitičari",
                  desc: "Analiza tržišta suplemenata u Srbiji sa čistim, strukturisanim podacima.",
                },
              ].map(({ title, desc }) => (
                <div
                  key={title}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"
                >
                  <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section>
            <div className="bg-[#1B2B4B] rounded-2xl p-8 text-white text-center">
              <h2 className="text-2xl font-extrabold mb-3">Zainteresovani? Javite se.</h2>
              <p className="text-slate-300 text-[15px] leading-relaxed mb-6 max-w-xl mx-auto">
                Pošaljite nam kratku poruku o vašem projektu — odgovaramo u roku od 24 sata
                i dogovaramo pristup koji odgovara vašim potrebama.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/kontakt"
                  className="inline-block px-7 py-3 bg-[#FF9900] hover:bg-[#e68a00] text-[#131921] font-bold rounded-xl text-sm transition-colors"
                >
                  Pošaljite upit →
                </Link>
                <a
                  href="mailto:kontakt@proteinoteka.rs"
                  className="inline-block px-7 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-sm transition-colors"
                >
                  kontakt@proteinoteka.rs
                </a>
              </div>
            </div>
          </section>

        </main>
      </div>
    </>
  );
}
