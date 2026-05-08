import { Metadata } from "next";
import { fetchStoreProducts } from "@/lib/seo-data";
import { SEOStorePage } from "@/components/seo/SEOStorePage";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Ogistrashop proteini — cene i poređenje | Proteinoteka",
  description:
    "Pregled svih proteina iz Ogistrashop asortimana sa aktuelnim cenama. Poredi value score, nutritivne vrednosti i pronađi najisplativiji protein u Ogistrashop-u.",
  alternates: { canonical: "https://proteinoteka.rs/ogistrashop-proteini" },
  openGraph: {
    title: "Ogistrashop proteini — cene i poređenje | Proteinoteka",
    description: "Aktuelne cene proteina iz Ogistrashop-a. Value score, proteini na 100g i direktno poređenje.",
    url: "https://proteinoteka.rs/ogistrashop-proteini",
    siteName: "Proteinoteka",
    locale: "sr_RS",
    type: "website",
  },
};

export default async function Page() {
  const products = await fetchStoreProducts({ storeName: "Ogistrashop", limit: 30 });

  return (
    <SEOStorePage
      h1="Ogistrashop proteini — sve cene na jednom mestu"
      storeName="Ogistrashop"
      intro="Ogistrashop je srpska online prodavnica suplemenata sa stalnom ponudom whey proteina, aminokiselina i ostalih preparata. Automatski pratimo i poredimo sve cene Ogistrashop-a sa ostatkom srpskog tržišta — bez manuelnog pretražavanja. Ispod su prikazani svi proteini iz Ogistrashop asortimana, sortirani prema value score — pokazatelju koji meri koliko grama proteina dobijaš za svaki potrošeni dinar."
      products={products}
      currentSlug="ogistrashop-proteini"
      faqs={[
        {
          q: "Da li Ogistrashop dostavlja na celoj teritoriji Srbije?",
          a: "Ogistrashop dostavlja širom Srbije kurirskim servisima. Tačne informacije o rokovima i troškovima dostave nalaze se na zvaničnom sajtu prodavnice, jer se uslovi mogu periodično menjati.",
        },
        {
          q: "Koji proteini su najpopularniji u Ogistrashop ponudi?",
          a: "Ogistrashop nudi proteinska stresla i suplemente različitih brendova, od whey koncentrata do izolata. Koncentrati su generalno najprodavaniji jer nude solidan sadržaj proteina uz povoljniju cenu u poređenju sa izolatima.",
        },
        {
          q: "Kako na Proteinoteki mogu pronaći najjeftiniji protein iz Ogistrashop-a?",
          a: "Na ovoj strani proteini iz Ogistrashop-a su sortirani po value score — meri koji uzima u obzir cenu, sadržaj proteina i nutritivni profil. Za poređenje sa ostalim prodavnicama, poseti glavnu stranicu ili koristi alat za poređenje.",
        },
      ]}
    />
  );
}
