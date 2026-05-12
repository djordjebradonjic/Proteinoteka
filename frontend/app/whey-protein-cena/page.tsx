import { Metadata } from "next";
import { fetchTopProducts } from "@/lib/seo-data";
import { SEOLandingPage } from "@/components/seo/SEOLandingPage";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Whey Protein Cena u Srbiji — Pregled i Poređenje | Proteinoteka",
  description:
    "Pregled aktuelnih cena whey proteina u Srbiji. Poredimo cene koncentrata, izolata i hidrolizata iz svih prodavnica. Saznaj koja je realna cena za gram proteina.",
  alternates: { canonical: "https://proteinoteka.rs/whey-protein-cena" },
  openGraph: {
    title: "Whey Protein Cena u Srbiji | Proteinoteka",
    description: "Aktuelni pregled cena whey proteina u Srbiji po prodavnicama i tipovima.",
    url: "https://proteinoteka.rs/whey-protein-cena",
    siteName: "Proteinoteka",
    locale: "sr_RS",
    type: "website",
  },
};

export default async function Page() {
  const products = await fetchTopProducts({ sortBy: "price", limit: 20 });

  const cheapest = products[0];
  const avgPrice = products.length > 0
    ? Math.round(products.reduce((s, p) => s + (p.numericPrice ?? 0), 0) / products.length)
    : null;

  const quickAnswer = cheapest
    ? `Aktuelne cene whey proteina u Srbiji kreću se od ${cheapest.price} (${cheapest.name}) pa naviše. Prosečna cena u trenutnoj bazi je oko ${avgPrice?.toLocaleString("sr-RS")} RSD. Cena sama po sebi ne govori sve — važniji podatak je koliko RSD plaćaš po gramu proteina.`
    : "";

  return (
    <SEOLandingPage
      h1="Whey Protein Cena u Srbiji"
      intro="Transparentan pregled svih cena whey proteina dostupnih na srpskom tržištu. Upoređujemo koncentrate, izolate i hidrolizate iz svih prodavnica i računamo realnu cenu po gramu proteina — jedini podatak koji zaista meri vrednost."
      quickAnswer={quickAnswer}
      products={products}
      listHeading="Whey proteini po ceni — od najjeftinije"
      tableCaption="Pregled cena whey proteina u Srbiji"
      currentSlug="whey-protein-cena"
      faqs={[
        {
          q: "Koliko košta gram proteina u proseku u Srbiji?",
          a: "Za whey koncentrat prosek je otprilike 3–6 dinara po gramu proteina, u zavisnosti od brenda i prodavnice. Za izolat se kreće od 5–10 dinara. Hidrolizat je obično najskuplji. Gledaj cenu po gramu proteina, ne ukupnu cenu pakovanja — tako jedino možeš stvarno porediti.",
        },
        {
          q: "Zašto se cene toliko razlikuju između prodavnica?",
          a: "Svaka prodavnica ima različite marže, troškove uvoza i promotivne politike. Isti protein može koštati i 20–30% više u jednoj prodavnici nego u drugoj. Zato ima smisla proveriti više mesta pre kupovine — što Proteinoteka radi automatski.",
        },
        {
          q: "Da li je izolat uvek skuplji od koncentrata?",
          a: "U pravilu jeste — proces dodatne filtracije koji daje višu čistoću proteina i manje laktoze košta više. Ali razlika nije uvek drastična. Ponekad akcijama ili u manjim pakovanjima možeš naći izolat po ceni sličnoj koncentratu. Lista na ovoj stranici prikazuje sve tipove zajedno, pa možeš direktno porediti.",
        },
        {
          q: "Na šta treba obratiti pažnju osim na cenu?",
          a: "Veličina pakovanja direktno utiče na cenu po gramu — veće pakovanje je obično isplativije, ako ga možeš potrošiti pre isteka roka. Pored cene, gledaj sadržaj proteina na 100g (što više, to bolje), šećere i masti. Na Proteinoteci su ti podaci prikazani uz svaki proizvod.",
        },
      ]}
    />
  );
}
