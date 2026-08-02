import { Metadata } from "next";
import { fetchTopProducts } from "@/lib/seo-data";
import { SEOLandingPage } from "@/components/seo/SEOLandingPage";
import { WeightRangeTabs } from "@/components/seo/WeightRangeTabs";
import { WeightRangeInsights } from "@/components/seo/WeightRangeInsights";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: "Najjeftiniji Whey Protein 1.5kg–2.5kg Srbija | Proteinoteka" },
  description:
    "Najjeftinije pakovanje whey proteina od 1.5kg do 2.5kg u Srbiji. Aktuelne cene iz svih prodavnica sortirane od najjeftinije — ažurirano nedeljno.",
  alternates: { canonical: "https://proteinoteka.rs/najjeftiniji-whey-protein-1500g-2500g" },
  openGraph: {
    title: "Najjeftiniji Whey Protein 1.5kg–2.5kg u Srbiji | Proteinoteka",
    description: "Aktuelne cene whey proteina 1.5kg–2.5kg iz svih srpskih prodavnica. Sortirano od najjeftinije.",
    url: "https://proteinoteka.rs/najjeftiniji-whey-protein-1500g-2500g",
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
    p => p.primaryWeightGrams != null && p.primaryWeightGrams >= 1500 && p.primaryWeightGrams < 2500
  );

  const top = products[0];
  const bestValue = products.length > 0
    ? [...products].sort((a, b) => (b.valueScore ?? 0) - (a.valueScore ?? 0))[0]
    : null;

  const quickAnswer = top
    ? `Najjeftiniji whey concentrate u pakovanju 1.5kg–2.5kg trenutno je ${top.name} za ${top.price} (${top.storeName}). Ako tražiš i dobar kvalitet, ${bestValue?.name ?? top.name} nudi value score ${bestValue?.valueScore?.toFixed(1) ?? "N/A"}/10.`
    : "Trenutno nema dostupnih whey proteina u pakovanju 1.5kg–2.5kg. Pogledaj susedne opsege.";

  return (
    <SEOLandingPage
      h1="Najjeftiniji Whey Protein 1.5kg–2.5kg u Srbiji"
      intro="Pakovanja od 1.5 do 2.5 kilograma — dobra srednja tačka između cene po gramu i veličine investicije. Dovoljno veliko da cena po gramu proteina bude znatno bolja nego kod 1kg pakovanja, a dovoljno malo da ne rizikuješ mnogo ako promeniš mišljenje o ukusu ili brendu. Pratimo cene iz svih srpskih prodavnica i prikazujemo ih sortirano od najjeftinije."
      quickAnswer={quickAnswer}
      products={products}
      listHeading="Whey proteini 1.5kg–2.5kg sortirani od najjeftinije cene"
      tableCaption="Najjeftiniji whey proteini 1.5kg–2.5kg u Srbiji — aktuelne cene"
      currentSlug="najjeftiniji-whey-protein-1500g-2500g"
      headerSection={<WeightRangeTabs currentSlug="najjeftiniji-whey-protein-1500g-2500g" />}
      middleSection={<WeightRangeInsights products={products} />}
      faqs={[
        {
          q: "Da li se isplati kupiti 2kg pakovanje umesto 1kg?",
          a: "Generalno da — cena po gramu proteina je niža kod većih paketa. Opseg 1.5–2.5kg je dobar kompromis: veća ušteda nego kod 1kg, ali bez obaveze da potrošiš 3–4kg pre nego što proveriš da li ti odgovara ukus.",
        },
        {
          q: "Koliko porcija ima u 2kg paketu whey proteina?",
          a: "Zavisi od preporučene porcije brenda, ali tipično 2kg pakovanje ima između 50 i 70 porcija (30g porcija = ~66 porcija). Uz dve porcije dnevno, to je oko mesec dana suplementacije.",
        },
        {
          q: "Da li je opseg 1.5–2.5kg dovoljan za ceo ciklus mase?",
          a: "Za standardni 8–12-nedeljni ciklus mase uz jednu do dve porcije dnevno, pakovanje od oko 2kg obično pokriva veći deo perioda, ali za duže cikluse ćeš verovatno naručiti ponovo. Ako znaš da planiraš duži period bez menjanja ukusa, veći opseg (3kg+) je isplativiji po gramu.",
        },
        {
          q: "Koliko se razlikuje cena po gramu proteina između 1kg i 2kg pakovanja?",
          a: "U proseku, pakovanje od 2kg košta 10–20% manje po gramu proteina od istog proizvoda u 1kg pakovanju, mada razlika zavisi od brenda i trenutnih akcija u prodavnicama. Iznad, u sekciji sa brojevima za ovaj opseg, vidiš aktuelnu prosečnu cenu po gramu za proizvode koji su trenutno dostupni.",
        },
      ]}
    />
  );
}
