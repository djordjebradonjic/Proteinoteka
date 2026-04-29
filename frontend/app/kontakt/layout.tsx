import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kontakt",
  description:
    "Kontaktiraj tim Proteinoteke — pitanja, sugestije ili prijave grešaka. Odgovorimo obično unutar 24 sata.",
  alternates: { canonical: "https://proteinoteka.rs/kontakt" },
  openGraph: {
    title: "Kontakt | Proteinoteka",
    description: "Pošalji nam poruku — odgovorimo obično unutar 24h.",
    url: "https://proteinoteka.rs/kontakt",
    siteName: "Proteinoteka",
    locale: "sr_RS",
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
