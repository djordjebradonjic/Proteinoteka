import { cache } from "react";
import { notFound } from "next/navigation";
import { CURRENT_MARKET } from "@/lib/marketConfig";
import { Metadata } from "next";
import { fetchBrandProducts, fetchProductsByQuery, getSeoCopyStats } from "@/lib/seo-data";
import { classifyLine, compareCost, computeLineStats, formatWeightG, packRows, packSizeTrend, srPlural, type BrandLine } from "@/lib/brand-line-stats";
import { BrandLineGuide } from "@/components/seo/BrandLineGuide";
import { PackTable } from "@/components/seo/PackTable";
import { formatPrice } from "@/lib/formatPrice";
import { SEOBrandPage } from "@/components/seo/SEOBrandPage";
import { rsPageMetadata } from "@/lib/seo-meta";

export const revalidate = 86400;

// The brand string differs between stores/normalisation runs, and some listings only carry
// "Tesla" in the product name, so we merge both lookups and keep anything that says Tesla.
const loadTesla = cache(async () => {
  const [byBrand, byName] = await Promise.all([
    fetchBrandProducts({ brand: "Tesla Nutrition,Tesla Sports Nutrition,Tesla", limit: 100 }),
    fetchProductsByQuery({ name: "tesla", limit: 100 }),
  ]);
  const seen = new Set<number>();
  const products = [...byBrand, ...byName].filter((p) => {
    if (seen.has(p.id) || !(/tesla/i.test(p.name) || /tesla/i.test(p.brand ?? ""))) return false;
    seen.add(p.id);
    return true;
  });
  // fetch helpers swallow errors and return []; never let ISR cache that as a "valid" empty page.
  if (products.length === 0) throw new Error("tesla-nutrition-proteini: no Tesla products returned, refusing to render");
  return products;
});

// The cheapest listing goes into the title: "cena" queries click through on a concrete price.
// Any failure falls back to the static title, a missing price must never break metadata.
export async function generateMetadata(): Promise<Metadata> {
  let from = "";
  try {
    const cheapest = Math.min(...(await loadTesla()).filter((p) => p.numericPrice > 0).map((p) => p.numericPrice));
    if (Number.isFinite(cheapest)) from = `, od ${formatPrice(Math.round(cheapest))}`;
  } catch {
    /* static fallback */
  }
  return rsPageMetadata({
    path: "/tesla-nutrition-proteini",
    title: `Tesla proteini cena u Srbiji${from}`,
    description:
      "Cene Tesla Nutrition proteina (Iso Zero 100, Whey Charger 100) u srpskim prodavnicama: cena po pakovanju i po gramu proteina, uz poređenje prodavnica.",
    ogTitle: "Tesla Nutrition proteini u Srbiji 2026 | Proteinoteka",
  });
}

// Order matters: first match wins. Product names come from the stores ("Iso zero100 2kg – Tesla
// nutrition", "Tesla Whey Charger 5kg"), so the patterns tolerate missing spaces.
const LINES: BrandLine[] = [
  { key: "casein", label: "Casein Charger", blurb: "Kazein — sporo se vari, pa se najčešće pije uveče.", match: /casein|kazein/i },
  { key: "iso", label: "Iso Zero 100", blurb: "Whey izolat: više proteina na 100 g i manje laktoze od koncentrata.", match: /iso\s*zero|iso\s*pro/i },
  { key: "charger", label: "Whey Charger 100", blurb: "Whey protein za svakodnevnu upotrebu; proizvođač navodi digestivne enzime, BCAA i L-glutamin.", match: /charger/i },
];

const fmtRsd = (v: number) => formatPrice(Math.round(v));
const fmt1 = (v: number) => v.toFixed(1).replace(".", ",");

