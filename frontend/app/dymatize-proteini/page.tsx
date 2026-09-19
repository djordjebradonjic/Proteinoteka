import { notFound } from "next/navigation";
import { CURRENT_MARKET } from "@/lib/marketConfig";
import { Metadata } from "next";
import { fetchBrandProducts, getSeoCopyStats } from "@/lib/seo-data";
import { classifyLine, compareCost, computeLineStats, formatWeightG, packRows, packSizeTrend, srPlural, type BrandLine } from "@/lib/brand-line-stats";
import { BrandLineGuide } from "@/components/seo/BrandLineGuide";
import { PackTable } from "@/components/seo/PackTable";
import { formatPrice } from "@/lib/formatPrice";
import { SEOBrandPage } from "@/components/seo/SEOBrandPage";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: "Dymatize proteini u Srbiji — cene i poređenje 2026 | Proteinoteka" },
  description:
    "Aktuelne cene Dymatize proteina u srpskim prodavnicama. ISO100 hidrolizat, Elite Whey — poredimo cene i value score iz svih prodavnica. Gde je Dymatize najjeftiniji?",
  alternates: { canonical: "https://proteinoteka.rs/dymatize-proteini" },
  openGraph: {
    title: "Dymatize proteini u Srbiji 2026 | Proteinoteka",
    description:
      "Poređenje cena Dymatize proizvoda u srpskim prodavnicama. ISO100 hidrolizat — gde je najjeftiniji u Srbiji?",
    url: "https://proteinoteka.rs/dymatize-proteini",
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

// Order matters: first match wins.
const LINES: BrandLine[] = [
  { key: "iso100", label: "ISO100", blurb: "Hidrolizovani whey izolat: brža apsorpcija i minimalno ugljenih hidrata i masti.", match: /iso[\s-]?100/i },
  { key: "elite", label: "Elite Whey", blurb: "Whey za svakodnevnu upotrebu, namenjen širem krugu vežbača.", match: /elite/i },
];

const fmtRsd = (v: number) => formatPrice(Math.round(v));
const fmt1 = (v: number) => v.toFixed(1).replace(".", ",");

export default async function Page() {
  if (CURRENT_MARKET !== 'rs') notFound();
  const products = await fetchBrandProducts({ brand: "Dymatize Nutrition", limit: 100 });
  const stats = getSeoCopyStats(products);
  const lineStats = computeLineStats(products, LINES);
  const byKey = Object.fromEntries(lineStats.map((l) => [l.line.key, l]));
  const storeNames = [...new Set(products.map((p) => p.storeName))].sort();

  const iso = byKey.iso100;
  const elite = byKey.elite;
  const isoProducts = products.filter((p) => classifyLine(p.name, LINES)?.key === "iso100");
  const eliteProducts = products.filter((p) => classifyLine(p.name, LINES)?.key === "elite");
  const isoRows = packRows(isoProducts);
  const eliteTrend = packSizeTrend(packRows(eliteProducts));
  const isoTrend = packSizeTrend(isoRows);
  const isoStores = [...new Set(isoProducts.map((p) => p.storeName))].sort();
  const isoList = isoRows.map((r) => `${formatWeightG(r.weightG)} za ${fmtRsd(r.product.numericPrice)}`);

  const trendSentence = (label: string, t: ReturnType<typeof packSizeTrend>) =>
    !t
      ? ""
      : t.cmp === "cheaper"
        ? ` ${label}: veće pakovanje se isplati, ${formatWeightG(t.large.weightG)} košta ${fmt1(t.large.gp)} RSD po gramu proteina naspram ${fmt1(t.small.gp)} RSD za ${formatWeightG(t.small.weightG)}.`
        : t.cmp === "pricier"
          ? ` ${label}: veće pakovanje se ovde ne isplati, ${formatWeightG(t.large.weightG)} košta ${fmt1(t.large.gp)} RSD po gramu proteina, a ${formatWeightG(t.small.weightG)} ${fmt1(t.small.gp)} RSD.`
          : ` ${label}: cena po gramu proteina je slična za oba pakovanja (${fmt1(t.small.gp)} i ${fmt1(t.large.gp)} RSD).`;

  return (
    <SEOBrandPage
      h1="Dymatize proteini u Srbiji"
      brandName="Dymatize"
      brandApiName="Dymatize"
      intro={`Dymatize je američki brend poznat po ISO100, hidrolizovanom whey izolatu sa oko 25 g proteina po porciji, kao i po Elite Whey liniji za svakodnevnu upotrebu.${products.length > 0 ? ` Na Proteinoteci pratimo ${products.length} Dymatize ${srPlural(products.length, { one: "ponudu", few: "ponude", many: "ponuda" })} u ${storeNames.length} ${srPlural(storeNames.length, { one: "prodavnici", few: "prodavnice", many: "prodavnica" })} (${storeNames.join(", ")})${stats ? `, sa cenama od ${stats.minPriceLabel} do ${stats.maxPriceLabel}` : ""}.` : ""} Ispod je cena ISO100 po pakovanju i po gramu proteina, da vidiš koje se pakovanje isplati.`}
      products={products}
      currentSlug="dymatize-proteini"
      extraGuideLinks={[{ label: "ISO100 recenzija", href: "/vodici/dymatize-iso-100-recenzija" }]}
      insightsSection={
        <>
          <PackTable
            title="Dymatize ISO100: cena po pakovanju"
            products={isoProducts}
            more={{ href: "/vodici/dymatize-iso-100-recenzija", label: "Recenzija ISO100: sastav, ukusi i iskustva" }}
          />
          <BrandLineGuide brandName="Dymatize" products={products} lines={LINES} />
        </>
      }
      faqs={[
        {
          q: "Šta je Dymatize ISO100 i zašto je popularan?",
          a: `ISO100 je hidrolizovani whey izolat sa oko 25 g proteina po porciji i minimalnim ugljenim hidratima i mastima${iso?.proteinMedian ? ` (u našim ponudama oko ${Math.round(iso.proteinMedian)} g proteina na 100 g)` : ""}. Hidroliza znači da su proteinski lanci već razloženi na manje peptide, što ubrzava apsorpciju. Popularan je kod onih koji žele čist protein bez suvišnih sastojaka, posebno u periodu mršavljenja ili definicije.`,
        },
        {
          q: "Koja je razlika između Dymatize ISO100 i Elite Whey?",
          a: `ISO100 je hidrolizovani izolat, dok je Elite Whey mešavina koncentrata i izolata sa nešto više ugljenih hidrata i masti.${iso?.gpMedian != null && elite?.gpMedian != null ? (compareCost(iso.gpMedian, elite.gpMedian) === "pricier" ? ` Po gramu proteina ISO100 je skuplji: ${fmt1(iso.gpMedian)} RSD naspram ${fmt1(elite.gpMedian)} RSD kod Elite Whey-a (medijane po ponudama).` : compareCost(iso.gpMedian, elite.gpMedian) === "cheaper" ? ` Po gramu proteina ISO100 je trenutno čak i jeftiniji: ${fmt1(iso.gpMedian)} RSD naspram ${fmt1(elite.gpMedian)} RSD kod Elite Whey-a (medijane po ponudama).` : ` Po gramu proteina razlika je mala: ${fmt1(iso.gpMedian)} RSD kod ISO100 naspram ${fmt1(elite.gpMedian)} RSD kod Elite Whey-a.`) : ""} Za rekreativce je Elite Whey obično dovoljan; ISO100 ima smisla ako slabije podnosiš laktozu ili želiš što čistiji sastav.`,
        },
        {
          q: "Gde je Dymatize ISO100 najjeftiniji u Srbiji?",
          a: isoRows.length > 0
            ? `ISO100 trenutno pratimo u ${isoStores.length} ${srPlural(isoStores.length, { one: "prodavnici", few: "prodavnice", many: "prodavnica" })} (${isoStores.join(", ")}): ${isoList.join(", ")}.${trendSentence("ISO100", isoTrend)} Tabela „Gde kupiti“ iznad prikazuje najnižu trenutnu cenu po prodavnici, a price alert javlja kad cena padne.`
            : "Tabela „Gde kupiti“ iznad prikazuje najnižu trenutnu cenu po prodavnici.",
        },
        {
          q: "Da li je Dymatize dostupan u svim srpskim prodavnicama suplemenata?",
          a: storeNames.length > 0
            ? `Ne. Dymatize trenutno pratimo u ${storeNames.length} ${srPlural(storeNames.length, { one: "prodavnici", few: "prodavnice", many: "prodavnica" })}: ${storeNames.join(", ")}. Ako neku prodavnicu ne vidiš u tabeli, znači da u njoj nismo pronašli Dymatize proizvode.`
            : "Tabela iznad prikazuje sve prodavnice u kojima smo pronašli Dymatize proizvode.",
        },
        {
          q: "Koliko košta Dymatize u Srbiji?",
          a: stats
            ? `Ponude se kreću od ${stats.minPriceLabel} do ${stats.maxPriceLabel}.${trendSentence("Elite Whey", eliteTrend)} Razlika u ceni dolazi i od linije (ISO100 ili Elite) i od veličine pakovanja, pa je cena po gramu proteina pouzdanije poređenje od cene tegle.`
            : "Aktuelne cene za svako pakovanje prikazane su u tabeli iznad.",
        },
        {
          q: "Da li Dymatize ima sertifikate kvaliteta?",
          a: "Dymatize u inostranstvu ističe NSF Certified for Sport sertifikat za ISO100, što znači da je testiran od strane nezavisne laboratorije na zabranjene supstance. Za kupovinu u Srbiji preporučujemo kupovinu iz ovlašćenih prodavnica. Proteinoteka prati samo cene i ne može garantovati autentičnost.",
        },
      ]}
    />
  );
}
