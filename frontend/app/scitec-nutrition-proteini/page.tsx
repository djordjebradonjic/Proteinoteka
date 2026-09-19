import { notFound } from "next/navigation";
import { CURRENT_MARKET } from "@/lib/marketConfig";
import { Metadata } from "next";
import { fetchBrandProducts, getSeoCopyStats } from "@/lib/seo-data";
import { compareCost, computeLineStats, formatWeightG, srPlural, type BrandLine } from "@/lib/brand-line-stats";
import { BrandLineGuide } from "@/components/seo/BrandLineGuide";
import { formatPrice } from "@/lib/formatPrice";
import { SEOBrandPage } from "@/components/seo/SEOBrandPage";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: "Scitec Nutrition proteini u Srbiji — cene i poređenje 2026 | Proteinoteka" },
  description:
    "Cene Scitec Nutrition proteina u srpskim prodavnicama: 100% Whey Professional, izolati, kazein, vegan. Poređenje cene po gramu proteina i value score.",
  alternates: { canonical: "https://proteinoteka.rs/scitec-nutrition-proteini" },
  openGraph: {
    title: "Scitec Nutrition proteini u Srbiji 2026 | Proteinoteka",
    description:
      "Poređenje cena Scitec Nutrition proizvoda u srpskim prodavnicama. Gde je Scitec najjeftiniji u Srbiji?",
    url: "https://proteinoteka.rs/scitec-nutrition-proteini",
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

// Order matters: first match wins ("Anabolic Iso+Hydro" must hit hydro before isolate, and the
// plain "100% Whey" listings without "Professional" in the name are the Professional line).
const LINES: BrandLine[] = [
  { key: "beef", label: "100% Beef Protein", blurb: "Goveđi protein bez mlečnih sastojaka; niži value score jer je izvor proteina govedina, a ne whey.", match: /beef/i },
  { key: "vegan", label: "100% Vegan Protein", blurb: "Biljni protein za one koji ne konzumiraju mlečne proizvode.", match: /vegan/i },
  { key: "casein", label: "100% Casein Complex", blurb: "Kazein — sporo se vari, pa se najčešće pije uveče.", match: /casein|kazein/i },
  { key: "hydro", label: "Hydro Isolate / Anabolic Iso+Hydro", blurb: "Hidrolizovani izolat: brža apsorpcija.", match: /hydro/i },
  { key: "clear", label: "Iso Whey Clear", blurb: "„Clear“ izolat koji se rastvara u bistar napitak nalik na sok, a ne u mlečni šejk.", match: /clear/i },
  { key: "isolate", label: "100% Whey Isolate", blurb: "Izolat: više proteina na 100 g i manje laktoze od koncentrata.", match: /isolate/i },
  { key: "musclepro", label: "Muscle Pro", blurb: "Mešavina proteina (blend) za redovnu upotrebu.", match: /muscle\s*pro/i },
  { key: "professional", label: "100% Whey Protein Professional", blurb: "Flagship linija: whey na bazi koncentrata.", match: /100%\s*whey|whey\s*prof/i },
];

const fmtRsd = (v: number) => formatPrice(Math.round(v));
const fmt1 = (v: number) => v.toFixed(1).replace(".", ",");

export default async function Page() {
  if (CURRENT_MARKET !== 'rs') notFound();
  const products = await fetchBrandProducts({ brand: "Scitec Nutrition", limit: 100 });
  const stats = getSeoCopyStats(products);
  const lineStats = computeLineStats(products, LINES);
  const byKey = Object.fromEntries(lineStats.map((l) => [l.line.key, l]));
  const storeNames = [...new Set(products.map((p) => p.storeName))].sort();

  const professional = byKey.professional;
  const isolate = byKey.isolate;
  const vegan = byKey.vegan;
  const beef = byKey.beef;
  const beefScore = beef?.best?.valueScore;
  const weights = products.map((p) => p.primaryWeightGrams).filter((w): w is number => w != null && w > 0);
  const isolateVsPro =
    professional?.gpMedian != null && isolate?.gpMedian != null
      ? { pro: fmt1(professional.gpMedian), iso: fmt1(isolate.gpMedian), cmp: compareCost(isolate.gpMedian, professional.gpMedian) }
      : null;

  return (
    <SEOBrandPage
      h1="Scitec Nutrition proteini u Srbiji"
      brandName="Scitec Nutrition"
      brandApiName="Scitec Nutrition"
      intro={`Scitec Nutrition je mađarski brend osnovan 1996. i jedan od najpoznatijih na Balkanu. Većina ga zna po 100% Whey Protein Professional, ali asortiman je širi: izolati, hidrolizat, kazein, Muscle Pro, veganski i goveđi protein.${products.length > 0 ? ` Na Proteinoteci pratimo ${products.length} Scitec ${srPlural(products.length, { one: "ponudu", few: "ponude", many: "ponuda" })} u ${storeNames.length} ${srPlural(storeNames.length, { one: "prodavnici", few: "prodavnice", many: "prodavnica" })}${stats ? `, sa cenama od ${stats.minPriceLabel} do ${stats.maxPriceLabel}` : ""}.` : ""} Cena zavisi od linije i veličine pakovanja, zato ispod poredimo koliko svaka linija košta po gramu proteina.`}
      products={products}
      currentSlug="scitec-nutrition-proteini"
      insightsSection={<BrandLineGuide brandName="Scitec" products={products} lines={LINES} />}
      faqs={[
        {
          q: "Koji Scitec protein je najbolja vrednost za novac?",
          a: stats
            ? `Najbolji value score trenutno ima „${stats.bestValue.name}“: ${stats.bestValue.valueScore?.toFixed(1)}/10${stats.bestValue.proteinPer100g ? `, ${stats.bestValue.proteinPer100g} g proteina na 100 g` : ""}, prodavnica ${stats.bestValue.storeName}.${professional?.gpMedian != null ? ` Najčešća opcija, 100% Whey Professional, košta medijanu ${fmt1(professional.gpMedian)} RSD po gramu proteina.` : ""} Score uzima u obzir cenu, procenat proteina, čistoću sastava i ugled brenda, a metodologiju možeš pročitati na stranici „Kako računamo value score“.`
            : "Tabela iznad prikazuje value score za svaki Scitec proizvod — meru koja uzima u obzir cenu, procenat proteina i čistoću sastava.",
        },
        {
          q: "Koja je razlika između 100% Whey Professional i 100% Whey Isolate?",
          a: `Professional je whey na bazi koncentrata${professional?.proteinMedian ? ` (oko ${Math.round(professional.proteinMedian)} g proteina na 100 g)` : ""}, a Isolate prolazi dodatnu filtraciju${isolate?.proteinMedian ? ` pa daje oko ${Math.round(isolate.proteinMedian)} g proteina na 100 g` : ""}, uz manje laktoze i masti. ${isolateVsPro ? (isolateVsPro.cmp === "pricier" ? `Izolat je skuplji: ${isolateVsPro.iso} RSD po gramu proteina naspram ${isolateVsPro.pro} RSD kod Professional-a (medijane po ponudama).` : isolateVsPro.cmp === "cheaper" ? `Po gramu proteina izolat je trenutno čak i jeftiniji: ${isolateVsPro.iso} RSD naspram ${isolateVsPro.pro} RSD kod Professional-a (medijane po ponudama), pa nije nužno skuplji izbor.` : `Po gramu proteina razlika je mala: ${isolateVsPro.iso} RSD kod izolata naspram ${isolateVsPro.pro} RSD kod Professional-a (medijane po ponudama).`) : ""} Za većinu vežbača Professional je dovoljan; izolat ima smisla ako slabije podnosiš laktozu ili brojiš svaki gram masti.`,
        },
        {
          q: "Šta su Iso Whey Clear, Hydro Isolate i Anabolic Iso+Hydro?",
          a: "Iso Whey Clear je „clear“ izolat koji se rastvara u bistar, voćni napitak umesto u mlečni šejk. Hydro Isolate je hidrolizovani izolat, pa se brže apsorbuje, a Anabolic Iso+Hydro kombinuje izolat i hidrolizat. To su specijalizovane linije: kod većine rekreativaca razlika u efektu ne opravdava eventualnu razliku u ceni, ali su opcija ako ti je bitna brza apsorpcija ili drugačija tekstura.",
        },
        ...(vegan ? [{
          q: "Ima li Scitec veganski protein?",
          a: `Da — 100% Vegan Protein. Trenutno ga pratimo u ${vegan.count} ${srPlural(vegan.count, { one: "ponudi", few: "ponude", many: "ponuda" })}${vegan.proteinMedian ? ", oko " + Math.round(vegan.proteinMedian) + " g proteina na 100 g" : ""}${vegan.best ? `, najpovoljnije ${fmtRsd(vegan.best.numericPrice)} u prodavnici ${vegan.best.storeName}` : ""}. Za poređenje sa drugim biljnim proteinima pogledaj kategoriju biljnih proteina.`,
        }] : []),
        ...(beef ? [{
          q: "Zašto Scitec 100% Beef Protein ima nizak value score?",
          a: `Beef Protein ima visok procenat proteina${beef.proteinMedian ? ` (oko ${Math.round(beef.proteinMedian)} g na 100 g)` : ""}, ali je izvor govedina, a ne whey — takav protein ima slabiji aminokiselinski profil, pa naš value score to kažnjava${beefScore != null ? ` (${beefScore.toFixed(1)}/10)` : ""}. Visok procenat proteina sam po sebi ne znači i visoku biološku vrednost.`,
        }] : []),
        {
          q: "Gde je Scitec najjeftiniji u Srbiji?",
          a: `Scitec pratimo u ${storeNames.length > 0 ? storeNames.join(", ") : "više prodavnica"}. Ista linija se u različitim prodavnicama prodaje u različitim pakovanjima, pa poredi cenu po gramu proteina, a ne samo cenu tegle; u tabeli „Gde kupiti“ iznad je najniža cena u svakoj prodavnici. Za praćenje cena bez ručnog poređenja aktiviraj price alert na željenom proizvodu.`,
        },
        {
          q: "Koliko košta Scitec protein u Srbiji?",
          a: stats
            ? `Ponude se kreću od ${stats.minPriceLabel} do ${stats.maxPriceLabel}: najjeftinija je „${stats.cheapest.name}“, a najskuplja „${stats.priciest.name}“. Raspon je širok jer obuhvata pakovanja${weights.length > 0 ? ` od ${formatWeightG(Math.min(...weights))} do ${formatWeightG(Math.max(...weights))}` : ""} i linije različite cene, pa je poređenje po gramu proteina pouzdanije od poređenja cena tegli.${professional?.gpMedian != null ? ` Za 100% Whey Professional medijana je ${fmt1(professional.gpMedian)} RSD po gramu proteina.` : ""}`
            : "Tabela iznad prikazuje aktuelnu cenu za svako pakovanje, ažuriranu na dnevnom nivou.",
        },
      ]}
    />
  );
}
