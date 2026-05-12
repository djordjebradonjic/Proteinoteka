import { Metadata } from "next";
import { fetchTopProducts } from "@/lib/seo-data";
import { SEOLandingPage } from "@/components/seo/SEOLandingPage";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Whey Izolat Proteina u Srbiji — Cene i Pregled | Proteinoteka",
  description:
    "Pronađi najisplativiji whey izolat protein u Srbiji. Visoka čistoća proteina, minimalne masti i laktoza — po najboljoj ceni iz svih srpskih prodavnica.",
  alternates: { canonical: "https://proteinoteka.rs/whey-isolate-srbija" },
  openGraph: {
    title: "Whey Izolat Proteina u Srbiji | Proteinoteka",
    description: "Pregled i poređenje whey izolata dostupnih u Srbiji. Cene, proteini, value score.",
    url: "https://proteinoteka.rs/whey-isolate-srbija",
    siteName: "Proteinoteka",
    locale: "sr_RS",
    type: "website",
  },
};

export default async function Page() {
  const products = await fetchTopProducts({
    category: "whey_isolate",
    sortBy: "valueScore",
    limit: 15,
  });

  const top = products[0];
  const cheapestIso = products.length > 0
    ? [...products].sort((a, b) => (a.numericPrice ?? 0) - (b.numericPrice ?? 0))[0]
    : null;

  const quickAnswer = top
    ? `Whey izolat je čistiji od koncentrata — tipično 90%+ proteina, minimalno masti i laktoze. Trenutno, ${top.name} nudi najbolji odnos cene i kvaliteta za izolat u Srbiji (score ${top.valueScore?.toFixed(1)}/10). Najjeftinija opcija u ovoj kategoriji je ${cheapestIso?.name ?? top.name} za ${cheapestIso?.price ?? top.price}.`
    : "";

  return (
    <SEOLandingPage
      h1="Whey Izolat Proteina u Srbiji"
      intro="Whey izolat je najčistiji oblik surutkinog proteina — pogodан za osobe sa intolerancijom na laktozu, u fazi definicije, ili kada ti je bitna čistoća svakog obroka. Poredimo sve dostupne izolate u Srbiji po ceni i kvalitetu."
      quickAnswer={quickAnswer}
      products={products}
      listHeading="Whey izolati dostupni u Srbiji — rang lista"
      tableCaption="Whey izolat proteini u Srbiji — cene i value score"
      currentSlug="whey-isolate-srbija"
      faqs={[
        {
          q: "Koja je razlika između whey izolata i koncentrata?",
          a: "Koncentrat sadrži 70–80% proteina na 100g, uz nešto masti i laktoze. Izolat prolazi kroz dodatnu filtraciju i tipično ima 85–93% proteina, manje masti i drastično manje laktoze. Razlika u praksi: izolat je čistiji obrok, ali košta više. Za rekreativce koji nemaju problema sa laktозom, koncentrat je sasvim dovoljan.",
        },
        {
          q: "Ko treba da koristi whey izolat?",
          a: "Izolat ima smisla za osobe sa intolerancijom na laktozu, one u fazi definicije koji paze na svaki gram masti i ugljenih hidrata, i sportiste koji uzimaju veće količine proteina i žele čistiji unos. Ako si rekreativac u fazi mase, koncentrat ti daje istu količinu proteina za manji novac.",
        },
        {
          q: "Da li je whey izolat zaista bez laktoze?",
          a: "Nije nužno potpuno bez laktoze, ali sadrži je znatno manje od koncentrata — obično ispod 1g na serviranju. Većina osoba sa umerenom intolerancijom na laktozu podnosi izolat bez problema. Ako imaš ozbiljnu intoleranciju, proveri deklaraciju konkretnog proizvoda.",
        },
        {
          q: "Da li se isplati platiti više za izolat?",
          a: "Zavisi od tvojih ciljeva i budžeta. Ako nemaš problema sa laktозом i treniraš rekreativno, koncentrat je finansijski isplativiji. Ako si u deficitu kalorija, imaš intoleranciju na laktozu ili uziman protein više puta dnevno — izolat je opravdan izbor. Na Proteinoteci možeš porediti value score obe kategorije i doneti odluku na osnovu brojeva.",
        },
      ]}
    />
  );
}
