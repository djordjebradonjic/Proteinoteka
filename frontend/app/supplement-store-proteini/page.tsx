import { notFound } from "next/navigation";
import { CURRENT_MARKET } from "@/lib/marketConfig";
import { Metadata } from "next";
import { fetchStoreProducts } from "@/lib/seo-data";
import { SEOStorePage } from "@/components/seo/SEOStorePage";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: "Supplement Store proteini — cene i poređenje | Proteinoteka" },
  description:
    "Supplement Store cene proteina u Srbiji — Optimum Nutrition, BSN, Dymatize, Ultimate Nutrition. Poredi sa svim srpskim prodavnicama. Value score za svaki protein.",
  alternates: { canonical: "https://proteinoteka.rs/supplement-store-proteini" },
  openGraph: {
    title: "Supplement Store proteini — cene i poređenje | Proteinoteka",
    description: "Aktuelne Supplement Store cene proteina u Srbiji. Value score, nutritivne vrednosti i direktno poređenje sa svim prodavnicama.",
    url: "https://proteinoteka.rs/supplement-store-proteini",
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
  if (CURRENT_MARKET !== 'rs') notFound();
  const products = await fetchStoreProducts({ storeName: "SupplementStore", limit: 200 });

  return (
    <SEOStorePage
      h1="Supplement Store proteini — sve cene"
      storeName="SupplementStore"
      intro="Supplement Store je srpska online prodavnica suplemenata koja nudi širok izbor proteinskih praškova poznatih svetskih brendova — Optimum Nutrition, BSN, Dymatize, Ultimate Nutrition i drugi. Na Proteinoteci pratimo aktuelne Supplement Store cene i automatski ih poredimo sa GymBeam-om, MyProtein-om, Pansport-om i svim ostalim prodavnicama u Srbiji. Pregled ispod prikazuje sve dostupne proteine iz Supplement Store ponude, sortirane po value score — objektivnoj meri koja uzima u obzir cenu, sadržaj proteina i nutritivni profil svakog proizvoda."
      products={products}
      currentSlug="supplement-store-proteini"
      faqs={[
        {
          q: "Koje brendove proteina nosi Supplement Store?",
          a: "Supplement Store nudi proteine internacionalnih brendova kao što su Optimum Nutrition (Gold Standard), BSN, Dymatize (ISO100), Ultimate Nutrition i drugi. Kompletna ponuda sa aktuelnim cenama i nutritivnim vrednostima prikazana je u tabeli iznad.",
        },
        {
          q: "Koji Supplement Store proteini imaju najviše proteina na 100g?",
          a: "Whey izolati i hidrolizati generalno imaju najviše proteina na 100g — tipično između 80g i 93g. Dymatize ISO100 i slični hidrolizati su na vrhu. Whey koncentrati se kreću od 70g do 82g. Na ovoj stranici su svi proteini sortirani po value score koji uzima u obzir i sadržaj proteina i cenu.",
        },
        {
          q: "Kako se Supplement Store cene porede sa GymBeam-om i MyProtein-om?",
          a: "Proteinoteka automatski prikuplja cene iz Supplement Store-a i svih ostalih prodavnica i računa value score — meru koliko grama proteina dobijaš po jednom dinaru. Na glavnoj stranici možeš filtrirati po brendu ili kategoriji i odmah videti koja prodavnica ima povoljniju cenu za isti ili sličan proizvod.",
        },
        {
          q: "Da li Supplement Store dostavlja na celoj teritoriji Srbije?",
          a: "Supplement Store dostavlja širom Srbije kurirskim servisima. Za tačne informacije o rokovima i troškovima dostave preporučujemo proveru na zvaničnom sajtu supplementstore.rs, jer se uslovi mogu periodično menjati.",
        },
        {
          q: "Da li Supplement Store ima veganske i biljne proteine?",
          a: "Da, Supplement Store u asortimanu ima biljne proteine na bazi graška, pirinča i soje. Sve kategorije proteina — uključujući veganske opcije — možeš pronaći sortirane po value score u tabeli na ovoj stranici. Za pun pregled biljnih proteina u svim prodavnicama poseti stranicu biljnih proteina na Proteinoteci.",
        },
        {
          q: "Kako da aktiviram obaveštenje o padu cene za Supplement Store proteine?",
          a: "Na Proteinoteci možeš aktivirati price alert za bilo koji Supplement Store protein — bez registracije. Otvori stranicu željenog proizvoda, unesi email i ciljnu cenu i dobiješ automatsko obaveštenje čim cena padne. Posebno korisno za premium brendove kao Dymatize ISO100 i Optimum Nutrition koji mogu imati česte akcije.",
        },
      ]}
    />
  );
}
