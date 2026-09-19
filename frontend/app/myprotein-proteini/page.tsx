import { notFound } from "next/navigation";
import { CURRENT_MARKET } from "@/lib/marketConfig";
import { Metadata } from "next";
import { fetchStoreProducts, getSeoCopyStats } from "@/lib/seo-data";
import { SEOStorePage } from "@/components/seo/SEOStorePage";
import { compareCost, computeLineStats, formatWeightG, medianGpBySource, srPlural, type BrandLine } from "@/lib/brand-line-stats";
import { BrandLineGuide } from "@/components/seo/BrandLineGuide";
import { MarketComparison, SOURCE_LABELS } from "@/components/seo/MarketComparison";
import { fetchMarketCatalog } from "@/lib/whey-price-stats";
import { formatPrice } from "@/lib/formatPrice";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: "MyProtein Srbija — cene proteina i poređenje 2026 | Proteinoteka" },
  description:
    "Aktuelne MyProtein cene proteina u Srbiji — Impact Whey, izolat, biljni proteini. Poredimo sa svim prodavnicama i računamo value score za svaki proizvod.",
  alternates: { canonical: "https://proteinoteka.rs/myprotein-proteini" },
  openGraph: {
    title: "MyProtein Srbija — cene proteina 2026 | Proteinoteka",
    description:
      "Poređenje MyProtein cena proteina u Srbiji. Value score, nutritivne vrednosti i direktno poređenje sa svim prodavnicama.",
    url: "https://proteinoteka.rs/myprotein-proteini",
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

// Order matters: first match wins ("Impact Whey Izolat" must hit the isolate line before plain Impact).
const LINES: BrandLine[] = [
  { key: "casein", label: "Kazein sa sporim otpuštanjem", blurb: "Kazein: sporo se vari, uglavnom se pije uveče.", match: /kazein|casein/i },
  { key: "vegan", label: "Biljni proteini", blurb: "Soja, grašak i veganske mešavine, za one koji ne konzumiraju mlečne proizvode.", match: /soja|graš|vegan|biljn/i },
  { key: "diet", label: "Impact Diet Whey", blurb: "Whey sa dodacima za dijetu.", match: /diet/i },
  { key: "total", label: "Proteinska mešavina Total", blurb: "Mešavina više izvora proteina (blend).", match: /me[šs]avin|total/i },
  { key: "the", label: "THE Whey", blurb: "Premium whey linija.", match: /^the\s*whey/i },
  { key: "essential", label: "Essential Whey", blurb: "Whey osnovne formule.", match: /essential/i },
  { key: "impactiso", label: "Impact Whey Izolat", blurb: "Izolat: više proteina na 100 g i manje laktoze.", match: /impact.*(isolate|izolat)/i },
  { key: "impact", label: "Impact Whey Protein", blurb: "Osnovna linija: whey koncentrat u mnogo ukusa.", match: /impact/i },
];

const fmtRsd = (v: number) => formatPrice(Math.round(v));
const fmt1 = (v: number) => v.toFixed(1).replace(".", ",");

export default async function Page() {
  if (CURRENT_MARKET !== 'rs') notFound();
  const products = await fetchStoreProducts({ storeName: "MyProtein", limit: 200 });
  const stats = getSeoCopyStats(products);
  const lineStats = computeLineStats(products, LINES);
  const byKey = Object.fromEntries(lineStats.map((l) => [l.line.key, l]));
  const weights = products.map((p) => p.primaryWeightGrams).filter((w): w is number => w != null && w > 0);
  const impact = byKey.impact;
  const impactIso = byKey.impactiso;
  const casein = byKey.casein;

  // Cross-market comparison is a bonus: if the catalog can't be loaded the page renders without it.
  const mine = medianGpBySource(products);
  let market: ReturnType<typeof medianGpBySource> = {};
  try {
    // Other stores only: MyProtein's own listings would pull the benchmark towards itself.
    market = medianGpBySource((await fetchMarketCatalog()).filter((p) => p.storeName !== "MyProtein"));
  } catch {
    market = {};
  }
  const verdicts = Object.keys(SOURCE_LABELS)
    .filter((k) => mine[k]?.count >= 3 && market[k]?.count >= 8)
    .map((k) => ({ label: SOURCE_LABELS[k].toLowerCase(), cmp: compareCost(mine[k].gp, market[k].gp), pct: Math.round(Math.abs(mine[k].gp / market[k].gp - 1) * 100) }));
  const marketSentence = verdicts.length
    ? ` Po gramu proteina, medijana MyProtein ponuda naspram ostalih prodavnica: ${verdicts.map((v) => `${v.label} ${v.cmp === "similar" ? "je na nivou ostalih prodavnica" : `${v.pct}% ${v.cmp === "cheaper" ? "jeftiniji" : "skuplji"}`}`).join(", ")}.`
    : "";

  return (
    <SEOStorePage
      h1="MyProtein proteini u Srbiji — sve cene"
      storeName="MyProtein"
      intro={`Malo koji brend suplemenata ima toliko prepoznatljivo pakovanje kao MyProtein — britanski brend osnovan 2004, koji je 2011. za oko 58 miliona funti kupio THG (The Hut Group) i pretvorio ga u jednog od globalno najprodavanijih. U Srbiji se kupuje preko sopstvene prodavnice myprotein.rs, sa asortimanom od Impact Whey linije do izolata, kazeina i biljnih proteina.${stats ? ` Cene se kreću od ${stats.minPriceLabel} do ${stats.maxPriceLabel}${weights.length > 0 ? `, u pakovanjima od ${formatWeightG(Math.min(...weights))} do ${formatWeightG(Math.max(...weights))}` : ""}.` : ""}${products.length > 0 ? ` Na Proteinoteci pratimo ${products.length} MyProtein ${srPlural(products.length, { one: "ponudu", few: "ponude", many: "ponuda" })}.` : ""} Ispod je koliko koja linija košta po gramu proteina i kako se MyProtein poredi sa ostatkom tržišta.`}
      products={products}
      currentSlug="myprotein-proteini"
      insightsSection={
        <>
          <BrandLineGuide brandName="MyProtein" products={products} lines={LINES} />
          <MarketComparison brandName="MyProtein" mine={mine} market={market} />
        </>
      }
      faqs={[
        {
          q: "Šta je MyProtein Impact Whey i po čemu se razlikuje od ostalih linija?",
          a: `Impact Whey Protein je osnovna MyProtein linija na bazi whey koncentrata${impact?.proteinMedian ? ` (u našim ponudama oko ${Math.round(impact.proteinMedian)} g proteina na 100 g)` : ""}. Impact Whey Izolat je filtriraniji${impactIso?.proteinMedian ? `, oko ${Math.round(impactIso.proteinMedian)} g proteina na 100 g` : ""}, uz manje laktoze.${impact?.gpMedian != null && impactIso?.gpMedian != null ? (compareCost(impactIso.gpMedian, impact.gpMedian) === "pricier" ? ` Po gramu proteina izolat je skuplji: ${fmt1(impactIso.gpMedian)} RSD naspram ${fmt1(impact.gpMedian)} RSD kod osnovne linije (medijane po ponudama).` : compareCost(impactIso.gpMedian, impact.gpMedian) === "cheaper" ? ` Po gramu proteina izolat je trenutno čak i jeftiniji: ${fmt1(impactIso.gpMedian)} RSD naspram ${fmt1(impact.gpMedian)} RSD (medijane po ponudama).` : ` Po gramu proteina razlika je mala: ${fmt1(impactIso.gpMedian)} RSD naspram ${fmt1(impact.gpMedian)} RSD (medijane po ponudama).`) : ""}`,
        },
        {
          q: "Koliko košta MyProtein protein u Srbiji?",
          a: stats
            ? `MyProtein ponude se kreću od ${stats.minPriceLabel} (${stats.cheapest.name}) do ${stats.maxPriceLabel} (${stats.priciest.name}).${weights.length > 0 ? ` Raspon je širok jer pakovanja idu od ${formatWeightG(Math.min(...weights))} do ${formatWeightG(Math.max(...weights))}, pa je cena po gramu proteina pouzdanije poređenje od cene pakovanja.` : ""}${marketSentence}`
            : "Aktuelne cene za sva pakovanja prikazane su u tabeli iznad, ažurirane na dnevnom nivou.",
        },
        {
          q: "Ima li MyProtein kazein protein u Srbiji?",
          a: casein
            ? `Da — pratimo ${casein.count} ${srPlural(casein.count, { one: "ponudu", few: "ponude", many: "ponuda" })} kazeina sa sporim otpuštanjem${casein.proteinMedian ? `, oko ${Math.round(casein.proteinMedian)} g proteina na 100 g` : ""}${casein.best ? `; najpovoljnija po gramu proteina je ${fmtRsd(casein.best.numericPrice)} (${formatWeightG(casein.best.primaryWeightGrams!)})` : ""}. Kazein je namenjen pre svega večernjem obroku, ne kao zamena za whey posle treninga.`
            : "Trenutno u ponudi koju pratimo nema kazeina. Kad se pojavi, biće prikazan u tabeli iznad.",
        },
        {
          q: "Koji MyProtein proteini imaju najbolji value score?",
          a: stats
            ? `Trenutno najbolji value score u MyProtein ponudi ima „${stats.bestValue.name}“: ${stats.bestValue.valueScore?.toFixed(1)}/10${stats.bestValue.proteinPer100g ? `, ${stats.bestValue.proteinPer100g} g proteina na 100 g` : ""}. Pun rang svih proizvoda je u tabeli iznad.`
            : "Tabela iznad prikazuje pun rang svih MyProtein proizvoda po value score-u.",
        },
        {
          q: "Da li je MyProtein samo dobar marketing ili stvarno vredi cene?",
          a: "MyProtein je od malog onlajn biznisa iz 2004. postao globalni brend, uz veliki udeo agresivnog marketinga i saradnje sa influenserima. To je istina, ali odgovor na pitanje vrednosti daju brojevi, a ne marketing: cena po gramu proteina iz tabele „MyProtein naspram ostalih prodavnica“ iznad pokazuje da li je određena linija zaista jeftinija ili skuplja od konkurencije.",
        },
        {
          q: "Kako se MyProtein cene porede sa ostalim prodavnicama u Srbiji?",
          a: "Proteinoteka svakodnevno prikuplja cene iz svih prodavnica koje pratimo. MyProtein je i brend i prodavnica, pa većinu njegovih proizvoda nema u drugim prodavnicama; zato poredimo cenu po gramu proteina sa sličnim proizvodima drugih brendova. Na glavnoj stranici možeš da filtriraš po brendu ili kategoriji.",
        },
      ]}
    />
  );
}
