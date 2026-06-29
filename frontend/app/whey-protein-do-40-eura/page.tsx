import { notFound } from "next/navigation";
import { CURRENT_MARKET } from "@/lib/marketConfig";
import { Metadata } from "next";
import { fetchPriceRangeProducts } from "@/lib/seo-data";
import { SEOLandingPage } from "@/components/seo/SEOLandingPage";

export const revalidate = 43200;

export const metadata: Metadata = {
  title: { absolute: "Whey protein do 40 eura — najbolje opcije | Proteinoteka" },
  description:
    "Koji whey proteini se mogu naći do 40 EUR u Hrvatskoj? Aktualne cijene iz svih trgovina, sortirane po value scoreu — uključujući i izolate u ovom budžetu.",
  alternates: { canonical: "https://proteinoteka.com.hr/whey-protein-do-40-eura" },
  openGraph: {
    title: "Whey protein do 40 eura — najbolje opcije | Proteinoteka",
    description: "Pregled whey proteina do 40 EUR iz svih hrvatskih trgovina. Value score, proteini na 100g i direktna usporedba.",
    url: "https://proteinoteka.com.hr/whey-protein-do-40-eura",
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
  if (CURRENT_MARKET !== 'hr') notFound();
  const products = await fetchPriceRangeProducts({ maxPrice: 40, limit: 40 });

  const top = products[0];
  const cheapest = products.length > 0
    ? [...products].sort((a, b) => (a.numericPrice ?? 0) - (b.numericPrice ?? 0))[0]
    : null;

  const quickAnswer = top
    ? `Do 40 EUR, ${top.name} (${top.storeName}) nudi najbolji value score od ${top.valueScore?.toFixed(1) ?? "N/A"}/10 za ${top.price}. Najjeftinija opcija u ovom budžetu je ${cheapest?.name ?? top.name} za ${cheapest?.price ?? top.price}.`
    : "";

  return (
    <SEOLandingPage
      h1="Whey protein do 40 eura — najbolje opcije"
      intro="Do 40 EUR otvara se širi izbor: osim whey koncentrata, u ovom rasponu dostupni su i izolati i neke premium opcije. Pratimo aktualne cijene iz svih hrvatskih trgovina i sortiramo po value scoreu — da ne moraš sam uspoređivati svaku prodavaonicu."
      quickAnswer={quickAnswer}
      products={products}
      listHeading="Whey proteini do 40 EUR — rang lista po value scoreu"
      tableCaption="Whey proteini do 40 eura — aktualne cijene"
      currentSlug="whey-protein-do-40-eura"
      faqs={[
        {
          q: "Što dobivam s budžetom od 40 EUR za whey protein?",
          a: "S 40 EUR u Hrvatskoj možeš pronaći i kvalitetne whey izolate za 1 kg, premium koncentrate poznatih brendova ili veća pakiranja do 2 kg. Value score na Proteinoteci automatski identificira koja opcija nudi najveću vrijednost u ovom rasponu.",
        },
        {
          q: "Je li whey izolat vrijedi više novca od koncentrata?",
          a: "Ovisi o tvojim ciljevima. Izolat ima 85–95% proteina na 100g i gotovo nema laktoze — koristan ako imaš osjetljivost na laktozu ili tražiš čišći izvor proteina. Za većinu rekreativaca, koncentrat je dovoljan i isplativiji.",
        },
        {
          q: "Koji brendovi su dostupni do 40 EUR?",
          a: "U ovom rasponu dostupni su poznati brendovi poput Scitec, BioTechUSA, Optimum Nutrition, GymBeam i drugi. Na Proteinoteci filtriraš po brendu i odmah vidiš koja je trenutno najpovoljnija ponuda.",
        },
        {
          q: "Kako prepoznati dobar whey protein?",
          a: "Provjeri: (1) sadržaj proteina na 100g — ciljaj 70%+ za koncentrat, 85%+ za izolat; (2) popis sastojaka — kraći je obično bolji; (3) cijena po gramu proteina, ne ukupna cijena; (4) reputacija brenda. Proteinoteka automatski izračunava sve navedeno kroz value score.",
        },
      ]}
      extraLinks={[
        { href: "/kategorija/whey-concentrate", label: "🥛 Whey Concentrate" },
        { href: "/kategorija/whey-isolate", label: "✨ Whey Isolate" },
      ]}
      disclaimer="Cijene se mogu promijeniti — uvijek provjeri aktualnu cijenu na stranici prodavaonice."
    />
  );
}
