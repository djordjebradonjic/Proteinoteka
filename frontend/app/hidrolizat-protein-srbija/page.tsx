import { cache } from "react";
import { notFound } from "next/navigation";
import { CURRENT_MARKET } from "@/lib/marketConfig";
import { Metadata } from "next";
import { fetchTopProducts } from "@/lib/seo-data";
import { SEOLandingPage } from "@/components/seo/SEOLandingPage";
import { formatPrice } from "@/lib/formatPrice";
import { rsPageMetadata } from "@/lib/seo-meta";

export const revalidate = 86400;

const loadHydrolysates = cache(() =>
  fetchTopProducts({ category: "hydrolysate", sortBy: "valueScore", limit: 20 }),
);

// Everything numeric on this page comes from the live list, so the copy can't drift from the table.
function priceRange(products: { numericPrice: number }[]): { min: number; max: number } | null {
  const prices = products.map((p) => p.numericPrice).filter((v) => v > 0);
  return prices.length > 0 ? { min: Math.min(...prices), max: Math.max(...prices) } : null;
}

export async function generateMetadata(): Promise<Metadata> {
  const range = priceRange(await loadHydrolysates());
  return rsPageMetadata({
    path: "/hidrolizat-protein-srbija",
    title: range ? `Hidrolizat proteina cena u Srbiji, od ${formatPrice(Math.round(range.min))}` : "Hidrolizat proteina cena u Srbiji",
    description:
      "Hidrolizovani whey protein u srpskim prodavnicama: cene, cena po gramu proteina i value score. Poređenje svih hidrolizata koje pratimo, uključujući ISO-100 i Platinum Hydrowhey.",
    ogTitle: "Hidrolizat proteina u Srbiji 2026 | Proteinoteka",
  });
}

export default async function Page() {
  if (CURRENT_MARKET !== 'rs') notFound();
  const products = await loadHydrolysates();
  const range = priceRange(products);
  const rangeText = range ? `od ${formatPrice(Math.round(range.min))} do ${formatPrice(Math.round(range.max))}` : null;

  const top = products[0];

  const quickAnswer =
    "Hidrolizat je najskuplji tip proteina zbog procesa enzimske razgradnje koji ubrzava apsorpciju." +
    (top ? ` Trenutno best value hidrolizat u bazi je ${top.name}.` : "") +
    (rangeText ? ` Pratimo ${products.length} ${products.length === 1 ? "ponudu" : "ponuda"}, cene su ${rangeText} za pojedinačna pakovanja.` : "") +
    " Za rekreativce koji treniraju jednom dnevno, razlika u oporavku u poređenju sa isolate-om je minimalna.";

  return (
    <SEOLandingPage
      h1="Hidrolizat Proteina u Srbiji 2026"
      intro="Hidrolizovani whey protein prolazi kroz enzimsku razgradnju koja deli proteinske lance na manje peptide — di- i tri-peptide koji se brže apsorbuju od celog proteina. Rezultat je najbrža dostupnost aminokiselina posle treninga. Premium segment, cene su više od isolate-a, ali i čistoća je maksimalna. Proteinoteka poredi sve hidrolizate dostupne u Srbiji."
      quickAnswer={quickAnswer}
      products={products}
      listHeading="Hidrolizat proteini — sortirani po vrednosti za novac"
      tableCaption="Pregled cena hidrolizovanih proteina u Srbiji 2026"
      currentSlug="hidrolizat-protein-srbija"
      extraLinks={[{ href: "/amino-whey-hydro-cena", label: "🧪 Amino Whey Hydro cena" }]}
      faqs={[
        {
          q: "Šta je hidrolizat proteina i kako se razlikuje od isolate-a?",
          a: "Hidrolizat (hydrolyzed whey) je whey isolate koji je prošao kroz enzimsku hidrolizu — veliki proteinski lanci razloženi su na manje di- i tri-peptide. Ovo ubrzava apsorpciju jer crevna sluznica direktno apsorbuje male peptide bez potrebe za daljom razgradnjom. Isolate se apsorbuje za ~60–90 min, hidrolizat već za ~30–45 min.",
        },
        {
          q: "Da li hidrolizat zaista ubrzava oporavak?",
          a: "Istraživanja potvrđuju brži porast aminokiselina u krvi u prvih sat-dva posle treninga. Za elitne sportiste koji treniraju dva puta dnevno ili imaju manje od 6 sati između treninga, ova razlika je praktično relevantna. Za rekreativce koji treniraju jednom dnevno, razlika u dugoročnim rezultatima je zanemarljiva u poređenju sa višom cenom.",
        },
        {
          q: "Koji hidrolizat proteina je best value u Srbiji?",
          a: top
            ? `Prema našem value score-u trenutno je najbolji „${top.name}“ (${top.valueScore?.toFixed(1)}/10, prodavnica ${top.storeName}). Score uzima u obzir cenu, procenat proteina, čistoću sastava i ugled brenda, a aktuelne cene i score za sve hidrolizate su u listi iznad.`
            : "Aktuelne cene i value score za sve hidrolizate su prikazani u listi iznad.",
        },
        {
          q: "Da li hidrolizat ima gorčinu u ukusu?",
          a: "Da — slobodne aminokiseline i kratki peptidi koji nastaju hidrolizom imaju gorčinu. Ovo je nusproizvod procesa koji čini hidrolizat bržim. Brendovi ublažavaju gorčinu aromama i zaslađivačima, ali u poređenju sa concentrate-om ili isolate-om, ukus je generalno intenzivniji i manje 'kremast'.",
        },
        {
          q: "Da li je hidrolizat bezbedan za osobe sa intolerancijom na laktozu?",
          a: "Da — hidrolizat sadrži izuzetno malo laktoze (manje od 0.1g po porciji), čak manje od standardnog isolate-a. Pogodan je čak i za osobe sa ozbiljnom intolerancijom na laktozu. Proveri deklaraciju za specifičan proizvod.",
        },
        {
          q: "Koliko košta hidrolizat proteina u Srbiji?",
          a: rangeText
            ? `Trenutno pratimo ${products.length} ${products.length === 1 ? "ponudu" : "ponuda"} hidrolizata, sa cenama ${rangeText} za pojedinačna pakovanja. Raspon je širok jer se pakovanja razlikuju po veličini, pa uvek gledaj cenu po gramu proteina, a ne ukupnu cenu pakovanja.`
            : "Aktuelne cene su prikazane u tabeli iznad; uvek gledaj cenu po gramu proteina, ne ukupnu cenu pakovanja.",
        },
      ]}
    />
  );
}
