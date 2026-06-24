import { Metadata } from "next";
import { fetchStoreProducts } from "@/lib/seo-data";
import { SEOStorePage } from "@/components/seo/SEOStorePage";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: "Proteinbox proteini — cene i poređenje | Proteinoteka" },
  description:
    "Proteinbox cene proteina u Srbiji — whey, izolat i biljni. Poredi sa Pansport-om, Ogistrashop-om i svim ostalim srpskim prodavnicama. Value score za svaki protein.",
  alternates: { canonical: "https://proteinoteka.rs/proteinbox-proteini" },
  openGraph: {
    title: "Proteinbox proteini — cene i poređenje | Proteinoteka",
    description: "Aktuelne Proteinbox cene proteina u Srbiji. Value score, nutritivne vrednosti i direktno poređenje sa svim prodavnicama.",
    url: "https://proteinoteka.rs/proteinbox-proteini",
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
  const products = await fetchStoreProducts({ storeName: "Proteinbox", limit: 200 });

  return (
    <SEOStorePage
      h1="Proteinbox proteini — sve cene"
      storeName="Proteinbox"
      intro="Proteinbox je online prodavnica suplemenata dostupna na srpskom tržištu, fokusirana na proteine i preparate za sportiste. Pratimo sve Proteinbox cene i automatski ih poredimo sa Pansport-om, Supplementshop-om, Ogistrashop-om i svim ostalim prodavnicama u Srbiji. Ispod je kompletan pregled proteina iz Proteinbox asortimana sortiranih po value score — meri koji uzima u obzir cenu, sadržaj proteina i nutritivni profil svakog preparata."
      products={products}
      currentSlug="proteinbox-proteini"
      faqs={[
        {
          q: "Koji proteini se nalaze u Proteinbox asortimanu?",
          a: "Proteinbox nudi različite kategorije proteinskih suplemenata — whey koncentrate, izolate, blendove i biljne proteine. Kompletan pregled sa aktuelnim cenama i nutritivnim vrednostima dostupan je u tabeli iznad, sortiran po value score.",
        },
        {
          q: "Da li Proteinbox dostavlja na celoj teritoriji Srbije?",
          a: "Proteinbox organizuje dostavu širom Srbije kurirskim servisima. Za aktuelne informacije o troškovima i rokovima dostave preporučujemo direktnu proveru na sajtu Proteinbox-a, jer se uslovi mogu menjati.",
        },
        {
          q: "Koji Proteinbox proteini imaju najviše proteina na 100g?",
          a: "Whey izolati generalno imaju najviše proteina na 100g — tipično između 85g i 93g. Whey koncentrati se kreću od 70g do 82g. Na ovoj stranici su svi Proteinbox proteini sortirani po value score koji uzima u obzir i sadržaj proteina i cenu — tako da odmah vidiš šta nudi najviše za novac.",
        },
        {
          q: "Kako se Proteinbox cene porede sa Pansport-om i Ogistrashop-om?",
          a: "Na glavnoj stranici Proteinoteke možeš videti isti protein iz više prodavnica jedni pored drugog. Filtriraj po brendu ili kategoriji da odmah vidiš da li Proteinbox ima povoljniju cenu od Pansport-a ili Ogistrashop-a za protein koji tražiš. Razlika između prodavnica može biti i 15–25%.",
        },
        {
          q: "Da li Proteinbox ima veganske i biljne proteine?",
          a: "Da, Proteinbox u asortimanu nudi i biljne proteine. Za pun pregled svih biljnih proteina u svim srpskim prodavnicama poseti stranicu biljnih proteina na Proteinoteci gde poredimo sve opcije na bazi graška, pirinča i soje.",
        },
        {
          q: "Kako da pratim cene na Proteinbox-u bez ručnog poređenja?",
          a: "Na Proteinoteci možeš aktivirati price alert za bilo koji Proteinbox protein — bez registracije. Otvori stranicu željenog proizvoda, unesi email i ciljnu cenu i dobiješ obaveštenje čim cena padne. Cene se osvežavaju nedeljno tako da uvek vidiš aktuelno stanje.",
        },
      ]}
    />
  );
}
