import Link from "next/link";
import { Product } from "@/types/product";
import { productUrl } from "@/lib/productUrl";
import PriceTag from "@/components/PriceTag";
import Header from "@/components/Header";
import { SEOProductCard } from "./SEOProductCard";
import { formatPrice } from "@/lib/formatPrice";

const BASE_URL = "https://proteinoteka.rs";

const CATEGORY_LINKS = [
  { label: "Whey Concentrate", href: "/kategorija/whey-concentrate" },
  { label: "Whey Isolate",     href: "/kategorija/whey-isolate"     },
  { label: "Hidrolizat",       href: "/kategorija/hidrolizat"       },
  { label: "Kazein",           href: "/kategorija/kazein"           },
  { label: "Biljni protein",   href: "/kategorija/biljni-protein"   },
  { label: "Blend",            href: "/kategorija/blend"            },
];

const GUIDE_LINKS = [
  { label: "Koliko proteina dnevno?",     href: "/vodici/koliko-proteina-dnevno"      },
  { label: "Kada piti protein?",          href: "/vodici/kada-piti-protein"           },
  { label: "Whey isolate vs concentrate", href: "/vodici/whey-isolate-vs-concentrate" },
];

function scoreColor(s: number) {
  if (s >= 8.5) return "#22c55e";
  if (s >= 7)   return "#84cc16";
  if (s >= 5.5) return "#FF9900";
  return "#ef4444";
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Disclaimer({ brandName }: { brandName: string }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-start gap-3">
      <span className="text-amber-500 text-lg shrink-0 mt-0.5">ℹ️</span>
      <p className="text-xs text-amber-800 leading-relaxed">
        <strong>Napomena:</strong> Proteinoteka je nezavisan servis za poređenje cena i nije povezana sa brendom {brandName} niti je njihov ovlašćeni distributer.
        Cene su prikupljene automatski iz srpskih prodavnica i mogu se razlikovati od cena na sajtovima prodavaca.
        Klikom na "Kupi" bićeš preusmeren na sajt prodavca gde se vrši kupovina.
      </p>
    </div>
  );
}

