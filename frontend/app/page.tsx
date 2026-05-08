import HomeContent from "@/components/HomeContent";
import { Metadata } from "next";
import { Suspense } from "react";
import { fetchTopProducts, fetchTopValueProducts, fetchPriceDropProducts } from "@/lib/seo-data";

// useSearchParams() now lives only inside ProductSection (wrapped in its own Suspense)
// and inside mini SearchSync/CategorySync components (each in their own Suspense).
// The outer page and HomeContent are free of useSearchParams → static generation works.
export const revalidate = 21600;


export const metadata: Metadata = {
  title: {
    default: "Proteinoteka – Uporedi cene proteina u Srbiji",
    template: "%s | Proteinoteka",
  },
  description:
    "Pronađi najisplativiji whey protein u Srbiji. Poredimo cene iz svih većih prodavnica i računamo RSD po gramu proteina – tako uvek znaš da li je kupovina vredna.",

  keywords: [
    "whey protein srbija",
    "najjeftiniji protein srbija",
    "uporedi cene proteina",
    "protein cena po gramu",
    "suplementi srbija cena",
    "isplativ protein",
    "pansport proteini cena",
    "proteini.si cena",
    "proteinbox cena",
    "whey izolat srbija",
    "kreatin srbija cena",
    "protein kalkulator srbija",
  ],

  authors: [{ name: "Proteinoteka", url: "https://proteinoteka.rs" }],
  creator: "Proteinoteka",
  metadataBase: new URL("https://proteinoteka.rs"),

  alternates: {
    canonical: "https://proteinoteka.rs",
    languages: { "sr-RS": "https://proteinoteka.rs" },
  },

  openGraph: {
    type: "website",
    locale: "sr_RS",
    url: "https://proteinoteka.rs",
    siteName: "Proteinoteka",
    title: "Proteinoteka – Da li je tvoj protein vredan novca?",
    description:
      "Poredimo cene whey proteina, izolata i kreatina iz svih srpskih prodavnica. Videćeš tačno koliko platiš po gramu proteina i gde je najisplativija kupovina.",
    images: [
      {
        url: "/opengraph-image.jpg",
        width: 1200,
        height: 630,
        alt: "Proteinoteka – Poređenje cena proteina u Srbiji",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Proteinoteka – Najisplativiji protein u Srbiji",
    description:
      "Poredimo cene proteina iz svih prodavnica i računamo RSD/g proteina. Znaćeš uvek gde je najpametnije kupiti.",
    images: ["/opengraph-image.jpg"],
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
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products?page=0&size=12&sort=id,desc`,
      { next: { revalidate: 60 } },
    );
    const data = await res.json();
    return {
      content: data.content ?? [],
      totalPages: data.page?.totalPages ?? 0,
    };
  } catch {
    return { content: [], totalPages: 0 };
  }
}

const BASE_URL = "https://proteinoteka.rs";

export default async function Home() {
  const [initialData, topProducts, topValueProducts, priceDropProducts] = await Promise.all([
    getInitialProducts(),
    fetchTopProducts({ sortBy: "valueScore", limit: 10 }),
    fetchTopValueProducts(5),
    fetchPriceDropProducts(7, 5),
  ]);

  const top10 = topProducts.slice(0, 10);
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Najbolji whey proteini u Srbiji",
    description: "Top 10 protein suplemenata po vrednosti na srpskom tržištu",
    numberOfItems: top10.length,
    itemListElement: top10.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: p.name,
      url: `${BASE_URL}/product/${p.id}`,
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
          topValueProducts={topValueProducts}
          priceDropProducts={priceDropProducts}
        />
      </Suspense>
    </>
  );
}