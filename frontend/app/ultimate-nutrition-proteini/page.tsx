import { notFound } from "next/navigation";
import { CURRENT_MARKET } from "@/lib/marketConfig";
import { Metadata } from "next";
import { fetchBrandProducts, getSeoCopyStats } from "@/lib/seo-data";
import { SEOBrandPage } from "@/components/seo/SEOBrandPage";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: "Ultimate Nutrition proteini u Srbiji — cene 2026 | Proteinoteka" },
  description:
    "Aktuelne cene Ultimate Nutrition proteina u srpskim prodavnicama. Prostar Whey, Iso Sensation, IsoCool — poredimo cene i value score. Gde je najjeftiniji?",
  alternates: { canonical: "https://proteinoteka.rs/ultimate-nutrition-proteini" },
  openGraph: {
    title: "Ultimate Nutrition proteini u Srbiji 2026 | Proteinoteka",
    description:
      "Poređenje cena Ultimate Nutrition proizvoda u srpskim prodavnicama. Prostar Whey, Iso Sensation — gde su najjeftiniji u Srbiji?",
    url: "https://proteinoteka.rs/ultimate-nutrition-proteini",
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
  const products = await fetchBrandProducts({ brand: "Ultimate Nutrition", limit: 100 });
  const stats = getSeoCopyStats(products);

  return (
    <SEOBrandPage
      h1="Ultimate Nutrition proteini u Srbiji"
      brandName="Ultimate Nutrition"
      brandApiName="Ultimate Nutrition"
      intro={`Prostar je verovatno prva tegla whey proteina koju su mnogi iskusniji teretanci u Srbiji ikad kupili — Ultimate Nutrition je na tržištu od 1979, još kao brend bivšeg pauerliftera Viktora Rubina iz Konektikata, i danas ga i dalje vodi porodica Rubino. Pored Prostar-a, poznat je po premium izolatima Iso Sensation 93 i IsoCool.${products.length > 0 ? ` Na Proteinoteci pratimo ${products.length} Ultimate Nutrition proizvoda` : " Na Proteinoteci pratimo Ultimate Nutrition proizvode"}, dostupnih u više prodavnica (FitLab, Proteinbox, SupplementStore, XSport i drugi) — pa ima smisla porediti cene pre kupovine, jer za isti proizvod cena zna da se razlikuje i za nekoliko hiljada dinara od prodavnice do prodavnice.${stats ? ` Cene se kreću od ${stats.minPriceLabel} do ${stats.maxPriceLabel}.` : ""} Ispod je pun pregled sortiran po value score-u.`}
      products={products}
      currentSlug="ultimate-nutrition-proteini"
      faqs={[
        {
          q: "Šta je Prostar 100% Whey Protein?",
          a: "Prostar je flagship Ultimate Nutrition whey protein — mešavina koncentrata i izolata sa oko 80-83g proteina na 100g, na tržištu od sredine 1990-ih. Za rekreativce koji ne love apsolutno najčistiji izolat, Prostar je sasvim dovoljan i po pravilu jeftiniji izbor od premium linija.",
        },
        {
          q: "Koja je razlika između Iso Sensation, IsoCool i Prostar linije?",
          a: "Prostar je koncentrat/izolat blend za svakodnevnu upotrebu. Iso Sensation 93 i IsoCool su premium whey izolati sa 88-94g proteina na 100g, minimalnim mastima i ugljenim hidratima — skuplji, ali opravdani ako ti je bitna maksimalna čistoća ili teže podnosiš laktozu.",
        },
        {
          q: "Koliko košta Ultimate Nutrition protein u Srbiji?",
          a: stats
            ? `Cene se kreću od ${stats.minPriceLabel} (${stats.cheapest.name}) do ${stats.maxPriceLabel} (${stats.priciest.name}) — razlika u ceni uglavnom prati razliku između Prostar linije i premium izolata (Iso Sensation, IsoCool), ne toliko veličinu pakovanja. Tabela iznad je ažurirana dnevno.`
            : "Tabela iznad prikazuje aktuelnu cenu za svako pakovanje, ažuriranu na dnevnom nivou.",
        },
        {
          q: "Koji Ultimate Nutrition proizvod trenutno ima najbolji value score?",
          a: stats
            ? `Trenutno najbolji value score u ponudi ima ${stats.bestValue.name} (${stats.bestValue.valueScore?.toFixed(1)}/10${stats.bestValue.proteinPer100g ? `, ${stats.bestValue.proteinPer100g}g proteina/100g` : ""})${stats.secondBestValue ? `, praćen sa ${stats.secondBestValue.name} (${stats.secondBestValue.valueScore?.toFixed(1)})` : ""} — oba iz premium izolat segmenta, ne iz jeftinije Prostar linije. Pun rang je u tabeli iznad.`
            : "Tabela iznad prikazuje pun rang svih Ultimate Nutrition proizvoda po value score-u — objektivnoj meri koja uzima u obzir cenu i nutritivni profil.",
        },
        {
          q: "Otkud toliko dugo na tržištu — ko uopšte stoji iza Ultimate Nutrition-a?",
          a: "Ultimate Nutrition je jedan od najstarijih brendova sportske ishrane na svetu, osnovan 1979. u SAD od strane Viktora Rubina, bivšeg vrhunskog pauerliftera. I posle njegove smrti 2003. brend je ostao u vlasništvu porodice Rubino — što ga izdvaja od mnogih konkurenata koje su odavno preuzeli veliki fondovi.",
        },
        {
          q: "U kojim prodavnicama u Srbiji ima Ultimate Nutrition?",
          a: "Ultimate Nutrition je dostupan u više srpskih prodavnica — FitLab, Proteinbox, SupplementStore, XSport, Ogistrashop i Lama. Tabela iznad prikazuje trenutnu cenu svakog proizvoda po prodavnici, tako da nema potrebe da ih ručno obilaziš.",
        },
      ]}
    />
  );
}
