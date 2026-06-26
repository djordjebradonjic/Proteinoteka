import { Metadata } from "next";
import { fetchTopProducts } from "@/lib/seo-data";
import { SEOLandingPage } from "@/components/seo/SEOLandingPage";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: "Biljni Protein u Hrvatskoj 2026 — Usporedi cijene | Proteinoteka" },
  description:
    "Pronađi najisplativiji biljni (vegan) protein u Hrvatskoj. Uspoređujemo aktualne cijene iz svih trgovina i računamo EUR po gramu proteina.",
  alternates: { canonical: "https://proteinoteka.com.hr/biljni-protein-hrvatska" },
  openGraph: {
    title: "Biljni Protein u Hrvatskoj — Usporedi cijene | Proteinoteka",
    description: "Aktualne cijene biljnih proteina iz hrvatskih trgovina. Sortirano po value scoreu.",
    url: "https://proteinoteka.com.hr/biljni-protein-hrvatska",
    siteName: "Proteinoteka",
    locale: "hr_HR",
    type: "website",
    images: [{ url: "https://proteinoteka.com.hr/opengraph-image", width: 1200, height: 630, alt: "Proteinoteka" }],
  },
  twitter: {
    title: "Biljni Protein u Hrvatskoj 2026 | Proteinoteka",
    description: "Usporedi cijene biljnih proteina iz svih hrvatskih trgovina.",
  },
};

export default async function Page() {
  const products = await fetchTopProducts({
    category: "vegan",
    sortBy: "valueScore",
    limit: 15,
  });

  const top = products[0];

  const quickAnswer = top
    ? `Biljni protein s najboljim value scoreom u Hrvatskoj trenutno je ${top.name} (${top.storeName}) za ${top.price} — value score ${top.valueScore?.toFixed(1) ?? "N/A"}/10.`
    : "";

  return (
    <SEOLandingPage
      h1="Biljni Protein u Hrvatskoj — Usporedi cijene"
      intro="Biljni proteini idealni su za vegane, vegeterijance i sve koji žele izbjeći mliječne proizvode. Pratimo aktualne cijene iz svih hrvatskih trgovina i računamo isplativost u EUR po gramu proteina — neovisno o brendu ili prodavaonici."
      quickAnswer={quickAnswer}
      products={products}
      listHeading="Biljni proteini — rang lista po value score"
      tableCaption="Biljni protein cijene u Hrvatskoj — aktualna usporedba"
      currentSlug="biljni-protein-hrvatska"
      faqs={[
        {
          q: "Koji biljni protein ima najviše proteina?",
          a: "Proteini soje i graška tipično imaju 70–85% proteina na 100g — usporedivo s whey koncentratom. Rižin protein je malo niži (60–70%). Na Proteinoteci svaki proizvod prikazuje točan sadržaj proteina na 100g pa možeš lako usporediti.",
        },
        {
          q: "Je li biljni protein jednako dobar kao whey?",
          a: "Za izgradnju mišića, kombinacija graška i riže postiže slične rezultate kao whey jer zajedno pokrivaju sve esencijalne aminokiseline. Sam grašak ili riža imaju nešto nepotpuniji aminokiselinski profil. Sojin protein ima profil najbliži wheyu od svih biljnih proteina.",
        },
        {
          q: "Zašto su biljni proteini skuplji od wheya?",
          a: "Ekstrakcija proteina iz biljaka je složenija i skuplja od prerade sirutke (whey). Ipak, razlike se smanjuju — sve više brendova uvodi pristupačne biljne opcije. Na Proteinoteci uvijek možeš pronaći trenutno najpovoljniju opciju.",
        },
        {
          q: "Koji biljni protein preporučuješ za početnike?",
          a: "Graškov protein je dobar izbor za početnike — visok sadržaj proteina, blagi okus i dobra probavljivost. Mješavine graška i riže daju potpuniji aminokiselinski profil. Value score na Proteinoteci uzima sve to u obzir pri rangiranju.",
        },
      ]}
    />
  );
}
