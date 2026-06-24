import { Metadata } from "next";
import { fetchPriceRangeProducts } from "@/lib/seo-data";
import { SEOLandingPage } from "@/components/seo/SEOLandingPage";

export const revalidate = 43200;

export const metadata: Metadata = {
  title: { absolute: "Whey protein do 5000 dinara — uporedi cene | Proteinoteka" },
  description:
    "Pregled whey proteina do 5000 dinara u Srbiji. Sortirano po value score — pronađi protein koji nudi najviše proteina i nutritivnu vrednost za budžet do 5000 RSD.",
  alternates: { canonical: "https://proteinoteka.rs/whey-protein-do-5000-dinara" },
  openGraph: {
    title: "Whey protein do 5000 dinara — uporedi cene | Proteinoteka",
    description: "Aktuelne cene whey proteina do 5000 RSD iz svih srpskih prodavnica. Sortirano po value score.",
    url: "https://proteinoteka.rs/whey-protein-do-5000-dinara",
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
  const products = await fetchPriceRangeProducts({ maxPrice: 5000, limit: 40 });

  const top = products[0];
  const cheapest = products.length > 0
    ? [...products].sort((a, b) => (a.numericPrice ?? 0) - (b.numericPrice ?? 0))[0]
    : null;

  const quickAnswer = top
    ? `Do 5000 dinara dostupan je širok izbor whey proteina — od koncentrata do izolata. Trenutno, ${top.name} (${top.storeName}) ima najviši value score od ${top.valueScore?.toFixed(1) ?? "N/A"}/10 za ${top.price}. Najjeftinija opcija u ovom budžetu je ${cheapest?.name ?? top.name} za ${cheapest?.price ?? top.price}.`
    : "";

  return (
    <SEOLandingPage
      h1="Whey protein do 5000 dinara — uporedi cene"
      intro="Budžet do 5000 dinara otvara mogućnost za i koncentrate i izolate — proteine sa višim sadržajem proteina i manjim udelom masti i laktoze. Pratimo aktuelne cene iz svih srpskih prodavnica i rangiramo sve opcije do 5000 dinara po value score, tako da odmah vidiš koji protein nudi najboljу vrednost u ovom cenovnom rangu."
      quickAnswer={quickAnswer}
      products={products}
      listHeading="Whey proteini do 5000 RSD — rang lista po value score"
      tableCaption="Whey proteini do 5000 dinara — aktuelne cene"
      currentSlug="whey-protein-do-5000-dinara"
      faqs={[
        {
          q: "Da li postoje kvalitetni proteini do 5000 dinara?",
          a: "Svakako — do 5000 dinara možeš naći i kvalitetne whey izolate, ne samo koncentrate. Izolati imaju 85–93% proteina na 100g, manje masti i laktoze, i pogodni su za osobe sa intolerancijom na laktozu ili u fazi definicije. Lista iznad je sortirana po value score, koji meri pravu vrednost svakog proizvoda za uloženi novac.",
        },
        {
          q: "Koji je najbolji whey protein za novac u Srbiji?",
          a: "Value score je naš pokazatelj koji kombinuje cenu, sadržaj proteina na 100g i nutritivni profil. Proteini sa visokim value score i pristupačnom cenom su na vrhu lista na Proteinoteci. Ne zavisi od brenda — zavisi od toga koliko proteina dobijaš za dinar.",
        },
        {
          q: "Kako da izaberem protein po budžetu?",
          a: "Odredi maksimalnu cenu i filtriraj na Proteinoteci — sortiranje po value score odmah ti pokazuje šta nudi najveću vrednost. Ako imaš intoleranciju na laktozu ili si u fazi definicije, traži izolate; za fazu mase ili rekreativnu upotrebu, koncentrat je obično isplativiji. Uvek proveri aktuelnu cenu direktno na sajtu prodavnice pre kupovine.",
        },
        {
          q: "Da li se isplati uzimati whey izolat do 5000 dinara?",
          a: "Do 5000 dinara možeš naći solidne izolate, posebno u pakovanjima od 1 kg manjih brendova. Izolat ima smisla ako imaš intoleranciju na laktozu, ako si u fazi definicije, ili ako uzimas protein 2–3 puta dnevno i čistoća unosa ti je važna. Ako si rekreativac bez tih uslova, koncentrat u istom budžetu daje veće pakovanje za isti novac.",
        },
      ]}
      extraLinks={[
        { href: "/kategorija/whey-concentrate", label: "🥛 Whey Concentrate" },
      ]}
      disclaimer="Cene se mogu promeniti — uvek proveri aktuelnu cenu na sajtu prodavnice."
    />
  );
}
