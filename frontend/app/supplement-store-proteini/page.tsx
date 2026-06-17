import { Metadata } from "next";
import { fetchStoreProducts } from "@/lib/seo-data";
import { SEOStorePage } from "@/components/seo/SEOStorePage";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: "Supplement Store proteini — cene i poređenje | Proteinoteka" },
  description:
    "Sve cene proteina iz Supplement Store asortimana na jednom mestu. Poredi Supplement Store sa ostalim srpskim prodavnicama po ceni, sadržaju proteina i value score — bez lutanja po sajtovima.",
  alternates: { canonical: "https://proteinoteka.rs/supplement-store-proteini" },
  openGraph: {
    title: "Supplement Store proteini — cene i poređenje | Proteinoteka",
    description: "Aktuelne cene Supplement Store proteina. Nutritivne vrednosti, value score i direktno poređenje sa konkurencijom.",
    url: "https://proteinoteka.rs/supplement-store-proteini",
    siteName: "Proteinoteka",
    locale: "sr_RS",
    type: "website",
  },
};

export default async function Page() {
  const products = await fetchStoreProducts({ storeName: "SupplementStore", limit: 30 });

  return (
    <SEOStorePage
      h1="Supplement Store proteini — sve cene"
      storeName="SupplementStore"
      intro="Supplement Store je srpska online prodavnica suplemenata koja nudi širok izbor proteinskih praškova poznatih svetskih brendova — Ultimate Nutrition, Optimum Nutrition, BSN, Dymatize i drugi. Na Proteinoteci pratimo aktuelne Supplement Store cene i poredimo ih sa GymBeam-om, MyProtein-om i svim ostalim prodavnicama u Srbiji. Pregled ispod prikazuje sve dostupne proteine iz Supplement Store ponude, sortirane po value score — objektivnoj meri koja uzima u obzir cenu, sadržaj proteina i nutritivni profil svakog proizvoda."
      products={products}
      currentSlug="supplement-store-proteini"
      faqs={[
        {
          q: "Koji proteini se mogu naći u Supplement Store asortimanu?",
          a: "Supplement Store nudi proteine iz kategorija whey koncentrata, izolata, kazein proteina i biljnih proteina. U ponudi su brendovi poput Ultimate Nutrition, Optimum Nutrition, BSN i Dymatize. Sve aktuelne cene i nutritivne vrednosti su prikazane u tabeli iznad.",
        },
        {
          q: "Koji Supplement Store proteini imaju najviše proteina na 100g?",
          a: "Whey izolati i hidrolizati generalno imaju najviše proteina na 100g — tipično između 80g i 90g. Whey koncentrati se kreću od 70g do 80g na 100g. Na ovoj stranici su svi proteini sortirani po value score koji uzima u obzir i sadržaj proteina i cenu.",
        },
        {
          q: "Kako se Supplement Store cene porede sa GymBeam-om i MyProtein-om?",
          a: "Proteinoteka automatski prikuplja cene iz svih prodavnica i računa value score — meru koliko grama proteina dobijaš po jednom dinaru. Na glavnoj stranici možeš filtrirati po prodavnici i odmah videti koja nudi najpovoljniju cenu za isti ili sličan proizvod.",
        },
        {
          q: "Da li Supplement Store dostavlja na celoj teritoriji Srbije?",
          a: "Supplement Store dostavlja širom Srbije kurirskim servisima. Za tačne informacije o rokovima i troškovima dostave preporučujemo proveru na zvaničnom sajtu supplementstore.rs, jer se uslovi mogu periodično menjati.",
        },
        {
          q: "Da li Supplement Store ima veganske i biljne proteine?",
          a: "Da, Supplement Store u asortimanu ima biljne proteine na bazi graška, pirinča i soje. Sve kategorije proteina — uključujući veganske opcije — možeš pronaći sortirane po value score u tabeli na ovoj stranici.",
        },
      ]}
    />
  );
}
