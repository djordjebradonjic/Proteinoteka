import { Metadata } from "next";
import { fetchStoreProducts } from "@/lib/seo-data";
import { SEOStorePage } from "@/components/seo/SEOStorePage";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: "Ogistrashop proteini — cene i poređenje | Proteinoteka" },
  description:
    "Ogistrashop cene proteina u Srbiji — whey koncentrat, izolat i biljni protein. Poredi sa Pansport-om, Supplementshop-om i svim ostalim prodavnicama. Value score.",
  alternates: { canonical: "https://proteinoteka.rs/ogistrashop-proteini" },
  openGraph: {
    title: "Ogistrashop proteini — cene i poređenje | Proteinoteka",
    description: "Aktuelne Ogistrashop cene proteina u Srbiji. Value score, nutritivne vrednosti i direktno poređenje sa svim prodavnicama.",
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
      h1="Ogistrashop proteini — sve cene"
      storeName="Ogistrashop"
      intro="Ogistrashop je srpska online prodavnica suplemenata sa stalnom ponudom whey proteina, aminokiselina i ostalih preparata za sportiste. Na Proteinoteci automatski pratimo i poredimo sve Ogistrashop cene sa Pansport-om, Supplementshop-om, Proteinbox-om i ostatkom srpskog tržišta — bez manuelnog pretražavanja. Ispod su svi proteini iz Ogistrashop asortimana, sortirani prema value score — pokazatelju koji meri koliko grama proteina dobijaš za svaki potrošeni dinar."
      products={products}
      currentSlug="ogistrashop-proteini"
      faqs={[
        {
          q: "Koje brendove proteina nosi Ogistrashop?",
          a: "Ogistrashop nudi proteine različitih brendova, od whey koncentrata do izolata i blendova. Kompletna ponuda sa aktuelnim cenama i nutritivnim vrednostima prikazana je u tabeli iznad, sortirana po value score.",
        },
        {
          q: "Da li Ogistrashop dostavlja na celoj teritoriji Srbije?",
          a: "Ogistrashop dostavlja širom Srbije kurirskim servisima. Tačne informacije o rokovima i troškovima dostave nalaze se na zvaničnom sajtu ogistrashop.rs, jer se uslovi mogu periodično menjati.",
        },
        {
          q: "Koji Ogistrashop proteini imaju najboljiji value score?",
          a: "Value score pokazuje koliko grama proteina dobijaš po jednom dinaru, uz nutritivni profil. Na ovoj stranici su svi Ogistrashop proteini sortirani po toj meri — na vrhu liste su oni koji nude najveću vrednost za novac. Zeleni score označava top-value opcije.",
        },
        {
          q: "Kako se Ogistrashop cene porede sa Pansport-om i Supplementshop-om?",
          a: "Proteinoteka automatski prikuplja cene iz Ogistrashop-a, Pansport-a, Supplementshop-a i svih ostalih prodavnica u Srbiji. Na glavnoj stranici filtriraj po brendu ili kategoriji i odmah vidi koja prodavnica ima najnižu cenu za protein koji tražiš. Razlika između prodavnica može biti i 20%.",
        },
        {
          q: "Da li Ogistrashop ima whey izolat i veganske proteine?",
          a: "Ogistrashop nudi proteine u više kategorija, uključujući whey izolate i biljne proteine. Sve kategorije sa aktuelnim cenama su prikazane u tabeli iznad. Za pun pregled biljnih proteina u svim srpskim prodavnicama poseti stranicu biljnih proteina na Proteinoteci.",
        },
        {
          q: "Kako da aktiviram obaveštenje o padu cene za Ogistrashop proteine?",
          a: "Na Proteinoteci možeš aktivirati price alert za bilo koji Ogistrashop protein bez registracije. Otvori stranicu željenog proizvoda, unesi email i ciljnu cenu i dobiješ automatsko obaveštenje čim cena padne ispod željenog praga.",
        },
      ]}
    />
  );
}
