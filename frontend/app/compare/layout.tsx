import { Metadata } from "next";
import { CURRENT_MARKET, MARKET_CONFIG } from "@/lib/marketConfig";

const BASE_URL = `https://${MARKET_CONFIG[CURRENT_MARKET].domain}`;

export const metadata: Metadata = {
  title: CURRENT_MARKET === "hr" ? "Usporedba proteina" : "Poređenje proteina",
  description:
    CURRENT_MARKET === "hr"
      ? "Usporedi do 4 proteinska suplementa jedan pored drugog — cijena, proteini, masti, šećeri, kalorije i Value Score na jednom mjestu."
      : "Poredi do 4 proteinska suplementa jedan pored drugog — cena, proteini, masti, šećeri, kalorije i Value Score na jednom mestu.",
  alternates: { canonical: `${BASE_URL}/compare` },
  openGraph: {
    title: CURRENT_MARKET === "hr" ? "Usporedba proteina | Proteinoteka" : "Poređenje proteina | Proteinoteka",
    description:
      CURRENT_MARKET === "hr"
        ? "Usporedi do 4 proteinska suplementa jedan pored drugog — cijena, proteini i value score na jednom mjestu."
        : "Poredi do 4 proteinska suplementa jedan pored drugog — cena, proteini i value score na jednom mestu.",
    url: `${BASE_URL}/compare`,
    siteName: "Proteinoteka",
    locale: MARKET_CONFIG[CURRENT_MARKET].ogLocale,
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
