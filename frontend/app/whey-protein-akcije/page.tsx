import { CURRENT_MARKET, MARKET_CONFIG } from "@/lib/marketConfig";
import { hreflangAlternates } from "@/lib/hreflang";
import { fetchPriceDropProducts } from "@/lib/seo-data";
import { productUrl } from "@/lib/productUrl";
import { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import FeaturedPriceDropCard from "@/components/FeaturedPriceDropCard";

const IS_HR = CURRENT_MARKET === "hr";
const BASE = `https://${MARKET_CONFIG[CURRENT_MARKET].domain}`;
const SLUG = "/whey-protein-akcije";

export const revalidate = 21600;

export const metadata: Metadata = {
  title: IS_HR
    ? { absolute: "Whey protein akcije — proteini na sniženju uživo | Proteinoteka" }
    : { absolute: "Whey protein akcije — proteini na sniženju uživo | Proteinoteka" },
  description: IS_HR
    ? "Proteini kojima je cijena stvarno pala — pratimo povijest cijena u svim trgovinama i izdvajamo aktualna sniženja u odnosu na prosjek zadnjih 90 dana. Ažurira se cijele godine."
    : "Proteini kojima je cena stvarno pala — pratimo istoriju cena u svim prodavnicama i izdvajamo aktuelna sniženja u odnosu na prosek poslednjih 90 dana. Ažurira se cele godine.",
  alternates: {
    canonical: `${BASE}${SLUG}`,
    languages: hreflangAlternates(SLUG),
  },
  openGraph: {
    title: IS_HR ? "Whey protein akcije — Proteinoteka" : "Whey protein akcije — Proteinoteka",
    description: IS_HR
      ? "Proteini kojima je cijena stvarno pala u odnosu na prosjek zadnjih 90 dana."
      : "Proteini kojima je cena stvarno pala u odnosu na prosek poslednjih 90 dana.",
    url: `${BASE}${SLUG}`,
    siteName: "Proteinoteka",
    locale: MARKET_CONFIG[CURRENT_MARKET].ogLocale,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: IS_HR ? "Whey protein akcije — Proteinoteka" : "Whey protein akcije — Proteinoteka",
    description: IS_HR
      ? "Proteini kojima je cijena stvarno pala u odnosu na prosjek zadnjih 90 dana."
      : "Proteini kojima je cena stvarno pala u odnosu na prosek poslednjih 90 dana.",
  },
};

const FAQS = IS_HR
  ? [
      {
        q: "Kako znate da je akcija stvarna, a ne lažni popust?",
        a: "Za svaki proizvod bilježimo povijest cijena u svim trgovinama koje redovito skeniramo. Sniženje računamo u odnosu na prosječnu cijenu zadnjih 90 dana, ne u odnosu na jučerašnju — tako otpadaju lažni popusti koje neke trgovine kreiraju umjetnim dizanjem cijene neposredno prije akcije.",
      },
      {
        q: "Odnosi li se ovo samo na whey protein?",
        a: "Ovdje izdvajamo proteine kojima je cijena pala, s naglaskom na whey jer je najtraženiji. Ako te zanima konkretan tip, pogledaj kategorije whey izolat, kazein ili biljni protein — svaka ima svoju cjenovnu usporedbu.",
      },
      {
        q: "Koliko se često osvježava popis?",
        a: "Cijene se osvježavaju kontinuirano kako skeniramo trgovine, a ova stranica se regenerira svakih nekoliko sati. Za razliku od sezonskih akcija, dostupna je cijele godine.",
      },
      {
        q: "Mogu li dobiti obavijest kad cijena padne?",
        a: "Da — na stranici proizvoda klikni na ikonu zvona da postaviš cjenovni alarm i dobit ćeš email čim cijena padne ispod tvoje granice.",
      },
    ]
  : [
      {
        q: "Kako znate da je akcija realna, a ne lažni popust?",
        a: "Za svaki proizvod beležimo istoriju cena u svim prodavnicama koje redovno skeniramo. Sniženje računamo u odnosu na prosečnu cenu poslednjih 90 dana, ne u odnosu na jučerašnju — tako otpadaju lažni popusti koje neke prodavnice prave veštačkim dizanjem cene neposredno pre akcije.",
      },
      {
        q: "Da li se ovo odnosi samo na whey protein?",
        a: "Ovde izdvajamo proteine kojima je cena pala, s naglaskom na whey jer je najtraženiji. Ako te zanima konkretan tip, pogledaj kategorije whey izolat, kazein ili biljni protein — svaka ima svoje poređenje cena.",
      },
      {
        q: "Koliko često se osvežava lista?",
        a: "Cene se osvežavaju kontinuirano kako skeniramo prodavnice, a ova stranica se regeneriše na svakih nekoliko sati. Za razliku od sezonskih akcija, dostupna je tokom cele godine.",
      },
      {
        q: "Mogu li da dobijem obaveštenje kada cena padne?",
        a: "Da — na stranici proizvoda klikni na ikonu zvona da postaviš cenovni alarm i dobićeš email čim cena padne ispod tvoje granice.",
      },
    ];

export default async function WheyProteinAkcijePage() {
  const deals = await fetchPriceDropProducts(24);

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Početna", item: BASE },
      { "@type": "ListItem", position: 2, name: IS_HR ? "Akcije" : "Akcije", item: `${BASE}${SLUG}` },
    ],
  };

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: IS_HR ? "Whey protein akcije" : "Whey protein akcije",
    description: IS_HR
      ? "Proteini kojima je cijena pala u odnosu na prosjek zadnjih 90 dana."
      : "Proteini kojima je cena pala u odnosu na prosek poslednjih 90 dana.",
    numberOfItems: deals.length,
    itemListElement: deals.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Product",
        name: p.name,
        brand: p.brand ?? undefined,
        url: `${BASE}${productUrl(p)}`,
        image: p.imageUrl || undefined,
        offers: {
          "@type": "Offer",
          price: p.numericPrice,
          priceCurrency: MARKET_CONFIG[CURRENT_MARKET].currency,
          availability: "https://schema.org/InStock",
          url: `${BASE}${productUrl(p)}`,
        },
      },
    })),
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };

  const jsonLd = [breadcrumbJsonLd, itemListJsonLd, faqJsonLd];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-10">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-8 flex-wrap">
            <Link href="/" className="hover:text-[#FF9900] transition-colors">Početna</Link>
            <span>/</span>
            <span className="text-slate-600">{IS_HR ? "Akcije" : "Akcije"}</span>
          </nav>

          {/* H1 */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full bg-green-50 border border-green-100">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-xs font-bold text-green-700 uppercase tracking-wide">
                {IS_HR ? "Uživo — cijele godine" : "Uživo — cele godine"}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-3">
              {IS_HR ? "Whey protein akcije" : "Whey protein akcije"}
            </h1>
            <p className="text-lg text-slate-500 max-w-2xl">
              {IS_HR
                ? "Proteini kojima je cijena stvarno pala. Uspoređujemo trenutnu cijenu s prosjekom zadnjih 90 dana i izdvajamo prava sniženja iz svih trgovina — bez lažnih popusta."
                : "Proteini kojima je cena stvarno pala. Upoređujemo trenutnu cenu sa prosekom poslednjih 90 dana i izdvajamo prava sniženja iz svih prodavnica — bez lažnih popusta."}
            </p>
          </div>

          {/* Deals grid */}
          <section className="mb-12">
            {deals.length ? (
              <div className="flex flex-wrap gap-4">
                {deals.map((p) => (
                  <FeaturedPriceDropCard key={p.id} product={p} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
                {IS_HR
                  ? "Trenutno nema proteina sa značajnim sniženjem u odnosu na prosjek zadnjih 90 dana. Vrati se uskoro — lista se osvježava tijekom cijele godine."
                  : "Trenutno nema proteina sa značajnim sniženjem u odnosu na prosek poslednjih 90 dana. Vrati se uskoro — lista se osvežava tokom cele godine."}
              </div>
            )}
          </section>

          {/* Methodology */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 mb-4">{IS_HR ? "Kako računamo sniženje" : "Kako računamo sniženje"}</h2>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3 text-[15px] text-slate-700 leading-relaxed">
              <p>
                {IS_HR
                  ? "Većina 'akcija' na internetu poredi se s cijenom od jučer, što ništa ne govori. Mi umjesto toga uspoređujemo trenutnu cijenu s prosječnom cijenom tog proizvoda u toj trgovini kroz zadnjih 90 dana. Sniženje je stvarno samo ako je trenutna cijena osjetno ispod tog prosjeka."
                  : "Većina 'akcija' na internetu poredi se sa cenom od juče, što ništa ne govori. Mi umesto toga upoređujemo trenutnu cenu sa prosečnom cenom tog proizvoda u toj prodavnici kroz poslednjih 90 dana. Sniženje je realno samo ako je trenutna cena osetno ispod tog proseka."}
              </p>
              <p>
                {IS_HR
                  ? "Budući da pratimo cijene u više trgovina istovremeno, vidiš i je li isti proizvod jeftiniji negdje drugdje — a ne samo je li 'na akciji' u jednoj trgovini."
                  : "Pošto pratimo cene u više prodavnica istovremeno, vidiš i da li je isti proizvod jeftiniji negde drugde — a ne samo da li je 'na akciji' u jednoj prodavnici."}
              </p>
            </div>
          </section>

          {/* Related links */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 mb-4">{IS_HR ? "Povezano" : "Povezano"}</h2>
            <div className="flex flex-wrap gap-3">
              <Link href={IS_HR ? "/najjeftiniji-whey-protein-hrvatska" : "/najjeftiniji-whey-protein"} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                {IS_HR ? "Najjeftiniji whey protein" : "Najjeftiniji whey protein"}
              </Link>
              <Link href={IS_HR ? "/najbolji-whey-protein-hrvatska" : "/najbolji-whey-protein-srbija"} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                {IS_HR ? "Najbolji whey protein" : "Najbolji whey protein"}
              </Link>
              <Link href="/crni-petak" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
                {IS_HR ? "Black Friday popusti" : "Crni petak popusti"}
              </Link>
            </div>
          </section>

          {/* FAQ */}
          <section className="mb-10">
            <h2 className="text-xl font-extrabold text-slate-900 mb-4">Česta pitanja</h2>
            <div className="space-y-3">
              {FAQS.map((faq, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-xl p-5">
                  <h3 className="font-bold text-slate-900 text-sm mb-2">{faq.q}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Bottom CTA */}
          <div className="bg-[#131921] text-white rounded-2xl p-6 text-center">
            <p className="text-base leading-relaxed mb-4">
              {IS_HR
                ? "Ne moraš čekati akciju — postavi cjenovni alarm na proizvodu koji te zanima i saznaj prvi kad cijena padne."
                : "Ne moraš da čekaš akciju — postavi cenovni alarm na proizvodu koji te zanima i saznaj prvi kada cena padne."}
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-[#FF9900] hover:bg-[#e68a00] text-[#131921] font-bold rounded-xl text-sm transition-colors"
            >
              {IS_HR ? "Pregledaj sve proteine →" : "Pregledaj sve proteine →"}
            </Link>
          </div>

        </main>
      </div>
    </>
  );
}
