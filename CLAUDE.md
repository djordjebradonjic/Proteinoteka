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
docker-compose up          # Start PostgreSQL 16 (port 5432)
```

No test suite exists yet in either sub-project.

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

Query params: `name`, `brand`, `store`, `minPrice`, `maxPrice`, `sort`, `page`, `size`.

Filtering is implemented via JPA `Specification` chaining in `ProductSpecifications.java`. **`valueScore` sorting is done in-memory** (computed field, not a DB column) after the query returns.

### Scrapers

`ScraperService` orchestrates individual store scrapers (one class per store). Sites with JavaScript rendering use Playwright; static sites use JSoup. Scraping is scheduled weekly (Monday 3 AM, cron `0 0 3 * * MON`) via `ScrapingScheduler`.

### Data enrichment pipeline

1. Raw scrape → `NutritionParserService` (regex-based extraction)
2. Fallback → `AiNutritionService` (Anthropic API, env var `ANTHROPIC_API_KEY`)
3. Brand normalization → `BrandNormalizerService` (fuzzy matching via FuzzyWuzzy)

### Database

PostgreSQL with Flyway migrations (`src/main/resources/db/migration/`, V1–V10). Key tables: `products`, `stores`, `price_history`, `brand_reputation`, `product_flavours`, `product_package_weights`.

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
DATABASE_PASSWORD=proteinoteka_19032026
ANTHROPIC_API_KEY=...
PLAYWRIGHT_EXECUTABLE_PATH=...   # optional, for scraper browser
```

---

## CORS

Backend allows: `localhost:3000`, `proteinoteka.rs`, `www.proteinoteka.rs` (configured in `CorsConfig`).
