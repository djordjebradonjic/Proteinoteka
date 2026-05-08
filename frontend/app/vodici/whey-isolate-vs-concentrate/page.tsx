import { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Whey Isolate vs Concentrate — koja je razlika i šta da odabereš? | Proteinoteka",
  description:
    "Whey isolate ima 85–95% proteina i minimalnu laktozu. Concentrate ima 70–80% proteina i košta manje. Saznaj kome odgovara koji, sa cenama iz srpskog tržišta.",
  alternates: { canonical: "https://proteinoteka.rs/vodici/whey-isolate-vs-concentrate" },
  openGraph: {
    title: "Whey Isolate vs Concentrate — koja je razlika i šta da odabereš? | Proteinoteka",
    description:
      "Whey isolate ima 85–95% proteina i minimalnu laktozu. Concentrate ima 70–80% proteina i košta manje. Saznaj kome odgovara koji, sa cenama iz srpskog tržišta.",
    url: "https://proteinoteka.rs/vodici/whey-isolate-vs-concentrate",
    siteName: "Proteinoteka",
    locale: "sr_RS",
    type: "article",
  },
};

const faqItems = [
  {
    q: "Da li je whey isolate uvek bolji od concentrate?",
    a: "Nije. Isolate je čistiji i sadrži manje laktoze i masti, ali ta razlika je zanemarljiva za većinu ljudi koji nemaju intoleranciju na laktozu. Ako zdravo jedeš i treniraš, concentrate ti daje iste rezultate po nižoj ceni.",
  },
  {
    q: "Koliko veća je razlika u ceni između isolate i concentrate u Srbiji?",
    a: "Na srpskom tržištu isolate uglavnom košta 20–40% više po kilogramu od concentrate iste marke. Ako treniraš rekreativno, ta razlika retko opravdava sebe — osim ako imaš specifičan razlog (laktoza, dijeta).",
  },
  {
    q: "Može li isolate da zameni obrok bolje od concentrate?",
    a: "Ne — ni jedan ni drugi nije dizajniran da zameni obrok. Oba su suplementi koji dopunjuju ishranu. Za zamenu obroka bolje su proteinske mešavine sa sporim i brzim proteinima, vlaknima i mastima.",
  },
];

const BASE = "https://proteinoteka.rs";
const SLUG = "/vodici/whey-isolate-vs-concentrate";
const WORDS = 640;
const READ_MIN = Math.ceil(WORDS / 200);

