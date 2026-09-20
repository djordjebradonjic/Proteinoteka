# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Proteinoteka** is a protein supplement price comparison site for Serbia. It has two independent sub-projects:

- `frontend/` — Next.js 16.2.4 (App Router, React 19, TypeScript, Tailwind CSS v4, shadcn UI, Redux Toolkit)
- `backend/` — Spring Boot 3.4.3 (Java 21, PostgreSQL, Flyway, JPA, Playwright/JSoup scrapers)

---

## Commands

### Frontend (`cd frontend`)

```bash
npm run dev       # Dev server at http://localhost:3000 (Turbopack)
npm run build     # Production build
npm run start     # Serve production build
npm run lint      # ESLint
```

### Backend (`cd backend`)

```bash
./mvnw spring-boot:run     # Run locally on port 8080
./mvnw clean package       # Build JAR
./mvnw test                # Unit + fixture tests (works offline: ./mvnw -o test)
docker-compose up          # Start PostgreSQL 16 (host port 5435)
```

The frontend has no test suite. In the backend, `BackendApplicationTests` and `PriceParserTest` are `@SpringBootTest` and need a reachable PostgreSQL (they also prove that Flyway V1–V61 applies and `ddl-auto: validate` passes): `application.yml` defaults to `localhost:5432` while docker-compose publishes 5435, so set `DATABASE_URL`/`DATABASE_USERNAME`/`DATABASE_PASSWORD` for the run. Never point tests at the production database — Flyway would migrate it. `MyProteinScraperTest.scrape_rebasesVariantUrlsWhenDetailPageRedirectsToAnotherProduct` already fails on `main`.

---

## Frontend Architecture

### Key conventions

- **App Router** with SSR on the home page (`app/page.tsx` fetches products server-side for initial render, then client-side filtering takes over).
- **Path alias**: `@/` maps to `frontend/` root (configured in `tsconfig.json`).
- **Tailwind CSS v4** — no `tailwind.config.js`; configured via PostCSS (`postcss.config.mjs`) and `components.json`. Use `@tailwindcss/postcss` semantics.
- **shadcn UI** (radix-nova style, Lucide icons). Add components via `npx shadcn@latest add <component>`.
- **Next.js 16.2.4 has breaking changes** vs. older versions — read `node_modules/next/dist/docs/` before writing Next.js-specific code.

### State management

Redux Toolkit with three slices in `store/`:

| Slice | Purpose |
|---|---|
| `wishlistSlice` | Persisted to `localStorage` |
| `compareSlice` | Up to 4 products, used by floating `CompareBar` |
| `cartSlice` | Cart state |

Use typed hooks from `store/hooks.ts` (`useAppDispatch`, `useAppSelector`).

### Data fetching

Axios instance in `lib/axios.ts` with `baseURL = process.env.NEXT_PUBLIC_API_URL + "/api/v1"`. All backend calls go through this instance. SSR calls in `app/page.tsx` use native `fetch` with the same base URL.

### URL-driven filtering

`HomeContent.tsx` drives product listing. Filters, sort, and pagination are synced to URL search params: `query`, `store`, `brand`, `minPrice`, `maxPrice`, `sort`, `page`.

### Contact form

`app/api/contact/route.ts` is a Next.js Route Handler that calls the Resend API server-side (`RESEND_API_KEY` env var). Never expose the key client-side.

---

## Backend Architecture

### REST API — `GET /api/v1/products`

Query params: `name`, `brand`, `store`, `minPrice`, `maxPrice`, `sort`, `page`, `size`, `productType`.

Every listing endpoint (products, search, top, top-value, price-drops, black-friday, brands, flavours, weight-distribution) answers for ONE product family and defaults to `protein`, so rows of another family (creatine) can never appear on protein pages, feeds or rankings unless `productType=` asks for them.

Filtering is implemented via JPA `Specification` chaining in `ProductSpecifications.java`. **`valueScore` sorting is done in-memory** (computed field, not a DB column) after the query returns.

