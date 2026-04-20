import HomeContent from "@/components/HomeContent";
import { Metadata } from "next";


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
    canonical: "/",
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
        url: "/opengraph-image.png",
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
    images: ["/opengraph-image.png"],
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
      `${process.env.NEXT_PUBLIC_API_URL}/products?page=0&size=12&sort=id,desc`,
      { next: { revalidate: 3600 } } // cache 1h
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

export default async function Home() {
  const initialData = await getInitialProducts();
  return <HomeContent initialProducts={initialData.content} initialTotalPages={initialData.totalPages} />;
}