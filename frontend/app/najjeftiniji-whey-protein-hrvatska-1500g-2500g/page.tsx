import { Metadata } from "next";
import { fetchTopProducts } from "@/lib/seo-data";
import { SEOLandingPage } from "@/components/seo/SEOLandingPage";
import { WeightRangeTabsHR } from "@/components/seo/WeightRangeTabsHR";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: "Najjeftiniji Whey Protein 1.5–2.5kg Hrvatska | Proteinoteka" },
  description:
    "Najjeftinije pakiranje whey proteina od 1.5kg do 2.5kg u Hrvatskoj. Aktualne cijene iz svih trgovina sortirane od najjeftinijeg — ažurirano tjedno.",
  alternates: { canonical: "https://proteinoteka.com.hr/najjeftiniji-whey-protein-hrvatska-1500g-2500g" },
  openGraph: {
    title: "Najjeftiniji Whey Protein 1.5kg–2.5kg u Hrvatskoj | Proteinoteka",
    description: "Aktualne cijene whey proteina 1.5kg–2.5kg iz svih hrvatskih trgovina. Sortirano od najjeftinijeg.",
    url: "https://proteinoteka.com.hr/najjeftiniji-whey-protein-hrvatska-1500g-2500g",
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
    limit: 200,
  });
  const products = raw.filter(
    p => p.primaryWeightGrams != null && p.primaryWeightGrams >= 1500 && p.primaryWeightGrams < 2500
  );

  const top = products[0];
  const bestValue = products.length > 0
    ? [...products].sort((a, b) => (b.valueScore ?? 0) - (a.valueScore ?? 0))[0]
    : null;

  const quickAnswer = top
    ? `Najjeftiniji whey concentrate u pakiranju 1.5kg–2.5kg u Hrvatskoj trenutno je ${top.name} za ${top.price} (${top.storeName}). Ako tražiš i dobru kvalitetu, ${bestValue?.name ?? top.name} nudi value score ${bestValue?.valueScore?.toFixed(1) ?? "N/A"}/10.`
    : "Trenutno nema dostupnih whey proteina u pakiranju 1.5kg–2.5kg. Pogledaj susjedne raspone.";

  return (
    <SEOLandingPage
      h1="Najjeftiniji Whey Protein 1.5kg–2.5kg u Hrvatskoj"
      intro="Pakiranja od 1.5 do 2.5 kilograma — dobar kompromis između cijene po gramu i veličine investicije. Pratimo cijene iz svih hrvatskih trgovina i prikazujemo ih sortirano od najjeftinijeg."
      quickAnswer={quickAnswer}
      products={products}
      listHeading="Whey proteini 1.5kg–2.5kg sortirani od najjeftinije cijene"
      tableCaption="Najjeftiniji whey proteini 1.5kg–2.5kg u Hrvatskoj — aktualne cijene"
      currentSlug="najjeftiniji-whey-protein-hrvatska-1500g-2500g"
      headerSection={<WeightRangeTabsHR currentSlug="najjeftiniji-whey-protein-hrvatska-1500g-2500g" />}
      faqs={[
        {
          q: "Isplati li se kupiti 2kg pakiranje umjesto 1kg?",
          a: "Generalno da — cijena po gramu proteina niža je kod većih pakiranja. Raspon 1.5–2.5kg dobar je kompromis: veća ušteda nego kod 1kg, ali bez obveze trošenja 3–4kg prije nego što provjeriš odgovara li ti okus.",
        },
        {
          q: "Koliko porcija ima u 2kg pakiranju whey proteina?",
          a: "Ovisno o preporučenoj porciji brenda, ali tipično 2kg pakiranje ima između 50 i 70 porcija (porcija od 30g = ~66 porcija). Uz dvije porcije dnevno, to je otprilike mjesec dana suplementacije.",
        },
      ]}
    />
  );
}
