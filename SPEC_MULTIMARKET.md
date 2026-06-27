# Specifikacija: Proteinoteka Ekspanzija na Hrvatsku
## RS → RS + HR

**Datum:** Jun 2026  
**Status:** Finalna specifikacija  
**Odluka:** Samo Hrvatska. Slovenija se ne radi — premali market, prevelik overhead za solo developera.

---

## 1. Arhitektura

### Princip
Jedan GitHub repo, jedan Railway backend, jedna PostgreSQL baza, dva Vercel deployova.

```
GitHub repo (jedan)
│
├── Railway
│   ├── Spring Boot backend (jedan, oba tržišta)
│   └── PostgreSQL (jedna baza, market kolone)
│
└── Vercel (dva projekta, isti repo)
    ├── proteinoteka.rs     → NEXT_PUBLIC_MARKET=rs
    └── proteinoteka.com.hr → NEXT_PUBLIC_MARKET=hr
```

### Ključne odluke
- Svaki Vercel projekat je odvojen deployment sa svojim env vars
- Backend prima `?market=rs|hr` query param na svim endpoints
- Isti proizvod koji se prodaje u oba tržišta = odvojeni redovi u bazi
- `protein_per_currency` zamenjuje `protein_per_rsd`
- Affiliate URL se generiše runtime iz `affiliate_configs` tabele
- Infrastruktura je dizajnirana da prima treće tržište bez arhitekturalnih promena (samo novi scrapers + messages JSON)

---

## 2. Infrastruktura i troškovi

| Stavka | Plan | Mesečna cena |
|---|---|---|
| Railway (backend + baza) | Hobby | ~$13-18 |
| Vercel (2 projekta) | Hobby | $0 |
| proteinoteka.com.hr | — | ~$1/mes |
| **Ukupno** | | **~$14-19/mes** |

