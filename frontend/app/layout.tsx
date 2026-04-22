import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from '@vercel/analytics/react';
import { GoogleAnalytics } from '@next/third-parties/google';
import "./globals.css";
import Providers from "@/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ─── Viewport podešavanja (Odvojeno od Metadata) ────────────
export const viewport: Viewport = {
  themeColor: "#0f172a", // Zameni bojom svog brenda (npr. tamno plava iz Tailwind-a)
  width: "device-width",
  initialScale: 1,
  maximumScale: 5, // Dozvoljava zoom radi pristupačnosti (Accessibility - SEO plus)
};



export const metadata: Metadata = {
  // ─── Osnovno ────────────────────────────────────────────────
  title: {
    default: "Proteinoteka | Uporedi cene proteina i suplemenata u Srbiji",
    template: "%s | Proteinoteka", 
  },
  description:
    "Pronađi najjeftiniji whey protein, izolat i kreatin u Srbiji. Upoređujemo aktuelne cene suplemenata (Pansport, Proteini.si) i računamo isplativost u RSD po gramu proteina.",
  
  // ─── Ključne reči (Google ih manje gleda, ali vrede za druge pretraživače)
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

  // ─── Open Graph (Za deljenje na Viberu, Instagramu, FB-u) ────
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
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Proteinoteka grafika sa uporednim cenama suplemenata",
      },
    ],
  },

  // ─── Twitter/X Card ─────────────────────────────────────────
  twitter: {
    card: "summary_large_image",
    title: "Najbolje cene proteina u Srbiji | Proteinoteka",
    description: "Prestani da preplaćuješ suplemente. Uporedi cene odmah.",
    images: ["/og-image.png"],
  },

  // ─── Robots i Indeksiranje ──────────────────────────────────
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col"><Providers>{children}</Providers>

        <Analytics />
        <GoogleAnalytics gaId="G-JR077S64MV" /></body>
    </html>
  );
}