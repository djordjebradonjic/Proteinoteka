import { cache } from "react";
import { notFound } from "next/navigation";
import { CURRENT_MARKET } from "@/lib/marketConfig";
import { Metadata } from "next";
import { fetchProductsByQuery, getSeoCopyStats } from "@/lib/seo-data";
import { fetchMarketCatalog } from "@/lib/whey-price-stats";
import { compareCost, computeLineStats, formatWeightG, medianGpBySource, packRows, packSizeTrend, srPlural, widestSamePackSpread, type BrandLine } from "@/lib/brand-line-stats";
import { BrandLineGuide } from "@/components/seo/BrandLineGuide";
import { PackTable } from "@/components/seo/PackTable";
import { formatPrice } from "@/lib/formatPrice";
import { SEOBrandPage } from "@/components/seo/SEOBrandPage";
import type { Product } from "@/types/product";
import { rsPageMetadata } from "@/lib/seo-meta";
import { safeJsonLd } from "@/lib/jsonLd";

export const revalidate = 86400;

const NAME_RE = /amino\s+(whey\s+)?hydro/i;

const loadAmino = cache(async (): Promise<Product[]> => {
  const [a, b] = await Promise.all([
    fetchProductsByQuery({ name: "amino whey hydro", limit: 100 }),
    fetchProductsByQuery({ name: "amino hydro", limit: 100 }),
  ]);
  const seen = new Set<number>();
  const products = [...a, ...b].filter((p) => {
    if (seen.has(p.id) || !NAME_RE.test(p.name)) return false;
    seen.add(p.id);
    return true;
  });
  // fetch helpers swallow errors and return []; never let ISR cache that as a "valid" empty page.
  if (products.length === 0) throw new Error("amino-whey-hydro-cena: no products returned, refusing to render");
  return products;
});

// The cheapest listing goes into the title: "cena" queries click through on a concrete price.
// Any failure falls back to the static title, a missing price must never break metadata.
export async function generateMetadata(): Promise<Metadata> {
  let from = "";
  try {
    const cheapest = Math.min(...(await loadAmino()).filter((p) => p.numericPrice > 0).map((p) => p.numericPrice));
    if (Number.isFinite(cheapest)) from = `, od ${formatPrice(Math.round(cheapest))}`;
  } catch {
    /* static fallback */
  }
  return rsPageMetadata({
    path: "/amino-whey-hydro-cena",
    title: `Amino Whey Hydro cena u Srbiji${from}`,
    description:
      "Koliko košta THE Nutrition Amino Whey Hydro u Srbiji? Cena svakog pakovanja po prodavnici i po gramu proteina, uz poređenje sa hidrolizatima i izolatima.",
    ogTitle: "Amino Whey Hydro cena u Srbiji 2026 | Proteinoteka",
  });
}

// One line only: the guide block is used here for the cheapest-listing link and the
// "same pack, different price" comparison across stores.
const LINES: BrandLine[] = [
  { key: "amino", label: "Amino Whey Hydro", blurb: "Mešavina hidrolizovanog whey-a, whey koncentrata i hidrolizovanog kolagena.", match: NAME_RE },
];

const fmtRsd = (v: number) => formatPrice(Math.round(v));
const fmt1 = (v: number) => v.toFixed(1).replace(".", ",");

// Optional context only: if the catalog fetch fails the page still renders, just without the
// market comparison sentence. Amino Whey Hydro itself is excluded so it isn't compared to itself.
async function marketMedians() {
  try {
    return medianGpBySource((await fetchMarketCatalog()).filter((p) => !NAME_RE.test(p.name)));
  } catch {
    return null;
  }
}