**Registracija domena:** `proteinoteka.com.hr` — dostupan bez ograničenja za fizička lica iz Srbije. Preporučeni registrar: proveri [tld-list.com/tld/com.hr](https://tld-list.com/tld/com.hr) za najjeftiniju opciju (~$7-15/god).

---

## 3. Baza podataka — promene

### 3.1 Migracija V39 — market podrška

```sql
-- Stores tabela
ALTER TABLE stores ADD COLUMN market VARCHAR(2) NOT NULL DEFAULT 'rs';
ALTER TABLE stores ADD COLUMN currency VARCHAR(3) NOT NULL DEFAULT 'RSD';

-- Products tabela
ALTER TABLE products ADD COLUMN market VARCHAR(2) NOT NULL DEFAULT 'rs';
ALTER TABLE products ADD COLUMN currency VARCHAR(3) NOT NULL DEFAULT 'RSD';
ALTER TABLE products ADD COLUMN protein_per_currency DOUBLE PRECISION;

-- Popuni postojeće podatke
UPDATE stores SET market = 'rs', currency = 'RSD';
UPDATE products SET market = 'rs', currency = 'RSD',
  protein_per_currency = protein_per_rsd;
```

### 3.2 Migracija V40 — affiliate configs

```sql
CREATE TABLE affiliate_configs (
    id BIGSERIAL PRIMARY KEY,
    store_id BIGINT REFERENCES stores(id),
    market VARCHAR(2) NOT NULL,
    network VARCHAR(50),           -- 'dognet', 'awin', 'direct'
    tracking_url_template TEXT,    -- URL template sa {DEEPLINK} placeholder
    affiliate_id VARCHAR(100),
    enabled BOOLEAN DEFAULT FALSE, -- false dok se ne registruje affiliate
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 3.3 Migracija V41 — HR storovi

```sql
INSERT INTO stores (name, base_url, market, currency) VALUES
    ('GymBeam HR', 'https://gymbeam.hr', 'hr', 'EUR'),
    ('MyProtein HR', 'https://www.myprotein.hr', 'hr', 'EUR'),
    ('Polleo Sport', 'https://polleosport.hr', 'hr', 'EUR'),
    ('Proteka', 'https://www.proteka.hr', 'hr', 'EUR'),
    ('Nutrition Shop HR', 'https://nutrition-shop.hr', 'hr', 'EUR');
```

---

## 4. Backend — promene

### 4.1 API — market filter

`GET /api/v1/products?market=hr&name=whey&brand=gymbeam&page=0&size=12`

Svi postojeći query params ostaju, dodaje se `market` (default `rs` ako nije prosleđen).

**ProductSpecifications.java** — dodati:
```java
if (market != null) {
    spec = spec.and((root, query, cb) ->
        cb.equal(root.get("market"), market));
}
```

**ProductDTO** — dodati `market`, `currency` polja.

### 4.2 Scrapers — Hrvatska

| Scraper | Osnov | Effort | Napomena |
|---|---|---|---|
| `GymBeamHrScraper` | Kopija `GymBeamScraper` | Nizak | Isti GraphQL endpoint, promena base URL + market/currency |
| `MyProteinHrScraper` | Kopija `MyProteinScraper` | Nizak | Isti JSON API, promena URL + locale |
| `PolleoSportScraper` | Nov — WooCommerce | Srednji | HTML scraping, paginacija `/proteini/page/N/` |
| `ProtekaHrScraper` | Nov — nepoznat platform | Srednji-visok | Inspekcija pre implementacije, skip ako preskompleksno |
| `NutritionShopHrScraper` | Nov | Srednji | Mali shop, inspekcija pre implementacije |

**Za GymBeam i MyProtein** — jedina promena u scraper klasi:
```java
@Override
public String getBaseUrl() { return "https://gymbeam.hr"; }

@Override
public String getMarket() { return "hr"; }

@Override
public String getCurrency() { return "EUR"; }
```

### 4.3 StoreScraper interfejs — proširiti

```java
public interface StoreScraper {
    String getStoreName();
    String getBaseUrl();
    String getMarket();      // novo
    String getCurrency();    // novo
    List<Product> scrape();
    boolean hasNextPage();
}
```

Postojeći RS scrapers implementiraju `getMarket()` → `"rs"` i `getCurrency()` → `"RSD"`.

### 4.4 ScrapingScheduler — proširiti

Trenutni 7-dnevni ciklus za RS ostaje nepromenjen. Dodati HR blokove:
- Dani 1-3: GymBeam HR + MyProtein HR (lagani, HTTP/GraphQL)
- Dani 4-5: Polleo Sport + Proteka (Playwright ako treba)
- Dani 6-7: NutritionShop HR + rezerva

### 4.5 NutritionParserService i AiNutritionService

Nema promena — nutritivni podaci su isti bez obzira na tržište.

### 4.6 AiDescriptionService — market-aware

```java
String language = market.equals("hr") ? "Croatian" : "Serbian";

String prompt = String.format(
    "Write a product description in %s for: %s...", language, productName
);
```

### 4.7 Affiliate sistem

**AffiliateService.java** — nova klasa:

```java
public String buildAffiliateUrl(String originalUrl, Long storeId, String market) {
    AffiliateConfig config = affiliateConfigRepo
        .findByStoreIdAndMarketAndEnabled(storeId, market, true)
        .orElse(null);

    if (config == null) return originalUrl; // fallback, nema affiliate

    return config.getTrackingUrlTemplate()
        .replace("{DEEPLINK}", URLEncoder.encode(originalUrl, UTF_8));
}
```

**ProductDTO** — dodati `affiliateUrl` polje koje API vraća umesto `url` kada je affiliate aktivan.

**Affiliate mreže za HR:**

| Prodavnica | Mreža | Komisija |
|---|---|---|
| GymBeam HR | Dognet | 5-8% |
| MyProtein HR | AWIN (EU program) | 7-8% |
| Polleo Sport | Direktno ili CJ | TBD |

`affiliate_configs.enabled = false` za sve dok se ne registruješ. Sistem je spreman, pali se po koloni.

### 4.8 CORS — dodati HR domen

**CorsConfig.java:**
```java
"https://proteinoteka.com.hr",
"https://www.proteinoteka.com.hr"
```

---

## 5. Frontend — promene

### 5.1 MarketConfig — centralni config

`lib/marketConfig.ts`:
```typescript
export type Market = 'rs' | 'hr';

export const MARKET_CONFIG = {
  rs: {
    currency: 'RSD',
    locale: 'sr-RS',
    domain: 'proteinoteka.rs',
    lang: 'sr',
  },
  hr: {
    currency: 'EUR',
    locale: 'hr-HR',
    domain: 'proteinoteka.com.hr',
    lang: 'hr',
  },
} as const;

export const CURRENT_MARKET =
  (process.env.NEXT_PUBLIC_MARKET as Market) ?? 'rs';
```

### 5.2 formatPrice — zamena hardkodovanog RSD

`lib/formatPrice.ts` — refaktor:
```typescript
export function formatPrice(amount: number, market: Market): string {
  const { currency, locale } = MARKET_CONFIG[market];
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'RSD' ? 0 : 2,
  }).format(amount);
}
```

**Komponente za refaktor** (sve imaju hardkodovan RSD ili de-DE):
- `PriceTag.tsx`
- `PricePerGramBadge.tsx`
- `FeaturedValueCard.tsx`
- `PriceFilter.tsx`
- `ProductCarousel.tsx`
- `PriceHistoryChart.tsx`

### 5.3 API pozivi — dodati market param

`lib/axios.ts` — dodati interceptor:
```typescript
instance.interceptors.request.use(config => {
  config.params = { ...config.params, market: CURRENT_MARKET };
  return config;
});
```

SSR fetch u `app/page.tsx` — dodati `&market=${CURRENT_MARKET}` na URL.

### 5.4 i18n — next-intl

**Instalacija:**
```bash
npm install next-intl
```

**Struktura fajlova:**
```
frontend/
└── messages/
    ├── sr.json   (srpski — postojeće labele)
    └── hr.json   (hrvatski)
