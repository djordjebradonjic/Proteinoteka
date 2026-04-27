import Link from "next/link";
import { Product } from "@/types/product";
import Header from "@/components/Header";
import { SEOProductCard } from "./SEOProductCard";

// ── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(s: number) {
  if (s >= 8.5) return "#22c55e";
  if (s >= 7)   return "#84cc16";
  if (s >= 5.5) return "#FF9900";
  return "#ef4444";
}

const SEO_PAGES = [
  { slug: "najbolji-whey-protein-srbija", label: "🥇 Najbolji Whey" },
  { slug: "najjeftiniji-whey-protein",    label: "💰 Najjeftiniji Whey" },
  { slug: "whey-protein-cena",            label: "📊 Whey Protein Cena" },
  { slug: "whey-isolate-srbija",          label: "✨ Whey Izolat" },
  { slug: "protein-za-masu",              label: "💪 Protein za Masu" },
] as const;

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
      <h2 className="text-lg font-extrabold mb-1">Uporedi najisplativije opcije</h2>
      <p className="text-slate-400 text-sm mb-5">Postavi ih jedne pored druge — cena, proteini i score na jednom mestu.</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        {top3.map((p, i) => (
          <Link
            key={p.id}
            href={`/product/${p.id}`}
            className="bg-white/10 hover:bg-white/20 rounded-lg p-4 text-center transition-colors"
          >
            <div className="text-2xl mb-1">{medals[i]}</div>
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
          href="/compare"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF9900] text-[#131921] font-bold text-sm hover:bg-[#e68a00] transition-colors"
        >
          Otvori poređenje →
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
                  <div className="font-medium text-slate-900 line-clamp-1 max-w-[200px] sm:max-w-xs">{p.name}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{p.brand} · {p.storeName}</div>
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
                  <Link
                    href={`/product/${p.id}`}
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

function CrossLinks({ currentSlug }: { currentSlug: string }) {
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
}

export function SEOLandingPage({
  h1, intro, quickAnswer, products, tableCaption, listHeading, currentSlug,
}: SEOLandingPageProps) {
  return (
    <div className="min-h-screen bg-slate-50">
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

        {/* Quick Answer */}
        {quickAnswer && <QuickAnswer text={quickAnswer} />}

        {/* Product list */}
        {products.length > 0 && (
          <section>
            <h2 className="text-xl font-extrabold text-slate-900 mb-4">{listHeading}</h2>
            <div className="space-y-3">
              {products.slice(0, 8).map((p, i) => (
                <SEOProductCard key={p.id} product={p} rank={i + 1} />
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

        {/* Cross links */}
        <CrossLinks currentSlug={currentSlug} />

        {/* Bottom CTA */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 text-center shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-2">Istraži kompletnu ponudu</h2>
          <p className="text-slate-500 text-sm mb-5">
            Pregledaj sve proteine i suplemente sa aktuelnim cenama iz svih prodavnica u Srbiji.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="px-6 py-3 rounded-xl bg-[#131921] text-white font-bold text-sm hover:bg-[#243860] transition-colors"
            >
              Pogledaj sve ponude
            </Link>
            <Link
              href="/compare"
              className="px-6 py-3 rounded-xl border-2 border-[#FF9900] text-[#FF9900] font-bold text-sm hover:bg-amber-50 transition-colors"
            >
              Uporedi cene
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
