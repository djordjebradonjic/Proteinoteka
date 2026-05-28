import { Metadata } from "next";
import { fetchBrandProducts } from "@/lib/seo-data";
import { SEOBrandPage } from "@/components/seo/SEOBrandPage";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Optimum Nutrition proteini u Srbiji — cene i poređenje 2026 | Proteinoteka",
  description:
    "Aktuelne cene Optimum Nutrition proteina u srpskim prodavnicama. Gold Standard, Serious Mass, Platinum Hydrowhey — poredimo cene i value score iz svih prodavnica.",
  alternates: { canonical: "https://proteinoteka.rs/optimum-nutrition-proteini" },
  openGraph: {
    title: "Optimum Nutrition proteini u Srbiji 2026 | Proteinoteka",
    description:
      "Poređenje cena Optimum Nutrition proizvoda u srpskim prodavnicama. Gold Standard whey — gde je najjeftiniji u Srbiji?",
    url: "https://proteinoteka.rs/optimum-nutrition-proteini",
    siteName: "Proteinoteka",
    locale: "sr_RS",
    type: "website",
  },
};

export default async function Page() {
  const products = await fetchBrandProducts({ brand: "Optimum Nutrition", limit: 50 });

  return (
    <SEOBrandPage
      h1="Optimum Nutrition proteini u Srbiji"
      brandName="Optimum Nutrition"
      brandApiName="Optimum Nutrition"
      intro={`Optimum Nutrition (ON) je jedan od najpoznatijih brendova proteinskih suplemenata na svetu. Njihov Gold Standard 100% Whey već decenijama drži poziciju najprodavanijeg whey proteina globalno. Na Proteinoteci pratimo cene svih Optimum Nutrition proizvoda u srpskim prodavnicama i poredimo ih u realnom vremenu — da ne moraš sam da obilaziš sajtove.${products.length > 0 ? ` Trenutno pratimo ${products.length} ON proizvoda iz srpskog tržišta.` : ""}`}
      products={products}
      currentSlug="optimum-nutrition-proteini"
      faqs={[
        {
          q: "Koji Optimum Nutrition protein je best value za novac u Srbiji?",
          a: "Gold Standard 100% Whey je obično best value opcija iz ON asortimana — visok sadržaj proteina (oko 24g na porciju), provereni kvalitet i dostupnost u više prodavnica što znači konkurentne cene. Value score za svaki ON proizvod možeš videti u listi iznad.",
        },
        {
          q: "Gde je Gold Standard whey najjeftiniji u Srbiji?",
          a: "Cene Gold Standard whey-a variraju između srpskih prodavnica i mogu se razlikovati i 15–25%. U tabeli 'Gde kupiti' iznad prikazujemo najnižu trenutnu cenu u svakoj prodavnici. Aktiviraj price alert za omiljeni ON proizvod i dobij email čim cena padne.",
        },
        {
          q: "Da li je Optimum Nutrition originalan u srpskim prodavnicama?",
          a: "Srpske prodavnice koje pratimo nabavljaju ON proizvode od ovlašćenih distributera. Za proveru originalnosti preporučujemo QR/scratch kod koji ON stavlja na svako pakovanje — skeniranjem na sajtu brenda možeš potvrditi autentičnost. Proteinoteka ne može garantovati autentičnost, samo pratimo cene.",
        },
        {
          q: "Koja je razlika između Gold Standard Whey i Platinum Hydrowhey?",
          a: "Gold Standard 100% Whey je isolate-dominant blend (whey isolate kao primarna sirovina, uz whey concentrate i whey peptide) sa oko 24g proteina po porciji. Platinum Hydrowhey je potpuno hidrolizovani isolate sa bržom apsorpcijom i višim procentom proteina, ali i znatno višom cenom. Za rekreativce i većinu sportista, Gold Standard je dovoljan.",
        },
        {
          q: "Da li Optimum Nutrition ima proteina za vegane?",
          a: "ON standardno ne nudi biljne proteine u istoj meri kao neke druge kompanije. Njihov asortiman je pretežno whey-baziran. Ako tražiš veganski protein, pogledaj kategoriju biljnih proteina na Proteinoteci gde poredimo sve dostupne opcije u Srbiji.",
        },
        {
          q: "Kako da pratim cene Optimum Nutrition proizvoda u Srbiji?",
          a: "Na Proteinoteci možeš aktivirati price alert za bilo koji ON proizvod — bez registracije, samo uneseš email i ciljnu cenu. Kad cena padne ispod željene vrednosti, dobiješ email notifikaciju.",
        },
      ]}
    />
  );
}
