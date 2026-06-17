import { Metadata } from "next";
import { fetchStoreProducts } from "@/lib/seo-data";
import { SEOStorePage } from "@/components/seo/SEOStorePage";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: "FitLab proteini — cene i poređenje | Proteinoteka" },
  description:
    "FitLab cene proteina u Srbiji — whey, izolat i proteini za masu. Poredi FitLab sa Pansport-om, Supplementshop-om i svim ostalim prodavnicama. Value score.",
  alternates: { canonical: "https://proteinoteka.rs/fitlab-proteini" },
  openGraph: {
    title: "FitLab proteini — cene i poređenje | Proteinoteka",
    description: "Aktuelne FitLab cene proteina u Srbiji. Value score, nutritivne vrednosti i direktno poređenje sa svim prodavnicama.",
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
      intro="FitLab je prodavnica suplemenata dostupna na srpskom tržištu sa asortimanom proteinskih preparata za sportiste i rekreativce. Na Proteinoteci pratimo aktuelne FitLab cene i automatski ih poredimo sa Pansport-om, Supplementshop-om, Ogistrashop-om i svim ostalim prodavnicama u Srbiji. Pregled ispod prikazuje sve FitLab proteine sortirane po value score — objektivnoj meri koja uzima u obzir cenu, sadržaj proteina i nutritivni profil svakog preparata."
      products={products}
      currentSlug="fitlab-proteini"
      faqs={[
        {
          q: "Koji FitLab suplementi imaju najviše proteina na 100g?",
          a: "Sadržaj proteina na 100g zavisi od kategorije — whey izolati tipično imaju 85–93g proteina, koncentrati 70–82g. U tabeli iznad možeš videti nutritivne vrednosti svakog FitLab proteina i direktno ih porediti sa ostalim prodavnicama.",
        },
        {
          q: "Da li FitLab nudi isporuku u Srbiji?",
          a: "FitLab je dostupan na srpskom tržištu. Za tačne informacije o dostavi, rokovima i troškovima preporučujemo direktnu proveru na sajtu prodavnice, jer se uslovi mogu menjati.",
        },
        {
          q: "Koji FitLab proteini imaju najboljiji value score?",
          a: "Value score meri koliko grama proteina dobijaš po jednom dinaru, uz nutritivni profil. Na ovoj stranici su svi FitLab proteini sortirani po toj meri — na vrhu liste su oni koji nude najveću vrednost za novac. Zeleni score (8.5+) označava top-value opcije.",
        },
        {
          q: "Kako se FitLab cene porede sa ostalim prodavnicama u Srbiji?",
          a: "Proteinoteka svakodnevno prikuplja cene iz svih prodavnica uključujući FitLab. Na glavnoj stranici možeš filtrirati po brendu ili kategoriji i direktno videti kako se FitLab cene porede sa Supplementshop-om, Pansport-om, Ogistrashop-om i ostalima. Razlika između prodavnica za isti protein može biti i 20–30%.",
        },
        {
          q: "Da li FitLab ima whey izolat i biljne proteine?",
          a: "FitLab nudi proteine u više kategorija uključujući whey izolate. Za pun pregled biljnih i veganih proteina u svim srpskim prodavnicama poseti stranicu biljnih proteina na Proteinoteci gde poredimo sve dostupne opcije.",
        },
        {
          q: "Kako da aktiviram obaveštenje o padu cene za FitLab proteine?",
          a: "Na Proteinoteci možeš aktivirati price alert za bilo koji FitLab protein — bez registracije. Otvori stranicu željenog proizvoda, unesi email i ciljnu cenu i dobiješ automatsko obaveštenje čim cena padne ispod željenog praga.",
        },
      ]}
    />
  );
}
