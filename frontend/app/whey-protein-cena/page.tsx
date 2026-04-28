import { Metadata } from "next";
import { fetchTopProducts } from "@/lib/seo-data";
import { SEOLandingPage } from "@/components/seo/SEOLandingPage";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Whey Protein Cena u Srbiji — Pregled i Poređenje | Proteinoteka",
  description:
    "Pregled aktuelnih cena whey proteina u Srbiji. Poredimo cene koncentrata, izolata i hidrolizata iz svih prodavnica. Saznaj koja je realna cena za gram proteina.",
  alternates: { canonical: "https://proteinoteka.rs/whey-protein-cena" },
  openGraph: {
    title: "Whey Protein Cena u Srbiji | Proteinoteka",
    description: "Aktuelni pregled cena whey proteina u Srbiji po prodavnicama i tipovima.",
    url: "https://proteinoteka.rs/whey-protein-cena",
    siteName: "Proteinoteka",
    locale: "sr_RS",
    type: "website",
  },
};

export default async function Page() {
  const products = await fetchTopProducts({ sortBy: "price", limit: 20 });

  const cheapest = products[0];
  const avgPrice = products.length > 0
    ? Math.round(products.reduce((s, p) => s + (p.numericPrice ?? 0), 0) / products.length)
    : null;

  const quickAnswer = cheapest
    ? `Aktuelne cene whey proteina u Srbiji kreću se od ${cheapest.price} (${cheapest.name}) pa naviše. Prosečna cena u trenutnoj bazi je oko ${avgPrice?.toLocaleString("sr-RS")} RSD. Cena sama po sebi ne govori sve — važniji podatak je koliko RSD plaćaš po gramu proteina.`
    : "";

  return (
    <SEOLandingPage
      h1="Whey Protein Cena u Srbiji"
      intro="Transparentan pregled svih cena whey proteina dostupnih na srpskom tržištu. Upoređujemo koncentrate, izolate i hidrolizate iz svih prodavnica i računamo realnu cenu po gramu proteina — jedini podatak koji zaista meri vrednost."
      quickAnswer={quickAnswer}
      products={products}
      listHeading="Whey proteini po ceni — od najjeftinije"
      tableCaption="Pregled cena whey proteina u Srbiji"
      currentSlug="whey-protein-cena"
    />
  );
}
