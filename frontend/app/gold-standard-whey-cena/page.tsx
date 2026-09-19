import { cache } from "react";
import { notFound } from "next/navigation";
import { CURRENT_MARKET } from "@/lib/marketConfig";
import { Metadata } from "next";
import { fetchProductsByQuery, getSeoCopyStats } from "@/lib/seo-data";
import { formatWeightG, packRows, packSizeTrend, srPlural, widestSamePackSpread } from "@/lib/brand-line-stats";
import { PackTable } from "@/components/seo/PackTable";
import { formatPrice } from "@/lib/formatPrice";
import { SEOBrandPage } from "@/components/seo/SEOBrandPage";
import { rsPageMetadata } from "@/lib/seo-meta";

export const revalidate = 86400;

// "Gold Standard 100% Plant" is a different (vegan) product with its own price per gram, so it
// is kept out of every whey statistic on this page.
const loadGoldStandard = cache(async () => {
  const all = await fetchProductsByQuery({ name: "gold standard", brand: "Optimum Nutrition", limit: 50 });
  const products = all.filter((p) => !/plant/i.test(p.name) && p.proteinSource !== "vegan");
  // fetch helpers swallow errors and return []; never let ISR cache that as a "valid" empty page.
  if (products.length === 0) throw new Error("gold-standard-whey-cena: no products returned, refusing to render");
  return products;
});

// The cheapest listing goes into the title: "cena" queries click through on a concrete price.
export async function generateMetadata(): Promise<Metadata> {
  let from = "";
  try {
    const cheapest = Math.min(...(await loadGoldStandard()).filter((p) => p.numericPrice > 0).map((p) => p.numericPrice));
    if (Number.isFinite(cheapest)) from = `, od ${formatPrice(Math.round(cheapest))}`;
  } catch {
    /* static fallback */
  }
  return rsPageMetadata({
    path: "/gold-standard-whey-cena",
    title: `Gold Standard Whey cena u Srbiji${from}`,
    description:
      "Koliko košta Optimum Nutrition Gold Standard 100% Whey u Srbiji? Cena svakog pakovanja po prodavnici i po gramu proteina, iz svih prodavnica koje pratimo.",
    ogTitle: "Gold Standard Whey cena u Srbiji 2026 | Proteinoteka",
  });
}

const fmt1 = (v: number) => v.toFixed(1).replace(".", ",");