export default function Page() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Whey Isolate vs Concentrate — koja je razlika i šta da odabereš?",
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
        { "@type": "ListItem", position: 3, name: "Whey Isolate vs Concentrate", item: `${BASE}${SLUG}` },
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
            <span className="text-slate-600">Whey Isolate vs Concentrate</span>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-4">
              Whey Isolate vs Concentrate — koja je razlika i šta da odabereš?
            </h1>
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <span>{READ_MIN} min čitanja</span>
              <span>·</span>
              <span>Ažurirano: maj 2025.</span>
            </div>
          </div>

          {/* Intro */}
          <p className="text-lg text-slate-700 leading-relaxed mb-10 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
            Whey concentrate ima <strong className="text-slate-900">70–80% proteina</strong> i košta manje, dok whey isolate ima <strong className="text-slate-900">85–95% proteina</strong>, gotovo nema laktoze i skoro nikakve masti. Za većinu rekreativaca, concentrate je sasvim dovoljan. Isolate ima smisla ako si netolerantan na laktozu ili ako si u rigoroznoj fazi sušenja.
          </p>

          {/* Section 1 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Konkretna razlika u sastavu</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Whey concentrate prolazi kroz manje filtracionih koraka, pa zadržava više masti, ugljenih hidrata i laktoze — ali i neke bioaktivne frakcije (laktoferin, imunoglobulini) koje isolate gubi u procesu prečišćavanja.
              </p>
              <p>
                Tipičan concentrate ima oko 75g proteina na 100g, 4–8g ugljenih hidrata, 3–5g masti i 3–5g laktoze. Tipičan isolate ima 88–92g proteina na 100g, ispod 2g ugljenih hidrata, ispod 1g masti i manje od 0.5g laktoze. Razlika po porciji (30g) je mala u apsolutnim brojevima — možda 3–5g proteina više uz isolate.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Ko treba isolate, a ko concentrate</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                <strong className="text-slate-800">Isolate ima smisla za tebe ako:</strong> imaš intoleranciju na laktozu i posle šejka osetiš nadimanje ili nelagodu, ako si u fazi sušenja i brižljivo vodiš računa o svakom gramu masti i ugljenih hidrata, ili ako si takmičar koji optimizuje ishranu do detalja.
              </p>
              <p>
                <strong className="text-slate-800">Concentrate je dovoljan ako:</strong> treiraš rekreativno ili čak poluprofesionalno bez intolerancije na laktozu, jede zdravo i nisi u ekstremnoj dijeti. Razlika u rezultatima između isolate i concentrate proteina u normalnoj upotrebi praktično ne postoji — to potvrđuju i istraživanja koja direktno porede ova dva tipa.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Razlika u ceni na srpskom tržištu</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                Gledajući aktuelne cene na Proteinoteka.rs, dobri whey concentrate proteini kreću se od oko <strong className="text-slate-900">4.000–7.000 RSD za 2kg</strong>, dok isolate iste veličine pakovanja košta <strong className="text-slate-900">6.000–11.000 RSD</strong>. Po gramu proteina, isolate je skuplje 20–40%.
              </p>
              <p>
                Ako trošiš jedan 2kg paket mesečno i prelazis na isolate bez konkretnog razloga, to je 2.000–4.000 RSD razlike mesečno — oko 25.000–50.000 RSD godišnje za istu količinu proteina. Lep novac za razliku koju verovatno nećeš ni osetiti u treningu.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Praktična preporuka za različite budžete</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
              <p>
                <strong className="text-slate-800">Ograničen budžet:</strong> Uzmi dobar whey concentrate — npr. Scitec 100% Whey Protein ili MyProtein Impact Whey. Dobijaš solidnih 70–78g proteina na 100g i to je sasvim dovoljno.
              </p>
              <p>
                <strong className="text-slate-800">Srednji budžet ili laktoza:</strong> Whey isolate od proverenog brenda (Optimum Nutrition Gold Standard Isolate, Dymatize ISO100) rešava laktozu i daje viši sadržaj proteina po porciji.
              </p>
              <p>
                <strong className="text-slate-800">Ne tražiš kompromis:</strong> Hidrolizat whey proteina je najbrže apsorbovan i najskuplji — ali nauka ne pokazuje značajnu prednost nad izolatom u rekreativnoj upotrebi.
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
              <Link href="/kategorija/whey-isolate?sort=valueScore,desc" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Svi Whey Isolate proteini
              </Link>
              <Link href="/kategorija/whey-concentrate?sort=valueScore,desc" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Svi Whey Concentrate proteini
              </Link>
              <Link href="/vodici/koliko-proteina-dnevno" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Koliko proteina dnevno?
              </Link>
              <Link href="/vodici/kada-piti-protein" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                Kada piti protein?
              </Link>
            </div>
          </section>

          {/* CTA */}
          <div className="bg-[#1B2B4B] rounded-2xl p-6 text-white text-center">
            <p className="text-base leading-relaxed mb-4">
              Uporedi sve isolate i concentrate proteine dostupne u Srbiji — sortirane po ceni i gramu proteina.
            </p>
            <Link
              href="/kategorija/whey-isolate?sort=valueScore,desc"
              className="inline-block px-6 py-3 bg-[#FF9900] hover:bg-[#e68a00] text-[#131921] font-bold rounded-xl text-sm transition-colors"
            >
              Pogledaj whey isolate proteine
            </Link>
          </div>

        </main>
      </div>
    </>
  );
}