```

**next-intl config** u `next.config.ts`:
```typescript
import createNextIntlPlugin from 'next-intl/plugin';
const withNextIntl = createNextIntlPlugin('./i18n/request.ts');
```

`i18n/request.ts`:
```typescript
const market = process.env.NEXT_PUBLIC_MARKET ?? 'rs';
const localeMap: Record<string, string> = { rs: 'sr', hr: 'hr' };
const locale = localeMap[market] ?? 'sr';
```

**Bez URL-based routing** (`/hr/`) — ne treba, svaki domen je odvojen deployment.

**Opseg messages JSON:**
```json
{
  "nav": { "home": "...", "brands": "...", "stores": "..." },
  "filters": { "price": "...", "brand": "...", "store": "..." },
  "product": { "addToCompare": "...", "pricePerGram": "..." },
  "footer": { "compare": "...", "howItWorks": "..." },
  "pages": {
    "howItWorks": { "title": "...", "content": "..." },
    "about": { "title": "...", "content": "..." },
    "faq": { "title": "...", "content": "..." },
    "contact": { "title": "..." }
  },
  "seo": {
    "homeTitle": "...",
    "homeDescription": "...",
    "homeKeywords": "..."
  }
}
```

### 5.5 SEO — market-specific metadata

```typescript
const t = await getTranslations('seo');

export const metadata: Metadata = {
  title: t('homeTitle'),
  description: t('homeDescription'),
  keywords: t('homeKeywords').split(','),
  alternates: {
    canonical: `https://${MARKET_CONFIG[CURRENT_MARKET].domain}`,
  },
};
```

**Hreflang tagovi** u `app/layout.tsx`:
```html
<link rel="alternate" hreflang="sr" href="https://proteinoteka.rs" />
<link rel="alternate" hreflang="hr" href="https://proteinoteka.com.hr" />
<link rel="alternate" hreflang="x-default" href="https://proteinoteka.rs" />
```

### 5.6 Statičke stranice — lokalizacija

Prevesti i prilagoditi HR prodavnicama:
- `/how-it-works`
- `/o-nama`
- `/faq`
- `/kontakt`

Pristup: `next-intl` za kratke stringove; duži sadržaj (how-it-works) kao blok u messages JSON-u.

### 5.7 Blog i vodiči — MDX po lokalu

```
frontend/
└── content/
    ├── sr/
    │   ├── najjeftiniji-whey-protein.mdx
    │   └── kreatin-vodic.mdx
    └── hr/
        ├── najjeftiniji-whey-protein-hrvatska.mdx
        └── kreatin-vodic-hrvatska.mdx
