import { notFound } from "next/navigation";
import { CURRENT_MARKET } from "@/lib/marketConfig";
import { Metadata } from "next";
import { fetchStoreProducts, getSeoCopyStats } from "@/lib/seo-data";
import { SEOStorePage } from "@/components/seo/SEOStorePage";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: "MyProtein proteini u Srbiji — cene i poređenje 2026 | Proteinoteka" },
  description:
    "Aktuelne MyProtein cene proteina u Srbiji — Impact Whey, izolat, biljni proteini. Poredimo sa svim prodavnicama i računamo value score za svaki proizvod.",
  alternates: { canonical: "https://proteinoteka.rs/myprotein-proteini" },
  openGraph: {
    title: "MyProtein proteini u Srbiji 2026 | Proteinoteka",
    description:
      "Poređenje MyProtein cena proteina u Srbiji. Value score, nutritivne vrednosti i direktno poređenje sa svim prodavnicama.",
    url: "https://proteinoteka.rs/myprotein-proteini",
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
  const products = await fetchStoreProducts({ storeName: "MyProtein", limit: 200 });
  const stats = getSeoCopyStats(products);

  return (
    <SEOStorePage
      h1="MyProtein proteini u Srbiji — sve cene"
      storeName="MyProtein"
      intro={`Malo koji brend suplemenata ima toliko prepoznatljivo pakovanje kao MyProtein — britanski brend iz Češira, na tržištu od 2004, kog je 2011. za oko 58 miliona funti preuzeo THG (The Hut Group) i pretvorio ga u jednog od globalno najprodavanijih. U Srbiji je dostupan direktno preko sopstvene onlajn prodavnice, sa asortimanom koji ide od flagship Impact Whey linije (whey u desetinama ukusa i veličina, od probnih pakovanja do 5kg+ vreća) do biljnih i kazeinskih opcija.${stats ? ` Trenutno najbolji value score u ponudi ima ${stats.bestValue.name}, a cene se generalno kreću od ${stats.minPriceLabel} do ${stats.maxPriceLabel} — MyProtein ume da bude i najjeftinija i najskuplja opcija u kategoriji, zavisno od pakovanja.` : ""}${products.length > 0 ? ` Na Proteinoteci pratimo ${products.length} MyProtein proizvoda.` : ""} Tabela ispod je sortirana po value score-u.`}
      products={products}
      currentSlug="myprotein-proteini"
      faqs={[
        {
          q: "Šta je MyProtein Impact Whey i po čemu se razlikuje od ostalih linija?",
          a: "Impact Whey je osnovna, najprodavanija MyProtein linija — koncentrat i izolat varijante u desetinama ukusa. Nije najjeftiniji whey na tržištu, ali odnos cene i kvaliteta se znatno popravlja kad se kupuje u velikim (2,5kg+) pakovanjima, gde cena po kilogramu značajno pada.",
        },
        {
          q: "Koliko košta MyProtein protein u Srbiji?",
          a: stats
            ? `MyProtein cene u Srbiji trenutno se kreću od ${stats.minPriceLabel} (${stats.cheapest.name}) do ${stats.maxPriceLabel} (${stats.priciest.name}) — najskuplji proizvodi su po pravilu najveća pakovanja premium izolata, ne standardni Impact Whey. Aktuelne cene su u tabeli iznad, ažurirane dnevno.`
            : "Aktuelne cene za sva pakovanja prikazane su u tabeli iznad, ažurirane na dnevnom nivou.",
        },
        {
          q: "Ima li MyProtein kazein protein u Srbiji?",
          a: "Da — MyProtein prodaje i kazein sa sporim otpuštanjem, koji spada u skuplji segment ponude. Namenjen je pre svega noćnom oporavku, ne kao zamena za whey posle treninga.",
        },
        {
          q: "Koji MyProtein proteini imaju najbolji value score?",
          a: stats
            ? `Trenutno najbolji value score u MyProtein ponudi ima ${stats.bestValue.name} (${stats.bestValue.valueScore?.toFixed(1)}/10${stats.bestValue.proteinPer100g ? `, ${stats.bestValue.proteinPer100g}g proteina na 100g` : ""}) — vredi pogledati i van klasične whey ponude. Pun rang je u tabeli iznad.`
            : "Tabela iznad prikazuje pun rang svih MyProtein proizvoda po value score-u — objektivnoj meri koja uzima u obzir cenu i nutritivni profil.",
        },
        {
          q: "Da li je MyProtein samo dobar marketing ili stvarno vredi cene?",
          a: "THG je od malog biznisa koji je Oliver Kukson pokrenuo 2004. napravio globalni brend uglavnom kroz agresivan marketing i uticajne saradnje, što je istina. Ali proizvodi iza toga imaju konzistentne nutritivne specifikacije i dostupni su u toliko varijanti da skoro svako pronađe nešto u svom budžetu — marketing objašnjava prepoznatljivost, ne kvalitet.",
        },
        {
          q: "Kako se MyProtein cene porede sa ostalim prodavnicama u Srbiji?",
          a: "Proteinoteka svakodnevno prikuplja cene iz svih prodavnica. Na glavnoj stranici možeš filtrirati po brendu ili kategoriji i direktno videti kako se MyProtein cene porede sa GymBeam-om, Supplementshop-om, FitLab-om i ostalima.",
        },
      ]}
    />
  );
}
