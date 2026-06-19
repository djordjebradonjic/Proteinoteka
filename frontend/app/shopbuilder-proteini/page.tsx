import { Metadata } from "next";
import { fetchStoreProducts } from "@/lib/seo-data";
import { SEOStorePage } from "@/components/seo/SEOStorePage";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: "Shopbuilder proteini — cene i poređenje | Proteinoteka" },
  description:
    "Shopbuilder proteini u Srbiji — GymBeam, Biotech USA, BioTechUSA, Nutrend i domaći brendovi. Poredi Shopbuilder cene sa svim srpskim prodavnicama po value score. Sve na jednom mestu.",
  alternates: { canonical: "https://proteinoteka.rs/shopbuilder-proteini" },
  openGraph: {
    title: "Shopbuilder proteini — cene i poređenje | Proteinoteka",
    description: "Aktuelne cene Shopbuilder proteina. Nutritivne vrednosti, value score i direktno poređenje sa konkurencijom.",
    url: "https://proteinoteka.rs/shopbuilder-proteini",
    siteName: "Proteinoteka",
    locale: "sr_RS",
    type: "website",
  },
};

export default async function Page() {
  const products = await fetchStoreProducts({ storeName: "Shopbuilder", limit: 200 });

  return (
    <SEOStorePage
      h1="Shopbuilder proteini — sve cene"
      storeName="Shopbuilder"
      intro="Shopbuilder je srpska online prodavnica suplemenata sa širokim izborom whey proteina, izolata, kazein proteina i biljnih proteina poznatih brendova. Pratimo aktuelne Shopbuilder cene i poredimo ih sa GymBeam-om, MyProtein-om, Pansportom i svim ostalim prodavnicama u Srbiji — bez lutanja po sajtovima. Pregled ispod prikazuje sve Shopbuilder proteine sortirane po value score, što ti odmah govori koji proizvod nudi najviše proteina po potrošenom dinaru."
      products={products}
      currentSlug="shopbuilder-proteini"
      faqs={[
        {
          q: "Koji Shopbuilder proteini imaju najviše proteina na 100g?",
          a: "Među Shopbuilder proizvodima, whey izolati obično imaju 85–90g proteina na 100g i to su nutritivno najjači izbori. Whey koncentrati su nešto niži (75–82g/100g), ali često povoljniji po ceni. Value score na Proteinoteci ti odmah pokazuje koji Shopbuilder protein nudi najboljidnostup gram-po-dinaru.",
        },
        {
          q: "Kako se Shopbuilder cene porede sa GymBeam-om i MyProtein-om?",
          a: "Proteinoteka automatski prikuplja cene iz svih prodavnica i računa value score — meru koliko grama proteina dobijaš po jednom dinaru. Na glavnoj stranici možeš filtrirati po brendu i odmah videti koja prodavnica ima povoljniju cenu za isti ili sličan proizvod. Shopbuilder često ima konkurentne cene, posebno u akcijskim periodima.",
        },
        {
          q: "Koji brendovi proteina se mogu kupiti na Shopbuilder-u?",
          a: "Shopbuilder nosi širok izbor domaćih i stranih brendova suplemenata. Paleta uključuje popularne whey proteine, izolate i kazein proteine različitih proizvođača. Sve dostupne brendove i njihove nutritivne vrednosti možeš videti u tabeli ispod.",
        },
        {
          q: "Da li Shopbuilder dostavlja na celoj teritoriji Srbije?",
          a: "Shopbuilder dostavlja širom Srbije kurirskim servisima. Za tačne informacije o rokovima dostave, troškovima i minimalnoj vrednosti porudžbine za besplatnu dostavu preporučujemo proveru na zvaničnom sajtu shopbuilder.rs, jer se uslovi mogu periodično menjati.",
        },
        {
          q: "Kako aktivirati price alert za Shopbuilder proteine?",
          a: "Na Proteinoteci možeš aktivirati obaveštenje o padu cene za bilo koji Shopbuilder protein — bez registracije. Otvori stranicu željenog proizvoda, unesi email i ciljnu cenu i dobiješ automatski email čim Shopbuilder snizi cenu. Praktično za pratiti akcije i sezonske popuste.",
        },
        {
          q: "Da li Shopbuilder ima veganske i biljne proteine?",
          a: "Da, Shopbuilder ima u ponudi i biljne proteine na bazi graška, pirinča ili kombinovane biljne formule. Za pun pregled biljnih proteina u svim prodavnicama poseti stranicu biljnog proteina na Proteinoteci i filtriraj po kategoriji.",
        },
      ]}
    />
  );
}
