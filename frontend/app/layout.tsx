import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from "next/script";
import "./globals.css";
import Providers from "@/components/Providers";
import { DM_Sans } from "next/font/google";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";

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
  },
  twitter: {
    card: "summary_large_image",
    title: "Najbolje cene proteina u Srbiji | Proteinoteka",
    description: "Prestani da preplaćuješ suplemente. Uporedi cene odmah.",
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
        <SpeedInsights />
        <CookieBanner />
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Proteinoteka",
              url: "https://proteinoteka.rs",
              description: "Poređenje cena proteina i suplemenata u Srbiji",
              inLanguage: "sr-RS",
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: "https://proteinoteka.rs/?query={search_term_string}",
                },
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        {/*
          GA Consent Mode — fires afterInteractive so localStorage is available.
          Sets analytics_storage=denied by default; upgrades to granted if user
          previously accepted. The gtag.js src is appended programmatically so
          consent default is guaranteed to be set before GA initializes.
        */}
        <Script
          id="ga-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              var _c = localStorage.getItem('cookie_consent');
              gtag('consent', 'default', {
                analytics_storage: _c === 'accepted' ? 'granted' : 'denied',
                ad_storage: 'denied',
                ad_user_data: 'denied',
                ad_personalization: 'denied',
              });
              gtag('js', new Date());
              gtag('config', 'G-JR077S64MV');
              var _s = document.createElement('script');
              _s.src = 'https://www.googletagmanager.com/gtag/js?id=G-JR077S64MV';
              _s.async = true;
              document.head.appendChild(_s);
            `,
          }}
        />
      </body>
    </html>
  );
}
