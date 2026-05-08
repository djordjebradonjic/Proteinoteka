import { Metadata } from "next";
import { fetchStoreProducts } from "@/lib/seo-data";
import { SEOStorePage } from "@/components/seo/SEOStorePage";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Pansport proteini — cene i poređenje | Proteinoteka",
  description:
    "Sve cene proteina iz Pansport asortimana na jednom mestu. Poredi whey protein cenu u Pansport-u sa ostalim srpskim prodavnicama i pronađi najisplativiju opciju.",
  alternates: { canonical: "https://proteinoteka.rs/pansport-proteini" },
  openGraph: {
    title: "Pansport proteini — cene i poređenje | Proteinoteka",
    description: "Aktuelne cene whey proteina iz Pansport-a. Value score, proteini na 100g i direktno poređenje.",
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
      h1="Pansport proteini — cene i poređenje"
      storeName="Pansport"
      intro="Pansport je srpska prodavnica sportske opreme i suplemenata sa ustaljenim mestom na domaćem tržištu. Pratimo sve Pansport cene proteina i automatski ih poredimo sa Supplementshop-om, Ogistrashop-om i ostalima. Ispod je kompletan pregled proteina iz Pansport ponude, sortiran prema value score — tako instantno vidiš koji Pansport protein nudi najviše proteina po uloženom dinaru."
      products={products}
      currentSlug="pansport-proteini"
      faqs={[
        {
          q: "Da li Pansport isporučuje na celoj teritoriji Srbije?",
          a: "Pansport je srpska prodavnica koja isporučuje na teritoriji Srbije. Za aktuelne detalje o rokovima dostave i troškovima preporučujemo proveru na zvaničnom Pansport sajtu.",
        },
        {
          q: "Koji Pansport proteini imaju najbolji value score?",
          a: "Value score meri koliko grama proteina dobijaš po jednom dinaru, uz nutritivni profil. Na ovoj strani proteini iz Pansport-a su sortirani upravo po tom kriterijumu — na vrhu liste su oni koji nude najveću vrednost za novac.",
        },
        {
          q: "Da li Pansport ima proteine za dobijanje mišićne mase?",
          a: "Pansport nudi različite kategorije proteina, uključujući koncentrate i blendove pogodne za faze mase. Pregled svih dostupnih proteina u Pansport asortimanu, sa kalorijskom vrednošću i sadržajem proteina, možeš videti u tabeli ispod.",
        },
      ]}
    />
  );
}
