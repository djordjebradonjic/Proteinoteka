import { Metadata } from "next";
import { fetchTopProducts } from "@/lib/seo-data";
import { SEOLandingPage } from "@/components/seo/SEOLandingPage";
import { WeightRangeTabs } from "@/components/seo/WeightRangeTabs";
import { WeightRangeInsights } from "@/components/seo/WeightRangeInsights";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: "Najjeftiniji Whey Protein 5kg+ u Srbiji | Proteinoteka" },
  description:
    "Najjeftinije pakovanje whey proteina od 4.5kg naviše u Srbiji. Maksimalna ušteda po gramu proteina — aktuelne cene iz svih prodavnica, ažurirano nedeljno.",
  alternates: { canonical: "https://proteinoteka.rs/najjeftiniji-whey-protein-4500g-plus" },
  openGraph: {
    title: "Najjeftiniji Whey Protein 5kg+ u Srbiji | Proteinoteka",
    description: "Aktuelne cene whey proteina 4.5kg+ iz svih srpskih prodavnica. Sortirano od najjeftinije.",
    url: "https://proteinoteka.rs/najjeftiniji-whey-protein-4500g-plus",
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
    limit: 500,
  });
  const products = raw.filter(
    p => p.primaryWeightGrams != null && p.primaryWeightGrams >= 4500
  );

  const top = products[0];
  const bestValue = products.length > 0
    ? [...products].sort((a, b) => (b.valueScore ?? 0) - (a.valueScore ?? 0))[0]
    : null;

  const quickAnswer = top
    ? `Najjeftiniji whey concentrate u velikom pakovanju (4.5kg+) trenutno je ${top.name} za ${top.price} (${top.storeName}). Ako tražiš i dobar kvalitet, ${bestValue?.name ?? top.name} nudi value score ${bestValue?.valueScore?.toFixed(1) ?? "N/A"}/10.`
    : "Trenutno nema dostupnih whey proteina u pakovanju 4.5kg+. Pogledaj opsege ispod.";

  return (
    <SEOLandingPage
      h1="Najjeftiniji Whey Protein 5kg+ u Srbiji"
      intro="Velika pakovanja od 4.5 kilograma i više — maksimalna ušteda po gramu proteina za ozbiljne korisnike. Pratimo cene iz svih srpskih prodavnica i prikazujemo ih sortirano od najjeftinije."
      quickAnswer={quickAnswer}
      products={products}
      listHeading="Whey proteini 4.5kg+ sortirani od najjeftinije cene"
      tableCaption="Najjeftiniji whey proteini 5kg+ u Srbiji — aktuelne cene"
      currentSlug="najjeftiniji-whey-protein-4500g-plus"
      headerSection={<WeightRangeTabs currentSlug="najjeftiniji-whey-protein-4500g-plus" />}
      middleSection={<WeightRangeInsights products={products} />}
      faqs={[
        {
          q: "Koliko dugo traje 5kg pakovanje whey proteina?",
          a: "Uz jednu porciju od 30g dnevno, 5kg pakovanje traje oko 166 dana — skoro 6 meseci. Uz dve porcije, oko tri meseca. Idealno za korisnike koji ne žele da razmišljaju o narudžbini mesecima.",
        },
        {
          q: "Da li postoji rizik pri kupovini velikog paketa?",
          a: "Glavni rizik je da ti se ukus dosadi ili da otkažeš trening plan. Zato preporučujemo da pre kupovine velikog paketa proveris ukus u manjem pakovanju, ili biraš čokoladu/vanilu — klasike koje retko postanu zamorne.",
        },
        {
          q: "Da li 5kg+ pakovanja dolaze sa dodatnom opremom poput merice ili šejkera?",
          a: "Zavisi od brenda i prodavnice — neki proizvođači dodaju mericu u svako pakovanje bez obzira na veličinu, drugi je izostavljaju kod velikih formata pošto se prodaju kao dopuna postojećoj zalihi. Proveri opis proizvoda ili pitaj prodavnicu pre poručivanja ako ti je merica bitna.",
        },
        {
          q: "Kome se najviše isplati kupovina 5kg+ pakovanja?",
          a: "Sportistima i rekreativcima koji redovno treniraju, već znaju koji im ukus i brend odgovara, i žele najnižu moguću cenu po gramu proteina uz najređe moguće narudžbine. Ako tek počinješ ili menjaš brend, manje pakovanje je bezbednija prva kupovina.",
        },
      ]}
    />
  );
}
