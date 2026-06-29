import { notFound } from "next/navigation";
import { CURRENT_MARKET } from "@/lib/marketConfig";
import { Metadata } from "next";
import { fetchTopProducts } from "@/lib/seo-data";
import { SEOLandingPage } from "@/components/seo/SEOLandingPage";
import { WeightRangeTabsHR } from "@/components/seo/WeightRangeTabsHR";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: "Najjeftiniji Whey Protein do 500g u Hrvatskoj | Proteinoteka" },
  description:
    "Najjeftinije pakiranje whey proteina do 500g u Hrvatskoj. Idealno za isprobavanje i manje narudžbe — aktualne cijene iz svih trgovina sortirane od najjeftinijeg.",
  alternates: { canonical: "https://proteinoteka.com.hr/najjeftiniji-whey-protein-hrvatska-do-500g" },
  openGraph: {
    title: "Najjeftiniji Whey Protein do 500g u Hrvatskoj | Proteinoteka",
    description: "Aktualne cijene whey proteina do 500g iz svih hrvatskih trgovina. Sortirano od najjeftinijeg.",
    url: "https://proteinoteka.com.hr/najjeftiniji-whey-protein-hrvatska-do-500g",
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
  if (CURRENT_MARKET !== 'hr') notFound();
  const raw = await fetchTopProducts({
    category: "whey_concentrate",
    sortBy: "price",
    limit: 500,
  });
  const products = raw.filter(
    p => p.primaryWeightGrams != null && p.primaryWeightGrams < 500
  );

  const top = products[0];
  const bestValue = products.length > 0
    ? [...products].sort((a, b) => (b.valueScore ?? 0) - (a.valueScore ?? 0))[0]
    : null;

  const quickAnswer = top
    ? `Najjeftiniji whey concentrate u pakiranju do 500g u Hrvatskoj trenutno je ${top.name} za ${top.price} (${top.storeName}). Ako tražiš i dobru kvalitetu, ${bestValue?.name ?? top.name} nudi value score ${bestValue?.valueScore?.toFixed(1) ?? "N/A"}/10.`
    : "Trenutno nema dostupnih whey proteina u pakiranju do 500g. Pogledaj veće raspone.";

  return (
    <SEOLandingPage
      h1="Najjeftiniji Whey Protein do 500g u Hrvatskoj"
      intro="Mala pakiranja whey proteina — idealna za isprobavanje ili kraća razdoblja. Pratimo cijene iz svih hrvatskih trgovina i prikazujemo ih sortirano od najjeftinijeg."
      quickAnswer={quickAnswer}
      products={products}
      listHeading="Whey proteini do 500g sortirani od najjeftinije cijene"
      tableCaption="Najjeftiniji whey proteini do 500g u Hrvatskoj — aktualne cijene"
      currentSlug="najjeftiniji-whey-protein-hrvatska-do-500g"
      headerSection={<WeightRangeTabsHR currentSlug="najjeftiniji-whey-protein-hrvatska-do-500g" />}
      faqs={[
        {
          q: "Isplati li se kupiti protein u manjem pakiranju?",
          a: "Manja pakiranja imaju višu cijenu po gramu proteina, ali su korisna ako tražiš novu aromu ili brend koji nisi isprobao. Ako ti odgovara okus i proizvod, prijeđi na veće pakiranje radi uštede.",
        },
        {
          q: "Koji su najčešći razlozi za kupnju pakiranja do 500g?",
          a: "Isprobavanje novog okusa, kraći ciklus suplementacije, pokloni ili ograničen budžet. Cijena po gramu proteina uvijek je viša nego kod pakiranja od 1 kg i više.",
        },
      ]}
    />
  );
}
