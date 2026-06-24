import { Metadata } from "next";
import { fetchPriceRangeProducts } from "@/lib/seo-data";
import { SEOLandingPage } from "@/components/seo/SEOLandingPage";

export const revalidate = 43200;

export const metadata: Metadata = {
  title: { absolute: "Whey protein do 3000 dinara — najbolje opcije | Proteinoteka" },
  description:
    "Koji whey proteini se mogu naći do 3000 dinara u Srbiji? Aktuelne cene iz svih prodavnica, sortirane po value score — pronađi kvalitetan protein u okviru budžeta.",
  alternates: { canonical: "https://proteinoteka.rs/whey-protein-do-3000-dinara" },
  openGraph: {
    title: "Whey protein do 3000 dinara — najbolje opcije | Proteinoteka",
    description: "Pregled whey proteina do 3000 RSD iz svih srpskih prodavnica. Value score, proteini na 100g i direktno poređenje.",
    url: "https://proteinoteka.rs/whey-protein-do-3000-dinara",
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
  const products = await fetchPriceRangeProducts({ maxPrice: 3000, limit: 40 });

  const top = products[0];
  const cheapest = products.length > 0
    ? [...products].sort((a, b) => (a.numericPrice ?? 0) - (b.numericPrice ?? 0))[0]
    : null;

  const quickAnswer = top
    ? `Do 3000 dinara, ${top.name} (${top.storeName}) nudi najbolji value score od ${top.valueScore?.toFixed(1) ?? "N/A"}/10 za ${top.price}. Najjeftinija opcija u ovom budžetu je ${cheapest?.name ?? top.name} za ${cheapest?.price ?? top.price}.`
    : "";

  return (
    <SEOLandingPage
      h1="Whey protein do 3000 dinara — najbolje opcije"
      intro="Tražiš kvalitetan whey protein koji ne košta previše? Pratimo aktuelne cene iz svih srpskih prodavnica i filtriramo sve opcije do 3000 dinara — sortirane po value score. Tako vidiš koji protein u ovom cenovnom rangu nudi najveći sadržaj proteina i nutritivnu vrednost za uloženi novac, bez potrebe da prelistaš svaki sajt posebno."
      quickAnswer={quickAnswer}
      products={products}
      listHeading="Whey proteini do 3000 RSD — rang lista po value score"
      tableCaption="Whey proteini do 3000 dinara — aktuelne cene"
      currentSlug="whey-protein-do-3000-dinara"
      faqs={[
        {
          q: "Da li postoje kvalitetni proteini do 3000 dinara?",
          a: "Da — u ovom cenovnom rangu postoje solidne opcije, posebno među whey koncentratima. Koncentrat tipično sadrži 70–80% proteina na 100g i košta manje od izolata. Lista iznad je sortirana po value score, što znači da su na vrhu proteini koji nude najveću vrednost za cenu ispod 3000 dinara.",
        },
        {
          q: "Koji je najbolji whey protein za novac u Srbiji?",
          a: "Value score je naš pokazatelj koji meri koliko grama proteina dobijaš po potrošenom dinaru, uz nutritivni profil. Proteini sa visokim value score i pristupačnom cenom su uvek na vrhu lista na Proteinoteci — bez obzira na brend ili prodavnicu.",
        },
        {
          q: "Kako da izaberem protein po budžetu?",
          a: "Odredi maksimalnu cenu koju si spreman da platiš, pa sortiraj po value score. Proveri sadržaj proteina na 100g (ciljaj 70%+ za koncentrat), veličinu pakovanja i prodavnicu. Na Proteinoteci možeš filtrirati po ceni direktno na glavnoj stranici i porediti sve opcije jedne pored druge.",
        },
        {
          q: "Koji tip whey proteina je najisplativiji do 3000 dinara?",
          a: "U ovom cenovnom rangu dominira whey koncentrat — izolati su retko dostupni ispod 3000 dinara za kilogram. Koncentrat sa 70–80% proteina na 100g je sasvim dovoljan za rekreativce i one u fazi mase. Pazi na veličinu pakovanja: manji paketi mogu izgledati jeftino, ali cena po gramu proteina je često viša nego kod većih.",
        },
      ]}
      extraLinks={[
        { href: "/kategorija/whey-concentrate", label: "🥛 Whey Concentrate" },
      ]}
      disclaimer="Cene se mogu promeniti — uvek proveri aktuelnu cenu na sajtu prodavnice."
    />
  );
}
