import Link from "next/link";
import Image from "next/image";
import { Product } from "@/types/product";
import { productUrl } from "@/lib/productUrl";
import PriceTag from "@/components/PriceTag";
import Header from "@/components/Header";
import { SEOProductCard } from "./SEOProductCard";
import { getScoreColor } from "@/lib/scoreColor";
import { CURRENT_MARKET, MARKET_CONFIG } from "@/lib/marketConfig";

const IS_HR = CURRENT_MARKET === "hr";
const BASE_URL_CONST = `https://${MARKET_CONFIG[CURRENT_MARKET].domain}`;

const RS_SEO_PAGES = [
  { slug: "najbolji-whey-protein-srbija",  label: "🥇 Najbolji Whey"        },
  { slug: "najjeftiniji-whey-protein",     label: "💰 Najjeftiniji Whey (po kg)" },
  { slug: "whey-protein-cena",             label: "📊 Whey Protein Cena"     },
  { slug: "whey-isolate-srbija",           label: "✨ Whey Izolat"           },
  { slug: "protein-za-masu",              label: "💪 Protein za Masu"       },
  { slug: "whey-protein-do-3000-dinara",  label: "🏷️ Whey do 3000 RSD"     },
  { slug: "whey-protein-do-5000-dinara",  label: "🏷️ Whey do 5000 RSD"     },
] as const;

const HR_SEO_PAGES = [
  { slug: "najbolji-whey-protein-hrvatska",              label: "🥇 Najbolji Whey"       },
  { slug: "najjeftiniji-whey-protein-hrvatska",          label: "💰 Najjeftiniji Whey (po kg)" },
  { slug: "najjeftiniji-whey-protein-hrvatska-do-500g",    label: "📦 Whey do 500g"      },
  { slug: "najjeftiniji-whey-protein-hrvatska-1500g-2500g", label: "📦 Whey 1.5–2.5kg"  },
  { slug: "najjeftiniji-whey-protein-hrvatska-2500g-3500g", label: "📦 Whey 3kg"         },
  { slug: "najjeftiniji-whey-protein-hrvatska-3500g-4500g", label: "📦 Whey 4kg"         },
  { slug: "najjeftiniji-whey-protein-hrvatska-4500g-plus",  label: "📦 Whey 5kg+"        },
  { slug: "whey-protein-cijena",                         label: "📊 Whey Protein Cijena" },
  { slug: "whey-isolate-hrvatska",                       label: "✨ Whey Izolat"         },
  { slug: "biljni-protein-hrvatska",                     label: "🌿 Biljni Protein"      },
  { slug: "whey-protein-do-20-eura",                     label: "🏷️ Whey do 20 EUR"     },
  { slug: "whey-protein-do-40-eura",                     label: "🏷️ Whey do 40 EUR"     },
] as const;

const SEO_PAGES = IS_HR ? HR_SEO_PAGES : RS_SEO_PAGES;

// ── Sub-components (inlined, no extra files) ──────────────────────────────────

function QuickAnswer({ text }: { text: string }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
      <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-2">💡 Kratki odgovor</p>
      <p className="text-sm text-slate-800 leading-relaxed">{text}</p>
    </div>
  );
}

