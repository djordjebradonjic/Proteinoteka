import { Metadata } from "next";
import { fetchPriceRangeProducts } from "@/lib/seo-data";
import { SEOLandingPage } from "@/components/seo/SEOLandingPage";

export const revalidate = 43200;

export const metadata: Metadata = {
  title: { absolute: "Whey protein do 20 eura — najbolje opcije | Proteinoteka" },
  description:
    "Koji whey proteini se mogu naći do 20 EUR u Hrvatskoj? Aktualne cijene iz svih trgovina, sortirane po value scoreu — pronađi kvalitetan protein u okviru budžeta.",
  alternates: { canonical: "https://proteinoteka.com.hr/whey-protein-do-20-eura" },
  openGraph: {
    title: "Whey protein do 20 eura — najbolje opcije | Proteinoteka",
    description: "Pregled whey proteina do 20 EUR iz svih hrvatskih trgovina. Value score, proteini na 100g i direktna usporedba.",
    url: "https://proteinoteka.com.hr/whey-protein-do-20-eura",
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
  const products = await fetchPriceRangeProducts({ maxPrice: 20, limit: 40 });

  const top = products[0];
  const cheapest = products.length > 0
    ? [...products].sort((a, b) => (a.numericPrice ?? 0) - (b.numericPrice ?? 0))[0]
    : null;

  const quickAnswer = top
    ? `Do 20 EUR, ${top.name} (${top.storeName}) nudi najbolji value score od ${top.valueScore?.toFixed(1) ?? "N/A"}/10 za ${top.price}. Najjeftinija opcija u ovom budžetu je ${cheapest?.name ?? top.name} za ${cheapest?.price ?? top.price}.`
    : "";

  return (
    <SEOLandingPage
      h1="Whey protein do 20 eura — najbolje opcije"
      intro="Tražiš kvalitetan whey protein koji ne košta previše? Pratimo aktualne cijene iz svih hrvatskih trgovina i filtriramo sve opcije do 20 EUR — sortirane po value scoreu. Tako vidiš koji protein u ovom cjenovnom rasponu nudi najveći sadržaj proteina i nutritivnu vrijednost za uloženi novac."
      quickAnswer={quickAnswer}
      products={products}
      listHeading="Whey proteini do 20 EUR — rang lista po value scoreu"
      tableCaption="Whey proteini do 20 eura — aktualne cijene"
      currentSlug="whey-protein-do-20-eura"
      faqs={[
        {
          q: "Postoje li kvalitetni proteini do 20 eura?",
          a: "Da — u ovom cjenovnom rasponu postoje solidne opcije, posebno među whey koncentratima. Koncentrat tipično sadrži 70–80% proteina na 100g i košta manje od izolata. Lista iznad sortirana je po value scoreu, što znači da su na vrhu proteini koji nude najveću vrijednost ispod 20 EUR.",
        },
        {
          q: "Koji je najbolji whey protein za novac u Hrvatskoj?",
          a: "Value score mjeri koliko grama proteina dobivaš po euru, uz nutritivni profil. Proteini s visokim value scoreom i pristupačnom cijenom uvijek su na vrhu lista na Proteinoteci — neovisno o brendu ili trgovini.",
        },
        {
          q: "Kako odabrati protein po budžetu?",
          a: "Odredi maksimalnu cijenu koju si spreman platiti, pa sortiraj po value scoreu. Provjeri sadržaj proteina na 100g (ciljaj 70%+ za koncentrat), veličinu pakiranja i prodavaonicu. Na Proteinoteci možeš filtrirati po cijeni direktno na glavnoj stranici.",
        },
        {
          q: "Koji tip whey proteina je najisplativiji do 20 EUR?",
          a: "U ovom cjenovnom rasponu dominira whey koncentrat — izolati su rijetko dostupni ispod 20 EUR za kilogram. Koncentrat sa 70–80% proteina na 100g sasvim je dovoljan za rekreativce i one u fazi mase.",
        },
      ]}
      extraLinks={[
        { href: "/kategorija/whey-concentrate", label: "🥛 Whey Concentrate" },
      ]}
      disclaimer="Cijene se mogu promijeniti — uvijek provjeri aktualnu cijenu na stranici prodavaonice."
    />
  );
}
