import { Metadata } from "next";
import { CURRENT_MARKET, MARKET_CONFIG } from "@/lib/marketConfig";

const isHR = CURRENT_MARKET === "hr";
const domain = `https://${MARKET_CONFIG[CURRENT_MARKET].domain}`;

export const metadata: Metadata = {
  title: "Kontakt",
  description: isHR
    ? "Kontaktiraj tim Proteinoteke — pitanja, prijedlozi ili prijave grešaka. Odgovaramo obično unutar 24 sata."
    : "Kontaktiraj tim Proteinoteke — pitanja, sugestije ili prijave grešaka. Odgovorimo obično unutar 24 sata.",
  alternates: { canonical: `${domain}/kontakt` },
  openGraph: {
    title: "Kontakt | Proteinoteka",
    description: isHR
      ? "Pošalji nam poruku — odgovaramo obično unutar 24h."
      : "Pošalji nam poruku — odgovorimo obično unutar 24h.",
    url: `${domain}/kontakt`,
    siteName: "Proteinoteka",
    locale: isHR ? "hr_HR" : "sr_RS",
    type: "website",
  },
};

export default function KontaktLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
