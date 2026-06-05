import { Metadata } from "next";
import { fetchTopProducts } from "@/lib/seo-data";
import { SEOLandingPage } from "@/components/seo/SEOLandingPage";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: "Biljni Protein u Srbiji 2026 — Veganski Proteini, Cene i Poređenje | Proteinoteka" },
  description:
    "Biljni i veganski proteini u Srbiji — cene od ~3.000 do ~7.000 RSD/kg. Grašak, soja, pirinač protein — poredimo sve opcije iz srpskih prodavnica.",
  alternates: { canonical: "https://proteinoteka.rs/biljni-protein-srbija" },
  openGraph: {
    title: "Biljni Protein u Srbiji 2026 | Proteinoteka",
    description:
      "Aktuelne cene biljnih proteina u srpskim prodavnicama. Veganski proteini od graška, soje i pirinča — koji je best value?",
    url: "https://proteinoteka.rs/biljni-protein-srbija",
    siteName: "Proteinoteka",
    locale: "sr_RS",
    type: "website",
  },
};

export default async function Page() {
  const products = await fetchTopProducts({ category: "vegan", sortBy: "valueScore", limit: 20 });

  const top = products[0];

  const quickAnswer = top
    ? `Biljni proteini su idealna opcija za vegane i sve koji žele da izbegnu mlečne derivate. Trenutno best value biljni protein u bazi je ${top.name}. Cene kreću se od ~3.000 do ~7.000 RSD/kg — moderan biljni protein sa grašak ili soja bazom pruža sličnu vrednost kao whey concentrate.`
    : "Biljni proteini su idealna opcija za vegane i sve koji žele da izbegnu mlečne derivate. Cene u Srbiji kreću se od ~3.000 do ~7.000 RSD/kg.";

  return (
    <SEOLandingPage
      h1="Biljni Protein u Srbiji 2026"
      intro="Biljni proteini su idealna opcija za vegane, vegetarijance i sve koji žele da izbegnu mlečne derivate. Najčešće baze su grašak, soja, pirinač i konoplja. Sa 65–80g proteina na 100g i sve boljim ukusom, moderan biljni protein ravnopravno se takmiči sa wheyem. Proteinoteka poredi sve dostupne biljne proteine u Srbiji."
      quickAnswer={quickAnswer}
      products={products}
      listHeading="Biljni proteini — sortirani po vrednosti za novac"
      tableCaption="Pregled cena biljnih proteina u Srbiji 2026"
      currentSlug="biljni-protein-srbija"
      faqs={[
        {
          q: "Da li biljni proteini imaju kompletan aminokiselinski profil?",
          a: "Soja protein ima kompletan profil svih esencijalnih aminokiselina, sličan whey-u. Grašak protein je bogat BCAA ali mu nedostaje metionin — kombinacija grašak+pirinač protein nadoknađuje ovaj nedostatak. Moderni blend-ovi biljnih proteina su upravo dizajnirani za kompletan profil. Uzimanjem nešto veće porcije kompenzuje se manji sadržaj pojedinih aminokiselina.",
        },
        {
          q: "Da li je biljni protein dovoljno dobar za izgradnju mišića?",
          a: "Da — istraživanja pokazuju da su efekti na hipertrofiju (rast mišića) slični kao kod whey proteina kada se unosi dovoljno leucina i ukupnih proteina. Ključ je konzistentnost i adekvatan ukupan dnevni unos. Biljni proteini zahtevaju blago veću porciju (5–10g) da bi se dostigao isti sadržaj leucina.",
        },
        {
          q: "Koji biljni protein ima najboji ukus u Srbiji?",
          a: "Ukus je subjektivan, ali moderni proteini od graška premium brendova (pea protein isolate) u čokoladnom ili vanila ukusu su značajno poboljšani u poslednjim godinama. Stariji ili jeftiniji biljni proteini imaju karakteristički 'zemljani' ukus. Preporučujemo čitanje recenzija pre kupovine, posebno za nove brendove.",
        },
        {
          q: "Koja je razlika između proteina od graška, soje i pirinča?",
          a: "Grašak protein: visok sadržaj BCAA, nije alergen za većinu, blagi ukus. Soja protein: kompletan aminokiselinski profil, potencijalni alergen, sadrži fitoestrogene što neke brine. Pirinač protein: hipoalergen, manji sadržaj proteina, uglavnom se kombinuje s graškom. Blendovi od više izvora nude najkompletniji aminokiselinski profil.",
        },
        {
          q: "Koliko košta biljni protein u Srbiji?",
          a: "Cene biljnih proteina u Srbiji kreću se od ~3.000 do ~7.000 RSD/kg, zavisno od brenda, baze i prodavnice. Proteini od graška su generalno jeftiniji od soja protein izolata. Uvek gledaj cenu po gramu proteina — veće pakovanje je obično isplativije po gramu.",
        },
        {
          q: "Mogu li osobe sa alergijom na gluten piti biljni protein?",
          a: "Većina proteina od graška, soje i pirinča je prirodno bez glutena. Međutim, ako imaš celijakiju ili ozbiljnu intoleranciju, pažljivo čitaj deklaraciju i traži oznaku 'certified gluten-free' — kontaminacija tokom proizvodnje je moguća u postrojenjima koji obrađuju više vrsta sirovina.",
        },
      ]}
    />
  );
}
