import { Metadata } from "next";
import { fetchTopProducts } from "@/lib/seo-data";
import { SEOLandingPage } from "@/components/seo/SEOLandingPage";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: "Hidrolizat Proteina u Srbiji 2026 — Cene i Poređenje | Proteinoteka" },
  description:
    "Hidrolizovani whey protein u Srbiji — cene od ~5.000 do ~12.000 RSD/kg. Najbrža apsorpcija, premium segment. Dymatize ISO100, ON Platinum — poredimo sve.",
  alternates: { canonical: "https://proteinoteka.rs/hidrolizat-protein-srbija" },
  openGraph: {
    title: "Hidrolizat Proteina u Srbiji 2026 | Proteinoteka",
    description:
      "Aktuelne cene hidrolizovanih proteina u srpskim prodavnicama. Koji hidrolizat nudi best value — Dymatize ISO100 ili ON Platinum Hydrowhey?",
    url: "https://proteinoteka.rs/hidrolizat-protein-srbija",
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
  const products = await fetchTopProducts({ category: "hydrolysate", sortBy: "valueScore", limit: 20 });

  const top = products[0];
  const cheapest = [...products].sort((a, b) => (a.numericPrice ?? 0) - (b.numericPrice ?? 0))[0];

  const quickAnswer = top
    ? `Hidrolizat je najskuplji tip proteina zbog procesa enzimske razgradnje koji ubrzava apsorpciju. Trenutno best value hidrolizat u bazi je ${top.name}. Cene u Srbiji kreću se od ~5.000 do ~12.000+ RSD za standardna pakovanja. Za rekreativce koji treniraju jednom dnevno, razlika u oporavku u poređenju sa isolate-om je minimalna.`
    : "Hidrolizat je najskuplji tip proteina zbog procesa enzimske razgradnje koji ubrzava apsorpciju. Cene u Srbiji kreću se od ~5.000 do ~12.000+ RSD za standardna pakovanja.";

  return (
    <SEOLandingPage
      h1="Hidrolizat Proteina u Srbiji 2026"
      intro="Hidrolizovani whey protein prolazi kroz enzimsku razgradnju koja deli proteinske lance na manje peptide — di- i tri-peptide koji se brže apsorbuju od celog proteina. Rezultat je najbrža dostupnost aminokiselina posle treninga. Premium segment, cene su više od isolate-a, ali i čistoća je maksimalna. Proteinoteka poredi sve hidrolizate dostupne u Srbiji."
      quickAnswer={quickAnswer}
      products={products}
      listHeading="Hidrolizat proteini — sortirani po vrednosti za novac"
      tableCaption="Pregled cena hidrolizovanih proteina u Srbiji 2026"
      currentSlug="hidrolizat-protein-srbija"
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
          a: "Dymatize ISO100 je jedan od najpopularnijih hidrolizata na srpskom tržištu — 25g proteina po porciji, manje od 1g ugljenih hidrata i 0.5g masti. Optimum Nutrition Platinum Hydrowhey je drugi popularni izbor. Aktuelne cene i value score su prikazani u listi iznad.",
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
          a: "Cene se kreću od ~5.000 do ~12.000+ RSD za standardna pakovanja (600–900g), zavisno od brenda i prodavnice. Veća pakovanja (1.5–2kg) su isplativija po gramu. Aktuelne cene su prikazane u tabeli iznad — uvek gledaj cenu po gramu proteina, ne ukupnu cenu pakovanja.",
        },
      ]}
    />
  );
}
