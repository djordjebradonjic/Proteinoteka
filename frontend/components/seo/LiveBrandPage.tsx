import { notFound } from "next/navigation";
import { CURRENT_MARKET } from "@/lib/marketConfig";
import { getSeoCopyStats } from "@/lib/seo-data";
import {
  classifyLine,
  computeLineStats,
  formatWeightG,
  packRows,
  packSizeTrend,
  srPlural,
  widestSamePackSpread,
} from "@/lib/brand-line-stats";
import { loadBrand, type BrandFaq, type LiveBrandConfig } from "@/lib/live-brand";
import { formatPrice } from "@/lib/formatPrice";
import { BrandLineGuide } from "@/components/seo/BrandLineGuide";
import { PackTable } from "@/components/seo/PackTable";
import { SEOBrandPage } from "@/components/seo/SEOBrandPage";

const fmt1 = (v: number) => v.toFixed(1).replace(".", ",");
const fmtRsd = (v: number) => formatPrice(Math.round(v));
const P = {
  store: { one: "prodavnici", few: "prodavnice", many: "prodavnica" },
  offer: { one: "ponudu", few: "ponude", many: "ponuda" },
  offerNom: { one: "ponuda", few: "ponude", many: "ponuda" },
};

// Server component: intro, tables and FAQ answers are all computed from the brand's product list.
export async function LiveBrandPage({ config }: { config: LiveBrandConfig }) {
  if (CURRENT_MARKET !== "rs") notFound();
  const { brandName, lines, focusLineKey } = config;
  const products = await loadBrand(config.apiBrands);

  const stats = getSeoCopyStats(products);
  const lineStats = computeLineStats(products, lines);
  const storeNames = [...new Set(products.map((p) => p.storeName))].sort();
  const focusLine = focusLineKey ? lines.find((l) => l.key === focusLineKey) : undefined;
  const focusProducts = focusLine ? products.filter((p) => classifyLine(p.name, lines)?.key === focusLine.key) : [];
  const focusRows = packRows(focusProducts);
  const focusTrend = packSizeTrend(focusRows);
  const focusStores = [...new Set(focusProducts.map((p) => p.storeName))].sort();
  const spread = widestSamePackSpread(products, 3) ?? widestSamePackSpread(products, 2);

  const intro = `${config.lead} Na Proteinoteci pratimo ${products.length} ${brandName} ${srPlural(products.length, P.offer)} u ${storeNames.length} ${srPlural(storeNames.length, P.store)} (${storeNames.join(", ")})${stats ? `, sa cenama od ${stats.minPriceLabel} do ${stats.maxPriceLabel}` : ""}. Ispod je cena po pakovanju i po gramu proteina, da vidiš šta se stvarno isplati.`;

  const lineSummary = lineStats
    .map((l) => {
      const parts = [`${l.count} ${srPlural(l.count, P.offerNom)}`];
      if (l.proteinMedian) parts.push(`oko ${Math.round(l.proteinMedian)} g proteina na 100 g`);
      if (l.gpMedian != null) parts.push(`${fmt1(l.gpMedian)} RSD po gramu proteina`);
      return `${l.line.label} (${parts.join(", ")})`;
    })
    .join("; ");

  const focusSentence = (() => {
    if (!focusLine || focusRows.length === 0) return "";
    const list = focusRows.map((r) => `${formatWeightG(r.weightG)} za ${fmtRsd(r.product.numericPrice)}`).join(", ");
    const trend = !focusTrend
      ? ""
      : focusTrend.cmp === "cheaper"
        ? ` Veće pakovanje se isplati: ${formatWeightG(focusTrend.large.weightG)} košta ${fmt1(focusTrend.large.gp)} RSD po gramu proteina naspram ${fmt1(focusTrend.small.gp)} RSD za ${formatWeightG(focusTrend.small.weightG)}.`
        : focusTrend.cmp === "pricier"
          ? ` Veće pakovanje se ovde ne isplati: ${formatWeightG(focusTrend.large.weightG)} košta ${fmt1(focusTrend.large.gp)} RSD po gramu proteina, a ${formatWeightG(focusTrend.small.weightG)} ${fmt1(focusTrend.small.gp)} RSD.`
          : ` Cena po gramu proteina je slična za najmanje i najveće pakovanje (${fmt1(focusTrend.small.gp)} i ${fmt1(focusTrend.large.gp)} RSD).`;
    return ` ${focusLine.label} pratimo u ${focusStores.length} ${srPlural(focusStores.length, P.store)} (${focusStores.join(", ")}): ${list}.${trend}`;
  })();

  const common: BrandFaq[] = [
    {
      q: `Koji ${brandName} protein je najbolja vrednost za novac?`,
      a: stats
        ? `Najbolji value score trenutno ima „${stats.bestValue.name}“: ${stats.bestValue.valueScore?.toFixed(1)}/10${stats.bestValue.proteinPer100g ? `, ${stats.bestValue.proteinPer100g} g proteina na 100 g` : ""}, prodavnica ${stats.bestValue.storeName}. Score uzima u obzir cenu, procenat proteina, čistoću sastava i ugled brenda; metodologiju možeš pročitati na stranici „Kako računamo value score“.`
        : "Tabela iznad prikazuje value score za svaki proizvod.",
    },
    {
      q: `Koje ${brandName} linije pratite i koliko koštaju po gramu proteina?`,
      a: lineSummary
        ? `Trenutno pratimo: ${lineSummary}. Cena po gramu proteina računa se kao medijana svih ponuda linije i ne meri kvalitet proteina (goveđi ili biljni protein nisu isto što i whey), zato uz nju gledaj i value score.`
        : "Tabela iznad prikazuje sve proizvode koje pratimo.",
    },
    {
      q: `Gde je ${brandName} najjeftiniji u Srbiji?`,
      a: `${spread ? `Isto pakovanje (${classifyLine(spread.name, lines)?.label ?? spread.name}, ${formatWeightG(spread.weightG)}) prodaje se u ${spread.stores} ${srPlural(spread.stores, P.store)}: od ${fmtRsd(spread.low.numericPrice)} (${spread.low.storeName}) do ${fmtRsd(spread.high.numericPrice)} (${spread.high.storeName}), razlika je ${Math.round(spread.pct * 100)}%.` : ""}${focusSentence} Tabela „Gde kupiti“ iznad prikazuje najnižu trenutnu cenu po prodavnici, a price alert javlja kad cena padne.`.trim(),
    },
    {
      q: `Koliko košta ${brandName} protein u Srbiji?`,
      a: stats
        ? `Ponude se kreću od ${stats.minPriceLabel} do ${stats.maxPriceLabel}: najjeftinija je „${stats.cheapest.name}“, a najskuplja „${stats.priciest.name}“. Raspon je širok jer obuhvata različite linije i veličine pakovanja, pa je cena po gramu proteina pouzdanije poređenje od cene tegle.`
        : "Tabela iznad prikazuje aktuelnu cenu za svako pakovanje.",
    },
    {
      q: `Da li je ${brandName} dostupan u svim prodavnicama?`,
      a: `Ne. ${brandName} trenutno pratimo u ${storeNames.length} ${srPlural(storeNames.length, P.store)}: ${storeNames.join(", ")}. Ako neku prodavnicu ne vidiš u tabeli, znači da u njoj nismo pronašli ${brandName} proizvode.`,
    },
  ];

  return (
    <SEOBrandPage
      h1={config.h1}
      brandName={brandName}
      brandApiName={brandName}
      intro={intro}
      products={products}
      currentSlug={config.slug}
      extraGuideLinks={config.extraGuideLinks}
      insightsSection={
        <>
          {focusLine && focusProducts.length > 0 && (
            <PackTable title={`${brandName} ${focusLine.label}: cena po pakovanju`} products={focusProducts} />
          )}
          <BrandLineGuide brandName={brandName} products={products} lines={lines} />
        </>
      }
      faqs={[...(config.extraFaqs ?? []), ...common]}
    />
  );
}