function CompareShortcut({ products }: { products: Product[] }) {
  const top3 = products.slice(0, 3);
  const medals = ["🥇", "🥈", "🥉"];
  return (
    <div className="bg-[#131921] text-white rounded-xl p-6">
      <h2 className="text-lg font-extrabold mb-1">{IS_HR ? "Usporedi najisplativije opcije" : "Uporedi najisplativije opcije"}</h2>
      <p className="text-slate-400 text-sm mb-5">{IS_HR ? "Postavi ih jedne pored druge — cijena, proteini i score na jednom mjestu." : "Postavi ih jedne pored druge — cena, proteini i score na jednom mestu."}</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        {top3.map((p, i) => (
          <Link
            key={p.id}
            href={productUrl(p)}
            className="bg-white/10 hover:bg-white/20 rounded-lg p-4 text-center transition-colors flex flex-col items-center"
          >
            {p.imageUrl ? (
              <div className="w-20 h-20 mb-2 flex items-center justify-center bg-white/10 rounded-lg p-1">
                <Image
                  src={p.imageUrl}
                  alt={p.name}
                  width={80}
                  height={80}
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            ) : (
              <div className="text-2xl mb-2">{medals[i]}</div>
            )}
            <div className="text-lg mb-1">{medals[i]}</div>
            <p className="text-xs font-semibold line-clamp-2 leading-snug mb-2">{p.name}</p>
            <p className="text-base font-black text-[#FF9900]">{p.price}</p>
            {p.valueScore != null && (
              <p className="text-[10px] text-slate-400 mt-1">⚡ {p.valueScore.toFixed(1)}/10</p>
            )}
          </Link>
        ))}
      </div>
      <div className="text-center">
        <Link
          href={`/compare?ids=${top3.map(p => p.id).join(",")}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF9900] text-[#131921] font-bold text-sm hover:bg-[#e68a00] transition-colors"
        >
          {IS_HR ? "Otvori usporedbu →" : "Otvori poređenje →"}
        </Link>
      </div>
    </div>
  );
}

function ProductTable({ products, caption }: { products: Product[]; caption: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="text-base font-bold text-slate-900">{caption}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wide">#</th>
              <th className="text-left py-3 pr-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Proizvod</th>
              <th className="text-right py-3 pr-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">{IS_HR ? "Cijena" : "Cena"}</th>
              <th className="text-right py-3 pr-4 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Gramaža</th>
              <th className="text-right py-3 pr-4 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Protein</th>
              <th className="text-right py-3 pr-4 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Score</th>
              <th className="text-right py-3 pr-5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Akcija</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p, i) => (
              <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="py-3 px-5 text-slate-400 text-xs font-medium">{i + 1}</td>
                <td className="py-3 pr-4">
                  <div className="font-medium text-slate-900 line-clamp-1 max-w-[200px] sm:max-w-xs">{p.name}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{p.brand} · {p.storeName}</div>
                </td>
                <td className="py-3 pr-4 text-right font-bold text-slate-900 whitespace-nowrap">{p.price}</td>
                <td className="py-3 pr-4 text-right text-slate-600 hidden sm:table-cell">
                  {p.primaryWeightGrams != null
                    ? p.primaryWeightGrams < 1000
                      ? `${p.primaryWeightGrams}g`
                      : `${+(p.primaryWeightGrams / 1000).toFixed(2).replace(/\.?0+$/, "")}kg`
                    : "—"}
                </td>
                <td className="py-3 pr-4 text-right text-slate-600 hidden sm:table-cell">
                  {p.proteinPer100g != null ? `${p.proteinPer100g}g` : "—"}
                </td>
                <td className="py-3 pr-4 text-right hidden sm:table-cell">
                  {p.valueScore != null ? (
                    <span className="font-bold text-xs" style={{ color: getScoreColor(p.valueScore) }}>
                      {p.valueScore.toFixed(1)}
                    </span>
                  ) : "—"}
                </td>
                <td className="py-3 pr-5 text-right">
                  <Link
                    href={productUrl(p)}
                    className="text-xs font-bold text-[#FF9900] hover:underline whitespace-nowrap"
                  >
                    Pogledaj →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DecisionSummary({ products }: { products: Product[] }) {
  if (products.length === 0) return null;

  const bestValue = [...products].sort((a, b) => (b.valueScore ?? 0) - (a.valueScore ?? 0))[0];
  const cheapest  = [...products].sort((a, b) => (a.numericPrice ?? 0) - (b.numericPrice ?? 0))[0];
  const withRatio = products
    .filter(p => p.proteinPer100g && p.primaryWeightGrams && p.numericPrice)
    .map(p => ({ ...p, ratio: ((p.proteinPer100g! / 100) * p.primaryWeightGrams!) / p.numericPrice! }));
  const bestRatio = withRatio.length > 0 ? [...withRatio].sort((a, b) => b.ratio - a.ratio)[0] : null;

  const cards: { icon: string; label: string; product: Product | null; extra?: string }[] = [
    { icon: "⭐", label: "Najbolji value score", product: bestValue,    extra: bestValue?.valueScore != null ? `Score: ${bestValue.valueScore.toFixed(1)}/10` : undefined },
    { icon: "💰", label: "Najjeftiniji",         product: cheapest,     extra: undefined },
    { icon: "⚡", label: IS_HR ? "Najviše proteina/EUR" : "Najviše proteina/RSD", product: bestRatio ?? null, extra: bestRatio?.proteinPer100g != null ? `${bestRatio.proteinPer100g}g/100g` : undefined },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {cards.map(({ icon, label, product, extra }) =>
        product ? (
          <Link
            key={label}
            href={productUrl(product)}
            className="bg-white border border-slate-200 rounded-xl p-4 hover:border-[#FF9900] hover:shadow-md transition-all duration-150 flex flex-col"
          >
            <div className="text-xl mb-1">{icon}</div>
            <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wide mb-1">{label}</div>
            <div className="font-bold text-sm text-slate-900 line-clamp-2 leading-snug flex-1">{product.name}</div>
            <div className="mt-2 flex items-center justify-between flex-wrap gap-1">
              <PriceTag price={product.numericPrice} className="text-base font-black text-[#FF9900]" currencyClassName="text-[0.7em] font-medium text-[#FF9900] opacity-70 ml-1" />
              {extra && <span className="text-[10px] text-slate-400">{extra}</span>}
            </div>
          </Link>
        ) : null,
      )}
    </div>
  );
}

export interface PageFAQ { q: string; a: string; }

function FAQSection({ faqs }: { faqs: PageFAQ[] }) {
  return (
    <section>
      <h2 className="text-xl font-extrabold text-slate-900 mb-4">Česta pitanja</h2>
      <div className="space-y-3">
        {faqs.map((faq, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="font-bold text-slate-900 text-sm mb-2">{faq.q}</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{faq.a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function CrossLinks({ currentSlug, extraLinks }: { currentSlug: string; extraLinks?: { href: string; label: string }[] }) {
  return (
    <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
      <h3 className="text-sm font-bold text-slate-700 mb-3">Istraži i ostale vodiče:</h3>
      <div className="flex flex-wrap gap-2">
        {SEO_PAGES.filter(p => p.slug !== currentSlug).map(page => (
          <Link
            key={page.slug}
            href={`/${page.slug}`}
            className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-all"
          >
            {page.label}
          </Link>
        ))}
        {extraLinks?.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-all"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

// ── Main template ─────────────────────────────────────────────────────────────

export interface SEOLandingPageProps {
  h1: string;
  intro: string;
  quickAnswer: string;
  products: Product[];
  tableCaption: string;
  listHeading: string;
  currentSlug: string;
  faqs?: PageFAQ[];
  extraLinks?: { href: string; label: string }[];
  disclaimer?: string;
  headerSection?: React.ReactNode;
  middleSection?: React.ReactNode;
}

const BASE_URL = BASE_URL_CONST;

export function SEOLandingPage({
  h1, intro, quickAnswer, products, tableCaption, listHeading, currentSlug,
  faqs, extraLinks, disclaimer, headerSection, middleSection,
}: SEOLandingPageProps) {
  const topCompareIds = products.slice(0, 3).map(p => p.id).join(",");
  const compareHref = topCompareIds ? `/compare?ids=${topCompareIds}` : "/compare";

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Početna", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: h1, item: `${BASE_URL}/${currentSlug}` },
    ],
  };

  const faqJsonLd = faqs ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(faq => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  } : null;

  const itemListJsonLd = products.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: h1,
    url: `${BASE_URL}/${currentSlug}`,
    numberOfItems: products.length,
    itemListElement: products.slice(0, 10).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: p.name,
      url: `${BASE_URL}${productUrl(p)}`,
      ...(p.imageUrl && { image: p.imageUrl }),
    })),
  } : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      {itemListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />
      )}
      <Header />

      {/* Hero */}
      <div className="bg-[#131921] text-white">
        <div className="max-w-4xl mx-auto px-4 py-10 sm:py-14">
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-5" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-[#FF9900] transition-colors">Početna</Link>
            <span>/</span>
            <span className="text-slate-300">{h1}</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-4 leading-tight">{h1}</h1>
          <p className="text-slate-300 text-base sm:text-lg max-w-2xl leading-relaxed">{intro}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

        {/* Header section (e.g. filter tabs) — shown above quick answer */}
        {headerSection}

        {/* Quick Answer */}
        {quickAnswer && <QuickAnswer text={quickAnswer} />}

        {/* Page-specific custom section (e.g. price breakdown table) */}
        {middleSection}

        {/* Decision summary — shown on extended pages (price-range, etc.) */}
        {faqs && products.length > 0 && <DecisionSummary products={products} />}

        {/* Product list */}
        {products.length > 0 && (
          <section>
            <h2 className="text-xl font-extrabold text-slate-900 mb-4">{listHeading}</h2>
            <div className="space-y-3">
              {products.slice(0, 8).map((p, i) => (
                <SEOProductCard key={p.id} product={p} rank={i + 1} priority={i === 0} />
              ))}
            </div>
          </section>
        )}

        {/* Compare shortcut */}
        {products.length >= 2 && <CompareShortcut products={products} />}

        {/* Table */}
        {products.length > 0 && (
          <ProductTable products={products.slice(0, 15)} caption={tableCaption} />
        )}

        {/* FAQ — extended pages only */}
        {faqs && <FAQSection faqs={faqs} />}

        {/* Disclaimer — extended pages only */}
        {disclaimer && (
          <p className="text-xs text-slate-400 text-center leading-relaxed">{disclaimer}</p>
        )}

        {/* Cross links */}
        <CrossLinks currentSlug={currentSlug} extraLinks={extraLinks} />

        {/* Bottom CTA */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 text-center shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-2">Istraži kompletnu ponudu</h2>
          <p className="text-slate-500 text-sm mb-5">
            {IS_HR
              ? "Pregledaj sve proteine i suplemente s aktualnim cijenama iz svih trgovina u Hrvatskoj."
              : "Pregledaj sve proteine i suplemente sa aktuelnim cenama iz svih prodavnica u Srbiji."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="px-6 py-3 rounded-xl bg-[#131921] text-white font-bold text-sm hover:bg-[#243860] transition-colors"
            >
              Pogledaj sve ponude
            </Link>
            <Link
              href={compareHref}
              className="px-6 py-3 rounded-xl border-2 border-[#FF9900] text-[#FF9900] font-bold text-sm hover:bg-amber-50 transition-colors"
            >
              {IS_HR ? "Usporedi cijene" : "Uporedi cene"}
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
