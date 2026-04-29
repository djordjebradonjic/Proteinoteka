import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Poređenje proteina",
  description:
    "Poredi do 4 proteinska suplementa jedan pored drugog — cena, proteini, masti, šećeri, kalorije i Value Score na jednom mestu.",
  alternates: { canonical: "https://proteinoteka.rs/compare" },
  openGraph: {
    title: "Poređenje proteina | Proteinoteka",
    description:
      "Poredi do 4 proteinska suplementa jedan pored drugog — cena, proteini i value score na jednom mestu.",
    url: "https://proteinoteka.rs/compare",
    siteName: "Proteinoteka",
    locale: "sr_RS",
    type: "website",
  },
  robots: { index: false, follow: true },
};

export default function CompareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
