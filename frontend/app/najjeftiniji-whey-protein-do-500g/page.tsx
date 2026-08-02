import { notFound } from "next/navigation";
import { CURRENT_MARKET } from "@/lib/marketConfig";
import { Metadata } from "next";
import { fetchTopProducts } from "@/lib/seo-data";
import { SEOLandingPage } from "@/components/seo/SEOLandingPage";
import { WeightRangeTabs } from "@/components/seo/WeightRangeTabs";
import { WeightRangeInsights } from "@/components/seo/WeightRangeInsights";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: "Najjeftiniji Whey Protein do 500g u Srbiji | Proteinoteka" },
  description:
    "Najjeftinije pakovanje whey proteina do 500g u Srbiji. Idealno za probe i manje porudžbine — aktuelne cene iz svih prodavnica sortirane od najjeftinije.",
  alternates: { canonical: "https://proteinoteka.rs/najjeftiniji-whey-protein-do-500g" },
  openGraph: {
    title: "Najjeftiniji Whey Protein do 500g u Srbiji | Proteinoteka",
    description: "Aktuelne cene whey proteina do 500g pakovanja iz svih srpskih prodavnica. Sortirano od najjeftinije.",
    url: "https://proteinoteka.rs/najjeftiniji-whey-protein-do-500g",
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
  const raw = await fetchTopProducts({
    category: "whey_concentrate",
    sortBy: "price",
    limit: 500,
  });
  const products = raw.filter(
    p => p.primaryWeightGrams != null && p.primaryWeightGrams < 500
  );

  const top = products[0];
  const bestValue = products.length > 0
    ? [...products].sort((a, b) => (b.valueScore ?? 0) - (a.valueScore ?? 0))[0]
    : null;

  const quickAnswer = top
    ? `Najjeftiniji whey concentrate u pakovanju do 500g trenutno je ${top.name} za ${top.price} (${top.storeName}). Ako tražiš i dobar kvalitet, ${bestValue?.name ?? top.name} nudi value score ${bestValue?.valueScore?.toFixed(1) ?? "N/A"}/10.`
    : "Trenutno nema dostupnih whey proteina u pakovanju do 500g. Pogledaj veće opsege.";

  return (
    <SEOLandingPage
      h1="Najjeftiniji Whey Protein do 500g u Srbiji"
      intro="Mala pakovanja whey proteina — idealna za probe, kraće periode ili kada tek testiraš da li ti trening ritam uopšte zahteva redovnu suplementaciju. Cena po gramu proteina je ovde uvek viša nego kod većih pakovanja, ali to je cena koju plaćaš za fleksibilnost. Pratimo cene iz svih srpskih prodavnica i prikazujemo ih sortirano od najjeftinije."
      quickAnswer={quickAnswer}
      products={products}
      listHeading="Whey proteini do 500g sortirani od najjeftinije cene"
      tableCaption="Najjeftiniji whey proteini do 500g u Srbiji — aktuelne cene"
      currentSlug="najjeftiniji-whey-protein-do-500g"
      headerSection={<WeightRangeTabs currentSlug="najjeftiniji-whey-protein-do-500g" />}
      middleSection={<WeightRangeInsights products={products} />}
      faqs={[
        {
          q: "Da li se isplati kupiti protein u manjem pakovanju?",
          a: "Manja pakovanja imaju višu cenu po gramu proteina, ali su korisna ako tražiš novu aromu ili brend koji nisi probao. Ako ti odgovara ukus i proizvod, pređi na veće pakovanje radi uštede.",
        },
        {
          q: "Koji su najčešći razlozi za kupovinu paketa do 500g?",
          a: "Proba novog ukusa, kraći ciklus suplementacije, pokloni ili ograničen budžet na mesečnom nivou. Cena po gramu proteina je uvek viša nego kod 1kg+ paketa.",
        },
        {
          q: "Koliko dugo traje pakovanje whey proteina do 500g?",
          a: "Zavisi od tačne gramaže, ali tipično pakovanje od 400–500g traje 13–17 porcija uz standardnu dozu od 30g. Uz jednu porciju dnevno, to je oko dve do tri nedelje — dovoljno da testiraš ukus i podnošljivost pre nego što naručiš veće pakovanje.",
        },
        {
          q: "Da li manje pakovanje brže izgubi kvalitet nakon otvaranja?",
          a: "Ne značajno brže od velikog pakovanja — whey protein u prahu je relativno stabilan ako se čuva zatvoren, na suvom i van direktne sunčeve svetlosti. Prednost manjeg pakovanja je što ga potrošiš pre nego što to uopšte postane pitanje.",
        },
      ]}
    />
  );
}
