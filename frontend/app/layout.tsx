import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/react";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import Providers from "@/components/Providers";
import { DM_Sans } from "next/font/google";
import Footer from "@/components/Footer";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const viewport: Viewport = {
  themeColor: "#1B2B4B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: {
    default: "Proteinoteka | Uporedi cene proteina i suplemenata u Srbiji",
    template: "%s | Proteinoteka",
  },
  description:
    "Pronađi najjeftiniji whey protein, izolat i kreatin u Srbiji. Upoređujemo aktuelne cene suplemenata (Pansport, Proteini.si) i računamo isplativost u RSD po gramu proteina.",
  keywords: [
    "proteini srbija",
    "whey protein cena",
    "najbolji protein",
    "jeftini suplementi",
    "pansport",
    "proteini.si",
    "cena proteina po gramu",
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
    title: "Gde je najjeftiniji protein u Srbiji? | Proteinoteka",
    description:
      "Uštedi na suplementaciji. Uporedi cene svih brendova i saznaj koji whey protein nudi najviše za tvoj novac.",
    images: [
      {
        url: "/opengraph-image.jpg",
        width: 1200,
        height: 630,
        alt: "Proteinoteka grafika sa uporednim cenama suplemenata",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Najbolje cene proteina u Srbiji | Proteinoteka",
    description: "Prestani da preplaćuješ suplemente. Uporedi cene odmah.",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="sr"
      className={`${dmSans.variable} h-full antialiased font-[family-name:var(--font-dm-sans)]`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          {children} <Footer />
        </Providers>
        <Analytics />
        <GoogleAnalytics gaId="G-JR077S64MV" />
      </body>
    </html>
  );
}
