import { Metadata } from "next";
import { fetchStoreProducts } from "@/lib/seo-data";
import { SEOStorePage } from "@/components/seo/SEOStorePage";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "FitLab proteini — cene i poređenje | Proteinoteka",
  description:
    "Sve cene FitLab suplemenata i proteina na jednom mestu. Poredi FitLab sa ostalim srpskim prodavnicama po ceni, sadržaju proteina i value score — bez lutanja po sajtovima.",
  alternates: { canonical: "https://proteinoteka.rs/fitlab-proteini" },
  openGraph: {
    title: "FitLab proteini — cene i poređenje | Proteinoteka",
    description: "Aktuelne cene FitLab proteina. Nutritivne vrednosti, value score i direktno poređenje sa konkurencijom.",
    url: "https://proteinoteka.rs/fitlab-proteini",
    siteName: "Proteinoteka",
    locale: "sr_RS",
    type: "website",
  },
};

export default async function Page() {
  const products = await fetchStoreProducts({ storeName: "FitLab", limit: 30 });

  return (
    <SEOStorePage
      h1="FitLab proteini — sve cene"
      storeName="FitLab"
      intro="FitLab je prodavnica suplemenata dostupna na srpskom tržištu sa sopstvenim asortimanom proteinskih preparata. Pratimo aktuelne FitLab cene i poredimo ih sa svim ostalim prodavnicama u Srbiji. Pregled ispod prikazuje sve FitLab proteine sortirane po value score, što ti odmah govori koji od njih nudi optimalan odnos cene, sadržaja proteina i nutritivnog profila."
      products={products}
      currentSlug="fitlab-proteini"
      faqs={[
        {
          q: "Koji FitLab suplementi imaju najviše proteina na 100g?",
          a: "Sadržaj proteina na 100g zavisi od kategorije — whey izolati tipično imaju 85–93% proteina, koncentrati 70–85%. U tabeli ispod možeš videti nutritivne vrednosti svakog FitLab proteina i direktno ih porediti.",
        },
        {
          q: "Kako se FitLab cene porede sa ostalim prodavnicama u Srbiji?",
          a: "Proteinoteka svakodnevno prikuplja cene iz svih prodavnica uključujući FitLab. Na glavnoj stranici možeš filtrirati po brendu ili kategoriji i direktno videti kako se FitLab cene porede sa Supplementshop-om, Pansport-om i ostalima.",
        },
        {
          q: "Da li FitLab nudi isporuku u Srbiji?",
          a: "FitLab je dostupan na srpskom tržištu. Za tačne informacije o dostavi, rokovima i troškovima preporučujemo direktnu proveru na sajtu prodavnice, jer se uslovi mogu menjati.",
        },
      ]}
    />
  );
}
