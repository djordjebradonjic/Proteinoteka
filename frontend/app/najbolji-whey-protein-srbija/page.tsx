import { Metadata } from "next";
import { fetchTopProducts } from "@/lib/seo-data";
import { SEOLandingPage } from "@/components/seo/SEOLandingPage";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Najbolji Whey Protein u Srbiji | Proteinoteka",
  description:
    "Koji whey protein je trenutno najbolji u Srbiji? Poredimo value score, cenu i nutritivne vrednosti svih dostupnih proteina iz svih prodavnica.",
  alternates: { canonical: "https://proteinoteka.rs/najbolji-whey-protein-srbija" },
  openGraph: {
    title: "Najbolji Whey Protein u Srbiji | Proteinoteka",
    description: "Koji whey protein je trenutno najbolji u Srbiji? Poredimo value score, cenu i nutritivne vrednosti.",
    url: "https://proteinoteka.rs/najbolji-whey-protein-srbija",
    siteName: "Proteinoteka",
    locale: "sr_RS",
    type: "website",
  },
};

export default async function Page() {
  const products = await fetchTopProducts({ sortBy: "valueScore", limit: 15 });

  const top = products[0];
  const cheapest = products.length > 0
    ? [...products].sort((a, b) => (a.numericPrice ?? 0) - (b.numericPrice ?? 0))[0]
    : null;

  const quickAnswer = top
    ? `Trenutno, ${top.name} (${top.storeName}) ima najviši value score od ${top.valueScore?.toFixed(1)}/10 po ceni ${top.price} — što ga čini najboljim izborom za odnos cene i kvaliteta. Ako ti je budžet prioritet, ${cheapest?.name ?? top.name} je najjeftinija opcija za ${cheapest?.price ?? top.price}.`
    : "";

  return (
    <SEOLandingPage
      h1="Najbolji Whey Protein u Srbiji"
      intro="Analizirali smo svaki whey protein dostupan u srpskim prodavnicama. Poredimo cenu, sadržaj proteina, šećere, masti i ukupnu vrednost — i rangiramo koji nudi najviše za tvoj novac."
      quickAnswer={quickAnswer}
      products={products}
      listHeading="Top proteini po value score"
      tableCaption="Whey proteini u Srbiji — rang lista po value score"
      currentSlug="najbolji-whey-protein-srbija"
      faqs={[
        {
          q: "Šta tačno znači 'najbolji' whey protein?",
          a: "Zavisi od toga šta tražiš. Ako je cilj najveća vrednost za novac — gleda se koliko grama proteina dobijaš po dinaru, uz nutritivni profil (šećeri, masti, čistoća). Ako je cilj cena — biraš najjeftiniji u kilogramima. Na Proteinoteci rangiramo po value score koji kombinuje oba faktora, plus reputaciju brenda i tip proteina.",
        },
        {
          q: "Šta je Value Score i kako se računa?",
          a: "Value Score je ocena od 0 do 10 koju računamo za svaki protein. Uzima u obzir cenu po gramu proteina u poređenju sa prosekom kategorije (40% težine), čistoću proteina na 100g (20%), tip i svarljivost proteina (15%), sastojke poput šećera i aditiva (15%) i reputaciju brenda (10%). Ako nedostaje neki podatak, score se umanjuje.",
        },
        {
          q: "Da li skuplji protein automatski znači bolji?",
          a: "Ne. Cena je samo jedan od faktora. Mnogi skupi proteini imaju visok marketing budget, a ne nužno bolji sastav. Gledaj sadržaj proteina na 100g, šećere, masti i cenu po gramu proteina — to su brojevi koji ne lažu. Na Proteinoteci možeš sortirati po tim parametrima odvojeno.",
        },
        {
          q: "Koliko često se ažurira rang lista?",
          a: "Scraperи prolaze kroz sve prodavnice jednom nedeljno (ponedeljkom u 3 ujutro). Ako se cena promeni, value score se automatski preračunava. To znači da rang lista odražava stvarno stanje tržišta, ne zastarele podatke.",
        },
      ]}
    />
  );
}
