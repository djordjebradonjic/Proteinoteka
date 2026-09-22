import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import CreatineListing from "@/components/creatine/CreatineListing";
import CreatineExtras from "@/components/creatine/CreatineExtras";
import CreatineHeroSection from "@/components/creatine/CreatineHeroSection";
import CreatineFeaturedSection from "@/components/creatine/CreatineFeaturedSection";
import { CURRENT_MARKET, MARKET_CONFIG } from "@/lib/marketConfig";
import { hreflangAlternates } from "@/lib/hreflang";
import { safeJsonLd } from "@/lib/jsonLd";
import { productUrl } from "@/lib/productUrl";
import { CREATINE_COPY, CREATINE_PATH } from "@/lib/creatine";
import { fetchCreatinePage, fetchCreatineTopRatedProducts, fetchCreatinePriceDropProducts } from "@/lib/creatine-data";

export const revalidate = 21600;

const MARKET = MARKET_CONFIG[CURRENT_MARKET];
const BASE = `https://${MARKET.domain}`;
const COPY = CREATINE_COPY;

// What the page shows before any filter is touched: powders, best value first. The client list starts from
// exactly this, so the server-rendered HTML and the first client render are the same.
const FIRST_PAGE = { form: "powder", sort: "valueScore,desc" } as const;

export async function generateMetadata(): Promise<Metadata> {
  const { totalItems } = await fetchCreatinePage(FIRST_PAGE);
  const url = `${BASE}${CREATINE_PATH}`;
  return {
    title: { absolute: COPY.page.title },
    description: COPY.page.description,
    keywords: COPY.page.keywords,
    alternates: { canonical: url, languages: hreflangAlternates(CREATINE_PATH) },
    // Until a market actually carries creatine (rollout, or a backend that does not know it yet) an empty list
    // must not be indexed.
    ...(totalItems === 0 && { robots: { index: false, follow: true } }),
    openGraph: {
      title: COPY.page.ogTitle,
      description: COPY.page.description,
      url,
      siteName: "Proteinoteka",
      locale: MARKET.ogLocale,
      type: "website",
    },
    twitter: { card: "summary_large_image", title: COPY.page.ogTitle, description: COPY.page.description },
  };
}

export default async function CreatinePage() {
  const [first, topRated, priceDrops] = await Promise.all([
    fetchCreatinePage(FIRST_PAGE),
    fetchCreatineTopRatedProducts(8),
    fetchCreatinePriceDropProducts(8),
  ]);
  const url = `${BASE}${CREATINE_PATH}`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: COPY.breadcrumbHome, item: BASE },
        { "@type": "ListItem", position: 2, name: COPY.navLabel, item: url },
      ],
    },
    ...(first.content.length > 0
      ? [{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: COPY.page.schemaName,
          numberOfItems: first.content.length,
          itemListElement: first.content.map((p, i) => ({
            "@type": "ListItem",
            position: i + 1,
            item: {
              "@type": "Product",
              name: p.name,
              ...(p.brand && { brand: { "@type": "Brand", name: p.brand } }),
              ...(p.imageUrl && { image: p.imageUrl }),
              url: `${BASE}${productUrl(p)}`,
              offers: {
                "@type": "Offer",
                price: p.numericPrice,
                priceCurrency: MARKET.currency,
                availability: "https://schema.org/InStock",
                url: `${BASE}${productUrl(p)}`,
              },
            },
          })),
        }]
      : []),
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: COPY.guide.faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <main className="min-h-screen bg-white">
        <Header hasHero />

        <CreatineHeroSection />

        <div id="izdvojeno-kreatin" style={{ scrollMarginTop: "80px" }}>
          <CreatineFeaturedSection topRatedProducts={topRated} priceDropProducts={priceDrops} />
        </div>

        <CreatineListing
          initialProducts={first.content}
          initialTotalPages={first.totalPages}
          initialTotalItems={first.totalItems}
        />

        <section className="bg-slate-50 border-t border-slate-100">
          <div className="max-w-3xl mx-auto px-4 py-12 md:py-16">
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-8">{COPY.guide.title}</h2>
            <div className="space-y-8">
              {COPY.guide.sections.map((s) => (
                <div key={s.h}>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{s.h}</h3>
                  <p className="text-[15px] leading-[1.75] text-slate-700">{s.p}</p>
                </div>
              ))}
            </div>
            <p className="mt-8 text-sm">
              <Link href="/kako-racunamo-value-score" className="font-semibold text-[#FF9900] hover:underline">
                {COPY.product.scoreLink} →
              </Link>
            </p>

            <h2 className="text-2xl font-extrabold text-slate-900 mt-14 mb-5">Česta pitanja</h2>
            <div className="space-y-3">
              {COPY.guide.faq.map((f) => (
                <div key={f.q} className="bg-white border border-slate-200 rounded-xl p-5">
                  <h3 className="font-bold text-slate-900 text-sm mb-2">{f.q}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{f.a}</p>
                </div>
              ))}
            </div>

            <aside className="mt-10 p-4 bg-slate-100 rounded-xl border border-slate-200">
              <p className="text-[12px] text-slate-500 leading-relaxed">
                <strong className="text-slate-600">Napomena:</strong> {COPY.guide.disclaimer}
              </p>
            </aside>
          </div>
        </section>

        <CreatineExtras />
      </main>
    </>
  );
}
