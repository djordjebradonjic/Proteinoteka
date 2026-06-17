import { Metadata } from "next";
import { fetchStoreProducts } from "@/lib/seo-data";
import { SEOStorePage } from "@/components/seo/SEOStorePage";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: "Pansport proteini — cene i poređenje | Proteinoteka" },
  description:
    "Pansport cene proteina u Srbiji — whey, izolat i proteini za masu. Poredi Pansport sa Supplementshop-om i ostalim prodavnicama. Sve na jednom mestu.",
  alternates: { canonical: "https://proteinoteka.rs/pansport-proteini" },
  openGraph: {
    title: "Pansport proteini — cene i poređenje | Proteinoteka",
    description: "Aktuelne Pansport cene whey proteina u Srbiji. Value score, proteini na 100g i direktno poređenje sa svim prodavnicama.",
    url: "https://proteinoteka.rs/pansport-proteini",
    siteName: "Proteinoteka",
    locale: "sr_RS",
    type: "website",
  },
};

export default async function Page() {
  const products = await fetchStoreProducts({ storeName: "Pansport", limit: 30 });

  return (
    <SEOStorePage
      h1="Pansport proteini — sve cene"
      storeName="Pansport"
      intro="Pansport je srpska prodavnica sportske opreme i suplemenata sa ustaljenim mestom na domaćem tržištu. Pratimo sve Pansport cene proteina i automatski ih poredimo sa Supplementshop-om, Ogistrashop-om, Proteinbox-om i svim ostalim prodavnicama u Srbiji. Pregled ispod prikazuje dostupne proteine iz Pansport asortimana sortirane po value score — meri koja ti odmah govori koji protein nudi najviše proteina po potrošenom dinaru."
      products={products}
      currentSlug="pansport-proteini"
      faqs={[
        {
          q: "Koje kategorije proteina nosi Pansport?",
          a: "Pansport u asortimanu nosi različite kategorije proteina — whey koncentrate, izolate, blendove i proteine za masu. Kompletna ponuda sa aktuelnim cenama i nutritivnim vrednostima prikazana je u tabeli na ovoj stranici.",
        },
        {
          q: "Da li Pansport isporučuje na celoj teritoriji Srbije?",
          a: "Pansport je srpska prodavnica koja isporučuje na teritoriji Srbije. Za aktuelne detalje o rokovima dostave i troškovima preporučujemo proveru direktno na zvaničnom Pansport sajtu.",
        },
        {
          q: "Koji Pansport proteini imaju najbolji value score?",
          a: "Value score meri koliko grama proteina dobijaš po jednom dinaru, uz nutritivni profil. Na ovoj strani proteini iz Pansport-a su sortirani upravo po tom kriterijumu — na vrhu liste su oni koji nude najveću vrednost za novac. Zeleni score (8.5+) označava top value opcije.",
        },
        {
          q: "Kako se Pansport cene porede sa Supplementshop-om i Ogistrashop-om?",
          a: "Proteinoteka automatski prikuplja cene iz Pansport-a, Supplementshop-a, Ogistrashop-a i svih ostalih srpskih prodavnica. Na glavnoj stranici možeš filtrirati po brendu i odmah videti u kojoj prodavnici je cena najniža. Razlika između prodavnica za isti protein može biti i 20–30%.",
        },
        {
          q: "Da li Pansport ima proteine za dobijanje mišićne mase?",
          a: "Pansport nudi proteine pogodne za različite ciljeve, uključujući kategorije pogodne za faze mase. Pregled svih dostupnih proteina sa kalorijskom vrednošću i sadržajem proteina možeš videti u tabeli na ovoj stranici, sortiranoj po value score.",
        },
        {
          q: "Kako aktivirati price alert za Pansport proteine?",
          a: "Na stranici bilo kog Pansport proteina na Proteinoteci možeš aktivirati obaveštenje o padu cene — bez registracije. Unesi email i ciljnu cenu i dobiješ automatsko obaveštenje čim cena padne ispod željenog praga.",
        },
      ]}
    />
  );
}
