# Proteinoteka

<div align="center">

**The only protein supplement price aggregator for Serbia.**  
Compares prices across 6 online stores, computes a proprietary Value Score, and surfaces the best deal automatically.

[![Live](https://img.shields.io/badge/live-proteinoteka.rs-FF9900?style=for-the-badge)](https://proteinoteka.rs)
&nbsp;
![Users](https://img.shields.io/badge/~1%2C000-monthly%20users-22c55e?style=for-the-badge)
&nbsp;
![Products](https://img.shields.io/badge/300%2B-products-3b82f6?style=for-the-badge)
&nbsp;
![Stores](https://img.shields.io/badge/6-stores-8b5cf6?style=for-the-badge)

---

![Java](https://img.shields.io/badge/Java_21-ED8B00?style=flat-square&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot_3.4-6DB33F?style=flat-square&logo=springboot&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL_16-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)
![Railway](https://img.shields.io/badge/Railway-0B0D0E?style=flat-square&logo=railway&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)

</div>

---

## What It Does

Protein supplements in Serbia are sold across dozens of stores at wildly different prices for the same or equivalent products. Proteinoteka solves this by scraping all major stores weekly, extracting nutritional data (AI-assisted where unstructured), and computing a **Value Score** — a single number that tells you how much protein you get per RSD spent, adjusted for protein source quality, ingredient cleanliness, and brand reputation.

The result: users see ranked products instead of a raw price list, and the best deal is always at the top.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Scrapers                           │
│  Playwright (JS-rendered)    JSoup (static HTML)        │
│  Pansport · FitLab · …       Proteinbox · Ogistrashop…  │
└────────────────────┬────────────────────────────────────┘
                     │  raw product data
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Enrichment Pipeline                        │
│  1. NutritionParserService   regex extraction           │
│  2. AiNutritionService       Claude Haiku fallback      │
│  3. BrandNormalizerService   FuzzyWuzzy matching        │
│  4. ValueScoreEngine         5-factor weighted score    │
└────────────────────┬────────────────────────────────────┘
                     │  enriched products
                     ▼
┌─────────────────────────────────────────────────────────┐
│         PostgreSQL 16  (Flyway migrations)              │
│  products · price_history · brand_reputation            │
│  click_events · tracking_events · price_alerts          │
└────────────────────┬────────────────────────────────────┘
                     │  REST API
                     ▼
┌─────────────────────────────────────────────────────────┐
│           Spring Boot 3.4  /api/v1/*                    │
│  JPA Specifications · Caffeine cache · Admin token auth  │
└────────────────────┬────────────────────────────────────┘
                     │  JSON
                     ▼
┌─────────────────────────────────────────────────────────┐
│           Next.js 16  (App Router · React 19)           │
│  SSR home · Redux (wishlist · compare · cart)           │
│  Price alerts · Protein calculator · Admin panel        │
└─────────────────────────────────────────────────────────┘
```

---

## Value Score Algorithm

The core differentiator. Each product is scored 0–10 across five factors:

| Factor | Weight | What It Measures |
|--------|--------|-----------------|
| **Value for Money** | 40 % | RSD per gram of protein vs. category benchmark (sigmoid curve) |
| **Protein Purity** | 20 % | Protein % per 100 g |
| **Digestibility** | 15 % | Hydrolyzate > CFM Isolate > Isolate > Casein > Concentrate > Vegan |
| **Ingredient Quality** | 15 % | Sugar content, artificial sweeteners, additives |
| **Brand Reputation** | 10 % | Curated brand scores, fuzzy-matched to product name |

A **confidence penalty** (up to −16 %) is applied when nutritional data is incomplete, keeping uncertain products from ranking unfairly high. Products that exceed 50 RSD/g protein are excluded entirely.

```
final_score = (0.40 × value_for_money
             + 0.20 × protein_purity
             + 0.15 × digestibility
             + 0.15 × ingredient_quality
             + 0.10 × brand_score)
             × confidence_penalty
```

---

## Features

**Core**
- Live price comparison across **Pansport, Proteini.si, Proteinbox, SupplementShop, Ogistrashop, FitLab**
- Sorting by Value Score, protein per RSD, and price
- Filtering by store, brand, category, and price range
- URL-driven state — every search is shareable and bookmarkable

**User Features**
- **Price Alerts** — set a target price per product; receive an email when it drops
- **Wishlist** — persistent across devices via email sync
- **Compare** — side-by-side comparison of up to 4 products with full nutritional breakdown
- **Protein Calculator** — step-by-step wizard calculating daily protein targets by goal, weight, and training type

**Infrastructure**
- Scrapers scheduled weekly (Monday 03:00); Playwright for JS-rendered storefronts, JSoup for static HTML
- Claude Haiku fills in nutritional values when the store's page has unstructured text
- Full **price history** tracked on every scrape cycle
- Custom **analytics** — product views, compare clicks, buy clicks, and conversion funnel tracked in PostgreSQL without a third-party dependency
- Admin panel with 7-day activity charts, top products, alert subscriber metrics, and decision-engine insights

---

## Tech Stack

### Backend
| | |
|---|---|
| Runtime | Java 21 |
| Framework | Spring Boot 3.4.3 |
| Database | PostgreSQL 16 + Flyway migrations |
| ORM | Spring Data JPA · Hibernate |
| Scraping | Playwright (browser-rendered) · JSoup (static) |
| AI | Anthropic Claude Haiku — nutrition extraction |
| Brand matching | FuzzyWuzzy |
| Build | Maven |
| Deployment | Docker · Railway |

### Frontend
| | |
|---|---|
| Framework | Next.js 16.2 (App Router) |
| Language | TypeScript · React 19 |
| Styling | Tailwind CSS v4 · shadcn/ui |
| State | Redux Toolkit (wishlist · compare · cart) |
| Email | Resend |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites
- Java 21
- Node.js 20+
- Docker (for PostgreSQL)
- Maven (or use the included wrapper)

### 1 — Start the database

```bash
cd backend
docker-compose up -d
```

### 2 — Configure backend environment

Create `backend/src/main/resources/application-local.yml` or export environment variables:

```env
DATABASE_URL=jdbc:postgresql://localhost:5432/proteinoteka
DATABASE_USERNAME=your_db_username
DATABASE_PASSWORD=your_db_password
ANTHROPIC_API_KEY=your_key_here
ADMIN_TOKEN=your_admin_token
```

### 3 — Run the backend

```bash
cd backend
./mvnw spring-boot:run
# API available at http://localhost:8080
# Swagger UI at http://localhost:8080/swagger-ui.html
```

### 4 — Configure frontend environment

```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8080
RESEND_API_KEY=your_resend_key
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_password
ADMIN_TOKEN=your_admin_token
```

### 5 — Run the frontend

```bash
cd frontend
npm install
npm run dev
# App available at http://localhost:3000
```

---

## Project Structure

```
proteinoteka/
├── backend/                   Spring Boot application
│   ├── src/main/java/
│   │   └── com/proteinoteka/
│   │       ├── controller/    REST endpoints
│   │       ├── service/       Scrapers · enrichment · alerts
│   │       ├── model/         JPA entities
│   │       ├── repository/    Spring Data repositories
│   │       ├── analytics/     Value Score · decision rules
│   │       └── config/        Security · CORS · caching
│   └── src/main/resources/
│       └── db/migration/      Flyway migrations (V1–V10)
└── frontend/                  Next.js application
    ├── app/                   App Router pages & API routes
    ├── components/            UI components
    ├── store/                 Redux slices
    └── lib/                   Axios · analytics · auth
```

---

## API Reference

Base URL: `https://proteinoteka.rs/api/v1` (or `http://localhost:8080/api/v1` locally)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/products` | List products with filtering and pagination |
| `GET` | `/products/{id}` | Single product with price history |
| `GET` | `/products/{id}/buy` | Record click and redirect to store |
| `GET` | `/products/top` | Top products by Value Score |
| `POST` | `/api/track` | Internal analytics event |
| `POST` | `/alerts` | Create price alert |
| `DELETE` | `/alerts/{id}` | Remove price alert |

Full interactive docs available at `/swagger-ui.html` when running locally.

---

## Deployment

| Service | Platform | Notes |
|---------|----------|-------|
| Backend (Spring Boot) | Railway | Dockerfile in `backend/` |
| Frontend (Next.js) | Vercel | `output: standalone`; auto-deploys on push |
| Database (PostgreSQL) | Railway | Persistent volume |

Scraping runs on a Railway cron schedule (Monday 03:00 CET). Each store scraper is independently triggered and isolated so a single failure doesn't abort the cycle.

---

<div align="center">

Built for the Serbian fitness community · [proteinoteka.rs](https://proteinoteka.rs)

</div>