```

`app/blog/[slug]/page.tsx`:
```typescript
const post = await import(`@/content/${CURRENT_MARKET}/${slug}.mdx`);
```

**Napomena:** HR blog postovi nisu prevodi — novi content sa HR SEO keywords i HR prodavnicama.

### 5.8 GDPR — cookie consent

Hrvatska je EU — cookie consent je zakonski obavezan.

```bash
npm install react-cookie-consent
```

`components/CookieConsent.tsx`:
```typescript
if (CURRENT_MARKET === 'rs') return null; // RS nije EU, ne treba
```

**Privacy Policy stranica** — obavezna za HR:
- Koje podatke skupljamo (localStorage, nema account sistema)
- Lista cookies
- Kontakt za GDPR zahteve

### 5.9 Vercel env vars

| Var | proteinoteka.rs | proteinoteka.com.hr |
|---|---|---|
| `NEXT_PUBLIC_MARKET` | `rs` | `hr` |
| `NEXT_PUBLIC_API_URL` | Railway URL | Railway URL |
| `RESEND_API_KEY` | ✓ | ✓ |

---

## 6. Deployment

### 6.1 Vercel setup

1. Kreirati novi Vercel projekat iz istog GitHub repo-a (`proteinoteka-hr`)
2. Settings → Environment Variables → `NEXT_PUBLIC_MARKET=hr`
3. Settings → Domains → `proteinoteka.com.hr`
4. Push na `main` branch trigguje oba projekta automatski

### 6.2 Railway setup

Nema novih servisa. Samo:
- Dodati CORS domene
- Pokrenuti Flyway migracije V39, V40, V41

### 6.3 DNS setup

```
proteinoteka.com.hr → CNAME cname.vercel-dns.com
```

---

## 7. Plan implementacije

### Faza 0 — Priprema (3-5 dana)
- [ ] Kupiti domen `proteinoteka.com.hr`
- [ ] Flyway migracije V39, V40, V41
- [ ] Proširiti `StoreScraper` interfejs (`getMarket()`, `getCurrency()`)
- [ ] Existing RS scrapers — implementirati `getMarket()="rs"`, `getCurrency()="RSD"`
- [ ] `MarketConfig` + `formatPrice` refaktor u frontend-u
- [ ] CORS update

### Faza 1 — Backend HR (1-2 nedelje)
- [ ] `GymBeamHrScraper` — URL promena, testiranje
- [ ] `MyProteinHrScraper` — URL promena, testiranje
- [ ] `PolleoSportScraper` — novi WooCommerce scraper
- [ ] `ProtekaHrScraper` — inspekcija sajta, implementacija ili skip
- [ ] `NutritionShopHrScraper` — inspekcija sajta, implementacija ili skip
- [ ] `AiDescriptionService` — Croatian language inject
- [ ] Scheduler — dodati HR blokove
- [ ] API `?market=` filter — testiranje

### Faza 2 — Frontend HR (1-2 nedelje)
- [ ] Instalacija i konfiguracija `next-intl`
- [ ] `messages/sr.json` — izvući sve postojeće srpske stringove
- [ ] `messages/hr.json` — prevod na hrvatski
- [ ] SEO metadata lokalizacija
- [ ] Hreflang tagovi
- [ ] Statičke stranice prevod (how-it-works, o-nama, faq, kontakt)
- [ ] Cookie consent banner + Privacy policy (HR)
- [ ] Kreirati Vercel projekat `proteinoteka-hr`
- [ ] DNS setup

### Faza 3 — Blog HR (1 nedelja)
- [ ] MDX setup (`content/sr/`, `content/hr/`)
- [ ] Migracija postojećih SR blogova u `content/sr/`
- [ ] Minimalno 2-3 HR blog posta za launch

### Faza 4 — Affiliate (kada se registruješ)
- [ ] Registracija na Dognet (GymBeam HR)
- [ ] Registracija na AWIN (MyProtein EU)
- [ ] Popuniti `affiliate_configs` tabelu
- [ ] Set `enabled = true` po prodavnici
- [ ] Testirati affiliate URL generisanje i tracking

---

## 8. Rizici

| Rizik | Verovatnoća | Uticaj | Mitigacija |
|---|---|---|---|
| Proteka/NutritionShop imaju neočekivanu strukturu | Visoka | Srednji | Inspekcija pre implementacije; skip ako preskompleksno |
| GymBeam/MyProtein blokiraju HR scraping | Niska | Visok | Isti pattern kao RS koji radi godinama |
| Playwright memory spike sa duplo više scrapers | Srednja | Nizak | Staggered schedule; Railway Hobby limit je 48GB |
| next-intl kompatibilnost sa Next.js 16 | Niska | Visok | Proveriti verziju pre instalacije |
| HR blog content uzima više vremena od očekivanog | Visoka | Srednji | Launch bez bloga, dodaj postove posle |
| Affiliate tracking problemi (ITP, cookie blocking) | Srednja | Srednji | Server-side redirect za affiliate linkove |

---

## 9. Šta se NE radi

- Slovenija — defer, premali market
- Korisnički nalozi / price alerts po tržištu
- Kursna lista i konverzija RSD ↔ EUR
- CMS za prevode
- Odvojeni email po tržištu
- `.hr` domen (ostaje `.com.hr`)

---

## 10. Buduća ekspanzija (kada HR prohoda)

Infrastruktura je dizajnirana za lako dodavanje tržišta:
1. Dodati `'si'` u `MarketConfig` (frontend) — 5 minuta
2. Dodati `messages/sl.json` — prevod
3. Novi SI scrapers (GymBeam/MyProtein su URL promena)
4. Flyway migracija za SI storove
5. Novi Vercel projekat sa `NEXT_PUBLIC_MARKET=si`
