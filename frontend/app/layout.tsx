import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from "next/script";
import "./globals.css";
import Providers from "@/components/Providers";
import { DM_Sans } from "next/font/google";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { CURRENT_MARKET, MARKET_CONFIG } from "@/lib/marketConfig";

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

const MARKET_SEO = {
  rs: {
    title: "Proteinoteka | Uporedi cene proteina i suplemenata u Srbiji",
    description:
      "Pronađi najjeftiniji whey protein, izolat i kreatin u Srbiji. Upoređujemo aktuelne cene suplemenata i računamo isplativost u RSD po gramu proteina.",
    keywords: ["proteini srbija", "whey protein cena", "najbolji protein", "jeftini suplementi", "pansport", "proteini.si", "cena proteina po gramu"],
    ogTitle: "Gde je najjeftiniji protein u Srbiji? | Proteinoteka",
    ogDescription: "Uštedi na suplementaciji. Uporedi cene svih brendova i saznaj koji whey protein nudi najviše za tvoj novac.",
    ogLocale: "sr_RS",
    twitterTitle: "Najbolje cene proteina u Srbiji | Proteinoteka",
    twitterDescription: "Prestani da preplaćuješ suplemente. Uporedi cene odmah.",
    ogAlt: "Proteinoteka — Uporedi cene proteina u Srbiji",
  },
  hr: {
    title: "Proteinoteka | Usporedi cijene proteina i suplemenata u Hrvatskoj",
    description:
      "Pronađi najjeftiniji whey protein, izolat i kreatin u Hrvatskoj. Uspoređujemo aktualne cijene suplemenata i računamo isplativost u EUR po gramu proteina.",
    keywords: ["proteini hrvatska", "whey protein cijena", "najbolji protein hrvatska", "jeftini suplementi hrvatska", "gymbeam hrvatska", "polleo sport", "cijena proteina po gramu"],
    ogTitle: "Gdje je najjeftiniji protein u Hrvatskoj? | Proteinoteka",
    ogDescription: "Uštedi na suplementaciji. Usporedi cijene svih brendova i saznaj koji whey protein nudi najviše za tvoj novac.",
    ogLocale: "hr_HR",
    twitterTitle: "Najbolje cijene proteina u Hrvatskoj | Proteinoteka",
    twitterDescription: "Prestani preplaćivati suplemente. Usporedi cijene odmah.",
    ogAlt: "Proteinoteka — Usporedi cijene proteina u Hrvatskoj",
  },
} as const;

const seo = MARKET_SEO[CURRENT_MARKET];
const marketDomain = `https://${MARKET_CONFIG[CURRENT_MARKET].domain}`;

export const metadata: Metadata = {
  title: {
    default: seo.title,
    template: "%s | Proteinoteka",
  },
  description: seo.description,
  keywords: [...seo.keywords],
  authors: [{ name: "Proteinoteka", url: marketDomain }],
  creator: "Proteinoteka",
  metadataBase: new URL(marketDomain),
  // No global canonical here — each page sets its own via alternates.canonical
  // so inner pages never inherit the root URL as their canonical.
  openGraph: {
    type: "website",
    locale: seo.ogLocale,
    url: marketDomain,
    siteName: "Proteinoteka",
    title: seo.ogTitle,
    description: seo.ogDescription,
    images: [
      {
        url: `${marketDomain}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: seo.ogAlt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: seo.twitterTitle,
    description: seo.twitterDescription,
    images: [`${marketDomain}/opengraph-image`],
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${dmSans.variable} h-full antialiased font-[family-name:var(--font-dm-sans)]`}
    >
      <head>
        <link rel="alternate" hrefLang="sr" href="https://proteinoteka.rs" />
        <link rel="alternate" hrefLang="hr" href="https://proteinoteka.com.hr" />
        <link rel="alternate" hrefLang="x-default" href="https://proteinoteka.rs" />
      </head>
      <body className="min-h-full flex flex-col [overflow-x:clip]">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>
            {children} <Footer />
          </Providers>
          <Analytics />
          <SpeedInsights />
          <CookieBanner />
        </NextIntlClientProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Proteinoteka",
              url: marketDomain,
              logo: `${marketDomain}/logo.png`,
              description: CURRENT_MARKET === "hr"
                ? "Usporedba cijena proteinskih suplemenata u Hrvatskoj"
                : "Poređenje cena proteinskih suplemenata u Srbiji",
              email: CURRENT_MARKET === "hr"
                ? "kontakt@proteinoteka.com.hr"
                : "kontakt@proteinoteka.rs",
              areaServed: CURRENT_MARKET === "hr" ? "HR" : "RS",
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
              url: marketDomain,
              description: seo.description,
              inLanguage: MARKET_CONFIG[CURRENT_MARKET].locale,
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: `${marketDomain}/?query={search_term_string}`,
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