export default async function Page() {
  if (CURRENT_MARKET !== "rs") notFound();
  const products = await loadGoldStandard();

  const stats = getSeoCopyStats(products);
  const storeNames = [...new Set(products.map((p) => p.storeName))].sort();
  const rows = packRows(products);
  const trend = packSizeTrend(rows);
  const spread = widestSamePackSpread(products, 3);

  // Cheapest listing per pack size (sizes within 5% of each other count as the same pack).
  const sizes: { weightG: number; price: number; store: string }[] = [];
  for (const r of rows) {
    const same = sizes.find((s) => Math.abs(s.weightG - r.weightG) / s.weightG <= 0.05);
    if (!same) sizes.push({ weightG: r.weightG, price: r.product.numericPrice, store: r.product.storeName });
    else if (r.product.numericPrice < same.price) { same.price = r.product.numericPrice; same.store = r.product.storeName; }
  }
  const sizeList = sizes.map((s) => `${formatWeightG(s.weightG)} od ${formatPrice(Math.round(s.price))} (${s.store})`);

  return (
    <SEOBrandPage
      h1="Gold Standard 100% Whey – Cena u Srbiji"
      brandName="Gold Standard 100% Whey"
      brandApiName="Optimum Nutrition"
      intro={`Optimum Nutrition Gold Standard 100% Whey je jedan od najtraženijih whey proteina u Srbiji.${products.length > 0 ? ` Na Proteinoteci pratimo ${products.length} ${srPlural(products.length, { one: "ponudu", few: "ponude", many: "ponuda" })} u ${storeNames.length} ${srPlural(storeNames.length, { one: "prodavnici", few: "prodavnice", many: "prodavnica" })} (${storeNames.join(", ")})${stats ? `, sa cenama od ${stats.minPriceLabel} do ${stats.maxPriceLabel}` : ""}.` : ""}${sizes.length > 0 ? ` Pakovanja koja pratimo: ${sizes.map((s) => formatWeightG(s.weightG)).join(", ")}.` : ""} Isto pakovanje se u različitim prodavnicama prodaje po različitoj ceni, pa ispod vidiš koliko koje košta.`}
      products={products}
      currentSlug="gold-standard-whey-cena"
      insightsSection={
        <PackTable
          title="Gold Standard: cena po pakovanju"
          products={products}
          more={{ href: "/optimum-nutrition-proteini", label: "Sve Optimum Nutrition proteine, po linijama" }}
        />
      }
      faqs={[
        {
          q: "Koliko košta Gold Standard whey protein u Srbiji?",
          a: sizeList.length > 0
            ? `Najniže cene po pakovanju trenutno su: ${sizeList.join("; ")}. Cena zavisi od prodavnice i trenutnih akcija, pa tačne cene za svako pakovanje vidiš u tabeli iznad.`
            : "Tačne cene za svako pakovanje vidiš u tabeli iznad.",
        },
        {
          q: "Gde je Gold Standard whey najjeftiniji u Srbiji?",
          a: `${spread ? `Isto pakovanje (${formatWeightG(spread.weightG)}) prodaje se u ${spread.stores} ${srPlural(spread.stores, { one: "prodavnici", few: "prodavnice", many: "prodavnica" })}: od ${formatPrice(Math.round(spread.low.numericPrice))} (${spread.low.storeName}) do ${formatPrice(Math.round(spread.high.numericPrice))} (${spread.high.storeName}), razlika je ${Math.round(spread.pct * 100)}%. ` : ""}U sekciji „Gde kupiti“ iznad prikazujemo najnižu trenutnu cenu po prodavnici. Aktiviraj price alert da te obavestimo kad cena padne.`,
        },
        {
          q: "Koje pakovanje Gold Standard whey-a se najviše isplati?",
          a: trend
            ? trend.cmp === "cheaper"
              ? `Veće pakovanje se isplati: ${formatWeightG(trend.large.weightG)} košta ${fmt1(trend.large.gp)} RSD po gramu proteina, a ${formatWeightG(trend.small.weightG)} ${fmt1(trend.small.gp)} RSD (najpovoljnije ponude za svaku veličinu). Manja pakovanja imaju smisla ako prvi put probaš ukus.`
              : trend.cmp === "pricier"
                ? `Veće pakovanje se ovde ne isplati: ${formatWeightG(trend.large.weightG)} košta ${fmt1(trend.large.gp)} RSD po gramu proteina, a ${formatWeightG(trend.small.weightG)} ${fmt1(trend.small.gp)} RSD (najpovoljnije ponude za svaku veličinu).`
                : `Cena po gramu proteina je slična za najmanje i najveće pakovanje (${fmt1(trend.small.gp)} i ${fmt1(trend.large.gp)} RSD), pa biraj prema tome koliko brzo ga potrošiš.`
            : "Tabela iznad prikazuje cenu po gramu proteina za svako pakovanje koje pratimo.",
        },
        {
          q: "Da li je Gold Standard 100% Whey isolate ili concentrate?",
          a: "Gold Standard 100% Whey je blend kod kojeg je whey isolate primarna sirovina, uz dodatak whey concentrate-a i whey peptida. Sadrži oko 24 g proteina po porciji od ~30 g. Nije čisti isolate, ali ima visok udeo proteina i nisku količinu masti i ugljenih hidrata u poređenju sa standardnim concentrate proizvodima.",
        },
        {
          q: "Kako da proverim da li je Gold Standard originalan?",
          a: "Kupuj iz prodavnica koje jasno navode uvoznika ili distributera i sačuvaj račun. Proteinoteka prati samo cene i ne može da garantuje autentičnost pojedinačnog pakovanja, pa neobično nisku cenu u odnosu na ostale prodavnice uvek proveri pre kupovine.",
        },
        {
          q: "Kako da pratim cenu Gold Standard whey-a i dobijem obaveštenje kad padne?",
          a: "Na Proteinoteci možeš aktivirati besplatan price alert za bilo koju Gold Standard varijantu: uneseš email i ciljnu cenu, bez registracije. Kad cena u nekoj od prodavnica padne ispod te vrednosti, dobijaš email obaveštenje.",
        },
      ]}
    />
  );
}
