import { Metadata } from "next";
import { fetchTopProducts } from "@/lib/seo-data";
import { SEOLandingPage } from "@/components/seo/SEOLandingPage";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Najjeftiniji Whey Protein u Srbiji | Proteinoteka",
  description:
    "Pronađi najjeftiniji whey protein u Srbiji. Aktuelne cene iz svih prodavnica — Pansport, Proteini.si, Proteinbox i ostalih — sortiranih od najniže cene.",
  alternates: { canonical: "https://proteinoteka.rs/najjeftiniji-whey-protein" },
  openGraph: {
    title: "Najjeftiniji Whey Protein u Srbiji | Proteinoteka",
    description: "Aktuelne cene whey proteina iz svih srpskih prodavnica. Sortirano od najjeftinije.",
    url: "https://proteinoteka.rs/najjeftiniji-whey-protein",
    siteName: "Proteinoteka",
    locale: "sr_RS",
    type: "website",
  },
};

export default async function Page() {
  const products = await fetchTopProducts({
    category: "whey_concentrate",
    sortBy: "price",
    limit: 15,
  });

  const top = products[0];
  const bestValue = products.length > 0
    ? [...products].sort((a, b) => (b.valueScore ?? 0) - (a.valueScore ?? 0))[0]
    : null;

  const quickAnswer = top
    ? `Najjeftiniji whey concentrate u Srbiji trenutno je ${top.name} za ${top.price} (${top.storeName}). Ako tražiš jeftino ali i kvalitetno, ${bestValue?.name ?? top.name} nudi najbolji odnos cene i kvaliteta sa value score ${bestValue?.valueScore?.toFixed(1) ?? "N/A"}/10.`
    : "";

  return (
    <SEOLandingPage
      h1="Najjeftiniji Whey Protein u Srbiji"
      intro="Svakodnevno pratimo cene whey proteina iz svih srpskih prodavnica. Ova lista je sortirana od najniže cene — bez kompromisa na kvalitet koji možeš pratiti kroz nutritivne vrednosti svakog proizvoda."
      quickAnswer={quickAnswer}
      products={products}
      listHeading="Whey proteini sortirani od najjeftinije cene"
      tableCaption="Najjeftiniji whey proteini u Srbiji — aktuelne cene"
      currentSlug="najjeftiniji-whey-protein"
    />
  );
}
