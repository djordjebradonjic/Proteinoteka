import { Metadata } from "next";
import { fetchTopProducts } from "@/lib/seo-data";
import { SEOLandingPage } from "@/components/seo/SEOLandingPage";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: "Hidrolizat Proteina u Hrvatskoj 2026 — Cijene i Usporedba | Proteinoteka" },
  description:
    "Hidrolizovani whey protein u Hrvatskoj — cijene, usporedba i value score. Dymatize ISO100, ON Platinum Hydrowhey — koji nudi najbolju vrijednost za novac?",
  alternates: { canonical: "https://proteinoteka.com.hr/hidrolizat-protein-hrvatska" },
  openGraph: {
    title: "Hidrolizat Proteina u Hrvatskoj 2026 | Proteinoteka",
    description:
      "Aktualne cijene hidroliziranih proteina u hrvatskim trgovinama. Koji hidrolizat nudi best value — Dymatize ISO100 ili ON Platinum Hydrowhey?",
    url: "https://proteinoteka.com.hr/hidrolizat-protein-hrvatska",
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
  const products = await fetchTopProducts({ category: "hydrolysate", sortBy: "valueScore", limit: 20 });

  const top = products[0];
  const cheapest = products.length > 0
    ? [...products].sort((a, b) => (a.numericPrice ?? 0) - (b.numericPrice ?? 0))[0]
    : null;

  const quickAnswer = top
    ? `Hidrolizat je najskuplji tip proteina zbog procesa enzimske razgradnje koja ubrzava apsorpciju. Trenutno best value hidrolizat u bazi je ${top.name}. Za rekreativce koji treniraju jednom dnevno, razlika u oporavku u usporedbi s isolateom je minimalna — no za intenzivne sportaše vrijedi razmotriti.`
    : "Hidrolizat je najskuplji tip proteina zbog procesa enzimske razgradnje koja ubrzava apsorpciju. Za rekreativce koji treniraju jednom dnevno, razlika u oporavku u usporedbi s isolateom je minimalna.";

  return (
    <SEOLandingPage
      h1="Hidrolizat Proteina u Hrvatskoj 2026"
      intro="Hidrolizovani whey protein prolazi kroz enzimsku razgradnju koja dijeli proteinske lance na manje peptide — di- i tri-peptide koji se brže apsorbiraju od cijelog proteina. Rezultat je najbrža dostupnost aminokiselina nakon treninga. Premium segment, cijene su više od isolatea, ali i čistoća je maksimalna. Proteinoteka uspoređuje sve hidrolizate dostupne u Hrvatskoj."
      quickAnswer={quickAnswer}
      products={products}
      listHeading="Hidrolizat proteini — sortirani po vrijednosti za novac"
      tableCaption="Pregled cijena hidroliziranih proteina u Hrvatskoj 2026"
      currentSlug="hidrolizat-protein-hrvatska"
      faqs={[
        {
          q: "Što je hidrolizat proteina i kako se razlikuje od isolatea?",
          a: "Hidrolizat (hydrolyzed whey) je whey isolate koji je prošao kroz enzimsku hidrolizu — veliki proteinski lanci razloženi su na manje di- i tri-peptide. Ovo ubrzava apsorpciju jer crijevna sluznica direktno apsorbira male peptide bez potrebe za daljnjom razgradnjom. Isolate se apsorbira za ~60–90 min, hidrolizat već za ~30–45 min.",
        },
        {
          q: "Ubrzava li hidrolizat stvarno oporavak?",
          a: "Istraživanja potvrđuju brži porast aminokiselina u krvi u prvih sat-dva nakon treninga. Za elitne sportaše koji treniraju dva puta dnevno ili imaju manje od 6 sati između treninga, ova razlika je praktično relevantna. Za rekreativce koji treniraju jednom dnevno, razlika u dugoročnim rezultatima je zanemariva u usporedbi s višom cijenom.",
        },
        {
          q: "Koji hidrolizat proteina je best value u Hrvatskoj?",
          a: "Dymatize ISO100 je jedan od najpopularnijih hidrolizata — 25g proteina po porciji, manje od 1g ugljikohidrata i 0.5g masti. Optimum Nutrition Platinum Hydrowhey je drugi popularni izbor. Aktualne cijene i value score prikazani su u listi iznad.",
        },
        {
          q: "Ima li hidrolizat gorak okus?",
          a: "Da — slobodne aminokiseline i kratki peptidi koji nastaju hidrolizom imaju gorčinu. Ovo je nuspojava procesa koji čini hidrolizat bržim. Brendovi ublažavaju gorčinu aromama i zaslađivačima, ali u usporedbi s concentrateom ili isolateom, okus je općenito intenzivniji i manje 'kremast'.",
        },
        {
          q: "Je li hidrolizat siguran za osobe s intolerancijom na laktozu?",
          a: "Da — hidrolizat sadrži iznimno malo laktoze (manje od 0.1g po porciji), čak manje od standardnog isolatea. Pogodan je čak i za osobe s ozbiljnom intolerancijom na laktozu. Provjeri deklaraciju za specifičan proizvod.",
        },
        {
          q: "Koliko košta hidrolizat proteina u Hrvatskoj?",
          a: "Cijene se kreću ovisno o brendu i veličini pakovanja. Veća pakovanja su isplativija po gramu. Aktualne cijene prikazane su u tablici iznad — uvijek gledaj cijenu po gramu proteina, ne ukupnu cijenu pakovanja.",
        },
      ]}
    />
  );
}
