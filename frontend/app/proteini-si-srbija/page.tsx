import { Metadata } from "next";
import { fetchStoreProducts } from "@/lib/seo-data";
import { SEOStorePage } from "@/components/seo/SEOStorePage";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: "Proteini.si — dostava u Srbiju i cene | Proteinoteka" },
  description:
    "Proteini.si cene za Srbiju — da li se isplati uvoz? Poredi sa domaćim prodavnicama po value score i ceni po gramu proteina. Aktuelne cene na jednom mestu.",
  alternates: { canonical: "https://proteinoteka.rs/proteini-si-srbija" },
  openGraph: {
    title: "Proteini.si — dostava u Srbiju i cene | Proteinoteka",
    description: "Proteini.si cene za Srbiju — value score, nutritivne vrednosti i poređenje sa domaćim prodavnicama. Isplati li se uvoz?",
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
      h1="Proteini.si — cene i dostava u Srbiju"
      storeName="Proteini.si"
      intro="Proteini.si je slovenački online shop sa širokim asortimanom internacionalnih brendova koji dostavljaju i u Srbiju. Na Proteinoteci pratimo cene sa Proteini.si i automatski ih poredimo sa domaćim prodavnicama — jer nekad uvozna ponuda bude konkurentnija, posebno za brendove koji nisu zastupljeni lokalno ili kad je kurs povoljan. Pregled ispod prikazuje sve dostupne proteine sortirane po value score, sa aktuelnim cenama i nutritivnim vrednostima, tako da odmah možeš proceniti isplati li se narudžbina iz Slovenije."
      products={products}
      currentSlug="proteini-si-srbija"
      faqs={[
        {
          q: "Da li Proteini.si dostavlja u Srbiju?",
          a: "Proteini.si je slovenački sajt koji vrši isporuku i u Srbiju. Dostupnost dostave, aktuelni troškovi i rokovi mogu varirati, pa preporučujemo proveru direktno na sajtu proteini.si pre naručivanja.",
        },
        {
          q: "Koji brendovi su dostupni na Proteini.si sajtu?",
          a: "Proteini.si nudi širok asortiman internacionalnih brendova suplemenata — uključujući brendove koji su ponekad teže dostupni ili skuplji u srpskim prodavnicama. Na ovoj stranici su prikazane aktuelne cene proteina dostupnih za dostavu u Srbiju.",
        },
        {
          q: "Koliko traje dostava iz Proteini.si u Srbiju?",
          a: "Rokovi dostave iz Proteini.si u Srbiju variraju i zavise od logistike i carinskih procedura. Tačne informacije o troškovima i rokovima dostave nalaze se na sajtu proteini.si. Računi na carinu — za ličnu upotrebu ispod određene vrednosti pošiljke carinska obaveza može biti niža ili nepostojeća.",
        },
        {
          q: "Da li se isplati kupovati proteine iz Proteini.si u Srbiji?",
          a: "Zavisi od brenda i trenutnog kursa. Proteini.si može biti isplativija opcija za internacionalne brendove koji nisu dobro zastupljeni u srpskim prodavnicama. Proteinoteka ti odmah pokazuje value score za sve proteine iz Proteini.si i domaćih prodavnica — tako možeš direktno porediti cenu po gramu proteina bez ručnog računanja.",
        },
        {
          q: "Koje kategorije proteina nudi Proteini.si za dostavu u Srbiju?",
          a: "Proteini.si nudi whey koncentrate, izolate, kazein, biljne i veganske proteine od poznatih svetskih brendova. Na ovoj stranici su prikazane sve kategorije dostupne za isporuku u Srbiju, sortirane po value score.",
        },
        {
          q: "Kako se Proteini.si cene porede sa domaćim srpskim prodavnicama?",
          a: "Proteinoteka automatski prikuplja cene sa Proteini.si i poredi ih sa Pansport-om, Supplementshop-om, Ogistrashop-om i svim domaćim prodavnicama. Na glavnoj stranici filtriraj po brendu i odmah vidi da li domaća prodavnica ima bolju ili lošiju cenu od slovenačkog shop-a.",
        },
      ]}
    />
  );
}
