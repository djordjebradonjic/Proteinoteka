import { CURRENT_MARKET, MARKET_CONFIG } from "@/lib/marketConfig";
import { hreflangAlternates } from "@/lib/hreflang";
import { fetchBlackFridayProducts } from "@/lib/seo-data";
import { productUrl } from "@/lib/productUrl";
import { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import FeaturedPriceDropCard from "@/components/FeaturedPriceDropCard";

const IS_HR = CURRENT_MARKET === "hr";
const BASE = `https://${MARKET_CONFIG[CURRENT_MARKET].domain}`;
const SLUG = "/crni-petak";

export const revalidate = 21600;

const YEAR = new Date().getFullYear();

// Black Friday is the Friday after the 4th Thursday of November (US Thanksgiving
// convention, also used by EU/Balkan retailers) — equivalent to the last Friday
// of November in every year this runs.
function lastFridayOfNovember(year: number): Date {
  const d = new Date(year, 11, 0); // day 0 of December = last day of November
  while (d.getDay() !== 5) d.setDate(d.getDate() - 1);
  return d;
}

const BLACK_FRIDAY_DATE = lastFridayOfNovember(YEAR);
const BLACK_FRIDAY_DATE_LABEL = BLACK_FRIDAY_DATE.toLocaleDateString(
  IS_HR ? "hr-HR" : "sr-Latn",
  { day: "numeric", month: "long", year: "numeric" }
);

export const metadata: Metadata = {
  title: IS_HR
    ? `Black Friday ${YEAR} — najveći popusti na proteine`
    : `Crni petak ${YEAR} — najveći popusti na proteine`,
  description: IS_HR
    ? `Pratimo cijene proteina uživo i izdvajamo proizvode s najvećim popustom u odnosu na prosječnu cijenu zadnjih 90 dana — za Black Friday ${YEAR} (${BLACK_FRIDAY_DATE_LABEL}) i tijekom cijele godine.`
    : `Pratimo cene proteina uživo i izdvajamo proizvode sa najvećim popustom u odnosu na prosečnu cenu poslednjih 90 dana — za Crni petak ${YEAR} (${BLACK_FRIDAY_DATE_LABEL}) i tokom cele godine.`,
  alternates: {
    canonical: `${BASE}${SLUG}`,
    languages: hreflangAlternates(SLUG),
  },
  openGraph: {
    title: IS_HR ? `Black Friday ${YEAR} — Proteinoteka` : `Crni petak ${YEAR} — Proteinoteka`,
    description: IS_HR
      ? "Proizvodi s najvećim realnim popustom u odnosu na prosječnu cijenu zadnjih 90 dana."
      : "Proizvodi sa najvećim realnim popustom u odnosu na prosečnu cenu poslednjih 90 dana.",
    url: `${BASE}${SLUG}`,
    siteName: "Proteinoteka",
    locale: MARKET_CONFIG[CURRENT_MARKET].ogLocale,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: IS_HR ? `Black Friday ${YEAR} — Proteinoteka` : `Crni petak ${YEAR} — Proteinoteka`,
    description: IS_HR
      ? "Proizvodi s najvećim realnim popustom u odnosu na prosječnu cijenu zadnjih 90 dana."
      : "Proizvodi sa najvećim realnim popustom u odnosu na prosečnu cenu poslednjih 90 dana.",
  },
};

const FAQS = IS_HR
  ? [
      {
        q: `Kada je Black Friday ${YEAR}?`,
        a: `Black Friday ${YEAR} pada ${BLACK_FRIDAY_DATE_LABEL}. Ova stranica ne ovisi o tom datumu — popusti koje vidiš ovdje se ažuriraju tijekom cijele godine, a ne samo tog dana.`,
      },
      {
        q: "Kako Proteinoteka računa da je popust stvaran?",
        a: "Uspoređujemo trenutnu cijenu s prosječnom cijenom zadnjih 90 dana za taj proizvod u toj trgovini, na temelju povijesti cijena koju redovito bilježimo. Time izbjegavamo lažne popuste koje neke trgovine kreiraju umjetnim dizanjem cijene neposredno prije akcije.",
      },
      {
        q: "Zašto ne postoji arhiva prošlih Black Friday akcija?",
        a: "Arhivu gradimo isključivo od stvarno zabilježenih podataka — ne izmišljamo brojke. Kad prikupimo prvu punu sezonu popusta, arhiva će se pojaviti ovdje.",
      },
      {
        q: "Mogu li dobiti obavijest kad cijena pojedinog proizvoda padne?",
        a: "Da — na stranici proizvoda klikni na ikonu zvona da postaviš cjenovni alarm i dobit ćeš email obavijest čim cijena padne.",
      },
    ]
  : [
      {
        q: `Kada je Crni petak ${YEAR}?`,
        a: `Crni petak ${YEAR} pada ${BLACK_FRIDAY_DATE_LABEL}. Ova stranica ne zavisi od tog datuma — popusti koje vidiš ovde se ažuriraju tokom cele godine, ne samo tog dana.`,
      },
      {
        q: "Kako Proteinoteka računa da je popust realan?",
        a: "Upoređujemo trenutnu cenu sa prosečnom cenom poslednjih 90 dana za taj proizvod u toj prodavnici, na osnovu istorije cena koju redovno beležimo. Time izbegavamo lažne popuste koje neke prodavnice prave veštačkim dizanjem cene neposredno pre akcije.",
      },
      {
        q: "Zašto ne postoji arhiva prošlih akcija Crnog petka?",
        a: "Arhivu gradimo isključivo od stvarno zabeleženih podataka — ne izmišljamo brojke. Kada prikupimo prvu punu sezonu popusta, arhiva će se pojaviti ovde.",
      },
      {
        q: "Mogu li da dobijem obaveštenje kada cena određenog proizvoda padne?",
        a: "Da — na stranici proizvoda klikni na ikonu zvona da postaviš cenovni alarm i dobićeš email obaveštenje čim cena padne.",
      },
    ];

export default async function CrniPetakPage() {
  const deals = await fetchBlackFridayProducts(20);

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Početna", item: BASE },
      { "@type": "ListItem", position: 2, name: IS_HR ? "Black Friday" : "Crni petak", item: `${BASE}${SLUG}` },
    ],
  };

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: IS_HR ? `Black Friday ${YEAR} popusti na proteine` : `Crni petak ${YEAR} popusti na proteine`,
    description: IS_HR
      ? "Proizvodi s najvećim popustom u odnosu na prosječnu cijenu zadnjih 90 dana."
      : "Proizvodi sa najvećim popustom u odnosu na prosečnu cenu poslednjih 90 dana.",
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
            <span className="text-slate-600">{IS_HR ? "Black Friday" : "Crni petak"}</span>
          </nav>

          {/* H1 */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full bg-red-50 border border-red-100">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <span className="text-xs font-bold text-red-600 uppercase tracking-wide">
                {IS_HR ? `Ove godine: ${BLACK_FRIDAY_DATE_LABEL}` : `Ove godine: ${BLACK_FRIDAY_DATE_LABEL}`}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-3">
              {IS_HR ? `Black Friday ${YEAR} — popusti na proteine` : `Crni petak ${YEAR} — popusti na proteine`}
            </h1>
            <p className="text-lg text-slate-500 max-w-2xl">
              {IS_HR
                ? "Uživo pratimo cijene i izdvajamo proizvode s najvećim realnim popustom u odnosu na prosjek zadnjih 90 dana."
                : "Uživo pratimo cene i izdvajamo proizvode sa najvećim realnim popustom u odnosu na prosek poslednjih 90 dana."}
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
                  ? "Trenutno nema proizvoda sa značajnim popustom u odnosu na prosjek zadnjih 90 dana. Vratite se uskoro."
                  : "Trenutno nema proizvoda sa značajnim popustom u odnosu na prosek poslednjih 90 dana. Vratite se uskoro."}
              </div>
            )}
          </section>

          {/* Methodology explainer (no invented archive) */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Kako računamo popust</h2>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3 text-[15px] text-slate-700 leading-relaxed">
              <p>
                {IS_HR
                  ? "Za svaki proizvod pratimo povijest cijena iz svih trgovina koje redovito skeniramo. Popust ovdje ne računamo u odnosu na jučerašnju cijenu, nego u odnosu na prosječnu cijenu zadnjih 90 dana — tako izbjegavamo lažne 'popuste' koji nastaju kad trgovina umjetno digne pa spusti cijenu neposredno prije akcije."
                  : "Za svaki proizvod pratimo istoriju cena iz svih prodavnica koje redovno skeniramo. Popust ovde ne računamo u odnosu na jučerašnju cenu, već u odnosu na prosečnu cenu poslednjih 90 dana — tako izbegavamo lažne 'popuste' koji nastaju kad prodavnica veštački digne pa spusti cenu neposredno pre akcije."}
              </p>
              <p className="text-[13px] text-slate-500">
                {IS_HR
                  ? "Ova stranica ostaje trajno dostupna i izvan sezone Black Fridaya — cijene se ažuriraju tijekom cijele godine. Arhivu prošlih akcija gradimo iz stvarno zabilježenih podataka, pa se pojavljuje ovdje čim prikupimo prvu punu sezonu."
                  : "Ova stranica ostaje trajno dostupna i van sezone Crnog petka — cene se ažuriraju tokom cele godine. Arhivu prošlih akcija gradimo iz stvarno zabeleženih podataka, pa se pojavljuje ovde čim prikupimo prvu punu sezonu."}
              </p>
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
                ? "Ne čekaj Black Friday — postavi cjenovni alarm na proizvodu koji te zanima i saznaj prvi kad cijena stvarno padne."
                : "Ne čekaj Crni petak — postavi cenovni alarm na proizvodu koji te zanima i saznaj prvi kada cena stvarno padne."}
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
