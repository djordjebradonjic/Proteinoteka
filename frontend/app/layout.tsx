import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/react";
import Script from "next/script";
import "./globals.css";
import Providers from "@/components/Providers";
import { DM_Sans } from "next/font/google";
import Footer from "@/components/Footer";

// Variable font: one file covers all weights instead of 5 separate requests
const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#1B2B4B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
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
  // No global canonical here — each page sets its own via alternates.canonical
  // so inner pages never inherit the root URL as their canonical.
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
      <body className="min-h-full flex flex-col overflow-x-hidden">
        <Providers>
          {children} <Footer />
        </Providers>
        <Analytics />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Proteinoteka",
              url: "https://proteinoteka.rs",
              logo: "https://proteinoteka.rs/logo.png",
              description: "Poređenje cena proteinskih suplemenata u Srbiji",
              email: "kontakt@proteinoteka.rs",
              areaServed: "RS",
            }),
          }}
        />
        {/* lazyOnload: no <link rel="preload"> injected, fires after idle — keeps GA off the critical path */}
        <Script
          id="ga-init"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-JR077S64MV');
            `,
          }}
        />
        <Script
          id="ga-src"
          strategy="lazyOnload"
          src="https://www.googletagmanager.com/gtag/js?id=G-JR077S64MV"
        />
      </body>
    </html>
  );
}