export default async function Page() {
  if (CURRENT_MARKET !== "rs") notFound();

  const products = await loadTesla();

  const stats = getSeoCopyStats(products);
  const lineStats = computeLineStats(products, LINES);
  const byKey = Object.fromEntries(lineStats.map((l) => [l.line.key, l]));
  const storeNames = [...new Set(products.map((p) => p.storeName))].sort();

  const iso = byKey.iso;
  const charger = byKey.charger;
  const isoProducts = products.filter((p) => classifyLine(p.name, LINES)?.key === "iso");
  const isoRows = packRows(isoProducts);
  const isoTrend = packSizeTrend(isoRows);
  const isoStores = [...new Set(isoProducts.map((p) => p.storeName))].sort();
  const isoList = isoRows.map((r) => `${formatWeightG(r.weightG)} za ${fmtRsd(r.product.numericPrice)}`);
  const isoVsCharger =
    iso?.gpMedian != null && charger?.gpMedian != null
      ? { iso: fmt1(iso.gpMedian), charger: fmt1(charger.gpMedian), cmp: compareCost(iso.gpMedian, charger.gpMedian) }
      : null;

  return (
    <SEOBrandPage
      h1="Tesla Nutrition proteini u Srbiji"
      brandName="Tesla Nutrition"
      brandApiName="Tesla Nutrition"
      intro={`Tesla Nutrition (na pakovanjima „Tesla Sports Nutrition“) je brend čije su glavne linije Iso Zero 100 (izolat) i Whey Charger 100 (whey protein).${products.length > 0 ? ` Na Proteinoteci pratimo ${products.length} Tesla ${srPlural(products.length, { one: "ponudu", few: "ponude", many: "ponuda" })} u ${storeNames.length} ${srPlural(storeNames.length, { one: "prodavnici", few: "prodavnice", many: "prodavnica" })} (${storeNames.join(", ")})${stats ? `, sa cenama od ${stats.minPriceLabel} do ${stats.maxPriceLabel}` : ""}.` : ""} Ispod je cena svakog pakovanja i cena po gramu proteina, da vidiš koje se pakovanje i koja prodavnica najviše isplate.`}
      products={products}
      currentSlug="tesla-nutrition-proteini"
      insightsSection={
        <>
          <PackTable title="Tesla Iso Zero 100: cena po pakovanju" products={isoProducts} />
          <BrandLineGuide brandName="Tesla" products={products} lines={LINES} />
        </>
      }
      faqs={[
        {
          q: "Šta je Tesla Iso Zero 100?",
          a: `Iso Zero 100 je Teslin whey izolat: proteini su odvojeni od većine masti i laktoze dodatnom filtracijom.${iso?.proteinMedian ? ` U našim ponudama sadrži oko ${Math.round(iso.proteinMedian)} g proteina na 100 g.` : ""} Proizvođač ga nudi u više ukusa. Ako ti je bitna što manja količina masti i ugljenih hidrata, izolat je logičan izbor; za svakodnevnu upotrebu bez posebnih zahteva dovoljan je i koncentrat.`,
        },
        {
          q: "Koja je razlika između Tesla Iso Zero 100 i Whey Charger 100?",
          a: `Iso Zero 100 je izolat, a Whey Charger 100 je whey protein na bazi koncentrata${charger?.proteinMedian ? ` (oko ${Math.round(charger.proteinMedian)} g proteina na 100 g naspram ${iso?.proteinMedian ? Math.round(iso.proteinMedian) : "više"} g kod izolata)` : ""}. ${isoVsCharger ? (isoVsCharger.cmp === "pricier" ? `Izolat je skuplji: ${isoVsCharger.iso} RSD po gramu proteina naspram ${isoVsCharger.charger} RSD kod Whey Charger-a (medijane po ponudama).` : isoVsCharger.cmp === "cheaper" ? `Po gramu proteina izolat je trenutno čak i jeftiniji: ${isoVsCharger.iso} RSD naspram ${isoVsCharger.charger} RSD kod Whey Charger-a (medijane po ponudama).` : `Po gramu proteina razlika je mala: ${isoVsCharger.iso} RSD kod izolata naspram ${isoVsCharger.charger} RSD kod Whey Charger-a (medijane po ponudama).`) : ""} Izolat ima smisla ako slabije podnosiš laktozu ili brojiš svaki gram masti.`,
        },
        {
          q: "Gde je Tesla Iso Zero 100 najjeftiniji u Srbiji?",
          a: isoRows.length > 0
            ? `Iso Zero 100 trenutno pratimo u ${isoStores.length} ${srPlural(isoStores.length, { one: "prodavnici", few: "prodavnice", many: "prodavnica" })} (${isoStores.join(", ")}): ${isoList.join(", ")}.${isoTrend ? (isoTrend.cmp === "cheaper" ? ` Veće pakovanje se isplati: ${formatWeightG(isoTrend.large.weightG)} košta ${fmt1(isoTrend.large.gp)} RSD po gramu proteina naspram ${fmt1(isoTrend.small.gp)} RSD za ${formatWeightG(isoTrend.small.weightG)}.` : isoTrend.cmp === "pricier" ? ` Veće pakovanje se ovde ne isplati: ${formatWeightG(isoTrend.large.weightG)} košta ${fmt1(isoTrend.large.gp)} RSD po gramu proteina, a ${formatWeightG(isoTrend.small.weightG)} ${fmt1(isoTrend.small.gp)} RSD.` : ` Cena po gramu proteina je slična za najmanje i najveće pakovanje (${fmt1(isoTrend.small.gp)} i ${fmt1(isoTrend.large.gp)} RSD).`) : ""} Tabela „Gde kupiti“ iznad prikazuje najnižu trenutnu cenu po prodavnici, a price alert javlja kad cena padne.`
            : "Tabela „Gde kupiti“ iznad prikazuje najnižu trenutnu cenu po prodavnici.",
        },
        {
          q: "Koliko košta Tesla protein u Srbiji?",
          a: stats
            ? `Ponude se kreću od ${stats.minPriceLabel} do ${stats.maxPriceLabel}: najjeftinija je „${stats.cheapest.name}“, a najskuplja „${stats.priciest.name}“. Raspon je širok jer obuhvata različite linije i veličine pakovanja, pa je poređenje po gramu proteina pouzdanije od poređenja cena tegli.`
            : "Tabela iznad prikazuje aktuelnu cenu za svako pakovanje.",
        },
        {
          q: "Koji Tesla protein je najbolja vrednost za novac?",
          a: stats
            ? `Najbolji value score trenutno ima „${stats.bestValue.name}“: ${stats.bestValue.valueScore?.toFixed(1)}/10${stats.bestValue.proteinPer100g ? `, ${stats.bestValue.proteinPer100g} g proteina na 100 g` : ""}, prodavnica ${stats.bestValue.storeName}. Score uzima u obzir cenu, procenat proteina, čistoću sastava i ugled brenda; metodologiju možeš pročitati na stranici „Kako računamo value score“.`
            : "Tabela iznad prikazuje value score za svaki Tesla proizvod.",
        },
        {
          q: "Da li je Tesla dostupna u svim prodavnicama?",
          a: `Ne. Tesla trenutno pratimo u ${storeNames.length} ${srPlural(storeNames.length, { one: "prodavnici", few: "prodavnice", many: "prodavnica" })}: ${storeNames.join(", ")}. Ako neku prodavnicu ne vidiš u tabeli, znači da u njoj nismo pronašli Tesla proizvode.`,
        },
      ]}
    />
  );
}
