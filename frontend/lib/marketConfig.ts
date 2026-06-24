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