### Scrapers

`ScraperService` orchestrates individual store scrapers (one class per store). Sites with JavaScript rendering use Playwright; static sites use JSoup. `ScrapingScheduler` runs a daily check (06:50 Europe/Belgrade) that dispatches scrapers via a 7-day rolling cycle in `ScrapingSchedulerService.SCHEDULE` — every store is scraped exactly once per week, with a randomized time within its assigned window and at most 2 heavy Playwright scrapers per day (each in its own non-overlapping window).

**Product types.** Protein is the core family, creatine the second (`products.product_type`, `ProductTypes`). `StoreScraper.listingTargets()` lists what ONE scrape run of a store walks, protein first (the default, from `getBaseUrl()`/`buildPageUrl()`), then optional `ListingTarget`s: `HtmlPaged` (the scraper's own parser: GymBeam, GymBeam HR, FitLab, SupplementStore, Ogistrashop, XSport, Lama, MyProtein, MyProtein HR, Proteini.si HR, Proteka — a scraper takes the family from `ListingFamily`, judges the listing title with `profile.rejectReason` before any detail fetch, and enriches creatine through `BaseScraperEnricher.enrichCreatineFromDescription` instead of the protein nutrition chain; a category that mixes families is `categoryTrusted=false`, e.g. MyProtein, which files an electrolyte drink and a vitamin pack under creatine) or `WooStoreApi` (a WooCommerce category as JSON via `WooStoreApiSource` — Proteini.si, Supplementshop, Proteini Outlet, Nutrition Shop HR; one or two small requests instead of a browser walk). `ScraperService` walks the targets in one browser context / proxy session and tracks stale products per type; a `ProductTypeProfile` (`ProteinProfile`, `CreatineProfile`, `CreatineParser` for form/type/dose/count) supplies acceptance, sanity ranges, price floor and type-specific merge. Extra types are off by default: `SCRAPING_TYPES_ENABLED=protein,creatine` (and `SCRAPING_TYPES_STORES_CREATINE=GymBeam,...` to stage stores); `POST /api/admin/scrape/store?name=<Store>&types=creatine` runs only that family and ignores the flag. A failed creatine target never triggers the 3h retry (it would double proxy traffic); Proteinbox (Woo Store API, ~43 KB per run, no browser navigation) and Pansport (its own HTML listing, `/kreatin`, 0-based `?page=`) run through the IPRoyal proxy: the first prod run of each is the transport test (`POST /api/admin/scrape/store?name=Proteinbox&types=creatine`, then read `scrape_log.proxy_bytes` and `error_message`, which says `woo-api-failed …` if Cloudflare blocks the API); Polleo Sport and Shopbuilder never get a creatine target. MyProtein/MyProtein HR expose only gram-sized creatine packs (a count-only `90 TABLETS`/`83servings` variant cannot be priced per gram yet) and key their tiers by grams, not by price/servings like protein. Store abbreviations glued to a count (`150cap`, `120kap`, `90tb`) are read by `CreatineParser`; noise found in real categories (BioTech `Supernova`, `1+1 PACK`, `LIMITED PACK`) is in `CreatineProfile`. Endpoints, AI jobs, data-quality audits, percentile ranks and `fitsGroup` are scoped per family. Adding a family = one profile bean + targets, no branching on the type string in the pipeline. Check a store's real data before wiring it (`WooStoreApiSourceTest` fixtures are captured API responses): the Croatian stores exposed missing weights and category noise that the Serbian ones did not.

### Data enrichment pipeline

1. Raw scrape → `NutritionParserService` (regex-based extraction)
2. Fallback → `AiNutritionService` (Anthropic API, env var `ANTHROPIC_API_KEY`)
3. Brand normalization → `BrandNormalizerService` (fuzzy matching via FuzzyWuzzy)

### Value score

All scoring logic lives in `ValueScoreCalculator` (pure, unit-tested; `ScraperService.calculateValueScore` and the admin recalculation only delegate). A product that can't be fairly scored gets `valueScore = null` with a `SkipReason` (bar/meal replacement/gainer, protein % contradicting the protein type or >95%, implausible price per gram, weight in name contradicting stored weight, missing data) — callers must store that null, never keep an older score. Beef/collagen: full penalty only when it is the protein source (name/`proteinSource`); a small one when it is just an ingredient (regex needs the `(?<!\p{L})` word boundary). Category benchmarks are calibrated to market medians; `GET /api/admin/data-quality` (`ValueScoreAudit`) reports stale scores, price/weight/protein outliers, cross-store inconsistency, unknown brands and benchmark drift — check it after big scrapes and re-run `POST /api/admin/recalculate-scores` after changing any scoring rule. New brands need a `brand_reputation` migration (unknown brands silently default to 4.5). Creatine is scored as a single price-per-gram-of-pack value against the measured market median (10 RSD/g, 0.085 EUR/g on 2026-09-19 from two stores per market; floor 0.35x, cap 4x): re-derive it from the wider catalogue once more stores carry creatine. Creatine sold by the piece (capsule, tablet, gummy) is never scored (`SkipReason.COUNTED_FORM`): its price per gram of creatine needs servings × dose, which stores almost never state (0 of the first 24 counted listings had both), so any benchmark would be a guess; `ValueScoreAudit` reports the gap once (`CREATINE_UNSCORED_COUNTED_FORMS`) and now audits creatine like protein (stale/implausible scores, `PRICE_OUTLIER`, `BENCHMARK_DRIFT` per market). Carbohydrate mixes under a creatine name (dextrose, Vitargo, Creaport) cost the same per gram as real bulk creatine, so `CreatineProfile` rejects them by name, not by price.

### Product groups (cross-store comparison)

`ProductGroupService.fitsGroup` is the single rule for "belongs in this group" (same market + brand, pack size within 5% of the members' *actual* average size — grams, or the exact piece count for a capsule/tablet/gummy via `sizeOf`; a group's `weight_grams` is that size and grams never meet pieces — same protein type via `groupingSource`, one listing per store, same product line via `ProductLineMatcher.sameProductLine`, which handles "IsoSensation" vs "Iso Sensation" and Serbian/English spellings). Auto-assignment and `ProductGroupAudit` both use it. `POST /api/admin/groups/auto-generate` first attaches ungrouped products to existing groups, then creates new ones; `POST /api/admin/groups/refresh` recomputes group weights and dissolves single-member groups. Membership is never re-validated automatically (ejecting a member can change the group's canonical product and its SEO URL) — `GET /api/admin/data-quality` reports `GROUP_*`, `DUPLICATE_GROUPS` and `UNGROUPED_*` findings to fix by hand with `DELETE`/`POST confirm` on `/api/admin/groups`.

### Database

PostgreSQL with Flyway migrations (`src/main/resources/db/migration/`, V1–V61). Key tables: `products`, `stores`, `price_history`, `brand_reputation`, `product_flavours`, `product_package_weights`.

### Swagger UI

Available at `http://localhost:8080/swagger-ui.html` when running locally.

---

## Environment Variables

### Frontend (`.env.local`)

```
NEXT_PUBLIC_API_URL=http://localhost:8080
RESEND_API_KEY=re_...
```

### Backend (`application.yml` / environment)

```
DATABASE_URL=jdbc:postgresql://localhost:5432/proteinoteka
DATABASE_USERNAME=proteinoteka_2026
DATABASE_PASSWORD=...             # never commit real values; local dev default is in application.yml
ANTHROPIC_API_KEY=...
PLAYWRIGHT_EXECUTABLE_PATH=...   # optional, for scraper browser
```

---

## CORS

Backend allows: `localhost:3000`, `proteinoteka.rs`, `www.proteinoteka.rs` (configured in `CorsConfig`).
