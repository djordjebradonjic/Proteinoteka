import { notFound } from "next/navigation";
import { CURRENT_MARKET } from "@/lib/marketConfig";
import { Metadata } from "next";
import { fetchStoreProducts, getSeoCopyStats } from "@/lib/seo-data";
import { SEOStorePage } from "@/components/seo/SEOStorePage";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: "GymBeam proteini u Srbiji — cene i poređenje 2026 | Proteinoteka" },
  description:
    "Aktuelne GymBeam cene proteina u Srbiji — whey, izolat, biljni proteini. Poredimo sa svim prodavnicama i računamo value score za svaki proizvod.",
  alternates: { canonical: "https://proteinoteka.rs/gymbeam-proteini" },
  openGraph: {
    title: "GymBeam proteini u Srbiji 2026 | Proteinoteka",
    description:
      "Poređenje GymBeam cena proteina u Srbiji. Value score, nutritivne vrednosti i direktno poređenje sa svim prodavnicama.",
    url: "https://proteinoteka.rs/gymbeam-proteini",
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
  const products = await fetchStoreProducts({ storeName: "GymBeam", limit: 200 });
  const stats = getSeoCopyStats(products);

  return (
    <SEOStorePage
      h1="GymBeam proteini u Srbiji — sve cene"
      storeName="GymBeam"
      intro={`Ako u Srbiji tražiš protein sa dobrim odnosom cene i kvaliteta, GymBeam se skoro sigurno nalazi na listi opcija — slovački brend iz Košica koji je 2025. sa 232 miliona evra prihoda i 24% rasta postao najveći evropski igrač u sportskoj ishrani, najvećim delom zahvaljujući nižim cenama u odnosu na zapadnoevropsku konkurenciju. Ponuda ide od jeftinijih blend i biljnih proteina do premium izolata.${stats ? ` Trenutno najbolji value score u celoj ponudi nose ${stats.bestValue.name}${stats.secondBestValue ? ` i ${stats.secondBestValue.name}` : ""}, a cene generalno idu od ${stats.minPriceLabel} do ${stats.maxPriceLabel}.` : ""} U Srbiji se GymBeam prodaje isključivo preko sopstvene onlajn prodavnice, pa je poređenje sa ostalim brendovima jedini način da proveriš da li je zaista najisplativija opcija za ono što tražiš.${products.length > 0 ? ` Na Proteinoteci trenutno pratimo ${products.length} GymBeam proizvoda.` : ""} Pregled ispod je sortiran po value score-u — objektivnoj meri koja uzima u obzir cenu, sadržaj proteina i nutritivni profil.`}
      products={products}
      currentSlug="gymbeam-proteini"
      faqs={[
        {
          q: "Koliko košta GymBeam protein u Srbiji?",
          a: stats
            ? `GymBeam cene u Srbiji trenutno se kreću od ${stats.minPriceLabel} (${stats.cheapest.name}) do ${stats.maxPriceLabel} (${stats.priciest.name}) — raspon je širok jer GymBeam pokriva i budžetske i premium linije. Puna tabela ispod je ažurirana na dnevnom nivou.`
            : "Aktuelne cene za sva GymBeam pakovanja prikazane su u tabeli iznad, ažurirane na dnevnom nivou.",
        },
        {
          q: "Da li je GymBeam samo jeftinija alternativa ili ima i kvalitetne proizvode?",
          a: "Oboje — to mu je i prednost. GymBeam je od osnivanja 2014. gradio reputaciju na nižoj ceni u odnosu na etablirane zapadne brendove, ali danas, sa 232 miliona evra prihoda i sopstvenom proizvodnjom, ima i premium linije (poput IsoWhey izolata) koje po kvalitetu ne zaostaju mnogo za skupljim konkurentima — samo su bolje pozicionirane cenovno.",
        },
        {
          q: "Da li GymBeam ima biljne (vegan) proteine?",
          a: "Da, i to je jedna od jačih strana GymBeam ponude u Srbiji — skoro polovina proizvoda koje pratimo su biljni ili blend proteini, ne klasičan whey. Ako tražiš vegan opciju, GymBeam je vredan pogledati pre nekih brendova koji nude samo whey liniju.",
        },
        {
          q: "Koji GymBeam proteini imaju najviše proteina na 100g?",
          a: stats
            ? `Trenutno najviše proteina po 100g u GymBeam ponudi ima ${stats.highestProtein.name} — ${stats.highestProtein.proteinPer100g}g na 100g. Tabela iznad prikazuje tačne nutritivne vrednosti za svaki proizvod.`
            : "Sadržaj proteina zavisi od linije proizvoda. U tabeli iznad možeš videti tačne nutritivne vrednosti svakog GymBeam proizvoda.",
        },
        {
          q: "Kako se GymBeam cene porede sa ostalim prodavnicama u Srbiji?",
          a: "Proteinoteka svakodnevno prikuplja cene iz svih prodavnica. Na glavnoj stranici možeš filtrirati po brendu ili kategoriji i uporediti GymBeam direktno sa Supplementshop-om, FitLab-om, Pansport-om i ostalima — razlika za sličan proizvod ume da bude i preko 20%.",
        },
        {
          q: "Kako da aktiviram obaveštenje o padu cene za GymBeam proteine?",
          a: "Otvori stranicu željenog proizvoda, unesi email i ciljnu cenu — bez registracije. Čim cena padne ispod tog praga, stiže automatsko obaveštenje.",
        },
      ]}
    />
  );
}
