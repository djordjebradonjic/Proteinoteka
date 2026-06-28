import { Metadata } from "next";
import { fetchTopProducts } from "@/lib/seo-data";
import { SEOLandingPage } from "@/components/seo/SEOLandingPage";
import { WeightRangeTabs } from "@/components/seo/WeightRangeTabs";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: "Najjeftiniji Whey Protein 500g–1.5kg u Srbiji | Proteinoteka" },
  description:
    "Najjeftinije pakovanje whey proteina od 500g do 1.5kg u Srbiji. Poredimo cene iz svih prodavnica i prikazujemo cenu po gramu proteina — ažurirano nedeljno.",
  alternates: { canonical: "https://proteinoteka.rs/najjeftiniji-whey-protein" },
  openGraph: {
    title: "Najjeftiniji Whey Protein 500g–1.5kg u Srbiji | Proteinoteka",
    description: "Aktuelne cene whey proteina u pakovanju 500g–1.5kg iz svih srpskih prodavnica. Sortirano od najjeftinije.",
    url: "https://proteinoteka.rs/najjeftiniji-whey-protein",
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
  const raw = await fetchTopProducts({
    category: "whey_concentrate",
    sortBy: "price",
    limit: 200,
  });
  const products = raw.filter(
    p => p.primaryWeightGrams != null && p.primaryWeightGrams >= 500 && p.primaryWeightGrams < 1500
  );

  const top = products[0];
  const bestValue = products.length > 0
    ? [...products].sort((a, b) => (b.valueScore ?? 0) - (a.valueScore ?? 0))[0]
    : null;

  const quickAnswer = top
    ? `Najjeftiniji whey concentrate u pakovanju 500g–1.5kg trenutno je ${top.name} za ${top.price} (${top.storeName}). Ako tražiš jeftino ali i kvalitetno, ${bestValue?.name ?? top.name} nudi najbolji odnos cene i kvaliteta sa value score ${bestValue?.valueScore?.toFixed(1) ?? "N/A"}/10.`
    : "";

  return (
    <SEOLandingPage
      h1="Najjeftiniji Whey Protein u Srbiji"
      intro="Svakodnevno pratimo cene whey proteina iz svih srpskih prodavnica. Odaberi veličinu pakovanja koja te zanima — lista je sortirana od najniže cene po pakovanju."
      quickAnswer={quickAnswer}
      products={products}
      listHeading="Whey proteini 500g–1.5kg sortirani od najjeftinije cene"
      tableCaption="Najjeftiniji whey proteini 500g–1.5kg u Srbiji — aktuelne cene"
      currentSlug="najjeftiniji-whey-protein"
      headerSection={<WeightRangeTabs currentSlug="najjeftiniji-whey-protein" />}
      faqs={[
        {
          q: "Koliko otprilike košta whey protein u Srbiji?",
          a: "Cene jako variraju u zavisnosti od tipa i pakovanja. Whey koncentrat u pakovanju od 1 kg može se naći od oko 2.500 do 5.000 dinara. Izolat je skuplje — tipično 4.000–8.000 dinara za kilogram. Realniji pokazatelj od ukupne cene je cena po gramu proteina, koju možeš videti na svakom proizvodu na Proteinoteci.",
        },
        {
          q: "Da li su jeftini proteini lošijeg kvaliteta?",
          a: "Ne mora biti. Jeftiniji proteini su obično whey koncentrati sa 70–80% proteina na 100g, što je sasvim dovoljno za većinu korisnika. Ono na šta treba obratiti pažnju su sadržaj šećera, lista sastojaka i veličina pakovanja. Na ovoj listi svaki protein ima prikazane nutritivne vrednosti — ne moraš da veruješ na reč.",
        },
        {
          q: "Koji tip whey proteina je najjeftiniji?",
          a: "Whey koncentrat je konzistentno najjeftiniji tip. Sadrži 70–80% proteina i nešto više masti i laktoze od izolata, ali za fazu mase ili rekreativnu upotrebu to nije nedostatak. Hidrolizat i izolat su skuplji jer zahtevaju dodatnu obradu.",
        },
        {
          q: "Da li je bitno koji brend kupujem ili samo cena i proteini?",
          a: "Brend nije presudan, ali nije ni nevažan. Poznati brendovi imaju konzistentniji kvalitet i bolju kontrolu proizvodnje. Na Proteinoteci računamo reputaciju brenda kao jedan od faktora value score-a, ali ga ne tretiramo kao dominantan — 70% ocene dolazi od cene, proteina i nutritivnog profila.",
        },
      ]}
    />
  );
}
