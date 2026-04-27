import { Metadata } from "next";
import { fetchTopProducts } from "@/lib/seo-data";
import { SEOLandingPage } from "@/components/seo/SEOLandingPage";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Protein za Masu u Srbiji — Izbor i Cene | Proteinoteka",
  description:
    "Koji protein je najbolji za izgradnju mišićne mase u Srbiji? Poredimo whey proteine i blendove po ceni, kalorijama i sadržaju proteina iz svih srpskih prodavnica.",
  alternates: { canonical: "https://proteinoteka.rs/protein-za-masu" },
  openGraph: {
    title: "Protein za Masu u Srbiji | Proteinoteka",
    description: "Pregled proteina za izgradnju mase dostupnih u Srbiji. Cene, kalorije, proteini.",
    url: "https://proteinoteka.rs/protein-za-masu",
    siteName: "Proteinoteka",
    locale: "sr_RS",
    type: "website",
  },
};

export default async function Page() {
  // Blend category for mass — concentrate if needed as fallback
  let products = await fetchTopProducts({
    category: "blend",
    sortBy: "valueScore",
    limit: 10,
  });

  // Supplement with concentrates if blends are scarce
  if (products.length < 6) {
    const concentrate = await fetchTopProducts({
      category: "whey_concentrate",
      sortBy: "valueScore",
      limit: 10,
    });
    const existingIds = new Set(products.map(p => p.id));
    const extra = concentrate.filter(p => !existingIds.has(p.id));
    products = [...products, ...extra].slice(0, 12);
  }

  const top = products[0];
  const highCalorie = products.length > 0
    ? [...products].sort((a, b) => (b.caloriePer100g ?? 0) - (a.caloriePer100g ?? 0))[0]
    : null;

  const quickAnswer = top
    ? `Za izgradnju mišićne mase bitan je kalorijski suficit i dovoljan unos proteina. ${top.name} trenutno nudi najbolji value score u ovoj kategoriji (${top.valueScore?.toFixed(1)}/10) za ${top.price}. Ako ti trebaju visoke kalorije, ${highCalorie?.name ?? top.name} ima najviše kalorija po 100g${highCalorie?.caloriePer100g ? ` (${highCalorie.caloriePer100g} kcal)` : ""}.`
    : "";

  return (
    <SEOLandingPage
      h1="Protein za Masu u Srbiji"
      intro="Za efikasno dobijanje mišićne mase potreban ti je proteinski suficit sa dovoljno kalorija. Poredimo whey proteine i blendove dostupne u Srbiji — sortiramo po vrednosti, kalorijama i ceni, da odabereš ono što funkcioniše za tvoj program."
      quickAnswer={quickAnswer}
      products={products}
      listHeading="Preporučeni proteini za masu — rang lista"
      tableCaption="Proteini za masu — cene i nutritivne vrednosti"
      currentSlug="protein-za-masu"
    />
  );
}
