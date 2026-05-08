import { Metadata } from "next";
import { fetchStoreProducts } from "@/lib/seo-data";
import { SEOStorePage } from "@/components/seo/SEOStorePage";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Supplementshop proteini — cene i poređenje | Proteinoteka",
  description:
    "Aktuelne cene proteina iz Supplementshop asortimana. Poredi value score, nutritivne vrednosti i pronađi pravi protein iz Supplementshop ponude bez lutanja po sajtovima.",
  alternates: { canonical: "https://proteinoteka.rs/supplementshop-proteini" },
  openGraph: {
    title: "Supplementshop proteini — cene i poređenje | Proteinoteka",
    description: "Pregled svih Supplementshop proteina sa aktuelnim cenama i value score poređenjem.",
    url: "https://proteinoteka.rs/supplementshop-proteini",
    siteName: "Proteinoteka",
    locale: "sr_RS",
    type: "website",
  },
};

export default async function Page() {
  const products = await fetchStoreProducts({ storeName: "Supplementshop", limit: 30 });

  return (
    <SEOStorePage
      h1="Supplementshop proteini — uporedi cene"
      storeName="Supplementshop"
      intro="Supplementshop nudi širok asortiman proteinskih suplemenata za srpsko tržište. Na Proteinoteki pratimo sve Supplementshop cene i poredimo ih sa ostalim prodavnicama u realnom vremenu. Ispod su prikazani svi dostupni proteini iz Supplementshop ponude, sortirani po value score — objektivnoj meri koja uzima u obzir cenu, sadržaj proteina i ukupni nutritivni profil svakog proizvoda."
      products={products}
      currentSlug="supplementshop-proteini"
      faqs={[
        {
          q: "Da li Supplementshop šalje u Srbiju?",
          a: "Supplementshop opslužuje kupce u Srbiji. Pre narudžbine preporučujemo proveru aktuelnih uslova dostave i troškova direktno na sajtu prodavnice, jer se politika dostave može menjati.",
        },
        {
          q: "Koji whey proteini se mogu naći u Supplementshop asortimanu?",
          a: "Supplementshop nudi različite kategorije whey proteina — koncentrate, izolate i blendove. Na ovoj stranici su prikazane aktuelne cene svih proteina iz Supplementshop-a, sortirane po value score.",
        },
        {
          q: "Kako pratiti cene na Supplementshop-u bez stalnog poređenja sajtova?",
          a: "Proteinoteka automatski skuplja i ažurira cene iz Supplementshop-a i svih ostalih prodavnica na jednom mestu. Ne treba ručno pratiti cene — podaci se redovno osvežavaju tako da uvek vidiš aktuelno stanje.",
        },
      ]}
    />
  );
}
