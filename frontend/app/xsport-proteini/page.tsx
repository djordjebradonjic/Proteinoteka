import { Metadata } from "next";
import { fetchStoreProducts } from "@/lib/seo-data";
import { SEOStorePage } from "@/components/seo/SEOStorePage";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: "XSport proteini — cene i poređenje | Proteinoteka" },
  description:
    "XSport proteini u Srbiji — Scitec, Optimum Nutrition, BioTech USA, Ultimate Nutrition i još mnogo brendova. Poredi XSport cene sa svim srpskim prodavnicama po value score. Sve na jednom mestu.",
  alternates: { canonical: "https://proteinoteka.rs/xsport-proteini" },
  openGraph: {
    title: "XSport proteini — cene i poređenje | Proteinoteka",
    description: "Aktuelne cene XSport proteina. Nutritivne vrednosti, value score i direktno poređenje sa konkurencijom.",
    url: "https://proteinoteka.rs/xsport-proteini",
    siteName: "Proteinoteka",
    locale: "sr_RS",
    type: "website",
    images: [{ url: "https://proteinoteka.rs/opengraph-image", width: 1200, height: 630, alt: "Proteinoteka" }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["https://proteinoteka.rs/opengraph-image"],
  },
};

export default async function Page() {
  const products = await fetchStoreProducts({ storeName: "XSport", limit: 200 });

  return (
    <SEOStorePage
      h1="XSport proteini — sve cene"
      storeName="XSport"
      intro="XSport je srpska online prodavnica suplemenata sa bogatom ponudom whey proteina, izolata, kazein proteina i biljnih proteina vodećih svetskih brendova. Pratimo aktuelne XSport cene i poredimo ih sa GymBeam-om, MyProtein-om, FitLabom i svim ostalim prodavnicama u Srbiji. Pregled ispod prikazuje sve XSport proteine sortirane po value score — odmah vidiš koji proizvod nudi najviše proteina po potrošenom dinaru."
      products={products}
      currentSlug="xsport-proteini"
      faqs={[
        {
          q: "Koji XSport proteini imaju najviše proteina na 100g?",
          a: "Među XSport proizvodima, whey izolati poput SCITEC 100% Whey Isolate, Yamamoto Iso-FUJI i Ultimate Nutrition IsoCool obično imaju 85–90g proteina na 100g. Value score na Proteinoteci ti odmah pokazuje koji XSport protein nudi najmanji RSD po gramu proteina.",
        },
        {
          q: "Kako se XSport cene porede sa GymBeam-om i Pansportom?",
          a: "Proteinoteka automatski prikuplja cene iz svih prodavnica i računa value score — meru koliko grama proteina dobijaš po jednom dinaru. Na glavnoj stranici možeš filtrirati po brendu i odmah videti koja prodavnica ima povoljniju cenu za isti ili sličan proizvod.",
        },
        {
          q: "Koji brendovi proteina se mogu kupiti na XSport-u?",
          a: "XSport nosi širok izbor brendova: Scitec Nutrition, Optimum Nutrition, BioTech USA, Ultimate Nutrition, Yamamoto, Amix, Nutriversum, Applied Nutrition, Dymatize i mnogi drugi. Sve dostupne brendove i nutritivne vrednosti možeš videti u tabeli ispod.",
        },
        {
          q: "Da li XSport dostavlja na celoj teritoriji Srbije?",
          a: "XSport dostavlja širom Srbije kurirskim servisima. Za tačne informacije o rokovima dostave i troškovima preporučujemo proveru na zvaničnom sajtu xsport.rs, jer se uslovi mogu periodično menjati.",
        },
        {
          q: "Kako aktivirati price alert za XSport proteine?",
          a: "Na Proteinoteci možeš aktivirati obaveštenje o padu cene za bilo koji XSport protein — bez registracije. Otvori stranicu željenog proizvoda, unesi email i ciljnu cenu i dobiješ automatski email čim XSport snizi cenu.",
        },
        {
          q: "Da li XSport ima veganske i biljne proteine?",
          a: "Da, XSport ima u ponudi biljne proteine na bazi graška, soje i biljnih mešavina. Za pun pregled biljnih proteina u svim prodavnicama poseti stranicu biljnog proteina na Proteinoteci i filtriraj po kategoriji.",
        },
      ]}
    />
  );
}
