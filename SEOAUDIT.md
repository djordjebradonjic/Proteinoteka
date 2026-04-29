# SEO Audit — Proteinoteka

## Implemented

### Structured Data (JSON-LD)
- **Organization schema** — injected in `app/layout.tsx` (applies site-wide). Includes name, URL, logo, description, email, areaServed.
- **Product + BreadcrumbList schema** — injected in `app/product/[id]/layout.tsx` (server component). Product schema includes name, image, brand, description (stripped of HTML), price, currency, availability, URL. BreadcrumbList reflects Home → Category → Product.
- **BreadcrumbList schema** — injected in `app/kategorija/[slug]/page.tsx` (server component). Reflects Home → Category.
- **BreadcrumbList schema** — injected in `components/seo/SEOLandingPage.tsx` (server component). Applied to all 5 SEO landing pages automatically.

### Metadata Per Page
- **Root layout** (`app/layout.tsx`) — default title template `%s | Proteinoteka`, default description, default OG image, robots, Google verification. Already existed; extended with `alternates.languages` (sr-RS hreflang).
- **Homepage** (`app/page.tsx`) — title, description, keywords, OG, Twitter, robots, canonical, hreflang. Updated canonical from relative `"/"` to absolute URL and added `languages: { "sr-RS": ... }`.
- **Product pages** (`app/product/[id]/layout.tsx`) — `generateMetadata` fetches product from API and returns per-product title, description, canonical, OG with product image. Already existed.
- **Category pages** (`app/kategorija/[slug]/page.tsx`) — `generateMetadata` with slug-to-label mapping. Already existed; updated canonical to absolute URL and added `languages` hreflang.
- **SEO landing pages** (5 pages) — static `export const metadata` with title, description, canonical, OG. Already existed.
- **Privacy Policy / Terms of Use** — static metadata with canonical. Already existed.
- **Kontakt page** — added `app/kontakt/layout.tsx` with metadata (title, description, canonical, OG). Was missing.
- **Compare page** — added `app/compare/layout.tsx` with metadata (title, description, canonical, robots noindex). Was missing.
- **Admin page** — added `app/admin/layout.tsx` with `robots: { index: false, follow: false }`. Was missing.

### Sitemap (`app/sitemap.ts`)
- Includes all 6 category pages (`/kategorija/[slug]`).
- Includes all 5 SEO landing pages (added: `/najbolji-whey-protein-srbija`, `/najjeftiniji-whey-protein`, `/whey-protein-cena`, `/whey-isolate-srbija`, `/protein-za-masu`).
- Dynamically fetches all product IDs via `/api/v1/products/ids` and generates `/product/[id]` entries.
- Includes static pages: home, privacy-policy, terms-of-use, kontakt.
- Revalidates every hour.

### Robots (`app/robots.ts`)
- Allows all user agents.
- Disallows: `/api/`, `/admin/`, `/private/`, `/checkout/`, `/cart/`, `/account/` (expanded from original).
- Points to `https://proteinoteka.rs/sitemap.xml`.

### Canonical URLs
- All canonical URLs updated from relative paths (e.g. `"/"`) to absolute URLs (`"https://proteinoteka.rs"`).
- Product pages: canonical per product ID.
- Category pages: canonical per slug.
- SEO landing pages: canonical per slug.

### Hreflang
- Root layout: `alternates.languages: { "sr-RS": "https://proteinoteka.rs" }` — applies as default.
- Homepage: explicit `languages: { "sr-RS": ... }` added.
- Category pages: `languages: { "sr-RS": ... }` added per slug.

### Image Alt Text
- `ProductCard.tsx` — product image already had `alt={product.name}`. Fallback image also had `alt={product.name}`.
- `ProductCard.tsx` — wishlist button `aria-label` improved from generic "Dodaj u wish listu" to dynamic `"Dodaj ${product.name} na listu željenih"` / `"Ukloni ${product.name} sa liste željenih"`.
- `app/product/[id]/page.tsx` — product image has `alt={product.name}`. Similar product images have `alt={p.name}`.
- `SEOLandingPage.tsx` — compare shortcut images have `alt={p.name}`.
- `Header.tsx` — SVG logo has `<title>Proteinoteka logo</title>` inside, serving as accessible name.
- `Footer.tsx` — SVG logo has `aria-label="Proteinoteka logo"`.

---

## Not Automated (Manual Action Required)

- **Unique product descriptions** — No `description` field populated for most products in the DB (scrapers don't extract it). The JSON-LD description falls back to the HTML-stripped product description only when available. Consider adding a description scraping step or AI-generated summaries via `AiNutritionService`.
- **Real OG images per product** — Product OG uses the scraped product image directly (variable quality/dimensions). Ideal: 1200×630 rendered thumbnails per product. Requires a separate image generation pipeline or OG image route (`app/product/[id]/opengraph-image.tsx`).
- **Google Search Console** — Submit `https://proteinoteka.rs/sitemap.xml` via Google Search Console. The Google verification tag is already present (`KG3Xm4xm-dKMX6kadJDsoEYZKUx8a_0LqrF98S-Cl4g`).
- **Bing Webmaster Tools** — Submit sitemap for Bing indexing.
- **logo.png** — Organization schema references `https://proteinoteka.rs/logo.png`. Ensure this file exists in `/public/logo.png` as a square PNG (minimum 112×112 px, ideally 512×512).
- **`/public/robots.txt`** — There is no static `public/robots.txt`. The dynamic `app/robots.ts` handles this correctly via Next.js — no action needed, but verify by visiting `https://proteinoteka.rs/robots.txt` after deployment.

---

## Database / URL Fields Needing Attention

- `product.description` — Currently NULL for most products. Populating this improves JSON-LD Product schema and on-page SEO.
- `product.productUrl` — Used for affiliate click-out; ensure stored values are canonical store URLs, not search result pages.
- Product IDs are numeric (`/product/123`) — URL is not human-readable. Migrating to slugs (e.g. `/product/optimum-nutrition-gold-standard-whey`) would improve click-through rate but requires backend migration and 301 redirects. Deferred intentionally.

---

## Recommended Next Steps

1. **Dynamic OG images** — Add `app/product/[id]/opengraph-image.tsx` using Next.js Image Response API to render a branded 1200×630 card per product with name, price, and brand.
2. **Product descriptions** — Feed AI-generated descriptions (via existing `AiNutritionService`) into the `description` column for the top 50 products.
3. **Schema: ItemList on homepage** — Add `ItemList` JSON-LD on the homepage listing top products for rich result eligibility.
4. **Schema: FAQPage** — Add FAQ schema to SEO landing pages (e.g. "Koji je najjeftiniji whey protein?" with the dynamic quick-answer text as the answer).
5. **Internal linking** — Add more cross-links between category pages and product pages to distribute PageRank.
6. **Core Web Vitals** — Monitor via Google Search Console. The ISR setup (60s revalidate on homepage) and image optimization are already in place.
7. **Structured data testing** — Validate JSON-LD via Google's Rich Results Test after deployment: https://search.google.com/test/rich-results
