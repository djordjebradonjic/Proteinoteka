import { notFound } from "next/navigation";
import { CURRENT_MARKET } from "@/lib/marketConfig";
import { Metadata } from "next";
import { fetchBrandProducts } from "@/lib/seo-data";
import { SEOBrandPage } from "@/components/seo/SEOBrandPage";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: "BioTech USA proteini u Srbiji — cene i poređenje 2026 | Proteinoteka" },
  description:
    "Aktuelne cene BioTech USA proteina u srpskim prodavnicama. ISO Whey Zero, 100% Whey Protein, Hydro Whey Zero — poredimo cene i value score iz svih prodavnica.",
  alternates: { canonical: "https://proteinoteka.rs/biotech-usa-proteini" },
  openGraph: {
    title: "BioTech USA proteini u Srbiji 2026 | Proteinoteka",
    description:
      "Poređenje cena BioTech USA proizvoda u srpskim prodavnicama. ISO Whey Zero, 100% Whey Protein — gde je BioTech USA najjeftiniji u Srbiji?",
    url: "https://proteinoteka.rs/biotech-usa-proteini",
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
  // Oba moguća normalizovana naziva iz baze (BioTech USA i Biotech alias)
  const [primary, alias] = await Promise.all([
    fetchBrandProducts({ brand: "BioTech USA", limit: 50 }),
    fetchBrandProducts({ brand: "Biotech",     limit: 50 }),
  ]);

  // Spajamo i deduplikujemo po ID-u
  const seen = new Set<number>();
  const products = [...primary, ...alias].filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });

  return (
    <SEOBrandPage
      h1="BioTech USA proteini u Srbiji"
      brandName="BioTech USA"
      brandApiName="BioTech USA"
      intro={`BioTech USA je mađarski brend osnovan 1990. godine u Budimpešti. Jedan je od najpopularnijih brendova proteinskih suplemenata u regionu zahvaljujući pristupačnim cenama, širokom asortimanu i dobrom odnosu cena/kvalitet. Najpoznatiji proizvodi su ISO Whey Zero (izolat bez laktoze i šećera) i 100% Whey Protein (concentrate/isolate blend). Na Proteinoteci pratimo sve BioTech USA cene u srpskim prodavnicama.${products.length > 0 ? ` Trenutno pratimo ${products.length} BioTech USA proizvoda u Srbiji.` : ""}`}
      products={products}
      currentSlug="biotech-usa-proteini"
      faqs={[
        {
          q: "Šta je BioTech USA i odakle dolazi?",
          a: "BioTech USA je mađarski brend prehrambenih suplemenata osnovan 1990. godine u Budimpešti. Jedan je od najvećih evropskih proizvođača suplemenata i izuzetno je popularan u Srbiji i regionu. Distribucija u Srbiji je široka — dostupan je u većini online prodavnica suplemenata.",
        },
        {
          q: "Koji je najpopularniji BioTech USA protein u Srbiji?",
          a: "ISO Whey Zero i 100% Whey Protein su najpopularniji BioTech USA proteini u Srbiji. ISO Whey Zero je whey protein izolat bez laktoze i šećera — oko 86g proteina na 100g. 100% Whey Protein je concentrate/isolate blend sa oko 78–80g proteina na 100g i boljim ukusom. Value score za svaki proizvod možeš videti u listi iznad.",
        },
        {
          q: "Da li je BioTech USA ISO Whey Zero dobar za osobe sa intolerancijom na laktozu?",
          a: "Da — ISO Whey Zero je formulisan kao protein bez laktoze i bez šećera. Baziran je na whey protein izolatu koji prirodno sadrži minimalne količine laktoze. Pogodan je za osobe sa umerenom intolerancijom na laktozu. Za tešku intoleranciju preporučujemo konsultaciju sa lekarom ili prelazak na biljni protein.",
        },
        {
          q: "Gde je BioTech USA najjeftiniji u Srbiji?",
          a: "Cene BioTech USA proteina variraju između srpskih prodavnica i mogu se razlikovati i 15–25% zavisno od prodavnice i trenutnih akcija. U tabeli 'Gde kupiti' iznad prikazujemo najnižu trenutnu cenu po prodavnici. Aktiviraj price alert za omiljeni BioTech USA proizvod i dobij email čim cena padne.",
        },
        {
          q: "Koja je razlika između BioTech USA 100% Whey Protein i ISO Whey Zero?",
          a: "100% Whey Protein je concentrate/isolate blend — nešto viši sadržaj ugljenih hidrata i masti, ali bolji ukus i niža cena. ISO Whey Zero je čisti whey izolat — viši procenat proteina (~86g/100g), bez laktoze, bez šećera, ali skuplje i ukus može biti intenzivniji. Za rekreativce 100% Whey Protein je obično dovoljan; ISO Whey Zero je opravdan za osobe sa intolerancijom ili one koji prate makroe.",
        },
        {
          q: "Kako da pratim cene BioTech USA proizvoda u Srbiji?",
          a: "Na Proteinoteci možeš aktivirati price alert za bilo koji BioTech USA proizvod — bez registracije, samo uneseš email i ciljnu cenu. Kada cena padne ispod željene vrednosti, dobiješ email notifikaciju.",
        },
      ]}
    />
  );
}
