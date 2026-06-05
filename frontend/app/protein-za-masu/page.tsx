import { Metadata } from "next";
import { fetchTopProducts } from "@/lib/seo-data";
import { SEOLandingPage } from "@/components/seo/SEOLandingPage";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: "Protein za Masu u Srbiji — Izbor i Cene | Proteinoteka" },
  description:
    "Koji protein je najbolji za izgradnju mišićne mase u Srbiji? Poredimo whey proteine i blendove po ceni, kalorijama i sadržaju proteina iz svih srpskih prodavnica.",
  alternates: { canonical: "https://proteinoteka.rs/protein-za-masu" },
  openGraph: {
    title: "Protein za Masu u Srbiji | Proteinoteka",
    description: "Pregled proteina za izgradnju mase dostupnih u Srbiji. Cene, kalorije, proteini.",
    url: "https://proteinoteka.rs/protein-za-masu",
    siteName: "Proteinoteka",
    locale: "sr_RS",
    type: "website",
  },
};

export default async function Page() {
  // Blend category for mass — concentrate if needed as fallback
  let products = await fetchTopProducts({
    category: "blend",
    sortBy: "valueScore",
    limit: 10,
  });

  // Supplement with concentrates if blends are scarce
  if (products.length < 6) {
    const concentrate = await fetchTopProducts({
      category: "whey_concentrate",
      sortBy: "valueScore",
      limit: 10,
    });
    const existingIds = new Set(products.map(p => p.id));
    const extra = concentrate.filter(p => !existingIds.has(p.id));
    products = [...products, ...extra].slice(0, 12);
  }

  const top = products[0];
  const highCalorie = products.length > 0
    ? [...products].sort((a, b) => (b.caloriePer100g ?? 0) - (a.caloriePer100g ?? 0))[0]
    : null;

  const quickAnswer = top
    ? `Za izgradnju mišićne mase bitan je kalorijski suficit i dovoljan unos proteina. ${top.name} trenutno nudi najbolji value score u ovoj kategoriji (${top.valueScore?.toFixed(1)}/10) za ${top.price}. Ako ti trebaju visoke kalorije, ${highCalorie?.name ?? top.name} ima najviše kalorija po 100g${highCalorie?.caloriePer100g ? ` (${highCalorie.caloriePer100g} kcal)` : ""}.`
    : "";

  return (
    <SEOLandingPage
      h1="Protein za Masu u Srbiji"
      intro="Za efikasno dobijanje mišićne mase potreban ti je proteinski suficit sa dovoljno kalorija. Poredimo whey proteine i blendove dostupne u Srbiji — sortiramo po vrednosti, kalorijama i ceni, da odabereš ono što funkcioniše za tvoj program."
      quickAnswer={quickAnswer}
      products={products}
      listHeading="Preporučeni proteini za masu — rang lista"
      tableCaption="Proteini za masu — cene i nutritivne vrednosti"
      currentSlug="protein-za-masu"
      faqs={[
        {
          q: "Koliko proteina dnevno treba za dobijanje mišićne mase?",
          a: "Standardna preporuka je 1,6–2,2 g proteina po kilogramu telesne mase dnevno. Za osobu od 80 kg to znači 128–176 g proteina dnevno. Whey protein suplement ti pomaže da dostigneš tu količinu kada ne možeš dovoljno uneti hranом — nije zamena za obroke, nego dopuna.",
        },
        {
          q: "Da li je dovoljan samo whey protein ili treba i gainer?",
          a: "Whey protein je dovoljan ako unosiš dovoljno kalorija iz hrane. Gainer (mass gainer) dodaje ugljene hidrate i kalorije uz proteine — korisno je ako ti je teško da jedete dovoljno. Ako ti nije problem unos kalorija, obični whey uz normalne obroke daje isti efekat uz manji trošak.",
        },
        {
          q: "Kada je najbolje vreme da se uzme whey protein?",
          a: "Najvažnije je ukupna dnevna količina proteina, ne tačno vreme. Međutim, whey posle treninga ubrzava oporavak mišića zahvaljujući brzoj apsorpciji. Jutarnji unos proteina also ima smisla ako preskačeš doručak bogat proteinima. Ne postoji magično vreme — bitno je dostići dnevni cilj.",
        },
        {
          q: "Koji proteinski prah je bolji za masu — concentrate ili blend?",
          a: "Oba su efikasna. Whey koncentrat je najisplativiji — solidan sadržaj proteina, dobre kalorije, pristupačna cena. Blend (mešavina koncentrata, izolata i kazeina) daje sporije otpuštanje proteina tokom vremena, što može biti korisno kao zamena za obrok ili pre sna. Za većinu korisnika u fazi mase, obični koncentrat radi posao.",
        },
      ]}
    />
  );
}
