import { Metadata } from "next";
import { fetchTopProducts } from "@/lib/seo-data";
import { SEOLandingPage } from "@/components/seo/SEOLandingPage";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Najbolji Whey Protein u Srbiji | Proteinoteka",
  description:
    "Koji whey protein je trenutno najbolji u Srbiji? Poredimo value score, cenu i nutritivne vrednosti svih dostupnih proteina iz svih prodavnica.",
  alternates: { canonical: "https://proteinoteka.rs/najbolji-whey-protein-srbija" },
  openGraph: {
    title: "Najbolji Whey Protein u Srbiji | Proteinoteka",
    description: "Koji whey protein je trenutno najbolji u Srbiji? Poredimo value score, cenu i nutritivne vrednosti.",
    url: "https://proteinoteka.rs/najbolji-whey-protein-srbija",
    siteName: "Proteinoteka",
    locale: "sr_RS",
    type: "website",
  },
};

export default async function Page() {
  const products = await fetchTopProducts({ sortBy: "valueScore", limit: 15 });

  const top = products[0];
  const cheapest = products.length > 0
    ? [...products].sort((a, b) => (a.numericPrice ?? 0) - (b.numericPrice ?? 0))[0]
    : null;

  const quickAnswer = top
    ? `Trenutno, ${top.name} (${top.storeName}) ima najviši value score od ${top.valueScore?.toFixed(1)}/10 po ceni ${top.price} — što ga čini najboljim izborom za odnos cene i kvaliteta. Ako ti je budžet prioritet, ${cheapest?.name ?? top.name} je najjeftinija opcija za ${cheapest?.price ?? top.price}.`
    : "";

  return (
    <SEOLandingPage
      h1="Najbolji Whey Protein u Srbiji"
      intro="Analizirali smo svaki whey protein dostupan u srpskim prodavnicama. Poredimo cenu, sadržaj proteina, šećere, masti i ukupnu vrednost — i rangiramo koji nudi najviše za tvoj novac."
      quickAnswer={quickAnswer}
      products={products}
      listHeading="Top proteini po value score"
      tableCaption="Whey proteini u Srbiji — rang lista po value score"
      currentSlug="najbolji-whey-protein-srbija"
    />
  );
}
