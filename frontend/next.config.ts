import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
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

export default nextConfig;
