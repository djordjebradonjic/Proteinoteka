import { notFound } from "next/navigation";
import { CURRENT_MARKET } from "@/lib/marketConfig";
import { Metadata } from "next";
import { fetchTopProducts } from "@/lib/seo-data";
import { SEOLandingPage } from "@/components/seo/SEOLandingPage";
import { WeightRangeTabsHR } from "@/components/seo/WeightRangeTabsHR";
import { WeightRangeInsights } from "@/components/seo/WeightRangeInsights";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: "Najjeftiniji Whey Protein 3kg u Hrvatskoj | Proteinoteka" },
  description:
    "Najjeftinije pakiranje whey proteina od 2.5kg do 3.5kg u Hrvatskoj. Uspoređujemo cijene iz svih trgovina — ažurirano tjedno, sortirano od najjeftinijeg.",
  alternates: { canonical: "https://proteinoteka.com.hr/najjeftiniji-whey-protein-hrvatska-2500g-3500g" },
  openGraph: {
    title: "Najjeftiniji Whey Protein 3kg u Hrvatskoj | Proteinoteka",
    description: "Aktualne cijene whey proteina 2.5–3.5kg iz svih hrvatskih trgovina. Sortirano od najjeftinijeg.",
    url: "https://proteinoteka.com.hr/najjeftiniji-whey-protein-hrvatska-2500g-3500g",
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
    p => p.primaryWeightGrams != null && p.primaryWeightGrams >= 2500 && p.primaryWeightGrams < 3500
  );

  const top = products[0];
  const bestValue = products.length > 0
    ? [...products].sort((a, b) => (b.valueScore ?? 0) - (a.valueScore ?? 0))[0]
    : null;

  const quickAnswer = top
    ? `Najjeftiniji whey concentrate u pakiranju oko 3kg u Hrvatskoj trenutno je ${top.name} za ${top.price} (${top.storeName}). Ako tražiš i dobru kvalitetu, ${bestValue?.name ?? top.name} nudi value score ${bestValue?.valueScore?.toFixed(1) ?? "N/A"}/10.`
    : "Trenutno nema dostupnih whey proteina u pakiranju 2.5–3.5kg. Pogledaj susjedne raspone.";

  return (
    <SEOLandingPage
      h1="Najjeftiniji Whey Protein 3kg u Hrvatskoj"
      intro="Pakiranja oko 3 kilograma — klasičan izbor za redovite korisnike koji žele nižu cijenu po gramu bez prevelike zalihe. Pratimo cijene iz svih hrvatskih trgovina i prikazujemo ih sortirano od najjeftinijeg."
      quickAnswer={quickAnswer}
      products={products}
      listHeading="Whey proteini 2.5–3.5kg sortirani od najjeftinije cijene"
      tableCaption="Najjeftiniji whey proteini 3kg u Hrvatskoj — aktualne cijene"
      currentSlug="najjeftiniji-whey-protein-hrvatska-2500g-3500g"
      headerSection={<WeightRangeTabsHR currentSlug="najjeftiniji-whey-protein-hrvatska-2500g-3500g" />}
      middleSection={<WeightRangeInsights products={products} />}
      faqs={[
        {
          q: "Koliko traje 3kg pakiranje whey proteina?",
          a: "Uz jednu porciju od 30g dnevno, 3kg pakiranje traje oko 100 dana — više od tri mjeseca. Uz dvije porcije, oko 50 dana. Ovo ga čini popularnim izborom za redovite korisnike koji žele rijetko naručivati.",
        },
        {
          q: "Zašto su 3kg pakiranja popularnija od 1kg?",
          a: "Veće pakiranje znači nižu cijenu po gramu proteina i rjeđe narudžbe. Razlika može biti i 20–30% u cijeni po gramu u usporedbi s kilogramskim pakiranjem.",
        },
        {
          q: "Isplati li se 3kg pakiranje ako treniram samo 2–3 puta tjedno?",
          a: "Da, ako protein piješ svaki dan (ne samo poslije treninga) — dnevna doza od jedne porcije uobičajena je preporuka za ukupan dnevni unos proteina, ne samo za dane treninga. Ako ga piješ samo poslije treninga, veće pakiranje će jednostavno trajati dulje, što je i dalje ušteda dok se ne približi roku trajanja.",
        },
        {
          q: "Kako sačuvati protein svježim do kraja 3kg pakiranja?",
          a: "Drži vrećicu/kutiju čvrsto zatvorenu, na suhom mjestu izvan izravne sunčeve svjetlosti i daleko od izvora vlage. Koristi suhu žlicu svaki put — vlaga je glavni uzrok grudanja i bržeg kvarenja praška, ne samo protok vremena.",
        },
      ]}
    />
  );
}
