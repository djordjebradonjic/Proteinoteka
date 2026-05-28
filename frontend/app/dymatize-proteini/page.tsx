import { Metadata } from "next";
import { fetchBrandProducts } from "@/lib/seo-data";
import { SEOBrandPage } from "@/components/seo/SEOBrandPage";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Dymatize proteini u Srbiji — cene i poređenje 2026 | Proteinoteka",
  description:
    "Aktuelne cene Dymatize proteina u srpskim prodavnicama. ISO100 hidrolizat, Elite Whey — poredimo cene i value score iz svih prodavnica. Gde je Dymatize najjeftiniji?",
  alternates: { canonical: "https://proteinoteka.rs/dymatize-proteini" },
  openGraph: {
    title: "Dymatize proteini u Srbiji 2026 | Proteinoteka",
    description:
      "Poređenje cena Dymatize proizvoda u srpskim prodavnicama. ISO100 hidrolizat — gde je najjeftiniji u Srbiji?",
    url: "https://proteinoteka.rs/dymatize-proteini",
    siteName: "Proteinoteka",
    locale: "sr_RS",
    type: "website",
  },
};

export default async function Page() {
  const products = await fetchBrandProducts({ brand: "Dymatize Nutrition", limit: 50 });

  return (
    <SEOBrandPage
      h1="Dymatize proteini u Srbiji"
      brandName="Dymatize"
      brandApiName="Dymatize"
      intro={`Dymatize je američki brend poznat po ISO100 — jednom od najpopularnijih hidrolizovanih whey proteina na tržištu. ISO100 se odlikuje visokim sadržajem proteina (25g po porciji), minimalnim ugljenim hidratima i mastima, i bržom apsorpcijom zahvaljujući hidrolizi. Na Proteinoteci pratimo sve Dymatize cene u srpskim prodavnicama.${products.length > 0 ? ` Trenutno pratimo ${products.length} Dymatize proizvoda u Srbiji.` : ""}`}
      products={products}
      currentSlug="dymatize-proteini"
      faqs={[
        {
          q: "Šta je Dymatize ISO100 i zašto je popularan?",
          a: "ISO100 je hidrolizovani whey protein isolate sa 25g proteina po porciji, manje od 1g ugljenih hidrata i manje od 0.5g masti. Hidroliza znači da su proteinski lanci već razloženi na manje peptide što ubrzava apsorpciju. Popularan je kod sportista koji žele čist protein bez 'balasta', posebno u periodu mršavljenja ili definicije.",
        },
        {
          q: "Koja je razlika između Dymatize ISO100 i Elite Whey?",
          a: "ISO100 je hidrolizovani isolate — čistiji, brži i skuplji. Elite Whey je whey concentrate/isolate blend — nešto viši sadržaj ugljenih hidrata i masti, ali znatno niža cena. Za rekreativce je Elite Whey uglavnom dovoljan; ISO100 je opravdan kod onih sa intolerancijom na laktozu ili koji žele maksimalnu čistoću.",
        },
        {
          q: "Gde je Dymatize ISO100 najjeftiniji u Srbiji?",
          a: "Cene ISO100 variraju između srpskih prodavnica. U tabeli 'Gde kupiti' iznad prikazujemo najnižu trenutnu cenu po prodavnici. ISO100 spada u premium segment — za 600–900g pakovanje očekuj cene između 5.000 i 9.000 RSD.",
        },
        {
          q: "Da li je Dymatize dostupan u svim srpskim prodavnicama suplemenata?",
          a: "Dymatize je dostupan u odabranim prodavnicama u Srbiji, mada ne u svim — manje je rasprostranjen od brendova kao što su Scitec ili Optimum Nutrition. U tabeli iznad su prikazane sve prodavnice u kojima smo pronašli Dymatize proizvode.",
        },
        {
          q: "Koliko košta Dymatize ISO100 u Srbiji?",
          a: "Aktuelne cene ISO100 u Srbiji kreću se od oko 5.000 do 9.000+ RSD za standardna pakovanja, zavisno od veličine pakovanja i prodavnice. Veća pakovanja (900g+) su isplativija po gramu proteina. Aktuelne cene su prikazane u tabeli iznad.",
        },
        {
          q: "Da li Dymatize ima sertifikate kvaliteta?",
          a: "Dymatize u inostranstvu ističe NSF Certified for Sport sertifikat za ISO100, što znači da je testiran od strane nezavisne laboratorije na zabranjene supstance. Za kupovinu u Srbiji preporučujemo kupovinu iz ovlašćenih prodavnica. Proteinoteka prati samo cene i ne može garantovati autentičnost.",
        },
      ]}
    />
  );
}
