import { Metadata } from "next";
import { fetchTopProducts } from "@/lib/seo-data";
import { SEOLandingPage } from "@/components/seo/SEOLandingPage";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: "Whey Protein Cijena u Hrvatskoj 2026 | Proteinoteka" },
  description:
    "Usporedi cijene whey proteina iz svih hrvatskih trgovina. Value score, EUR po gramu proteina i direktna usporedba — na jednom mjestu, ažurirano tjedno.",
  alternates: { canonical: "https://proteinoteka.com.hr/whey-protein-cijena" },
  openGraph: {
    title: "Whey Protein Cijena u Hrvatskoj | Proteinoteka",
    description: "Aktualne cijene whey proteina iz svih hrvatskih trgovina. Usporedi i pronađi najbolju vrijednost.",
    url: "https://proteinoteka.com.hr/whey-protein-cijena",
    siteName: "Proteinoteka",
    locale: "hr_HR",
    type: "website",
    images: [{ url: "https://proteinoteka.com.hr/opengraph-image", width: 1200, height: 630, alt: "Proteinoteka" }],
  },
  twitter: {
    title: "Whey Protein Cijena u Hrvatskoj 2026 | Proteinoteka",
    description: "Usporedi cijene whey proteina iz svih hrvatskih trgovina. Value score i EUR po gramu proteina.",
  },
};

export default async function Page() {
  const products = await fetchTopProducts({
    category: "whey_concentrate",
    sortBy: "valueScore",
    limit: 20,
  });

  const top = products[0];
  const cheapest = products.length > 0
    ? [...products].sort((a, b) => (a.numericPrice ?? 0) - (b.numericPrice ?? 0))[0]
    : null;

  const quickAnswer = top
    ? `Whey protein s najboljim omjerom cijene i kvalitete u Hrvatskoj trenutno je ${top.name} (${top.storeName}) s value scoreom ${top.valueScore?.toFixed(1) ?? "N/A"}/10 za ${top.price}. Najjeftinija opcija je ${cheapest?.name ?? top.name} za ${cheapest?.price ?? top.price}.`
    : "";

  return (
    <SEOLandingPage
      h1="Whey Protein Cijena u Hrvatskoj — Usporedi sve trgovine"
      intro="Pratimo aktualne cijene whey proteina iz svih hrvatskih trgovina. Lista je sortirana po value scoreu — pokazatelju koji mjeri koliko grama proteina dobivaš po euru, uzimajući u obzir i nutritivni profil. Tako odmah vidiš koji protein nudi najveću vrijednost, bez pretraživanja svake trgovine posebno."
      quickAnswer={quickAnswer}
      products={products}
      listHeading="Whey proteini — rang lista po value score"
      tableCaption="Whey protein cijene u Hrvatskoj — aktualna usporedba"
      currentSlug="whey-protein-cijena"
      faqs={[
        {
          q: "Zašto se cijene whey proteina toliko razlikuju?",
          a: "Razlike dolaze od tipa proteina (koncentrat, izolat, hidrolizat), veličine pakiranja, brenda i marže pojedinih trgovina. Whey koncentrat je tipično najjeftiniji, a hidrolizat najskuplji. Na Proteinoteci možeš usporediti cijenu po gramu proteina — što je precizniji pokazatelj vrijednosti od ukupne cijene.",
        },
        {
          q: "Koji whey protein je najpovoljniji u Hrvatskoj?",
          a: "To se mijenja tjedno ovisno o akcijama i dostupnosti. Na Proteinoteci automatski pratimo cijene i uvijek prikazujemo trenutno najisplativije opcije. Filtriraj po kategoriji i sortiraj po cijeni ili value scoreu da pronađeš ono što tražiš.",
        },
        {
          q: "Koliko grama proteina treba biti u dobrom whey proteinu?",
          a: "Kvalitetan whey koncentrat ima 70–80g proteina na 100g proizvoda. Izolat tipično ima 85–95g. Što je veći postotak proteina, manji je udio masti, laktoze i šećera. Na svakom proizvodu na Proteinoteci možeš vidjeti točan sadržaj proteina na 100g.",
        },
        {
          q: "Je li bolje kupiti whey protein online ili u dućanu?",
          a: "Online kupnja je tipično jeftinija zahvaljujući nižim troškovima poslovanja i češćim akcijama. Na Proteinoteci pratimo cijene online trgovina i direktno te šaljemo na stranicu s najboljom ponudom — bez naplate.",
        },
      ]}
    />
  );
}
