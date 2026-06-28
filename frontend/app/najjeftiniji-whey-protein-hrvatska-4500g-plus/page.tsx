import { Metadata } from "next";
import { fetchTopProducts } from "@/lib/seo-data";
import { SEOLandingPage } from "@/components/seo/SEOLandingPage";
import { WeightRangeTabsHR } from "@/components/seo/WeightRangeTabsHR";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: "Najjeftiniji Whey Protein 5kg+ u Hrvatskoj | Proteinoteka" },
  description:
    "Najjeftinije pakiranje whey proteina od 4.5kg naviše u Hrvatskoj. Maksimalna ušteda po gramu proteina — aktualne cijene iz svih trgovina, ažurirano tjedno.",
  alternates: { canonical: "https://proteinoteka.com.hr/najjeftiniji-whey-protein-hrvatska-4500g-plus" },
  openGraph: {
    title: "Najjeftiniji Whey Protein 5kg+ u Hrvatskoj | Proteinoteka",
    description: "Aktualne cijene whey proteina 4.5kg+ iz svih hrvatskih trgovina. Sortirano od najjeftinijeg.",
    url: "https://proteinoteka.com.hr/najjeftiniji-whey-protein-hrvatska-4500g-plus",
    siteName: "Proteinoteka",
    locale: "hr_HR",
    type: "website",
    images: [{ url: "https://proteinoteka.com.hr/opengraph-image", width: 1200, height: 630, alt: "Proteinoteka" }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["https://proteinoteka.com.hr/opengraph-image"],
  },
};

export default async function Page() {
  const raw = await fetchTopProducts({
    category: "whey_concentrate",
    sortBy: "price",
    limit: 500,
  });
  const products = raw.filter(
    p => p.primaryWeightGrams != null && p.primaryWeightGrams >= 4500
  );

  const top = products[0];
  const bestValue = products.length > 0
    ? [...products].sort((a, b) => (b.valueScore ?? 0) - (a.valueScore ?? 0))[0]
    : null;

  const quickAnswer = top
    ? `Najjeftiniji whey concentrate u velikom pakiranju (4.5kg+) u Hrvatskoj trenutno je ${top.name} za ${top.price} (${top.storeName}). Ako tražiš i dobru kvalitetu, ${bestValue?.name ?? top.name} nudi value score ${bestValue?.valueScore?.toFixed(1) ?? "N/A"}/10.`
    : "Trenutno nema dostupnih whey proteina u pakiranju 4.5kg+. Pogledaj raspone ispod.";

  return (
    <SEOLandingPage
      h1="Najjeftiniji Whey Protein 5kg+ u Hrvatskoj"
      intro="Velika pakiranja od 4.5 kilograma i više — maksimalna ušteda po gramu proteina za ozbiljne korisnike. Pratimo cijene iz svih hrvatskih trgovina i prikazujemo ih sortirano od najjeftinijeg."
      quickAnswer={quickAnswer}
      products={products}
      listHeading="Whey proteini 4.5kg+ sortirani od najjeftinije cijene"
      tableCaption="Najjeftiniji whey proteini 5kg+ u Hrvatskoj — aktualne cijene"
      currentSlug="najjeftiniji-whey-protein-hrvatska-4500g-plus"
      headerSection={<WeightRangeTabsHR currentSlug="najjeftiniji-whey-protein-hrvatska-4500g-plus" />}
      faqs={[
        {
          q: "Koliko dugo traje 5kg pakiranje whey proteina?",
          a: "Uz jednu porciju od 30g dnevno, 5kg pakiranje traje oko 166 dana — gotovo 6 mjeseci. Uz dvije porcije, oko tri mjeseca. Idealno za korisnike koji ne žele razmišljati o narudžbi mjesecima.",
        },
        {
          q: "Postoji li rizik pri kupnji velikog pakiranja?",
          a: "Glavni rizik je da ti se okus dosadi ili odustaneš od treninga. Stoga preporučamo da prije kupnje velikog pakiranja ispitaš okus u manjem, ili odabereš čokoladu/vaniliju — klasike koji rijetko postanu zamorne.",
        },
      ]}
    />
  );
}
