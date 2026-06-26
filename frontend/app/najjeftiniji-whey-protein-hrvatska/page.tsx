import { Metadata } from "next";
import { fetchTopProducts } from "@/lib/seo-data";
import { SEOLandingPage } from "@/components/seo/SEOLandingPage";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: "Najjeftiniji Whey Protein u Hrvatskoj 2026 | Proteinoteka" },
  description:
    "Automatski uspoređujemo cijene whey proteina iz hrvatskih trgovina. Vidi koji košta najmanje po gramu proteina — ažurirano tjedno, bez ručnog pretraživanja.",
  alternates: { canonical: "https://proteinoteka.com.hr/najjeftiniji-whey-protein-hrvatska" },
  openGraph: {
    title: "Najjeftiniji Whey Protein u Hrvatskoj | Proteinoteka",
    description: "Aktualne cijene whey proteina iz svih hrvatskih trgovina. Sortirano od najjeftinijeg.",
    url: "https://proteinoteka.com.hr/najjeftiniji-whey-protein-hrvatska",
    siteName: "Proteinoteka",
    locale: "hr_HR",
    type: "website",
    images: [{ url: "https://proteinoteka.com.hr/opengraph-image", width: 1200, height: 630, alt: "Proteinoteka" }],
  },
  twitter: {
    title: "Najjeftiniji Whey Protein u Hrvatskoj 2026 | Proteinoteka",
    description: "Usporedi cijene whey proteina iz svih hrvatskih trgovina. Sortirano od najjeftinije cijene.",
  },
};

export default async function Page() {
  const raw = await fetchTopProducts({
    category: "whey_concentrate",
    sortBy: "price",
    limit: 15,
  });
  const products = raw.filter(p => p.primaryWeightGrams != null && p.primaryWeightGrams >= 500);

  const top = products[0];
  const bestValue = products.length > 0
    ? [...products].sort((a, b) => (b.valueScore ?? 0) - (a.valueScore ?? 0))[0]
    : null;

  const quickAnswer = top
    ? `Najjeftiniji whey concentrate u Hrvatskoj trenutno je ${top.name} za ${top.price} (${top.storeName}). Ako tražiš jeftino ali i kvalitetno, ${bestValue?.name ?? top.name} nudi najbolji odnos cijene i kvalitete sa value score ${bestValue?.valueScore?.toFixed(1) ?? "N/A"}/10.`
    : "";

  return (
    <SEOLandingPage
      h1="Najjeftiniji Whey Protein u Hrvatskoj"
      intro="Svakodnevno pratimo cijene whey proteina iz svih hrvatskih trgovina. Ova lista sortirana je od najniže cijene — bez kompromisa na kvalitetu koji možeš pratiti kroz nutritivne vrijednosti svakog proizvoda."
      quickAnswer={quickAnswer}
      products={products}
      listHeading="Whey proteini sortirani od najjeftinije cijene"
      tableCaption="Najjeftiniji whey proteini u Hrvatskoj — aktualne cijene"
      currentSlug="najjeftiniji-whey-protein-hrvatska"
      faqs={[
        {
          q: "Koliko otprilike košta whey protein u Hrvatskoj?",
          a: "Cijene jako variraju ovisno o tipu i pakiranju. Whey koncentrat u pakiranju od 1 kg može se naći od oko 15 do 35 EUR. Izolat je skuplje — tipično 30–60 EUR za kilogram. Realniji pokazatelj od ukupne cijene je cijena po gramu proteina, koju možeš vidjeti na svakom proizvodu na Proteinoteci.",
        },
        {
          q: "Jesu li jeftini proteini lošije kvalitete?",
          a: "Ne mora biti. Jeftiniji proteini su obično whey koncentrati s 70–80% proteina na 100g, što je sasvim dovoljno za većinu korisnika. Na što treba obratiti pažnju su sadržaj šećera, popis sastojaka i veličina pakiranja. Na ovoj listi svaki protein ima prikazane nutritivne vrijednosti — ne moraš vjerovati na riječ.",
        },
        {
          q: "Koji tip whey proteina je najjeftiniji?",
          a: "Whey koncentrat je konzistentno najjeftiniji tip. Sadrži 70–80% proteina i nešto više masti i laktoze od izolata, ali za fazu mase ili rekreativnu upotrebu to nije nedostatak. Hidrolizat i izolat su skuplji jer zahtijevaju dodatnu obradu.",
        },
        {
          q: "Je li važno koji brend kupujem ili samo cijena i proteini?",
          a: "Brend nije presudan, ali nije ni nevažan. Poznati brendovi imaju konzistentniju kvalitetu i bolju kontrolu proizvodnje. Na Proteinoteci računamo reputaciju brenda kao jedan od faktora value scorea, ali ga ne tretiramo kao dominantan — 70% ocjene dolazi od cijene, proteina i nutritivnog profila.",
        },
      ]}
    />
  );
}
