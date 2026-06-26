import { Metadata } from "next";
import { fetchTopProducts } from "@/lib/seo-data";
import { SEOLandingPage } from "@/components/seo/SEOLandingPage";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: "Whey Izolat Proteina u Hrvatskoj — Cijene i Pregled | Proteinoteka" },
  description:
    "Svi whey izolati dostupni u Hrvatskoj — cijene iz 5 trgovina, proteini na 100g i vrijednost za novac. Čist protein bez viška laktoze i masti, po najboljoj cijeni.",
  alternates: { canonical: "https://proteinoteka.com.hr/whey-isolate-hrvatska" },
  openGraph: {
    title: "Whey Izolat Proteina u Hrvatskoj | Proteinoteka",
    description: "Pregled i usporedba whey izolata dostupnih u Hrvatskoj. Cijene, proteini, value score.",
    url: "https://proteinoteka.com.hr/whey-isolate-hrvatska",
    siteName: "Proteinoteka",
    locale: "hr_HR",
    type: "website",
    images: [{ url: "https://proteinoteka.com.hr/opengraph-image", width: 1200, height: 630, alt: "Proteinoteka" }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["https://proteinoteka.com.hr/opengraph-image"],
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
    ? `Whey izolat je čistiji od koncentrata — tipično 90%+ proteina, minimalno masti i laktoze. Trenutno, ${top.name} nudi najbolji odnos cijene i kvalitete za izolat u Hrvatskoj (score ${top.valueScore?.toFixed(1)}/10). Najjeftinija opcija u ovoj kategoriji je ${cheapestIso?.name ?? top.name} za ${cheapestIso?.price ?? top.price}.`
    : "";

  return (
    <SEOLandingPage
      h1="Whey Izolat Proteina u Hrvatskoj"
      intro="Whey izolat je najčistiji oblik surutkinog proteina — pogodan za osobe s intolerancijom na laktozu, u fazi definicije, ili kada ti je bitna čistoća svakog obroka. Uspoređujemo sve dostupne izolate u Hrvatskoj po cijeni i kvaliteti."
      quickAnswer={quickAnswer}
      products={products}
      listHeading="Whey izolati dostupni u Hrvatskoj — rang lista"
      tableCaption="Whey izolat proteini u Hrvatskoj — cijene i value score"
      currentSlug="whey-isolate-hrvatska"
      faqs={[
        {
          q: "Koja je razlika između whey izolata i koncentrata?",
          a: "Koncentrat sadrži 70–80% proteina na 100g, uz nešto masti i laktoze. Izolat prolazi kroz dodatnu filtraciju i tipično ima 85–93% proteina, manje masti i drastično manje laktoze. Razlika u praksi: izolat je čistiji obrok, ali košta više. Za rekreativce koji nemaju problema s laktozom, koncentrat je sasvim dovoljan.",
        },
        {
          q: "Tko bi trebao koristiti whey izolat?",
          a: "Izolat ima smisla za osobe s intolerancijom na laktozu, one u fazi definicije koji paze na svaki gram masti i ugljikohidrata, i sportaše koji uzimaju veće količine proteina i žele čistiji unos. Ako si rekreativac u fazi mase, koncentrat ti daje istu količinu proteina za manji novac.",
        },
        {
          q: "Je li whey izolat stvarno bez laktoze?",
          a: "Nije nužno potpuno bez laktoze, ali sadrži je znatno manje od koncentrata — obično ispod 1g na serviranju. Većina osoba s umjerenom intolerancijom na laktozu podnosi izolat bez problema. Ako imaš ozbiljnu intoleranciju, provjeri deklaraciju konkretnog proizvoda.",
        },
        {
          q: "Isplati li se platiti više za izolat?",
          a: "Ovisi o tvojim ciljevima i proračunu. Ako nemaš problema s laktozom i treniraš rekreativno, koncentrat je financijski isplativiji. Ako si u deficitu kalorija, imaš intoleranciju na laktozu ili uziman protein više puta dnevno — izolat je opravdan izbor. Na Proteinoteci možeš usporediti value score obje kategorije i donijeti odluku na temelju brojeva.",
        },
      ]}
    />
  );
}
