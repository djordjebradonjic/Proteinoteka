import { MetadataRoute } from 'next';

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
          '/*?*sort=',
          '/*?*query=',
          '/*?*brand=',
          '/*?*store=',
          '/*?*minPrice=',
          '/*?*maxPrice=',
        ],
      },
    ],
    sitemap: 'https://proteinoteka.rs/sitemap.xml',
  };
}
