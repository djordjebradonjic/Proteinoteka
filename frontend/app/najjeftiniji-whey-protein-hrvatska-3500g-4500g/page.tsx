import { Metadata } from "next";
import { fetchTopProducts } from "@/lib/seo-data";
import { SEOLandingPage } from "@/components/seo/SEOLandingPage";
import { WeightRangeTabsHR } from "@/components/seo/WeightRangeTabsHR";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: "Najjeftiniji Whey Protein 4kg u Hrvatskoj | Proteinoteka" },
  description:
    "Najjeftinije pakiranje whey proteina od 3.5kg do 4.5kg u Hrvatskoj. Aktualne cijene iz svih trgovina — ažurirano tjedno, sortirano od najjeftinijeg.",
  alternates: { canonical: "https://proteinoteka.com.hr/najjeftiniji-whey-protein-hrvatska-3500g-4500g" },
  openGraph: {
    title: "Najjeftiniji Whey Protein 4kg u Hrvatskoj | Proteinoteka",
    description: "Aktualne cijene whey proteina 3.5–4.5kg iz svih hrvatskih trgovina. Sortirano od najjeftinijeg.",
    url: "https://proteinoteka.com.hr/najjeftiniji-whey-protein-hrvatska-3500g-4500g",
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
    p => p.primaryWeightGrams != null && p.primaryWeightGrams >= 3500 && p.primaryWeightGrams < 4500
  );

  const top = products[0];
  const bestValue = products.length > 0
    ? [...products].sort((a, b) => (b.valueScore ?? 0) - (a.valueScore ?? 0))[0]
    : null;

  const quickAnswer = top
    ? `Najjeftiniji whey concentrate u pakiranju oko 4kg u Hrvatskoj trenutno je ${top.name} za ${top.price} (${top.storeName}). Ako tražiš i dobru kvalitetu, ${bestValue?.name ?? top.name} nudi value score ${bestValue?.valueScore?.toFixed(1) ?? "N/A"}/10.`
    : "Trenutno nema dostupnih whey proteina u pakiranju 3.5–4.5kg. Pogledaj susjedne raspone.";

  return (
    <SEOLandingPage
      h1="Najjeftiniji Whey Protein 4kg u Hrvatskoj"
      intro="Pakiranja od 3.5 do 4.5 kilograma — za ozbiljne korisnike koji žele maksimalnu uštedu po gramu proteina. Pratimo cijene iz svih hrvatskih trgovina i prikazujemo ih sortirano od najjeftinijeg."
      quickAnswer={quickAnswer}
      products={products}
      listHeading="Whey proteini 3.5–4.5kg sortirani od najjeftinije cijene"
      tableCaption="Najjeftiniji whey proteini 4kg u Hrvatskoj — aktualne cijene"
      currentSlug="najjeftiniji-whey-protein-hrvatska-3500g-4500g"
      headerSection={<WeightRangeTabsHR currentSlug="najjeftiniji-whey-protein-hrvatska-3500g-4500g" />}
      faqs={[
        {
          q: "Tko kupuje 4kg pakiranje whey proteina?",
          a: "Redoviti korisnici koji treniraju 4–6 puta tjedno i konzumiraju protein svakodnevno. 4kg pakiranje uz jednu porciju dnevno traje oko 4–5 mjeseci, što znači svega 2–3 narudžbe godišnje.",
        },
        {
          q: "Je li cijena po gramu proteina znatno niža kod 4kg pakiranja?",
          a: "Da — generalno možeš očekivati 15–25% nižu cijenu po gramu u usporedbi s 1kg pakiranjem istog brenda. Razlika varira prema brendu i trgovini, a cijenu po gramu proteina možeš vidjeti na svakom proizvodu na Proteinoteci.",
        },
      ]}
    />
  );
}
