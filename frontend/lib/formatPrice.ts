import { type Market, MARKET_CONFIG, CURRENT_MARKET } from './marketConfig';

export function formatPrice(
  numericPrice: number | null | undefined,
  market: Market = CURRENT_MARKET,
): string {
  if (numericPrice == null || numericPrice <= 0) return '—';
  const { currency, locale } = MARKET_CONFIG[market];
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'RSD' ? 0 : 2,
  }).format(numericPrice);
}
