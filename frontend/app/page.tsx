import HomeContent from "@/components/HomeContent";
import { Metadata } from "next";
import { Suspense } from "react";
import { fetchTopProducts, fetchTopValueProducts, fetchPriceDropProducts } from "@/lib/seo-data";
import { productUrl } from "@/lib/productUrl";
import { CURRENT_MARKET, MARKET_CONFIG } from "@/lib/marketConfig";

// useSearchParams() now lives only inside ProductSection (wrapped in its own Suspense)
// and inside mini SearchSync/CategorySync components (each in their own Suspense).
// The outer page and HomeContent are free of useSearchParams → static generation works.
export const revalidate = 21600;

const PAGE_SEO = {
  rs: {
    title: "Proteinoteka – Uporedi cene proteina u Srbiji",
    description: "Pronađi najisplativiji whey protein u Srbiji. Poredimo cene iz svih većih prodavnica i računamo RSD po gramu proteina – tako uvek znaš da li je kupovina vredna.",
    keywords: ["whey protein srbija", "najjeftiniji protein srbija", "uporedi cene proteina", "protein cena po gramu", "suplementi srbija cena", "isplativ protein", "pansport proteini cena", "proteini.si cena", "proteinbox cena", "whey izolat srbija", "kreatin srbija cena", "protein kalkulator srbija"],
    canonical: "https://proteinoteka.rs",
    ogLocale: "sr_RS",
    ogTitle: "Proteinoteka – Da li je tvoj protein vredan novca?",
    ogDescription: "Poredimo cene whey proteina, izolata i kreatina iz svih srpskih prodavnica. Videćeš tačno koliko platiš po gramu proteina i gde je najisplativija kupovina.",
    twitterTitle: "Proteinoteka – Najisplativiji protein u Srbiji",
    twitterDescription: "Poredimo cene proteina iz svih prodavnica i računamo RSD/g proteina. Znaćeš uvek gde je najpametnije kupiti.",
    schemaName: "Najbolji whey proteini u Srbiji",
    schemaDescription: "Top 10 protein suplemenata po vrednosti na srpskom tržištu",
  },
  hr: {
    title: "Proteinoteka – Usporedi cijene proteina u Hrvatskoj",
    description: "Pronađi najjeftiniji whey protein u Hrvatskoj. Uspoređujemo cijene iz najvećih trgovina i računamo EUR/100g proteina – tako uvijek znaš je li kupovina isplativa.",
    keywords: ["whey protein hrvatska", "najjeftiniji protein hrvatska", "usporedi cijene proteina", "cijena proteina po gramu", "suplementi hrvatska cijena", "isplativ protein", "gymbeam hrvatska", "polleo sport cijena", "myprotein hrvatska", "whey izolat hrvatska", "kreatin hrvatska cijena"],
    canonical: "https://proteinoteka.com.hr",
    ogLocale: "hr_HR",
    ogTitle: "Proteinoteka – Je li tvoj protein vrijedan novca?",
    ogDescription: "Uspoređujemo cijene whey proteina, izolata i kreatina iz najvećih hrvatskih trgovina. Vidjet ćeš točno koliko plaćaš po gramu proteina i gdje je najisplativija kupnja.",
    twitterTitle: "Proteinoteka – Najisplativiji protein u Hrvatskoj",
    twitterDescription: "Uspoređujemo cijene proteina iz svih trgovina i računamo EUR/100g proteina. Uvijek ćeš znati gdje je najpametnije kupiti.",
    schemaName: "Najbolji whey proteini u Hrvatskoj",
    schemaDescription: "Top 10 proteinskih suplemenata po vrijednosti na hrvatskom tržištu",
  },
} as const;

const seo = PAGE_SEO[CURRENT_MARKET];
const marketDomain = `https://${MARKET_CONFIG[CURRENT_MARKET].domain}`;

export const metadata: Metadata = {
  title: {
    default: seo.title,
    template: "%s | Proteinoteka",
  },
  description: seo.description,
  keywords: [...seo.keywords],
  authors: [{ name: "Proteinoteka", url: marketDomain }],
  creator: "Proteinoteka",
  metadataBase: new URL(marketDomain),
  alternates: {
    canonical: seo.canonical,
  },
  openGraph: {
    type: "website",
    locale: seo.ogLocale,
    url: marketDomain,
    siteName: "Proteinoteka",
    title: seo.ogTitle,
    description: seo.ogDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: seo.twitterTitle,
    description: seo.twitterDescription,
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "KG3Xm4xm-dKMX6kadJDsoEYZKUx8a_0LqrF98S-Cl4g",
  },
};

async function getInitialProducts() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products?page=0&size=12&sort=valueScore,desc&market=${process.env.NEXT_PUBLIC_MARKET ?? 'rs'}`,
      { next: { revalidate: 21600 } },
    );
    const data = await res.json();
    return {
      content: data.content ?? [],
      totalPages: data.page?.totalPages ?? 0,
      totalItems: data.page?.totalElements ?? 0,
    };
  } catch {
    return { content: [], totalPages: 0, totalItems: 0 };
  }
}

export default async function Home() {
  const [initialData, topProducts, topValueProducts, priceDropProducts] = await Promise.all([
    getInitialProducts(),
    fetchTopProducts({ sortBy: "valueScore", limit: 10 }),
    fetchTopValueProducts(8),
    fetchPriceDropProducts(8),
  ]);

  const top10 = topProducts.slice(0, 10);
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: seo.schemaName,
    description: seo.schemaDescription,
    numberOfItems: top10.length,
    itemListElement: top10.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: p.name,
      url: `${marketDomain}${productUrl(p)}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <Suspense fallback={<div className="min-h-screen" />}>
        <HomeContent
          initialProducts={initialData.content}
          initialTotalPages={initialData.totalPages}
          initialTotalItems={initialData.totalItems}
          topValueProducts={topValueProducts}
          priceDropProducts={priceDropProducts}
        />
      </Suspense>
    </>
  );
}