import { Metadata } from "next";
import { fetchProductsByQuery } from "@/lib/seo-data";
import { SEOBrandPage } from "@/components/seo/SEOBrandPage";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: "Gold Standard Whey Cena u Srbiji 2026 | Proteinoteka" },
  description:
    "Koliko košta Gold Standard 100% Whey u Srbiji? Poredimo cene svih pakovanja (450g, 900g, 2.27kg, 4.5kg) iz svih prodavnica i pomažemo ti da nađeš najjeftiniju opciju.",
  alternates: { canonical: "https://proteinoteka.rs/gold-standard-whey-cena" },
  openGraph: {
    title: "Gold Standard Whey Cena u Srbiji 2026 | Proteinoteka",
    description:
      "Aktuelne cene Optimum Nutrition Gold Standard 100% Whey u srpskim prodavnicama — uporedi sva pakovanja i ukuse na jednom mestu.",
    url: "https://proteinoteka.rs/gold-standard-whey-cena",
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
  const products = await fetchProductsByQuery({ name: "gold standard", brand: "Optimum Nutrition", limit: 30 });

  return (
    <SEOBrandPage
      h1="Gold Standard 100% Whey – Cena u Srbiji"
      brandName="Gold Standard 100% Whey"
      brandApiName="Optimum Nutrition"
      intro={`Optimum Nutrition Gold Standard 100% Whey je najprodavaniji whey protein u svetu — i jedan od najtraženijih u Srbiji. Na Proteinoteci pratimo cene Gold Standard-a kroz sva pakovanja (450g, 900g, 2.27kg, 4.5kg) i sve ukuse, u svim domaćim prodavnicama, i ažuriramo ih redovno.${products.length > 0 ? ` Trenutno pratimo ${products.length} ponuda Gold Standard-a na srpskom tržištu.` : ""}`}
      products={products}
      currentSlug="gold-standard-whey-cena"
      faqs={[
        {
          q: "Koliko košta Gold Standard whey protein u Srbiji?",
          a: "Cena zavisi od pakovanja i ukusa — manje pakovanje (450g) obično košta od oko 3.500 RSD, dok veliko pakovanje (2.27kg) ide od oko 9.000 RSD pa naviše, u zavisnosti od prodavnice i trenutnih akcija. Tačne cene za svako pakovanje vidiš u tabeli iznad.",
        },
        {
          q: "Gde je Gold Standard whey najjeftiniji u Srbiji?",
          a: "Cena Gold Standard-a varira između prodavnica i može se razlikovati i 15–25% za isto pakovanje. U sekciji 'Gde kupiti' iznad prikazujemo najnižu trenutnu cenu po prodavnici, a u tabeli ispod možeš sortirati sve dostupne ponude. Aktiviraj price alert da te obavestimo kad cena padne.",
        },
        {
          q: "Koje pakovanje Gold Standard whey-a se najviše isplati?",
          a: "Veća pakovanja (2.27kg i 4.5kg) po pravilu imaju nižu cenu po kilogramu proteina, pa su isplativija za dugoročnu upotrebu. Manja pakovanja (450g, 900g) su pogodnija ako prvi put probaš ukus ili ti je bitna prenosivost. Value score u tabeli pomaže da brzo upoređuješ vrednost za novac.",
        },
        {
          q: "Da li je Gold Standard 100% Whey isolate ili concentrate?",
          a: "Gold Standard 100% Whey je blend kod kojeg je whey isolate primarna sirovina, uz dodatak whey concentrate-a i whey peptida. Sadrži oko 24g proteina po porciji od ~30g. Nije čisti isolate, ali ima visok udeo proteina i nisku količinu masti i ugljenih hidrata u poređenju sa standardnim concentrate proizvodima.",
        },
        {
          q: "Da li je Gold Standard whey originalan u srpskim prodavnicama?",
          a: "Prodavnice koje pratimo nabavljaju Optimum Nutrition proizvode od ovlašćenih distributera. Za proveru originalnosti, Optimum Nutrition stavlja scratch/QR kod na svako pakovanje koji možeš provideriti na sajtu brenda. Proteinoteka prati samo cene i ne može garantovati autentičnost svakog pojedinačnog pakovanja.",
        },
        {
          q: "Kako da pratim cenu Gold Standard whey-a i dobijem obaveštenje kad padne?",
          a: "Na Proteinoteci možeš aktivirati besplatan price alert za bilo koju Gold Standard varijantu — bez registracije, samo uneseš email i ciljnu cenu. Kad cena u nekoj od prodavnica padne ispod te vrednosti, dobijaš email obaveštenje.",
        },
      ]}
    />
  );
}
