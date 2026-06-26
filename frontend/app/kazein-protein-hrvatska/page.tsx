import { Metadata } from "next";
import { fetchTopProducts } from "@/lib/seo-data";
import { SEOLandingPage } from "@/components/seo/SEOLandingPage";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: "Kazein Protein u Hrvatskoj 2026 — Usporedi cijene | Proteinoteka" },
  description:
    "Pronađi najisplativiji kazein protein u Hrvatskoj. Uspoređujemo aktualne cijene iz svih trgovina — sortirano po EUR po gramu proteina.",
  alternates: { canonical: "https://proteinoteka.com.hr/kazein-protein-hrvatska" },
  openGraph: {
    title: "Kazein Protein u Hrvatskoj — Usporedi cijene | Proteinoteka",
    description: "Aktualne cijene kazein proteina iz hrvatskih trgovina. Pronađi najbolji kazein po cijeni i kvaliteti.",
    url: "https://proteinoteka.com.hr/kazein-protein-hrvatska",
    siteName: "Proteinoteka",
    locale: "hr_HR",
    type: "website",
    images: [{ url: "https://proteinoteka.com.hr/opengraph-image", width: 1200, height: 630, alt: "Proteinoteka" }],
  },
  twitter: {
    title: "Kazein Protein u Hrvatskoj 2026 | Proteinoteka",
    description: "Usporedi cijene kazein proteina iz svih hrvatskih trgovina.",
  },
};

export default async function Page() {
  const products = await fetchTopProducts({
    category: "casein",
    sortBy: "valueScore",
    limit: 15,
  });

  const top = products[0];

  const quickAnswer = top
    ? `Kazein protein s najboljim value scoreom u Hrvatskoj trenutno je ${top.name} (${top.storeName}) za ${top.price} — value score ${top.valueScore?.toFixed(1) ?? "N/A"}/10.`
    : "";

  return (
    <SEOLandingPage
      h1="Kazein Protein u Hrvatskoj — Usporedi cijene"
      intro="Kazein je protein sporije apsorpcije, idealan za konzumaciju prije spavanja kako bi se mišići oporavljali kroz noć. Pratimo aktualne cijene kazein proteina iz svih hrvatskih trgovina i računamo isplativost u EUR po gramu proteina."
      quickAnswer={quickAnswer}
      products={products}
      listHeading="Kazein proteini — rang lista po value score"
      tableCaption="Kazein protein cijene u Hrvatskoj — aktualna usporedba"
      currentSlug="kazein-protein-hrvatska"
      faqs={[
        {
          q: "Zašto se kazein protein uzima prije spavanja?",
          a: "Kazein se probavlja sporije od wheya — otpušta aminokiseline 5–7 sati, dok spavaš. To znači da mišići imaju kontinuirani dotok gradivnih materijala kroz noć. Whey je brz (idealan posttrenažno), kazein je spor (idealan navečer).",
        },
        {
          q: "Je li kazein bolji od wheya?",
          a: "Nisu zamjena jedan za drugog — imaju različite uloge. Whey je optimalan odmah nakon treninga zbog brze apsorpcije. Kazein je bolji izbor navečer ili između obroka kada želiš dugotrajan osjećaj sitosti i oporavak mišića. Mnogi sportaši koriste oboje.",
        },
        {
          q: "Koliko kazein proteina treba uzimati?",
          a: "Tipična doza je 25–40g kazein proteina navečer. Ako uzimate ukupno 1.6–2.2g proteina po kg tjelesne težine dnevno, kazein može pokriti 20–30% toga. Ostatak dolazi iz hrane i eventualno wheya.",
        },
        {
          q: "Koji kazein protein je najisplativiji u Hrvatskoj?",
          a: "Na Proteinoteci kazein proteini su sortirani po value scoreu — pokazatelju koji uzima u obzir cijenu, sadržaj proteina i nutritivni profil. Lista iznad pokazuje trenutno najisplativije opcije u Hrvatskoj.",
        },
      ]}
    />
  );
}
