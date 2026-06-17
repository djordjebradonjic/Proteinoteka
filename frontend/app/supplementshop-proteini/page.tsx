import { Metadata } from "next";
import { fetchStoreProducts } from "@/lib/seo-data";
import { SEOStorePage } from "@/components/seo/SEOStorePage";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: "Supplementshop proteini — cene i poređenje | Proteinoteka" },
  description:
    "Supplementshop cene proteina u Srbiji — whey, izolat, kazein. Poredi sa Pansport-om, Ogistrashop-om i svim ostalim prodavnicama. Value score za svaki proizvod.",
  alternates: { canonical: "https://proteinoteka.rs/supplementshop-proteini" },
  openGraph: {
    title: "Supplementshop proteini — cene i poređenje | Proteinoteka",
    description: "Aktuelne Supplementshop cene proteina u Srbiji. Value score, nutritivne vrednosti i direktno poređenje sa svim prodavnicama.",
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
      h1="Supplementshop proteini — sve cene"
      storeName="Supplementshop"
      intro="Supplementshop je srpska online prodavnica sportske ishrane sa stalnom ponudom whey proteina, izolata, kazeina i biljnih proteina. Na Proteinoteci pratimo Supplementshop cene i automatski ih poredimo sa Pansport-om, Ogistrashop-om, Proteinbox-om i svim ostalim prodavnicama u Srbiji — sve na jednom mestu, bez ručnog pretražavanja. Ispod su svi dostupni proteini iz Supplementshop asortimana, sortirani po value score — objektivnoj meri koja uzima u obzir cenu, sadržaj proteina i nutritivni profil."
      products={products}
      currentSlug="supplementshop-proteini"
      faqs={[
        {
          q: "Koje brendove proteina nosi Supplementshop?",
          a: "Supplementshop u asortimanu drži proteine domaćih i internacionalnih brendova — whey koncentrate, izolate i blendove. Konkretne brendove i aktuelne cene možeš videti u tabeli na ovoj stranici, sortirano po value score.",
        },
        {
          q: "Koji Supplementshop proteini imaju najboljiji value score?",
          a: "Value score meri koliko grama proteina dobijaš po jednom dinaru, uzimajući u obzir i nutritivni profil. Na ovoj strani su svi Supplementshop proteini sortirani po toj meri — proizvodi sa zelenim score-om na vrhu liste su best-value opcije za tvoj novac.",
        },
        {
          q: "Da li Supplementshop dostavlja na celoj teritoriji Srbije?",
          a: "Supplementshop opslužuje kupce u Srbiji. Za aktuelne informacije o troškovima i rokovima dostave preporučujemo proveru direktno na sajtu supplementshop.rs, jer se uslovi mogu periodično menjati.",
        },
        {
          q: "Kako se Supplementshop cene porede sa Pansport-om i Ogistrashop-om?",
          a: "Proteinoteka automatski prikuplja cene iz Supplementshop-a, Pansport-a, Ogistrashop-a i svih ostalih srpskih prodavnica. Na glavnoj stranici možeš filtrirati po brendu ili kategoriji i odmah videti koja prodavnica ima povoljniju opciju. Cene između prodavnica mogu se razlikovati i 20–30% za isti proizvod.",
        },
        {
          q: "Da li Supplementshop ima whey izolat i biljne proteine?",
          a: "Da, Supplementshop nudi proteine u različitim kategorijama — od whey koncentrata i izolata do biljnih proteina na bazi graška ili pirinča. Sve kategorije sa aktuelnim cenama su prikazane u tabeli iznad. Za pun pregled biljnih proteina u svim prodavnicama poseti stranicu biljnih proteina na Proteinoteci.",
        },
        {
          q: "Kako da aktiviram obaveštenje o padu cene na Supplementshop-u?",
          a: "Na Proteinoteci možeš aktivirati price alert za bilo koji Supplementshop protein — bez registracije. Otvori stranicu željenog proizvoda, unesi email i ciljnu cenu, i dobiješ email čim cena padne ispod zadanog praga.",
        },
      ]}
    />
  );
}
