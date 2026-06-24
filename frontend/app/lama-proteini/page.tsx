import { Metadata } from "next";
import { fetchStoreProducts } from "@/lib/seo-data";
import { SEOStorePage } from "@/components/seo/SEOStorePage";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: "Lama proteini — cene i poređenje | Proteinoteka" },
  description:
    "Lama proteini u Srbiji — Nutriversum, Kevin Levrone, OstroVit, 5 Stars. Poredi Lama cene sa GymBeam-om i MyProtein-om po value score. Sve na jednom mestu.",
  alternates: { canonical: "https://proteinoteka.rs/lama-proteini" },
  openGraph: {
    title: "Lama proteini — cene i poređenje | Proteinoteka",
    description: "Aktuelne cene Lama proteina. Nutritivne vrednosti, value score i direktno poređenje sa konkurencijom.",
    url: "https://proteinoteka.rs/lama-proteini",
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
  const products = await fetchStoreProducts({ storeName: "Lama", limit: 200 });

  return (
    <SEOStorePage
      h1="Lama proteini — sve cene"
      storeName="Lama"
      intro="Lama je srpska online prodavnica suplemenata koja u svom asortimanu nosi brendove kao što su Nutriversum, Kevin Levrone, OstroVit, QNT i 5 Stars. Pratimo aktuelne Lama cene proteina i poredimo ih sa GymBeam-om, MyProtein-om i svim ostalim prodavnicama u Srbiji — bez lutanja po sajtovima. Pregled ispod prikazuje sve Lama proteine sortirane po value score, što ti odmah govori koji proizvod nudi najviše proteina po potrošenom dinaru."
      products={products}
      currentSlug="lama-proteini"
      faqs={[
        {
          q: "Koji Lama proteini imaju najviše proteina na 100g?",
          a: "Među Lama proizvodima, 5 Stars 100% Whey Isolate ima 86g proteina na 100g i to je trenutno najviše u ponudi. Kevin Levrone GOLD Whey i Bad Ass Whey su na 83g, dok Nutriversum Whey Pro i Casein Pro imaju 75–77g na 100g.",
        },
        {
          q: "Koji Nutriversum proteini se mogu kupiti u Lama prodavnici?",
          a: "Lama nosi širok izbor Nutriversum proteina: Whey Pro (700g, 1kg i 2kg pakovanje), Casein Pro, ISO Pro, Egg Pro, Vegan Pro i Protein Shake for Women WShape. Sve cene i nutritivne vrednosti su prikazane u tabeli ispod.",
        },
        {
          q: "Da li Lama ima Kevin Levrone proteine?",
          a: "Da, Lama nosi dva Kevin Levrone proteina — GOLD Whey (2kg, 83.3g proteina/100g) i Bad Ass Whey (2kg, 74g proteina/100g). Oba su whey koncentrati i mogu se direktno porediti sa sličnim proizvodima iz GymBeam-a i MyProtein-a na Proteinoteci.",
        },
        {
          q: "Kako se Lama cene porede sa GymBeam-om i MyProtein-om?",
          a: "Proteinoteka automatski prikuplja cene iz svih prodavnica i računa value score — meru koliko grama proteina dobijaš po jednom dinaru. Na glavnoj stranici možeš filtrirati po brendu i odmah videti koja prodavnica ima povoljniju cenu za isti ili sličan proizvod.",
        },
        {
          q: "Da li Lama dostavlja na celoj teritoriji Srbije?",
          a: "Lama dostavlja širom Srbije kurirskim servisima. Za tačne informacije o rokovima dostave i troškovima preporučujemo proveru na zvaničnom sajtu lama.rs, jer se uslovi mogu periodično menjati.",
        },
        {
          q: "Da li Lama ima veganske proteine?",
          a: "Da, Lama nosi Nutriversum Vegan Pro (protein pirinča i graška, 73g proteina/100g) i OstroVit Pea Protein Isolate (protein graška, 25.5g/100g). Za pun pregled biljnih proteina u svim prodavnicama poseti stranicu biljnog proteina na Proteinoteci.",
        },
        {
          q: "Kako aktivirati price alert za Lama proteine?",
          a: "Na Proteinoteci možeš aktivirati obaveštenje o padu cene za bilo koji Lama protein — bez registracije. Otvori stranicu željenog proizvoda, unesi email i ciljnu cenu i dobiješ automatski email čim Lama snizi cenu. Praktično za pratiti Nutriversum i Kevin Levrone akcije.",
        },
      ]}
    />
  );
}
