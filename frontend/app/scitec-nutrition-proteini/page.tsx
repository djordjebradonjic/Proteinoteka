import { Metadata } from "next";
import { fetchBrandProducts } from "@/lib/seo-data";
import { SEOBrandPage } from "@/components/seo/SEOBrandPage";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: "Scitec Nutrition proteini u Srbiji — cene i poređenje 2026 | Proteinoteka" },
  description:
    "Aktuelne cene Scitec Nutrition proteina u srpskim prodavnicama. 100% Whey Protein Professional, Jumbo — poredimo cene i value score iz svih prodavnica na jednom mestu.",
  alternates: { canonical: "https://proteinoteka.rs/scitec-nutrition-proteini" },
  openGraph: {
    title: "Scitec Nutrition proteini u Srbiji 2026 | Proteinoteka",
    description:
      "Poređenje cena Scitec Nutrition proizvoda u srpskim prodavnicama. Gde je Scitec najjeftiniji u Srbiji?",
    url: "https://proteinoteka.rs/scitec-nutrition-proteini",
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
  const products = await fetchBrandProducts({ brand: "Scitec Nutrition", limit: 50 });

  return (
    <SEOBrandPage
      h1="Scitec Nutrition proteini u Srbiji"
      brandName="Scitec Nutrition"
      brandApiName="Scitec Nutrition"
      intro={`Scitec Nutrition je mađarski brend osnovan 1996. koji je postao jedan od najpopularnijih u Balkanu i Istočnoj Evropi. Njihov 100% Whey Protein Professional je sinonim za dostupan kvalitet, dok Jumbo gainer pokriva segment za masu. Na Proteinoteci pratimo sve Scitec Nutrition cene u srpskim prodavnicama.${products.length > 0 ? ` Trenutno pratimo ${products.length} Scitec proizvoda u Srbiji.` : ""}`}
      products={products}
      currentSlug="scitec-nutrition-proteini"
      faqs={[
        {
          q: "Koji Scitec Nutrition protein je best value u Srbiji?",
          a: "100% Whey Protein Professional je najčešće best value opcija iz Scitec asortimana — solidnih 22g proteina po porciji, širok izbor ukusa i dostupnost u gotovo svim srpskim prodavnicama što drži cene konkurentnim. Value score za svaki Scitec proizvod prikazan je u listi iznad.",
        },
        {
          q: "Da li je Scitec Nutrition popularan u Srbiji?",
          a: "Da — Scitec Nutrition je jedan od najpopularnijih brendova u regionu Balkana, uključujući Srbiju. Dostupan je u većini prodavnica suplemenata i čest je izbor zbog balansa cene i kvaliteta. Blizina porekla (Mađarska) smanjuje troškove uvoza u poređenju sa American brendovima.",
        },
        {
          q: "Koja je razlika između 100% Whey Professional i Jumbo?",
          a: "100% Whey Professional je čist whey protein (concentrate + isolate blend) sa visokim procentom proteina i niskim kalorijama — odgovarajući za sve ciljeve. Jumbo je mass gainer sa visokim sadržajem ugljenih hidrata i kalorija, dizajniran za ubrzano dobijanje telesne mase. Biraju ga oni kojima je teško da unesu dovoljno kalorija kroz hranu.",
        },
        {
          q: "Gde je Scitec Nutrition najjeftiniji u Srbiji?",
          a: "Cene Scitec proizvoda se razlikuju između prodavnica. U tabeli 'Gde kupiti' iznad prikazujemo najnižu trenutnu cenu po prodavnici. Za praćenje cena bez ručnog poređenja, aktiviraj price alert na željenom proizvodu.",
        },
        {
          q: "Ima li Scitec Nutrition veganske proteine?",
          a: "Scitec Nutrition ima u ponudi neke biljne proteine, mada im je portfolio pretežno whey-baziran. Ako je vegan protein prioritet, u kategoriji biljnih proteina na Proteinoteci možeš naći sve dostupne opcije u Srbiji sa poređenjem cena.",
        },
        {
          q: "Koliko košta Scitec Nutrition u Srbiji?",
          a: "Cene Scitec Nutrition proteina u Srbiji kreću se od oko 3.000 do 8.000 RSD za standardna pakovanja od 900g do 2.35kg, zavisno od vrste i prodavnice. Aktuelne cene za svaki proizvod prikazane su u tabeli iznad.",
        },
      ]}
    />
  );
}
