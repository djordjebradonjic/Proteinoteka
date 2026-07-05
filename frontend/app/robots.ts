import { MetadataRoute } from 'next';
import { CURRENT_MARKET, MARKET_CONFIG } from '@/lib/marketConfig';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: 'GPTBot',         allow: '/' },
      { userAgent: 'ChatGPT-User',   allow: '/' },
      { userAgent: 'PerplexityBot',  allow: '/' },
      { userAgent: 'ClaudeBot',      allow: '/' },
      { userAgent: 'Google-Extended', allow: '/' },
      { userAgent: 'CCBot',          disallow: '/' },
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/compare',
          '/odjava',
          '/_next/image',
          '/*?*sort=',
          '/*?*query=',
          '/*?*brand=',
          '/*?*store=',
          '/*?*minPrice=',
          '/*?*maxPrice=',
          '/*?*page=',
        ],
      },
    ],
    sitemap: `https://${MARKET_CONFIG[CURRENT_MARKET].domain}/sitemap.xml`,
  };
}
