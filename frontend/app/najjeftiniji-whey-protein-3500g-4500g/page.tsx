import { Metadata } from "next";
import { fetchTopProducts } from "@/lib/seo-data";
import { SEOLandingPage } from "@/components/seo/SEOLandingPage";
import { WeightRangeTabs } from "@/components/seo/WeightRangeTabs";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: "Najjeftiniji Whey Protein 4kg u Srbiji | Proteinoteka" },
  description:
    "Najjeftinije pakovanje whey proteina od 3.5kg do 4.5kg u Srbiji. Aktuelne cene iz svih prodavnica — ažurirano nedeljno, sortirano od najjeftinije.",
  alternates: { canonical: "https://proteinoteka.rs/najjeftiniji-whey-protein-3500g-4500g" },
  openGraph: {
    title: "Najjeftiniji Whey Protein 4kg u Srbiji | Proteinoteka",
    description: "Aktuelne cene whey proteina 3.5–4.5kg iz svih srpskih prodavnica. Sortirano od najjeftinije.",
    url: "https://proteinoteka.rs/najjeftiniji-whey-protein-3500g-4500g",
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

export default async function Page() {
  const raw = await fetchTopProducts({
    category: "whey_concentrate",
    sortBy: "price",
    limit: 500,
  });
  const products = raw.filter(
    p => p.primaryWeightGrams != null && p.primaryWeightGrams >= 3500 && p.primaryWeightGrams < 4500
  );

  const top = products[0];
  const bestValue = products.length > 0
    ? [...products].sort((a, b) => (b.valueScore ?? 0) - (a.valueScore ?? 0))[0]
    : null;

  const quickAnswer = top
    ? `Najjeftiniji whey concentrate u pakovanju oko 4kg trenutno je ${top.name} za ${top.price} (${top.storeName}). Ako tražiš i dobar kvalitet, ${bestValue?.name ?? top.name} nudi value score ${bestValue?.valueScore?.toFixed(1) ?? "N/A"}/10.`
    : "Trenutno nema dostupnih whey proteina u pakovanju 3.5–4.5kg. Pogledaj susedne opsege.";

  return (
    <SEOLandingPage
      h1="Najjeftiniji Whey Protein 4kg u Srbiji"
      intro="Pakovanja od 3.5 do 4.5 kilograma — za ozbiljne korisnike koji žele maksimalnu uštedu po gramu proteina. Pratimo cene iz svih srpskih prodavnica i prikazujemo ih sortirano od najjeftinije."
      quickAnswer={quickAnswer}
      products={products}
      listHeading="Whey proteini 3.5–4.5kg sortirani od najjeftinije cene"
      tableCaption="Najjeftiniji whey proteini 4kg u Srbiji — aktuelne cene"
      currentSlug="najjeftiniji-whey-protein-3500g-4500g"
      headerSection={<WeightRangeTabs currentSlug="najjeftiniji-whey-protein-3500g-4500g" />}
      faqs={[
        {
          q: "Ko kupuje 4kg pakovanje whey proteina?",
          a: "Redovni korisnici koji treniraju 4–6 puta nedeljno i konzumiraju protein svakodnevno. 4kg pakovanje uz jednu porciju dnevno traje oko 4–5 meseci, što znači svega 2–3 narudžbine godišnje.",
        },
        {
          q: "Da li je cena po gramu proteina znatno niža kod 4kg paketa?",
          a: "Da — generalno možeš očekivati 15–25% nižu cenu po gramu u poređenju sa 1kg pakovanjem istog brenda. Razlika varira po brendu i prodavnici, a cenu po gramu proteina možeš videti na svakom proizvodu na Proteinoteci.",
        },
      ]}
    />
  );
}