function DecisionSummary({ products }: { products: Product[] }) {
  if (products.length === 0) return null;

  const bestValue = [...products].sort((a, b) => (b.valueScore ?? 0) - (a.valueScore ?? 0))[0];
  const cheapest  = [...products].sort((a, b) => (a.numericPrice ?? 0) - (b.numericPrice ?? 0))[0];

  const withRatio = products
    .filter(p => p.proteinPer100g && p.primaryWeightGrams && p.numericPrice)
    .map(p => ({
      ...p,
      ratio: ((p.proteinPer100g! / 100) * p.primaryWeightGrams!) / p.numericPrice!,
    }));
  const bestRatio = withRatio.length > 0
    ? [...withRatio].sort((a, b) => b.ratio - a.ratio)[0]
    : null;

  const cards: { icon: string; label: string; product: Product | null; extra?: string }[] = [
    { icon: "⭐", label: "Najbolji value score", product: bestValue, extra: bestValue?.valueScore != null ? `Score: ${bestValue.valueScore.toFixed(1)}/10` : undefined },
    { icon: "💰", label: "Najjeftiniji",         product: cheapest,  extra: undefined },
    { icon: "⚡", label: "Najviše proteina/RSD", product: bestRatio ?? null, extra: bestRatio?.proteinPer100g != null ? `${bestRatio.proteinPer100g}g/100g` : undefined },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {cards.map(({ icon, label, product, extra }) =>
        product ? (
          <Link
            key={label}
            href={productUrl(product)}
            className="bg-white border border-slate-200 rounded-xl p-4 hover:border-[#FF9900] hover:shadow-md active:border-[#FF9900] transition-all duration-150 flex flex-col"
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

function WhereToBuySection({ products, brandName }: { products: Product[]; brandName: string }) {
  const byStore: Record<string, { count: number; minPrice: number; cheapestProduct: Product }> = {};

  for (const p of products) {
    const store = p.storeName ?? "Nepoznato";
    if (!byStore[store]) {
      byStore[store] = { count: 0, minPrice: p.numericPrice ?? Infinity, cheapestProduct: p };
    }
    byStore[store].count++;
    if (p.numericPrice && p.numericPrice < byStore[store].minPrice) {
      byStore[store].minPrice = p.numericPrice;
      byStore[store].cheapestProduct = p;
    }
  }

  const stores = Object.entries(byStore).sort((a, b) => a[1].minPrice - b[1].minPrice);
  if (stores.length <= 1) return null;

  return (
    <section>
      <h2 className="text-xl font-extrabold text-slate-900 mb-2">
        Gde kupiti {brandName} u Srbiji
      </h2>
      <p className="text-sm text-slate-500 mb-4">
        Sortirano po najnižoj dostupnoj ceni u svakoj prodavnici.
      </p>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Prodavnica</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Broj proizvoda</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">Najniža cena</th>
                <th className="text-right py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Akcija</th>
              </tr>
            </thead>
            <tbody>
              {stores.map(([storeName, data], i) => (
                <tr key={storeName} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 active:bg-slate-50 transition-colors">
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{storeName}</span>
                      {i === 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">Najjeftinije</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right text-slate-500 hidden sm:table-cell">{data.count}</td>
                  <td className="py-3 px-4 text-right font-bold text-[#FF9900] whitespace-nowrap">
                    {data.minPrice < Infinity ? `od ${formatPrice(data.minPrice)}` : "—"}
                  </td>
                  <td className="py-3 px-5 text-right">
                    <Link
                      href={productUrl(data.cheapestProduct)}
                      className="text-xs font-bold text-[#FF9900] hover:underline active:underline whitespace-nowrap"
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
    </section>
  );
}

function ProductTable({ products, brandName }: { products: Product[]; brandName: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="text-base font-bold text-slate-900">Svi {brandName} proizvodi — pregled cena</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wide">#</th>
              <th className="text-left py-3 pr-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Proizvod</th>
              <th className="text-right py-3 pr-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Cena</th>
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
                  <div className="font-medium text-slate-900 line-clamp-1 max-w-[180px] sm:max-w-xs">{p.name}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{p.storeName}</div>
                </td>
                <td className="py-3 pr-4 text-right font-bold text-slate-900 whitespace-nowrap">{p.price}</td>
                <td className="py-3 pr-4 text-right text-slate-600 hidden sm:table-cell">
                  {p.proteinPer100g != null ? `${p.proteinPer100g}g` : "—"}
                </td>
                <td className="py-3 pr-4 text-right hidden sm:table-cell">
                  {p.valueScore != null ? (
                    <span className="font-bold text-xs" style={{ color: scoreColor(p.valueScore) }}>
                      {p.valueScore.toFixed(1)}
                    </span>
                  ) : "—"}
                </td>
                <td className="py-3 pr-5 text-right">
                  <Link href={productUrl(p)} className="text-xs font-bold text-[#FF9900] hover:underline whitespace-nowrap">
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

function FAQSection({ faqs }: { faqs: { q: string; a: string }[] }) {
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

function CrossLinks() {
  return (
    <div className="space-y-4">
      <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
        <h3 className="text-sm font-bold text-slate-700 mb-3">Istraži po kategorijama:</h3>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_LINKS.map(link => (
            <Link key={link.href} href={link.href}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-all">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
        <h3 className="text-sm font-bold text-slate-700 mb-3">Korisni vodiči:</h3>
        <div className="flex flex-wrap gap-2">
          {GUIDE_LINKS.map(link => (
            <Link key={link.href} href={link.href}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-all">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export interface SEOBrandPageProps {
  h1: string;
  brandName: string;
  brandApiName: string;
  intro: string;
  products: Product[];
  currentSlug: string;
  faqs: { q: string; a: string }[];
}

export function SEOBrandPage({
  h1, brandName, intro, products, currentSlug, faqs,
}: SEOBrandPageProps) {
  const sorted = [...products].sort((a, b) => (b.valueScore ?? 0) - (a.valueScore ?? 0));

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Početna", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Brendovi", item: `${BASE_URL}/brendovi` },
      { "@type": "ListItem", position: 3, name: brandName, item: `${BASE_URL}/${currentSlug}` },
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(faq => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <Header />

      {/* Hero */}
      <div className="bg-[#131921] text-white">
        <div className="max-w-4xl mx-auto px-4 py-10 sm:py-14">
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-5 flex-wrap" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-[#FF9900] transition-colors">Početna</Link>
            <span>/</span>
            <span>Brendovi</span>
            <span>/</span>
            <span className="text-slate-300">{brandName}</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-4 leading-tight">{h1}</h1>
          <p className="text-slate-300 text-base sm:text-lg max-w-2xl leading-relaxed">{intro}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

        <Disclaimer brandName={brandName} />

        {sorted.length > 0 && <DecisionSummary products={sorted} />}

        {sorted.length > 0 && (
          <section>
            <h2 className="text-xl font-extrabold text-slate-900 mb-4">
              {brandName} proteini — sortirani po vrednosti za novac
            </h2>
            <div className="space-y-3">
              {sorted.slice(0, 8).map((p, i) => (
                <SEOProductCard key={p.id} product={p} rank={i + 1} />
              ))}
            </div>
          </section>
        )}

        {sorted.length > 1 && <WhereToBuySection products={sorted} brandName={brandName} />}

        {sorted.length > 0 && <ProductTable products={sorted} brandName={brandName} />}

        <FAQSection faqs={faqs} />

        <CrossLinks />

        <div className="bg-white rounded-xl border border-slate-200 p-6 text-center shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-2">Poredi sa ostalim brendovima</h2>
          <p className="text-slate-500 text-sm mb-5">
            Pronađi koji protein nudi najbolju vrednost za novac — bez obzira na brend ili prodavnicu.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/" className="px-6 py-3 rounded-xl bg-[#131921] text-white font-bold text-sm hover:bg-[#243860] transition-colors">
              Pogledaj sve ponude
            </Link>
            <Link href="/compare" className="px-6 py-3 rounded-xl border-2 border-[#FF9900] text-[#FF9900] font-bold text-sm hover:bg-amber-50 transition-colors">
              Uporedi cene
            </Link>
          </div>
        </div>

        <p className="text-xs text-slate-400 text-center leading-relaxed pb-4">
          Cene su informativnog karaktera i prikupljene su automatski. Proteinoteka nije odgovorna za promene cena na sajtovima prodavnica.
          {brandName} i svi nazivi proizvoda su robne marke njihovih vlasnika.
        </p>

      </div>
    </div>
  );
}
