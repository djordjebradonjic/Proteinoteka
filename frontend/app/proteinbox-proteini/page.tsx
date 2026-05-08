import { Metadata } from "next";
import { fetchStoreProducts } from "@/lib/seo-data";
import { SEOStorePage } from "@/components/seo/SEOStorePage";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Proteinbox proteini — cene i poređenje | Proteinoteka",
  description:
    "Pregled svih proteina iz Proteinbox-a sa aktuelnim cenama. Poredi Proteinbox sa ostalim srpskim prodavnicama po value score i pronađi najisplativiji protein.",
  alternates: { canonical: "https://proteinoteka.rs/proteinbox-proteini" },
  openGraph: {
    title: "Proteinbox proteini — cene i poređenje | Proteinoteka",
    description: "Aktuelne Proteinbox cene proteina. Value score, nutritivne vrednosti i poređenje sa konkurencijom.",
    url: "https://proteinoteka.rs/proteinbox-proteini",
    siteName: "Proteinoteka",
    locale: "sr_RS",
    type: "website",
  },
};

export default async function Page() {
  const products = await fetchStoreProducts({ storeName: "Proteinbox", limit: 30 });

  return (
    <SEOStorePage
      h1="Proteinbox — proteini i cene"
      storeName="Proteinbox"
      intro="Proteinbox je srpska online prodavnica suplemenata fokusirana na proteine i preparate za sportiste. Pratimo sve Proteinbox cene i poredimo ih sa Pansport-om, Supplementshop-om i ostalim prodavnicama. Ispod je pregled svih proteina iz Proteinbox asortimana sortiranih po value score — meri koji uzima u obzir cenu, sadržaj proteina i nutritivni profil svakog preparata."
      products={products}
      currentSlug="proteinbox-proteini"
      faqs={[
        {
          q: "Da li Proteinbox dostavlja na celoj teritoriji Srbije?",
          a: "Proteinbox organizuje dostavu širom Srbije kurirskim servisima. Za aktuelne informacije o dostavi, rokovima i troškovima preporučujemo direktnu proveru na sajtu Proteinbox-a.",
        },
        {
          q: "Koji proteini se nalaze u Proteinbox asortimanu?",
          a: "Proteinbox nudi različite kategorije proteinskih suplemenata — od whey koncentrata i izolata do biljnih proteina i blendova. Kompletan pregled sa cenama i nutritivnim vrednostima dostupan je u tabeli na ovoj stranici.",
        },
        {
          q: "Kako se Proteinbox cene porede sa konkurencijom?",
          a: "Na glavnoj stranici Proteinoteke možeš videti isti protein iz više prodavnica jedni pored drugog. Koristi filter po brendu ili kategoriji, ili alat za direktno poređenje, da proveriš da li je Proteinbox najjeftinija opcija za proizvod koji tražiš.",
        },
      ]}
    />
  );
}
