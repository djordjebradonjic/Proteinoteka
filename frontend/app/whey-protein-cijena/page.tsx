import { notFound } from "next/navigation";
import { Metadata } from "next";
import { CURRENT_MARKET } from "@/lib/marketConfig";
import { SEOLandingPage } from "@/components/seo/SEOLandingPage";
import { formatPrice } from "@/lib/formatPrice";
import { computeWheyPriceStats, fetchMarketCatalog, topByValueScore } from "@/lib/whey-price-stats";

export const revalidate = 86400;

// Same principle as /whey-protein-cena: every figure below is computed from the live HR
// catalog (lib/whey-price-stats.ts) instead of being hand-typed.

const eurKg = (v: number) => Math.round(v).toLocaleString("hr-HR");
const eurPerG = (v: number) => v.toFixed(3).replace(".", ",");

export async function generateMetadata(): Promise<Metadata> {
  const { stores } = computeWheyPriceStats(await fetchMarketCatalog());
  const description = `Usporedi cijene whey proteina iz ${stores} hrvatskih trgovina. Value score, € po gramu proteina i direktna usporedba — ažurirano tjedno.`;

  return {
    title: { absolute: "Whey Protein Cijena u Hrvatskoj 2026 | Proteinoteka" },
    description,
    alternates: { canonical: "https://proteinoteka.com.hr/whey-protein-cijena" },
    openGraph: {
      title: "Whey Protein Cijena u Hrvatskoj | Proteinoteka",
      description: `Aktualne cijene whey proteina iz ${stores} hrvatskih trgovina. Usporedi i pronađi najbolju vrijednost.`,
      url: "https://proteinoteka.com.hr/whey-protein-cijena",
      siteName: "Proteinoteka",
      locale: "hr_HR",
      type: "website",
      images: [{ url: "https://proteinoteka.com.hr/opengraph-image", width: 1200, height: 630, alt: "Proteinoteka" }],
    },
    twitter: {
      title: "Whey Protein Cijena u Hrvatskoj 2026 | Proteinoteka",
      description: `Usporedi cijene whey proteina iz ${stores} hrvatskih trgovina. Value score i € po gramu proteina.`,
    },
  };
}

export default async function Page() {
  if (CURRENT_MARKET !== "hr") notFound();

  const catalog = await fetchMarketCatalog();
  const s = computeWheyPriceStats(catalog);
  const c = s.types.whey_concentrate;
  const i = s.types.whey_isolate;
  const bestPerGram = s.ranked[0];

  // Store prices come as raw scraped strings; the numeric price is the reliable one.
  const products = topByValueScore(catalog, "whey_concentrate", 20).map((p) => ({
    ...p,
    price: formatPrice(p.numericPrice),
  }));
  const top = products[0];

  const quickAnswer = top
    ? `Whey koncentrat s najboljim omjerom cijene i kvalitete u Hrvatskoj trenutno je ${top.name} (${top.storeName}) s value scoreom ${top.valueScore?.toFixed(1) ?? "N/A"}/10 za ${top.price}.${
        bestPerGram
          ? ` Najnižu cijenu po gramu proteina među whey pakiranjima od 900g i više ima ${bestPerGram.product.name} (${bestPerGram.product.storeName}): ${eurPerG(bestPerGram.pricePerGProtein)} €/g.`
          : ""
      }`
    : "";

  return (
    <SEOLandingPage
      h1="Whey Protein Cijena u Hrvatskoj — Usporedi trgovine"
      intro={`Pratimo aktualne cijene whey proteina iz ${s.stores} hrvatskih trgovina. Lista rangira whey koncentrate, najzastupljeniji tip, po value scoreu — ocjeni od 0 do 10 koja spaja cijenu po gramu proteina, čistoću proteina, apsorpciju, sastojke i reputaciju brenda. Tako odmah vidiš koji protein nudi najveću vrijednost, bez pretraživanja svake trgovine posebno.`}
      quickAnswer={quickAnswer}
      products={products}
      listHeading="Whey koncentrati — rang lista po value scoreu"
      tableCaption="Whey protein cijene u Hrvatskoj — aktualna usporedba"
      currentSlug="whey-protein-cijena"
      faqs={[
        {
          q: "Zašto se cijene whey proteina toliko razlikuju?",
          a: `Razlike dolaze od tipa proteina (koncentrat, izolat, hidrolizat), veličine pakiranja, brenda i marže pojedinih trgovina. ${
            c && i
              ? `U našoj bazi whey koncentrat tipično košta ${eurKg(c.kgLow)}–${eurKg(c.kgHigh)} €/kg (medijan ${eurKg(c.kgMedian)}), a izolat ${eurKg(i.kgLow)}–${eurKg(i.kgHigh)} €/kg (medijan ${eurKg(i.kgMedian)}); raspon ne uključuje 10% najjeftinijih i 10% najskupljih ponuda. `
              : ""
          }Na Proteinoteci možeš usporediti cijenu po gramu proteina — što je precizniji pokazatelj vrijednosti od ukupne cijene.`,
        },
        {
          q: "Koji whey protein je najpovoljniji u Hrvatskoj?",
          a: `${
            bestPerGram
              ? `Trenutno je po cijeni po gramu proteina najpovoljniji ${bestPerGram.product.name} (${bestPerGram.product.storeName}) s ${eurPerG(bestPerGram.pricePerGProtein)} €/g, među pakiranjima od 900g i više. `
              : ""
          }To se mijenja tjedno ovisno o akcijama i dostupnosti. Na Proteinoteci automatski pratimo cijene i uvijek prikazujemo trenutno najisplativije opcije. Filtriraj po kategoriji i sortiraj po cijeni ili value scoreu da pronađeš ono što tražiš.`,
        },
        {
          q: "Koliko grama proteina treba biti u dobrom whey proteinu?",
          a: `${
            c?.proteinMedian != null && i?.proteinMedian != null
              ? `U našoj bazi whey koncentrat ima medijan od ${Math.round(c.proteinMedian)}g proteina na 100g proizvoda, a izolat ${Math.round(i.proteinMedian)}g. `
              : ""
          }Što je veći postotak proteina, to je obično manji udio masti, laktoze i šećera. Na svakom proizvodu na Proteinoteci možeš vidjeti točan sadržaj proteina na 100g.`,
        },
        {
          q: "Je li bolje kupiti whey protein online ili u dućanu?",
          a: `Proteinoteka uspoređuje samo online trgovine (trenutno ${s.stores}), pa ne možemo reći koliko je cijena u fizičkom dućanu drukčija. Online možeš u nekoliko sekundi usporediti cijenu po gramu proteina među trgovinama, a mi te direktno šaljemo na stranicu s najboljom ponudom — bez naplate.`,
        },
      ]}
    />
  );
}
