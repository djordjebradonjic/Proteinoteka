import { Metadata } from "next";
import { fetchTopProducts } from "@/lib/seo-data";
import { SEOLandingPage } from "@/components/seo/SEOLandingPage";
import { WeightRangeTabs } from "@/components/seo/WeightRangeTabs";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: "Najjeftiniji Whey Protein 3kg u Srbiji | Proteinoteka" },
  description:
    "Najjeftinije pakovanje whey proteina od 2.5kg do 3.5kg u Srbiji. Poredimo cene iz svih prodavnica — ažurirano nedeljno, sortirano od najjeftinije cene.",
  alternates: { canonical: "https://proteinoteka.rs/najjeftiniji-whey-protein-2500g-3500g" },
  openGraph: {
    title: "Najjeftiniji Whey Protein 3kg u Srbiji | Proteinoteka",
    description: "Aktuelne cene whey proteina 2.5–3.5kg iz svih srpskih prodavnica. Sortirano od najjeftinije.",
    url: "https://proteinoteka.rs/najjeftiniji-whey-protein-2500g-3500g",
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
    limit: 200,
  });
  const products = raw.filter(
    p => p.primaryWeightGrams != null && p.primaryWeightGrams >= 2500 && p.primaryWeightGrams < 3500
  );

  const top = products[0];
  const bestValue = products.length > 0
    ? [...products].sort((a, b) => (b.valueScore ?? 0) - (a.valueScore ?? 0))[0]
    : null;

  const quickAnswer = top
    ? `Najjeftiniji whey concentrate u pakovanju oko 3kg trenutno je ${top.name} za ${top.price} (${top.storeName}). Ako tražiš i dobar kvalitet, ${bestValue?.name ?? top.name} nudi value score ${bestValue?.valueScore?.toFixed(1) ?? "N/A"}/10.`
    : "Trenutno nema dostupnih whey proteina u pakovanju 2.5–3.5kg. Pogledaj susedne opsege.";

  return (
    <SEOLandingPage
      h1="Najjeftiniji Whey Protein 3kg u Srbiji"
      intro="Pakovanja oko 3 kilograma — klasičan izbor za redovne korisnike koji žele nižu cenu po gramu bez preterane zalihe. Pratimo cene iz svih srpskih prodavnica i prikazujemo ih sortirano od najjeftinije."
      quickAnswer={quickAnswer}
      products={products}
      listHeading="Whey proteini 2.5–3.5kg sortirani od najjeftinije cene"
      tableCaption="Najjeftiniji whey proteini 3kg u Srbiji — aktuelne cene"
      currentSlug="najjeftiniji-whey-protein-2500g-3500g"
      headerSection={<WeightRangeTabs currentSlug="najjeftiniji-whey-protein-2500g-3500g" />}
      faqs={[
        {
          q: "Koliko traje 3kg pakovanje whey proteina?",
          a: "Uz jednu porciju od 30g dnevno, 3kg pakovanje traje oko 100 dana — više od tri meseca. Uz dve porcije, oko 50 dana. Ovo ga čini popularnim izborom za redovne korisnike koji žele da retko naručuju.",
        },
        {
          q: "Zašto su 3kg paketi popularniji od 1kg?",
          a: "Veće pakovanje znači nižu cenu po gramu proteina i ređe narudžbine. Razlika može biti i 20–30% u ceni po gramu u poređenju sa kilogramskim pakovanjem.",
        },
      ]}
    />
  );
}
