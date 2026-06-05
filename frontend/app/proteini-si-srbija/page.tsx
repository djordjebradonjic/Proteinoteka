import { Metadata } from "next";
import { fetchStoreProducts } from "@/lib/seo-data";
import { SEOStorePage } from "@/components/seo/SEOStorePage";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: "Proteini.si — dostava u Srbiju i cene | Proteinoteka" },
  description:
    "Aktuelne cene proteina sa Proteini.si sajta uz dostavu u Srbiju. Poredi sa domaćim prodavnicama po value score i pronađi da li se uvoz isplati za protein koji tražiš.",
  alternates: { canonical: "https://proteinoteka.rs/proteini-si-srbija" },
  openGraph: {
    title: "Proteini.si — dostava u Srbiju i cene | Proteinoteka",
    description: "Proteini.si cene za Srbiju — value score, nutritivne vrednosti i poređenje sa domaćim prodavnicama.",
    url: "https://proteinoteka.rs/proteini-si-srbija",
    siteName: "Proteinoteka",
    locale: "sr_RS",
    type: "website",
  },
};

export default async function Page() {
  const products = await fetchStoreProducts({ storeName: "Proteini.si", limit: 30 });

  return (
    <SEOStorePage
      h1="Proteini.si — dostava u Srbiju i cene"
      storeName="Proteini.si"
      intro="Proteini.si je slovenački online shop sa širokim asortimanom internacionalnih brendova koji dostavljaju i u Srbiju. Pratimo cene sa Proteini.si i poredimo ih sa domaćim prodavnicama — jer nekad uvozna ponuda bude konkurentnija, posebno za brendove koji nisu zastupljeni lokalno. Ispod su svi dostupni proteini sortirani po value score, sa aktuelnim cenama i nutritivnim vrednostima."
      products={products}
      currentSlug="proteini-si-srbija"
      faqs={[
        {
          q: "Da li Proteini.si dostavlja u Srbiju?",
          a: "Proteini.si je slovenački sajt koji vrši isporuku i u Srbiju. Dostupnost dostave, aktuelni troškovi i rokovi mogu varirati, pa preporučujemo proveru direktno na sajtu pre naručivanja.",
        },
        {
          q: "Koji brendovi su dostupni na Proteini.si sajtu?",
          a: "Proteini.si nudi širok asortiman internacionalnih brendova suplemenata koji su ponekad teže dostupni u domaćim prodavnicama. Na ovoj stranici su prikazane aktuelne cene proteina dostupnih za dostavu u Srbiju.",
        },
        {
          q: "Koliko traje dostava iz Proteini.si u Srbiju?",
          a: "Rokovi dostave iz Proteini.si u Srbiju variraju i zavise od logistike i carinskih procedura. Tačne informacije o troškovima i rokovima dostave nalaze se na sajtu Proteini.si.",
        },
      ]}
    />
  );
}
