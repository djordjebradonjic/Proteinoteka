import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  output: "standalone",
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options",    value: "nosniff" },
          { key: "X-Frame-Options",            value: "SAMEORIGIN" },
          { key: "Referrer-Policy",            value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security",  value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Permissions-Policy",         value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
  async redirects() {
    // HR-only pages — redirect to proteinoteka.com.hr when accessed on proteinoteka.rs
    const hrPagesOnRs = [
      '/whey-protein-cijena',
      '/najjeftiniji-whey-protein-hrvatska',
      '/najbolji-whey-protein-hrvatska',
      '/whey-isolate-hrvatska',
      '/biljni-protein-hrvatska',
      '/hidrolizat-protein-hrvatska',
      '/kazein-protein-hrvatska',
      '/whey-protein-do-20-eura',
      '/whey-protein-do-40-eura',
      '/najjeftiniji-whey-protein-hrvatska-do-500g',
      '/najjeftiniji-whey-protein-hrvatska-1500g-2500g',
      '/najjeftiniji-whey-protein-hrvatska-2500g-3500g',
      '/najjeftiniji-whey-protein-hrvatska-3500g-4500g',
      '/najjeftiniji-whey-protein-hrvatska-4500g-plus',
    ].map((source) => ({
      source,
      has: [{ type: 'host' as const, value: 'proteinoteka.rs' }],
      destination: `https://proteinoteka.com.hr${source}`,
      permanent: true,
    }));

    // RS-only pages — redirect to proteinoteka.rs when accessed on proteinoteka.com.hr
    const rsPagesOnHr = [
      '/najjeftiniji-whey-protein',
      '/najbolji-whey-protein-srbija',
      '/whey-protein-cena',
      '/whey-isolate-srbija',
      '/protein-za-masu',
      '/whey-protein-do-3000-dinara',
      '/whey-protein-do-5000-dinara',
      '/kazein-protein-srbija',
      '/biljni-protein-srbija',
      '/hidrolizat-protein-srbija',
      '/gold-standard-whey-cena',
      '/optimum-nutrition-proteini',
      '/scitec-nutrition-proteini',
      '/dymatize-proteini',
      '/biotech-usa-proteini',
      '/ultimate-nutrition-proteini',
      '/ogistrashop-proteini',
      '/supplementshop-proteini',
      '/pansport-proteini',
      '/fitlab-proteini',
      '/gymbeam-proteini',
      '/myprotein-proteini',
      '/proteinbox-proteini',
      '/proteini-si-srbija',
      '/lama-proteini',
      '/shopbuilder-proteini',
      '/supplement-store-proteini',
      '/xsport-proteini',
      '/najjeftiniji-whey-protein-do-500g',
      '/najjeftiniji-whey-protein-1500g-2500g',
      '/najjeftiniji-whey-protein-2500g-3500g',
      '/najjeftiniji-whey-protein-3500g-4500g',
      '/najjeftiniji-whey-protein-4500g-plus',
    ].map((source) => ({
      source,
      has: [{ type: 'host' as const, value: 'proteinoteka.com.hr' }],
      destination: `https://proteinoteka.rs${source}`,
      permanent: true,
    }));

    return [
      // Canonical host: always redirect www → non-www (permanent 301)
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.proteinoteka.rs' }],
        destination: 'https://proteinoteka.rs/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.proteinoteka.com.hr' }],
        destination: 'https://proteinoteka.com.hr/:path*',
        permanent: true,
      },
      // Cross-market redirects — prevent wrong-market pages from being indexed
      ...hrPagesOnRs,
      ...rsPagesOnHr,
      // Serbian guides accessed on HR domain → RS (wildcard, covers all /vodici/*)
      {
        source: '/vodici',
        has: [{ type: 'host' as const, value: 'proteinoteka.com.hr' }],
        destination: 'https://proteinoteka.rs/vodici',
        permanent: true,
      },
      {
        source: '/vodici/:path*',
        has: [{ type: 'host' as const, value: 'proteinoteka.com.hr' }],
        destination: 'https://proteinoteka.rs/vodici/:path*',
        permanent: true,
      },
      // Croatian guides accessed on RS domain → HR (wildcard, covers all /hr-vodici/*)
      {
        source: '/hr-vodici',
        has: [{ type: 'host' as const, value: 'proteinoteka.rs' }],
        destination: 'https://proteinoteka.com.hr/hr-vodici',
        permanent: true,
      },
      {
        source: '/hr-vodici/:path*',
        has: [{ type: 'host' as const, value: 'proteinoteka.rs' }],
        destination: 'https://proteinoteka.com.hr/hr-vodici/:path*',
        permanent: true,
      },
      // Legacy redirects
      { source: '/kako-racunamo', destination: '/kako-racunamo-value-score', permanent: true },
      { source: '/brendovi',      destination: '/',                           permanent: true },
      { source: '/blog',          destination: '/vodici',                     permanent: true },
      { source: '/korpa',         destination: '/',                           permanent: true },
      { source: '/wishlist',      destination: '/',                           permanent: true },
    ];
  },
  experimental: {
    scrollRestoration: true,
  },
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.pansport.rs" },
      { protocol: "https", hostname: "pansport.rs" },
      { protocol: "https", hostname: "**.proteinisi.rs" },
      { protocol: "https", hostname: "proteinisi.rs" },
      { protocol: "https", hostname: "**.proteinbox.rs" },
      { protocol: "https", hostname: "proteinbox.rs" },
      { protocol: "https", hostname: "**.supplementshop.rs" },
      { protocol: "https", hostname: "supplementshop.rs" },
      { protocol: "https", hostname: "**.ogistra-nutrition-shop.com" },
      { protocol: "https", hostname: "ogistra-nutrition-shop.com" },
      { protocol: "https", hostname: "**.fitlab.rs" },
      { protocol: "https", hostname: "fitlab.rs" },
      // fallback for any other store added later
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
    formats: ["image/webp"],
    // Scraped product images change at most weekly; 30-day cache minimizes re-optimization
    minimumCacheTTL: 60 * 60 * 24 * 30,
    // Remove 750 (redundant between 640/828), 2048 and 3840 (no product image renders at 4K)
    deviceSizes: [640, 828, 1080, 1200, 1920],
    // Add 192 so 80px images at 2× DPR request 192px instead of jumping to 256px
    imageSizes: [48, 64, 96, 128, 192, 256, 384],
  },
};

export default withNextIntl(nextConfig);
