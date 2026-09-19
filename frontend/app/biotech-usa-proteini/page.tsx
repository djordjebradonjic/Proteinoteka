import { notFound } from "next/navigation";
import { CURRENT_MARKET } from "@/lib/marketConfig";
import { Metadata } from "next";
import { fetchBrandProducts, getSeoCopyStats } from "@/lib/seo-data";
import { classifyLine, compareCost, computeLineStats, formatWeightG, packRows, packSizeTrend, srPlural, widestSamePackSpread, type BrandLine } from "@/lib/brand-line-stats";
import { BrandLineGuide } from "@/components/seo/BrandLineGuide";
import { PackTable } from "@/components/seo/PackTable";
import { formatPrice } from "@/lib/formatPrice";
import { SEOBrandPage } from "@/components/seo/SEOBrandPage";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: "BioTech USA proteini u Srbiji — cene i poređenje 2026 | Proteinoteka" },
  description:
    "Aktuelne cene BioTech USA proteina u srpskim prodavnicama: Iso Whey Zero, 100% Pure Whey i ostale linije. Cena po pakovanju i po gramu proteina iz svih prodavnica.",
  alternates: { canonical: "https://proteinoteka.rs/biotech-usa-proteini" },
  openGraph: {
    title: "BioTech USA proteini u Srbiji 2026 | Proteinoteka",
    description:
      "Poređenje cena BioTech USA proizvoda u srpskim prodavnicama. Iso Whey Zero, 100% Pure Whey — gde je BioTech USA najjeftiniji u Srbiji?",
    url: "https://proteinoteka.rs/biotech-usa-proteini",
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

// Order matters: first match wins ("Hydro" and "Casein" must be tested before the generic whey lines).
const LINES: BrandLine[] = [
  { key: "casein", label: "Kazein", blurb: "Kazein — sporo se vari, pa se najčešće pije uveče.", match: /casein|kazein/i },
  { key: "vegan", label: "Vegan Protein", blurb: "Biljni protein za one koji ne konzumiraju mlečne proizvode.", match: /vegan/i },
  { key: "hydro", label: "Hydro Whey", blurb: "Hidrolizovani whey: proteinski lanci su unapred razloženi, pa se brže apsorbuje.", match: /hydro/i },
  { key: "iso", label: "Iso Whey Zero", blurb: "Izolat; proizvođač ga navodi kao proizvod bez laktoze i bez dodatog šećera.", match: /iso\s*whey|iso\s*zero|whey\s*zero/i },
  { key: "pure", label: "100% Pure Whey", blurb: "Whey protein za svakodnevnu upotrebu.", match: /pure\s*whey|100%\s*whey/i },
];

const fmtRsd = (v: number) => formatPrice(Math.round(v));
const fmt1 = (v: number) => v.toFixed(1).replace(".", ",");

export default async function Page() {
  if (CURRENT_MARKET !== "rs") notFound();
  // The brand string is stored under several spellings depending on the store and the
  // normalisation run; the API compares brand names case-insensitively and accepts a list.
  const fetched = await fetchBrandProducts({ brand: "BioTech USA,Biotech,BioTechUSA,Biotech USA", limit: 100 });
  const seen = new Set<number>();
  const products = fetched.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
  // fetch helpers swallow errors and return []; never let ISR cache that as a "valid" empty page.
  if (products.length === 0) throw new Error("biotech-usa-proteini: no BioTech products returned, refusing to render");

  const stats = getSeoCopyStats(products);
  const lineStats = computeLineStats(products, LINES);
  const byKey = Object.fromEntries(lineStats.map((l) => [l.line.key, l]));
  const storeNames = [...new Set(products.map((p) => p.storeName))].sort();

  const iso = byKey.iso;
  const pure = byKey.pure;
  const isoProducts = products.filter((p) => classifyLine(p.name, LINES)?.key === "iso");
  const isoRows = packRows(isoProducts);
  const isoTrend = packSizeTrend(isoRows);
  const isoStores = [...new Set(isoProducts.map((p) => p.storeName))].sort();
  const isoList = isoRows.map((r) => `${formatWeightG(r.weightG)} za ${fmtRsd(r.product.numericPrice)}`);
  const isoVsPure =
    iso?.gpMedian != null && pure?.gpMedian != null
      ? { iso: fmt1(iso.gpMedian), pure: fmt1(pure.gpMedian), cmp: compareCost(iso.gpMedian, pure.gpMedian) }
      : null;
  const spread = widestSamePackSpread(products);
  const lineSummary = lineStats
    .map((l) => `${l.line.label} (${l.count} ${srPlural(l.count, { one: "ponuda", few: "ponude", many: "ponuda" })}${l.proteinMedian ? `, oko ${Math.round(l.proteinMedian)} g proteina na 100 g` : ""})`)
    .join(", ");

  return (
    <SEOBrandPage
      h1="BioTech USA proteini u Srbiji"
      brandName="BioTech USA"
      brandApiName="BioTech USA"
      intro={`BioTechUSA je mađarska kompanija sa sedištem u Budimpešti, poznata po linijama Iso Whey Zero i 100% Pure Whey.${products.length > 0 ? ` Na Proteinoteci pratimo ${products.length} BioTech ${srPlural(products.length, { one: "ponudu", few: "ponude", many: "ponuda" })} u ${storeNames.length} ${srPlural(storeNames.length, { one: "prodavnici", few: "prodavnice", many: "prodavnica" })}${stats ? `, sa cenama od ${stats.minPriceLabel} do ${stats.maxPriceLabel}` : ""}.` : ""} Ispod je cena Iso Whey Zero po pakovanju i cena po gramu proteina svake linije, da vidiš šta se stvarno isplati.`}
      products={products}
      currentSlug="biotech-usa-proteini"
      insightsSection={
        <>
          <PackTable title="BioTech Iso Whey Zero: cena po pakovanju" products={isoProducts} />
          <BrandLineGuide brandName="BioTech USA" products={products} lines={LINES} />
        </>
      }
      faqs={[
        {
          q: "Šta je BioTech USA i odakle dolazi?",
          a: `BioTechUSA je mađarski proizvođač suplemenata sa sedištem u Budimpešti. Na Proteinoteci ga pratimo u ${storeNames.length} ${srPlural(storeNames.length, { one: "prodavnici", few: "prodavnice", many: "prodavnica" })}: ${storeNames.join(", ")}.`,
        },
        {
          q: "Koje BioTech USA proteine pratite i koliko proteina imaju?",
          a: lineSummary
            ? `Trenutno pratimo: ${lineSummary}. Procenat proteina računamo kao medijanu deklarisanih vrednosti u ponudama, pa se može malo razlikovati od pakovanja do pakovanja.`
            : "Tabela iznad prikazuje sve BioTech proteine koje pratimo, sa procentom proteina na 100 g.",
        },
        {
          q: "Da li je BioTech USA Iso Whey Zero dobar za osobe sa intolerancijom na laktozu?",
          a: "Proizvođač Iso Whey Zero navodi kao whey izolat bez laktoze i bez dodatog šećera, što ga čini češćim izborom kod osoba sa blažom intolerancijom. Ako imaš tešku intoleranciju ili alergiju na mlečni protein, posavetuj se sa lekarom, a kao alternativu pogledaj biljne proteine.",
        },
        {
          q: "Koja je razlika između BioTech USA 100% Pure Whey i Iso Whey Zero?",
          a: `Iso Whey Zero je izolat${iso?.proteinMedian ? ` (u našim ponudama oko ${Math.round(iso.proteinMedian)} g proteina na 100 g)` : ""}, a 100% Pure Whey je whey protein za svakodnevnu upotrebu${pure?.proteinMedian ? ` (oko ${Math.round(pure.proteinMedian)} g na 100 g)` : ""}. ${isoVsPure ? (isoVsPure.cmp === "pricier" ? `Izolat je skuplji: ${isoVsPure.iso} RSD po gramu proteina naspram ${isoVsPure.pure} RSD kod Pure Whey-a (medijane po ponudama).` : isoVsPure.cmp === "cheaper" ? `Po gramu proteina izolat je trenutno čak i jeftiniji: ${isoVsPure.iso} RSD naspram ${isoVsPure.pure} RSD kod Pure Whey-a (medijane po ponudama).` : `Po gramu proteina razlika je mala: ${isoVsPure.iso} RSD kod izolata naspram ${isoVsPure.pure} RSD kod Pure Whey-a (medijane po ponudama).`) : ""} Izolat ima smisla ako slabije podnosiš laktozu ili brojiš svaki gram masti; za većinu vežbača dovoljan je i osnovni whey.`,
        },
        {
          q: "Gde je BioTech USA najjeftiniji u Srbiji?",
          a: `${spread ? `Isto pakovanje (${classifyLine(spread.name, LINES)?.label ?? spread.name}, ${formatWeightG(spread.weightG)}) prodaje se u ${spread.stores} ${srPlural(spread.stores, { one: "prodavnici", few: "prodavnice", many: "prodavnica" })}: od ${fmtRsd(spread.low.numericPrice)} (${spread.low.storeName}) do ${fmtRsd(spread.high.numericPrice)} (${spread.high.storeName}), razlika je ${Math.round(spread.pct * 100)}%. ` : ""}${isoRows.length > 0 ? `Iso Whey Zero trenutno pratimo u ${isoStores.length} ${srPlural(isoStores.length, { one: "prodavnici", few: "prodavnice", many: "prodavnica" })} (${isoStores.join(", ")}): ${isoList.join(", ")}.${isoTrend ? (isoTrend.cmp === "cheaper" ? ` Veće pakovanje se isplati: ${formatWeightG(isoTrend.large.weightG)} košta ${fmt1(isoTrend.large.gp)} RSD po gramu proteina naspram ${fmt1(isoTrend.small.gp)} RSD za ${formatWeightG(isoTrend.small.weightG)}.` : isoTrend.cmp === "pricier" ? ` Veće pakovanje se ovde ne isplati: ${formatWeightG(isoTrend.large.weightG)} košta ${fmt1(isoTrend.large.gp)} RSD po gramu proteina, a ${formatWeightG(isoTrend.small.weightG)} ${fmt1(isoTrend.small.gp)} RSD.` : ` Cena po gramu proteina je slična za najmanje i najveće pakovanje (${fmt1(isoTrend.small.gp)} i ${fmt1(isoTrend.large.gp)} RSD).`) : ""} ` : ""}Tabela „Gde kupiti“ iznad prikazuje najnižu trenutnu cenu po prodavnici, a price alert javlja kad cena padne.`,
        },
        {
          q: "Koliko košta BioTech USA protein u Srbiji?",
          a: stats
            ? `Ponude se kreću od ${stats.minPriceLabel} do ${stats.maxPriceLabel}: najjeftinija je „${stats.cheapest.name}“, a najskuplja „${stats.priciest.name}“. Raspon je širok jer obuhvata različite linije i veličine pakovanja, pa je cena po gramu proteina pouzdanije poređenje od cene tegle.`
            : "Tabela iznad prikazuje aktuelnu cenu za svako pakovanje.",
        },
        {
          q: "Kako da pratim cene BioTech USA proizvoda u Srbiji?",
          a: "Na Proteinoteci možeš aktivirati price alert za bilo koji BioTech USA proizvod: uneseš email i ciljnu cenu, bez registracije. Kada cena padne ispod željene vrednosti, dobijaš email obaveštenje.",
        },
      ]}
    />
  );
}
