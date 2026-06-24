import { Metadata } from "next";
import { fetchTopProducts } from "@/lib/seo-data";
import { SEOLandingPage } from "@/components/seo/SEOLandingPage";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: "Kazein Protein u Srbiji 2026 — Cene i Poređenje | Proteinoteka" },
  description:
    "Kazein protein u Srbiji — cene od ~4.000 do ~8.000 RSD/kg. Idealan pre spavanja za noćni oporavak. Poredimo sve kazein proteine iz srpskih prodavnica.",
  alternates: { canonical: "https://proteinoteka.rs/kazein-protein-srbija" },
  openGraph: {
    title: "Kazein Protein u Srbiji 2026 | Proteinoteka",
    description:
      "Aktuelne cene kazein proteina u srpskim prodavnicama. Micellar casein, kalcijum kazeinat — koji je best value?",
    url: "https://proteinoteka.rs/kazein-protein-srbija",
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
  const products = await fetchTopProducts({ category: "casein", sortBy: "valueScore", limit: 20 });

  const cheapest = [...products].sort((a, b) => (a.numericPrice ?? 0) - (b.numericPrice ?? 0))[0];
  const top = products[0];

  const quickAnswer = top
    ? `Kazein protein se uzima pre spavanja jer se sporo vari (5–7h) i obezbeđuje konstantan dotok aminokiselina tokom noći. Trenutno best value opcija u bazi je ${top.name}. Cene kazeina u Srbiji kreću se od ~4.000 do ~8.000 RSD za kilogram, zavisno od brenda i prodavnice.`
    : "Kazein protein se uzima pre spavanja jer se sporo vari i obezbeđuje konstantan dotok aminokiselina tokom noći. Cene u Srbiji kreću se od ~4.000 do ~8.000 RSD/kg.";

  return (
    <SEOLandingPage
      h1="Kazein Protein u Srbiji 2026"
      intro="Kazein je mlečni protein koji se polako vari — 5 do 7 sati. Za razliku od whey proteina koji pruža brzu dozu aminokiselina, kazein oslobađa aminokiseline postepeno. Idealan je pre spavanja kada telo regeneriše mišićno tkivo. Proteinoteka poredi cene svih kazein proteina iz srpskih prodavnica."
      quickAnswer={quickAnswer}
      products={products}
      listHeading="Kazein proteini — sortirani po vrednosti za novac"
      tableCaption="Pregled cena kazein proteina u Srbiji 2026"
      currentSlug="kazein-protein-srbija"
      faqs={[
        {
          q: "Zašto se kazein pije pre spavanja?",
          a: "Kazein se u stomaku grudi i vari se 5–7 sati, za razliku od whey-a koji se probavi za 1–2h. Uzet pre spavanja, obezbeđuje stabilan dotok aminokiselina tokom cele noći dok telo regeneriše mišićno tkivo. Istraživanja potvrđuju da noćni unos kazeina poboljšava mišićni oporavak i sintezu proteina.",
        },
        {
          q: "Koja je razlika između micellar casein i calcium caseinate?",
          a: "Micellar casein je nativni oblik kazeina — zadržava prirodnu strukturu micela koja usporava varenje. Kalcijum kazeinat je obrađenija forma koja se nešto brže vari. Za pre-sleep unos, micellar casein je optimalan izbor zbog sporijeg oslobađanja aminokiselina. Kalcijum kazeinat je jeftiniji i često se koristi u protein blend-ovima.",
        },
        {
          q: "Koliko košta kazein protein u Srbiji?",
          a: "Cene kazeina u Srbiji kreću se od ~4.000 do ~8.000 RSD za kilogram, zavisno od brenda i prodavnice. Micellar casein premium brendova (ON, Scitec) je na višem kraju raspona. Generički ili domaći brendovi nude jeftinije opcije. Uvek gledaj cenu po gramu proteina za realnu procenu vrednosti.",
        },
        {
          q: "Može li se kazein kombinovati sa wheyem?",
          a: "Da — ovo je popularna strategija: whey posle treninga (brza apsorpcija za post-workout) i kazein pre spavanja (spora apsorpcija za noćni oporavak). Kombinacija pokriva ceo ciklus aminokiselina tokom dana i noći.",
        },
        {
          q: "Da li kazein pomaže kod mršavljenja?",
          a: "Kazein može biti koristan tokom dijete jer daje dugotrajan osećaj sitosti i štiti mišiće od katabolizma tokom kalorijskog deficita. Noćni unos smanjuje gubitak mišićne mase. Ipak, sam protein ne 'topi' mast — ključna je ukupna kalorijska bilansa.",
        },
        {
          q: "Koliko kazeina treba uzimati dnevno?",
          a: "Tipična preporuka je 25–40g kazeina pre spavanja (jedna do dve porcije zavisno od veličine pakovanja i individualnih potreba). Za aktivne osobe koje treniraju intenzivno, 30–40g je optimalno za noćni oporavak. Ukupan dnevni unos proteina (iz svih izvora) treba da bude 1.6–2.2g po kilogramu telesne mase.",
        },
      ]}
    />
  );
}
