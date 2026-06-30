import { notFound } from "next/navigation";
import { CURRENT_MARKET } from "@/lib/marketConfig";
import { Metadata } from "next";
import { fetchStoreProducts } from "@/lib/seo-data";
import { SEOStorePage } from "@/components/seo/SEOStorePage";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: "Proteini.si — Cijene i usporedba u Hrvatskoj | Proteinoteka" },
  description:
    "Proteini.si cijene za Hrvatsku — usporedi whey, izolate i veganske proteine iz slovenačkog shopa s ostalim HR trgovinama. Aktualne EUR cijene na jednom mjestu.",
  alternates: { canonical: "https://proteinoteka.com.hr/proteini-si-hrvatska" },
  openGraph: {
    title: "Proteini.si — Cijene i usporedba u Hrvatskoj | Proteinoteka",
    description:
      "Proteini.si whey, izolati i veganski proteini dostupni u Hrvatskoj — value score, EUR po gramu proteina i usporedba s GymBeam, MyProtein i Polleo Sport.",
    url: "https://proteinoteka.com.hr/proteini-si-hrvatska",
    siteName: "Proteinoteka",
    locale: "hr_HR",
    type: "website",
    images: [{ url: "https://proteinoteka.com.hr/opengraph-image", width: 1200, height: 630, alt: "Proteinoteka" }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["https://proteinoteka.com.hr/opengraph-image"],
  },
};

export default async function Page() {
  if (CURRENT_MARKET !== "hr") notFound();
  const products = await fetchStoreProducts({
    storeName: "Proteini.si HR",
    limit: 200,
  });

  return (
    <SEOStorePage
      h1="Proteini.si — Aktualne cijene i usporedba za Hrvatsku"
      storeName="Proteini.si HR"
      intro="Proteini.si je slovenački online shop s dugom tradicijom i širokim asortimanom internacionalnih brendova koji redovito dostavljaju u Hrvatsku. Na Proteinoteci pratimo aktualne EUR cijene s Proteini.si i automatski ih uspoređujemo s GymBeam HR, MyProtein HR, Polleo Sport i ostalim HR trgovinama — jer slovenački shop ponekad nudi bolje cijene za brendove koji su slabije zastupljeni lokalno. Pregled ispod prikazuje sve dostupne proteine sortirane po value score, uz nutritivne vrijednosti i cijenu po gramu proteina."
      products={products}
      currentSlug="proteini-si-hrvatska"
      faqs={[
        {
          q: "Dostavlja li Proteini.si u Hrvatsku?",
          a: "Da, Proteini.si redovito dostavlja u Hrvatsku. Kao slovenački webshop unutar EU, nema carine ni dodatnih troškova uvoza. Točne uvjete dostave i rokove uvijek preporučamo provjeriti izravno na proteini.si.",
        },
        {
          q: "Koji brendovi su dostupni na Proteini.si za Hrvatsku?",
          a: "Proteini.si nudi širok asortiman međunarodnih brendova — Battery, IronMaxx, Nutrend, Olimp, Optimum Nutrition, BSN, Dedicated, MuscleTech i mnoge druge. Na ovoj stranici prikazane su aktualne cijene svih proteina dostupnih za dostavu u Hrvatsku.",
        },
        {
          q: "Je li Proteini.si jeftiniji od GymBeam HR i MyProtein HR?",
          a: "Ovisi o brendu i trenutnoj akciji. Proteini.si često ima konkurentne cijene za Battery, Nutrend i Olimp brendove. Proteinoteka automatski računa value score i EUR po gramu proteina za sve trgovine — filtriraj po brendu na glavnoj stranici i odmah vidi koja trgovina nudi bolju cijenu.",
        },
        {
          q: "Koliko traje dostava s Proteini.si u Hrvatsku?",
          a: "Dostava iz Slovenije u Hrvatsku obično traje 2–4 radna dana. Kao EU-na dostava, nema carine. Točne informacije o troškovima dostave i minimalnoj narudžbi nalaze se na proteini.si.",
        },
        {
          q: "Koje kategorije proteina nudi Proteini.si za Hrvatsku?",
          a: "Proteini.si nudi whey koncentrat, whey izolat, kazein, biljne i veganske proteine, proteinske pločice i gainer proteine od poznatih svjetskih brendova. Sve kategorije dostupne za HR dostavu prikazane su na ovoj stranici, sortirane po value score.",
        },
        {
          q: "Kako se Proteini.si cijene uspoređuju s domaćim hrvatskim trgovinama?",
          a: "Proteinoteka automatski prikuplja cijene s Proteini.si i uspoređuje ih s GymBeam HR, MyProtein HR, Polleo Sport, Protekom i Nutrition Shop HR. Na glavnoj stranici filtriraj po brendu i odmah vidi ima li slovenački shop bolju ili lošiju cijenu od domaćih prodavaonica.",
        },
      ]}
    />
  );
}
