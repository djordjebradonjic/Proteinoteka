import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Header from "@/components/Header";
import { CURRENT_MARKET } from "@/lib/marketConfig";
import { fetchMarketCatalog } from "@/lib/whey-price-stats";
import { computeStoreIndex, isFresh, FRESH_DAYS, MIN_COMPARED_GROUPS, type StoreIndexRow } from "@/lib/store-price-index";
import { formatWeightG, srPlural, widestSamePackSpread } from "@/lib/brand-line-stats";
import { formatPrice } from "@/lib/formatPrice";
import { productUrl } from "@/lib/productUrl";
import { safeJsonLd } from "@/lib/jsonLd";

export const revalidate = 21600;

const URL_PATH = "/gde-kupiti-protein-srbija";

export const metadata: Metadata = {
  title: { absolute: "Gde kupiti protein u Srbiji — koja prodavnica je najjeftinija | Proteinoteka" },
  description:
    "Poređenje prodavnica proteina u Srbiji na istim proizvodima: indeks cena, koliko često je koja prodavnica najjeftinija i koliko su sveže cene. Računa se iz živih podataka.",
  alternates: { canonical: `https://proteinoteka.rs${URL_PATH}` },
  openGraph: {
    title: "Gde kupiti protein u Srbiji — poređenje prodavnica | Proteinoteka",
    description:
      "Koja srpska prodavnica suplemenata ima najniže cene na istim proizvodima? Indeks cena po prodavnici, računat iz živih podataka.",
    url: `https://proteinoteka.rs${URL_PATH}`,
    siteName: "Proteinoteka",
    locale: "sr_RS",
    type: "website",
    images: [{ url: "https://proteinoteka.rs/opengraph-image", width: 1200, height: 630, alt: "Proteinoteka" }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["https://proteinoteka.rs/opengraph-image"],
  },
};

// Dedicated store pages on the RS site (lower-cased store name -> path).
const STORE_PAGES: Record<string, string> = {
  "ogistrashop": "/ogistrashop-proteini",
  "supplementshop": "/supplementshop-proteini",
  "pansport": "/pansport-proteini",
  "fitlab": "/fitlab-proteini",
  "gymbeam": "/gymbeam-proteini",
  "myprotein": "/myprotein-proteini",
  "proteinbox": "/proteinbox-proteini",
  "proteini.si": "/proteini-si-srbija",
  "lama": "/lama-proteini",
  "shopbuilder": "/shopbuilder-proteini",
  "supplementstore": "/supplement-store-proteini",
  "xsport": "/xsport-proteini",
};

const pct = (index: number) => `+${Math.round((index - 1) * 100)}%`;
const plural = {
  store: { one: "prodavnici", few: "prodavnice", many: "prodavnica" },
  storeNom: { one: "prodavnica", few: "prodavnice", many: "prodavnica" },
  product: { one: "proizvod", few: "proizvoda", many: "proizvoda" },
  offer: { one: "ponuda", few: "ponude", many: "ponuda" },
};

// Deliberately lets fetch errors propagate: an ISR page that swallowed a failed catalog
// fetch would cache a wrong/empty comparison, throwing keeps the last good render instead.
async function loadIndex() {
  const products = await fetchMarketCatalog();
  const now = new Date();
  const index = computeStoreIndex(products, now);
  const spread = widestSamePackSpread(products.filter((p) => isFresh(p, now)), 3);
  return { index, spread };
}

function ageLabel(row: StoreIndexRow): string {
  if (row.daysAgo == null) return "nepoznato";
  if (row.daysAgo <= 0) return "danas";
  if (row.daysAgo === 1) return "juče";
  return `pre ${row.daysAgo} dana`;
}

export default async function Page() {
  if (CURRENT_MARKET !== "rs") notFound();

  const { index, spread } = await loadIndex();
  const { rows, groupsCompared, freshListings, totalListings } = index;
  const ranked = rows.filter((r) => r.index != null);
  const unranked = rows.filter((r) => r.index == null);
  const stale = rows.filter((r) => r.fresh === 0);
  const top = ranked[0];
  const storeCount = rows.length;

  const faqs: { q: string; a: string }[] = [
    {
      q: "Koja prodavnica proteina je najjeftinija u Srbiji?",
      a: top
        ? `Prema našem indeksu trenutno je najpovoljnija ${top.store}: na ${top.comparedGroups} ${srPlural(top.comparedGroups, plural.product)} koje prodaje i još neka druga prodavnica, u proseku je ${top.index! <= 1.005 ? "uvek najjeftinija" : `${Math.round((top.index! - 1) * 100)}% skuplja od najjeftinije ponude`}, a najniža cena je kod nje u ${Math.round(top.cheapestShare! * 100)}% poređenja. Poredak se menja kako se cene menjaju, zato se tabela računa iznova iz podataka, bez ručnog upisivanja.`
        : "Za sada nemamo dovoljno zajedničkih proizvoda između prodavnica da bismo objavili pouzdan indeks.",
    },
    {
      q: "Kako računate indeks cena?",
      a: `Poredimo samo identične proizvode: isti brend, ista vrsta proteina i isto pakovanje (u okviru 5%), koje prodaju bar dve prodavnice. Za svaki takav proizvod cenu svake prodavnice delimo sa najnižom cenom za taj proizvod, pa uzimamo prosek. Indeks +0% znači da je prodavnica uvek najjeftinija, a +10% da je u proseku 10% skuplja od najjeftinije. Prodavnica dobija indeks tek kad ima najmanje ${MIN_COMPARED_GROUPS} zajedničkih proizvoda. Cene starije od ${FRESH_DAYS} dana ne ulaze u računicu, a proizvode čija je razlika između prodavnica veća od 100% izuzimamo, jer je to skoro uvek greška u podacima.`,
    },
    {
      q: "Da li je najjeftinija prodavnica uvek najbolji izbor?",
      a: "Ne nužno. Indeks poredi cene proizvoda, a ne troškove dostave, rokove isporuke, stanje na lageru ni akcije koje važe samo uz kupon ili u određenom periodu. Prodavnica sa nižim indeksom može imati užu ponudu, pa je cena po gramu proteina na samom proizvodu i dalje najbolji način da izabereš konkretnu teglu.",
    },
    {
      q: "Zašto neke prodavnice nemaju indeks?",
      a: `Indeks objavljujemo samo kad prodavnica deli bar ${MIN_COMPARED_GROUPS} proizvoda sa nekom drugom, i to sa svežim cenama. Prodavnice koje prodaju uglavnom sopstvene ili ekskluzivne brendove nemaju šta da se poredi, a prodavnice kojima cene nismo mogli da osvežimo u poslednjih ${FRESH_DAYS} dana ostaju izvan računice dok se podaci ne vrate.`,
    },
    {
      q: "Koliko prodavnica proteina pratite?",
      a: `Trenutno pratimo ${storeCount} ${srPlural(storeCount, plural.storeNom)} u Srbiji: ${rows.map((r) => r.store).join(", ")}. Ukupno je to ${totalListings} ${srPlural(totalListings, plural.offer)}, od kojih je ${freshListings} osveženo u poslednjih ${FRESH_DAYS} dana.`,
    },
  ];

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Početna", item: "https://proteinoteka.rs" },
      { "@type": "ListItem", position: 2, name: "Gde kupiti protein", item: `https://proteinoteka.rs${URL_PATH}` },
    ],
  };
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(faqJsonLd) }} />
      <Header />

      <div className="bg-[#131921] text-white">
        <div className="max-w-4xl mx-auto px-4 py-10 sm:py-14">
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-5 flex-wrap" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-[#FF9900] transition-colors">Početna</Link>
            <span>/</span>
            <span className="text-slate-300">Gde kupiti protein</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-4 leading-tight">Gde kupiti protein u Srbiji: koja prodavnica je najjeftinija?</h1>
          <p className="text-slate-300 text-base sm:text-lg max-w-2xl leading-relaxed">
            Cene proteina pratimo u {storeCount} {srPlural(storeCount, plural.storeNom)}. Da poređenje bude pošteno, poredimo iste proizvode: {groupsCompared}{" "}
            {srPlural(groupsCompared, plural.product)} koje prodaje bar dve prodavnice, sa cenama osveženim u poslednjih {FRESH_DAYS} dana. Tabela se računa iz živih podataka i menja se čim se promene cene.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <section>
          <h2 className="text-xl font-extrabold text-slate-900 mb-2">Indeks cena po prodavnici</h2>
          <p className="text-sm text-slate-500 mb-4">
            Prosečna razlika u odnosu na najnižu cenu za isti proizvod. +0% znači uvek najjeftinija.
          </p>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    <th className="py-3 px-5">Prodavnica</th>
                    <th className="py-3 px-4 text-right whitespace-nowrap">Indeks cena</th>
                    <th className="py-3 px-4 text-right whitespace-nowrap hidden sm:table-cell">Najjeftinija u</th>
                    <th className="py-3 px-4 text-right whitespace-nowrap hidden sm:table-cell">Poređeno na</th>
                    <th className="py-3 px-5 text-right whitespace-nowrap">Cene osvežene</th>
                  </tr>
                </thead>
                <tbody>
                  {[...ranked, ...unranked].map((r, i) => {
                    const page = STORE_PAGES[r.store.toLowerCase()];
                    return (
                      <tr key={r.store} className="border-b border-slate-100 last:border-0">
                        <td className="py-3 px-5">
                          <div className="flex items-center gap-2 flex-wrap">
                            {page ? (
                              <Link href={page} className="font-semibold text-slate-900 hover:text-[#FF9900]">{r.store}</Link>
                            ) : (
                              <span className="font-semibold text-slate-900">{r.store}</span>
                            )}
                            {i === 0 && r.index != null && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">Najpovoljnija</span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{r.listings} {srPlural(r.listings, plural.offer)}</div>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                          {r.index != null ? pct(r.index) : <span className="font-normal text-slate-400">nema dovoljno podataka</span>}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-600 hidden sm:table-cell">
                          {r.cheapestShare != null ? `${Math.round(r.cheapestShare * 100)}% poređenja` : "—"}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-600 hidden sm:table-cell">
                          {r.comparedGroups > 0 ? `${r.comparedGroups} ${srPlural(r.comparedGroups, plural.product)}` : "—"}
                        </td>
                        <td className={`py-3 px-5 text-right whitespace-nowrap ${r.fresh === 0 ? "text-amber-700 font-semibold" : "text-slate-600"}`}>
                          {ageLabel(r)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          {stale.length > 0 && (
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mt-3 leading-relaxed">
              <strong>Bez svežih cena:</strong> {stale.map((r) => r.store).join(", ")}. Cene u ovim prodavnicama nisu osvežene u poslednjih {FRESH_DAYS} dana, pa ne ulaze u indeks dok se podaci ne vrate.
            </p>
          )}
        </section>

        {spread && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-2">Isti proizvod, različita cena</p>
            <p className="text-sm text-slate-800 leading-relaxed">
              <strong>{/\d\s?(kg|g)\b/i.test(spread.name) ? spread.name : `${spread.name} (${formatWeightG(spread.weightG)})`}</strong> se prodaje u {spread.stores}{" "}
              {srPlural(spread.stores, plural.store)}: od{" "}
              <Link href={productUrl(spread.low)} className="font-semibold text-[#FF9900] hover:underline">
                {formatPrice(spread.low.numericPrice)} ({spread.low.storeName})
              </Link>{" "}
              do{" "}
              <Link href={productUrl(spread.high)} className="font-semibold text-[#FF9900] hover:underline">
                {formatPrice(spread.high.numericPrice)} ({spread.high.storeName})
              </Link>
              . Razlika je {formatPrice(spread.diff)} ({Math.round(spread.pct * 100)}%) za identičan proizvod.
            </p>
          </div>
        )}

        <section>
          <h2 className="text-xl font-extrabold text-slate-900 mb-4">Česta pitanja</h2>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <div key={faq.q} className="bg-white border border-slate-200 rounded-xl p-5">
                <h3 className="font-bold text-slate-900 text-sm mb-2">{faq.q}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
          <h3 className="text-sm font-bold text-slate-700 mb-3">Pogledaj i:</h3>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "💰 Najjeftiniji whey (po kg)", href: "/najjeftiniji-whey-protein" },
              { label: "📋 Svi proteini u Srbiji", href: "/proteini-srbija" },
              { label: "📊 Whey protein cena", href: "/whey-protein-cena" },
              { label: "🥇 Najbolji whey", href: "/najbolji-whey-protein-srbija" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-all"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-400 text-center leading-relaxed pb-4">
          Proteinoteka je nezavisan servis za poređenje cena i nije povezana ni sa jednom od navedenih prodavnica. Cene se prikupljaju automatski i mogu se razlikovati od cena na sajtovima prodavaca.
        </p>
      </div>
    </div>
  );
}
