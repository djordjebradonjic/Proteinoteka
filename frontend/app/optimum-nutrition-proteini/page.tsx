import { notFound } from "next/navigation";
import { CURRENT_MARKET } from "@/lib/marketConfig";
import { Metadata } from "next";
import { fetchBrandProducts, getSeoCopyStats } from "@/lib/seo-data";
import { classifyLine, compareCost, computeLineStats, srPlural, widestSamePackSpread, type BrandLine } from "@/lib/brand-line-stats";
import { BrandLineGuide } from "@/components/seo/BrandLineGuide";
import { formatPrice } from "@/lib/formatPrice";
import { SEOBrandPage } from "@/components/seo/SEOBrandPage";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: "Optimum Nutrition proteini u Srbiji — cene i poređenje 2026 | Proteinoteka" },
  description:
    "Cene Optimum Nutrition proteina u srpskim prodavnicama: Gold Standard Whey, Platinum Hydrowhey, kazein, Plant. Isto pakovanje se razlikuje i po nekoliko hiljada dinara.",
  alternates: { canonical: "https://proteinoteka.rs/optimum-nutrition-proteini" },
  openGraph: {
    title: "Optimum Nutrition proteini u Srbiji 2026 | Proteinoteka",
    description:
      "Poređenje cena Optimum Nutrition proizvoda u srpskim prodavnicama. Gold Standard whey — gde je najjeftiniji u Srbiji?",
    url: "https://proteinoteka.rs/optimum-nutrition-proteini",
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

// Order matters: first match wins ("Gold Standard 100% Plant" must hit plant before Gold Standard).
const LINES: BrandLine[] = [
  { key: "plant", label: "Gold Standard 100% Plant", blurb: "Biljni protein iz Gold Standard porodice, za one koji ne konzumiraju mlečne proizvode.", match: /plant|vegan/i },
  { key: "casein", label: "100% Casein", blurb: "Kazein — sporo se vari, pa se najčešće pije uveče.", match: /casein|kazein/i },
  { key: "hydrowhey", label: "Platinum Hydrowhey", blurb: "Hidrolizovani whey: brža apsorpcija.", match: /hydro/i },
  { key: "goldstandard", label: "Gold Standard 100% Whey", blurb: "Flagship linija: whey na bazi izolata uz koncentrat i peptide.", match: /gold\s*standard|100%\s*whey/i },
];

const fmtRsd = (v: number) => formatPrice(Math.round(v));
const fmt1 = (v: number) => v.toFixed(1).replace(".", ",");

export default async function Page() {
  if (CURRENT_MARKET !== 'rs') notFound();
  const products = await fetchBrandProducts({ brand: "Optimum Nutrition", limit: 100 });
  const stats = getSeoCopyStats(products);
  const lineStats = computeLineStats(products, LINES);
  const byKey = Object.fromEntries(lineStats.map((l) => [l.line.key, l]));
  // Only Gold Standard: the FAQ answer and intro sentence are about that line.
  const spread = widestSamePackSpread(products.filter((p) => classifyLine(p.name, LINES)?.key === "goldstandard"));
  const storeNames = [...new Set(products.map((p) => p.storeName))].sort();

  const gold = byKey.goldstandard;
  const hydro = byKey.hydrowhey;
  const casein = byKey.casein;
  const plant = byKey.plant;
  const spreadKg = spread ? (spread.weightG / 1000).toLocaleString("sr-RS", { maximumFractionDigits: 2 }) : "";

  return (
    <SEOBrandPage
      h1="Optimum Nutrition proteini u Srbiji"
      brandName="Optimum Nutrition"
      brandApiName="Optimum Nutrition"
      intro={`Optimum Nutrition (ON) je jedan od najprodavanijih brendova proteinskih suplemenata na svetu, a njegov Gold Standard 100% Whey referentna je tačka po kojoj se porede ostali whey proteini.${products.length > 0 ? ` Na Proteinoteci pratimo ${products.length} ON ${srPlural(products.length, { one: "ponudu", few: "ponude", many: "ponuda" })} u ${storeNames.length} ${srPlural(storeNames.length, { one: "prodavnici", few: "prodavnice", many: "prodavnica" })}${stats ? `, sa cenama od ${stats.minPriceLabel} do ${stats.maxPriceLabel}` : ""}.` : ""}${spread ? ` Primer koliko se isplati porediti: isto pakovanje Gold Standard-a od ${spreadKg} kg razlikuje se ${fmtRsd(spread.diff)} između najjeftinije i najskuplje prodavnice.` : ""} Ispod je poređenje po gramu proteina i gde se koje pakovanje isplati kupiti.`}
      products={products}
      currentSlug="optimum-nutrition-proteini"
      insightsSection={<BrandLineGuide brandName="Optimum Nutrition" products={products} lines={LINES} />}
      faqs={[
        {
          q: "Koji Optimum Nutrition protein je najbolja vrednost za novac?",
          a: stats
            ? `Najbolji value score trenutno ima „${stats.bestValue.name}“: ${stats.bestValue.valueScore?.toFixed(1)}/10${stats.bestValue.proteinPer100g ? `, ${stats.bestValue.proteinPer100g} g proteina na 100 g` : ""}, prodavnica ${stats.bestValue.storeName}.${gold?.gpMedian != null ? ` Najčešća opcija, Gold Standard 100% Whey, košta medijanu ${fmt1(gold.gpMedian)} RSD po gramu proteina.` : ""} Veća pakovanja su po gramu proteina obično jeftinija, ali samo ako je cena tegle u skladu sa veličinom — zato poredi cenu po gramu, ne cenu tegle.`
            : "Tabela iznad prikazuje value score za svaki ON proizvod — meru koja uzima u obzir cenu, procenat proteina i čistoću sastava.",
        },
        {
          q: "Gde je Gold Standard whey najjeftiniji u Srbiji?",
          a: spread
            ? `${spreadKg} kg pakovanje se prodaje u ${spread.stores} ${srPlural(spread.stores, { one: "prodavnici", few: "prodavnice", many: "prodavnica" })}: najjeftinije je u prodavnici ${spread.low.storeName} (${fmtRsd(spread.low.numericPrice)}), a najskuplje u prodavnici ${spread.high.storeName} (${fmtRsd(spread.high.numericPrice)}). Razlika je ${fmtRsd(spread.diff)} (${Math.round(spread.pct * 100)}%) za isti proizvod. Cene se menjaju, pa tabela „Gde kupiti“ iznad uvek prikazuje najnižu trenutnu cenu po prodavnici; možeš i da aktiviraš price alert.`
            : `ON pratimo u ${storeNames.length > 0 ? storeNames.join(", ") : "više prodavnica"}. Tabela „Gde kupiti“ iznad prikazuje najnižu trenutnu cenu u svakoj od njih, a price alert javlja kad cena padne.`,
        },
        {
          q: "Koja je razlika između Gold Standard Whey i Platinum Hydrowhey?",
          a: `Gold Standard je whey na bazi izolata uz koncentrat i whey peptide${gold?.proteinMedian ? ` (oko ${Math.round(gold.proteinMedian)} g proteina na 100 g)` : ""}. Platinum Hydrowhey je hidrolizovani whey${hydro?.proteinMedian ? ` (oko ${Math.round(hydro.proteinMedian)} g na 100 g)` : ""} koji se brže apsorbuje.${gold?.gpMedian != null && hydro?.gpMedian != null ? (compareCost(hydro.gpMedian, gold.gpMedian) === "pricier" ? ` Po gramu proteina Hydrowhey je skuplji: ${fmt1(hydro.gpMedian)} RSD naspram ${fmt1(gold.gpMedian)} RSD kod Gold Standard-a (medijane po ponudama).` : compareCost(hydro.gpMedian, gold.gpMedian) === "cheaper" ? ` Po gramu proteina Hydrowhey je trenutno čak i jeftiniji: ${fmt1(hydro.gpMedian)} RSD naspram ${fmt1(gold.gpMedian)} RSD kod Gold Standard-a (medijane po ponudama), ali ga pratimo u manje ponuda.` : ` Po gramu proteina razlika je mala: ${fmt1(hydro.gpMedian)} RSD naspram ${fmt1(gold.gpMedian)} RSD (medijane po ponudama).`) : ""} Za rekreativce i većinu sportista Gold Standard je dovoljan; brža apsorpcija Hydrowhey-a za većinu vežbača nije presudna.`,
        },
        ...(casein || plant ? [{
          q: "Ima li Optimum Nutrition i druge proteine osim whey-a?",
          a: `Da${casein ? ": 100% Casein (kazein, sporije varenje, pogodan za uveče)" : ""}${plant ? `${casein ? " i " : ": "}Gold Standard 100% Plant (biljni protein${plant.proteinMedian ? `, oko ${Math.round(plant.proteinMedian)} g proteina na 100 g` : ""})` : ""}. ${casein && casein.best ? `Kazein je trenutno najpovoljniji u prodavnici ${casein.best.storeName} (${fmtRsd(casein.best.numericPrice)}). ` : ""}Za poređenje sa drugim biljnim i kazein proteinima pogledaj njihove kategorije.`,
        }] : []),
        {
          q: "Da li je Optimum Nutrition u srpskim prodavnicama originalan?",
          a: "Proteinoteka samo prati cene i ne može da garantuje autentičnost proizvoda. Najsigurnije je kupovati od prodavnice koja jasno navodi uvoznika ili distributera, i proveriti rok trajanja i deklaraciju na pakovanju. Ako je cena neuobičajeno niska u odnosu na ostale prodavnice, proveri zašto (akcija, pakovanje pred istekom roka).",
        },
        {
          q: "Kako da pratim cene Optimum Nutrition proizvoda u Srbiji?",
          a: "Na stranici svakog proizvoda možeš da aktiviraš price alert: uneseš email i ciljnu cenu, a kad cena padne ispod nje dobiješ obaveštenje. Tako ne moraš ručno da obilaziš prodavnice.",
        },
      ]}
    />
  );
}