export default async function Page() {
  if (CURRENT_MARKET !== "rs") notFound();

  const [products, market] = await Promise.all([loadAmino(), marketMedians()]);

  const stats = getSeoCopyStats(products);
  // AggregateOffer only for a single pack size sold by several stores, so low/high are comparable.
  const pack = widestSamePackSpread(products, 2);
  const productJsonLd = pack ? {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `THE Nutrition Amino Whey Hydro ${formatWeightG(pack.weightG)}`,
    brand: { "@type": "Brand", name: "THE Nutrition" },
    category: "Proteinski prah",
    ...(pack.low.imageUrl ? { image: pack.low.imageUrl } : {}),
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "RSD",
      lowPrice: pack.low.numericPrice,
      highPrice: pack.high.numericPrice,
      offerCount: pack.stores,
    },
  } : null;
  const storeNames = [...new Set(products.map((p) => p.storeName))].sort();
  const rows = packRows(products);
  const trend = packSizeTrend(rows);
  const list = rows.map((r) => `${formatWeightG(r.weightG)} za ${fmtRsd(r.product.numericPrice)}`);
  const proteinValues = products.map((p) => p.proteinPer100g).filter((v): v is number => v != null && v >= 40 && v <= 95);
  const proteinAvg = proteinValues.length > 0 ? proteinValues.reduce((s, v) => s + v, 0) / proteinValues.length : null;
  const flavours = [...new Set(products.flatMap((p) => p.flavours ?? []).map((f) => f.trim()).filter(Boolean))];

  // Median price per gram of protein for Amino Whey Hydro itself vs the market's hydrolysates / isolates.
  const ownGp = computeLineStats(products, LINES)[0]?.gpMedian ?? null;
  const hydroMarket = market?.hydrolysate ?? null;
  const isoMarket = market?.whey_isolate ?? null;

  const vsMarket = (label: string, m: { gp: number; count: number } | null) => {
    if (ownGp == null || !m || m.count < 5) return "";
    const cmp = compareCost(ownGp, m.gp);
    return cmp === "cheaper"
      ? ` U poređenju sa ${label} (medijana ${fmt1(m.gp)} RSD po gramu proteina, ${m.count} ponuda), Amino Whey Hydro je jeftiniji: oko ${fmt1(ownGp)} RSD.`
      : cmp === "pricier"
        ? ` U poređenju sa ${label} (medijana ${fmt1(m.gp)} RSD po gramu proteina, ${m.count} ponuda), Amino Whey Hydro je skuplji: oko ${fmt1(ownGp)} RSD.`
        : ` Prema ceni po gramu proteina Amino Whey Hydro (oko ${fmt1(ownGp)} RSD) je na nivou ${label} (medijana ${fmt1(m.gp)} RSD, ${m.count} ponuda).`;
  };

  return (
    <SEOBrandPage
      h1="THE Nutrition Amino Whey Hydro: cena u Srbiji"
      brandName="THE Nutrition Amino Whey Hydro"
      brandApiName="THE Nutrition"
      intro={`Amino Whey Hydro je proteinski prah brenda THE Nutrition. Prema opisima prodavnica, protein u njemu dolazi iz hidrolizovanog whey-a, whey koncentrata i hidrolizovanog kolagena.${products.length > 0 ? ` Na Proteinoteci pratimo ${products.length} ${srPlural(products.length, { one: "ponudu", few: "ponude", many: "ponuda" })} u ${storeNames.length} ${srPlural(storeNames.length, { one: "prodavnici", few: "prodavnice", many: "prodavnica" })} (${storeNames.join(", ")})${stats ? `, sa cenama od ${stats.minPriceLabel} do ${stats.maxPriceLabel}` : ""}.` : ""} Ispod je cena svakog pakovanja i cena po gramu proteina, da vidiš koje pakovanje i koja prodavnica se najviše isplate.`}
      products={products}
      currentSlug="amino-whey-hydro-cena"
      extraGuideLinks={[{ label: "Whey izolat: vodič i cene", href: "/whey-protein-izolat" }]}
      insightsSection={
        <>
          {productJsonLd && (
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(productJsonLd) }} />
          )}
          <PackTable
            title="Amino Whey Hydro: cena po pakovanju"
            products={products}
            more={{ href: "/kategorija/hidrolizat", label: "Svi hidrolizati u Srbiji, poređeni po ceni" }}
          />
          <BrandLineGuide brandName="Amino Whey Hydro" products={products} lines={LINES} />
        </>
      }
      faqs={[
        {
          q: "Šta je Amino Whey Hydro i šta sadrži?",
          a: `Amino Whey Hydro je proteinska mešavina brenda THE Nutrition. Prodavnice u opisu navode tri izvora proteina: hidrolizovani whey, whey koncentrat i hidrolizovani kolagen, bez tačnih udela.${proteinAvg != null ? ` U našim ponudama proteina ima oko ${Math.round(proteinAvg)} g na 100 g.` : ""} Hidroliza znači da su proteinski lanci već razloženi na manje peptide, pa se protein brže apsorbuje.${flavours.length > 0 ? ` Ukusi koje pratimo: ${flavours.slice(0, 8).join(", ")}${flavours.length > 8 ? " i drugi" : ""}.` : ""}`,
        },
        {
          q: "Da li kolagen u sastavu utiče na kvalitet proteina?",
          a: "Da. Kolagen nema potpun aminokiselinski profil kao whey (nedostaje mu triptofan), pa deo proteina iz kolagena manje doprinosi izgradnji mišića nego isti broj grama whey proteina. Zato procenat proteina na deklaraciji sam po sebi ne govori sve: uz njega gledaj cenu po gramu proteina i value score, koji sastav uzima u obzir. Tačan udeo kolagena nismo našli u opisima prodavnica.",
        },
        {
          q: "Koliko košta Amino Whey Hydro u Srbiji?",
          a: stats
            ? `Ponude se kreću od ${stats.minPriceLabel} do ${stats.maxPriceLabel}${rows.length > 0 ? `: ${list.join(", ")}` : ""}. Raspon zavisi od pakovanja i prodavnice, pa je cena po gramu proteina pouzdanije poređenje od cene tegle.${vsMarket("ostalim hidrolizatima", hydroMarket)}`
            : "Tabela iznad prikazuje aktuelnu cenu za svako pakovanje.",
        },
        {
          q: "Koje pakovanje Amino Whey Hydro se najviše isplati?",
          a: trend
            ? trend.cmp === "cheaper"
              ? `Veće pakovanje se isplati: ${formatWeightG(trend.large.weightG)} košta ${fmt1(trend.large.gp)} RSD po gramu proteina, a ${formatWeightG(trend.small.weightG)} ${fmt1(trend.small.gp)} RSD (najpovoljnije ponude za svaku veličinu). Manje pakovanje ima smisla ako prvi put probaš ukus.`
              : trend.cmp === "pricier"
                ? `Veće pakovanje se ovde ne isplati: ${formatWeightG(trend.large.weightG)} košta ${fmt1(trend.large.gp)} RSD po gramu proteina, a ${formatWeightG(trend.small.weightG)} ${fmt1(trend.small.gp)} RSD (najpovoljnije ponude za svaku veličinu).`
                : `Cena po gramu proteina je slična za najmanje i najveće pakovanje (${fmt1(trend.small.gp)} i ${fmt1(trend.large.gp)} RSD), pa biraj prema tome koliko brzo ga potrošiš.`
            : "Tabela iznad prikazuje cenu po gramu proteina za svako pakovanje koje pratimo.",
        },
        {
          q: "Gde je Amino Whey Hydro najjeftiniji?",
          a: `Amino Whey Hydro pratimo u ${storeNames.length} ${srPlural(storeNames.length, { one: "prodavnici", few: "prodavnice", many: "prodavnica" })}: ${storeNames.join(", ")}. Isto pakovanje se u različitim prodavnicama prodaje po različitoj ceni; tabela „Gde kupiti“ iznad prikazuje najnižu trenutnu cenu po prodavnici, a price alert na proizvodu javlja kad cena padne.`,
        },
        {
          q: "Koji je bolji izbor: Amino Whey Hydro ili whey izolat?",
          a: `Zavisi od toga šta ti je bitno. Izolat je čistiji whey protein bez kolagena i obično je sigurniji izbor ako gledaš sam kvalitet proteina; hidrolizat se brže apsorbuje, ali razlika u efektu kod rekreativaca je mala.${vsMarket("whey izolatima", isoMarket)} Za širi pregled pogledaj vodič o izolatu i kategoriju hidrolizata.`,
        },
      ]}
    />
  );
}
