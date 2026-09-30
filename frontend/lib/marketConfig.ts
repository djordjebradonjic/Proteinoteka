export type Market = 'rs' | 'hr';

export const MARKET_CONFIG = {
  rs: {
    currency: 'RSD',
    locale: 'sr-RS',
    ogLocale: 'sr_RS',
    domain: 'proteinoteka.rs',
    lang: 'sr',
    gaId: 'G-JR077S64MV',
  },
  hr: {
    currency: 'EUR',
    locale: 'hr-HR',
    ogLocale: 'hr_HR',
    domain: 'proteinoteka.com.hr',
    lang: 'hr',
    gaId: 'G-YT56QM8MJW',
  },
} as const;

export const CURRENT_MARKET =
  (process.env.NEXT_PUBLIC_MARKET as Market) ?? 'rs';

// Creatine is live on RS only for now: the HR market has no creatine scraped yet. Turn it on for HR by setting
// NEXT_PUBLIC_CREATINE_HR=true (build-time, needs a redeploy) once the HR stores are scraped.
export const CREATINE_ENABLED =
  CURRENT_MARKET !== 'hr' || process.env.NEXT_PUBLIC_CREATINE_HR === 'true';
